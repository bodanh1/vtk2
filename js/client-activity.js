"use strict";
const CLIENT_ACTIVITY=window.JCLIENT_ACTIVITY||{buffs:{},bosses:[]};
// Visual skins keep the original encounter's stats, drops and NPC template.
for(const boss of CLIENT_ACTIVITY.bosses)W.anim[boss.key]=boss.anim;
const CLIENT_BOSS_BAGS=new WeakMap(),CLIENT_BOSS_FIRST=new Map();
function clientBossSkin(run){
 let bag=CLIENT_BOSS_BAGS.get(run);
 if(!bag||!bag.length){
  bag=CLIENT_ACTIVITY.bosses.slice();
  for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}
  const key=run.kind==='dungeon'?'dungeon:'+run.d?.id:run.kind||'tower';
  if(bag.length>1&&bag[0].key===CLIENT_BOSS_FIRST.get(key))[bag[0],bag[1]]=[bag[1],bag[0]];
  if(!CLIENT_BOSS_BAGS.has(run))CLIENT_BOSS_FIRST.set(key,bag[0].key);
  CLIENT_BOSS_BAGS.set(run,bag);
 }
 return bag.shift();
}
function clientActivityBoss(enemy,run){
 if(!run||enemy.cls!=="boss"||run.kind&&!["tower2","dungeon"].includes(run.kind)||!CLIENT_ACTIVITY.bosses.length)return enemy;
 const boss=clientBossSkin(run);
 enemy.clientAnimKey=boss.key;enemy.animKey=boss.key;return enemy;
}
function clientBuffList(){
 if(R.clientBuffs&&R.clientBuffFac===S.fac&&R.clientBuffSkills===S.sk)return R.clientBuffs;R.clientBuffFac=S.fac;R.clientBuffSkills=S.sk;
 const grouped={Foot:[],Body:[],Head:[]},wc=weaponCode(S.eq);
 for(const id of FAC[S.fac]?.skills||[]){const s=SK[id],fx=CLIENT_ACTIVITY.buffs[id];
  if(!fx||!S.sk[id]||!s||isAttack(s)||isCurse(s))continue;
  const level=skillLv(id);if(Object.keys(s.attr||{}).length&&!Object.entries(s.attr).some(([name])=>{const p=skVal(s,name,level);return p&&passiveApplies(s,name,p,wc)}))continue;
  grouped[fx.type]?.push({...fx,id});
 }
 // The native client provides two slots per location, rather than an unbounded particle list.
 R.clientBuffs=Object.values(grouped).flatMap(list=>list.sort((a,b)=>b.priority-a.priority||b.id-a.id).slice(0,2));return R.clientBuffs;
}
function drawClientBuffs(time,back){
 if(R.quiet||R.deadT>0||!S.fac)return;
 const low=giamHieuUng(),effects=clientBuffList();let reducedDrawn=false;
 for(const fx of effects){
  if(low&&(fx.type!=="Foot"||reducedDrawn))continue;
  const frame=Math.floor(time*1000/fx.ms)%fx.n,nativeFrame=Math.floor(frame*fx.originalFrames/fx.n);
  const behind=fx.type==="Foot"||fx.type==="Body"&&nativeFrame>=fx.backStart&&nativeFrame<fx.backEnd;
  if(behind!==back)continue;
  const mounted=fx.type!=="Foot"&&S.mounted&&typeof mountEquipped==="function"&&mountEquipped(S);
  drawFxSprite(fx,(H.dir||0)*2,low?0:time,H.x,H.y-(mounted?38*HERO_SCALE:0),true);
  reducedDrawn=true;
 }
}
