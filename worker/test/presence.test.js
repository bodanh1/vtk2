import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {SCHEMA} from '../src/db.js';
import {presence,PRESENCE_TTL} from '../src/presence.js';
import {sha256Hex} from '../src/http.js';
function setup() {
  const sql = new DatabaseSync(':memory:');
  for (const statement of SCHEMA) sql.exec(statement);
  const DB = { prepare(query) {
    let args = [];
    return { bind(...values) { args = values; return this },
      async first() { return sql.prepare(query).get(...args) || null },
      async all() { return { results: sql.prepare(query).all(...args) } },
      async run() { return sql.prepare(query).run(...args) } };
  } };
  return { env: { DB }, sql };
}

const guestId='guest_abcdefghijklmnop',tabId='tab_abcdefghijklmnop';
const req=cookie=>new Request('https://game.example/api/presence',{method:'POST',headers:{origin:'https://game.example',...(cookie?{cookie}:{})}});
const beat=async(env,data,cookie)=>(await presence(req(cookie),env,data)).json();
test('presence: cùng trình duyệt nhiều tab chỉ tính một, rời tab không xóa tab khác',async()=>{const {env,sql}=setup();assert.equal((await beat(env,{guestId,tabId})).online,1);assert.equal((await beat(env,{guestId,tabId:'second_abcdefghijklmnop'})).online,1);assert.equal((await beat(env,{guestId:'other_abcdefghijklmnop',tabId:'third_abcdefghijklmnop'})).online,2);assert.equal((await beat(env,{guestId,tabId,leave:true})).online,2);assert.equal((await beat(env,{guestId,tabId:'second_abcdefghijklmnop',leave:true})).online,1);sql.close()});
test('presence: mọi máy của một tài khoản tính một, token giả không giả tài khoản',async()=>{const {env,sql}=setup(),token='token_abcdefghijklmnopqrstuv';sql.prepare('INSERT INTO cloud_sessions(token_hash,account_id,created_at,expires_at) VALUES(?,?,?,?)').run(await sha256Hex(token),'account1',Date.now(),Date.now()+60000);assert.equal((await beat(env,{guestId,tabId},'vltk_cloud='+token)).online,1);assert.equal((await beat(env,{guestId:'other_abcdefghijklmnop',tabId:'second_abcdefghijklmnop'},'vltk_cloud='+token)).online,1);assert.equal((await beat(env,{guestId:'fake_abcdefghijklmnop',tabId:'third_abcdefghijklmnop'},'vltk_cloud=fake_abcdefghijklmnopqrstuv')).online,2);sql.close()});
test('presence: hết hạn 90 giây, không lấy số bot hoặc số do client gửi',async()=>{const {env,sql}=setup();await beat(env,{guestId,tabId});sql.prepare('UPDATE player_presence SET seen_at=?').run(Date.now()-PRESENCE_TTL);assert.equal((await beat(env,{guestId:'other_abcdefghijklmnop',tabId:'second_abcdefghijklmnop',online:999,bots:30})).online,1);assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM player_presence').get().n,1);await assert.rejects(presence(req(),env,{guestId:'bad',tabId}),e=>e.code==='bad_presence');await assert.rejects(presence(new Request('https://game.example/api/presence',{method:'POST',headers:{origin:'https://other.example'}}),env,{guestId,tabId}),e=>e.code==='bad_origin');sql.close()});
