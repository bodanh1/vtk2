"use strict";
// Ngựa giáp lớn, màu theo icon và người cưỡi ghép tư thế co gối.
const HORSE_GAIT_RECTS=[[[69,8,89,206],[289,9,88,206],[512,8,87,207],[733,9,86,206]],[[36,225,143,210],[252,224,152,207],[469,224,160,210],[688,224,160,208]],[[2,438,215,180],[216,438,223,178],[439,440,222,181],[662,438,217,180]],[[36,637,142,203],[252,635,148,200],[479,639,143,200],[698,637,146,204]],[[65,852,94,206],[286,852,94,206],[508,852,94,206],[726,852,94,206]],[[37,1067,155,220],[252,1069,165,212],[472,1068,170,212],[693,1068,165,219]],[[7,1293,219,181],[228,1293,222,183],[450,1294,223,182],[674,1293,213,183]],[[33,1487,161,219],[253,1487,166,219],[468,1487,177,214],[691,1487,169,221]]];
const HORSE_ROW_END=[220, 440, 626, 846, 1063, 1292, 1481, 1713];
const HORSE_RENDER_WIDTH=110;
const HORSE_COATS={
  '10_0':[145,88,46], '10_10':[116,119,70], '10_20':[183,186,181],
  '10_30':[35,46,38], '10_40':[151,57,40], '10_50':[35,31,27],
  '10_51':[47,36,28], '10_52':[66,62,66], '10_53':[177,117,45],
  '10_54':[215,217,219], '10_80':[105,98,87]
};
const HORSE_FRAME_CACHE=new Map();
function mountedHorseFrame(im,direction,frame,state){
  const horse=state&&state.eq&&state.eq.horse,icon=(horse&&horse.ic||'').match(/(10_\d+)\.png/),coat=icon&&icon[1]||'10_0';
  const key=coat+':'+direction+':'+frame;if(HORSE_FRAME_CACHE.has(key))return HORSE_FRAME_CACHE.get(key);
  const [sx,sy,sw,sh]=HORSE_GAIT_RECTS[direction][frame],canvas=document.createElement('canvas');canvas.width=sw;canvas.height=sh;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,sx,sy,sw,sh,0,0,sw,sh);
  const target=HORSE_COATS[coat]||HORSE_COATS['10_0'],pixels=ctx.getImageData(0,0,sw,sh),p=pixels.data;
  // Chỉ đổi vùng lông nâu; giữ đệm đỏ, giáp đen và viền kim loại.
  for(let i=0;i<p.length;i+=4){const r=p[i],g=p[i+1],b=p[i+2];if(p[i+3]<30||r<28||g<12||r/g<1.13||r/g>2.7||g/Math.max(1,b)<1.08||r>185&&g>140)continue;
    const light=(r*.299+g*.587+b*.114)/93;
    for(let k=0;k<3;k++)p[i+k]=Math.min(255,Math.round(target[k]*Math.pow(light,.88)));
  }
  ctx.putImageData(pixels,0,0);HORSE_FRAME_CACHE.set(key,canvas);return canvas;
}
function drawMountedHorse(c,x,y,dir,t,state,moving,alpha){
  const im=img('img/mount-horse-armored.png');if(!im.complete||!im.naturalWidth)return null;
  const direction=(4+(dir||0))%8,frame=moving?Math.floor(t*10)%4:0,cellWidth=im.naturalWidth/4;
  const [sx,sy,sw,sh]=HORSE_GAIT_RECTS[direction][frame],ratio=HORSE_RENDER_WIDTH/cellWidth;
  const bob=moving?Math.sin(t*10*Math.PI)*.8:0;
  c.save();c.globalAlpha=alpha==null?1:alpha;c.fillStyle='#0006';c.beginPath();c.ellipse(x,y+1,30,9,0,0,7);c.fill();
  c.drawImage(mountedHorseFrame(im,direction,frame,state),x-HORSE_RENDER_WIDTH/2+(sx-frame*cellWidth)*ratio,y+2-(HORSE_ROW_END[direction]-sy)*ratio-bob,sw*ratio,sh*ratio);
  c.restore();return bob;
}
const drawFootDoll=drawDoll;
let mountedRiderCanvas=null,mountedLegCanvas=null;
function drawMountedRider(c,x,seatY,act,dir,t,scale,alpha,state){
  if(!mountedRiderCanvas){mountedRiderCanvas=document.createElement('canvas');mountedRiderCanvas.width=192;mountedRiderCanvas.height=192;mountedLegCanvas=document.createElement('canvas');mountedLegCanvas.width=192;mountedLegCanvas.height=192}
  const rc=mountedRiderCanvas.getContext('2d');rc.clearRect(0,0,192,192);
  const ridingAct=act==='run'||act==='walk'?'st':act,height=drawFootDoll(rc,96,160,ridingAct,dir,t,scale,1,state);
  if(!height)return 0;
  const legScale=Number.isFinite(scale)&&scale>0?scale:1,waist=160-16*legScale;c.save();c.globalAlpha=alpha==null?1:alpha;
  // Đặt hông trên yên, chỉ giữ nửa trên của hoạt ảnh nhân vật.
  c.drawImage(mountedRiderCanvas,0,0,192,waist,x-96,seatY-waist,192,waist);
  const lc=mountedLegCanvas.getContext('2d');lc.clearRect(0,0,192,192);
  const worn=dollWornParts(state).parts,index=worn[5],sheet=dollCell(state,5,index,'st',dollAction(state,'st'));
  if(sheet&&sheet.f){const im=img(DOLL_ORIGIN+sheet.f),eff=dollEffScale(scale),row=dollRow(dir,sheet.d),col=dollCol(sheet,state,'st',0);if(im.complete&&im.naturalWidth)lc.drawImage(im,col*sheet.w,row*sheet.h,sheet.w,sheet.h,96-sheet.ax*eff,160-sheet.ay*eff,sheet.w*eff,sheet.h*eff)}
  const side=dir%8,profile=side===2||side===6,forward=side>=1&&side<=3?-1:1;
  const legs=profile?[forward]:[-1,1];
  for(const sign of legs){const sourceX=sign<0?96-7*legScale:96,kneeX=(profile?forward*7:sign*7)*legScale;
    c.save();c.translate(x+(profile?0:sign*3*legScale),seatY);c.rotate(-Math.atan2(kneeX,6*legScale));c.drawImage(mountedLegCanvas,sourceX,waist,7*legScale,7*legScale,-3*legScale,0,6*legScale,9*legScale);c.restore();
    c.drawImage(mountedLegCanvas,sourceX,waist+7*legScale,7*legScale,9*legScale,x+(profile?0:sign*3*legScale)+kneeX-3*legScale,seatY+6*legScale,6*legScale,9*legScale);
  }
  c.restore();return height-16*legScale;
}
drawDoll=function(c,x,y,act,dir,t,scale,alpha,state){
  const rider=state||(typeof S!=='undefined'?S:null);
  if(!rider||!rider.mounted||!mountEquipped(rider)||act==='die'||!c||c.x!==undefined)return drawFootDoll(c,x,y,act,dir,t,scale,alpha,state);
  const bob=drawMountedHorse(c,x,y,dir,t,rider,act==='run'||act==='walk',alpha);if(bob===null)return drawFootDoll(c,x,y,act,dir,t,scale,alpha,rider);
  const direction=(4+(dir||0))%8,seatOffsets=[74,68,55,66,79,66,55,68],seatY=y-seatOffsets[direction]-bob;
  const height=drawMountedRider(c,x,seatY,act,dir,t,scale,alpha,rider);return height?y-seatY+height:0;
};
img('img/mount-horse-armored.png');
