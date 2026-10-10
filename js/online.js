"use strict";
/* Chơi online cho cả ba chế độ: đăng ký tài khoản, heartbeat đo giờ chơi, đồng bộ save lên Worker.
   Token lưu riêng theo slot (saveKey()+"_online"), không nằm trong S, nên xuất/nhập save không mang theo token. */
const ONL_HOST = "https://game.vltk.workers.dev";
const ONL_HB_MS = 60e3, ONL_SYNC_MS = 5 * 60e3, ONL_REG_MAX_LVL = 39;
// Chạy từ Worker thì gọi cùng origin; chạy cục bộ (file://, localhost, IP) thì gọi Worker đã deploy.
// window.JX_API ghi đè địa chỉ (dùng khi thử với wrangler dev).
function onlBase() {
  const h = location.hostname, local = !/^https?:$/.test(location.protocol) || h === "localhost" || h === "[::1]" || /^[\d.]+$/.test(h);
  return (window.JX_API || (local ? ONL_HOST : "")) + "/api";
}
const onlKey = () => (typeof saveKey === "function" ? saveKey() : "jx") + "_online";
function onlGet() { try { const v = JSON.parse(localStorage.getItem(onlKey()) || "null"); if(v&&v.token&&(!S.online||v.id===S.online.id))return v; } catch (e) {} if(typeof CLOUD!=="undefined"&&CLOUD.ready&&CLOUD.user&&S.online&&isMode(S.mode))return {id:S.online.id,name:S.online.name,cloud:true}; return null; }
function onlSet(v) { try { v ? localStorage.setItem(onlKey(), JSON.stringify(v)) : localStorage.removeItem(onlKey()) } catch (e) { } }
const onlEligible = () => typeof S !== "undefined" && S && S.fac && isMode(S.mode);
const ONL = { me: null, lastSync: 0, busy: false };

async function onlApi(path, opt = {}) {
  const acc = onlGet(), headers = {};
  if (opt.body !== undefined) headers["content-type"] = "application/json";
  if (opt.auth !== false && acc) {if(acc.cloud){headers["x-cloud-slot"]=String(SLOT);headers["x-cloud-device"]=cloudClientId;}else headers.authorization = "Bearer " + acc.token;}
  let r;
  try {
    r = await fetch(onlBase() + path, { method: opt.method || (opt.body !== undefined ? "POST" : "GET"), headers, body: opt.body !== undefined ? JSON.stringify(opt.body) : undefined, credentials:"same-origin", keepalive: !!opt.keepalive });
  } catch (e) { throw { code: "offline", msg: "Không kết nối được máy chủ online" } }
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw { code: d.error || "http_" + r.status, msg: d.msg || "Lỗi máy chủ (" + r.status + ")" };
  return d;
}

function onlTurnstile(sitekey) {
  return new Promise((res, rej) => {
    const box = document.createElement("div");
    box.id = "onlTs";
    document.body.appendChild(box);
    const done = (fn, v) => { box.remove(); fn(v) };
    const go = () => { try { window.turnstile.render(box, { sitekey, callback: t => done(res, t), "error-callback": () => done(rej, { code: "captcha", msg: "Xác minh chống bot lỗi" }) }) } catch (e) { done(rej, { code: "captcha", msg: "Không tải được xác minh chống bot" }) } };
    if (window.turnstile) return go();
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.onload = go;
    s.onerror = () => done(rej, { code: "captcha", msg: "Không tải được xác minh chống bot" });
    document.head.appendChild(s);
  });
}

async function onlRegister(name) {
  if (!onlEligible()) throw { code: "bad_mode", msg: "Chọn chế độ và tạo nhân vật trước khi đăng ký online" };
  if (S.lvl > ONL_REG_MAX_LVL) throw { code: "too_late", msg: `Chỉ đăng ký được khi nhân vật dưới cấp ${ONL_REG_MAX_LVL + 1}` };
  const cfg = await onlApi("/config", { auth: false });
  const turnstile = cfg.turnstile ? await onlTurnstile(cfg.turnstile) : "";
  const r = await onlApi("/register", { body: { name, save: pack(S), turnstile }, auth: false });
  onlSet({ id: r.id, name: r.name, token: r.token });
  S.online = { id: r.id, name: r.name };
  ONL.lastSync = Date.now();
  if (typeof save === "function") save();
  return r;
}

async function onlSync(quiet) {
  if (!onlEligible() || !onlGet() || ONL.busy || (typeof CLOUD!=="undefined"&&CLOUD.ready&&CLOUD.paused)) return null;
  ONL.busy = true;
  try {
    const r = await onlApi("/sync", { body: { save: pack(S) } });
    ONL.lastSync = Date.now();
    if (ONL.me && ONL.me.char) Object.assign(ONL.me.char, { power: r.power, bracket: r.bracket, flagged: r.flagged ? 1 : 0 });
    return r;
  } catch (e) {
    if (!quiet && typeof toast === "function") toast(e.msg || "Đồng bộ lỗi");
    if (e.code === "bad_token") onlSet(null);
    return null;
  } finally { ONL.busy = false }
}

async function onlRefreshMe() {
  if (!onlGet()) return null;
  try { ONL.me = await onlApi("/me") } catch (e) { if (e.code === "bad_token") onlSet(null) }
  return ONL.me;
}

// Heartbeat mỗi phút khi đã đăng ký; đồng bộ save mỗi 5 phút.
setInterval(() => {
  if (!onlEligible() || !onlGet()) return;
  onlApi("/hb", { method: "POST", keepalive: true }).then(d => { if (ONL.me) ONL.me.play_sec = d.play_sec }).catch(() => { });
  if (Date.now() - ONL.lastSync >= ONL_SYNC_MS) onlSync(true);
}, ONL_HB_MS);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden" && onlEligible() && onlGet() && Date.now() - ONL.lastSync > 60e3) onlSync(true) });

/* ---- Màn tạo nhân vật: ô đăng ký online nổi bật, bật khi chọn bất kỳ chế độ hợp lệ ---- */
const ONL_PICK_HTML = `<div class="onlpick" id="onlPick"><label><input type="checkbox" id="pfOnline" checked> <b>Đăng ký chơi Online</b><em>Đồng bộ nhân vật · đo giờ chơi online</em></label><small id="onlPickNote"></small></div>`;
function onlPickRefresh() {
  const box = document.getElementById("onlPick");
  if (!box) return;
  const selected = typeof PICK_MODE !== "undefined" && isMode(PICK_MODE), cb = document.getElementById("pfOnline");
  box.classList.toggle("off", !selected);
  if (cb) cb.disabled = !selected;
  const note = document.getElementById("onlPickNote");
  if (note) note.textContent = selected ? (PICK_MODE === "ctc" ? "Đăng ký để tham gia xếp hạng PvP Công Thành Chiến. Chỉ đăng ký được trước cấp 40." : "Đăng ký online cho chế độ " + MODES[PICK_MODE].n + ". Chỉ đăng ký được trước cấp 40.") : "Chọn chế độ chơi để đăng ký online.";
}
document.addEventListener("click", e => { if (e.target.closest && e.target.closest("#mPick")) setTimeout(onlPickRefresh, 0) }, true);
function onlWantsRegister() { const cb = document.getElementById("pfOnline"); return !!(cb && cb.checked && !cb.disabled) }
function onlAfterCreate(want) {
  if (!want || !onlEligible()) return;
  onlRegister(S.name).then(r => {
    toast(`Đã đăng ký chơi Online: ${r.name}`);
    log(`<span class="good">Đã đăng ký chơi Online với tên <b>${esc(r.name)}</b>. Giờ chơi bắt đầu được đo.</span>`);
  }).catch(e => {
    toast(e.msg || "Đăng ký online lỗi");
    log(`<span class="bad">Chưa đăng ký online được: ${esc(e.msg || e.code || "lỗi")}. Vào Hệ thống › Chơi Online để thử lại (trước cấp 40).</span>`);
  });
}

/* ---- Thẻ Hệ thống: trạng thái online ---- */
const fmtHours = s => (s / 3600).toFixed(1) + " giờ";
const ONL_BRACKET = { so: "Sơ cấp (40–79)", trung: "Trung cấp (80–99)", cao: "Cao cấp (100–119)", thuong: "Thượng thừa (120+)" };
function onlCardHTML() {
  if (!onlEligible()) return `<h3>Chơi Online</h3><div class="card"><small class="dim">Chọn hoặc tạo nhân vật để đăng ký online.</small></div>`;
  const acc = onlGet();
  if (acc) {
    const me = ONL.me, ago = ONL.lastSync ? Math.round((Date.now() - ONL.lastSync) / 60e3) + " phút trước" : "chưa";
    return `<h3>Chơi Online</h3><div class="card lootf onlcard"><div class="row">Tên online <b>${esc(acc.name)}</b></div>
      <div class="row">Giờ chơi đã đo <b>${me ? fmtHours(me.play_sec) : "…"}</b></div><div class="row">Đồng bộ gần nhất <span>${ago}</span></div>
      ${me && me.char ? `<div class="row">Bậc online <b>${ONL_BRACKET[me.char.bracket] || "Chưa đủ cấp 40"}</b></div><div class="row">Lực chiến (máy chủ tính) <b>${fmt(me.char.power || 0)}</b></div>` : ""}
      ${me && me.flags && me.flags.length ? `<div class="onlflag"><b>Tạm ngừng xếp hạng online; dữ liệu cần kiểm tra</b>${me.flags.map(f => `<small>${esc(f.detail || f.code)}</small>`).join("")}</div>` : ""}
      <div class="btnrow"><button class="btn" id="onlSyncBtn">Đồng bộ ngay</button><button class="btn" id="onlCodeBtn">Mã khôi phục</button><button class="btn" id="onlLadderBtn">Xếp hạng lực chiến</button><button class="btn" id="onlNoticeBtn">Thông báo kiểm định</button></div>
      <small class="dim" id="onlCode" hidden>Giữ kín mã này, nó thay cho mật khẩu: <code>${acc.cloud?"Đã liên kết tài khoản cloud; đăng nhập trên máy khác để khôi phục.":esc(acc.token)}</code></small></div>`;
  }
  if (S.lvl > ONL_REG_MAX_LVL) return `<h3>Chơi Online</h3><div class="card"><small class="dim">Nhân vật đã quá cấp ${ONL_REG_MAX_LVL}, không đăng ký bảng xếp hạng được. Có thể tiếp tục chơi và lưu bằng tài khoản cloud.</small></div>`;
  return `<h3>Chơi Online</h3><div class="card lootf onlcard"><div class="row">Tên online <input id="onlName" maxlength="16" value="${esc(S.name || "")}" style="flex:1"></div>
    <div class="btnrow"><button class="btn" id="onlRegBtn">Đăng ký chơi Online</button></div><small class="dim">Chỉ đăng ký được trước cấp 40.${S.mode === "ctc" ? " Có tên trên bảng xếp hạng PvP." : " Đồng bộ online cho chế độ " + esc(MODES[S.mode].n) + "."}</small></div>`;
}
function onlCardBind() {
  const b = id => document.getElementById(id);
  if (b("onlSyncBtn")) b("onlSyncBtn").onclick = async () => { if (await onlSync(false)) { toast("Đã đồng bộ"); await onlRefreshMe(); renderMore() } };
  if(b("onlLadderBtn"))b("onlLadderBtn").onclick=()=>onlLadderModal();
  if(b("onlNoticeBtn"))b("onlNoticeBtn").onclick=()=>onlNoticeModal();
  if (b("onlCodeBtn")) b("onlCodeBtn").onclick = () => { const c = b("onlCode"); if (c) c.hidden = !c.hidden };
  if (b("onlRegBtn")) b("onlRegBtn").onclick = async () => {
    const btn = b("onlRegBtn"); btn.disabled = true;
    try { const r = await onlRegister((b("onlName") || {}).value || S.name); toast(`Đã đăng ký chơi Online: ${r.name}`); await onlRefreshMe() } catch (e) { toast(e.msg || "Đăng ký lỗi") }
    btn.disabled = false; renderMore();
  };
}
if (typeof renderMore === "function") {
  const _renderMore = renderMore;
  renderMore = function () {
    _renderMore.apply(this, arguments);
    const t = document.getElementById("t-more");
    if (!t || !(typeof S !== "undefined" && S && S.fac)) return;
    t.insertAdjacentHTML("afterbegin", onlCardHTML());
    onlCardBind();
    if (onlGet() && !ONL.me) onlRefreshMe().then(me => { if (me && typeof curTab !== "undefined" && curTab === "more") renderMore() });
  };
}

// Danh sách chỉ tải khi mở; không thêm vòng polling.
let onlListGeneration=0;
async function onlLadderModal(bracket){
 const mode=modeId(),b=bracket||ONL.me?.char?.bracket||'so',generation=++onlListGeneration;
 modal('<h3>Xếp hạng lực chiến · '+esc(MODES[mode].n)+'</h3><div class="dtabs">'+Object.entries(ONL_BRACKET).map(([k,n])=>'<button data-onl-bracket="'+k+'" class="'+(b===k?'on':'')+'">'+n+'</button>').join('')+'</div><p class="desc">Top 100 theo lực chiến · cùng chế độ và bậc cấp.</p><div id="onlList">Đang tải…</div>',()=>document.querySelectorAll('[data-onl-bracket]').forEach(button=>button.onclick=()=>onlLadderModal(button.dataset.onlBracket)));
 try{const data=await onlApi('/ladder?mode='+mode+'&b='+b),box=document.getElementById('onlList');if(!box||generation!==onlListGeneration)return;box.innerHTML=data.rows.length?'<div class="rankingTable"><table><thead><tr><th>Hạng</th><th>Nhân vật</th><th>Phái</th><th>Cấp</th><th>Lực chiến</th></tr></thead><tbody>'+data.rows.map(r=>'<tr><td>'+r.rank+'</td><td>'+esc(r.name)+'</td><td>'+esc(FAC[r.fac]?.n||r.fac)+'</td><td>'+r.lvl+'</td><td>'+fmt(r.power)+'</td></tr>').join('')+'</tbody></table></div>':'Chưa có nhân vật online đủ cấp ở bậc này.';}catch(e){const box=document.getElementById('onlList');if(box&&generation===onlListGeneration)box.textContent=e.msg||'Chưa tải được xếp hạng';}
}
async function onlNoticeModal(){
 const mode=modeId(),generation=++onlListGeneration;modal('<h3>Thông báo kiểm định · '+esc(MODES[mode].n)+'</h3><p class="desc">Nhân vật tạm ngừng xếp hạng online. Chi tiết tài khoản của bạn nằm trong Hệ thống → Chơi Online.</p><div id="onlList">Đang tải…</div>');
 try{const data=await onlApi('/notices?mode='+mode),box=document.getElementById('onlList');if(!box||generation!==onlListGeneration)return;box.innerHTML=data.rows.length?data.rows.map(r=>'<div class="card"><b>'+esc(r.name)+'</b> · cấp '+r.lvl+'<small class="dim">'+r.reasons.map(esc).join(' · ')+'</small></div>').join(''):'Không có thông báo kiểm định ở chế độ này.';}catch(e){const box=document.getElementById('onlList');if(box&&generation===onlListGeneration)box.textContent=e.msg||'Chưa tải được thông báo';}
}
