import { HttpError, bearer, sha256Hex, randomToken, ipHash } from './http.js';
import { rateLimit } from './db.js';
import { cleanName } from './account.js';

export function cleanChat(text) {
  if (typeof text !== 'string') throw new HttpError(400, 'bad_text', 'Tin nhắn không hợp lệ');
  const value = text.normalize('NFC').replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
  if (!value || value.length > 300) throw new HttpError(400, 'bad_text', 'Tin nhắn cần từ 1 đến 300 ký tự');
  return value;
}

// Phiên chat riêng giúp mọi chế độ/cấp độ tham gia, không thay đổi tài khoản PvP.
export async function chatSession(req, env, body) {
  const name = cleanName(body.name);
  const ip = await ipHash(req, env);
  if (!await rateLimit(env.DB, 'chat-session:' + ip, 20, 3600))
    throw new HttpError(429, 'rate', 'Tạo phiên chat quá nhiều, thử lại sau');
  const token = randomToken(), id = randomToken(9), at = Date.now();
  await env.DB.prepare('INSERT INTO chat_sessions(id,token_hash,name,at) VALUES(?1,?2,?3,?4)')
    .bind(id, await sha256Hex(token), name, at).run();
  return { token };
}

export async function chatList(req, env, body, url) {
  const after = Number(url.searchParams.get('after') || 0);
  if (!Number.isSafeInteger(after) || after < 0) throw new HttpError(400, 'bad_cursor');
  const oldest = Date.now() - 7 * 864e5;
  const rows = await env.DB.prepare(after
    ? 'SELECT id,name,sender,text,at FROM chat_messages WHERE id>?1 AND at>?2 ORDER BY id LIMIT 50'
    : 'SELECT id,name,sender,text,at FROM chat_messages WHERE at>?1 ORDER BY id DESC LIMIT 50')
    .bind(...(after ? [after, oldest] : [oldest])).all();
  return { messages: after ? rows.results : rows.results.reverse() };
}

export async function chatSend(req, env, body) {
  const text = cleanChat(body.text), token = bearer(req);
  if (!token) throw new HttpError(401, 'no_token', 'Cần kết nối lại chat');
  const sender = await env.DB.prepare('SELECT id,name FROM chat_sessions WHERE token_hash=?1')
    .bind(await sha256Hex(token)).first();
  if (!sender) throw new HttpError(401, 'bad_token', 'Cần kết nối lại chat');
  const ip = await ipHash(req, env);
  if (!await rateLimit(env.DB, 'chat-ip:' + ip, 30, 60) ||
      !await rateLimit(env.DB, 'chat-send:' + sender.id, 1, 3))
    throw new HttpError(429, 'rate', 'Bạn gửi quá nhanh, vui lòng đợi vài giây');
  const at = Date.now();
  const message = await env.DB.prepare('INSERT INTO chat_messages(name,sender,text,at) VALUES(?1,?2,?3,?4) RETURNING id,name,sender,text,at')
    .bind(sender.name, sender.id, text, at).first();
  if(!env.SKIP_CHAT_CLEANUP)await env.DB.prepare('DELETE FROM chat_messages WHERE at<?1').bind(at - 7 * 864e5).run();
  return { message };
}
