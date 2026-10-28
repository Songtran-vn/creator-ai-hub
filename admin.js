// Trang quản trị: chỉ tài khoản role = 'admin' trong bảng profiles mới vào được.
// Quyền thật sự do RLS trong supabase/schema.sql kiểm soát; trang này chỉ là giao diện.
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("show"); setTimeout(() => el.classList.remove("show"), 2400); }
function openModal(html) { $("#modal-body").innerHTML = html; $("#modal").classList.remove("hidden"); }
function closeModal() { $("#modal").classList.add("hidden"); }
const fmt = d => d ? new Date(d).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }) : "";
const STATUS = { pending: "Chờ duyệt", approved: "Đã duyệt", blocked: "Đã khoá" };

let sb, D = { users: [], progress: {}, projects: [], reports: [], groups: [], lessons: [], settings: {} }, tab = "overview", me = null;

function shell(body) {
  $("#app").innerHTML = `<header class="hdr"><div class="sq-logo">CA</div><div style="flex:1"><b style="font-size:18px">Quản trị Creator AI Hub</b><div class="muted">${esc(me?.email || "")}</div></div>
    <a class="btn ghost sm" href="/" style="text-decoration:none">← Về trang học</a>${me ? `<button class="btn ghost sm" onclick="logout()">Đăng xuất</button>` : ""}</header>${body}`;
}

if (!window.CLOUD) {
  shell(`<main><div class="wrap"><div class="card"><h2>Chưa kết nối database</h2>
    <p>Trang quản trị cần Supabase để lưu dữ liệu chung của mọi người dùng.</p>
    <ol><li>Tạo project trên <a href="https://supabase.com" target="_blank" rel="noopener">supabase.com</a>.</li>
    <li>SQL Editor → dán nội dung file <code>supabase/schema.sql</code> → Run.</li>
    <li>Project Settings → API → chép <b>Project URL</b> và <b>anon public key</b> vào <code>config.js</code>.</li>
    <li>Đẩy code lên GitHub, Vercel tự cập nhật.</li></ol></div></div></main>`);
} else {
  sb = supabase.createClient(APP_CONFIG.supabaseUrl, APP_CONFIG.supabaseAnonKey);
  start();
}

async function start() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return loginView();
  const { data: prof } = await sb.from("profiles").select("*").eq("id", session.user.id).single();
  me = prof || { email: session.user.email };
  if (prof?.role !== "admin") return shell(`<main><div class="wrap"><div class="card"><h2>⛔ Không có quyền quản trị</h2><p class="muted">Tài khoản ${esc(session.user.email)} không phải admin.</p></div></div></main>`);
  await loadAll();
  render();
}

function loginView() {
  shell(`<main><div class="wrap" style="max-width:380px"><div class="card"><h2 style="text-align:center">Đăng nhập quản trị</h2>
    <button class="gbtn" onclick="sb.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.href}})">G&nbsp; Tiếp tục với Google</button><div class="or">hoặc</div>
    <label>Email</label><input id="ae" type="email"><label>Mật khẩu</label><input id="ap" type="password">
    <button class="btn" style="width:100%" onclick="adminLogin()">Đăng nhập</button></div></div></main>`);
}
async function adminLogin() {
  const { error } = await sb.auth.signInWithPassword({ email: $("#ae").value.trim(), password: $("#ap").value });
  if (error) return toast("Sai email hoặc mật khẩu");
  start();
}
async function logout() { await sb.auth.signOut(); location.reload(); }

async function loadAll() {
  const [u, g, pr, rp, gr, ls, st] = await Promise.all([
    sb.from("profiles").select("*").order("created_at", { ascending: false }),
    sb.from("progress").select("*"),
    sb.from("projects").select("*").order("created_at", { ascending: false }),
    sb.from("reports").select("*").order("created_at", { ascending: false }),
    sb.from("groups").select("*").order("created_at"),
    sb.from("lessons").select("*").order("day"),
    sb.from("settings").select("*"),
  ]);
  const err = [u, g, pr, rp, gr, ls, st].find(r => r.error);
  if (err) toast("Lỗi tải dữ liệu: " + err.error.message);
  D.users = u.data || [];
  D.progress = Object.fromEntries((g.data || []).map(r => [r.user_id, r]));
  D.projects = pr.data || []; D.reports = rp.data || []; D.groups = gr.data || [];
  const saved = Object.fromEntries((ls.data || []).map(l => [l.day, l]));
  D.lessons = LESSONS.map(l => saved[l.day] || { day: l.day, title: l.title, description: l.desc, video_url: "", published: true });
  D.settings = Object.fromEntries((st.data || []).map(r => [r.key, r.value]));
}

const TABS = [["overview", "📊 Tổng quan"], ["members", "👥 Thành viên"], ["lessons", "📚 Bài học"], ["projects", "🚀 Dự án"], ["reports", "🐞 Báo lỗi"], ["groups", "🛡️ Nhóm"], ["settings", "⚙️ Cài đặt"]];
function render() {
  const pending = D.users.filter(u => u.status === "pending").length, open = D.reports.filter(r => r.status === "open").length;
  const badge = { members: pending, reports: open };
  shell(`<nav class="tabs">${TABS.map(([k, l]) => `<button class="tab ${k === tab ? "on" : ""}" onclick="tab='${k}';render()">${l}${badge[k] ? ` <span class="badge">${badge[k]}</span>` : ""}</button>`).join("")}
    <button class="tab" onclick="refresh()">🔄 Tải lại</button></nav><main><div class="wrap" style="max-width:1100px">${V[tab]()}</div></main>`);
}
async function refresh() { await loadAll(); render(); toast("Đã tải lại dữ liệu"); }
const prog = id => D.progress[id] || { points: 0, coins: 0, data: {} };

const V = {};
V.overview = () => {
  const c = s => D.users.filter(u => u.status === s).length;
  const lessonsDone = Object.values(D.progress).reduce((n, r) => n + (r.data?.done?.length || 0), 0);
  const subs = Object.values(D.progress).reduce((n, r) => n + Object.keys(r.data?.subs || {}).length, 0);
  const top = D.users.filter(u => u.status === "approved").sort((a, b) => prog(b.id).points - prog(a.id).points).slice(0, 5);
  const stat = (l, v, go) => `<div class="card" ${go ? `style="cursor:pointer" onclick="tab='${go}';render()"` : ""}><div class="muted">${l}</div><div class="stat">${v}</div></div>`;
  return `<div class="adm-grid">${stat("Tổng thành viên", D.users.length, "members")}${stat("Chờ duyệt", c("pending"), "members")}${stat("Đã duyệt", c("approved"))}${stat("Đã khoá", c("blocked"))}
    ${stat("Lượt hoàn thành bài", lessonsDone)}${stat("Bài tập đã nộp", subs)}${stat("Dự án", D.projects.length, "projects")}${stat("Báo lỗi chưa xử lý", D.reports.filter(r => r.status === "open").length, "reports")}</div>
  <div class="card"><h3>Top 5 lực chiến</h3><table>${top.map((u, i) => `<tr><td>${i + 1}</td><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td><b>${prog(u.id).points}</b></td></tr>`).join("") || "<tr><td class='muted'>Chưa có dữ liệu</td></tr>"}</table></div>
  ${c("pending") ? `<div class="card"><h3>Đang chờ duyệt</h3>${memberTable(D.users.filter(u => u.status === "pending"))}</div>` : ""}`;
};

let mq = "", mf = "";
V.members = () => {
  const q = mq.toLowerCase(), list = D.users.filter(u => (!mf || u.status === mf) && (!q || (u.name + u.email).toLowerCase().includes(q)));
  return `<div class="card"><div class="filters"><input placeholder="Tìm tên hoặc email" value="${esc(mq)}" oninput="mq=this.value;rerenderMembers()">
    <select onchange="mf=this.value;render()"><option value="">Tất cả trạng thái</option>${Object.entries(STATUS).map(([k, l]) => `<option value="${k}" ${mf === k ? "selected" : ""}>${l}</option>`).join("")}</select>
    <button class="btn ghost sm" onclick="exportCsv()">⬇ Xuất CSV</button></div><div id="mtable">${memberTable(list)}</div></div>`;
};
function rerenderMembers() { const q = mq.toLowerCase(); $("#mtable").innerHTML = memberTable(D.users.filter(u => (!mf || u.status === mf) && (!q || (u.name + u.email).toLowerCase().includes(q)))); }
function memberTable(list) {
  if (!list.length) return `<p class="muted">Không có thành viên nào.</p>`;
  return `<div class="tbl-wrap"><table><tr><th>Tên</th><th>Email</th><th>Trạng thái</th><th>Vai trò</th><th>Điểm</th><th>Xu</th><th>Bài học</th><th>Ngày tạo</th><th></th></tr>
  ${list.map(u => { const g = prog(u.id); return `<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td><span class="st ${u.status}">${STATUS[u.status]}</span></td>
    <td><select onchange="setRole('${u.id}',this.value)" ${u.id === me.id ? "disabled" : ""}><option value="member" ${u.role === "member" ? "selected" : ""}>Học viên</option><option value="admin" ${u.role === "admin" ? "selected" : ""}>Admin</option></select></td>
    <td>${g.points}</td><td>${g.coins}</td><td>${g.data?.done?.length || 0}/60</td><td class="muted">${fmt(u.created_at)}</td>
    <td><div class="row-actions">${u.status !== "approved" ? `<button class="btn sm" onclick="setStatus('${u.id}','approved')">Duyệt</button>` : ""}
      ${u.status !== "blocked" && u.id !== me.id ? `<button class="btn ghost sm" onclick="setStatus('${u.id}','blocked')">Khoá</button>` : ""}
      <button class="btn ghost sm" onclick="memberDetail('${u.id}')">Chi tiết</button></div></td></tr>`; }).join("")}</table></div>`;
}
async function setStatus(id, status) {
  const { error } = await sb.from("profiles").update({ status }).eq("id", id);
  if (error) return toast(error.message);
  D.users.find(u => u.id === id).status = status; render(); toast(status === "approved" ? "Đã duyệt" : "Đã khoá tài khoản");
}
async function setRole(id, role) {
  if (role === "admin" && !confirm("Cấp quyền admin cho người này? Họ sẽ xem và sửa được toàn bộ dữ liệu.")) return render();
  const { error } = await sb.from("profiles").update({ role }).eq("id", id);
  if (error) return toast(error.message);
  D.users.find(u => u.id === id).role = role; toast("Đã đổi vai trò");
}
function memberDetail(id) {
  const u = D.users.find(x => x.id === id), g = prog(id), d = g.data || {};
  openModal(`<h2>${esc(u.name)}</h2><p class="muted">${esc(u.email)} · ${STATUS[u.status]} · tạo ${fmt(u.created_at)}</p>
    <label>Tên hiển thị</label><input id="dn" value="${esc(u.name)}">
    <div style="display:flex;gap:10px"><div style="flex:1"><label>Lực chiến</label><input id="dp" type="number" value="${g.points}"></div><div style="flex:1"><label>Xu</label><input id="dc" type="number" value="${g.coins}"></div></div>
    <label>Ghi chú nội bộ</label><textarea id="dnote" rows="2">${esc(u.note)}</textarea>
    <button class="btn" onclick="saveMember('${id}')">Lưu thay đổi</button>
    <h3>Tiến độ</h3><p>Bài đã học: ${(d.done || []).sort((a, b) => a - b).join(", ") || "—"}</p>
    <p>Bài tập đã nộp:</p>${Object.entries(d.subs || {}).map(([day, link]) => `<div class="muted">Ngày ${day}: <a href="${esc(link)}" target="_blank" rel="noopener">${esc(link)}</a></div>`).join("") || "<div class='muted'>—</div>"}
    <p>Huy hiệu: ${(d.badges || []).join(", ") || "—"} · Mã giảm giá: ${(d.codes || []).map(c => c.code).join(", ") || "—"}</p>
    <h3>Vùng nguy hiểm</h3><div class="row-actions">
      <button class="btn ghost sm" onclick="resetProgress('${id}')">Xoá tiến độ học</button>
      ${u.status === "blocked" ? `<button class="btn ghost sm" onclick="closeModal();setStatus('${id}','approved')">Mở khoá</button>` : ""}
      ${u.id !== me.id ? `<button class="btn ghost sm" style="color:var(--bad)" onclick="deleteMember('${id}')">Xoá hồ sơ</button>` : ""}</div>`);
}
async function saveMember(id) {
  const u = D.users.find(x => x.id === id), g = prog(id);
  const points = +$("#dp").value || 0, coins = +$("#dc").value || 0, data = Object.assign({}, g.data, { points, coins });
  const [a, b] = await Promise.all([
    sb.from("profiles").update({ name: $("#dn").value.trim() || u.name, note: $("#dnote").value }).eq("id", id),
    sb.from("progress").upsert({ user_id: id, points, coins, data, updated_at: new Date().toISOString() }),
  ]);
  if (a.error || b.error) return toast((a.error || b.error).message);
  closeModal(); await refresh();
}
async function resetProgress(id) {
  if (!confirm("Xoá toàn bộ tiến độ, điểm và xu của người này? Không hoàn tác được.")) return;
  await sb.from("progress").upsert({ user_id: id, data: {}, points: 0, coins: 0 });
  closeModal(); await refresh();
}
async function deleteMember(id) {
  if (!confirm("Xoá hồ sơ người này? Họ sẽ mất toàn bộ dữ liệu. Tài khoản đăng nhập vẫn còn trong Supabase → Authentication, xoá ở đó nếu cần.")) return;
  const { error } = await sb.from("profiles").delete().eq("id", id);
  if (error) return toast(error.message);
  closeModal(); await refresh();
}
function exportCsv() {
  const rows = [["Tên", "Email", "Trạng thái", "Vai trò", "Lực chiến", "Xu", "Bài đã học", "Ngày tạo"]]
    .concat(D.users.map(u => { const g = prog(u.id); return [u.name, u.email, STATUS[u.status], u.role, g.points, g.coins, g.data?.done?.length || 0, fmt(u.created_at)]; }));
  const csv = "﻿" + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "thanh-vien.csv"; a.click();
}

V.lessons = () => `<div class="card"><p class="muted">Sửa tên, mô tả, link video YouTube và ẩn/hiện từng bài. Bấm "Lưu tất cả" để áp dụng cho mọi học viên.</p>
  <button class="btn" onclick="saveLessons()">💾 Lưu tất cả</button></div>
  <div class="card tbl-wrap"><table><tr><th>Ngày</th><th>Tên bài</th><th>Mô tả</th><th>Link video</th><th>Hiện</th></tr>
  ${D.lessons.map((l, i) => `<tr><td>${l.day}</td><td><input value="${esc(l.title)}" onchange="D.lessons[${i}].title=this.value"></td>
    <td><input value="${esc(l.description)}" onchange="D.lessons[${i}].description=this.value"></td>
    <td><input value="${esc(l.video_url)}" placeholder="https://youtu.be/..." onchange="D.lessons[${i}].video_url=this.value"></td>
    <td><input type="checkbox" style="width:auto" ${l.published ? "checked" : ""} onchange="D.lessons[${i}].published=this.checked"></td></tr>`).join("")}</table></div>`;
async function saveLessons() {
  const { error } = await sb.from("lessons").upsert(D.lessons.map(({ day, title, description, video_url, published }) => ({ day, title, description, video_url, published })));
  toast(error ? error.message : "Đã lưu 60 bài học");
}

V.projects = () => `<div class="card tbl-wrap"><table><tr><th>Dự án</th><th>Người đăng</th><th>Link</th><th>Ngày</th><th>Hiển thị</th><th></th></tr>
  ${D.projects.map(p => `<tr><td><b>${esc(p.title)}</b><div class="muted">${esc(p.description)}</div></td><td>${esc(p.by_name)}</td>
    <td>${p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener">Mở</a>` : ""}</td><td class="muted">${fmt(p.created_at)}</td>
    <td><input type="checkbox" style="width:auto" ${p.visible ? "checked" : ""} onchange="toggleProject('${p.id}',this.checked)"></td>
    <td><button class="btn ghost sm" onclick="delRow('projects','${p.id}')">Xoá</button></td></tr>`).join("") || "<tr><td class='muted'>Chưa có dự án</td></tr>"}</table></div>`;
async function toggleProject(id, visible) { const { error } = await sb.from("projects").update({ visible }).eq("id", id); toast(error ? error.message : visible ? "Đã hiện dự án" : "Đã ẩn dự án"); }
async function delRow(table, id) {
  if (!confirm("Xoá mục này? Không hoàn tác được.")) return;
  const { error } = await sb.from(table).delete().eq("id", id);
  if (error) return toast(error.message);
  await refresh();
}

V.reports = () => `<div class="card tbl-wrap"><table><tr><th>Nội dung</th><th>Người gửi</th><th>Ngày</th><th>Trạng thái</th><th></th></tr>
  ${D.reports.map(r => `<tr><td>${esc(r.text)}</td><td>${esc(r.by_name)}</td><td class="muted">${fmt(r.created_at)}</td>
    <td>${r.status === "open" ? `<span class="st pending">Chưa xử lý</span>` : `<span class="st approved">Đã xử lý</span>`}</td>
    <td><div class="row-actions">${r.status === "open" ? `<button class="btn sm" onclick="doneReport('${r.id}')">Đã xử lý</button>` : ""}<button class="btn ghost sm" onclick="delRow('reports','${r.id}')">Xoá</button></div></td></tr>`).join("") || "<tr><td class='muted'>Chưa có báo lỗi</td></tr>"}</table></div>`;
async function doneReport(id) { await sb.from("reports").update({ status: "done" }).eq("id", id); D.reports.find(r => r.id === id).status = "done"; render(); }

V.groups = () => `<div class="card tbl-wrap"><table><tr><th>Nhóm</th><th>Trưởng nhóm</th><th>Thành viên</th><th>Ngày tạo</th><th></th></tr>
  ${D.groups.map(g => `<tr><td><b>${esc(g.name)}</b></td><td>${esc(g.leader)}</td><td>${(g.members || []).map(esc).join(", ")}</td><td class="muted">${fmt(g.created_at)}</td>
    <td><button class="btn ghost sm" onclick="delRow('groups','${g.id}')">Giải tán</button></td></tr>`).join("") || "<tr><td class='muted'>Chưa có nhóm</td></tr>"}</table></div>`;

V.settings = () => {
  const s = D.settings, end = s.season_end ? new Date(s.season_end) : null;
  const local = end ? new Date(end - end.getTimezoneOffset() * 6e4).toISOString().slice(0, 16) : "";
  return `<div class="card"><h3>🔐 Mật lệnh hôm nay</h3><p class="muted">Học viên phải nhập đúng mật lệnh này mới mở được lượt học trong ngày. Đổi mỗi ngày (vd. đọc trong buổi Zoom).</p>
    <input id="sc" value="${esc(s.daily_code || "")}" placeholder="VD: AI2810"></div>
  <div class="card"><h3>✨ Có gì mới</h3><p class="muted">Mỗi dòng một tin.</p><textarea id="sw" rows="6">${esc((s.whats_new || WHATS_NEW).join("\n"))}</textarea></div>
  <div class="card"><h3>🏆 Kết thúc mùa thi đua</h3><input id="se" type="datetime-local" value="${local}"></div>
  <button class="btn" onclick="saveSettings()">💾 Lưu cài đặt</button>`;
};
async function saveSettings() {
  const rows = [
    { key: "daily_code", value: $("#sc").value.trim().toUpperCase() },
    { key: "whats_new", value: $("#sw").value.split("\n").map(x => x.trim()).filter(Boolean) },
  ];
  if ($("#se").value) rows.push({ key: "season_end", value: new Date($("#se").value).toISOString() });
  const { error } = await sb.from("settings").upsert(rows);
  if (error) return toast(error.message);
  rows.forEach(r => D.settings[r.key] = r.value); toast("Đã lưu cài đặt");
}
