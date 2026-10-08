"use strict";
const TRAIN_BOT_MAX = 12;
const TRAIN_BOTS = { actors: new Map(), map: '' };
const BOT_FIRST = ['Thiên','Phong','Long','Hàn','Ngọc','Bạch','Vân','Lâm','Kiếm','Tiểu','Mộc','Tử'];
const BOT_LAST = ['Vũ','Ảnh','Phong','Tâm','Sơn','Hổ','Nguyệt','Long','Minh','Hà','Trúc','Yến'];
function botConfig() {
  if (!S.trainBots || typeof S.trainBots !== 'object') S.trainBots = { on:false, list:[] };
  const cfg = S.trainBots;
  if (!Array.isArray(cfg.list)) cfg.list = [];
  cfg.list = cfg.list.filter(b => b && typeof b.id === 'string' && FAC[b.fac]).slice(0, TRAIN_BOT_MAX);
  for (const b of cfg.list) {
    b.name = String(b.name || 'Thiếu Hiệp').slice(0, 16);
    b.lvl = clamp(Math.floor(+b.lvl || 1), 1, MAX_LEVEL);
    b.xp = Math.max(0, Number.isFinite(+b.xp) ? +b.xp : 0);
    b.kills = Math.max(0, Math.floor(+b.kills || 0));
  }
  return cfg;
}
function addTrainBot() {
  const cfg = botConfig();
  if (cfg.list.length >= TRAIN_BOT_MAX) return false;
  let name;
  do { name = BOT_FIRST[irnd(0,BOT_FIRST.length-1)] + BOT_LAST[irnd(0,BOT_LAST.length-1)] + irnd(10,99) } while (cfg.list.some(b=>b.name===name));
  const fac = Object.keys(FAC)[irnd(0,Object.keys(FAC).length-1)];
  cfg.list.push({id:crypto.randomUUID(),name,fac,sex:irnd(0,1),lvl:clamp(stageLevel(S.stage)+irnd(-2,2),1,MAX_LEVEL),xp:0,kills:0});
  return true;
}
const botsAvailable = () => S && S.fac && botConfig().on && !R.town && !R.tk && !R.tower && !S.siege && !SV.on;
function botActors() { return botsAvailable() ? [...TRAIN_BOTS.actors.values()] : [] }
function botsTick(dt) {
  if (!botsAvailable()) { TRAIN_BOTS.actors.clear(); return }
  const cfg = botConfig(), map = saveKey()+':'+S.stage;
  if (TRAIN_BOTS.map !== map) { TRAIN_BOTS.actors.clear(); TRAIN_BOTS.map=map }
  for (const id of TRAIN_BOTS.actors.keys()) if (!cfg.list.some(b=>b.id===id)) TRAIN_BOTS.actors.delete(id);
  for (const data of cfg.list) {
    let b = TRAIN_BOTS.actors.get(data.id);
    if (!b) {
      const [x,y] = obsSnap(...inWorld(H.x+rnd(-100,100),H.y+rnd(-100,100)));
      b={data,x,y,dir:0,face:1,act:'st',actT:0,cd:rnd(0,.8),hp:100,maxhp:100,deadT:0};
      TRAIN_BOTS.actors.set(data.id,b);
    }
    const effectiveLevel=Math.min(data.lvl,Math.max(1,stageLevel(S.stage)+2));
    const profileKey=S.mode+':'+effectiveLevel;
    if(b.profileKey!==profileKey){b.profile=botProfile(data,effectiveLevel);b.profileKey=profileKey;b.maxhp=b.profile.P.life;b.hp=b.maxhp}
    const oldX=b.x,oldY=b.y;
    b.cd=Math.max(0,b.cd-dt);
    if (b.deadT>0) { b.deadT-=dt; b.act='die'; if(b.deadT<=0){b.hp=b.maxhp;[b.x,b.y]=obsSnap(...inWorld(H.x+rnd(-80,80),H.y+rnd(-80,80)));b.act='st'} continue }
    const enemies=alive();
    const target=enemies.reduce((best,e)=>!best||Math.hypot(e.x-b.x,e.y-b.y)<Math.hypot(best.x-b.x,best.y-b.y)?e:best,null);
    if (target) {
      const distance=Math.hypot(target.x-b.x,target.y-b.y);
      b.dir=dirOf(target.x-b.x,target.y-b.y);b.face=target.x>=b.x?1:-1;
      if(distance>b.profile.attack.rad+target.r) obsSteer(b,target.x,target.y,150*b.profile.P.speed*dt);
      else {
        b.hp=Math.max(0,b.hp-Math.max(1,target.dmg*.25)*dt);
        if(b.hp<=0){b.deadT=5;b.act='die';b.actT=0;continue}
        if(b.cd<=0) {
          const attack=b.profile.attack;
          let damage=0;
          for(const el in attack.parts)damage+=applyPart(attack.parts[el]*(el==='poison'?.7:1),el,attack.series,target.series,target.res,75,attack.series5);
          damage=Math.max(1,damage);
          target.hp-=damage;target.hitT=.12;b.cd=1/Math.max(.2,attack.rate);b.act=SK[attack.id]&&SK[attack.id].phys===false?'mag':'at';b.actT=0;
          R.fx.push({k:'line',x1:b.x,y1:b.y-25,x2:target.x,y2:target.y-20,color:SERIES_COL[FAC[data.fac].series]||'#add',life:.15,max:.15});
          if(target.hp<=0) { target.botFinisher=data.id; botGainKill(data,target) }
        }
      }
    } else {
      b.hp=Math.min(b.maxhp,b.hp+b.profile.P.regen*dt);
      if(Math.hypot(H.x-b.x,H.y-b.y)>180) obsSteer(b,H.x,H.y,120*dt);
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
  label(b.x,b.y-(h?Math.min(h,90)*.9:58)-6,`${b.data.name} · Lv${b.profile?b.profile.state.lvl:b.data.lvl}`,'#8ddcff',11,b.hp/b.maxhp,'#57a9df');
}
function setBotPopulation(count) {
  const cfg=botConfig();
  if(count===0){cfg.on=false;TRAIN_BOTS.actors.clear()}
  else {while(cfg.list.length<count)addTrainBot();cfg.list=cfg.list.slice(0,count);cfg.on=true;TRAIN_BOTS.actors.clear()}
  save();trainBotsModal();
}
function trainBotsModal() {
  const cfg=botConfig();
  modal(`<h3>Nhân vật luyện cấp <small>${cfg.on?cfg.list.length+' đang hoạt động':'Đã tắt'}</small></h3>
    <p class="desc">Nhân vật tự cày cùng map, mặc đồ và dùng chiêu theo cấp. Khi lên cấp, trang bị và võ công phát triển dần. Chỉ hoạt động ở bãi train.</p>
    <div class="btnrow"><button class="btn ${cfg.on&&cfg.list.length===4?'on':''}" id="botsMedium">Trung bình · 4</button><button class="btn ${cfg.on&&cfg.list.length===10?'on':''}" id="botsMany">Nhiều · 10</button><button class="btn ${!cfg.on?'on':''}" id="botsOff">Tắt toàn bộ</button></div>
    <div class="botlist">${cfg.list.map(b=>`<div class="botrow"><b>${esc(b.name)}</b><small>${esc(FAC[b.fac].n)} · Cấp ${Math.min(b.lvl,Math.max(1,stageLevel(S.stage)+2))} · ${fmt(b.kills)} quái</small><small>${botEquipmentSummary(b)}</small></div>`).join('')||'<p class="desc">Chọn mật độ để tạo nhân vật có tên ngẫu nhiên.</p>'}</div>`,()=>{
      $('#botsMedium').onclick=()=>setBotPopulation(4);
      $('#botsMany').onclick=()=>setBotPopulation(10);
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
    for(const [slot,d] of [['weapon',FAC[data.fac].wcode>=5?1:0],['armor',2],['helm',7],['boots',5]]){
      const rows=(J.items[d]&&J.items[d].list||[]).filter(row=>(row.req||[]).every(([id,value])=>id!==36||value<=lvl)).sort((a,b)=>b.lvl-a.lvl);
      for(const row of rows){const it=makeItem(d,row.k,row.lvl,0);if(it&&sexOk(it)&&reqOk(it)&&(slot!=='weapon'||FAC[data.fac].wcode<0||weaponCode({weapon:it})===FAC[data.fac].wcode)){state.eq[slot]=it;break}}
    }
    const attacks=FAC[data.fac].skills.filter(id=>SK[id]&&SK[id].req<=lvl&&isAttack(SK[id])).sort((a,b)=>SK[b].req-SK[a].req);
    if(attacks.length){const id=attacks[0];state.sk[id]=Math.min(20,Math.max(1,Math.floor((lvl-SK[id].req)/3)+1),lvl);state.main=id;state.mainLock=true}
    const P=calc();return {state,P,attack:P.main};
  } finally {S=player}
}

function botEquipmentSummary(data){
  const level=Math.min(data.lvl,Math.max(1,stageLevel(S.stage)+2));
  const profile=botProfile(data,level);
  return esc((profile.state.eq.weapon?profile.state.eq.weapon.n:'Tay không')+' · '+(SK[profile.attack.id]?SK[profile.attack.id].n:'Đánh thường'));
}
