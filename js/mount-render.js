"use strict";
// Bốn khung bước chân cho mỗi hướng; người cưỡi dùng trang bị thật.
function drawMountedHorse(c,x,y,dir,t,state,moving,alpha){
  const im=img('img/mount-horse-gait.png');
  if(!im.complete||!im.naturalWidth)return null;
  const direction=(4+(dir||0))%8,frame=moving?Math.floor(t*10)%4:0;
  const w=im.naturalWidth/4;
  // Khoảng cắt theo từng hàng tránh lấy đầu ngựa của hàng kế tiếp.
  const bounds=[[0,220],[220,437],[437,630],[630,848],[848,1064],[1064,1288],[1288,1480],[1480,1720]][direction];
  const sy=bounds[0],h=bounds[1]-sy,dh=h*80/w;
  const bob=moving?Math.sin(t*10*Math.PI)*.8:0;
  c.save();c.globalAlpha=alpha==null?1:alpha;
  c.fillStyle='#0006';c.beginPath();c.ellipse(x,y+1,25,8,0,0,7);c.fill();
  c.drawImage(im,frame*w,sy,w,h,x-40,y+2-dh-bob,80,dh);
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
