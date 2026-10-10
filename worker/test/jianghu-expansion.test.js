import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
function setup(){
  let day='2026-10-10',week='2026-10-05';const rewards=[];
  const c={S:{fac:'shaolin',lvl:200,knb:0,inv:[],rw:{stat:{reborn:5},fd:0}},R:{P:{life:100,mana:100},life:50,mana:50,kills:0,enemies:[]},SV:{on:false,shots:[],traps:[],picks:{1:5},info:{}},H:{x:0,y:0},INPUT:{},ACT_TABS:[],SK:{1:{n:'Test skill',ic:''}},INV_MAX:100,
    RW(){return c.S.rw;},today:()=>day,weekKey:()=>week,toast(){},save(){},log(){},esc:String,closeModal(){},backFromTown(){c.R.town=false;},updateTop(){},questTick(){},heal(v){c.R.life=Math.min(100,c.R.life+v);},MC:()=>({lab:true,hk:true}),grant(g){rewards.push(g);c.S.rw.fd+=g.fd||0;},horseShopGoods:()=>[],makeItem(){},addItem(){},dexMark(){},giftModal(){},document:{getElementById:()=>null,querySelectorAll:()=>[]},
    giftBody:()=>"",giftTab:"login",actBody:()=>null,actBind(){},towerSpawn(){},towerCleared(){},towerExit(){},tick(){},stallOut(){c.stalled=true;},heroHit:a=>a.parts.phys,onKill(){c.baseKills=(c.baseKills||0)+1;},svStart(){c.SV.on=true;},svOptions:()=>[{t:'all'}],svCard:()=>'',svApply(){c.applied=true;},svInfo:()=>({tot:100,rad:100,rate:1}),svCast(){c.SV.shots.push({pierce:1,life:1});return true;},svBarUpdate(){},
    ZONES:[{m:[0],boss:0}],rnd:(a,b)=>(a+b)/2,pick:a=>a[0],inWorld:(x,y)=>[x,y],makeEnemy:(tid,L,cls,x,y)=>({tid,L,cls,x,y,hp:100,max:100,dmg:10})};
  vm.createContext(c);vm.runInContext(fs.readFileSync('js/jianghu-expansion.js','utf8'),c);
  return {c,rewards,nextDay:()=>day='2026-10-11',nextWeek:()=>week='2026-10-12'};
}
test('dungeons grant only on completion, enforce daily limits and reset next day',()=>{
  const {c,nextDay}=setup();assert.equal(c.jhDungeonStart('dvc'),true);c.jhSpawn();c.onKill(c.R.enemies[0]);assert.equal(c.S.knb,0);assert.equal(c.baseKills,undefined);c.jhEnd();assert.equal(c.jhState().runs.dvc,undefined);
  for(let n=0;n<2;n++){assert.equal(c.jhDungeonStart('dvc'),true);c.R.tower.elapsed=20;for(let i=0;i<5;i++)c.jhClear();}
  assert.equal(c.jhState().runs.dvc,2);assert.equal(c.S.knb,6);assert.equal(c.jhDungeonStart('dvc'),false);nextDay();assert.equal(c.jhDungeonStart('dvc'),true);
});
test('timeout and leaving cannot farm rewards; daily rollover invalidates an old run',()=>{
  const {c,nextDay}=setup();c.jhDungeonStart('dvc');c.jhTick(121);assert.equal(c.R.tower,null);assert.equal(c.S.knb,0);assert.equal(c.jhState().runs.dvc,undefined);
  c.jhDungeonStart('dvc');nextDay();c.R.tower.floor=5;c.jhClear();assert.equal(c.S.knb,0);
});
test('Tower II unlock, first-clear rewards, retreat and advanced allocation stay isolated',()=>{
  const {c}=setup();c.S.rw.stat.reborn=4;assert.equal(c.jhTowerStart(),false);c.S.rw.stat.reborn=8;
  assert.equal(c.jhAddAdvanced('son'),true);assert.equal(c.jhAddAdvanced('thap'),true);assert.equal(c.jhAddAdvanced('khi'),true);assert.equal(c.jhAddAdvanced('son'),false);
  c.jhTowerStart();c.jhSpawn();assert.equal(c.R.enemies[0].L,200);assert.equal(c.heroHit({parts:{phys:100}},c.R.enemies[0]),102);
  c.jhClear();assert.equal(c.jhState().towerBest,1);const fd=c.S.rw.fd;c.R.tower.floor=1;c.jhClear();assert.equal(c.S.rw.fd,fd);
  c.R.tower.floor=25;c.towerExit(true);assert.equal(c.jhState().towerNext,15);assert.equal(c.heroHit({parts:{phys:100}},{jh:false}),100);
});
test('Phong Lang Do awards partial damage once, respects weekly allowance and its 180s timer',()=>{
  const {c,nextWeek}=setup();for(let i=0;i<3;i++){assert.equal(c.jhFerryStart(),true);c.jhSpawn();c.R.tower.boss.hp=c.R.tower.boss.max*.5;c.stallOut();assert.equal(c.stalled,undefined);c.jhTick(180);}
  assert.equal(c.S.knb,30);assert.equal(c.jhFerryStart(),false);nextWeek();assert.equal(c.jhFerryStart(),true);c.jhSpawn();c.jhTick(180);assert.equal(c.jhState().ferryRuns,0);
});
test('five-star evolutions change combat, reject duplicates and reset each training run',()=>{
  const {c}=setup();assert.equal(c.svOptions()[0].t,'evo');assert.equal(c.svApply({t:'evo',id:1,evo:'power'}),true);assert.equal(c.svInfo(1).tot,125);assert.equal(c.svApply({t:'evo',id:1,evo:'swift'}),false);
  c.svStart();assert.equal(c.svInfo(1).tot,100);c.svApply({t:'evo',id:1,evo:'swift'});assert.equal(c.svInfo(1).rate,1.2);
  c.svStart();c.svApply({t:'evo',id:1,evo:'reach'});c.svCast(1);assert.equal(c.svInfo(1).rad,125);assert.equal(c.SV.shots[0].pierce,2);
});

test("expanded controls open each new activity and close the controls panel",()=>{const {c}=setup();const nodes={jxOverflow:{classList:{add(name){this.hidden=name==="hidden";}}},jxMenu:{setAttribute(key,value){this[key]=value;}}};c.document.getElementById=id=>nodes[id]||null;let opens=0;c.giftModal=()=>opens++;for(const tab of ["tower2","dungeons","ferry"]){c.jhOpenActivity(tab);assert.equal(c.giftTab,tab);assert.equal(nodes.jxOverflow.classList.hidden,true);assert.equal(nodes.jxMenu["aria-expanded"],"false");}assert.equal(opens,3);const html=fs.readFileSync("index.html","utf8"),start=html.indexOf("id=\"jxOverflow\""),end=html.indexOf("</div>",start);for(const id of ["jxTower2","jxDungeons","jxFerry"])assert.ok(html.slice(start,end).includes(id));});

test("exit control dispatches the active mode and restores the farming map",()=>{for(const mode of ["tower","training","tk","siege"]){const {c}=setup();c.STAGES=100;c.zoneOf=()=>({id:7});c.onZoneChange=z=>c.restored=z.id;c.refresh=()=>{};c.tkExit=()=>{c.R.tk=null;};c.siegeExit=()=>{c.S.siege=null;};c.svExit=()=>{c.SV.on=false;};if(mode==="tower")c.R.tower={kind:"dungeon",d:{}};if(mode==="training")c.SV.on=true;if(mode==="tk")c.R.tk={};if(mode==="siege")c.S.siege={};c.S.stage=10;c.INPUT.target={};assert.equal(c.jhExitActivity(),true);assert.equal(c.restored,7);assert.equal(c.INPUT.target,null);assert.equal(c.jhExitActivity(),false);}});
