"use strict";
// Independently implemented activities; reuse the H5 combat, assets and save format.
const JH_DUNGEONS = [
  {id:"dvc",n:"Dược Vương Cốc",lv:20,rooms:5,limit:120,fd:8,knb:2},
  {id:"tbk",n:"Thiên Bảo Khố",lv:50,rooms:6,limit:150,fd:12,knb:3},
  {id:"lal",n:"Lâm An Hoàng Lăng",lv:80,rooms:7,limit:210,fd:18,knb:4},
  {id:"pdq",n:"Phong Đô Quỷ Thành",lv:110,rooms:7,limit:240,fd:22,knb:5},
  {id:"kct",n:"Kiếm Các Thục Đạo",lv:140,rooms:8,limit:270,fd:26,knb:6},
  {id:"mcb",n:"Mạc Cao Bí Cảnh",lv:170,rooms:8,limit:300,fd:30,knb:7},
  {id:"hsl",n:"Hoa Sơn Luận Kiếm",lv:180,rooms:9,limit:330,fd:35,knb:8}
];
const JH_ADVANCED = [
  {k:"son",n:"Khai Sơn",d:"Mỗi điểm +2% sát thương trong Tháp II."},
  {k:"thap",n:"Hộ Tháp",d:"Mỗi điểm giảm 1% sát thương nhận trong Tháp II."},
  {k:"khi",n:"Hồi Khí",d:"Mỗi điểm thêm 2% hồi sinh lực khi qua tầng Tháp II."}
];
function jhInt(value,max=Number.MAX_SAFE_INTEGER){return Math.min(max,Math.max(0,Math.floor(Number(value)||0)));}
function jhState(){
  const r=RW();r.jianghu=r.jianghu||{};const j=r.jianghu;
  j.records=j.records||{};j.advanced=j.advanced||{};
  if(j.day!==today()){j.day=today();j.runs={};}j.runs=j.runs||{};
  if(j.week!==weekKey()){j.week=weekKey();j.towerTries=0;j.ferryRuns=0;}
  return j;
}
function jhAdvanced(){const j=jhState(),limit=jhInt(RW().stat.reborn-5,5);let left=limit;const out={};for(const a of JH_ADVANCED){out[a.k]=Math.min(left,jhInt(j.advanced[a.k],5));left-=out[a.k];}return {...out,left};}
function jhAddAdvanced(key){const a=jhAdvanced();if(!a.left||!JH_ADVANCED.some(x=>x.k===key))return false;jhState().advanced[key]=a[key]+1;save();return true;}
function jhBusy(){return !!(R.tower||R.tk||S.siege||SV.on||R.deadT>0);}
function jhBegin(kind,extra){
  if(!S?.fac)return false;
  if(jhBusy()){toast("Hãy kết thúc hoạt động hiện tại trước.");return false;}
  if(R.town)backFromTown();R.tower={kind,floor:1,elapsed:0,...extra};
  R.enemies=[];R.corpses=[];R.ground=[];R.pickTarget=null;R.moveTo=null;INPUT.target=null;R.spawnT=.4;R.stall=0;
  closeModal(true);save();return true;
}
function jhDungeonStart(id){const d=JH_DUNGEONS.find(x=>x.id===id),j=jhState();if(!d||S.lvl<d.lv||jhInt(j.runs[id])>=2)return false;return jhBegin("dungeon",{d,day:j.day,limit:d.limit});}
function jhTowerStart(){const j=jhState();if(RW().stat.reborn<5||jhInt(j.towerBest)>=2000||jhInt(j.towerTries)>=1000)return false;if(!jhBegin("tower2",{floor:Math.max(1,jhInt(j.towerNext)||jhInt(j.towerBest)+1)}))return false;j.towerTries=jhInt(j.towerTries)+1;save();return true;}
function jhFerryStart(){const j=jhState();if(S.lvl<75||jhInt(j.ferryRuns)>=3)return false;return jhBegin("ferry",{week:j.week,limit:180});}
function jhEnd(reason="Đã rời hoạt động"){
  const run=R.tower;if(!run?.kind)return;
  if(run.kind==="tower2")jhState().towerNext=Math.max(1,run.floor-10);
  R.tower=null;R.enemies=[];R.corpses=[];R.moveTo=null;R.pickTarget=null;R.stall=0;S.wave=1;R.spawnT=.5;R.zoneShown=null;
  log(esc(reason));save();
}
function jhSpawn(){
  const run=R.tower;if(!run?.kind)return false;
  const isTower=run.kind==="tower2",isFerry=run.kind==="ferry",boss=isFerry||isTower&&run.floor%5===0||!isTower&&run.floor===run.d.rooms;
  const level=isTower?Math.round(200+(run.floor-1)*125/1999):isFerry?Math.max(75,S.lvl):run.d.lv+Math.min(10,run.floor);
  const z=ZONES[Math.min(ZONES.length-1,Math.floor(level/12))],count=boss?1:Math.min(6,3+run.floor%3);
  const a=jhAdvanced(),mult=isTower?1.5+run.floor*.025:isFerry?45:boss?6:1.2;
  R.enemies=[];R.stall=0;
  for(let i=0;i<count;i++){const [x,y]=inWorld(H.x+rnd(-180,180),H.y+rnd(-150,150)),e=makeEnemy(boss?z.boss:pick(z.m),level,boss?"boss":"elite",x,y);e.hp=e.max=e.max*mult;e.dmg*=isTower?(1+run.floor*.012)*(1-.01*a.thap):isFerry?1.3:1.1;e.jh=true;R.enemies.push(e);}
  if(isFerry)run.boss=R.enemies[0];
  R.banner={t:2,text:isTower?`Tháp II · tầng ${run.floor}`:isFerry?"Phong Lăng Độ":`${run.d.n} · phòng ${run.floor}/${run.d.rooms}`,sub:run.limit?`Giới hạn ${run.limit} giây`:"Điểm nâng cao chỉ có tác dụng trong Tháp II"};return true;
}
function jhReward(fd,knb,why){grant({fd},why);S.knb=jhInt(S.knb)+knb;updateTop();}
function jhClear(){
  const run=R.tower,j=jhState();if(!run?.kind)return false;
  if(run.kind==="tower2"){
    if(run.floor>jhInt(j.towerBest)){j.towerBest=run.floor;jhReward(run.floor%5===0?8:2,0,`Tháp II tầng ${run.floor}`);questTick("tower");if(run.floor>=50&&run.floor%10===0&&Math.random()<.02)grant({set:1},"Tháp II · đồ bộ hiếm");}
    j.towerNext=run.floor+1;
    if(run.floor>=2000){jhEnd("Chinh phục đủ 2000 tầng Tháp II!");j.towerNext=2000;save();return true;}
    heal(R.P.life*(.3+.02*jhAdvanced().khi),true);R.mana=Math.min(R.P.mana,R.mana+R.P.mana*.3);run.floor++;R.spawnT=1;save();return true;
  }
  if(run.kind==="ferry"){jhFerryFinish(true);return true;}
  if(run.floor<run.d.rooms){run.floor++;R.spawnT=.6;heal(R.P.life*.15,true);return true;}
  // Only a completed run earns rewards or consumes its daily allowance.
  if(run.day!==j.day||jhInt(j.runs[run.d.id])>=2){jhEnd("Phó bản kết thúc, lượt ngày đã thay đổi.");return true;}
  const d=run.d,rank=run.elapsed<=d.limit*.5?"S":run.elapsed<=d.limit*.75?"A":"B",mul=rank==="S"?1.5:rank==="A"?1.2:1;
  j.runs[d.id]=jhInt(j.runs[d.id])+1;
  const prev=j.records[d.id]||{};j.records[d.id]={clears:jhInt(prev.clears)+1,best:Math.min(prev.best||Infinity,Math.ceil(run.elapsed)),rank:!prev.rank||"SAB".indexOf(rank)<"SAB".indexOf(prev.rank)?rank:prev.rank};
  jhReward(Math.round(d.fd*mul),Math.round(d.knb*mul),`${d.n} · hạng ${rank}`);
  S.tienThaoUntil=Math.max(Date.now(),S.tienThaoUntil||0)+(rank==="S"?30:rank==="A"?20:10)*60000;
  grant(MC().lab?{ht:rank==="S"?3:rank==="A"?2:1}:{gold:100},"Nguyên liệu phó bản");
  if(Math.random()<.006*mul)grant({set:1},"Phó bản · đồ bộ hiếm");
  if(Math.random()<.003*mul){const goods=horseShopGoods().filter(g=>g.d===10),g=goods.length?pick(goods):null;if(g&&S.inv.length<INV_MAX){const it=makeItem(10,g.k,g.lvl,0);if(it)addItem(it,true,true,true);}}
  jhEnd(`Hoàn thành ${d.n} · hạng ${rank}.`);return true;
}
function jhFerryFinish(killed=false){
  const run=R.tower;if(run?.kind!=="ferry")return;const j=jhState(),boss=run.boss;
  const ratio=boss?Math.max(0,Math.min(1,(boss.max-Math.max(0,boss.hp))/boss.max)):0;
  const rank=killed||ratio>=.999?"S":ratio>=.5?"A":ratio>=.2?"B":ratio>=.05?"C":"";
  if(run.week===j.week&&rank&&jhInt(j.ferryRuns)<3){j.ferryRuns=jhInt(j.ferryRuns)+1;const fd={S:50,A:30,B:20,C:10}[rank],knb={S:15,A:10,B:6,C:3}[rank];jhReward(fd,knb,`Phong Lăng Độ · hạng ${rank}`);j.ferryBest=Math.max(j.ferryBest||0,ratio);if(rank==="S"&&Math.random()<.02)grant({set:1},"Phong Lăng Độ · đồ bộ hiếm");jhEnd(`Phong Lăng Độ · hạng ${rank}, gây ${Math.round(ratio*100)}% sát thương.`);}else jhEnd("Phong Lăng Độ: chưa đạt 5% sát thương, không mất lượt.");
}
function jhTick(dt){const run=R.tower;if(!run?.kind||R.quiet)return;run.elapsed+=dt;if(run.limit&&run.elapsed>=run.limit){if(run.kind==="ferry")jhFerryFinish();else jhEnd("Phó bản hết giờ · không mất lượt.");}}
function jhRunLabel(){const r=R.tower;if(!r)return "";const time=r.limit?` · ${Math.max(0,Math.ceil(r.limit-r.elapsed))}s`:"";return r.kind==="tower2"?`Tháp II · tầng ${r.floor}`:r.kind==="ferry"?"Phong Lăng Độ"+time:r.kind==="dungeon"?`${r.d.n} · ${r.floor}/${r.d.rooms}`+time:`Tháp · tầng ${r.floor}`;}
function jhHTML(tab){
  const j=jhState(),run=R.tower,busy=jhBusy(),out=run?.kind?'<button class="btn red" id="jhOut">Rời hoạt động</button>':"";
  if(tab==="tower2"){const a=jhAdvanced();return `<h3>Tháp II</h3><p>2000 tầng · mở sau chuyển sinh 5 · quái cấp 200–325. Thất bại lùi 10 tầng. Chỉ thưởng lần đầu vượt tầng; đồ bộ hiếm từ tầng 50, mỗi 10 tầng.</p><p>Kỷ lục ${jhInt(j.towerBest)}/2000 · tầng tiếp ${jhInt(j.towerNext)||jhInt(j.towerBest)+1} · lượt tuần ${jhInt(j.towerTries)}/1000</p><button class="btn" id="jhTower" ${busy||RW().stat.reborn<5||jhInt(j.towerBest)>=2000||jhInt(j.towerTries)>=1000?"disabled":""}>Vào Tháp II</button> ${out}<h3>Điểm nâng cao · còn ${a.left}</h3><p>TS6–TS10: mỗi lần thêm 1 điểm, tối đa 5 điểm tổng cộng. Chỉ áp dụng trong Tháp II.</p>${JH_ADVANCED.map(x=>`<div class="qrow"><span><b>${x.n} ${a[x.k]}/5</b><small>${x.d}</small></span><button class="btn sm" data-jh-point="${x.k}" ${!a.left?"disabled":""}>+1</button></div>`).join("")}`;}
  if(tab==="dungeons")return `<h3>Bảy cửa ải giang hồ</h3><p>2 lượt / phó bản / ngày. Qua đủ phòng trong thời hạn mới mất lượt và nhận thưởng. Hạng S/A/B theo tốc độ; thưởng KNB, Phúc Duyên, Tiên Thảo Lộ và nguyên liệu. Đồ bộ và ngựa có tỉ lệ hiếm.</p>${out}${JH_DUNGEONS.map(d=>{const rec=j.records[d.id];return `<div class="card"><b>${d.n} · cấp ${d.lv}+</b><p>${d.rooms} phòng · ${d.limit} giây · ${d.knb} KNB / ${d.fd} Phúc Duyên (hạng B)</p><small>${rec?`Kỷ lục ${rec.best}s · ${rec.rank} · ${rec.clears} lần`:"Chưa hoàn thành"} · còn ${Math.max(0,2-jhInt(j.runs[d.id]))}/2 lượt</small><div><button class="btn sm" data-jh-dungeon="${d.id}" ${busy||S.lvl<d.lv||jhInt(j.runs[d.id])>=2?"disabled":""}>Vào phó bản</button></div></div>`;}).join("")}`;
  if(tab==="ferry")return `<h3>Phong Lăng Độ</h3><p>Cấp 75+ · 3 lượt thưởng mỗi tuần · 180 giây. Hạng S: hạ trùm; A: gây 50%, B: 20%, C: 5% máu. Không đủ 5% hoặc rời sớm không mất lượt. Nhận 3–15 KNB và 10–50 Phúc Duyên.</p><p>Đã nhận thưởng ${jhInt(j.ferryRuns)}/3 lượt · tốt nhất ${Math.round((j.ferryBest||0)*100)}%</p><button class="btn" id="jhFerry" ${busy||S.lvl<75||jhInt(j.ferryRuns)>=3?"disabled":""}>Lên thuyền</button> ${out}`;
  return null;
}
ACT_TABS.push(["tower2","Tháp II"],["dungeons","Phó bản"],["ferry","Phong Lăng Độ"]);
const jhOldBody=actBody;actBody=function(tab,r){return jhHTML(tab)??jhOldBody(tab,r);};
const jhOldBind=actBind;actBind=function(){jhOldBind();const on=(id,fn)=>{const el=document.getElementById(id);if(el)el.onclick=fn;};on("jhTower",jhTowerStart);on("jhFerry",jhFerryStart);on("jhOut",()=>{jhEnd();giftModal();});document.querySelectorAll("[data-jh-dungeon]").forEach(b=>b.onclick=()=>jhDungeonStart(b.dataset.jhDungeon));document.querySelectorAll("[data-jh-point]").forEach(b=>b.onclick=()=>{jhAddAdvanced(b.dataset.jhPoint);giftModal();});};
const jhOldSpawn=towerSpawn;towerSpawn=function(){if(!jhSpawn())jhOldSpawn();};
const jhOldClear=towerCleared;towerCleared=function(){if(!jhClear())jhOldClear();};
const jhOldExit=towerExit;towerExit=function(dead,won){if(R.tower?.kind)jhEnd(dead?"Trọng thương · hoạt động kết thúc.":"Đã rời hoạt động.");else jhOldExit(dead,won);};
const jhOldTick=tick;tick=function(dt){jhTick(dt);return jhOldTick(dt);};
const jhOldStall=stallOut;stallOut=function(){if(["dungeon","ferry"].includes(R.tower?.kind)){R.stall=0;return;}return jhOldStall();};
const jhOldHit=heroHit;heroHit=function(a,e){if(R.tower?.kind==="tower2"&&e.jh){const mul=1+.02*jhAdvanced().son;a={...a,parts:Object.fromEntries(Object.entries(a.parts).map(([k,v])=>[k,v*mul]))};}return jhOldHit(a,e);};
const jhOldKill=onKill;onKill=function(e){if(R.tower?.kind&&e.jh){dexMark(e.tid);R.kills++;S.totalKills=(S.totalKills||0)+1;return;}return jhOldKill(e);};

// Five-star skills in Luyện Công gain one selectable evolution per run.
const JH_EVOLUTIONS=[{k:"power",n:"Uy lực",d:"Sát thương +25%."},{k:"swift",n:"Liên kích",d:"Tốc độ tung chiêu +20%."},{k:"reach",n:"Lan rộng",d:"Tầm và vùng đánh +25%; thêm 1 xuyên đạn."}];
const jhOldSVStart=svStart;svStart=function(){const result=jhOldSVStart();if(SV.on)SV.evolutions={};return result;};
const jhOldSVOptions=svOptions;svOptions=function(){const opts=jhOldSVOptions(),id=Object.keys(SV.picks||{}).find(id=>SV.picks[id]>=5&&!SV.evolutions?.[id]);return id?JH_EVOLUTIONS.map(e=>({t:"evo",id:+id,evo:e.k})):opts;};
const jhOldSVCard=svCard;svCard=function(o,i){if(o.t!=="evo")return jhOldSVCard(o,i);const e=JH_EVOLUTIONS.find(x=>x.k===o.evo);return `<button class="svopt" data-i="${i}"><img src="${esc(SK[o.id].ic||"")}" alt=""><b>${esc(SK[o.id].n)} · ${e.n}</b><em>✦ BIẾN THỂ</em><small>${e.d} Chỉ trong lượt luyện công này.</small></button>`;};
const jhOldSVApply=svApply;svApply=function(o){if(o.t!=="evo")return jhOldSVApply(o);if((SV.picks[o.id]||0)<5||SV.evolutions?.[o.id]||!JH_EVOLUTIONS.some(e=>e.k===o.evo))return false;SV.evolutions=SV.evolutions||{};SV.evolutions[o.id]=o.evo;SV.info={};svBarUpdate();return true;};
const jhOldSVInfo=svInfo;svInfo=function(id){const info=jhOldSVInfo(id),evo=SV.evolutions?.[id];if(!evo)return info;return {...info,tot:info.tot*(evo==="power"?1.25:1),rad:info.rad*(evo==="reach"?1.25:1),rate:info.rate*(evo==="swift"?1.2:1)};};
const jhOldSVCast=svCast;svCast=function(id){const from=SV.shots.length,trapFrom=SV.traps.length,result=jhOldSVCast(id);if(SV.evolutions?.[id]==="reach"){for(let i=from;i<SV.shots.length;i++){SV.shots[i].pierce++;SV.shots[i].life*=1.25;}for(let i=trapFrom;i<SV.traps.length;i++)SV.traps[i].r*=1.25;}return result;};
const jhOldGiftBody=giftBody;giftBody=function(r){const body=jhOldGiftBody(r);return giftTab==="reborn"?body+'<p class="desc">TS1–TS5 nhận tâm pháp. TS6–TS10 nhận điểm nâng cao trong mục Tháp II. Tháp II mở sau TS5.</p>':body;};
