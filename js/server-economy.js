"use strict";
// Only semantic controls/actions cross the network; rendering stays local.
const ECON={version:0,chain:Promise.resolve(),applying:false,picking:new Map()};
function serverEconomy(){if(CLOUD.economyVersion===1||CLOUD.meta?.economyVersion===1)ECON.version=1;return ECON.version===1&&!!CLOUD.user&&CLOUD.ready&&!CLOUD.detachedBundle;}
const ECON_SETTINGS=['speed','diff','push','stage','autoEquip','autoJunk','autoBuy','autoPts','autoSk','autoForge','lootF','lowFx','ctrl','inputMode','rot','main','mainLock','slots','branch','potOff','autoPot','potAt','manaAt','autoMovePaused'];
function economyControls(){const c={};if(!S?.fac)return c;for(const k of ECON_SETTINGS)if(S[k]!==undefined)c[k]=JSON.parse(JSON.stringify(S[k]));c.attr=S.attr;c.sk=S.sk;c.locks=[...S.inv,...Object.values(S.eq)].filter(Boolean).map(it=>[it.uid,!!it.locked]);c.running=!R.town&&!S.autoMovePaused;return c;}
function economyApply(r,preserve=null){
 if(!r.patch)return;ECON.version=r.patch.version;ECON.applying=true;
 try{
  const oldRuntime=JSON.stringify([R.tower&&[R.tower.kind,R.tower.floor],R.tk?.wave,S?.siege?.layer]);
  for(const {slot,state}of r.patch.slots){if(!state){localStorage.removeItem(slotKey(slot));continue;}const copy=state;if(slot===SLOT&&S?.fac){const sound=S.snd;S=copy;if(sound)S.snd=sound;
    if(preserve)for(const k of ECON_SETTINGS)if(preserve[k]!==undefined)S[k]=preserve[k];
   }const key=slotKey(slot),raw=pack(slot===SLOT&&S?.fac?S:copy);if(localStorage.getItem(key)!==raw){localStorage.setItem(key,raw);sealWrite(slot,state.mode);}}
  for(const [key,state]of Object.entries(r.patch.shared||{}))if(CLOUD_SHARED.includes(key)){const raw=pack(state);if(localStorage.getItem(key)!==raw)localStorage.setItem(key,raw);}
  if(r.patch.activeSlot===SLOT){R.tower=r.patch.runtime?.tower||null;R.tk=r.patch.runtime?.tk||null;}
  const newRuntime=JSON.stringify([R.tower&&[R.tower.kind,R.tower.floor],R.tk?.wave,S?.siege?.layer]);
  if(oldRuntime!==newRuntime){R.enemies=[];R.corpses=[];R.spawnT=.5;R.stall=0;R.zoneShown=null;}
  collectionsCache=null;CLOUD.revision=r.revision;CLOUD.lastSaved=r.updatedAt;CLOUD.lastLeaseAt=Date.now();
  if(S?.fac){restoreGround();invDirty=true;R.dirty=true;recalc();updateTop();}
  cloudSaveBinding('');CLOUD.marketPending=!!r.marketPending;
 }finally{ECON.applying=false;}
}
function economyPayload(){return {clientId:cloudClientId,revision:CLOUD.revision,requestId:crypto.randomUUID(),slot:S?.fac?SLOT:null,controls:economyControls(),characters:Array.from({length:3},(_,slot)=>slot===SLOT&&S?.fac?{fac:S.fac,mode:S.mode,name:S.name,sex:S.sex,cid:S.cid}:null)};}
const economyOriginalCloudApi=cloudApi;
cloudApi=async function(path,body){const r=await economyOriginalCloudApi(path,body);if(r.economyVersion!==undefined)ECON.version=r.economyVersion;return r;};
const economyOriginalSync=cloudSync;
cloudSync=async function(force=false){
 if(!serverEconomy())return economyOriginalSync(force);
 if(SAVE_LOCK||CLOUD.paused||CLOUD.busy||document.hidden&&!force)return false;
 CLOUD.busy=true;
 try{
  if(!CLOUD.lease||Date.now()-CLOUD.lastLeaseAt>90000){const claimed=await cloudClaim();if(claimed.revision!==CLOUD.revision){const e=new Error('Có tiến trình mới trên server; tải bản tài khoản');e.code='save_conflict';throw e;}}
  const payload=economyPayload(),sentControls=JSON.stringify(payload.controls);
  const r=await cloudApi('save',payload),current=economyControls();
  // Preserve cosmetic/filter changes made while waiting. Allocations are confirmed by the next save.
  const preserve=JSON.stringify(current)===sentControls?null:Object.fromEntries(ECON_SETTINGS.filter(k=>JSON.stringify(current[k])!==JSON.stringify(payload.controls[k])).map(k=>[k,current[k]]));
  economyApply(r,preserve);if(preserve&&S?.fac)economyPendingPoints(current,payload.controls);cloudStatus('Đã lưu · tiền và đồ do server quản lý');return true;
 }catch(e){cloudFail(e);return false;}finally{CLOUD.busy=false;}
};
function economyAction(action,args=[],after){
 if(!serverEconomy())return false;
 if(CLOUD.paused||SAVE_LOCK){toast('Tải tiến trình tài khoản để tiếp tục');return true;}
 const owner=CLOUD.user.id,slot=SLOT,cid=S?.cid;ECON.chain=ECON.chain.then(async()=>{
  if(!serverEconomy()||CLOUD.paused||CLOUD.user.id!==owner||SLOT!==slot||S?.cid!==cid)return;
  // Reuse the existing lease/revision flow; no timer per monster or skill is added.
  while(CLOUD.busy){await new Promise(resolve=>setTimeout(resolve,100));if(CLOUD.paused||!serverEconomy()||CLOUD.user.id!==owner||SLOT!==slot||S?.cid!==cid)return;}
  CLOUD.busy=true;let sent=false;
  try{
   if(!CLOUD.lease||Date.now()-CLOUD.lastLeaseAt>90000){const claimed=await cloudClaim();if(claimed.revision!==CLOUD.revision){const e=new Error('Có bản mới trên server');e.code='save_conflict';throw e;}}
   const payload=economyPayload();payload.action=action;payload.args=args;sent=true;
   const r=await cloudApi('economy/action',payload),current=economyControls();const preserve=Object.fromEntries(ECON_SETTINGS.filter(k=>JSON.stringify(current[k])!==JSON.stringify(payload.controls[k])).map(k=>[k,current[k]]));economyApply(r,preserve);economyPendingPoints(current,payload.controls);
   const msg=r.result?.msg||r.notices?.at(-1);if(msg)toast(msg);else economyNotice('Đã cập nhật');
   if(after)after(r);else refresh();
  }catch(e){if(sent&&e.code==='offline'){e.code='save_conflict';e.message+=' · Tải bản tài khoản để kiểm tra kết quả';}cloudFail(e);toast(e.message);}
  finally{CLOUD.busy=false;}
 }).catch(e=>{CLOUD.busy=false;toast(e.message);});
 return true;
}
function economyWrap(name,encode,argsAfter){const original=window[name];if(typeof original!=='function')return;window[name]=function(...args){if(!serverEconomy()||ECON.applying)return original.apply(this,args);if(encode===false)return;const encoded=encode?encode(args):args;economyAction(name,encoded,argsAfter?()=>argsAfter(args):null);return {ok:false,n:0,gold:0,msg:'Đang xử lý trên server…'};};}
for(const n of ['sell','equip','enhance','reroll','upgradePlatina','stashDeposit'])economyWrap(n,args=>[args[0]?.uid],args=>{if(n==='stashDeposit')stashModal();else if(n==='enhance'||n==='reroll'||n==='upgradePlatina'){const item=findItem(args[0]?.uid);if(item)forgeModal(item);}else refresh();});
economyWrap('enchase',a=>[a[0]?.uid,a[1],a[2]],a=>{const it=findItem(a[0]?.uid);if(it)forgeModal(it);});
economyWrap('fuse',a=>[a[0].map(it=>it.uid)],()=>htModal());
economyWrap('makePlatina',a=>[a[0]?.uid,a[1]?.uid],()=>htModal());
economyWrap('buyGoods',a=>{const g=a[0];for(const [kind]of SHOP_TABS){const index=shopEntries(kind).findIndex(x=>x.g===g.g&&x.d===g.d&&x.k===g.k&&x.lvl===g.lvl&&x.s===g.s);if(index>=0)return [kind,index];}return ['',-1];},a=>shopModal(a[1]));
for(const n of ['buyHT','upgradeHT','upgradeOre','combineShards','randomForge'])economyWrap(n,null,()=>htModal());
for(const n of ['stashWithdraw','stashGold','stashMat'])economyWrap(n,null,()=>stashModal());
for(const n of ['claimLogin','claimLvMs','claimQuest','eventBuy','openChest','taiXiu','spinDo','guildDonate','ytDeliver','ytClaim','tkBuy','siegeBuy','petAdopt','tpPick','jhAddAdvanced'])economyWrap(n,null,()=>{refresh();if(document.getElementById('giftTabs'))giftModal();});
economyWrap('buyMask',null,()=>maskShopModal());
economyWrap('wearMask',null,()=>{renderChar();if(document.getElementById('maskShopList'))maskShopModal();});
economyWrap('buyTienThaoLo',null,()=>treasureShopModal());
economyWrap('unequip',null,()=>refresh());economyWrap('sellUnmatched',null,()=>refresh());economyWrap('autoEquipAll',null,()=>refresh());
for(const n of ['towerStart','tkStart','siegeStart','jhDungeonStart','jhTowerStart','jhFerryStart'])economyWrap(n,null,()=>{closeModal(true);R.town=false;});
const economyOriginalReborn=doReborn;doReborn=function(){if(!serverEconomy())return economyOriginalReborn();if(S.lvl<MAX_LEVEL||RW().stat.reborn>=10)return;if(confirm('Chuyển sinh: về cấp 1, giữ trang bị và võ công. Tiếp tục?'))economyAction('doReborn',[],()=>{closeModal(true);refresh();tamPhapModal();});};
// Server computes gains. Browser combat continues solely for animation and input feedback.
for(const n of ['payKill','rwOnKill','gainXp','grant','offlineGains','autoForge','autoBuyWeapon','achCheck','kyNgoTick','fireCheck'])economyWrap(n,false);
const economyOriginalPickUp=pickUp;pickUp=function(drop){if(!serverEconomy())return economyOriginalPickUp(drop);if(CLOUD.busy||window.JXADMINBUSY||S.inv.length>=INV_MAX)return false;const id=drop.it.uid,now=performance.now();if(now-(ECON.picking.get(id)||-Infinity)<10000)return false;ECON.picking.set(id,now);if(ECON.picking.size>200)ECON.picking.delete(ECON.picking.keys().next().value);economyAction('pickUp',[id]);return false;};
for(const name of ['stashImport','importSave','modeTransferDo']){const original=window[name];if(typeof original==='function')window[name]=function(...a){if(!serverEconomy())return original.apply(this,a);toast('Tài khoản dùng dữ liệu server; file xuất chỉ dùng làm backup');return {ok:false,msg:'Không thể thay tiền hoặc đồ bằng file tại máy'};};}
const economyOriginalUseLocal=cloudUseLocal;cloudUseLocal=async function(...args){if(ECON.version===1){toast('Tài khoản dùng tiến trình server. Chọn nhân vật trên tài khoản để chơi.');return;}return economyOriginalUseLocal(...args);};
const economyOriginalAccountMenu=cloudAccountMenu;cloudAccountMenu=async function(){await economyOriginalAccountMenu();if(ECON.version===1){for(const id of ['cloudUseLocal','cloudUseTab','cloudUseArchive','cloudPrevious'])document.getElementById(id)?.remove();const body=document.getElementById('cloudBody');if(body){const note=document.createElement('p');note.className='desc';note.textContent='Tiền, đồ và phần thưởng lưu trên server. Chơi khách giữ dữ liệu riêng tại máy.';body.appendChild(note);}}};

for(const name of ['towerExit','tkExit','siegeExit','jhEnd']){const original=window[name];if(typeof original==='function')window[name]=function(...args){if(!serverEconomy()||ECON.applying)return original.apply(this,args);economyAction('activityExit',[],()=>{R.town=false;refresh();});return false;};}

const economyOriginalDeleteSlot=deleteSlot;deleteSlot=function(i){if(!serverEconomy())return economyOriginalDeleteSlot(i);const state=cloudCapture(false).slots[i];if(state)economyAction('deleteCharacter',[i,state.cid],()=>{localStorage.removeItem(slotKey(i)+'_bak');localStorage.removeItem(sealKey(i));localStorage.setItem(SLOT_PTR,'menu');SAVE_LOCK=true;location.reload();});};

function economyPendingPoints(current,sent){let changed=false;for(const [key,remaining]of [['attr','attrPts'],['sk','skPts']]){if(JSON.stringify(current[key])===JSON.stringify(sent[key]))continue;const budget=S[remaining]+Object.values(S[key]||{}).reduce((a,v)=>a+v,0),used=Object.values(current[key]||{}).reduce((a,v)=>a+v,0);if(used<=budget){S[key]=current[key];S[remaining]=budget-used;changed=true;}}if(changed){recalc();save();}}
let economyNoticeTimer;
function economyNotice(text){let el=document.getElementById('economyNotice');if(!el){el=document.createElement('div');el.id='economyNotice';el.setAttribute('role','status');document.body.appendChild(el);}el.textContent=text;el.classList.add('on');clearTimeout(economyNoticeTimer);economyNoticeTimer=setTimeout(()=>el.classList.remove('on'),1500);}
