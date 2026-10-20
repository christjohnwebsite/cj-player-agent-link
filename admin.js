(() => {
  const client = window.CJ_SUPABASE;
  const $ = id => document.getElementById(id);
  const form = $("linkForm");
  let currentUser = null;
  const msg = (id, text, bad=false) => { const el=$(id); if(el){el.textContent=text;el.style.color=bad?"#ff91a8":"#67f4ff";} };
  function resetForm() {
    $("linkId").value=""; form.reset(); $("linkEnabled").checked=true;
    $("saveBtn").textContent="＋ SAVE LINK"; $("cancelEdit").hidden=true;
  }
  function safeUrl(value) { try { const u=new URL(value); return ["http:","https:"].includes(u.protocol) ? u.href : null; } catch { return null; } }
  async function init() {
    if (!client) { document.querySelector(".directory").insertAdjacentHTML("afterbegin",'<div class="empty-state">Supabase is not configured. Edit config.js and follow README.md.</div>'); return; }
    const {data,error}=await client.auth.getSession();
    if(error || !data.session) { window.location.href="index.html"; return; }
    currentUser=data.session.user;
    if (!currentUser || currentUser.id !== (window.CJ_CONFIG || {}).ADMIN_USER_ID) {
      await client.auth.signOut();
      window.location.href="index.html";
      return;
    }
    $("adminEmail").textContent=currentUser.email || "SIGNED IN";
    await loadAdminLinks();
  }
  async function loadAdminLinks() {
    $("adminLinks").innerHTML='<div class="loading">LOADING…</div>';
    const {data,error}=await client.from("site_links").select("*").order("created_at",{ascending:false});
    if(error){$("adminLinks").innerHTML='<div class="empty-state">Could not load links: '+escapeHtml(error.message)+'</div>';return;}
    if(!data.length){$("adminLinks").innerHTML='<div class="empty-state">No links yet. Use the form above to add one.</div>';return;}
    $("adminLinks").innerHTML="";
    data.forEach(item=>{
      const row=document.createElement("div");row.className="admin-row";
      const main=document.createElement("div");main.className="admin-row-main";
      const strong=document.createElement("strong");strong.textContent=item.title;
      const small=document.createElement("small");small.textContent=item.kind.toUpperCase()+" • "+item.url;
      const status=document.createElement("span");status.className="status"+(item.enabled?"":" off");status.textContent=item.enabled?"VISIBLE":"HIDDEN";
      main.append(strong,small,status);
      const actions=document.createElement("div");actions.className="admin-row-actions";
      const edit=button("EDIT","tiny-btn",()=>fillForm(item));
      const toggle=button(item.enabled?"HIDE":"SHOW","tiny-btn",()=>toggleLink(item));
      const del=button("DELETE","tiny-btn delete",()=>deleteLink(item));
      actions.append(edit,toggle,del);row.append(main,actions);$("adminLinks").append(row);
    });
  }
  function button(text,cls,fn){const b=document.createElement("button");b.type="button";b.className=cls;b.textContent=text;b.addEventListener("click",fn);return b;}
  function fillForm(item){$("linkId").value=item.id;$("linkTitle").value=item.title;$("linkKind").value=item.kind;$("linkUrl").value=item.url;$("linkDescription").value=item.description||"";$("linkEnabled").checked=!!item.enabled;$("saveBtn").textContent="SAVE CHANGES";$("cancelEdit").hidden=false;window.scrollTo({top:0,behavior:"smooth"});}
  async function toggleLink(item){const {error}=await client.from("site_links").update({enabled:!item.enabled,updated_at:new Date().toISOString()}).eq("id",item.id);if(error)alert("Update failed: "+error.message);else await loadAdminLinks();}
  async function deleteLink(item){if(!confirm('Delete "'+item.title+'"? This cannot be undone.'))return;const {error}=await client.from("site_links").delete().eq("id",item.id);if(error)alert("Delete failed: "+error.message);else{msg("formMessage","Link deleted.");await loadAdminLinks();}}
  form.addEventListener("submit",async e=>{
    e.preventDefault(); if(!client || !currentUser){msg("formMessage","Please sign in again.",true);return;}
    const title=$("linkTitle").value.trim(),url=safeUrl($("linkUrl").value.trim());
    if(!url){msg("formMessage","Enter a valid http:// or https:// URL.",true);return;}
    const payload={title,kind:$("linkKind").value,url,description:$("linkDescription").value.trim(),enabled:$("linkEnabled").checked,updated_at:new Date().toISOString()};
    if(!title){msg("formMessage","Title is required.",true);return;}
    $("saveBtn").disabled=true;msg("formMessage","Saving…");
    let result;
    if($("linkId").value) result=await client.from("site_links").update(payload).eq("id",$("linkId").value);
    else result=await client.from("site_links").insert(payload);
    $("saveBtn").disabled=false;
    if(result.error){msg("formMessage","Save failed: "+result.error.message,true);return;}
    msg("formMessage","Saved successfully.");resetForm();await loadAdminLinks();
  });
  $("cancelEdit").addEventListener("click",resetForm);
  $("refreshBtn").addEventListener("click",loadAdminLinks);
  $("logoutBtn").addEventListener("click",async()=>{await client.auth.signOut();window.location.href="index.html";});
  function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  init();
})();