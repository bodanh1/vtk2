import {economyMeta} from './economy.js';
import {HttpError,ipHash} from './http.js';
import {rateLimit} from './db.js';
import {presenceActor} from './presence.js';
import {validateChar} from './validate.js';
import {cleanName} from './account.js';
import {GAME as G} from '../gen/game.js';
export async function playerRankingSync(req,env,body){
  if(req.headers.get('origin')!==new URL(req.url).origin)throw new HttpError(403,'bad_origin');
  if(!body||typeof body.guestId!=='string'||!/^[a-zA-Z0-9_-]{16,80}$/.test(body.guestId))throw new HttpError(400,'bad_identity');
  const actor=await presenceActor(req,env,body.guestId);let s=body.state;if(actor.startsWith('account:')){const id=actor.slice(8);if(await economyMeta(env.DB,id)){const row=await env.DB.prepare('SELECT snapshot FROM cloud_saves WHERE account_id=?1').bind(id).first();s=JSON.parse(row?.snapshot||'null')?.slots.find(x=>x?.cid===body.state?.cid);}}
  if(!s||!G.isMode(s.mode)||!Object.hasOwn(G.FAC,s.fac)||!Number.isInteger(s.lvl)||s.lvl<1||s.lvl>G.MAX_LEVEL||typeof s.cid!=='string'||s.cid.length<8||s.cid.length>80||!Number.isFinite(s.xp)||s.xp<0||s.sandbox)throw new HttpError(400,'bad_character');
  if(!await rateLimit(env.DB,'ranking:'+await ipHash(req,env),60,60))throw new HttpError(429,'rate');
  const name=cleanName(s.name);
  const result=validateChar(s,null,s.mode);
  if(result.flags.length)throw new HttpError(400,'unranked','Nhân vật chưa đáp ứng kiểm định xếp hạng');
  await env.DB.prepare('DELETE FROM player_rankings WHERE actor_key=?1 AND char_id=?2 AND mode<>?3').bind(actor,s.cid,s.mode).run();
  // Khi đăng nhập, chuyển cùng nhân vật của trình duyệt khách sang tài khoản, tránh hai dòng trùng.
  if(actor.startsWith('account:')){const guest=await presenceActor(new Request(req.url),env,body.guestId);await env.DB.prepare('DELETE FROM player_rankings WHERE actor_key=?1 AND char_id=?2').bind(guest,s.cid).run();}
  await env.DB.prepare('INSERT INTO player_rankings(actor_key,mode,char_id,name,fac,lvl,xp,power,at) VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9) ON CONFLICT(actor_key,mode,char_id) DO UPDATE SET name=excluded.name,fac=excluded.fac,lvl=excluded.lvl,xp=excluded.xp,power=excluded.power,at=excluded.at').bind(actor,s.mode,s.cid,name,s.fac,s.lvl,s.xp,result.power,Date.now()).run();
  return {ok:true};
}
export async function playerRankingList(req,env,body,url){
  const mode=url.searchParams.get('mode')||'ctc';if(!G.isMode(mode))throw new HttpError(400,'bad_mode');
  const rows=await env.DB.prepare('SELECT name,fac,lvl,power,at FROM player_rankings WHERE mode=?1 ORDER BY lvl DESC,power DESC,xp DESC,name ASC LIMIT 100').bind(mode).all();
  return {mode,rows:rows.results.map((r,i)=>({rank:i+1,...r}))};
}
