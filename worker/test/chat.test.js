import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { SCHEMA } from '../src/db.js';
import { cleanChat, chatSession, chatSend, chatList } from '../src/chat.js';

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
const req = token => new Request('https://game.example/api/chat', { headers: token ? { authorization: 'Bearer ' + token } : {} });

test('chat chuẩn hóa tiếng Việt, giới hạn độ dài, chặn dữ liệu rỗng', () => {
  assert.equal(cleanChat('  Xin chào\nmap mới  '), 'Xin chào map mới');
  for (const value of ['', '  ', null, 7, 'a'.repeat(301)]) assert.throws(() => cleanChat(value));
});

test('hai nhân vật đọc cùng kênh; lấy lịch sử và phân trang không bỏ tin', async () => {
  const { env, sql } = setup();
  const a = await chatSession(req(), env, { name: 'Cái Bang' });
  const b = await chatSession(req(), env, { name: 'Nga My' });
  const first = await chatSend(req(a.token), env, { text: 'Map 1 chào mọi người' });
  const second = await chatSend(req(b.token), env, { text: 'Map 2 chào lại' });
  const all = await chatList(req(), env, null, new URL('https://game.example/api/chat'));
  assert.deepEqual(all.messages.map(x => x.text), ['Map 1 chào mọi người', 'Map 2 chào lại']);
  assert.equal(all.messages[0].name, 'Cái Bang');
  const next = await chatList(req(), env, null, new URL('https://game.example/api/chat?after=' + first.message.id));
  assert.equal(next.messages.length, 1); assert.equal(next.messages[0].id, second.message.id);
  await assert.rejects(chatSend(req(a.token), env, { text: 'Spam' }), e => e.status === 429);
  await assert.rejects(chatSend(req(), env, { text: 'Giả tên' }), e => e.status === 401);
  await assert.rejects(chatSend(req('x'.repeat(24)), env, { text: 'Giả token' }), e => e.status === 401);
  sql.close();
});

test('chat chỉ tải 50 tin gần nhất và không hiển thị tin quá 7 ngày', async () => {
  const { env, sql } = setup();
  const insert = sql.prepare('INSERT INTO chat_messages(name,sender,text,at) VALUES(?,?,?,?)');
  insert.run('Old', 'old', 'old', Date.now() - 8 * 864e5);
  for (let i = 0; i < 60; i++) insert.run('User', 'sender', String(i), Date.now());
  const result = await chatList(req(), env, null, new URL('https://game.example/api/chat'));
  assert.equal(result.messages.length, 50); assert.equal(result.messages[0].text, '10');
  await assert.rejects(chatList(req(), env, null, new URL('https://game.example/api/chat?after=-1')), e => e.status === 400);
  sql.close();
});
