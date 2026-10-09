// Native SPR shadows retain their original palette, alpha and every source frame.
function clientShadowSheet(sex,action){const m=window.JSHADOW;return m&&m.sheets[m.players[sex]&&m.players[sex][action]];}
function drawClientShadow(c,s,dir,phase,x,y,scale,alpha=1,anchorShift=0){
 if(!s)return false;const im=img(s.f);if(!im.complete||!im.naturalWidth)return false;
 const row=dollRow(dir,s.d),source=Math.min((s.per||s.n)-1,Math.max(0,Math.floor(phase*(s.per||s.n)+1e-8))),col=s.frameMap?s.frameMap[source]:source;
 const pixelScale=s.pixelScale||1;scale/=pixelScale;anchorShift*=pixelScale;
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
 if(!s)return false;drawClientShadow(c,s,dir,frame/body.n,x,y,scale,alpha);return true;
}
// Some client NPCs have no companion b.spr. Project their actual body frame onto
// the ground instead, so missing resources never become a fixed oval or another NPC.
const CLIENT_SHADOW_FALLBACK=new Map();
const CLIENT_SHADOW_PIXELS=4*1024*1024,CLIENT_SHADOW_ENTRIES=128;
let clientShadowPixels=0,clientShadowBuildsLeft=2;
const CLIENT_SHADOW_STATS={builds:0,hits:0,deferred:0,pixels:0,entries:0};
window.__clientShadowPerf=CLIENT_SHADOW_STATS;
function clientShadowBeginFrame(){clientShadowBuildsLeft=2;}
function drawBodyShadow(c,im,body,frame,row,x,y,scale,alpha){
 if(typeof document==='undefined'||alpha<=0)return false;
 // Cache a directional strip, not a separate canvas for each animation frame.
 // Native shadows keep all frames; missing native resources use up to four poses.
 const key=im.src+':'+row;let entry=CLIENT_SHADOW_FALLBACK.get(key);
 if(entry){CLIENT_SHADOW_FALLBACK.delete(key);CLIENT_SHADOW_FALLBACK.set(key,entry);CLIENT_SHADOW_STATS.hits++;}
 else{
  if(clientShadowBuildsLeft<=0){CLIENT_SHADOW_STATS.deferred++;return false;}
  const samples=Math.min(4,body.n),pixels=body.w*body.h*samples;
  if(pixels>CLIENT_SHADOW_PIXELS)return false;
  while(CLIENT_SHADOW_FALLBACK.size&&(clientShadowPixels+pixels>CLIENT_SHADOW_PIXELS||CLIENT_SHADOW_FALLBACK.size>=CLIENT_SHADOW_ENTRIES)){
   const oldest=CLIENT_SHADOW_FALLBACK.keys().next().value,old=CLIENT_SHADOW_FALLBACK.get(oldest);clientShadowPixels-=old.pixels;old.canvas.width=old.canvas.height=0;CLIENT_SHADOW_FALLBACK.delete(oldest);
  }
  const canvas=document.createElement('canvas');canvas.width=body.w*samples;canvas.height=body.h;const ctx=canvas.getContext('2d');if(!ctx)return false;
  for(let i=0;i<samples;i++)ctx.drawImage(im,Math.floor(i*body.n/samples)*body.w,row*body.h,body.w,body.h,i*body.w,0,body.w,body.h);
  ctx.globalCompositeOperation='source-in';ctx.fillStyle='#222';ctx.fillRect(0,0,canvas.width,canvas.height);
  entry={canvas,samples,pixels};CLIENT_SHADOW_FALLBACK.set(key,entry);clientShadowPixels+=pixels;clientShadowBuildsLeft--;CLIENT_SHADOW_STATS.builds++;CLIENT_SHADOW_STATS.pixels=clientShadowPixels;CLIENT_SHADOW_STATS.entries=CLIENT_SHADOW_FALLBACK.size;
 }
 const k=scale/(body.s||.6),col=Math.min(entry.samples-1,Math.floor(frame/body.n*entry.samples));
 c.save();c.globalAlpha=alpha*.45;c.translate(x,y);c.transform(1,0,-.65,.24,0,0);c.drawImage(entry.canvas,col*body.w,0,body.w,body.h,-body.ax*k,-body.ay*k,body.w*k,body.h*k);c.restore();return true;
}
