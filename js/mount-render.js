"use strict";
// Bốn khung bước chân cho mỗi hướng; người cưỡi dùng trang bị thật.
const HORSE_GAIT_RECTS=[[[73,9,81,204],[293,9,79,204],[516,9,80,204],[735,9,80,204]],[[40,225,134,207],[257,225,142,205],[474,225,149,206],[692,225,154,204]],[[6,442,205,175],[220,442,213,173],[444,442,210,175],[665,442,210,174]],[[39,639,136,200],[257,637,139,196],[482,640,137,198],[701,639,140,200]],[[67,852,88,204],[291,853,83,203],[511,852,84,204],[731,852,85,203]],[[39,1070,146,216],[256,1070,154,208],[475,1071,157,207],[696,1070,156,215]],[[11,1297,210,174],[232,1296,211,176],[454,1296,213,176],[675,1296,209,176]],[[38,1489,150,215],[256,1489,157,214],[473,1487,165,212],[697,1489,159,215]]];
function drawMountedHorse(c,x,y,dir,t,state,moving,alpha){
  const im=img('img/mount-horse-gait.png');
  if(!im.complete||!im.naturalWidth)return null;
  const direction=(4+(dir||0))%8,frame=moving?Math.floor(t*10)%4:0;
  const w=im.naturalWidth/4;
  // Khoảng cắt theo từng hàng tránh lấy đầu ngựa của hàng kế tiếp.
  const bounds=[[0,220],[220,437],[437,630],[630,848],[848,1064],[1064,1288],[1288,1480],[1480,1720]][direction];
  const [sx,sy,sw,sh]=HORSE_GAIT_RECTS[direction][frame],ratio=80/w;
  const bob=moving?Math.sin(t*10*Math.PI)*.8:0;
  c.save();c.globalAlpha=alpha==null?1:alpha;
  c.fillStyle='#0006';c.beginPath();c.ellipse(x,y+1,25,8,0,0,7);c.fill();
  c.drawImage(im,sx,sy,sw,sh,x-40+(sx-frame*w)*ratio,y+2-(bounds[1]-sy)*ratio-bob,sw*ratio,sh*ratio);
  c.restore();return bob;
}
const drawFootDoll=drawDoll;
drawDoll=function(c,x,y,act,dir,t,scale,alpha,state){
  const rider=state||(typeof S!=='undefined'?S:null);
  if(!rider||!rider.mounted||!mountEquipped(rider)||act==='die'||!c||c.x!==undefined)return drawFootDoll(c,x,y,act,dir,t,scale,alpha,state);
  const bob=drawMountedHorse(c,x,y,dir,t,rider,act==='run'||act==='walk',alpha);
  if(bob===null)return drawFootDoll(c,x,y,act,dir,t,scale,alpha,rider);
  c.save();c.beginPath();c.rect(x-90,y-160,180,128-bob);c.clip();
  const height=drawFootDoll(c,x,y-30-bob,(act==='run'||act==='walk')?'st':act,dir,t,scale,alpha,rider);c.restore();
  return height?height+30+bob:0;
};
img('img/mount-horse-gait.png');
