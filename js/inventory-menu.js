"use strict";
let inventoryFilters=false;
function renderInv(){
  if(inventoryFilters){renderInvFilters();const back=document.createElement('button');back.className='btn';back.textContent='‹ Về Vật phẩm';back.onclick=()=>{inventoryFilters=false;renderInv()};document.getElementById('t-inv').prepend(back);return}
  invDirty=false;const host=document.getElementById('t-inv'),items=S.inv.slice();
  const spare=S.inv.filter(i=>!lootMatch(i)&&!sellProtected(i)).length;
  host.innerHTML=`<div class="inventoryMenu"><div class="inventoryTools"><b>${S.inv.length}/${INV_MAX}</b></div><div class="inventorySlots">${items.map(it=>`<button class="inventorySlot" data-uid="${it.uid}" title="${esc(it.n)}"><img src="${esc(it.ic)}" alt="${esc(it.n)}"><i style="background:${SERIES_COL[it.s]||'#aaa'}"></i><small>${it.lvl}</small>${it.locked?'<span>🔒</span>':''}</button>`).join('')}${Array.from({length:Math.max(0,INV_MAX-items.length)},()=>'<div class="inventorySlot empty"></div>').join('')}</div><div class="inventoryMoney"><span>Ng.lượng</span><b data-gold-balance>${fmt(S.gold)} lượng</b><span>Kim Ng.Bảo</span><b data-knb-balance>${fmt(S.knb||0)}</b></div><div class="inventoryActions"><button class="btn" id="inventoryBest">⚔ Mặc đồ tốt</button><button class="btn" id="inventoryClean">🧹 Dọn kho</button><button class="btn" id="inventoryStash">📦 Kho chung</button><button class="btn" id="inventoryForge">🔨 Kho Rèn</button><button class="btn red" id="inventorySell">💰 Bán thừa ${spare}</button><button class="btn" id="inventoryFilter">⚙ Bộ lọc nhặt</button></div></div>`;
  host.querySelectorAll('[data-uid]').forEach(b=>b.onclick=()=>itemModal(findItem(b.dataset.uid)));
  document.getElementById('inventoryFilter').onclick=()=>{inventoryFilters=true;renderInv()};
  document.getElementById('inventoryStash').onclick=()=>stashModal();
  document.getElementById('inventoryForge').onclick=()=>htModal();
  document.getElementById('inventoryBest').onclick=()=>{const n=autoEquipAll(true);recalc();save();toast(n?`Đã thay ${n} món tốt hơn`:'Đồ đang mặc đã là tốt nhất');refresh()};
  const sell=()=>{const r=sellUnmatched();save();toast(`Đã bán ${r.n} món, giữ đồ bảo vệ và nâng cấp`);refresh()};
  document.getElementById('inventorySell').onclick=sell;
  document.getElementById('inventoryClean').onclick=()=>{S.inv.sort((a,b)=>b.r-a.r||b.lvl-a.lvl);save();renderInv();toast('Đã sắp xếp hành trang')};
}
