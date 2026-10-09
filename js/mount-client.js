// Draw the three original client horse layers with a shared frame clock and origin.
function clientMountSet(state,act){
 const M=window.JMOUNT,h=state&&state.eq&&state.eq.horse;if(!M||!h)return null;
 const kind=M.res[h.d+':'+h.k+':'+h.lvl];if(!kind)return null;
 const sex=state.sex?'f':'m',horse=M.horses[sex+':'+kind]||M.horses['m:'+kind];
 const layers=horse&&horse[act];if(!layers||![10,11,12].every(p=>layers[p]&&M.sheets[layers[p]]))return null;
 return [12,11,10].map(p=>M.sheets[layers[p]]);
}
function drawClientMount(c,x,y,dir,t,state,moving,alpha){
 const act=moving==='run'?'run':moving?'walk':'st',sheets=clientMountSet(state,act);if(!sheets)return null;
 const images=sheets.map(s=>img(s.f));if(images.some(im=>!im.complete||!im.naturalWidth))return null;
 const scale=.8,clock=Math.max(0,t||0),period=act==='run'?.6:act==='walk'?.9:1.4;
 c.save();c.globalAlpha=alpha==null?1:alpha;c.fillStyle='#0006';c.beginPath();c.ellipse(x,y+1,24,7,0,0,7);c.fill();
 sheets.forEach((s,i)=>{const col=Math.floor(clock/period*s.n)%s.n,row=dollRow(dir,s.d);
 c.drawImage(images[i],col*s.w,row*s.h,s.w,s.h,x-(s.ax??160)*scale,y-(s.ay??220)*scale,s.w*scale,s.h*scale);});
 c.restore();return 0;
}

