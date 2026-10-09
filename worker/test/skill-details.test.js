import fs from 'node:fs';import vm from 'node:vm';import test from 'node:test';import assert from 'node:assert/strict';
const source=fs.readFileSync('js/jxorig.js','utf8'),fn=source.slice(source.indexOf('function jxSkill(){'),source.indexOf('function wrap('));
test('native skill window starts with details hidden, toggles explicitly and forwards quick plus/minus separately',()=>{
let fr,aux,plus=0,minus=0,details=0;const tab={querySelector(selector){return{disabled:false,click(){if(selector.includes('.minus'))minus++;else if(selector.includes('.plus'))plus++;else details++;}};},append(){}};
const c={skillDetailsOpen:false,skPage:0,$:()=>tab,ready:()=>true,FAC:{test:{skills:[1]}},S:{fac:'test',sk:{1:1},skPts:2,lvl:20,slots:[]},SK:{1:{id:1,n:'Test',req:1,max:20,ic:''}},R:{P:{main:{id:1}}},rest(){aux={hidden:false};return[{},aux];},el(){return fr={listeners:{},addEventListener(n,f){this.listeners[n]=f},querySelectorAll:()=>[]};},isAttack:()=>true,isCurse:()=>false,canLearn:()=>true,E:String,T:()=>'',B:()=>'',hov(){},renderSkill(){}};
vm.createContext(c);vm.runInContext(fn,c);c.jxSkill();assert.equal(aux.hidden,true);assert.match(fr.innerHTML,/class="jxm"/);assert.match(fr.innerHTML,/class="jxp"/);
const click=target=>fr.listeners.click({target,stopPropagation(){}});
const toggle={dataset:{c:'Details'},setAttribute(){}};click({closest:s=>s==='button'?toggle:null});assert.equal(aux.hidden,false);c.jxSkill();assert.equal(aux.hidden,false);
for(const isMinus of [false,true])click({closest:s=>s==='.jxp,.jxm'?{dataset:{id:'1'},classList:{contains:()=>isMinus}}:null});assert.equal(plus,1);assert.equal(minus,1);assert.equal(details,0);
click({closest:s=>s==='button'?{dataset:{id:'1'}}:null});assert.equal(details,1);assert.equal(c.S.sk[1],1);
});
test('clicking a learned attack row opens information without changing the main skill',()=>{
const ui=fs.readFileSync('js/ui.js','utf8'),start=ui.indexOf('document.querySelectorAll("#t-skill .skl").forEach'),end=ui.indexOf('function renderInvFilters',start);const handler=ui.slice(start,end-1),row={dataset:{id:'2'}};let opened;
const c={document:{querySelectorAll:()=>[row]},skillModal:id=>opened=id,S:{main:1,mainLock:false,sk:{2:10}}};vm.createContext(c);vm.runInContext(handler,c);row.onclick();assert.equal(opened,2);assert.equal(c.S.main,1);assert.equal(c.S.mainLock,false);
});
