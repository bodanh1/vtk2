// Native SPR shadows retain their original palette, alpha and every source frame.
function clientShadowSheet(sex,action){const m=window.JSHADOW;return m&&m.sheets[m.players[sex]&&m.players[sex][action]];}
function drawClientShadow(c,s,dir,phase,x,y,scale,alpha=1,anchorShift=0){
 if(!s)return false;const im=img(s.f);if(!im.complete||!im.naturalWidth)return false;
 const row=dollRow(dir,s.d),col=Math.min(s.n-1,Math.max(0,Math.floor(phase*s.n)));
 const previous=c.globalAlpha;c.globalAlpha=alpha;
 c.drawImage(im,col*s.w,row*s.h,s.w,s.h,x-s.ax*scale,y-(s.ay+anchorShift)*scale,s.w*scale,s.h*scale);c.globalAlpha=previous;return true;
}
function drawPlayerShadow(c,state,act,dir,t,x,y,scale,alpha,syncedPhase){
 const s=clientShadowSheet(state&&state.sex?'lady':'man',dollAction(state,act));
 const duration=dollActLen(state,act)||s&&s.per*(s.interval||1)/18||1;
 const phase=DOLL_ONCE[act]?Math.min(Math.max(0,t)/duration,.999999):Math.max(0,t)/duration%1;
 return drawClientShadow(c,s,dir,Number.isFinite(syncedPhase)?syncedPhase:phase,x,y,scale,alpha);
}
function drawNpcShadow(c,key,act,dir,frame,body,x,y,scale,alpha){
 const m=window.JSHADOW,map=m&&m.npc[key],s=map&&m.sheets[map[act]];
 return drawClientShadow(c,s,dir,frame/body.n,x,y,scale,alpha);
}
// Some client NPCs have no companion b.spr. Project their actual body frame onto
// the ground instead, so missing resources never become a fixed oval or another NPC.
const CLIENT_SHADOW_FALLBACK=new Map();
function drawBodyShadow(c,im,body,frame,row,x,y,scale,alpha){
 if(typeof document==='undefined')return false;
 const key=im.src+':'+frame+':'+row;let canvas=CLIENT_SHADOW_FALLBACK.get(key);
 if(!canvas){canvas=document.createElement('canvas');canvas.width=body.w;canvas.height=body.h;const ctx=canvas.getContext('2d');if(!ctx)return false;ctx.drawImage(im,frame*body.w,row*body.h,body.w,body.h,0,0,body.w,body.h);ctx.globalCompositeOperation='source-in';ctx.fillStyle='#222';ctx.fillRect(0,0,body.w,body.h);CLIENT_SHADOW_FALLBACK.set(key,canvas);if(CLIENT_SHADOW_FALLBACK.size>64)CLIENT_SHADOW_FALLBACK.delete(CLIENT_SHADOW_FALLBACK.keys().next().value);}
 const k=scale/(body.s||.6);c.save();c.globalAlpha=alpha*.45;c.translate(x,y);c.transform(1,0,-.65,.24,0,0);c.drawImage(canvas,-body.ax*k,-body.ay*k,body.w*k,body.h*k);c.restore();return true;
}
