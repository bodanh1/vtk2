"use strict";
// Tám hướng cùng một ngựa yên đỏ; giữ sprite trang bị của người cưỡi.
function drawMountedHorse(c,x,y,dir,t,state,moving,alpha){
  const im=img('img/mount-horse-directions.png');
  if(!im.complete||!im.naturalWidth)return null;
  const cell=(4+(dir||0))%8,w=im.naturalWidth/4,h=im.naturalHeight/2;
  const bob=moving?Math.abs(Math.sin(t*12))*1.5:0;
  c.save();c.globalAlpha=alpha==null?1:alpha;
  c.fillStyle='#0006';c.beginPath();c.ellipse(x,y+1,25,8,0,0,7);c.fill();
  c.drawImage(im,(cell%4)*w,Math.floor(cell/4)*h,w,h,x-40,y-77-bob,80,80);
  c.restore();return bob;
}
const drawFootDoll=drawDoll;
drawDoll=function(c,x,y,act,dir,t,scale,alpha,state){
  const rider=state||(typeof S!=='undefined'?S:null);
  if(!rider||!rider.mounted||!mountEquipped(rider)||act==='die'||!c||c.x!==undefined)return drawFootDoll(c,x,y,act,dir,t,scale,alpha,state);
  const bob=drawMountedHorse(c,x,y,dir,t,rider,act==='run'||act==='walk',alpha);
  if(bob===null)return drawFootDoll(c,x,y,act,dir,t,scale,alpha,rider);
  c.save();c.beginPath();c.rect(x-90,y-160,180,123-bob);c.clip();
  const height=drawFootDoll(c,x,y-12-bob,(act==='run'||act==='walk')?'st':act,dir,t,scale,alpha,rider);c.restore();
  return height?height+12+bob:0;
};
img('img/mount-horse-directions.png');
