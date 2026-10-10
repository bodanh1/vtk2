import {economyMeta,settleEconomy,economyPatch} from './economy.js';
import {HttpError,randomToken} from './http.js';
import {rateLimit} from './db.js';
import {GAME as G} from '../gen/game.js';
const DAYS=3*86400000,MAX=10;
const fail=(code,msg,status=400)=>{throw new HttpError(status,code,msg)};
const stmt=(db,q,...v)=>db.prepare(q).bind(...v);
export async function marketSaveCheck(db,id,bundle){
 for(const state of bundle.slots)if(state?.cid){
  const uids=[...(state.inv||[]),...Object.values(state.eq||{}),...(state.ground||[]).map(r=>r.it)].filter(Boolean).map(it=>it.uid).filter(Number.isSafeInteger);
  for(let i=0;i<uids.length;i+=80){const part=uids.slice(i,i+80),found=await stmt(db,'SELECT 1 FROM market_removed WHERE account_id=?1 AND cid=?2 AND uid IN ('+part.map((_,n)=>'?'+(n+3)).join(',')+') LIMIT 1',id,state.cid,...part).first();if(found)fail('market_restore','Bản lưu có đồ đã gửi lên Chợ đen; tải bản trên tài khoản để tiếp tục',409);}
 }
}
function receive(s,item){if(s.inv.length>=G.INV_MAX)fail('inventory_full','Hành trang đầy; dọn một ô trước');const ids=[...s.inv,...Object.values(s.eq||{}),...(s.ground||[]).map(r=>r.it)].filter(Boolean).map(it=>Number(it.uid)||0);s.uid=Math.max(Number(s.uid)||1,...ids.map(n=>n+1));const copy=structuredClone(item);copy.uid=s.uid++;copy.locked=true;s.inv.push(copy);}
export async function marketRoute(env,acc,body,url,method,cleanBundle){
 const db=env.DB,path=url.pathname.slice('/api/cloud/market/'.length),now=Date.now(),meta=await economyMeta(db,acc.id),secure=!!meta;
 if(method==='GET'&&path==='list'){
  const mode=url.searchParams.get('mode');if(!Object.hasOwn(G.MODES,mode))fail('market_mode','Chế độ không hợp lệ');
  const page=Math.min(10000,Math.max(0,Number(url.searchParams.get('page'))|0)),mine=url.searchParams.get('mine')==='1',q=(url.searchParams.get('q')||'').slice(0,60);
  const where=mine?'seller=?1 AND mode=?2 AND (status=\'active\' OR status=\'sold\' AND claimed=0)':'mode=?2 AND status=\'active\' AND expires_at>?3';
  // Keep placeholders identical on both queries, including own expired listings.
  const predicate=where+' AND (?3>=0) AND (?1 IS NOT NULL) AND name LIKE ?4 AND EXISTS(SELECT 1 FROM economy_states es WHERE es.account_id=market_listings.seller)='+Number(secure);
  const count=await stmt(db,'SELECT COUNT(*) n FROM market_listings WHERE '+predicate,acc.id,mode,now,'%'+q+'%').first();
  const rows=(await stmt(db,'SELECT id,seller,seller_name,name,item_json,currency,price,expires_at,status,claimed,cid FROM market_listings WHERE '+predicate+' ORDER BY created_at DESC LIMIT 20 OFFSET ?5',acc.id,mode,now,'%'+q+'%',page*20).all()).results.map(r=>({...r,item:JSON.parse(r.item_json),item_json:undefined,mine:r.seller===acc.id}));
  return {rows,total:count.n,page,pages:Math.ceil(count.n/20),now};
 }
 if(method!=='POST'||!['post','buy','cancel','collect'].includes(path))fail('not_found','Không có thao tác này',404);
 if(!/^[A-Za-z0-9_-]{16,80}$/.test(body.clientId||'')||!/^[A-Za-z0-9_-]{20,80}$/.test(body.requestId||''))fail('market_request','Yêu cầu không hợp lệ');
 const previous=await stmt(db,'SELECT client_id,response_json FROM market_requests WHERE account_id=?1 AND request_id=?2',acc.id,body.requestId).first();
 if(previous){if(previous.client_id!==body.clientId)fail('device_changed','Thiết bị đã đổi',409);return JSON.parse(previous.response_json);}
 if(path!=='collect'&&!await rateLimit(db,'market:'+acc.id,120,3600))fail('cloud_rate','Giao dịch quá nhanh; thử lại sau',429);
 const row=await stmt(db,'SELECT * FROM cloud_saves WHERE account_id=?1',acc.id).first();
 if(row.write_owner!==body.clientId||row.write_until<=now)fail('device_changed','Máy này chưa có quyền đồng bộ',409);
 if(row.revision!==body.revision)fail('save_conflict','Tiến trình đã thay đổi; tải bản tài khoản',409);
 const bundle=!secure&&body.bundle?cleanBundle(body.bundle):JSON.parse(row.snapshot||'null');if(!secure&&body.bundle)await marketSaveCheck(db,acc.id,bundle);if(secure)settleEconomy(bundle,meta,now);const s=Number.isInteger(body.slot)&&bundle?.slots[body.slot];
 if(!s?.fac||typeof s.cid!=='string'||!Array.isArray(s.inv))fail('no_character','Chọn nhân vật đã lưu lên tài khoản');
 const operations=[];let guard='1=1',args=[],message='';
 if(path==='post'){
  const item=s.inv.find(it=>it.uid===body.uid);if(!item||item.locked)fail('market_item','Chỉ đăng đồ trong hành trang đã bỏ khóa bảo vệ');
  if(!['knb','gold'].includes(body.currency)||!Number.isSafeInteger(body.price)||body.price<1||body.price>1000000000)fail('market_price','Giá phải là số nguyên từ 1 đến 1 tỷ');
  if(!Number.isSafeInteger(item.uid)||JSON.stringify(item).length>16000||!G.modeItemOk(item,s.mode))fail('market_item','Vật phẩm không hợp lệ');
  const n=await stmt(db,"SELECT COUNT(*) n FROM market_listings WHERE seller=?1 AND status='active'",acc.id).first();if(n.n>=MAX)fail('market_limit','Mỗi tài khoản được treo tối đa 10 món; nhận đồ hết hạn trước');
  const id=randomToken(18);s.inv=s.inv.filter(it=>it.uid!==item.uid);
  operations.push(stmt(db,"INSERT INTO market_listings(id,seller,seller_name,cid,slot,mode,name,item_json,currency,price,created_at,expires_at,status,claimed) VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,'active',0)",id,acc.id,acc.username,s.cid,body.slot,s.mode,String(item.n||'Trang bị').slice(0,120),JSON.stringify(item),body.currency,body.price,now,now+DAYS),stmt(db,'INSERT INTO market_removed(account_id,cid,uid) VALUES(?1,?2,?3)',acc.id,s.cid,item.uid));message='Đã đăng bán trong 3 ngày';
 }else if(path==='buy'||path==='cancel'){
  const listing=await stmt(db,'SELECT * FROM market_listings WHERE id=?1',String(body.id||'')).first();if(!listing||listing.status!=='active')fail('market_unavailable','Món đồ đã bán hoặc đã trả lại',409);
  guard="EXISTS(SELECT 1 FROM market_listings WHERE id=?5 AND status='active')";args=[listing.id];
  if(path==='buy'){
   if(!!await economyMeta(db,listing.seller)!==secure)fail('market_economy','Tài khoản chưa cùng cơ chế kinh tế; người bán cần tải lại game',409);
   if(listing.expires_at<=now)fail('market_expired','Tin bán đã hết 3 ngày');if(listing.seller===acc.id)fail('market_self','Không thể mua đồ của chính mình');if(listing.mode!==s.mode)fail('market_mode','Chỉ giao dịch trong cùng chế độ');
   const cost=listing.price*(listing.currency==='gold'?10000:1),balance=s[listing.currency]||0;if(!Number.isFinite(balance)||balance<cost)fail('market_funds','Không đủ '+(listing.currency==='gold'?'tiền vạn':'Kim Nguyên Bảo'));
   receive(s,JSON.parse(listing.item_json));s[listing.currency]=balance-cost;
   operations.push(stmt(db,"UPDATE market_listings SET status='sold',buyer=?2,sold_at=?3 WHERE id=?1",listing.id,acc.id,now));message='Đã mua; vật phẩm được khóa bảo vệ trong hành trang';
  }else{
   if(listing.seller!==acc.id||listing.cid!==s.cid)fail('market_owner','Chỉ nhân vật đăng bán được nhận lại món đồ',403);receive(s,JSON.parse(listing.item_json));operations.push(stmt(db,"UPDATE market_listings SET status='returned',claimed=1 WHERE id=?1",listing.id));message='Đã nhận lại vật phẩm';
  }
 }else{
  const pending=(await stmt(db,"SELECT * FROM market_listings WHERE seller=?1 AND cid=?2 AND mode=?3 AND ((status='sold' AND claimed=0) OR (status='active' AND expires_at<=?4)) ORDER BY created_at LIMIT 10",acc.id,s.cid,s.mode,now).all()).results;
  const done=[];for(const listing of pending){if(listing.status==='sold'){const value=listing.price*(listing.currency==='gold'?10000:1),balance=s[listing.currency]||0;if(!Number.isFinite(balance)||!Number.isSafeInteger(Math.floor(balance)+value))fail('market_balance','Số dư vượt giới hạn');s[listing.currency]=balance+value;}else{if(s.inv.length>=G.INV_MAX)continue;receive(s,JSON.parse(listing.item_json));}done.push(listing);}
  if(!done.length)return {ok:true,unchanged:true,message:pending.length?'Túi đầy; đồ hết hạn vẫn được giữ an toàn trên chợ':''};
  guard=done.map((r,i)=>`EXISTS(SELECT 1 FROM market_listings WHERE id=?${5+i} AND status='${r.status}' AND claimed=0)`).join(' AND ');args=done.map(r=>r.id);
  for(const r of done)operations.push(stmt(db,"UPDATE market_listings SET claimed=1,status=CASE WHEN status='active' THEN 'returned' ELSE status END WHERE id=?1",r.id));message='Đã nhận tiền bán đồ / đồ hết hạn';
 }
 const result={ok:true,revision:row.revision+1,updatedAt:now,slot:body.slot,cid:s.cid,changes:{inv:s.inv,uid:s.uid,gold:s.gold,knb:s.knb},patch:secure?economyPatch(bundle,meta):undefined,message};
 // CHECK failure aborts the entire D1 batch: no item/currency can move unless both save and listing are still current.
 const check=stmt(db,`INSERT INTO market_requests(account_id,request_id,client_id,response_json,created_at,ok) VALUES(?1,?2,?3,?4,${now},CASE WHEN EXISTS(SELECT 1 FROM cloud_saves WHERE account_id=?1 AND revision=${row.revision} AND write_owner=?3 AND write_until>${now}) AND ${guard} THEN 1 ELSE 0 END)`,acc.id,body.requestId,body.clientId,JSON.stringify(result),...args);
 if(secure)operations.push(stmt(db,'UPDATE economy_states SET meta_json=?2 WHERE account_id=?1',acc.id,JSON.stringify(meta)));
 try{await db.batch([check,...operations,stmt(db,'DELETE FROM market_requests WHERE account_id=?1 AND created_at<?2',acc.id,now-7*86400000),stmt(db,'DELETE FROM market_listings WHERE seller=?1 AND claimed=1 AND expires_at<?2',acc.id,now-7*86400000),stmt(db,'UPDATE cloud_saves SET previous_snapshot=NULL,previous_revision=0,snapshot=?2,revision=revision+1,updated_at=?3,write_until=?4 WHERE account_id=?1',acc.id,JSON.stringify(bundle),now,now+180000)]);}catch(e){const replay=await stmt(db,'SELECT client_id,response_json FROM market_requests WHERE account_id=?1 AND request_id=?2',acc.id,body.requestId).first();if(replay&&replay.client_id===body.clientId)return JSON.parse(replay.response_json);if(/CHECK|UNIQUE/i.test(e.message))fail('save_conflict','Giao dịch vừa thay đổi; tải bản tài khoản trước khi thử lại',409);throw e;}
 return result;
}
