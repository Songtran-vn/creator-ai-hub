// Chế độ cloud: thay phần lưu trữ localStorage của app.js bằng Supabase.
// Chỉ chạy khi config.js có đủ supabaseUrl + supabaseAnonKey.
if (window.CLOUD) (() => {
  const sb = supabase.createClient(APP_CONFIG.supabaseUrl, APP_CONFIG.supabaseAnonKey);
  window.sb = sb;
  let uid = null, saveTimer = null, codeOk = null;

  async function loadAll() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { S.session = null; return; }
    uid = session.user.id;
    const { data: prof } = await sb.from("profiles").select("*").eq("id", uid).single();
    if (!prof) { S.session = null; return; }
    S.session = prof.email;
    S.users = [{ id: prof.id, email: prof.email, name: prof.name, role: prof.role, approved: prof.status === "approved", blocked: prof.status === "blocked" }];
    if (prof.status !== "approved") return;
    const [prog, groups, projects, lb, lessons, settings] = await Promise.all([
      sb.from("progress").select("*").eq("user_id", uid).single(),
      sb.from("groups").select("*").order("created_at"),
      sb.from("projects").select("*").eq("visible", true).order("created_at", { ascending: false }).limit(30),
      sb.rpc("get_leaderboard"),
      sb.from("lessons").select("*"),
      sb.from("settings").select("*"),
    ]);
    S.progress = { [prof.email]: Object.assign({ done: [], subs: {}, coins: 10, points: 0, badges: [], codes: [], daily: {}, pots: Array(12).fill(null), groupId: null }, prog.data?.data || {}) };
    S.groups = groups.data || [];
    S.projects = (projects.data || []).map(x => ({ id: x.id, title: x.title, desc: x.description, url: x.url, by: x.by_name }));
    S.lb = lb.data || [];
    (lessons.data || []).forEach(l => { const L = LESSONS[l.day - 1]; if (L) Object.assign(L, { title: l.title, desc: l.description, video: l.video_url, hidden: !l.published }); });
    const set = Object.fromEntries((settings.data || []).map(r => [r.key, r.value]));
    if (Array.isArray(set.whats_new)) WHATS_NEW.splice(0, WHATS_NEW.length, ...set.whats_new);
    if (set.season_end) S.seasonEnd = new Date(set.season_end).getTime();
  }

  // Lưu tiến độ của chính mình (gom lại 800ms để không gọi liên tục)
  window.save = () => {
    if (!uid || !S.progress[S.session]) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const p = S.progress[S.session];
      sb.from("progress").upsert({ user_id: uid, data: p, points: p.points, coins: p.coins, updated_at: new Date().toISOString() })
        .then(({ error }) => error && toast("Lỗi lưu dữ liệu: " + error.message));
    }, 800);
  };

  window.route = async () => {
    await loadAll();
    const u = me();
    if (u?.blocked) {
      $("#app").innerHTML = `<div class="auth"><div class="hero"></div><div class="auth-side"><div class="auth-card"><h2>⛔ Tài khoản đã bị khoá</h2><p class="muted">Liên hệ quản trị viên để được hỗ trợ.</p><button class="btn" onclick="logout()">Đăng xuất</button></div></div></div>`;
      return;
    }
    if (!u) return renderAuth();
    if (!u.approved) {
      $("#app").innerHTML = `<div class="auth"><div class="hero"></div><div class="auth-side"><div class="auth-card"><h2>⏳ Admin đang kiểm duyệt tài khoản</h2><p class="muted">Bạn sẽ vào được hệ thống sau khi được duyệt.</p><button class="btn" onclick="route()">Kiểm tra lại</button> <button class="btn ghost" onclick="logout()">Đăng xuất</button></div></div></div>`;
      return;
    }
    renderApp();
  };

  window.doLogin = async () => {
    const email = $("#f-email").value.trim().toLowerCase(), password = $("#f-pass").value;
    S.rememberEmail = $("#f-rem")?.checked ? email : "";
    try { localStorage.setItem("cah_remember", S.rememberEmail); } catch {}
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return toast(error.message.includes("confirm") ? "Hãy bấm link xác nhận trong email trước" : "Sai email hoặc mật khẩu");
    route();
  };
  window.doRegister = async () => {
    const name = $("#f-name").value.trim(), email = $("#f-email").value.trim().toLowerCase(), password = $("#f-pass").value;
    if (!name || !email || password.length < 6) return toast("Nhập đủ tên, email và mật khẩu ≥ 6 ký tự");
    const { data, error } = await sb.auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: location.origin } });
    if (error) return toast(error.message.includes("registered") ? "Email này đã được dùng" : error.message);
    if (data.session) return route();
    authMode = "login"; renderAuth(); toast("Đã đăng ký – hãy bấm link xác nhận trong email");
  };
  window.googleLogin = () => sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin } });
  window.logout = async () => { await sb.auth.signOut(); uid = null; S.session = null; renderAuth(); };

  window.leaderboard = () => S.lb.map(r => ({ name: r.name, pts: r.id === uid ? P().points : r.points, you: r.id === uid }))
    .concat(S.lb.some(r => r.id === uid) ? [] : [{ name: me().name, pts: P().points, you: true }])
    .sort((a, b) => b.pts - a.pts);

  window.unlock = async day => {
    const { data } = await sb.rpc("check_daily_code", { code: $("#code").value });
    if (!data) return toast("Mật lệnh chưa đúng");
    P().daily.unlocked = true; save(); openLesson(day); renderApp();
  };

  async function reloadGroups() { const { data } = await sb.from("groups").select("*").order("created_at"); S.groups = data || []; save(); renderApp(); }
  const mutateGroup = async (id, fn) => { const g = S.groups.find(x => x.id === id); fn(g); await sb.from("groups").update({ leader: g.leader, members: g.members }).eq("id", id); };
  window.createGroup = async () => {
    const n = $("#gname").value.trim(); if (!n) return;
    const { data, error } = await sb.from("groups").insert({ name: n, leader: me().name, members: [me().name] }).select().single();
    if (error) return toast(error.message);
    P().groupId = data.id; reloadGroups();
  };
  window.joinGroup = async id => { await mutateGroup(id, g => g.members.push(me().name)); P().groupId = id; reloadGroups(); };
  window.leaveGroup = async () => { const id = P().groupId; await mutateGroup(id, g => g.members = g.members.filter(m => m !== me().name)); P().groupId = null; reloadGroups(); };
  window.transferLead = async m => { await mutateGroup(P().groupId, g => g.leader = m); reloadGroups(); };
  window.disband = async () => { if (!confirm("Giải tán nhóm?")) return; await sb.from("groups").delete().eq("id", P().groupId); P().groupId = null; reloadGroups(); };

  window.addProject = async () => {
    const t = $("#pt").value.trim(); if (!t) return;
    const { error } = await sb.from("projects").insert({ user_id: uid, title: t, description: $("#pd").value, url: $("#pu").value, by_name: me().name });
    if (error) return toast(error.message);
    S.projects.unshift({ title: t, desc: $("#pd").value, url: $("#pu").value, by: me().name });
    addPoints(15); renderApp(); toast("Đã đăng dự án +15");
  };
  window.sendBug = async () => {
    const t = $("#bug").value.trim(); if (!t) return;
    await sb.from("reports").insert({ user_id: uid, by_name: me().name, text: t });
    closeModal(); toast("Đã gửi báo lỗi cho admin");
  };
  // Lưu tên hiển thị vào hồ sơ
  const baseProfile = VIEWS.profile;
  VIEWS.profile = () => baseProfile().replace(/onclick="me\(\)\.name=[^"]*"/, `onclick="saveName()"`);
  window.saveName = async () => {
    const n = $("#pn").value.trim(); if (!n) return;
    await sb.from("profiles").update({ name: n }).eq("id", uid);
    me().name = n; renderApp(); toast("Đã lưu");
  };
  VIEWS.admin = () => { location.href = "admin.html"; return ""; };

  try { S.rememberEmail = localStorage.getItem("cah_remember") || ""; } catch {}
  sb.auth.onAuthStateChange(ev => { if (ev === "SIGNED_IN" && !uid) route(); });
  route();
})();
