'use strict';
const CLIENT_RIDE_PARTS=[0,1,4,5,6,7,8,9];
function clientRideAction(state,act){
 if(act==='run')return 'RideRun';if(act==='walk')return 'RideWalk';if(act==='hurt')return 'RideWound';
 if(act==='mag')return 'RideMagic';if(act==='at')return mountWeaponType(state)===3?'RidePuncture':'RideCut';
 return 'RideStand';
}
function clientRidePlan(state,act){
 const M=window.JMRIG,h=state&&state.eq&&state.eq.horse;if(!M||!h)return null;
 const kind=M.res[h.d+':'+h.k+':'+h.lvl];if(kind===undefined)return null;
 const sex=state.sex?'lady':'man',action=clientRideAction(state,act),preferred=M.horses[sex]?.[kind],horse=[12,13,14].every(p=>preferred?.[action]?.[p]&&M.sheets[preferred[action][p]])?preferred:M.horses.man?.[kind];
 if(!horse?.[action]||![12,13,14].every(p=>horse[action][p]&&M.sheets[horse[action][p]]))return null;
 const worn=dollWornParts(state).parts,layers={...horse[action]};
 const clothingFallback=!M.riders[sex]?.[5]?.[worn[5]]?.[action];
 const clothingIndex=clothingFallback?window.JDOLL?.res?.armor?.def:worn[5];
 for(const part of CLIENT_RIDE_PARTS){const index=[4,5,6,7].includes(part)?clothingIndex:worn[part];if(index===undefined)continue;
  const records=M.riders[sex]?.[part],record=records?.[index],id=record?.[action];if(id&&M.sheets[id])layers[part]=id;
 }
 // A seated body is required: never substitute a standing body into a mounted rig.
 if(!layers[5])return null;
 return {sex,kind,action,layers,body:M.sheets[layers[5]],horse,clothingFallback};
}
function clientRideOrder(plan,dir,phase){
 const M=window.JMRIG,row=dollRow(dir,plan.body.d),sourceFrame=row*(plan.body.per||plan.body.n)+Math.floor(phase*(plan.body.per||plan.body.n));
 const own=M.sort[plan.sex]?.[plan.action],def=M.sort[plan.sex]?.DEFAULT;
 return own?.lines[sourceFrame]||own?.dirs[row]||def?.dirs[row]||[14,13,9,7,5,4,1,0,6,8,12];
}
function clientRideColumn(sheet,phase){
 const target=phase*(sheet.per||sheet.n);if(!sheet.frames)return Math.min(sheet.n-1,Math.round(target));
 let best=0;for(let i=1;i<sheet.frames.length;i++)if(Math.abs(sheet.frames[i]-target)<Math.abs(sheet.frames[best]-target))best=i;return best;
}
function drawClientRiding(c,x,y,act,dir,t,scale,alpha,state){
 const plan=clientRidePlan(state,act);if(!plan)return null;
 const M=window.JMRIG,images={};
 for(const part of Object.keys(plan.layers)){const sheet=M.sheets[plan.layers[part]],im=img(sheet.f);if(!im.complete||!im.naturalWidth)return null;images[part]=im;}
 const body=plan.body,eff=.8*dollEffScale(Number.isFinite(scale)&&scale>0?scale:1/.6),time=Math.max(0,t||0);
 const once=act==='at'||act==='mag'||act==='hurt',duration=once?dollActLen(state,act):(body.per||body.n)*(body.interval||1)/18;
 const phase=once?Math.min(time/Math.max(.05,duration),.999999):time/Math.max(.05,duration)%1;
 const bodyCol=Math.min(body.n-1,Math.floor(phase*body.n));
 const syncedPhase=body.frames?body.frames[bodyCol]/(body.per||body.n):bodyCol/body.n;
 const drawOrder=clientRideOrder(plan,dir,syncedPhase),seen=new Set();let top=y;
 c.save();c.globalAlpha=alpha==null?1:alpha;if(typeof drawClientShadow==='function')drawClientShadow(c,clientShadowSheet(state&&state.sex?'lady':'man',plan.action),dir,syncedPhase,x,y,eff,alpha==null?1:alpha,30);
 for(const part of drawOrder){const id=plan.layers[part];if(!id||seen.has(part))continue;seen.add(part);const s=M.sheets[id],row=dollRow(dir,s.d),col=clientRideColumn(s,syncedPhase),dx=x-s.ax*eff,dy=y-s.ay*eff;
 c.drawImage(images[part],col*s.w,row*s.h,s.w,s.h,dx,dy,s.w*eff,s.h*eff);top=Math.min(top,dy);}
 c.restore();return y-top;
}
// Warm only the equipped rig; item changes resolve a new plan and different asset paths.
function clientRideWarm(state){for(const act of ['st','walk','run']){const plan=clientRidePlan(state,act);if(!plan)continue;if(typeof clientShadowSheet==='function'){const sh=clientShadowSheet(plan.sex,plan.action);if(sh)img(sh.f);}for(const id of Object.values(plan.layers))img(window.JMRIG.sheets[id].f);}}
