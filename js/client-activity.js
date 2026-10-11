"use strict";
const CLIENT_ACTIVITY=window.JCLIENT_ACTIVITY||{buffs:{},bosses:[]};
// Visual skins keep the original encounter's stats, drops and NPC template.
for(const boss of CLIENT_ACTIVITY.bosses)W.anim[boss.key]=boss.anim;
function clientActivityBoss(enemy,run){
 if(!run||enemy.cls!=="boss"||run.kind&&!["tower2","dungeon"].includes(run.kind)||!CLIENT_ACTIVITY.bosses.length)return enemy;
 const offset=run.kind==="dungeon"?JH_DUNGEONS.findIndex(d=>d.id===run.d?.id):Math.floor((run.floor||1)/5)-1+(run.kind==="tower2"?3:0);
 const boss=CLIENT_ACTIVITY.bosses[(Math.max(0,offset))%CLIENT_ACTIVITY.bosses.length];
 enemy.clientAnimKey=boss.key;enemy.animKey=boss.key;return enemy;
}
function clientBuffList(){
 if(R.clientBuffs)return R.clientBuffs;
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
