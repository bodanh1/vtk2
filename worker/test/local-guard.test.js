import fs from 'node:fs';import vm from 'node:vm';import test from 'node:test';import assert from 'node:assert/strict';
const source=fs.readFileSync('js/local-guard.js','utf8'),base='https://game.test/';
function setup(){
 class Storage{constructor(){this.values=new Map();}setItem(k,v){this.values.set(String(k),String(v));}removeItem(k){this.values.delete(String(k));}clear(){this.values.clear();}getItem(k){return this.values.get(String(k))??null;}}
 const c={Storage,localStorage:new Storage(),performance:{now:()=>10000},document:{scripts:[{src:base+'js/local-guard.js?v=116'},{src:base+'game.js'},{src:base+'js/cloud-account.js'}],currentScript:{src:base+'js/local-guard.js?v=116'}},toast(){}};c.window=c;vm.createContext(c);vm.runInContext(source,c,{filename:base+'js/local-guard.js?v=116'});
 const run=(s,file=base+'game.js')=>vm.runInContext(s,c,{filename:file});
 run('var S; S={gold:100,xp:10,knb:5,lvl:1,speed:1,attrPts:2,skPts:3,stage:1,maxStage:1,totalKills:0,inv:[],eq:{},attr:{str:1},sk:{1:1},fac:"shaolin"};');return{c,run};
}
test('native gains, purchases, item moves and account installs retain ordinary JSON saves',()=>{
 const {c,run}=setup();run('S.gold+=25;S.xp+=5;S.knb-=1;S.speed=2;S.attr.str++;S.sk[2]=1;S.inv.push({uid:1});S.eq.weapon=S.inv.pop();localStorage.setItem("jxidle",JSON.stringify(S));');
 assert.equal(c.S.gold,125);assert.equal(c.S.xp,15);assert.equal(c.S.knb,4);assert.equal(c.S.eq.weapon.uid,1);assert.equal(c.S.attr.str,2);assert.equal(JSON.parse(c.localStorage.getItem('jxidle')).gold,125);
 run('S=JSON.parse(localStorage.getItem("jxidle"));S.gold+=5;',base+'js/cloud-account.js');assert.equal(c.S.gold,130);
});
test('console cannot overwrite currency, state, attributes, bag or local save',()=>{
 const {c,run}=setup();run('localStorage.setItem("jxidle","previous");');
 run('S.gold=999999;S.xp=888;S.knb=777;S.speed=10;S.attr.str=999;S.sk[1]=999;S.inv.push({uid:99});S.eq.weapon={uid:99};S={gold:999};localStorage.setItem("jxidle","hacked");localStorage.removeItem("jxidle");localStorage.clear();','console');
 assert.equal(c.S.gold,100);assert.equal(c.S.xp,10);assert.equal(c.S.knb,5);assert.equal(c.S.speed,1);assert.equal(c.S.attr.str,1);assert.equal(c.S.sk[1],1);assert.equal(c.S.inv.length,0);assert.equal(c.S.eq.weapon,undefined);assert.equal(c.localStorage.getItem('jxidle'),'previous');
 assert.throws(()=>run('Object.defineProperty(S.inv,"0",{value:{uid:88}});','console'));assert.equal(c.S.inv.length,0);
});
test('unlisted scripts are blocked; invalid numerical values cannot enter the live state',()=>{
 const {c,run}=setup();run('S.gold=456;','https://other.test/hack.js');assert.equal(c.S.gold,100);
 run('S.gold=Infinity;S.xp=NaN;S.knb=-1;S.speed=3;');assert.equal(c.S.gold,100);assert.equal(c.S.xp,10);assert.equal(c.S.knb,5);assert.equal(c.S.speed,1);
});
test('calling an ordinary game reward function from console still cannot mint currency',()=>{
 const {c,run}=setup();run('function testReward(n){S.gold+=n;}');run('testReward(999999);','console');assert.equal(c.S.gold,100);run('testReward(5);');assert.equal(c.S.gold,105);
});
test('Safari stack format supports known script calls without requiring V8 format',()=>{
 const {c}=setup();const real=c.Error;c.Error=function(){return{stack:'trusted@https://game.test/game.js:1:2'};};
 // Constructor is captured at startup; test Safari by starting a fresh context.
 const s={...c,Error:c.Error};s.window=s;s.document=c.document;s.localStorage=new c.Storage();vm.createContext(s);vm.runInContext(source,s,{filename:base+'js/local-guard.js?v=116'});s.S={gold:7,xp:0,inv:[],eq:{},attr:{},sk:{}};s.S.gold=8;assert.equal(s.S.gold,8);c.Error=real;
});
