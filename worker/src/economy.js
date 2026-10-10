import {HttpError} from './http.js';
import {GAME as G} from '../gen/game.js';
import {rateLimit} from './db.js';
import {checkStateSecurity} from './state-security.js';
const engine=G.economyEngine,DAY=86400000,MAX_OFFLINE=8*3600,DAY_OFFLINE=12*3600;
const fail=(code,msg,status=400)=>{throw new HttpError(status,code,msg);};
const stmt=(db,q,...args)=>db.prepare(q).bind(...args);
export const economyEnabled=env=>env.SERVER_ECONOMY_ENABLED==='1';
export async function economyMeta(db,id){const row=await stmt(db,'SELECT meta_json FROM economy_states WHERE account_id=?1',id).first();return row?JSON.parse(row.meta_json):null;}
export function economyPatch(bundle,meta){return {slots:bundle.slots.map((state,slot)=>({slot,state})),shared:bundle.shared,activeSlot:meta.activeSlot,runtime:meta.runtime||null,version:1};}
function identify(bundle){for(const s of bundle.slots)if(s){checkStateSecurity(s);const items=[...(s.inv||[]),...Object.values(s.eq||{}),...(s.ground||[]).map(r=>r.it)].filter(Boolean);for(const it of items)if(!it.eid)it.eid=crypto.randomUUID();}for(const [key,st]of Object.entries(bundle.shared||{}))if(key.startsWith('jxidle_stash')){checkStateSecurity(st);for(const it of st.items||[])if(!it.eid)it.eid=crypto.randomUUID();}}
export async function ensureEconomy(env,acc){
 let meta=await economyMeta(env.DB,acc.id);if(meta||!economyEnabled(env))return meta;
 const row=await stmt(env.DB,'SELECT * FROM cloud_saves WHERE account_id=?1',acc.id).first(),now=Date.now();
 if(!row)fail('no_save','Chưa có tài khoản lưu');
 // This is a one-time baseline, read from D1. A client upload cannot choose it.
 const oldBundle=JSON.parse(row.snapshot||'null'),lastSlot=(oldBundle?.slots||[]).map((s,i)=>({s,i})).filter(x=>x.s?.fac).sort((a,b)=>(b.s.last||0)-(a.s.last||0))[0]?.i??null;
 meta={v:1,settledAt:Math.min(now,row.updated_at||now),activeSlot:lastSlot,runtime:null,fraction:0,waveKills:0,offDay:Math.floor((now+25200000)/DAY),offSec:0,running:lastSlot!==null};
 const listings=(await stmt(env.DB,'SELECT * FROM market_listings WHERE seller=?1',acc.id).all()).results;
 try{await env.DB.batch([
  stmt(env.DB,'INSERT OR IGNORE INTO economy_backups(account_id,snapshot,previous_snapshot,revision,updated_at,market_json,created_at) VALUES(?1,?2,?3,?4,?5,?6,?7)',acc.id,row.snapshot,row.previous_snapshot,row.revision,row.updated_at||0,JSON.stringify(listings),now),
  stmt(env.DB,'INSERT INTO economy_states(account_id,meta_json) VALUES(?1,?2)',acc.id,JSON.stringify(meta))
 ]);}catch(e){if(!/UNIQUE/i.test(e.message))throw e;meta=await economyMeta(env.DB,acc.id);if(!meta)throw e;}
 return meta;
}
function summary(bundle){return bundle.slots.map(s=>s?{gold:s.gold||0,knb:s.knb||0}:null);}
export function settleEconomy(bundle,meta,now){
 const slot=meta.activeSlot,state=Number.isInteger(slot)&&bundle.slots[slot];let reward=null;
 const gap=Math.max(0,(now-meta.settledAt)/1000);meta.settledAt=Math.max(meta.settledAt,now);
 if(!state||!meta.running||!gap)return reward;
 const offline=gap>90;let secs=gap;
 if(offline){const day=Math.floor((now+25200000)/DAY);if(meta.offDay!==day){meta.offDay=day;meta.offSec=0;}secs=Math.min(MAX_OFFLINE,gap,Math.max(0,DAY_OFFLINE-(meta.offSec||0)));meta.offSec=(meta.offSec||0)+secs;secs=Math.min(secs,7200)+Math.max(0,secs-7200)*.4;}
 const outcome=engine.context(bundle,slot,now,meta.runtime,()=>{
  // Calendar claims always use server time. Client last/offDay and clocks are ignored.
  const result=meta.runtime?.tower||meta.runtime?.tk||state.siege?engine.activity(Math.min(secs,90),meta):engine.farm(secs,meta,offline);
  return result;
 });meta.runtime=outcome.runtime;reward=outcome.result;return reward;
}
function hydrateEmpty(bundle,proposals){
 for(let i=0;i<3;i++){const spec=proposals?.[i];if(bundle.slots[i]||!spec)continue;if(!Object.hasOwn(G.FAC,spec.fac)||!Object.hasOwn(G.MODES,spec.mode))fail('bad_save','Môn phái hoặc chế độ không hợp lệ');bundle.slots[i]=engine.create(spec);}
}
function control(bundle,slot,controls,now,meta){if(!Number.isInteger(slot)||slot<0||slot>2||!bundle.slots[slot]){meta.activeSlot=null;meta.running=false;return;}
 if(meta.activeSlot!==slot){meta.runtime=null;meta.fraction=0;meta.damage=0;meta.waveKills=0;}
 engine.context(bundle,slot,now,meta.runtime,()=>engine.control(bundle.slots[slot],controls));meta.activeSlot=slot;meta.running=controls?.running!==false;}
export async function economyCommit(env,acc,body,type='sync'){
 const db=env.DB,now=Date.now();await ensureEconomy(env,acc);
 if(!/^[A-Za-z0-9_-]{16,80}$/.test(body.clientId||'')||!/^[A-Za-z0-9_-]{20,80}$/.test(body.requestId||''))fail('economy_refresh','Hãy tải lại trang để dùng cơ chế kinh tế server',409);
 let row=await stmt(db,'SELECT * FROM cloud_saves WHERE account_id=?1',acc.id).first();
 if(row.write_owner!==body.clientId||row.write_until<=now)fail('device_changed','Máy này không có quyền chơi',409);
 const previous=type==='action'?await stmt(db,'SELECT client_id FROM economy_requests WHERE account_id=?1 AND request_id=?2',acc.id,body.requestId).first():null;
 if(previous){if(previous.client_id!==body.clientId)fail('device_changed','Thiết bị đã đổi',409);const meta=await economyMeta(db,acc.id);return {ok:true,replayed:true,revision:row.revision,updatedAt:row.updated_at,patch:economyPatch(JSON.parse(row.snapshot||'{"v":1,"slots":[null,null,null],"shared":{}}'),meta)};}
 if(!Number.isSafeInteger(body.revision)||body.revision!==row.revision)fail('save_conflict','Tiến trình đã thay đổi; tải bản trên tài khoản',409);
 if(type==='action'&&!await rateLimit(db,'economy:'+acc.id,360,3600))fail('cloud_rate','Thao tác quá nhanh; thử lại sau',429);
 const meta=await economyMeta(db,acc.id),bundle=JSON.parse(row.snapshot||'{"v":1,"slots":[null,null,null],"shared":{}}'),before=summary(bundle);
 if(type==='sync'){const hour=Math.floor(now/3600000);if(meta.syncHour!==hour){meta.syncHour=hour;meta.syncCount=0;}if((meta.syncCount||0)>=240)fail('cloud_rate','Thao tác quá nhanh; thử lại sau',429);meta.syncCount=(meta.syncCount||0)+1;}
 let result,reward,notices=[];
 try{
  reward=settleEconomy(bundle,meta,now);
  // Only fac/name/sex/mode are used for a new character. Uploaded money/items/levels are discarded.
  hydrateEmpty(bundle,body.characters||body.bundle?.slots);
  control(bundle,body.slot??body.activeSlot,body.controls,now,meta);
  if(type==='action'&&body.action==='deleteCharacter'){const [target,cid]=body.args||[];if(!Number.isInteger(target)||target<0||target>2||bundle.slots[target]?.cid!==cid)fail('bad_character','Nhân vật đã thay đổi');const pending=await stmt(db,"SELECT 1 FROM market_listings WHERE seller=?1 AND cid=?2 AND (status='active' OR (status='sold' AND claimed=0)) LIMIT 1",acc.id,cid).first();if(pending)fail('market_pending','Nhận hết đồ và tiền ở chợ trước khi xóa nhân vật');bundle.slots[target]=null;if(meta.activeSlot===target){meta.activeSlot=null;meta.runtime=null;meta.running=false;}result={ok:true};}
  else if(type==='action'){
   if(!Number.isInteger(meta.activeSlot))throw new Error('Chọn nhân vật để chơi');
   const outcome=engine.context(bundle,meta.activeSlot,now,meta.runtime,()=>engine.execute(body.action,body.args||[],meta));result=outcome.result;meta.runtime=outcome.runtime;notices=outcome.notices;
  }
  identify(bundle);
 }catch(e){if(e instanceof HttpError)throw e;fail('economy_action',e.message||'Thao tác không hợp lệ');}
 const response={ok:true,revision:row.revision+1,updatedAt:now,patch:economyPatch(bundle,meta),result,reward,notices};
 const delta=summary(bundle).map((s,i)=>s?{slot:i,gold:s.gold-(before[i]?.gold||0),knb:s.knb-(before[i]?.knb||0)}:null).filter(Boolean);
 const cleanup=now-(meta.purgedAt||0)>=3600000;if(cleanup)meta.purgedAt=now;
 const statements=type==='sync'?[
 stmt(db,'UPDATE cloud_saves SET previous_snapshot=snapshot,previous_revision=revision,previous_updated_at=updated_at,snapshot=?2,revision=revision+1,updated_at=?3,write_until=?4 WHERE account_id=?1 AND revision=?5 AND write_owner=?6 AND write_until>?3',acc.id,JSON.stringify(bundle),now,now+180000,row.revision,body.clientId),
 stmt(db,'UPDATE economy_states SET meta_json=?2 WHERE account_id=?1 AND changes()=1',acc.id,JSON.stringify(meta))
 ]:[
  stmt(db,`INSERT INTO economy_requests(account_id,request_id,client_id,revision,created_at,ok) VALUES(?1,?2,?3,?4,?5,CASE WHEN EXISTS(SELECT 1 FROM cloud_saves WHERE account_id=?1 AND revision=?6 AND write_owner=?3 AND write_until>?5) THEN 1 ELSE 0 END)`,acc.id,body.requestId,body.clientId,response.revision,now,row.revision),
  stmt(db,'UPDATE cloud_saves SET previous_snapshot=snapshot,previous_revision=revision,previous_updated_at=updated_at,snapshot=?2,revision=revision+1,updated_at=?3,write_until=?4 WHERE account_id=?1',acc.id,JSON.stringify(bundle),now,now+180000),
  stmt(db,'UPDATE economy_states SET meta_json=?2 WHERE account_id=?1',acc.id,JSON.stringify(meta)),
  stmt(db,'INSERT INTO economy_ledger(account_id,request_id,action,delta_json,created_at) VALUES(?1,?2,?3,?4,?5)',acc.id,body.requestId,type==='action'?body.action:'farm',JSON.stringify(delta),now)
 ];
 if(cleanup)statements.push(
  stmt(db,'DELETE FROM economy_requests WHERE account_id=?1 AND created_at<?2',acc.id,now-7*DAY),
  stmt(db,'DELETE FROM economy_ledger WHERE account_id=?1 AND created_at<?2',acc.id,now-30*DAY)
 );
 if(type==='action'&&body.action==='deleteCharacter')statements.push(stmt(db,'DELETE FROM cloud_pvp_links WHERE cloud_account_id=?1 AND slot=?2',acc.id,body.args[0]));
 try{const committed=await db.batch(statements);if(type==='sync'&&committed[0].meta.changes!==1)fail('save_conflict','Tiến trình đã thay đổi; tải bản trên tài khoản',409);}catch(e){if(/CHECK|UNIQUE/i.test(e.message))fail('save_conflict','Thao tác vừa được xử lý hoặc tiến trình đã đổi',409);throw e;}
 return response;
}
export async function economyBackup(env,acc,url){
 if(acc.username!=='danh')fail('admin_only','Chỉ admin được xem backup',403);
 const page=Math.max(0,Math.min(100000,Number(url.searchParams.get('page'))|0));
 const rows=(await stmt(env.DB,'SELECT * FROM economy_backups ORDER BY account_id LIMIT 10 OFFSET ?1',page*10).all()).results;
 if(url.searchParams.get('market')==='1'){const rows=(await stmt(env.DB,'SELECT row_json FROM economy_market_backup ORDER BY id LIMIT 100 OFFSET ?1',page*100).all()).results;return {v:1,page,rows:rows.map(r=>JSON.parse(r.row_json))};}
 return {v:1,page,rows:rows.map(r=>({...r,market:JSON.parse(r.market_json),snapshot:JSON.parse(r.snapshot||'null'),previous_snapshot:JSON.parse(r.previous_snapshot||'null'),market_json:undefined}))};
}
