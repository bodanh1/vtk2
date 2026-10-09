"use strict";
/* Restore after the native PC renderer has rebuilt the skill sidebar. */
(function(){
  const original=window.renderSkill;
  if(typeof original!=='function')return;
  const wrapped=function(){
    const panel=document.getElementById('t-skill'),positions=[];
    for(let node=panel;node;node=node.parentElement)positions.push([node,node.scrollTop,node.scrollLeft]);
    const sidebar=panel?.querySelector('.jxx'),side=sidebar?[sidebar.scrollTop,sidebar.scrollLeft]:null;
    const result=original.apply(this,arguments);
    const next=panel?.querySelector('.jxx');
    if(side&&next){next.scrollTop=side[0];next.scrollLeft=side[1];}
    for(const[node,top,left]of positions){node.scrollTop=top;node.scrollLeft=left;}
    return result;
  };
  Object.assign(wrapped,original);
  window.renderSkill=wrapped;
})();
