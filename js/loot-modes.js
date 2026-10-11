"use strict";
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
normalizeLootFilter=function(raw){const f=lootModesNormalize(raw);if(raw?.pickMode==='smart')f.pickMode='smart';return f;};
const lootModesMatch=lootMatch;
lootMatch=function(it){const mode=lootFilter().pickMode;if(mode==='all')return !!it&&modeItemOk(it,modeId());return mode==='smart'?smartLootMatch(it):lootModesMatch(it);};
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
const lootModesHTML=lootPolicyHTML;
lootPolicyHTML=function(){
  const mode=lootFilter().pickMode;
  return '<div class="btnrow"><button class="btn '+(mode==='smart'?'on':'')+'" data-loot-mode="smart">Thông minh</button><button class="btn '+(mode==='all'?'on':'')+'" data-loot-mode="all">Nhặt hết</button></div><p class="dim small">Thông minh: giữ đồ quý, ngựa và 2 món dự phòng tốt nhất mỗi ô. Nhặt hết: giữ mọi món; chỉ bán món cũ không được bảo vệ khi túi đầy và bật tự bán. Đồ khóa, nhặt tay và nâng cấp được giữ.</p>'+lootModesHTML()
    .replace('<option value="filter"','<option value="smart" '+(mode==='smart'?'selected':'')+'>Thông minh</option><option value="filter"')
    .replace('Tất cả trang bị</option>','Nhặt hết · bán khi đầy</option>')
    .replace('Tự bán đồ không khớp bộ lọc (giữ đồ bảo vệ)','Tự bán đồ thừa (Nhặt hết: chỉ khi túi đầy)')
    .replace(/Tất cả trang bị: nhặt cả đồ không khớp;[^<]+/, 'Theo bộ lọc / Ưu tiên nâng cấp: dùng các tiêu chí bên dưới. Chỉnh tiêu chí chuyển sang Theo bộ lọc. Tự mặc hoạt động riêng, giữ đồ đang khóa.');
};
const lootModesBind=bindLootPolicy;
bindLootPolicy=function(upd){lootModesBind(upd);document.querySelectorAll('[data-loot-mode]').forEach(b=>b.onclick=()=>{lootFilter().pickMode=b.dataset.lootMode;invDirty=true;save();upd();});};
