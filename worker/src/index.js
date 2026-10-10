// Worker của Võ Lâm Idle: phục vụ file tĩnh (binding ASSETS) và API tài khoản/lưu cloud, chat và online Công Thành Chiến.
// Chỉ đường dẫn /api/* chạy qua Worker (assets.run_worker_first trong wrangler.jsonc).
import { HttpError, json, readJson, CORS } from "./http.js";
import { ensureSchema } from "./db.js";
import { register, heartbeat, sync, me } from "./account.js";
import { ladder, notices, adminFlags, adminUnflag } from "./ladder.js";
import { feedback, adminFeedback, adminFeedbackSet } from "./feedback.js";

import { cloudRoute } from './cloud-account.js';
import { chatSession, chatList, chatSend } from "./chat.js";

import {presence} from "./presence.js";

import {playerRankingSync,playerRankingList} from "./player-rankings.js";

const ROUTES = {
  "POST /api/player-rankings": playerRankingSync,
  "GET /api/player-rankings": playerRankingList,
  "POST /api/presence": presence,
  "POST /api/chat/session": chatSession,
  "GET /api/chat": chatList,
  "POST /api/chat": chatSend,
  "GET /api/config": (req, env) => ({ turnstile: env.TURNSTILE_SITEKEY || "", v: 1, economyVersion:env.SERVER_ECONOMY_ENABLED==='1'?1:0 }),
  "POST /api/register": (req, env, body) => register(req, env, body),
  "POST /api/hb": (req, env) => heartbeat(req, env),
  "POST /api/sync": (req, env, body) => sync(req, env, body),
  "GET /api/me": (req, env) => me(req, env),
  "GET /api/ladder": ladder,
  "GET /api/notices": notices,
  "GET /api/admin/flags": adminFlags,
  "POST /api/admin/unflag": adminUnflag,
  "POST /api/feedback": feedback,
  "GET /api/admin/feedback": adminFeedback,
  "POST /api/admin/feedback": adminFeedbackSet,
};

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(req);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    const fn = url.pathname.startsWith("/api/cloud/") ? cloudRoute : ROUTES[req.method + " " + url.pathname];
    if (!fn) return json({ error: "not_found" }, 404);
    try {
      if (!env.DB) throw new HttpError(503, "no_db", "Chưa gắn cơ sở dữ liệu D1");
      await ensureSchema(env.DB);
      const body = req.method === "POST" ? await readJson(req) : null;
      const result=await fn(req, env, body, url, ctx);
      return result instanceof Response ? result : json(result);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.code, msg: e.message }, e.status);
      console.error("api", url.pathname, e && e.stack);
      return json({ error: "server", msg: "Lỗi máy chủ" }, 500);
    }
  },
};
