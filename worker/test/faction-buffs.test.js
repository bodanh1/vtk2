import fs from 'node:fs';import vm from 'node:vm';import test from 'node:test';import assert from 'node:assert/strict';import {GAME as G} from '../gen/game.js';
const engine=G.economyEngine;
function character(fac){const s=engine.create({fac,mode:'g2',name:'Buff test',cid:'buff-test'});s.lvl=100;s.autoPts=false;s.sk={};return s;}
function context(s,fn){return engine.context({slots:[s,null,null],shared:{}},0,Date.now(),null,fn).result;}
test('foreign buffs, passives and curses do not change stats for any faction',()=>{
 const nonAttacks=Object.values(G.SK).filter(s=>s&&s.id&&s.attr&&Object.keys(s.attr).length);
 for(const [fac,f]of Object.entries(G.FAC)){const s=character(fac),baseline=context(s,()=>G.calc());
  for(const skill of nonAttacks)if(!f.skills.includes(skill.id))s.sk[skill.id]=Math.min(20,skill.max||1);
  const result=context(s,()=>G.calc());assert.deepEqual(result.A,baseline.A,fac);for(const key of ['life','mana','regen','manaRegen','aspd','speed','curseDR','manaShield'])assert.equal(result[key],baseline[key],fac+':'+key);
 }
});
test('own Nga My buff still applies, and foreign skill cannot be learned',()=>{
 const s=character('emei'),baseline=context(s,()=>G.calc());s.sk[92]=20;const own=context(s,()=>G.calc());assert.notDeepEqual(own.A,baseline.A);
 const other=character('shaolin');other.skPts=100;const before=other.skPts;
 const source=fs.readFileSync('js/stats.js','utf8'),c={FAC:G.FAC,S:other};vm.createContext(c);vm.runInContext(source.slice(source.indexOf('const FACTION_SKILL_IDS'),source.indexOf('function addAttr'))+source.slice(source.indexOf('function canLearn('),source.indexOf('const NORM_TIERS')),c);assert.equal(c.canLearn(G.SK[92]),false);assert.equal(c.canLearn(G.SK[15]),true);assert.equal(other.skPts,before);
});
test('Dọn kho pays ordinary sale value for all unlocked items, including horses, rare and manually kept gear',()=>{
 const source=fs.readFileSync('js/ui.js','utf8'),start=source.indexOf('function clearInventory()'),end=source.indexOf('\n',start),locked={uid:'locked',locked:true,value:900};
 const c={S:{gold:55,inv:[{uid:1,value:10,r:0},{uid:2,value:20,r:5,set:{}},{uid:3,value:30,d:10,manualKeep:true},{uid:4,value:40,vio:true,enh:12},locked],eq:{weapon:{uid:'equipped'}}},itemValue:it=>it.value,fmtMoney:String,invDirty:false};vm.createContext(c);vm.runInContext(source.slice(start,end),c);
 const equipped=c.S.eq.weapon,result=c.clearInventory();assert.equal(result.n,4);assert.equal(result.gold,100);assert.equal(c.S.gold,155);assert.deepEqual(c.S.inv,[locked]);assert.equal(c.S.eq.weapon,equipped);assert.equal(c.clearInventory().gold,0);assert.equal(c.S.gold,155);
});
