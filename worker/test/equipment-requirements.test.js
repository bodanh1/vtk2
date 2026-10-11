import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {GAME as G} from '../gen/game.js';
const engine=G.economyEngine;
function character(fac='shaolin'){const s=engine.create({fac,mode:'g2',name:'Equipment test',cid:'equipment-test'});s.lvl=100;s.autoEquip=s.autoBuy=s.autoForge=false;return s;}
function context(s,fn){return engine.context({slots:[s,null,null],shared:{}},0,Date.now(),null,fn).result;}
test('660 regular equipment templates preserve all client requirement fields',()=>{
 const files=['meleeweapon','rangeweapon','armor','ring','amulet','boot','belt','helm','cuff','pendant'];let checked=0;
 for(let d=0;d<files.length;d++){
  const rows=fs.readFileSync(new URL('../../../Client_VLTK_SHXT/settings/item/'+files[d]+'.txt',import.meta.url),'latin1').split(/\r?\n/).slice(1).map(r=>r.split('\t')).filter(r=>r[0]);
  for(const item of G.J.items[d].list){const row=rows[item.p],req=[];assert.ok(row);for(let c=34;c<46;c+=2)if(row[c]?.trim())req.push([+row[c],+row[c+1]]);assert.deepEqual(item.req,req,files[d]+':'+item.p);checked++;}
 }assert.equal(checked,660);
});
test('manual equip permits all client weapon classes for every faction when item requirements pass',()=>{
 for(const fac of Object.keys(G.FAC)){const s=character(fac);s.attr={str:1000,dex:1000,vit:1000,eng:1000};context(s,()=>{
  for(const [d,k]of [...Array.from({length:7},(_,k)=>[0,k]),[1,0],[1,1],[1,2]]){
   const item=G.makeItem(d,k,1,0);assert.ok(item);s.inv.push(item);assert.equal(G.reqOk(item),true);
   const result=engine.execute('equip',[item.uid],{});assert.equal(result.ok,true);assert.equal(s.eq.weapon,item,fac+':'+d+':'+k);assert.ok(!s.inv.includes(item));
  }
 });}
});
test('worn stat bonuses unlock a Shaolin sword; candidate and inactive hidden bonuses do not',()=>{
 const s=character();context(s,()=>{
  const armor=G.makeItem(2,0,1,0),dao=G.makeItem(0,1,1,0);armor.req=[];armor.base=[];armor.s=-1;armor.mag=[{a:97,p:[50,0,0],pre:1}];dao.req=[[32,80]];dao.mag=[{a:97,p:[100,0,0],pre:1}];s.inv=[dao];
  assert.equal(G.reqOk(dao),false);assert.equal(G.reqDeficit(dao).str,45);assert.match(G.reqProblems(dao).join(';'),/thiếu 45/);
  s.eq.armor=armor;assert.equal(G.equipmentRequirementAttrs().str,85);assert.equal(G.reqOk(dao),true);assert.deepEqual(G.reqDeficit(dao),{});assert.ok(Number.isFinite(G.calc().str));
  armor.mag[0].pre=0;assert.equal(G.reqOk(dao),false);armor.mag[0].pre=1;
  engine.execute('equip',[dao.uid],{});assert.equal(s.eq.weapon,dao);assert.equal(G.reqOk(dao),true);
 });
});
test('all four current attributes count; level, sex, series and faction restrictions remain enforced',()=>{
 const s=character();context(s,()=>{
  const armor=G.makeItem(2,0,1,0),item=G.makeItem(0,1,1,0);armor.req=[];armor.base=[];armor.mag=[97,98,99,100].map(a=>({a,p:[50,0,0],pre:1}));s.eq.armor=armor;
  const cur=G.equipmentRequirementAttrs();item.req=[['str','dex','vit','eng'].map((key,i)=>[32+i,cur[key]])].flat();assert.equal(G.reqOk(item),true);
  for(const req of [[36,101],[38,1],[37,1],[39,1]]){item.req=[req];assert.equal(G.reqOk(item),false);assert.ok(G.reqProblems(item).length);s.inv=[item];assert.throws(()=>engine.execute('equip',[item.uid],{}),/Chưa mặc được/);}
 });
});
test('auto follows an explicitly chosen weapon branch and a trained current branch',()=>{
 const s=character();context(s,()=>{
  s.sk[321]=1;s.main=321;s.mainLock=true;assert.equal(G.preferredWeaponCode(s),1);
  s.eq.weapon=G.makeItem(0,1,1,0);s.mainLock=false;assert.equal(G.preferredWeaponCode(s),1);
  s.sk={};assert.equal(G.preferredWeaponCode(s),G.FAC.shaolin.wcode);
 });
});
test('auto respects exact ranged subtype required by the selected client skill',()=>{
 const s=character('tangmen');context(s,()=>{
  for(const id of G.FAC.tangmen.skills){const skill=G.SK[id];if(!skill.enemy||skill.eqt<100)continue;s.sk[id]=1;s.main=id;s.mainLock=true;
   for(let k=0;k<3;k++)assert.equal(G.preferredWeaponItem(s,{d:1,k}),100+k===skill.eqt,skill.n+':'+k);
  }
 });
});
