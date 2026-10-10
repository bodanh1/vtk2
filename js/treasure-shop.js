"use strict";
const TIEN_THAO_COST=2,TIEN_THAO_MS=60*60*1000;
function tienThaoLeft(){return Math.max(0,(S.tienThaoUntil||0)-Date.now())}
function tienThaoMul(){return tienThaoLeft()>0?2:1}
function gainMonsterXp(x,mul=tienThaoMul()){gainXp(x*mul)}
function buyTienThaoLo(){
  if(!S||!S.fac)return;
  if((S.knb||0)<TIEN_THAO_COST){toast('Cần 2 Kim Nguyên Bảo để mua Tiên Thảo Lộ');return}
  const until=Math.max(Date.now(),S.tienThaoUntil||0)+TIEN_THAO_MS;
  if(!Number.isSafeInteger(until)){toast('Không thể cộng thêm thời gian');return}
  S.knb-=TIEN_THAO_COST;S.tienThaoUntil=until;
  save();updateTop();treasureShopModal();toast('Đã dùng Tiên Thảo Lộ: EXP đánh quái ×2, thêm 60 phút');
}
function treasureShopModal(){
  if(!S||!S.fac)return;
  const left=tienThaoLeft();
  modal(`<h3>Bảo vật</h3><button class="btn sm" id="openMaskShop">Mặt nạ · 50–100 KNB</button><p class="treasureBalance"><img src="ui/kim-nguyen-bao.svg" alt="Thỏi vàng">Kim Nguyên Bảo: <b>${fmt(S.knb||0)}</b></p><div class="card treasureProduct"><img src="img/i/tien-thao-lo.png" alt="Tiên Thảo Lộ"><div><b>Tiên Thảo Lộ</b><p>Nhân đôi EXP từ đánh quái trong 60 phút. Mua là dùng ngay; mua thêm cộng thời gian, hiệu ứng giữ ở ×2.</p><p>Giá: <b>2 Kim Nguyên Bảo</b></p><button class="btn" id="buyTienThao" ${(S.knb||0)<TIEN_THAO_COST?'disabled':''}>Mua và dùng</button></div></div><p id="tienThaoStatus">${left?'Tiên Thảo Lộ đang dùng · EXP đánh quái ×2 · Còn '+Math.ceil(left/60000)+' phút':'Chưa có hiệu ứng Tiên Thảo Lộ.'}</p>`,()=>{document.getElementById('buyTienThao').onclick=buyTienThaoLo;document.getElementById('openMaskShop').onclick=maskShopModal});
}
document.getElementById('jxTreasure').onclick=treasureShopModal;
setInterval(()=>{const el=document.getElementById('tienThaoStatus');if(el){const left=tienThaoLeft();el.textContent=left?'Tiên Thảo Lộ đang dùng · EXP đánh quái ×2 · Còn '+Math.ceil(left/60000)+' phút':'Chưa có hiệu ứng Tiên Thảo Lộ.'}},1000);
