import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
test('native skill alpha preserves colors and restores ordinary scene drawing',()=>{
  const source=fs.readFileSync('js/render.js','utf8');
  const start=source.indexOf('function drawFxSprite('),end=source.indexOf('function drawFxFallback(',start);
  const stack=[],draws=[];
  const ctx={globalCompositeOperation:'source-over',globalAlpha:.7,imageSmoothingQuality:'low',save(){stack.push([this.globalCompositeOperation,this.imageSmoothingQuality]);},restore(){[this.globalCompositeOperation,this.imageSmoothingQuality]=stack.pop();},drawImage(...args){draws.push({blend:this.globalCompositeOperation,alpha:this.globalAlpha,args});}};
  const c={CX:ctx,DPR:2,FX_SCALE:1.4,img:()=>({complete:true,naturalWidth:100})};vm.createContext(c);vm.runInContext(source.slice(start,end),c);
  const sheet={f:'fx/test.webp',n:6,d:1,w:20,h:30,ax:10,ay:20,ms:56};
  assert.equal(c.drawFxSprite(sheet,0,.12,100,100,false),true);
  assert.equal(draws[0].blend,'source-over');assert.equal(draws[0].alpha,.7);assert.equal(ctx.globalCompositeOperation,'source-over');assert.equal(ctx.imageSmoothingQuality,'low');assert.equal(stack.length,0);
  // A fully transparent native SPR pixel leaves the scene unchanged.
  for(const background of [0,32,127,220,255])assert.equal(0*0+background*(1-0),background);
  c.img=()=>({complete:false,naturalWidth:0});assert.equal(c.drawFxSprite(sheet,0,0,0,0,false),false);assert.equal(stack.length,0);
});
test('all missile, impact, end and casting sheets use the shared effect drawing path',()=>{
  const c={window:{}};vm.runInNewContext(fs.readFileSync('fx.js','utf8'),c);const fx=c.window.JFX,paths=new Set;
  for(const m of Object.values(fx.m))for(const part of ['fly','hit','end'])if(m[part])paths.add(m[part].f);
  for(const pre of Object.values(fx.c))paths.add(pre.f);
  assert.equal(paths.size,127);for(const file of paths)assert.ok(fs.existsSync(file),file);
  const meteor=fx.m[fx.f[362].c];assert.ok(paths.has(meteor.fly.f));assert.ok(paths.has(meteor.hit.f));
});

test("vanished-event skills keep native chained effects without generated dark ground cracks",()=>{const source=fs.readFileSync("js/render.js","utf8");assert.equal(source.includes("crackFx"),false);assert.equal(source.includes("drawCrack"),false);assert.ok(source.includes("chainFx(a,b,atk,f,"));const c={window:{}};vm.runInNewContext(fs.readFileSync("data.js","utf8"),c);const affected=Object.values(c.window.JX.skills).filter(s=>s.attr?.skill_vanishedevent).map(s=>s.id);assert.deepEqual(affected.sort((a,b)=>a-b),[353,362]);});

test("all skill sheets come from client PAK with lossless native alpha and bounded frame sampling",()=>{const report=JSON.parse(fs.readFileSync("docs/client-skill-effects.json","utf8"));assert.equal(report.entries.length,202);assert.equal(report.missing.length,0);assert.equal(report.uniqueFiles,127);assert.ok(report.encoding.includes("lossless"));const c={window:{}};vm.runInNewContext(fs.readFileSync("fx.js","utf8"),c);for(const e of report.entries){assert.ok(e.hash&&e.pak&&e.source);assert.ok(e.frames<=e.originalFrames);const b=fs.readFileSync(e.file);assert.equal(b.toString("ascii",0,4),"RIFF");assert.equal(b.toString("ascii",8,12),"WEBP");const m=/^m(\d+)_(fly|hit|end)$/.exec(e.label),sheet=m?c.window.JFX.m[m[1]][m[2]]:c.window.JFX.c[e.label.slice(1)];assert.equal(sheet.blend,"source-over");assert.ok(sheet.n>0&&sheet.d>0&&sheet.ms>0);}});
