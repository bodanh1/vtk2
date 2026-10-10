import {HttpError,json,readJson,ipHash,sha256Hex} from './http.js';
import {chatSession,chatList,chatSend} from './chat.js';
import {presenceActor,PRESENCE_TTL} from './presence.js';
// Presence is ephemeral: never write a database row for a heartbeat.
// Chat alone uses the room's SQLite; account/inventory data stays in D1.
export class SocialRoom {
 constructor(ctx,env){
  this.ctx=ctx;this.env=env;this.sql=ctx.storage.sql;this.tabs=new Map();this.rates=new Map();this.identities=new Map();this.listCache=new Map();this.prunedAt=0;this.cleanedAt=0;
  if(!this.sql.exec("SELECT name FROM sqlite_master WHERE name='social_version'").toArray().length)this.sql.exec(`CREATE TABLE chat_sessions(id TEXT PRIMARY KEY,token_hash TEXT NOT NULL UNIQUE,name TEXT NOT NULL,at INTEGER NOT NULL);CREATE TABLE chat_messages(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,sender TEXT NOT NULL,text TEXT NOT NULL,at INTEGER NOT NULL);CREATE INDEX chat_messages_at ON chat_messages(at);CREATE TABLE rate(k TEXT PRIMARY KEY,n INTEGER NOT NULL,t INTEGER NOT NULL);CREATE INDEX rate_t ON rate(t);CREATE INDEX chat_sessions_at ON chat_sessions(at);CREATE TABLE social_version(v INTEGER);INSERT INTO social_version VALUES(1);`);
  const sql=this.sql;this.db={prepare(query){let args=[];const rows=()=>{const values=[];const q=query.replace(/\?(\d+)/g,(_,n)=>{values.push(args[Number(n)-1]);return '?'});return sql.exec(q,...values).toArray()};return {bind(...v){args=v;return this},async first(){return rows()[0]||null},async all(){return {results:rows()}},async run(){rows();return {}}}}};
 }
 limited(key,now){if(!this.rates.has(key)&&this.rates.size>=50000)return false;const minute=Math.floor(now/60000),old=this.rates.get(key),n=old?.minute===minute?old.n+1:1;this.rates.set(key,{minute,n});return n<=180;}
 prune(now){if(now-this.prunedAt<10000)return;this.prunedAt=now;for(const [key,row]of this.tabs)if(row.at<=now-PRESENCE_TTL)this.tabs.delete(key);for(const [key,row]of this.rates)if(row.minute<Math.floor(now/60000))this.rates.delete(key);for(const [key,row]of this.identities)if(row.until<=now)this.identities.delete(key);}
 async actor(req,guest,now){const cookie=req.headers.get('cookie')||'';if(!cookie)return presenceActor(req,this.env,guest);const key=await sha256Hex(cookie),cached=this.identities.get(key);if(cached?.until>now)return cached.actor;const actor=await presenceActor(req,this.env,guest);if(this.identities.size<50000)this.identities.set(key,{actor,until:now+60000});return actor;}
 async presence(req,body){
  if(req.headers.get('origin')!==new URL(req.url).origin)throw new HttpError(403,'bad_origin');
  if(!body||!['guestId','tabId'].every(k=>typeof body[k]==='string'&&/^[a-zA-Z0-9_-]{16,80}$/.test(body[k])))throw new HttpError(400,'bad_presence');
  const now=Date.now();this.prune(now);const tab=await sha256Hex(body.tabId);
  if(!this.limited(await ipHash(req,this.env),now))throw new HttpError(429,'rate');
  if(body.leave===true)this.tabs.delete(tab);else{if(this.tabs.size>=50000&&!this.tabs.has(tab))throw new HttpError(503,'social_busy','Thống kê online đang quá tải');this.tabs.set(tab,{actor:await this.actor(req,body.guestId,now),at:now});}
  return {online:this.online(now)};
 }
 online(now){const actors=new Set();for(const row of this.tabs.values())if(row.at>now-PRESENCE_TTL)actors.add(row.actor);for(const ws of this.ctx.getWebSockets?.()||[]){const row=ws.deserializeAttachment();if(row?.at>now-PRESENCE_TTL)actors.add(row.actor);}return actors.size;}
 async connect(req,url){
  if(req.headers.get('upgrade')?.toLowerCase()!=='websocket')throw new HttpError(426,'upgrade_required');
  if(req.headers.get('origin')!==url.origin)throw new HttpError(403,'bad_origin');
  const guest=url.searchParams.get('guestId'),tab=url.searchParams.get('tabId');if(![guest,tab].every(x=>/^[a-zA-Z0-9_-]{16,80}$/.test(x||'')))throw new HttpError(400,'bad_presence');
  const now=Date.now(),ip=await ipHash(req,this.env);this.prune(now);if(!this.limited(ip,now))throw new HttpError(429,'rate');if(this.ctx.getWebSockets().length>=10000)throw new HttpError(503,'social_busy');
  const actor=await this.actor(req,guest,now),pair=new WebSocketPair(),[client,server]=Object.values(pair);this.ctx.acceptWebSocket(server);server.serializeAttachment({actor,tab,at:now,chat:false});server.send(JSON.stringify({type:'online',online:this.online(now)}));return new Response(null,{status:101,webSocket:client});
 }
 webSocketMessage(ws,message){
  if(typeof message!=='string'||message.length>1024){ws.close(1008,'Invalid message');return;}let body;try{body=JSON.parse(message)}catch{ws.close(1008,'Invalid JSON');return;}
  if(!body||typeof body!=='object'||Array.isArray(body)){ws.close(1008,'Invalid payload');return;}const row=ws.deserializeAttachment();if(!row)return;const now=Date.now();if(now-row.at<1000){if((row.burst=(row.burst||0)+1)>10){ws.close(1008,'Too fast');return;}}else row.burst=0;
  if(body.type!=='heartbeat'&&body.type!=='chat'){ws.close(1008,'Invalid action');return;}row.at=now;if(body.type==='chat')row.chat=body.open===true;ws.serializeAttachment(row);this.prune(now);ws.send(JSON.stringify({type:'online',online:this.online(now)}));
 }
 webSocketClose(ws,code){const row=ws.deserializeAttachment();if(row){row.at=0;ws.serializeAttachment(row);}ws.close([1005,1006,1015].includes(code)?1000:code);}
 webSocketError(ws){this.webSocketClose(ws,1011);}
 broadcast(message){const data=JSON.stringify({type:'chat',messages:[message]});for(const ws of this.ctx.getWebSockets?.()||[])if(ws.deserializeAttachment()?.chat)try{ws.send(data)}catch{}}
 async history(){
  if(this.historyReady)return this.historyReady;
  this.historyReady=(async()=>{if(this.sql.exec('SELECT v FROM social_version WHERE v=2').toArray().length)return;
   // Import only into an empty room. Never overwrite newer messages after a restart.
   if(!this.sql.exec('SELECT id FROM chat_messages LIMIT 1').toArray().length&&this.env.DB){try{const rows=(await this.env.DB.prepare('SELECT id,name,sender,text,at FROM chat_messages WHERE at>?1 ORDER BY id DESC LIMIT 50').bind(Date.now()-7*86400000).all()).results;for(const row of rows.reverse())this.sql.exec('INSERT OR IGNORE INTO chat_messages(id,name,sender,text,at) VALUES(?,?,?,?,?)',row.id,row.name,row.sender,row.text,row.at);}catch(e){console.warn('Previous chat remains archived in D1');}}
   this.sql.exec('INSERT INTO social_version VALUES(2)');
  })();return this.historyReady;
 }
 async fetch(req){try{
  const url=new URL(req.url);if(url.pathname==='/api/social'&&req.method==='GET')return await this.connect(req,url);const body=req.method==='POST'?await readJson(req,16384):null,now=Date.now();
  if(url.pathname==='/api/presence'&&req.method==='POST')return json(await this.presence(req,body));
  await this.history();const env={...this.env,DB:this.db,SKIP_CHAT_CLEANUP:true};
  if(url.pathname==='/api/chat/session'&&req.method==='POST')return json(await chatSession(req,env,body));
  if(url.pathname==='/api/chat'&&req.method==='GET'){const key=url.search;const hit=this.listCache.get(key);if(hit&&now-hit.at<4000)return json(hit.data);const data=await chatList(req,env,body,url);if(this.listCache.size>=100)this.listCache.clear();this.listCache.set(key,{at:now,data});return json(data);}
  if(url.pathname==='/api/chat'&&req.method==='POST'){const data=await chatSend(req,env,body);this.listCache.clear();this.broadcast(data.message);if(now-this.cleanedAt>=3600000){this.sql.exec('DELETE FROM chat_messages WHERE at<?',now-7*86400000);this.sql.exec('DELETE FROM rate WHERE t<?',Math.floor(now/1000)-3600);this.sql.exec('DELETE FROM chat_sessions WHERE at<?',now-7*86400000);this.cleanedAt=now;}return json(data);}
  throw new HttpError(404,'not_found');
 }catch(e){if(e instanceof HttpError)return json({error:e.code,msg:e.message},e.status);console.error('social',e.message);return json({error:'social_unavailable',msg:'Chat và online tạm gián đoạn; thử lại sau',retryAfter:30},503);}}
}
