// Compiled inside the native game closure. No browser/render loop runs on the server.
const ECON_CONTROL_KEYS=['speed','diff','push','stage','autoEquip','autoJunk','autoBuy','autoPts','autoSk','autoForge','autoEnh','autoFuse','autoHt','autoOre','autoKham','autoPlat','autoPlatUp','autoShard','lootF','filter','lootPolicy','lowFx','ctrl','inputMode','rot','main','mainLock','slots','branch','potOff','autoPot','potAt','manaAt','autoMovePaused'];
const ECON_USER_KEYS=['lowFx','ctrl','inputMode','rot','main','mainLock','slots','branch','potOff','autoPot','potAt','manaAt'];
let econStorage=new Map(),econNotices=[];
const econLocalStorage={getItem:k=>econStorage.get(k)||null,setItem:(k,v)=>econStorage.set(k,String(v)),removeItem:k=>econStorage.delete(k)};
// UI callbacks are intentionally disabled, including timers that would mutate another request's S.
log=toast=t=>{if(econNotices.length<10)econNotices.push(String(t).replace(/<[^>]*>/g,''));};
save=refresh=closeModal=modal=updateTop=dotGift=refreshGift=renderChar=renderSkill=showTab=shopModal=forgeModal=tamPhapModal=()=>{};
function gainMonsterXp(x,mul=S.tienThaoUntil>gameNow()?2:1){gainXp(x*mul);}
const uiSfx=()=>{},jrAdd=()=>{},img=()=>null,addText=()=>{},burst=()=>{},npcSfx=()=>{};
const INPUT={target:null};
function fillSlots(){S.slots=(S.slots||[]).slice(0,4).map(id=>S.sk[id]?id:0);while(S.slots.length<4)S.slots.push(0);}
function econContext(bundle,slot,now,run,fn){
 const prev=S,previousStorage=globalThis.localStorage;
 econStorage=new Map(Object.entries(bundle.shared||{}).map(([k,v])=>[k,pack(v)]));
 // Native account-wide helpers read character summaries from the same trusted bundle.
 for(let i=0;i<3;i++)if(bundle.slots[i])econStorage.set(slotKey(i),pack(bundle.slots[i]));
 globalThis.localStorage=econLocalStorage;S=bundle.slots[slot];MODE_CTX=null;collectionsCache=null;econNotices=[];gameClockSync(now);
 Object.assign(ADMV,{xp:1,gold:1,drop:1,hp:1,dmg:1,heroDmg:1,spawn:1,lucky:0,speed:0,god:0,infMana:0,sandbox:0});
 Object.assign(R,{P:null,life:1,mana:1,enemies:[],corpses:[],ground:[],tower:run?.tower||null,tk:run?.tk||null,town:false,quiet:true,logs:[],deadT:0,spawnT:0});
 try{
  R.P=calc();R.life=R.P.life;R.mana=R.P.mana;restoreGround();
  const result=fn();saveGround();
  for(const [key,raw]of econStorage)if(/^jxidle_(stash|clan|guild|collections)(?:_ctc|_phlt)?$/.test(key)){const u=unpack(raw);if(u.ok)bundle.shared[key]=u.state;}
  return {result,notices:econNotices.slice(),runtime:{tower:R.tower,tk:R.tk}};
 }finally{S=prev;globalThis.localStorage=previousStorage;MODE_CTX=null;collectionsCache=null;R.P=null;R.tower=null;R.tk=null;R.ground=[];R.enemies=[];}
}
function econControl(state,c){
 if(!c||typeof c!=='object'||Array.isArray(c))return;if(JSON.stringify(c).length>15000)throw new Error('Cấu hình quá lớn');
 for(const k of ECON_CONTROL_KEYS)if(Object.hasOwn(c,k)){
  const v=c[k];if(k==='speed'){if(![1,1.5,2].includes(v))throw new Error('Tốc độ tối đa x2');}
  else if(k==='diff'){if(!Number.isInteger(v)||v<0||v>=DIFFS.length||MC().diff!=null&&v!==MC().diff)continue;}
  else if(k==='stage'){if(!Number.isInteger(v)||v<1||v>Math.max(1,state.maxStage)||stageLevel(v)>state.lvl+STAGE_GATE)continue;}
  else if(k==='lootF'||k==='filter'||k==='lootPolicy'){if(!v||typeof v!=='object'||JSON.stringify(v).length>5000)continue;}
  else if(k==='slots'){if(!Array.isArray(v))continue;state.slots=v.slice(0,4).map(id=>(c.sk?.[id]??state.sk[id])>0?id:0);continue;}
  else if(k==='main'){if(v!==0&&!((c.sk?.[v]??state.sk[v])>0))continue;}
  else if(k==='branch'){if(typeof v!=='string'&&typeof v!=='number')continue;}
  else if(typeof v!=='string'&&typeof v!=='boolean'&&!(typeof v==='number'&&Number.isFinite(v)))continue;
  state[k]=structuredClone(v);
 }
 // Point allocation may change freely, but the server computes the remaining budgets.
 if(c.attr&&typeof c.attr==='object'){
  const total=state.attrPts+Object.values(state.attr||{}).reduce((a,v)=>a+v,0),next={};let used=0;
  for(const k of ['str','dex','vit','eng']){const n=c.attr[k]??0;if(!Number.isSafeInteger(n)||n<0)throw new Error('Điểm tiềm năng không hợp lệ');next[k]=n;used+=n;}
  if(used>total)throw new Error('Không đủ điểm tiềm năng');state.attr=next;state.attrPts=total-used;
 }
 if(c.sk&&typeof c.sk==='object'&&!Array.isArray(c.sk)){
  const total=state.skPts+Object.values(state.sk||{}).reduce((a,v)=>a+v,0),next={};let used=0;
  for(const [id,n]of Object.entries(c.sk)){const skill=SK[id];if(!Number.isSafeInteger(n)||n<0||!skill||!FAC[state.fac].skills.includes(+id)||n>skill.max)throw new Error('Điểm võ công không hợp lệ');if(n>(state.sk[id]||0)&&skill.req>state.lvl)throw new Error('Chưa đủ cấp học võ công');if(n)next[id]=n;used+=n;}
  if(used>total)throw new Error('Không đủ điểm võ công');state.sk=next;state.skPts=total-used;
 }
 if(Array.isArray(c.locks))for(const pair of c.locks.slice(0,120)){if(!Array.isArray(pair)||!Number.isSafeInteger(pair[0])||typeof pair[1]!=='boolean')continue;const it=S.inv.find(it=>it.uid===pair[0])||Object.values(S.eq).find(it=>it?.uid===pair[0]);if(it)it.locked=pair[1];}
 fillSlots();if(!state.sk[state.main]){state.main=0;state.mainLock=false;}
}
function econPoisson(mean){if(!(mean>0))return 0;if(mean>30){const u=Math.max(Number.MIN_VALUE,Math.random()),z=Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*Math.random());return Math.max(0,Math.round(mean+Math.sqrt(mean)*z));}const stop=Math.exp(-mean);let p=1,n=0;do{p*=Math.random();n++;}while(p>stop&&n<256);return n-1;}
function econFarm(seconds,meta,offline){
 if(!(seconds>0)||!S.fac)return {kills:0};
 const P=R.P,L=stageLevel(S.stage),bossStage=isBossStage(S.stage),hp=(enemyStats(L,'normal').hp*19+enemyStats(L,'elite').hp*(bossStage?4:5)+(bossStage?enemyStats(L,'boss').hp:0))/24*diffOf().hp;
 const attacks=[P.basic,...P.actives.filter(a=>canPrepareSkillAttack(S,a))],dps=Math.max(1,...attacks.map(a=>Math.max(0,a.dps||0)*Math.min(3,a.targets||1)));
 const kps=Math.min(3,dps/Math.max(1,hp+enemyStats(L,'normal').def)),speed=[1,1.5,2].includes(S.speed)?S.speed:1;
 const effective=seconds*speed*(offline?.75:1),work=(meta.fraction||0)+effective*kps,kills=Math.floor(work);meta.fraction=work-kills;
 modeClock(effective);ytTick('train',effective);
 if(!kills)return {kills:0};
 const lvDiff=L-S.lvl,mult=lvDiff<-10?.2:lvDiff<-5?.6:1;
 const phase=meta.killPhase||0,bosses=bossStage?Math.floor((phase+kills)/24)-Math.floor(phase/24):0,elites=Math.max(0,Math.floor((phase+kills)/6)-Math.floor(phase/6)-bosses),normals=kills-elites-bosses;meta.killPhase=(phase+kills)%24;
 gainXp(expFor(L)*(normals+elites*CLS.elite.xp+bosses*CLS.boss.xp*ctcBossXp({cls:'boss'}))*mult*diffOf().rew*(typeof tienThaoMul==='function'?tienThaoMul():S.tienThaoUntil>gameNow()?2:1));
 const gold=Math.round(moneyDrop({L,cls:'normal'})*(normals+elites*2+bosses*8)*diffOf().rew*modeGoldMul());S.gold+=gold;
 const r=RW();r.stat.kills+=kills;S.totalKills=(S.totalKills||0)+kills;questTick('kills',kills);r.stat.bosses+=bosses;questTick('bosses',bosses);ytTick('elites',elites);
 S.knb=(S.knb||0)+Math.min(kills,econPoisson(kills*KNB_DROP_RATE));r.stat.tokens+=Math.min(kills,econPoisson(kills*.05));
 // Sparse drops are sampled in bounded batches, just as the previous offline reward path.
 const trials=offline?Math.min(30,Math.floor(kills*.08)):Math.min(180,kills);
 for(let i=0;i<trials;i++){
  const cls=!offline&&(phase+i+1)%24===0&&bossStage?'boss':!offline&&(phase+i+1)%6===0?'elite':'normal';const e={L,cls,bonusDrop:1,x:H.x,y:H.y};
  for(const it of rollDrops(e))addItem(it,true,true);
  const set=rollSetDrop(e);if(set)addItem(set,true,true);
  allDrops(e);
 }
 if(S.autoPts===true){autoSpendAttrs();autoSpendSkills();}
 autoEquipAll();sweepJunk();autoBuyWeapon();autoForge();
 const waves=Math.floor(((meta.waveKills||0)+kills)/24);meta.waveKills=((meta.waveKills||0)+kills)%24;
 if(S.push&&waves){const target=Math.min(STAGE_CAP,S.stage+waves);while(S.stage<target&&stageLevel(S.stage+1)<=S.lvl+STAGE_GATE){S.stage++;S.maxStage=Math.max(S.maxStage,S.stage);questTick('stages');}}
 achCheck();return {kills,gold};
}
function econActivity(seconds,meta){
 if(!(R.tower||R.tk||S.siege))return;
 const speed=[1,1.5,2].includes(S.speed)?S.speed:1;
 let budget=(meta.damage||0)+seconds*speed*Math.max(1,R.P.main?.dps||R.P.basic.dps);const initialFloor=R.tower?.floor;
 for(let n=0;n<30&&(R.tower||R.tk||S.siege);n++){
  if(!R.enemies.length){if(R.tower)towerSpawn();else if(R.tk)tkSpawn();else siegeSpawn();}
  const hp=R.enemies.reduce((a,e)=>a+Math.max(0,e.hp),0);
  if(budget<hp){meta.damage=budget;break;}budget-=hp;meta.damage=0;
  for(const e of R.enemies){e.hp=0;onKill(e);}R.enemies=[];
  if(R.tower){if(R.tower.kind)R.tower.elapsed=(R.tower.elapsed||0)+hp/Math.max(1,R.P.main?.dps||1);if(R.tower.limit&&R.tower.elapsed>R.tower.limit){jhEnd('Hết giờ phó bản');break;}towerCleared();}else if(R.tk)tkCleared();else siegeCleared();
 }
 if(R.tower?.limit){R.tower.elapsed=Math.max(R.tower.elapsed||0,(gameNow()-meta.activityAt)/1000*speed);if(R.tower.elapsed>=R.tower.limit){if(R.tower.kind==='ferry')jhFerryFinish();else jhEnd('Hết giờ phó bản');}}
 if(initialFloor!==R.tower?.floor)meta.damage=0;
}
function econOwned(uid,inventory=false){if(!Number.isSafeInteger(uid))throw new Error('ID vật phẩm không hợp lệ');const it=inventory?S.inv.find(i=>i.uid===uid):findItem(uid);if(!it)throw new Error('Không sở hữu vật phẩm');return it;}
function econExecute(name,args,meta){
 if(!Array.isArray(args)||args.length>6||JSON.stringify(args).length>6000)throw new Error('Thao tác không hợp lệ');
 const integer=(i,min=0,max=1000000000000)=>{const n=args[i];if(!Number.isSafeInteger(n)||n<min||n>max)throw new Error('Giá trị không hợp lệ');return n;};
 const it=(i=0,inv=false)=>econOwned(integer(i,1),inv);
 const call=(fn)=>fn(...args);
 switch(name){
 case 'buyGoods':{const key=String(args[0]),index=integer(1,0,1000),g=shopEntries(key)[index];if(!SHOP_TABS.some(x=>x[0]===key)||!g)throw new Error('Món hàng không tồn tại');buyGoods(g,true);break;}
 case 'sell':sell(it(0,true));break;
 case 'sellUnmatched':return sellUnmatched();
 case 'clearInventory':return clearInventory();
 case 'equip':{const item=it(0,true);if(!reqOk(item))throw new Error('Chưa đủ điều kiện trang bị');equip(item,true);break;}
 case 'unequip':if(!SLOTS.some(x=>x[0]===args[0]))throw new Error('Ô trang bị không hợp lệ');unequip(args[0]);break;
 case 'lock':{const item=it();item.locked=!!args[1];break;}
 case 'autoEquipAll':autoEquipAll(true);break;
 case 'enhance':return enhanceCore(it());
 case 'reroll':reroll(it());break;
 case 'randomForge':return call(randomForge);
 case 'fuse':if(!Array.isArray(args[0])||args[0].length!==3||new Set(args[0]).size!==3)throw new Error('Cần ba món khác nhau');return fuse(args[0].map(id=>econOwned(id,true)));
 case 'buyHT':integer(0,1,9);integer(1,1,1000);return call(buyHT);
 case 'upgradeHT':integer(0,1,10);return call(upgradeHT);
 case 'upgradeOre':if(typeof args[0]!=='string'||!/^([0-5]):(\d+):([1-9]|10)$/.test(args[0]))throw new Error('Khoáng không hợp lệ');return call(upgradeOre);
 case 'enchase':return enchase(it(),integer(1,1,10),String(args[2]));
 case 'combineShards':return call(combineShards);
 case 'makePlatina':if(args[0]===args[1])throw new Error('Cần hai món khác nhau');return makePlatina(it(0,true),it(1,true));
 case 'upgradePlatina':return upgradePlatina(it());
 case 'stashDeposit':return econStashDeposit(it(0,true));
 case 'stashWithdraw':return econStashWithdraw(integer(0));
 case 'stashGold':return econStashGold(String(args[0]),integer(1,1));
 case 'stashMat':return econStashMat(...args);
 case 'buyMask':{const m=(window.JMASK?.items||[]).find(m=>m.id===args[0]);if(!m)throw new Error('Mặt nạ không tồn tại');if((S.maskOwned||[]).includes(m.id))throw new Error('Đã sở hữu mặt nạ');if((S.knb||0)<m.price)throw new Error('Không đủ KNB');S.knb-=m.price;S.maskOwned=[...(S.maskOwned||[]),m.id];break;}
 case 'wearMask':if(args[0]!==null&&!(S.maskOwned||[]).includes(args[0]))throw new Error('Chưa sở hữu mặt nạ');S.maskId=args[0];break;
 case 'buyTienThaoLo':if((S.knb||0)<2)throw new Error('Không đủ KNB');S.knb-=2;S.tienThaoUntil=Math.max(gameNow(),S.tienThaoUntil||0)+3600000;break;
 case 'claimLogin':loginCheck();claimLogin();break;
 case 'claimLvMs':integer(0,1,MAX_LEVEL);claimLvMs(args[0]);break;
 case 'claimQuest':integer(0,0,3);claimQuest(args[0]);break;
 case 'eventBuy':integer(0,0,EVENT_SHOP.length-1);call(eventBuy);break;
 case 'openChest':openChest();break;
 case 'taiXiu':integer(1,1);return call(taiXiu);
 case 'spinDo':return spinDo();
 case 'guildDonate':integer(0,1);return call(guildDonate);
 case 'ytDeliver':ytDeliver();break;
 case 'ytClaim':ytClaim();break;
 case 'tkBuy':integer(0,0,TK_SHOP.length-1);call(tkBuy);break;
 case 'siegeBuy':integer(0,0,SIEGE_SHOP.length-1);call(siegeBuy);break;
 case 'pickUp':{const drop=R.ground.find(d=>d.it.uid===args[0]);if(!drop)throw new Error('Món đồ không còn trên đất');pickUp(drop);break;}
 case 'petAdopt':if(!petChoices().includes(args[0])||S.lvl<PET_LV)throw new Error('Đồng hành chưa mở');call(petAdopt);break;
 case 'tpPick':call(tpPick);break;
 case 'jhAddAdvanced':call(jhAddAdvanced);break;
 case 'doReborn':{
  const r=RW();if(S.lvl<REBORN_LV||r.stat.reborn>=REBORN_MAX)throw new Error('Chưa đủ điều kiện chuyển sinh');r.stat.reborn++;S.lvl=1;S.xp=0;S.attr={str:0,dex:0,vit:0,eng:0};S.attrPts=r.stat.reborn*50;S.stage=1;S.wave=1;S.push=true;if(r.stat.reborn<=5)r.tpPend=(r.tpPend||0)+1;R.tower=R.tk=null;delete S.siege;achCheck();break;
 }
 case 'towerStart':case 'tkStart':case 'siegeStart':case 'jhDungeonStart':case 'jhTowerStart':case 'jhFerryStart':{
  if(R.tower||R.tk||S.siege)throw new Error('Đang ở hoạt động khác');
  if(name==='towerStart'&&S.lvl<TOWER_LV&&!RW().stat.reborn)throw new Error('Chưa mở Tháp I');
  ({towerStart,tkStart,siegeStart,jhDungeonStart,jhTowerStart,jhFerryStart}[name])(...args);meta.activityAt=gameNow();meta.damage=0;meta.running=true;break;
 }
 case 'activityExit':if(R.tower)towerExit(false);if(R.tk)tkExit(false);if(S.siege)siegeExit(false);meta.damage=0;break;
 default:throw new Error('Thao tác kinh tế chưa được hỗ trợ');
 }
 return {ok:true};
}
function econStash(){const key=stashKey(),raw=localStorage.getItem(key),u=raw?unpack(raw):null;const st=u?.ok?u.state:{v:1,id:crypto.randomUUID(),rev:0,gold:0,items:[],mats:{ht:{},ore:{},shard:{},misc:{}}};st.items=st.items||[];st.mats=st.mats||{ht:{},ore:{},shard:{},misc:{}};return {key,st};}
function econStashWrite(key,st){st.rev=(st.rev||0)+1;localStorage.setItem(key,pack(st));return {ok:true};}
function econStashDeposit(item){const {key,st}=econStash();if(st.items.length>=stashMax())throw new Error('Kho đầy');S.inv=S.inv.filter(it=>it!==item);st.items.push(item);return econStashWrite(key,st);}
function econStashWithdraw(index){const {key,st}=econStash();if(S.inv.length>=INV_MAX)throw new Error('Hành trang đầy');const item=st.items[index];if(!item)throw new Error('Món không còn trong kho');if(!modeItemOk(item,S.mode))throw new Error('Đồ thuộc chế độ khác');st.items.splice(index,1);item.uid=S.uid++;S.inv.unshift(item);return econStashWrite(key,st);}
function econStashGold(dir,n){const {key,st}=econStash();if(dir==='in'){if(S.gold<n)throw new Error('Không đủ ngân lượng');S.gold-=n;st.gold+=n;}else if(dir==='out'){if(st.gold<n)throw new Error('Kho không đủ ngân lượng');st.gold-=n;S.gold+=n;}else throw new Error('Thao tác kho không hợp lệ');return econStashWrite(key,st);}
function econStashMat(dir,group,key,n){if(!['ht','ore','shard','misc'].includes(group)||typeof key!=='string'&&typeof key!=='number')throw new Error('Nguyên liệu không hợp lệ');const box=econStash(),st=box.st;st.mats[group]=st.mats[group]||{};const have=dir==='in'?matHave(group,key):st.mats[group][key]||0;const count=n==null?have:n;if(!Number.isSafeInteger(have)||!Number.isSafeInteger(count)||count<1||count>have)throw new Error('Không đủ nguyên liệu');if(dir==='in'){matAdd(group,key,-count);st.mats[group][key]=(st.mats[group][key]||0)+count;}else if(dir==='out'){st.mats[group][key]-=count;matAdd(group,key,count);}else throw new Error('Thao tác kho không hợp lệ');return econStashWrite(box.key,st);}
const economyEngine={
 collect(){if(S.ctrl==='manual'||!lootFilter().auto)return;for(const drop of [...R.ground])if(lootWanted(drop.it))pickUp(drop,true);},
 context:econContext,control:econControl,farm:econFarm,activity:econActivity,execute:econExecute,
 create(spec){const old=S;try{S=newSave();S.fac=spec.fac;S.mode=spec.mode;S.sex=spec.sex===1?1:0;S.sexSet=1;if(typeof spec.cid==='string'&&/^[A-Za-z0-9_-]{8,80}$/.test(spec.cid))S.cid=spec.cid;S.name=String(spec.name||FAC[spec.fac].n).trim().slice(0,16);S.speed=MC().defSpeed;S.diff=MC().diff??0;const f=FAC[S.fac];if(f.starter){S.sk[f.starter]=1;S.skPts=Math.max(0,S.skPts-1);S.main=f.starter;}starterGear();return structuredClone(S);}finally{S=old;}}
};
