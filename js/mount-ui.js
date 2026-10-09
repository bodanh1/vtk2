"use strict";
function toggleMount(){
  if(!S||!S.fac)return;
  if(S.fac==='tangmen'){toast('Đường Môn tạm chưa hỗ trợ cưỡi ngựa');return}
  if(S.mounted){S.mounted=false;toast('Đã xuống ngựa')}
  else{
    if(!mountEquipped(S)){toast('Trang bị một con ngựa trong Hành trang trước');return}
    if(typeof reqOk==='function'&&!reqOk(S.eq.horse)){toast('Chưa đủ điều kiện cưỡi ngựa này');return}
    if(R.deadT>0||R.life<=0){toast('Chờ hồi sinh để lên ngựa');return}
    S.mounted=true;toast('Đã lên ngựa · chiêu không phù hợp sẽ tự xuống ngựa');
  }
  save();refreshMountButton();
}
function refreshMountButton(){
  if(typeof S==='undefined'||!S)return;
  if(S.mounted&&(S.fac==='tangmen'||!mountEquipped(S)||!reqOk(S.eq.horse)||R.deadT>0))S.mounted=false;
  const b=document.getElementById('jxMount');if(!b)return;
  b.classList.toggle('on',!!S.mounted);b.setAttribute('aria-pressed',String(!!S.mounted));
  b.querySelector('span').textContent=S.mounted?'Xuống ngựa':'Lên ngựa';
}
document.getElementById('jxMount').onclick=toggleMount;
setInterval(refreshMountButton,300);
