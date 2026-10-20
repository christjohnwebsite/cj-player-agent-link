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
  // Homepage: show the saved short description and make OPEN go straight to the active website.
  const portalCards = document.querySelectorAll("a[data-portal-kind]");
  if (portalCards.length) {
    portalCards.forEach(async card => {
      const kind = card.dataset.portalKind;
      const desc = card.querySelector(".portal-desc");
      const go = card.querySelector(".portal-go");
      const directory = kind === "player" ? "player.html" : "agent.html";
      const showFallback = text => { if (desc) desc.textContent = text; };
      if (!client) { showFallback("Website links are temporarily unavailable."); card.href = directory; return; }
      try {
        const { data, error } = await client.from("site_links")
          .select("url,description,created_at,icon_url").eq("kind", kind).eq("enabled", true)
          .order("created_at", { ascending: false }).limit(1);
        if (error) throw error;
        if (data && data.length) {
          const item = data[0];
          // Show the uploaded icon on the public homepage portal card too.
          const iconWrap = card.querySelector(".portal-icon");
          if (iconWrap && item.icon_url) {
            const img = document.createElement("img");
            img.className = "portal-custom-icon";
            img.src = item.icon_url;
            img.alt = kind === "player" ? "Player link logo" : "Agent link logo";
            img.loading = "lazy";
            img.onerror = () => { img.remove(); };
            iconWrap.replaceChildren(img);
          }
          showFallback(item.description || "Open the " + kind + " website");
          const url = safeUrl(item.url);
          if (url !== "#") {
            card.href = url;
            card.target = "_blank";
            card.rel = "noopener noreferrer";
            if (go) go.textContent = "OPEN ↗";
          } else {
            card.href = directory;
          }
        } else {
          showFallback("No active website yet");
          card.href = directory;
        }
      } catch (err) {
        console.error("Homepage portal load failed:", err);
        showFallback("Description unavailable — tap OPEN to view links");
        card.href = directory;
      }
    });
  }
  // Public homepage: render links categorized as OTHERS or NONE, such as Facebook and Telegram.
  const othersSection = byId("publicOthers");
  const othersGrid = byId("othersGrid");
  if (othersSection && othersGrid && client) {
    (async () => {
      try {
        const { data, error } = await client.from("site_links")
          .select("id,title,kind,url,description,enabled,icon_url,created_at")
          .in("kind", ["other", "none"]).eq("enabled", true).order("created_at", { ascending: false });
        if (error) throw error;
        if (!data || !data.length) return;
        othersSection.hidden = false;
        othersGrid.innerHTML = "";
        for (const item of data) {
          const card = document.createElement("article"); card.className = "link-card";
          const sym = document.createElement("div"); sym.className = "link-symbol";
          if (item.icon_url) { const img = document.createElement("img"); img.className = "link-custom-icon"; img.src = item.icon_url; img.alt = ""; img.loading = "lazy"; sym.append(img); }
          else sym.textContent = item.kind === "none" ? "◇" : "◎";
          const info = document.createElement("div"); info.className = "link-info";
          const title = document.createElement("h3"); title.textContent = item.title;
          const description = (item.description || "").trim();
          if (description) { const desc = document.createElement("p"); desc.textContent = description; info.append(title, desc); }
          const a = document.createElement("a"); a.className = "open-link"; a.href = safeUrl(item.url); a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = "OPEN";
          info.append(title, a); card.append(sym, info); othersGrid.append(card);
        }
      } catch (err) { console.error("Community links failed to load:", err); }
    })();
  }
  const grid = byId("linkGrid");
  if (!grid) return;
  async function loadLinks() {
    if (!client) { grid.innerHTML = '<div class="empty-state">Supabase is not configured yet. Admin: edit config.js, then follow README.md.</div>'; return; }
    const kind = grid.dataset.kind;
    grid.innerHTML = '<div class="loading">LOADING LINKS…</div>';
    const { data, error } = await client.from("site_links").select("id,title,kind,url,description,enabled,icon_url").eq("kind", kind).eq("enabled", true).order("created_at", { ascending: false });
    if (error) { grid.innerHTML = '<div class="empty-state">Could not load links. Check Supabase setup and schema.sql.</div>'; console.error(error); return; }
    if (!data || !data.length) { grid.innerHTML = '<div class="empty-state">WALA PAY LINKS — Please check again later.</div>'; return; }
    grid.innerHTML = "";
    for (const item of data) {
      const card = document.createElement("article"); card.className = "link-card";
      const sym = document.createElement("div"); sym.className = "link-symbol";
      if(item.icon_url){const img=document.createElement("img");img.className="link-custom-icon";img.src=item.icon_url;img.alt="";img.loading="lazy";sym.append(img);}else{sym.textContent = kind === "player" ? "◈" : "⬡";}
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