// ===== State =====
const KEY = "cah_state_v1";
const today = () => new Date().toISOString().slice(0, 10);
const defaults = () => ({
  users: [{ email: "admin@demo.vn", pass: "admin123", name: "Quản trị", role: "admin", approved: true }],
  session: null,
  rememberEmail: "",
  progress: {}, // email -> {done:[], subs:{}, coins, points, badges:[], codes:[], daily:{date,learn,spin}, pots:[], groupId}
  groups: [{ id: "g1", name: "Đội Tiên Phong", leader: "Minh Anh", members: ["Minh Anh", "Tuấn Kiệt", "Lan Chi"] }],
  projects: [{ title: "Shop nến thơm AI", desc: "Trang bán hàng tạo bằng Vibe Coding", url: "#", by: "Thảo Vy" }],
  reports: [],
  seasonEnd: Date.now() + 10 * 864e5,
});
let S;
try { S = Object.assign(defaults(), JSON.parse(localStorage.getItem(KEY) || "{}")); } catch { S = defaults(); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };
const me = () => S.users.find(u => u.email === S.session);
function P() {
  const e = S.session;
  if (!S.progress[e]) S.progress[e] = { done: [], subs: {}, coins: 10, points: 0, badges: [], codes: [], daily: {}, pots: Array(12).fill(null), groupId: null };
  const p = S.progress[e];
  if (p.daily.date !== today()) p.daily = { date: today(), learn: 0, spin: 0, unlocked: false };
  return p;
}
const dailyCode = () => "AI" + today().replace(/-/g, "").slice(2);
const rankOf = pts => [...RANKS].reverse().find(r => pts >= r.min);
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("show"); setTimeout(() => el.classList.remove("show"), 2200); }
function openModal(html) { $("#modal-body").innerHTML = html; $("#modal").classList.remove("hidden"); }
function closeModal() { $("#modal").classList.add("hidden"); }
function addPoints(n, coins = 0) { const p = P(); p.points += n; p.coins += coins; save(); }

// ===== Auth =====
let authMode = "login";
function renderAuth() {
  const reg = authMode === "register";
  $("#app").innerHTML = `<div class="auth"><div class="hero"><div>CREATOR<br>AI HUB<small>Go Global cùng nhân vật AI của bạn</small></div></div>
    <div class="auth-side"><h1 class="brand-title">CREATOR AI HUB</h1><p class="muted" style="margin:6px 0 0">Hệ thống Creator AI bán hàng – Lộ trình 60 ngày</p><div class="auth-card">
    <h2>${reg ? "Đăng ký" : "Đăng nhập"}</h2>
    ${reg ? "" : `<p class="muted" style="text-align:center;margin:0 0 14px">Nhanh nhất là dùng nút Google bên dưới.</p><button class="gbtn" onclick="toast('Đăng nhập Google sẽ có khi nối máy chủ – bản demo dùng email')">G&nbsp; Tiếp tục với Google</button><div class="or">hoặc</div><p class="muted">Đã có mật khẩu thì đăng nhập ở đây:</p>`}
    ${reg ? `<label>Tên hiển thị</label><input id="f-name">` : ""}
    <label>Email</label><input id="f-email" type="email" value="${esc(reg ? "" : S.rememberEmail)}">
    <label>Mật khẩu</label><input id="f-pass" type="password">
    ${reg ? "" : `<label class="muted"><input type="checkbox" id="f-rem" style="width:auto" ${S.rememberEmail ? "checked" : ""}> Nhớ email đăng nhập</label><br><br>`}
    <button class="btn" style="width:100%" onclick="${reg ? "doRegister()" : "doLogin()"}">${reg ? "Tạo tài khoản" : "Đăng nhập"}</button>
    <p class="muted" style="text-align:center">${reg ? `Đã có tài khoản? <a href="#" onclick="authMode='login';renderAuth()">Đăng nhập</a>` : `Chưa có tài khoản? <a href="#" onclick="authMode='register';renderAuth()">Đăng ký ngay</a>`}</p>
    <p class="muted">Tài khoản mới cần quản trị viên duyệt. Bản demo: dữ liệu lưu trên trình duyệt, đăng nhập admin bằng <b>admin@demo.vn / admin123</b> để duyệt.</p>
  </div></div></div>`;
}
function doRegister() {
  const name = $("#f-name").value.trim(), email = $("#f-email").value.trim().toLowerCase(), pass = $("#f-pass").value;
  if (!name || !email || pass.length < 6) return toast("Nhập đủ tên, email và mật khẩu ≥ 6 ký tự");
  if (S.users.some(u => u.email === email)) return toast("Email này đã được dùng");
  S.users.push({ email, pass, name, role: "member", approved: false, created: today() });
  save(); authMode = "login"; renderAuth(); toast("Đăng ký thành công – chờ admin duyệt");
}
function doLogin() {
  const email = $("#f-email").value.trim().toLowerCase(), pass = $("#f-pass").value;
  const u = S.users.find(x => x.email === email && x.pass === pass);
  if (!u) return toast("Sai email hoặc mật khẩu");
  S.rememberEmail = $("#f-rem")?.checked ? email : "";
  S.session = email; save(); route();
}
function logout() { S.session = null; save(); route(); }

// ===== Layout =====
const NAV = [
  ["home", "🏠 Tổng quan"], ["course", "📚 Lộ trình 60 ngày"], ["zoom", "🎥 Zoom theo mùa"],
  ["season", "🏆 Thi đua Mùa 4"], ["groups", "👥 Nhóm / Đội"], ["spin", "🎡 Báu Vật"],
  ["garden", "🌱 Vườn Mây"], ["ai", "🤖 Trợ lý AI"], ["connect", "🔌 Kết nối AI"],
  ["projects", "🚀 Dự án ra mắt"], ["guide", "📖 Cẩm nang"], ["profile", "👤 Hồ sơ"],
];
let view = "home";
function go(v) { view = v; $(".side")?.classList.remove("open"); renderApp(); }
function renderApp() {
  const u = me(), p = P();
  const nav = NAV.concat(u.role === "admin" ? [["admin", "🛠️ Quản trị"]] : []);
  $("#app").innerHTML = `<div class="layout">
    <aside class="side"><div class="logo">CREATOR AI HUB</div><div class="muted">${esc(u.name)} · ${rankOf(p.points).name}</div>
      <nav class="nav">${nav.map(([k, l]) => `<button class="${k === view ? "on" : ""}" onclick="go('${k}')">${l}</button>`).join("")}</nav>
      <div class="nav"><button onclick="whatsNew()">✨ Có gì mới</button><button onclick="bugReport()">🐞 Báo lỗi</button><button onclick="logout()">↩ Đăng xuất</button></div>
    </aside>
    <main><div class="top"><div><button class="btn ghost sm menu-btn" onclick="$('.side').classList.toggle('open')">☰</button>
      <b style="font-size:20px;margin-left:6px">${NAV.concat([["admin", "🛠️ Quản trị"]]).find(n => n[0] === view)[1]}</b></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><span class="pill">🪙 ${p.coins} xu</span><span class="pill">⚔️ ${p.points} lực chiến</span><span class="pill">📖 ${3 - p.daily.learn}/3 lượt học</span></div></div>
    <div id="view">${VIEWS[view]()}</div></main></div>`;
  VIEWS[view].after?.();
}

// ===== Views =====
const VIEWS = {};
VIEWS.home = () => {
  const p = P(), pct = Math.round(p.done.length / 60 * 100), next = LESSONS.find(l => !p.done.includes(l.day));
  const r = rankOf(p.points), nr = RANKS[RANKS.indexOf(r) + 1];
  return `<div class="grid">
    <div class="card"><h3>Tiến độ lộ trình</h3><div class="stat">${p.done.length}/60</div><div class="bar"><i style="width:${pct}%"></i></div></div>
    <div class="card"><h3>Cấp bậc Truyền Nhân</h3><div class="stat">${r.name}</div><p class="muted">${nr ? `Còn ${nr.min - p.points} điểm để lên ${nr.name}` : "Cấp cao nhất!"}</p></div>
    <div class="card"><h3>Mật lệnh hôm nay</h3><div class="stat">🔐 ${p.daily.unlocked ? "Đã mở" : "Chưa mở"}</div><p class="muted">Nhập mật lệnh để mở khoá học hôm nay.</p></div>
    <div class="card"><h3>Thi đua Mùa 4</h3><div class="stat" id="cd"></div><p class="muted">Đếm ngược kết thúc mùa</p></div>
  </div>
  ${next ? `<div class="card" style="margin-top:14px"><h3>Bài tiếp theo</h3><div class="lesson" onclick="openLesson(${next.day})"><div class="n">${next.day}</div><div><b>${esc(next.title)}</b><div class="muted">${esc(next.desc)}</div></div></div></div>` : ""}
  <div class="card" style="margin-top:14px"><h3>4 việc để được tính điểm</h3><p class="muted">✅ Học bài (+10) · 📝 Nộp bài tập (+20) · 🎡 Quay Báu Vật · 🌱 Thu hoạch Vườn Mây</p></div>`;
};
VIEWS.home.after = () => tickCountdown();
function tickCountdown() {
  const el = $("#cd"); if (!el) return;
  const ms = Math.max(0, S.seasonEnd - Date.now()), d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4);
  el.textContent = `${d}n ${h}g ${m}p`;
}
setInterval(tickCountdown, 30000);

VIEWS.course = () => {
  const p = P();
  return ["Nền tảng", "Tăng tốc", "Bứt phá"].map(ph => `<h3>${ph}</h3><div class="grid">${LESSONS.filter(l => l.phase === ph).map(l => {
    const done = p.done.includes(l.day), lock = l.day > 1 && !p.done.includes(l.day - 1) && !done;
    return `<div class="card lesson ${done ? "done" : ""} ${lock ? "lock" : ""}" onclick="${lock ? "toast('Hoàn thành bài trước để mở khoá')" : `openLesson(${l.day})`}">
      <div class="n">${done ? "✓" : lock ? "🔒" : l.day}</div><div><b>Ngày ${l.day}: ${esc(l.title)}</b><div class="muted">${esc(l.desc)}</div>${p.subs[l.day] ? '<span class="tag">Đã nộp bài</span>' : ""}</div></div>`;
  }).join("")}</div>`).join("");
};
function openLesson(day) {
  const p = P(), l = LESSONS[day - 1], done = p.done.includes(day);
  if (!p.daily.unlocked) return openModal(`<h2>🔐 Mật Lệnh Hôm Nay</h2><p class="muted">Nhập mật lệnh để mở lượt học. (Demo: mật lệnh hôm nay là <b>${dailyCode()}</b>)</p><input id="code"><button class="btn" onclick="unlock(${day})">Mở khoá</button>`);
  openModal(`<span class="tag">${l.phase}</span><h2>Ngày ${day}: ${esc(l.title)}</h2>
    <div style="aspect-ratio:16/9;background:var(--card2);border-radius:12px;display:grid;place-items:center" class="muted">▶ Video bài học sẽ được cập nhật</div>
    <h3>Nội dung chính</h3><p>${esc(l.desc)}. Xem video, ghi chú 3 ý quan trọng và áp dụng ngay vào nhân vật của bạn.</p>
    ${done ? `<p>✅ Bạn đã hoàn thành bài này.</p>` : `<button class="btn" ${p.daily.learn >= 3 ? "disabled" : ""} onclick="finishLesson(${day})">${p.daily.learn >= 3 ? "Đã hết 3 lượt học hôm nay" : "Hoàn tất bài học (+10)"}</button>`}
    <h3>Nộp bài tập</h3>${p.subs[day] ? `<p class="muted">Đã nộp: ${esc(p.subs[day])}</p>` : `<input id="sub" placeholder="Link ảnh / video bài làm"><button class="btn ghost" onclick="submitHw(${day})">Nộp bài (+20)</button>`}`);
}
function unlock(day) {
  if ($("#code").value.trim().toUpperCase() !== dailyCode()) return toast("Mật lệnh chưa đúng");
  P().daily.unlocked = true; save(); openLesson(day); renderApp();
}
function finishLesson(day) {
  const p = P(); if (p.daily.learn >= 3) return;
  p.done.push(day); p.daily.learn++; addPoints(10, 2); closeModal(); toast("Hoàn tất! +10 lực chiến, +2 xu"); renderApp();
}
function submitHw(day) {
  const v = $("#sub").value.trim(); if (!v) return toast("Dán link bài làm");
  P().subs[day] = v; addPoints(20, 3); openLesson(day); renderApp(); toast("Đã nộp bài tập");
}

VIEWS.zoom = () => `<div class="grid">${[1, 2, 3, 4].map(m => `<div class="card"><h3>Mùa ${m}</h3><p class="muted">${m === 4 ? "Đang diễn ra · 8 buổi" : "Đã kết thúc · Xem lại"}</p>
  ${Array.from({ length: 3 }, (_, i) => `<div class="lesson" style="margin:8px 0" onclick="zoomReview(${m},${i + 1})"><div class="n">🎥</div><div>Buổi ${i + 1}<div class="muted">Slide + video ghi lại</div></div></div>`).join("")}</div>`).join("")}</div>`;
function zoomReview(m, b) {
  openModal(`<h2>Zoom Mùa ${m} – Buổi ${b}</h2><div style="aspect-ratio:16/9;background:var(--card2);border-radius:12px;display:grid;place-items:center" class="muted">▶ Bản ghi Zoom · vuốt để xem slide</div>
  <h3>Đánh giá buổi học</h3><select id="star"><option>5 ⭐</option><option>4 ⭐</option><option>3 ⭐</option></select><textarea id="rv" placeholder="Cảm nhận của bạn"></textarea><button class="btn" onclick="closeModal();toast('Cảm ơn đánh giá của bạn!')">Gửi đánh giá</button>`);
}

function leaderboard() {
  const mine = { name: me().name, pts: P().points, you: true };
  const others = FAKE_USERS.map((n, i) => ({ name: n, pts: 520 - i * 47 }));
  return [...others, mine].sort((a, b) => b.pts - a.pts);
}
VIEWS.season = () => {
  const lb = leaderboard(), medal = ["🥇", "🥈", "🥉"];
  return `<div class="card"><h3>Mùa 4 – mọi người bắt đầu lại từ 0</h3><p class="muted">Xếp hạng theo Lực chiến. Top 3 cuối mùa nhận thưởng: 500 / 300 / 150 xu + huy hiệu.</p></div><br>
  <div class="card"><table><tr><th>#</th><th>Thành viên</th><th>Cấp bậc</th><th>Lực chiến</th></tr>
  ${lb.map((u, i) => `<tr style="${u.you ? "background:var(--card2)" : ""}"><td>${medal[i] || i + 1}</td><td>${esc(u.name)}${u.you ? " (bạn)" : ""}</td><td>${rankOf(u.pts).name}</td><td><b>${u.pts}</b></td></tr>`).join("")}</table></div>`;
};

VIEWS.groups = () => {
  const p = P(), mine = S.groups.find(g => g.id === p.groupId), name = me().name;
  return `${mine ? `<div class="card"><h3>Nhóm của bạn: ${esc(mine.name)} · Đội cấp ${Math.min(10, mine.members.length)}</h3>
    <table>${mine.members.map(m => `<tr><td>${m === mine.leader ? "👑 " : ""}${esc(m)}</td><td>${m === name ? p.points : Math.floor(m.length * 23)} điểm</td>
    <td>${mine.leader === name && m !== name ? `<button class="btn ghost sm" onclick="transferLead('${esc(m)}')">Chuyển trưởng nhóm</button>` : ""}</td></tr>`).join("")}</table><br>
    ${mine.leader === name ? `<button class="btn ghost sm" onclick="disband()">Giải tán nhóm</button>` : `<button class="btn ghost sm" onclick="leaveGroup()">Rời nhóm</button>`}</div><br>` :
    `<div class="card"><h3>Tạo nhóm mới</h3><input id="gname" placeholder="Tên nhóm"><button class="btn" onclick="createGroup()">Tạo nhóm</button></div><br>`}
  <div class="card"><h3>Tìm nhóm</h3><input id="gq" placeholder="Gõ tên nhóm (không cần đúng hệt)" oninput="renderGroupList()"><div id="glist"></div></div>`;
};
VIEWS.groups.after = () => renderGroupList();
const norm = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();
function renderGroupList() {
  const q = norm($("#gq")?.value || ""), p = P();
  $("#glist").innerHTML = S.groups.filter(g => norm(g.name).includes(q)).map(g => `<div class="lesson" style="margin:8px 0"><div class="n">👥</div><div style="flex:1"><b>${esc(g.name)}</b><div class="muted">${g.members.length} thành viên · trưởng nhóm ${esc(g.leader)}</div></div>
    ${!p.groupId ? `<button class="btn sm" onclick="joinGroup('${g.id}')">Tham gia</button>` : ""}</div>`).join("") || `<p class="muted">Không tìm thấy nhóm.</p>`;
}
function createGroup() { const n = $("#gname").value.trim(); if (!n) return; const id = "g" + Date.now(); S.groups.push({ id, name: n, leader: me().name, members: [me().name] }); P().groupId = id; save(); renderApp(); }
function joinGroup(id) { const g = S.groups.find(x => x.id === id); g.members.push(me().name); P().groupId = id; save(); renderApp(); toast("Đã vào nhóm " + g.name); }
function leaveGroup() { const p = P(), g = S.groups.find(x => x.id === p.groupId); g.members = g.members.filter(m => m !== me().name); p.groupId = null; save(); renderApp(); }
function transferLead(m) { S.groups.find(x => x.id === P().groupId).leader = m; save(); renderApp(); toast("Đã chuyển quyền trưởng nhóm"); }
function disband() { if (!confirm("Giải tán nhóm?")) return; const id = P().groupId; S.groups = S.groups.filter(g => g.id !== id); Object.values(S.progress).forEach(x => { if (x.groupId === id) x.groupId = null; }); save(); renderApp(); }

VIEWS.spin = () => {
  const n = WHEEL.length, seg = 360 / n, p = P();
  const grad = WHEEL.map((w, i) => `${w.color} ${i * seg}deg ${(i + 1) * seg}deg`).join(",");
  const labels = WHEEL.map((w, i) => `<div style="position:absolute;left:50%;top:50%;transform:rotate(${i * seg + seg / 2}deg) translateY(-110px) translateX(-50%);font-size:12px;font-weight:700;transform-origin:0 0">${w.label}</div>`).join("");
  return `<div class="card" style="text-align:center"><h3>🎡 Vòng quay Báu Vật</h3><p class="muted">Miễn phí 1 lượt/ngày, sau đó 5 xu/lượt.</p>
    <div class="wheel-wrap"><div class="pointer"></div><div class="wheel" id="wheel" style="background:conic-gradient(${grad})">${labels}</div></div>
    <button class="btn" id="spinbtn" onclick="spin()">${p.daily.spin ? "Quay (5 xu)" : "Quay miễn phí"}</button></div><br>
    <div class="card"><h3>Kho báu của bạn</h3><p>Huy hiệu: ${p.badges.join(", ") || "<span class='muted'>chưa có</span>"}</p><p>Mã giảm giá: ${p.codes.map(c => `<span class="tag">${c.code} · HSD ${c.exp}</span>`).join(" ") || "<span class='muted'>chưa có</span>"}</p></div>`;
};
let spinDeg = 0;
function spin() {
  const p = P();
  if (p.daily.spin && p.coins < 5) return toast("Không đủ xu");
  if (p.daily.spin) p.coins -= 5;
  p.daily.spin++;
  const i = Math.floor(Math.random() * WHEEL.length), seg = 360 / WHEEL.length;
  spinDeg += 1800 + (360 - (spinDeg % 360)) + (360 - (i * seg + seg / 2));
  $("#wheel").style.transform = `rotate(${spinDeg}deg)`; $("#spinbtn").disabled = true;
  setTimeout(() => {
    const w = WHEEL[i];
    if (w.coins) p.coins += w.coins;
    if (w.badge && !p.badges.includes(w.badge)) p.badges.push(w.badge);
    if (w.code) p.codes.push({ code: w.code, exp: new Date(Date.now() + 30 * 864e5).toLocaleDateString("vi-VN") });
    p.points += 2; save(); toast("🎉 Bạn nhận: " + w.label); renderApp();
  }, 4100);
}

VIEWS.garden = () => {
  const p = P();
  return `<div class="card"><h3>🌱 Vườn Mây</h3><p class="muted">Bấm chậu trống để gieo hạt. Cây chín thì bấm để thu hoạch xu. Thỉnh thoảng có sâu 🐛 – bắt sâu để cây lớn tiếp, bón phân 💩 (1 xu) để lớn nhanh gấp đôi.</p>
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">${SEEDS.map(s => `<span class="pill">${s.icon} ${s.name}: ${s.grow}s → ${s.coins} xu</span>`).join("")}</div>
  <div class="pots" id="pots"></div></div>`;
};
VIEWS.garden.after = () => drawPots();
function potState(pot) {
  if (!pot) return { icon: "🪴", txt: "Trống" };
  const s = SEEDS.find(x => x.id === pot.seed), el = (Date.now() - pot.at) / 1000 * (pot.fert ? 2 : 1);
  if (pot.bug) return { icon: "🐛", txt: "Bắt sâu!" };
  if (el >= s.grow) return { icon: s.icon, txt: "Thu hoạch" };
  return { icon: "🌱", txt: Math.ceil((s.grow - el) / (pot.fert ? 2 : 1)) + "s" };
}
function drawPots() {
  const el = $("#pots"); if (!el) return; const p = P();
  p.pots.forEach(pot => { if (pot && !pot.bug && !pot.bugged && Math.random() < .02) { pot.bug = true; pot.bugged = true; pot.pausedAt = Date.now(); } });
  el.innerHTML = p.pots.map((pot, i) => { const st = potState(pot); return `<div class="pot" onclick="potClick(${i})" oncontextmenu="event.preventDefault();fertilize(${i})">${st.icon}<small>${st.txt}</small></div>`; }).join("") + `<p class="muted" style="grid-column:1/-1">Chuột phải / nhấn giữ chậu để bón phân.</p>`;
  save();
}
setInterval(() => view === "garden" && drawPots(), 1000);
function potClick(i) {
  const p = P(), pot = p.pots[i];
  if (!pot) return openModal(`<h3>Chọn hạt giống</h3>${SEEDS.map(s => `<button class="btn ghost" style="margin:4px" onclick="plant(${i},'${s.id}')">${s.icon} ${s.name}</button>`).join("")}`);
  if (pot.bug) { pot.bug = false; pot.at += Date.now() - pot.pausedAt; toast("🪤 Đã bắt sâu!"); return drawPots(); }
  if (potState(pot).txt === "Thu hoạch") { const s = SEEDS.find(x => x.id === pot.seed); p.pots[i] = null; addPoints(1, s.coins); toast(`+${s.coins} xu`); renderApp(); }
}
function plant(i, seed) { P().pots[i] = { seed, at: Date.now() }; save(); closeModal(); drawPots(); }
function fertilize(i) { const p = P(), pot = p.pots[i]; if (!pot || pot.fert) return; if (p.coins < 1) return toast("Không đủ xu"); p.coins--; const el = Date.now() - pot.at; pot.at = Date.now() - el / 2; pot.fert = true; save(); renderApp(); toast("Đã bón phân"); }

const AI_KB = [
  [/prompt|ra lệnh/, "Cấu trúc prompt hiệu quả:\n1. Vai trò: \"Bạn là chuyên gia...\"\n2. Bối cảnh: sản phẩm, khách hàng\n3. Yêu cầu cụ thể\n4. Định dạng đầu ra\nXem Ngày 3 trong lộ trình."],
  [/giọng|voice/, "Để tạo giọng nói cho nhân vật, hãy xem Ngày 4. Ghi âm 1–2 phút giọng mẫu sạch tiếng ồn rồi dùng công cụ nhân bản giọng."],
  [/xu|điểm|lực chiến/, "Kiếm điểm: học bài +10, nộp bài tập +20, quay Báu Vật +2, thu hoạch Vườn Mây +1. Xu dùng để quay thêm và bón phân."],
  [/ngách|ngành|bán gì/, "Gợi ý chọn ngách: chọn lĩnh vực bạn hiểu (mỹ phẩm, mẹ & bé, đồ gia dụng, khoá học), có biên lợi nhuận ≥30% và dễ quay nội dung ngắn."],
  [/web|app|vibe/, "Ngày 14 hướng dẫn Vibe Coding: mô tả trang bằng lời, để AI sinh code, rồi deploy lên Vercel."],
];
let chat = [{ a: 1, t: "Xin chào! Mình là trợ lý AI của Creator AI Hub. Hỏi mình về prompt, giọng nói, chọn ngách, cách tính điểm..." }];
VIEWS.ai = () => `<div class="card"><div class="chat" id="chat">${chat.map(m => `<div class="msg ${m.a ? "a" : "u"}">${esc(m.t)}</div>`).join("")}</div>
  <div style="display:flex;gap:8px"><input id="q" placeholder="Hỏi trợ lý..." onkeydown="event.key==='Enter'&&ask()" style="margin:0"><button class="btn" onclick="ask()">Gửi</button></div></div>`;
VIEWS.ai.after = () => { const c = $("#chat"); c.scrollTop = c.scrollHeight; };
function ask() {
  const q = $("#q").value.trim(); if (!q) return;
  const hit = AI_KB.find(([r]) => r.test(q.toLowerCase()));
  chat.push({ t: q }, { a: 1, t: hit ? hit[1] : "Câu hỏi hay! Bạn thử xem lại bài phù hợp trong Lộ trình 60 ngày, hoặc kết nối khoá học vào Claude/ChatGPT ở mục 🔌 Kết nối AI để hỏi sâu hơn." });
  renderApp();
}

VIEWS.connect = () => {
  const url = location.origin + "/course.json";
  return `<div class="card"><h3>Cắm khoá học vào Claude / ChatGPT</h3><p class="muted">Đưa toàn bộ nội dung lộ trình cho trợ lý AI của bạn để hỏi đáp theo đúng giáo trình.</p>
  <ol><li>Sao chép đường dẫn giáo trình bên dưới.</li><li>Trong Claude: Projects → Add content → dán link/nội dung. Trong ChatGPT: tạo GPT → Knowledge.</li><li>Hỏi: "Dựa theo giáo trình, hôm nay mình nên làm gì?"</li></ol>
  <input readonly value="${url}"><button class="btn" onclick="navigator.clipboard.writeText('${url}');toast('Đã sao chép')">Sao chép</button>
  <button class="btn ghost" onclick="downloadCourse()">Tải giáo trình (.json)</button></div>`;
};
function downloadCourse() { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(LESSONS, null, 2)], { type: "application/json" })); a.download = "course.json"; a.click(); }

VIEWS.projects = () => `<div class="card"><h3>Khoe dự án của bạn</h3><input id="pt" placeholder="Tiêu đề dự án"><textarea id="pd" placeholder="Mô tả"></textarea><input id="pu" placeholder="Link truy cập"><button class="btn" onclick="addProject()">Đăng dự án</button></div><br>
  <div class="grid">${S.projects.map(x => `<div class="card"><div style="font-size:34px">🚀</div><h3>${esc(x.title)}</h3><p class="muted">${esc(x.desc)}</p><p class="muted">bởi ${esc(x.by)}</p>${x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener">Xem dự án →</a>` : ""}</div>`).join("")}</div>`;
function addProject() { const t = $("#pt").value.trim(); if (!t) return; S.projects.unshift({ title: t, desc: $("#pd").value, url: $("#pu").value, by: me().name }); addPoints(15); renderApp(); toast("Đã đăng dự án +15"); }

VIEWS.guide = () => `<div class="grid">
  <div class="card"><h3>📌 Cách tính điểm</h3><p class="muted">Học bài +10 · Nộp bài +20 · Đăng dự án +15 · Quay +2 · Thu hoạch +1</p></div>
  <div class="card"><h3>🪙 Kiếm xu</h3><p class="muted">Học bài +2 xu · Nộp bài +3 xu · Vòng quay · Vườn Mây</p></div>
  <div class="card"><h3>🏅 Cấp bậc</h3><p class="muted">${RANKS.map(r => `${r.name}: ${r.min}+`).join("<br>")}</p></div>
  <div class="card"><h3>⏱ Giới hạn</h3><p class="muted">3 lượt học/ngày, cần mật lệnh mỗi ngày. 1 lượt quay miễn phí/ngày.</p></div>
  <div class="card"><h3>🏆 Thưởng thứ hạng</h3><p class="muted">Top 1: 500 xu · Top 2: 300 xu · Top 3: 150 xu</p></div></div>`;

VIEWS.profile = () => {
  const u = me(), p = P();
  return `<div class="card"><h3>${esc(u.name)}</h3><p class="muted">${esc(u.email)} · ${rankOf(p.points).name}</p>
  <label>Tên hiển thị</label><input id="pn" value="${esc(u.name)}"><button class="btn" onclick="me().name=$('#pn').value.trim()||me().name;save();renderApp();toast('Đã lưu')">Lưu</button></div><br>
  <div class="grid"><div class="card"><h3>Bài đã học</h3><div class="stat">${p.done.length}</div></div><div class="card"><h3>Bài tập đã nộp</h3><div class="stat">${Object.keys(p.subs).length}</div></div>
  <div class="card"><h3>Huy hiệu</h3><div>${p.badges.join("<br>") || "<span class='muted'>chưa có</span>"}</div></div></div>`;
};

VIEWS.admin = () => {
  const pend = S.users.filter(u => !u.approved);
  return `<div class="card"><h3>Duyệt tài khoản (${pend.length})</h3><table>${pend.map(u => `<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td><button class="btn sm" onclick="approve('${u.email}',true)">Duyệt</button> <button class="btn ghost sm" onclick="approve('${u.email}',false)">Từ chối</button></td></tr>`).join("") || "<tr><td class='muted'>Không có tài khoản chờ duyệt</td></tr>"}</table></div><br>
  <div class="card"><h3>Thành viên (${S.users.length})</h3><table>${S.users.map(u => `<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${u.role}</td><td>${u.approved ? "✅" : "⏳"}</td></tr>`).join("")}</table></div><br>
  <div class="card"><h3>Báo lỗi</h3>${S.reports.map(r => `<p>• ${esc(r.text)} <span class="muted">— ${esc(r.by)}</span></p>`).join("") || "<p class='muted'>Chưa có</p>"}</div>`;
};
function approve(email, ok) { if (ok) S.users.find(u => u.email === email).approved = true; else S.users = S.users.filter(u => u.email !== email); save(); renderApp(); }

function whatsNew() { openModal(`<h2>✨ Có gì mới</h2>${WHATS_NEW.map(w => `<p>• ${w}</p>`).join("")}`); }
function bugReport() { openModal(`<h2>🐞 Báo lỗi</h2><textarea id="bug" rows="4" placeholder="Mô tả lỗi bạn gặp"></textarea><button class="btn" onclick="sendBug()">Gửi</button>`); }
function sendBug() { const t = $("#bug").value.trim(); if (!t) return; S.reports.push({ text: t, by: me().name }); save(); closeModal(); toast("Đã gửi báo lỗi cho admin"); }

// ===== Router =====
function route() {
  const u = me();
  if (!u) return renderAuth();
  if (!u.approved) {
    $("#app").innerHTML = `<div class="auth"><div class="auth-card"><div class="logo">CREATOR AI HUB</div><h2>⏳ Admin đang kiểm duyệt tài khoản</h2><p class="muted">Bạn sẽ vào được hệ thống sau khi được duyệt.</p><button class="btn" onclick="route()">Kiểm tra lại</button> <button class="btn ghost" onclick="logout()">Đăng xuất</button></div></div>`;
    return;
  }
  renderApp();
}
route();
