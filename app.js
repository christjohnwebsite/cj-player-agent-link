(() => {
  const cfg = window.CJ_CONFIG || {};
  const configured = cfg.SUPABASE_URL && !cfg.SUPABASE_URL.includes("YOUR_PROJECT_ID") &&
    cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_ANON_KEY.includes("YOUR_SUPABASE");
  const client = configured && window.supabase ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;
  window.CJ_SUPABASE = client;
  const byId = id => document.getElementById(id);
  document.querySelectorAll(".year").forEach(el => el.textContent = new Date().getFullYear());
  if (byId("year")) byId("year").textContent = new Date().getFullYear();
  const dlg = byId("adminDialog");
  const open = byId("adminOpen");
  if (open && dlg) open.addEventListener("click", () => dlg.showModal());
  if (byId("closeLogin") && dlg) byId("closeLogin").addEventListener("click", () => dlg.close());
  if (dlg) dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
  if (byId("loginForm")) byId("loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    const msg = byId("loginMessage");
    if (!client) { msg.textContent = "I-config una ang Supabase URL ug anon key sa config.js."; return; }
    msg.textContent = "Signing in…";
    const { data, error } = await client.auth.signInWithPassword({
      email: byId("loginEmail").value.trim(), password: byId("loginPassword").value
    });
    if (error) { msg.textContent = "Login failed: " + error.message; return; }
    if (!data.user || data.user.id !== cfg.ADMIN_USER_ID) {
      await client.auth.signOut();
      msg.textContent = "This account is not authorized as the website admin.";
      return;
    }
    window.location.href = "admin.html";
  });
  const grid = byId("linkGrid");
  if (!grid) return;
  async function loadLinks() {
    if (!client) { grid.innerHTML = '<div class="empty-state">Supabase is not configured yet. Admin: edit config.js, then follow README.md.</div>'; return; }
    const kind = grid.dataset.kind;
    grid.innerHTML = '<div class="loading">LOADING LINKS…</div>';
    const { data, error } = await client.from("site_links").select("id,title,kind,url,description,enabled").eq("kind", kind).eq("enabled", true).order("created_at", { ascending: false });
    if (error) { grid.innerHTML = '<div class="empty-state">Could not load links. Check Supabase setup and schema.sql.</div>'; console.error(error); return; }
    if (!data || !data.length) { grid.innerHTML = '<div class="empty-state">WALA PAY LINKS — Please check again later.</div>'; return; }
    grid.innerHTML = "";
    for (const item of data) {
      const card = document.createElement("article"); card.className = "link-card";
      const sym = document.createElement("div"); sym.className = "link-symbol"; sym.textContent = kind === "player" ? "◈" : "⬡";
      const info = document.createElement("div"); info.className = "link-info";
      const title = document.createElement("h3"); title.textContent = item.title;
      const desc = document.createElement("p"); desc.textContent = item.description || "Official website link.";
      const a = document.createElement("a"); a.className = "open-link"; a.href = safeUrl(item.url); a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = "OPEN WEBSITE ↗";
      info.append(title, desc, a); card.append(sym, info); grid.append(card);
    }
  }
  function safeUrl(value) { try { const u = new URL(value); return ["http:", "https:"].includes(u.protocol) ? u.href : "#"; } catch { return "#"; } }
  loadLinks();
})();