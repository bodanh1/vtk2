import {HttpError,sha256Hex,ipHash} from './http.js';
import {rateLimit} from './db.js';
export const PRESENCE_TTL=90000;
export async function presence(req,env,body){
  if(req.headers.get('origin')!==new URL(req.url).origin)throw new HttpError(403,'bad_origin');
  if(!body||!['guestId','tabId'].every(k=>typeof body[k]==='string'&&/^[a-zA-Z0-9_-]{16,80}$/.test(body[k])))throw new HttpError(400,'bad_presence');
  const now=Date.now(),tab=await sha256Hex(body.tabId);
  if(body.leave===true){await env.DB.prepare('DELETE FROM player_presence WHERE tab_key=?1').bind(tab).run();}
  else{
    if(!await rateLimit(env.DB,'presence:'+await ipHash(req,env),180,60))throw new HttpError(429,'rate');
    const actor=await presenceActor(req,env,body.guestId);
    await env.DB.prepare('INSERT INTO player_presence(tab_key,actor_key,seen_at) VALUES(?1,?2,?3) ON CONFLICT(tab_key) DO UPDATE SET actor_key=excluded.actor_key,seen_at=excluded.seen_at').bind(tab,actor,now).run();
  }
  await env.DB.prepare('DELETE FROM player_presence WHERE seen_at<=?1').bind(now-PRESENCE_TTL).run();
  const row=await env.DB.prepare('SELECT COUNT(DISTINCT actor_key) AS online FROM player_presence WHERE seen_at>?1').bind(now-PRESENCE_TTL).first();
  return new Response(JSON.stringify({online:row.online}),{headers:{'content-type':'application/json','cache-control':'no-store'}});
}

export async function presenceActor(req,env,guestId){
  const token=/(?:^|;\s*)vltk_cloud=([A-Za-z0-9_-]{20,80})(?:;|$)/.exec(req.headers.get('cookie')||'')?.[1];
  const account=token?await env.DB.prepare('SELECT account_id FROM cloud_sessions WHERE token_hash=?1 AND expires_at>?2').bind(await sha256Hex(token),Date.now()).first():null;
  return account?'account:'+account.account_id:'guest:'+await sha256Hex(guestId);
}
