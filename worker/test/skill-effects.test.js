import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
test('skill sprite blending removes black backgrounds and restores ordinary scene drawing',()=>{
  const source=fs.readFileSync('js/render.js','utf8');
  const start=source.indexOf('function drawFxSprite('),end=source.indexOf('function drawFxFallback(',start);
  const stack=[],draws=[];
  const ctx={globalCompositeOperation:'source-over',globalAlpha:.7,imageSmoothingQuality:'low',save(){stack.push([this.globalCompositeOperation,this.imageSmoothingQuality]);},restore(){[this.globalCompositeOperation,this.imageSmoothingQuality]=stack.pop();},drawImage(...args){draws.push({blend:this.globalCompositeOperation,alpha:this.globalAlpha,args});}};
  const c={CX:ctx,DPR:2,FX_SCALE:1.4,img:()=>({complete:true,naturalWidth:100})};vm.createContext(c);vm.runInContext(source.slice(start,end),c);
  const sheet={f:'fx/test.webp',n:6,d:1,w:20,h:30,ax:10,ay:20,ms:56};
  assert.equal(c.drawFxSprite(sheet,0,.12,100,100,false),true);
  assert.equal(draws[0].blend,'screen');assert.equal(draws[0].alpha,.7);assert.equal(ctx.globalCompositeOperation,'source-over');assert.equal(ctx.imageSmoothingQuality,'low');assert.equal(stack.length,0);
  // Screen compositing leaves the destination unchanged for a black source pixel.
  for(const background of [0,32,127,220,255])assert.equal(255-(255-background)*(255-0)/255,background);
  c.img=()=>({complete:false,naturalWidth:0});assert.equal(c.drawFxSprite(sheet,0,0,0,0,false),false);assert.equal(stack.length,0);
});
test('all missile, impact, end and casting sheets use the shared effect drawing path',()=>{
  const c={window:{}};vm.runInNewContext(fs.readFileSync('fx.js','utf8'),c);const fx=c.window.JFX,paths=new Set;
  for(const m of Object.values(fx.m))for(const part of ['fly','hit','end'])if(m[part])paths.add(m[part].f);
  for(const pre of Object.values(fx.c))paths.add(pre.f);
  assert.equal(paths.size,202);for(const file of paths)assert.ok(fs.existsSync(file),file);
  const meteor=fx.m[fx.f[362].c];assert.ok(paths.has(meteor.fly.f));assert.ok(paths.has(meteor.hit.f));
});
