"use strict";
let lootSetCatalogCache=null,lootSetKeysCache=null,lootSetFaction='';
function lootSetCatalog(){
 if(lootSetCatalogCache)return lootSetCatalogCache;
 const groups=new Map();for(const kind of ['gold','platina'])for(const row of J.sets[kind]||[]){
  const key=kind+':'+row.grp;let g=groups.get(key);
  if(!g){g={key,kind,grp:row.grp,names:[],fac:(row.req.find(q=>q[0]===39)||[0,-1])[1]};groups.set(key,g);}g.names.push(row.n);
 }
 lootSetCatalogCache=Array.from(groups.values(),g=>{let words=g.names[0].split(/\s+/);for(const name of g.names){const other=name.split(/\s+/);let n=0;while(n<words.length&&words[n]===other[n])n++;words=words.slice(0,n);}const name=words.length?words.join(' '):g.names[0];return{key:g.key,kind:g.kind,grp:g.grp,fac:g.fac,name,label:(g.kind==='gold'?'Hoàng Kim':'Bạch Kim')+' · '+name+' · Bộ '+g.grp};});
 lootSetKeysCache=new Map(lootSetCatalogCache.map(g=>[g.key,g]));return lootSetCatalogCache;
}
function normalizeLootSets(raw){lootSetCatalog();return Array.isArray(raw)?[...new Set(raw.filter(k=>typeof k==='string'&&lootSetKeysCache.has(k)))].slice(0,64):[];}
function selectedLootSetMatch(it){const f=lootFilter();return !!it?.set&&f.sets?.includes(it.set.kind+':'+it.set.grp)&&modeItemOk(it,modeId());}
function lootSetFilterHTML(){
 const f=lootFilter(),chosen=normalizeLootSets(f.sets);lootSetFaction=lootSetFaction||S.fac;
 const fid=FAC[lootSetFaction]?.id,catalog=lootSetCatalog().filter(g=>(g.kind==='gold'?MC().hk:MC().platina)&&(lootSetFaction==='all'||g.fac===fid||g.fac===-1));
 return `<details class="loot-set-filter" ${f.pickMode==='sets'||chosen.length?'open':''}><summary>Nhặt theo bộ trang bị${chosen.length?' · đã chọn '+chosen.length+' bộ':''}</summary><div class="policy-grid"><label>Danh sách theo phái<select id="fSetFaction"><option value="all" ${lootSetFaction==='all'?'selected':''}>Tất cả môn phái</option>${Object.entries(FAC).map(([key,fac])=>`<option value="${key}" ${lootSetFaction===key?'selected':''}>${esc(fac.n)}</option>`).join('')}</select></label><label>Bộ muốn nhặt<select id="fSetChoice"><option value="">Chọn bộ trang bị…</option>${catalog.filter(g=>!chosen.includes(g.key)).map(g=>`<option value="${g.key}">${esc(g.label)}</option>`).join('')}</select></label></div><button class="btn sm" id="fSetAdd" ${chosen.length>=64?'disabled':''}>+ Thêm bộ muốn nhặt</button><div class="loot-set-chosen">${chosen.map(key=>{const g=lootSetKeysCache.get(key);return `<div><span>${esc(g.label)}</span><button class="btn sm" data-set-remove="${key}" aria-label="Bỏ ${esc(g.label)}">×</button></div>`;}).join('')||'<small>Chưa chọn bộ nào.</small>'}</div><p class="dim small">Thêm bộ sẽ bật “Theo bộ trang bị”: chỉ nhặt đúng bộ đã chọn, không dùng tiêu chí màu, cấp hay chỉ số bên dưới. Không chọn bộ nào thì không nhặt trang bị. Nguyên liệu và tiền vẫn theo cơ chế hiện tại. Đồ bộ trong túi vẫn được bảo vệ khỏi tự bán.</p></details>`;
}
function bindLootSets(upd){
 const fac=document.getElementById('fSetFaction'),add=document.getElementById('fSetAdd');if(!fac||!add)return;
 fac.onchange=()=>{lootSetFaction=fac.value;upd();};
 const apply=fn=>{const f=lootFilter();f.sets=normalizeLootSets(f.sets);fn(f);f.pickMode='sets';invDirty=true;save();upd();};
 add.onclick=()=>{const key=document.getElementById('fSetChoice').value;if(!lootSetKeysCache.has(key))return;apply(f=>{if(!f.sets.includes(key)&&f.sets.length<64)f.sets.push(key);});};
 document.querySelectorAll('[data-set-remove]').forEach(b=>b.onclick=()=>apply(f=>{f.sets=f.sets.filter(k=>k!==b.dataset.setRemove);}));
}
// Shared local pickup rules: presets do not silently sell newly collected items.
function smartLootMatch(it){
  if(!it||!modeItemOk(it,modeId()))return false;
  if(isKept(it)||it.d===10||it.r>=3)return true;
  const slot=DETAIL_SLOT[it.d];if(!slot||!reqOk(it))return false;
  if(slot==='weapon'&&!preferredWeaponItem(S,it))return false;
  if(bestEquipPlan(it).gain>.01)return true;
  // Keep two best spare items per equipment slot, including stable ties by UID.
  const power=itemPower(it);let better=0;
  for(const other of S.inv){
    if(other===it||DETAIL_SLOT[other.d]!==slot||isKept(other)||!reqOk(other))continue;
    if(slot==='weapon'&&!preferredWeaponItem(S,other))continue;
    const p=itemPower(other);
    if(p>power||p===power&&String(other.uid)<String(it.uid))if(++better>=2)return false;
  }
  return true;
}
const lootModesNormalize=normalizeLootFilter;
normalizeLootFilter=function(raw){const f=lootModesNormalize(raw);if(['smart','sets'].includes(raw?.pickMode))f.pickMode=raw.pickMode;f.sets=normalizeLootSets(raw?.sets);return f;};
const lootModesMatch=lootMatch;
lootMatch=function(it){const mode=lootFilter().pickMode;if(mode==='sets')return selectedLootSetMatch(it);if(mode==='all')return !!it&&modeItemOk(it,modeId());return mode==='smart'?smartLootMatch(it):lootModesMatch(it);};
const lootModesRoom=roomCandidate;
roomCandidate=function(it,force=false){
  if(lootFilter().pickMode!=='all')return lootModesRoom(it,force);
  if(S.autoJunk===false)return null;
  // New loot enters at the front; sell only the oldest eligible item when full.
  for(let i=S.inv.length-1;i>=0;i--)if(!sellProtected(S.inv[i]))return S.inv[i];
  return null;
};
const lootModesSweep=sweepJunk;
sweepJunk=function(){return lootFilter().pickMode==='all'?0:lootModesSweep();};
const lootModesCriteria=lootCriteriaChanged;
lootCriteriaChanged=function(){if(lootFilter().pickMode==='smart')lootFilter().pickMode='filter';lootModesCriteria();};
const lootModesPreset=lootPreset;
lootPreset=function(kind){lootModesPreset(kind);if(kind==='clear')lootFilter().sets=[];};
const lootModesHTML=lootPolicyHTML;
lootPolicyHTML=function(){
  const mode=lootFilter().pickMode;
  return '<div class="btnrow"><button class="btn '+(mode==='smart'?'on':'')+'" data-loot-mode="smart">Thông minh</button><button class="btn '+(mode==='all'?'on':'')+'" data-loot-mode="all">Nhặt hết</button></div><p class="dim small">Thông minh: giữ đồ quý, ngựa và 2 món dự phòng tốt nhất mỗi ô. Nhặt hết: giữ mọi món; chỉ bán món cũ không được bảo vệ khi túi đầy và bật tự bán. Đồ khóa, nhặt tay và nâng cấp được giữ.</p>'+lootSetFilterHTML()+lootModesHTML()
    .replace('<option value="filter"','<option value="smart" '+(mode==='smart'?'selected':'')+'>Thông minh</option><option value="filter"')
    .replace('<option value="upgrade"','<option value="sets" '+(mode==='sets'?'selected':'')+'>Theo bộ trang bị</option><option value="upgrade"')
    .replace('Tất cả trang bị</option>','Nhặt hết · bán khi đầy</option>')
    .replace('Tự bán đồ không khớp bộ lọc (giữ đồ bảo vệ)','Tự bán đồ thừa (Nhặt hết: chỉ khi túi đầy)')
    .replace(/Tất cả trang bị: nhặt cả đồ không khớp;[^<]+/, 'Theo bộ lọc / Ưu tiên nâng cấp: dùng các tiêu chí bên dưới. Chỉnh tiêu chí chuyển sang Theo bộ lọc. Tự mặc hoạt động riêng, giữ đồ đang khóa.');
};
const lootModesBind=bindLootPolicy;
bindLootPolicy=function(upd){lootModesBind(upd);bindLootSets(upd);document.querySelectorAll('[data-loot-mode]').forEach(b=>b.onclick=()=>{lootFilter().pickMode=b.dataset.lootMode;invDirty=true;save();upd();});};
