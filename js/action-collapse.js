"use strict";
(function(){
  const acts=document.getElementById('jxActs'),toggle=document.getElementById('jxActsToggle');
  if(!acts||!toggle)return;
  const key='jxidle_actions_collapsed';
  function apply(collapsed){
    acts.classList.toggle('actionsCollapsed',collapsed);
    document.body.classList.toggle('actionsCollapsed',collapsed);
    document.getElementById('jxMainActs').hidden=collapsed;
    acts.querySelectorAll('#jxExtraActs .rnd').forEach(button=>{button.hidden=collapsed});
    toggle.textContent=collapsed?'▾':'▴';
    toggle.setAttribute('aria-expanded',String(!collapsed));
    toggle.setAttribute('aria-label',collapsed?'Mở rộng các nút hoạt động':'Thu gọn các nút hoạt động');
    toggle.title=toggle.getAttribute('aria-label');
  }
  let collapsed=false;try{collapsed=localStorage.getItem(key)==='1'}catch(e){}
  apply(collapsed);
  let lastTouch=0;
  function change(e){e.preventDefault();e.stopPropagation();collapsed=!collapsed;apply(collapsed);try{localStorage.setItem(key,collapsed?'1':'0')}catch(error){}}
  toggle.addEventListener('click',e=>{if(Date.now()-lastTouch<600){e.preventDefault();return}change(e)});
  if(window.PointerEvent){toggle.addEventListener('pointerup',e=>{if(e.pointerType==='touch'){lastTouch=Date.now();change(e)}})}
  else toggle.addEventListener('touchend',e=>{lastTouch=Date.now();change(e)},{passive:false});
})();
