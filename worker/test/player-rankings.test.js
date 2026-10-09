import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {SCHEMA} from '../src/db.js';
import {GAME as G} from '../gen/game.js';
import {playerRankingSync,playerRankingList} from '../src/player-rankings.js';
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


const guestId='guest_abcdefghijklmnop';
const req=()=>new Request('https://game.example/api/player-rankings',{method:'POST',headers:{origin:'https://game.example'}});
const state=(mode,lvl,name='Đại Hiệp',cid='character_abcdefghijkl')=>({...G.newSave(),fac:'shaolin',mode,lvl,name,cid,xp:0});
const list=(env,mode)=>playerRankingList(req(),env,null,new URL('https://game.example/api/player-rankings?mode='+mode));
test('xếp hạng: ba chế độ riêng, cấp trước lực chiến; cùng nhân vật đồng bộ không trùng',async()=>{const {env,sql}=setup();for(const mode of ['ctc','phlt','g2'])await playerRankingSync(req(),env,{guestId,state:state(mode,20,'Đại Hiệp',mode+'_abcdefghijkl')});await playerRankingSync(req(),env,{guestId,state:state('ctc',30,'Cao Thủ','second_abcdefghijkl')});await playerRankingSync(req(),env,{guestId,state:state('ctc',31,'Cao Thủ','second_abcdefghijkl')});assert.deepEqual((await list(env,'ctc')).rows.map(x=>x.lvl),[31,20]);for(const mode of ['phlt','g2'])assert.equal((await list(env,mode)).rows.length,1);assert.ok((await list(env,'g2')).rows[0].power>0);sql.close()});
test('xếp hạng: nhân vật chuyển chế độ chỉ còn ở bảng mới, từ chối điểm/vật phẩm bất hợp lệ',async()=>{const {env,sql}=setup();await playerRankingSync(req(),env,{guestId,state:state('ctc',30)});await playerRankingSync(req(),env,{guestId,state:state('g2',30)});assert.equal((await list(env,'ctc')).rows.length,0);assert.equal((await list(env,'g2')).rows.length,1);const bad=state('g2',30);bad.attr.str=100000;await assert.rejects(playerRankingSync(req(),env,{guestId,state:bad}),e=>e.code==='unranked');await assert.rejects(list(env,'fake'),e=>e.code==='bad_mode');await assert.rejects(playerRankingSync(req(),env,{guestId,state:{...bad,lvl:999}}),e=>e.code==='bad_character');sql.close()});
