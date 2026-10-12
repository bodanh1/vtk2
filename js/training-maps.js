"use strict";
(function(){
 const render=renderLog;
 renderLog=function(){render();const list=document.createElement('div');list.className='zlist';
 list.innerHTML='<h3>Bãi luyện công bổ sung</h3>'+window.JTRAIN_MAPS.map(q=>{const z=trainingZone(q.first,q.id),open=S.maxStage>=q.first,cur=S.trainingMap===q.id&&S.stage>=q.first&&S.stage<=q.last;return `<button class="zrow${cur?' cur':''}" data-training="${q.id}" ${open?'':'disabled'}><b>${esc(q.n)}</b><span>Cấp ${z.lo}–${z.hi}</span></button>`;}).join('');
 document.getElementById('t-log').appendChild(list);
 list.querySelectorAll('[data-training]').forEach(b=>b.onclick=()=>{const q=window.JTRAIN_MAPS.find(m=>m.id===+b.dataset.training);if(!q||S.maxStage<q.first)return;S.trainingMap=q.id;S.stage=q.first;S.wave=1;S.push=false;R.enemies=[];R.ground=[];R.pickTarget=null;R.moveTo=null;R.zoneShown=null;R.spawnT=.3;onZoneChange(zoneOf(S.stage));save();refresh();});
 };
 const go=gotoStage;gotoStage=function(st){const had=!!S.trainingMap;delete S.trainingMap;if(had){R.zoneShown=null;R.moveTo=null;R.pickTarget=null;R.enemies=[];R.spawnT=.3;onZoneChange(ZONES[zoneIdx(st)]);}go(st);if(had)refresh();};
})();
