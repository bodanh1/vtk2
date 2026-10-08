"use strict";
const TRAIN_BOT_MAX = 12;
const TRAIN_BOTS = { actors: new Map(), map: '' };
const BOT_NAMES = ['Lệnh Hồ Xung','Đông Phương Bại','Độc Cô Cầu Bại','Dương Quá','Tiểu Long Nữ','Quách Tĩnh','Hoàng Dung','Trương Vô Kỵ','Triệu Mẫn','Chu Chỉ Nhược','Kiều Phong','Đoàn Dự','Hư Trúc','Vương Ngữ Yên','Nhậm Doanh Doanh','Vi Tiểu Bảo','Lục Tiểu Phụng','Hoa Mãn Lâu','Sở Lưu Hương','Lý Tầm Hoan','A Phi','Tây Môn Xuy Tuyết','Ăn Mì Đánh Quái','Đại Hiệp Hết Tiền','Kiếm Sĩ Mất Dép','Bún Bò Đại Hiệp','Lão Hạc Cầm Kiếm','Cày Thuê Trả Nợ','Bang Chủ Ngủ Gật','Thánh Né Deadline','Độc Cô Ăn Vạ','Hết Mana Rồi','Một Đấm Ăn Cơm','Đang Đợi Lương','Sư Phụ Mất Wifi','Kiếm Khách Ăn Hành','Tiểu Nhị Bán Bún','Chưởng Môn Sợ Vợ','Đại Ca Bán Cá','Cô Nương Ăn Lẩu'];
const BOT_FIRST = ['Thiên','Phong','Long','Hàn','Ngọc','Bạch','Vân','Lâm','Kiếm','Tiểu','Mộc','Tử'];
const BOT_LAST = ['Vũ','Ảnh','Phong','Tâm','Sơn','Hổ','Nguyệt','Long','Minh','Hà','Trúc','Yến'];
function botConfig() {
  if (!S.trainBots || typeof S.trainBots !== 'object') S.trainBots = { on:false, list:[] };
  const cfg = S.trainBots;
  if (!Array.isArray(cfg.list)) cfg.list = [];
  cfg.list = cfg.list.filter(b => b && typeof b.id === 'string' && FAC[b.fac]).slice(0, TRAIN_BOT_MAX);
  for (const b of cfg.list) {
    if(!b.name||/\d$/.test(b.name))b.name=botRandomName(cfg.list.filter(other=>other!==b));
    b.name = String(b.name).slice(0, 20);
    b.lvl = clamp(Math.floor(+b.lvl || 1), 1, MAX_LEVEL);
    b.xp = Math.max(0, Number.isFinite(+b.xp) ? +b.xp : 0);
    b.kills = Math.max(0, Math.floor(+b.kills || 0));
  }
  return cfg;
}
function addTrainBot() {
  const cfg = botConfig();
  if (cfg.list.length >= TRAIN_BOT_MAX) return false;
  const name=botRandomName(cfg.list);
  const fac = Object.keys(FAC)[irnd(0,Object.keys(FAC).length-1)];
  cfg.list.push({id:crypto.randomUUID(),name,fac,sex:irnd(0,1),lvl:clamp(stageLevel(S.stage)+irnd(-2,2),1,MAX_LEVEL),xp:0,kills:0});
  return true;
}
const botsAvailable = () => S && S.fac && botConfig().on && !R.town && !R.tk && !R.tower && !S.siege && !SV.on;
function botActors() { return botsAvailable() ? [...TRAIN_BOTS.actors.values()] : [] }
function botsTick(dt) {
  if (!botsAvailable()) { TRAIN_BOTS.actors.clear();R.enemies=R.enemies.filter(e=>!e.botWild); return }
  const cfg = botConfig(), map = saveKey()+':'+S.stage;
  if (TRAIN_BOTS.map !== map) { TRAIN_BOTS.actors.clear();R.enemies=R.enemies.filter(e=>!e.botWild); TRAIN_BOTS.map=map }
  for (const id of TRAIN_BOTS.actors.keys()) if (!cfg.list.some(b=>b.id===id)) TRAIN_BOTS.actors.delete(id);
  const claimed = new Set();
  for (const [index,data] of cfg.list.entries()) {
    let b = TRAIN_BOTS.actors.get(data.id);
    if (!b) {
      const cols=Math.ceil(Math.sqrt(cfg.list.length)),rows=Math.ceil(cfg.list.length/cols);
      const [homeX,homeY]=obsSnap(...inWorld(WORLD.w*(.12+.76*((index%cols)+.5)/cols),WORLD.h*(.12+.76*(Math.floor(index/cols)+.5)/rows)));
      const [x,y] = obsSnap(...inWorld(homeX+rnd(-60,60),homeY+rnd(-60,60)));
      b={data,x,y,homeX,homeY,patrol:null,patrolT:0,targetId:null,spawnT:0,skillIndex:0,dir:0,face:1,act:'st',actT:0,cd:rnd(0,.8),hp:100,maxhp:100,deadT:0};
      TRAIN_BOTS.actors.set(data.id,b);
    }
    const effectiveLevel=Math.min(data.lvl,Math.max(1,stageLevel(S.stage)+2));
    const profileKey=S.mode+':'+effectiveLevel;
    if(b.profileKey!==profileKey){b.profile=botProfile(data,effectiveLevel);b.profileKey=profileKey;b.maxhp=b.profile.P.life;b.hp=b.maxhp;b.mana=b.profile.P.mana}
    const oldX=b.x,oldY=b.y;
    b.cd=Math.max(0,b.cd-dt);
    b.mana=Math.min(b.profile.P.mana,b.mana+b.profile.P.manaRegen*dt);
    b.spawnT-=dt;
    if(b.spawnT<=0){
      b.spawnT=rnd(3,6);
      if(R.enemies.filter(e=>e.botWild===data.id&&!e.dead&&e.hp>0).length<2){
        const zone=zoneOf(S.stage),angle=rnd(0,Math.PI*2);
        const [x,y]=inWorld(b.x+Math.cos(angle)*180,b.y+Math.sin(angle)*180);
        const e=makeEnemy(pick(zone.m),stageLevel(S.stage),'normal',x,y);e.botWild=data.id;R.enemies.push(e);
      }
    }
    if (b.deadT>0) { b.deadT-=dt; b.act='die'; if(b.deadT<=0){b.hp=b.maxhp;[b.x,b.y]=obsSnap(...inWorld(b.homeX+rnd(-80,80),b.homeY+rnd(-80,80)));b.act='st'} continue }
    const enemies=alive().filter(e=>!claimed.has(e.id)&&Math.hypot(e.x-b.homeX,e.y-b.homeY)<650);
    b.patrolT-=dt;
    const target=enemies.reduce((best,e)=>!best||Math.hypot(e.x-b.x,e.y-b.y)<Math.hypot(best.x-b.x,best.y-b.y)?e:best,null);
    b.targetId=target?target.id:null;
    if (target) {
      claimed.add(target.id);
      const attack=botSelectAttack(b);
      const distance=Math.hypot(target.x-b.x,target.y-b.y);
      b.dir=dirOf(target.x-b.x,target.y-b.y);b.face=target.x>=b.x?1:-1;
      if(distance>attack.rad+target.r) obsSteer(b,target.x,target.y,150*b.profile.P.speed*dt);
      else {
        if(b.hp<=0){b.deadT=5;b.act='die';b.actT=0;continue}
        if(b.cd<=0) {
          b.mana=Math.max(0,b.mana-attack.cost);
          b.skillIndex++;
          const center=attack.around?b:target,splash=attack.around?attack.rad+40:110;
          const victims=[target,...alive().filter(e=>e!==target&&Math.hypot(e.x-center.x,e.y-center.y)<(attack.targets>1?splash:0)).slice(0,attack.targets-1)];
          for(const victim of victims){botSkillHit(b,attack,victim);skillFx(b,victim,attack)}
          b.cd=1/Math.max(.2,attack.rate);b.act=heroAttackAction(attack)||'at';b.actT=0;
          const length=typeof dollActLen==='function'?dollActLen(b.profile.state,b.act):0;
          b.actK=length>0?Math.min(3,Math.max(1,length/(.9/attack.rate))):1;

        }
      }
    } else {
      b.hp=Math.min(b.maxhp,b.hp+b.profile.P.regen*dt);
      if(!b.patrol||b.patrolT<=0||Math.hypot(b.patrol.x-b.x,b.patrol.y-b.y)<25){
        const angle=rnd(0,Math.PI*2),radius=rnd(100,320);
        const [x,y]=obsSnap(...inWorld(b.homeX+Math.cos(angle)*radius,b.homeY+Math.sin(angle)*radius));
        b.patrol={x,y};b.patrolT=rnd(4,8);
      }
      obsSteer(b,b.patrol.x,b.patrol.y,120*b.profile.P.speed*dt);
    }
    b.moving=Math.hypot(b.x-oldX,b.y-oldY)>.01;
    if(b.moving)b.dir=dirOf(b.x-oldX,b.y-oldY);
  }
}
function botGainKill(b,e) {
  b.kills++;
  b.xp+=expFor(e.L)*(e.cls==='boss'?5:e.cls==='elite'?2:1)*modeXpMul()/xpSlow(b.lvl);
  while(b.lvl<MAX_LEVEL&&b.xp>=expNeed(b.lvl)){b.xp-=expNeed(b.lvl);b.lvl++}
}
function drawTrainBot(b,dt) {
  const c=CX,hw=W.hero[b.data.fac];
  c.fillStyle='#0007';c.beginPath();c.ellipse(b.x,b.y,16,6,0,0,7);c.fill();
  b.animKey=hw&&hw.anim;stepAct(b,dt,b.deadT>0?'die':b.moving?'run':'st');
  const dollHeight=typeof drawDoll==='function'?drawDoll(c,b.x,b.y,b.act||'st',b.dir||0,b.actT||0,HERO_DOLL_SCALE,b.deadT>0?.4:1,b.profile&&b.profile.state):0;
  const h=dollHeight||hw&&drawAnim(hw.anim,b.act||'st',b.dir||0,b.actT||0,b.x,b.y,HERO_SCALE,b.deadT>0?.4:1);
  if(!h&&hw)drawSprite(img(hw.img),hw.sz,b.x,b.y,.9,b.face<0);
  label(b.x,b.y-(h?Math.min(h,90)*.9:58)-6,`${b.data.name} · Lv${b.profile?b.profile.state.lvl:b.data.lvl}`,NAME_COL.hero,12,b.hp/b.maxhp,'#4fd04f');
}
function setBotPopulation(count) {
  count=clamp(Math.floor(count),0,TRAIN_BOT_MAX);
  const cfg=botConfig();
  if(count===0){cfg.on=false;TRAIN_BOTS.actors.clear()}
  else {while(cfg.list.length<count)addTrainBot();cfg.list=cfg.list.slice(0,count);cfg.on=true;TRAIN_BOTS.actors.clear()}
  save();trainBotsModal();
}
function trainBotsModal() {
  const cfg=botConfig(),count=cfg.on?cfg.list.length:0;
  modal(`<h3>Nhân vật luyện cấp <small>${count} đang hoạt động</small></h3>
    <p class="desc">Nhân vật tự cày cùng map, mặc đồ và dùng chiêu theo cấp. Khi lên cấp, trang bị và võ công phát triển dần. Chỉ hoạt động ở bãi train.</p>
    <div class="btnrow"><button class="btn" id="botsAdd" ${count>=TRAIN_BOT_MAX?'disabled':''}>+1 bot</button><button class="btn" id="botsReduce" ${count===0?'disabled':''}>−1 bot</button><button class="btn ${!cfg.on?'on':''}" id="botsOff" ${count===0?'disabled':''}>Tắt toàn bộ</button></div>
    <p class="desc">Số bot đang hoạt động: <b>${count}</b> / ${TRAIN_BOT_MAX}</p>`,()=>{
      $('#botsAdd').onclick=()=>setBotPopulation(count+1);
      $('#botsReduce').onclick=()=>setBotPopulation(count-1);
      $('#botsOff').onclick=()=>setBotPopulation(0);
    });
}

function botProfile(data,lvl) {
  const player=S;
  try {
    const state=newSave();state.fac=data.fac;state.sex=data.sex;state.mode=player.mode;state.name=data.name;state.lvl=lvl;
    const pts=(lvl-1)*PTS_PER_LEVEL;
    state.attr={str:Math.floor(pts*.4),dex:Math.floor(pts*.2),vit:Math.floor(pts*.3),eng:Math.floor(pts*.1)};
    state.eq={};state.sk={};state.main=0;S=state;
    for(const [slot,d] of [['weapon',0],['armor',2],['helm',7],['boot',5]]){
      const groups=slot==='weapon'?[0,1]:[d];
      const rows=groups.flatMap(itemD=>(J.items[itemD]&&J.items[itemD].list||[]).map(row=>({...row,itemD}))).filter(row=>row.lvl<=Math.min(10,Math.floor(lvl/10)+1)&&(row.req||[]).every(([id,value])=>id!==36||value<=lvl)).sort((a,b)=>b.lvl-a.lvl);
      for(const row of rows){const it=makeItem(row.itemD,row.k,row.lvl,Math.min(MC().rarMax,lvl<20?0:lvl<50?1:lvl<90?2:3));if(it&&sexOk(it)&&reqOk(it)&&(slot!=='weapon'||FAC[data.fac].wcode<0||weaponCode({weapon:it})===FAC[data.fac].wcode)){it.enh=Math.min(ENH_MAX,Math.max(0,Math.floor((lvl-30)/20)));state.eq[slot]=it;break}}
    }
    const attacks=FAC[data.fac].skills.filter(id=>SK[id]&&SK[id].req<=lvl&&isAttack(SK[id])).sort((a,b)=>SK[b].req-SK[a].req);
    let budget=lvl;
    for(const id of attacks.slice(0,4)){if(budget<=0)break;const points=Math.min(20,Math.max(1,Math.floor((lvl-SK[id].req)/3)+1),Math.max(1,Math.ceil(budget/(4-Object.keys(state.sk).length))));state.sk[id]=points;budget-=points}
    if(attacks.length){state.main=attacks[0];state.mainLock=true}
    const P=calc();return {state,P,attack:P.main};
  } finally {S=player}
}

function botRandomName(list){
  const available=BOT_NAMES.filter(name=>!list.some(b=>b.name===name));
  if(available.length)return pick(available);
  let name;do{name=pick(BOT_FIRST)+' '+pick(BOT_LAST)}while(list.some(b=>b.name===name));return name;
}
function botSelectAttack(b){
  const attacks=b.profile.P.actives;
  for(let i=0;i<attacks.length;i++){const attack=attacks[(b.skillIndex+i)%attacks.length];if(b.mana>=attack.cost)return attack}
  return b.profile.P.basic;
}
function botSkillHit(b,a,e){
  const P=b.profile.P;
  if(a.useAR&&Math.random()*100>=hitPercent(P.ar,Math.max(0,e.def-(P.curseDef||0)),a.ignore))return;
  const crit=Math.random()*100<a.crit;let total=0;
  for(const el in a.parts){
    const res={...e.res};for(const key in res)if(P.ignRes&&P.ignRes[key])res[key]*=1-P.ignRes[key]/100;
    let damage=applyPart(a.parts[el]*rnd(.85,1.15),el,a.series,e.series,res,75,a.series5);
    if(el==='poison'){const left=e.poison>0?e.poisonDmg*e.poison:0;e.poisonDmg=(left+damage)/POISON_TIME;e.poison=POISON_TIME;e.botPoisonOwner=b.data.id;continue}
    if(crit&&el==='phys')damage*=CRIT_MULT;
    total+=damage;
  }
  if(counters(a.series,e.series))total+=P.series5||0;
  if(e.cls!=='normal'&&P.bossDmg>1)total*=P.bossDmg;
  total=Math.max(1,total);e.hp-=total;e.hitT=.12;
  if(a.stun&&!(e.stunImm>0)&&Math.random()*100<a.stun){e.stun=e.cls==='boss'?.5:.8;e.stunImm=e.cls==='boss'?STUN_IMM_BOSS:e.cls==='elite'?STUN_IMM_ELITE:0}
  b.hp=Math.min(b.maxhp,b.hp+total*(P.leech||0)/100);b.mana=Math.min(P.mana,b.mana+total*(P.manaLeech||0)/100);
  if(e.hp<=0)e.botFinisher=b.data.id;
  addText(e.x,e.y-e.r-6,fmt(total),crit?'#ffe14a':skillFxColor(a),crit?16:12);
}
function nearestTrainBot(e){
  if(!botsAvailable())return null;
  let best=null,distance=Math.hypot(H.x-e.x,H.y-e.y);
  for(const b of TRAIN_BOTS.actors.values()){if(b.deadT>0||b.hp<=0||!b.profile)continue;const d=Math.hypot(b.x-e.x,b.y-e.y);if(d<distance){best=b;distance=d}}
  return best;
}
function botEnemyHit(e,b,ultimate=false){
  const P=b.profile.P;
  if(!ultimate&&Math.random()*100>=hitPercent(e.ar,P.def))return;
  if(P.block&&Math.random()*100<P.block)return;
  let damage=applyPart(ultimate?P.life*.3:e.dmg*rnd(.8,1.2),'phys',e.series,P.series,P.res,PLAYER_RES_MAX,10);
  damage=Math.max(1,damage*(1-(P.absorb||0))-(P.flatDR||0));
  b.hp-=damage;addText(b.x,b.y-36,'-'+fmt(damage),'#ff6a5a',12);
  if(b.hp<=0){b.hp=0;b.deadT=5;b.act='die';b.actT=0;b.targetId=null}
}
function botKillCredit(e){
  if(!e.botFinisher)return;
  const data=botConfig().list.find(b=>b.id===e.botFinisher);
  if(data)botGainKill(data,e);
}
