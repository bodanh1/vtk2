"use strict";
const TIEN_THAO_COST=2,TIEN_THAO_MS=60*60*1000;
let treasureTab='medicine';
const TREASURE_TABS=[['mask','Mặt nạ'],['horse','Ngựa'],['medicine','Thuốc']];
function treasureTabsHTML(active){return '<div class="dtabs treasureTabs">'+TREASURE_TABS.map(([id,name])=>`<button data-treasure-tab="${id}" class="${active===id?'on':''}">${name}</button>`).join('')+'</div>';}
function bindTreasureTabs(){document.querySelectorAll('[data-treasure-tab]').forEach(b=>b.onclick=()=>treasureShopModal(b.dataset.treasureTab));}
function tienThaoLeft(){return Math.max(0,(S.tienThaoUntil||0)-Date.now());}
function tienThaoMul(){return tienThaoLeft()>0?2:1;}
function gainMonsterXp(x,mul=tienThaoMul()){gainXp(x*mul);}
function buyTienThaoLo(){
 if(!S?.fac)return;if((S.knb||0)<TIEN_THAO_COST){toast('Cần 2 Kim Nguyên Bảo để mua Tiên Thảo Lộ');return;}
 const until=Math.max(Date.now(),S.tienThaoUntil||0)+TIEN_THAO_MS;if(!Number.isSafeInteger(until)){toast('Không thể cộng thêm thời gian');return;}
 S.knb-=TIEN_THAO_COST;S.tienThaoUntil=until;save();updateTop();treasureShopModal('medicine');toast('Đã dùng Tiên Thảo Lộ: EXP đánh quái ×2, thêm 60 phút');
}
function buyLuckPotion(id){
 const p=LUCK_CONSUMABLES[id];if(!S?.fac||!p)return false;
 if(luckPotionLeft(id)>0){toast(p.name+' đang có hiệu lực');return false;}
 if(!Number.isSafeInteger(S.knb)||S.knb<p.cost){toast('Cần '+p.cost+' Kim Nguyên Bảo');return false;}
 const until=Date.now()+p.ms;if(!Number.isSafeInteger(until))return false;
 S.knb-=p.cost;S[p.key]=until;save();updateTop();treasureShopModal('medicine');toast('Đã dùng '+p.name+': May mắn +'+p.lucky+' trong '+p.ms/60000+' phút');return true;
}
function buyTreasureHorse(k){
 const g=(window.JHORSESHOP?.knbItems||[]).find(g=>g.k===k);if(!S?.fac||!g)return false;
 if(!Number.isSafeInteger(S.knb)||S.knb<g.knb){toast('Không đủ Kim Nguyên Bảo');return false;}
 if(S.inv.length>=INV_MAX){toast('Hành trang đầy');return false;}
 const it=makeItem(g.d,g.k,g.lvl,0);if(!it)return false;it.s=shopSeries(g,it);if(!addItem(it,true,true,true))return false;
 S.knb-=g.knb;save();updateTop();treasureShopModal('horse');toast('Đã mua '+it.n);return true;
}
function treasureMedicineHTML(){
 const ti=`<div class="card treasureProduct"><img src="img/i/tien-thao-lo.png" alt=""><div><b>Tiên Thảo Lộ</b><p>EXP đánh quái ×2 trong 60 phút. Mua thêm cộng thời gian.</p><p>Giá: <b>2 KNB</b></p><button class="btn sm" id="buyTienThao" ${(S.knb||0)<TIEN_THAO_COST?'disabled':''}>Mua và dùng</button><small id="tienThaoStatus"></small></div></div>`;
 return ti+Object.entries(LUCK_CONSUMABLES).map(([id,p])=>`<div class="card treasureProduct"><img src="${p.icon}" alt=""><div><b>${p.name}</b><p>May mắn khi rơi trang bị <b>+${p.lucky}</b> trong ${p.ms/60000} phút. Hỗ trợ ra đồ có thuộc tính tốt hơn; không bảo đảm đồ hiếm.</p><p>Giá: <b>${p.cost} KNB / lần dùng</b></p><button class="btn sm" data-luck-buy="${id}" ${(S.knb||0)<p.cost||luckPotionLeft(id)>0?'disabled':''}>${luckPotionLeft(id)>0?'Đang dùng':'Mua và dùng'}</button><small data-luck-status="${id}"></small></div></div>`).join('')+'<small class="dim">Mua là dùng ngay. Hai loại may mắn có thể cùng hiệu lực; không cộng dồn mức tăng khi dùng lại cùng loại. Không tăng tỷ lệ rơi KNB.</small>';
}
function treasureHorseHTML(){
 return '<p class="desc">Giữ nguyên chỉ số và yêu cầu cấp của thú cưỡi. Cùng chỉ số có cùng giá; giá từ 500–1.600 KNB.</p><div class="treasureHorseList">'+(window.JHORSESHOP?.knbItems||[]).map(g=>{const it=goodsItem(g);if(!it)return '';return `<article class="card treasureHorse"><img loading="lazy" src="${it.ic}" alt=""><div><b>${esc(it.n)}</b><small>Cần cấp ${(it.req.find(r=>r[0]===36)||[0,1])[1]}</small><details><summary>Chỉ số</summary>${itemHTML(it)}</details></div><div><b>${g.knb} KNB</b><button class="btn sm" data-horse-buy="${g.k}" ${(S.knb||0)<g.knb||S.inv.length>=INV_MAX?'disabled':''}>Mua</button></div></article>`;}).join('')+'</div>';
}
function treasureShopModal(tab=treasureTab){
 if(!S?.fac)return;if(!TREASURE_TABS.some(([id])=>id===tab))tab=treasureTab;treasureTab=tab;
 if(tab==='mask'){maskShopModal();return;}
 modal(`<h3>Shop Kim Nguyên Bảo</h3>${treasureTabsHTML(tab)}<p class="treasureBalance"><img src="ui/kim-nguyen-bao.svg" alt="">Kim Nguyên Bảo: <b>${fmt(S.knb||0)}</b></p>${tab==='horse'?treasureHorseHTML():treasureMedicineHTML()}`,()=>{
  bindTreasureTabs();const ti=document.getElementById('buyTienThao');if(ti)ti.onclick=buyTienThaoLo;
  document.querySelectorAll('[data-luck-buy]').forEach(b=>b.onclick=()=>buyLuckPotion(b.dataset.luckBuy));
  document.querySelectorAll('[data-horse-buy]').forEach(b=>b.onclick=()=>buyTreasureHorse(+b.dataset.horseBuy));refreshTreasureStatus();
 });
}
function refreshTreasureStatus(){
 const el=document.getElementById('tienThaoStatus');if(el){const left=tienThaoLeft();el.textContent=left?'Đang dùng · còn '+Math.ceil(left/60000)+' phút':'Chưa có hiệu ứng.';}
 document.querySelectorAll('[data-luck-status]').forEach(el=>{const id=el.dataset.luckStatus,left=luckPotionLeft(id);el.textContent=left?'May mắn +'+LUCK_CONSUMABLES[id].lucky+' · còn '+Math.ceil(left/60000)+' phút':'Chưa có hiệu ứng.';const buy=document.querySelector(`[data-luck-buy="${id}"]`);if(buy){buy.disabled=left>0||(S.knb||0)<LUCK_CONSUMABLES[id].cost;buy.textContent=left>0?'Đang dùng':'Mua và dùng';}});
}
document.getElementById('jxTreasure').onclick=()=>treasureShopModal();
setInterval(refreshTreasureStatus,1000);
