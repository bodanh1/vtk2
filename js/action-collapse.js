"use strict";
(function(){
  const acts=document.getElementById('jxActs'),toggle=document.getElementById('jxActsToggle');
  if(!acts||!toggle)return;
  const key='jxidle_actions_collapsed';
  function apply(collapsed){
    acts.classList.toggle('actionsCollapsed',collapsed);
    document.body.classList.toggle('actionsCollapsed',collapsed);
    toggle.textContent=collapsed?'▾':'▴';
    toggle.setAttribute('aria-expanded',String(!collapsed));
    toggle.setAttribute('aria-label',collapsed?'Mở rộng các nút hoạt động':'Thu gọn các nút hoạt động');
    toggle.title=toggle.getAttribute('aria-label');
  }
  let collapsed=false;try{collapsed=localStorage.getItem(key)==='1'}catch(e){}
  apply(collapsed);
  toggle.onclick=e=>{e.stopPropagation();collapsed=!collapsed;apply(collapsed);try{localStorage.setItem(key,collapsed?'1':'0')}catch(e){}};
})();
