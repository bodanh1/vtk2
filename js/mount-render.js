"use strict";
// Chạy nước đại tám khung/hướng, chân cưỡi liền mạch theo video tham chiếu.
const HORSE_GAIT_RECTS=[[[69,8,89,206],[289,9,88,206],[512,8,87,207],[733,9,86,206]],[[36,225,143,210],[252,224,152,207],[469,224,160,210],[688,224,160,208]],[[2,438,215,180],[216,438,223,178],[439,440,222,181],[662,438,217,180]],[[36,637,142,203],[252,635,148,200],[479,639,143,200],[698,637,146,204]],[[65,852,94,206],[286,852,94,206],[508,852,94,206],[726,852,94,206]],[[37,1067,155,220],[252,1069,165,212],[472,1068,170,212],[693,1068,165,219]],[[7,1293,219,181],[228,1293,222,183],[450,1294,223,182],[674,1293,213,183]],[[33,1487,161,219],[253,1487,166,219],[468,1487,177,214],[691,1487,169,221]]];
const HORSE_ROW_END=[220, 440, 626, 846, 1063, 1292, 1481, 1713];
const HORSE_GALLOP_RECTS=[[[49,11,63,143],[201,10,68,144],[359,9,82,148],[517,9,64,148],[672,8,65,148],[833,9,64,144],[990,8,63,149],[1144,9,65,147]],[[19,163,121,153],[180,165,121,148],[326,165,132,149],[485,165,127,151],[643,164,127,147],[803,164,127,134],[959,164,125,134],[1117,164,122,152]],[[7,320,149,132],[158,323,161,125],[306,321,171,123],[466,325,161,125],[626,325,162,127],[784,324,161,124],[946,324,157,114],[1100,323,152,129]],[[15,472,117,142],[171,472,114,144],[328,471,111,141],[487,473,110,135],[644,473,110,137],[803,470,106,144],[959,470,108,137],[1115,473,110,141]],[[45,634,67,139],[199,633,70,141],[358,631,69,140],[514,634,69,138],[671,632,69,143],[829,631,68,143],[986,631,69,142],[1142,635,70,140]],[[10,790,139,138],[162,790,153,131],[319,788,159,130],[473,789,158,126],[631,791,157,130],[787,788,150,125],[943,789,162,128],[1102,789,145,139]],[[3,948,160,125],[154,948,167,125],[313,948,166,121],[469,949,170,121],[628,950,164,122],[782,949,168,120],[938,946,168,127],[1100,948,150,125]],[[30,1080,106,155],[172,1082,124,156],[335,1080,119,155],[495,1080,120,157],[656,1080,118,161],[814,1080,112,143],[972,1080,108,149],[1126,1080,110,156]]];
const HORSE_GALLOP_ROW_END=[161, 320, 456, 620, 779, 932, 1077, 1245];
const MOUNTED_LEG_RECTS=[[79,77,286,268,222],[572,76,267,288,666],[1043,76,192,306,1104],[1472,72,254,314,1552],[70,514,304,293,222],[506,509,258,311,685],[984,514,196,305,1119],[1385,514,276,293,1553]];
const HORSE_RENDER_WIDTH=125;
const HORSE_COATS={
  '10_0':[145,88,46], '10_10':[116,119,70], '10_20':[183,186,181],
  '10_30':[35,46,38], '10_40':[151,57,40], '10_50':[35,31,27],
  '10_51':[47,36,28], '10_52':[66,62,66], '10_53':[177,117,45],
  '10_54':[215,217,219], '10_80':[105,98,87]
};
const HORSE_FRAME_CACHE=new Map();
function mountedHorseFrame(im,direction,frame,state){
  const horse=state&&state.eq&&state.eq.horse,icon=(horse&&horse.ic||'').match(/(10_\d+)\.png/),coat=icon&&icon[1]||'10_0';
  const gallop=im.src.includes('mount-horse-gallop'),rects=gallop?HORSE_GALLOP_RECTS:HORSE_GAIT_RECTS;
  const key=(gallop?'run:':'idle:')+coat+':'+direction+':'+frame;if(HORSE_FRAME_CACHE.has(key))return HORSE_FRAME_CACHE.get(key);
  const [sx,sy,sw,sh]=rects[direction][frame],canvas=document.createElement('canvas');canvas.width=sw;canvas.height=sh;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,sx,sy,sw,sh,0,0,sw,sh);
  const target=HORSE_COATS[coat]||HORSE_COATS['10_0'],pixels=ctx.getImageData(0,0,sw,sh),p=pixels.data;
  // Giữ đúng phần liên thông của con ngựa, bỏ mọi mảnh của ô bên cạnh.
  const seen=new Uint8Array(sw*sh);let body=[];
  for(let start=0;start<seen.length;start++){if(seen[start]||p[start*4+3]<20)continue;
    const group=[start];seen[start]=1;
    for(let head=0;head<group.length;head++){const at=group[head],ax=at%sw,ay=Math.floor(at/sw);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const x=ax+dx,y=ay+dy;if(x<0||x>=sw||y<0||y>=sh)continue;const next=y*sw+x;if(!seen[next]&&p[next*4+3]>=20){seen[next]=1;group.push(next)}}
    }
    if(group.length>body.length)body=group;
  }
  const mask=new Uint8Array(sw*sh);for(const at of body)mask[at]=1;
  for(let at=0;at<mask.length;at++)if(!mask[at])p[at*4+3]=0;

  // Chỉ đổi vùng lông nâu; giữ đệm đỏ, giáp đen và viền kim loại.
  for(let i=0;i<p.length;i+=4){const r=p[i],g=p[i+1],b=p[i+2];if(p[i+3]<30||r<28||g<12||r/g<1.13||r/g>2.7||g/Math.max(1,b)<1.08||r>185&&g>140)continue;
    const light=(r*.299+g*.587+b*.114)/93;
    for(let k=0;k<3;k++)p[i+k]=Math.min(255,Math.round(target[k]*Math.pow(light,.88)));
  }
  ctx.putImageData(pixels,0,0);if(HORSE_FRAME_CACHE.size>=192)HORSE_FRAME_CACHE.delete(HORSE_FRAME_CACHE.keys().next().value);HORSE_FRAME_CACHE.set(key,canvas);return canvas;
}
function drawMountedHorse(c,x,y,dir,t,state,moving,alpha){
  let gallop=!!moving&&moving!=='walk',im=img(gallop?'img/mount-horse-gallop.png':'img/mount-horse-armored.png');
  if(!im.complete||!im.naturalWidth){gallop=false;im=img('img/mount-horse-armored.png');if(!im.complete||!im.naturalWidth)return null}
  const frames=gallop?8:4,direction=(4+(dir||0))%8,frame=moving?Math.floor(t/(gallop ? 0.075 : 0.125))%frames:0,cellWidth=im.naturalWidth/frames;
  const rects=gallop?HORSE_GALLOP_RECTS:HORSE_GAIT_RECTS,rowEnd=(gallop?HORSE_GALLOP_ROW_END:HORSE_ROW_END)[direction];
  const [sx,sy,sw,sh]=rects[direction][frame],ratio=HORSE_RENDER_WIDTH/cellWidth;
  const bob=moving?Math.sin(t*(gallop?2*Math.PI/.6:4*Math.PI))*1.1:0;
  c.save();c.globalAlpha=alpha==null?1:alpha;c.fillStyle='#0006';c.beginPath();c.ellipse(x,y+1,30,9,0,0,7);c.fill();
  c.drawImage(mountedHorseFrame(im,direction,frame,state),x-HORSE_RENDER_WIDTH/2+(sx-frame*cellWidth)*ratio,y+2-(rowEnd-sy)*ratio-bob,sw*ratio,sh*ratio);
  c.restore();return bob;
}
const drawFootDoll=drawDoll;
let mountedRiderCanvas=null;
function drawMountedRider(c,x,seatY,act,dir,t,scale,alpha,state){
  if(!mountedRiderCanvas){mountedRiderCanvas=document.createElement('canvas');mountedRiderCanvas.width=192;mountedRiderCanvas.height=192}
  const rc=mountedRiderCanvas.getContext('2d');rc.clearRect(0,0,192,192);
  const ridingAct=act==='run'||act==='walk'?'st':act,height=drawFootDoll(rc,96,160,ridingAct,dir,t,scale,1,state);
  if(!height)return 0;
  const characterScale=Number.isFinite(scale)&&scale>0?scale:1,waist=160-16*characterScale;
  c.save();c.globalAlpha=alpha==null?1:alpha;
  // Chân ngồi liền mạch: hông, đùi, đầu gối, ống chân và bàn đạp cùng một sprite.
  const legs=img('img/mounted-rider-legs.png'),direction=(4+(dir||0))%8;
  if(legs.complete&&legs.naturalWidth){const [sx,sy,sw,sh,hx]=MOUNTED_LEG_RECTS[direction],ratio=45/sh*(characterScale/(1/.6));
    c.drawImage(legs,sx,sy,sw,sh,x+(sx-hx)*ratio,seatY-1,sw*ratio,sh*ratio);
  }
  // Áo, mặt, mũ và vũ khí vẫn lấy từ trang bị thật; đặt eo khớp với thắt lưng.
  const heading=(dir||0)%8,lean=act==='run'?(heading>=1&&heading<=3?-.035:heading>=5&&heading<=7?.035:0):0;
  c.save();c.translate(x,seatY);c.rotate(lean);c.drawImage(mountedRiderCanvas,0,0,192,waist,-96,-waist,192,waist);c.restore();
  c.restore();return height-16*characterScale;
}
drawDoll=function(c,x,y,act,dir,t,scale,alpha,state){
  const rider=state||(typeof S!=='undefined'?S:null);
  if(!rider||!rider.mounted||!mountEquipped(rider)||act==='die'||!c||c.x!==undefined)return drawFootDoll(c,x,y,act,dir,t,scale,alpha,state);
  const bob=drawMountedHorse(c,x,y,dir,t,rider,act==='run'?'run':act==='walk'?'walk':false,alpha);if(bob===null)return drawFootDoll(c,x,y,act,dir,t,scale,alpha,rider);
  const direction=(4+(dir||0))%8,seatOffsets=[87,84,79,85,91,85,79,84],seatY=y-seatOffsets[direction]-bob;
  const height=drawMountedRider(c,x,seatY,act,dir,t,scale,alpha,rider);return height?y-seatY+height:0;
};
img('img/mount-horse-armored.png');
img('img/mount-horse-gallop.png');
img('img/mounted-rider-legs.png');
