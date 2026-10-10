// Lược đồ D1. Mọi câu lệnh đều idempotent (IF NOT EXISTS) và được chạy một lần mỗi isolate,
// nên deploy không cần bước "d1 migrations apply" riêng. Bản SQL tham chiếu: migrations/0001_init.sql.

export const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS market_listings(id TEXT PRIMARY KEY,seller TEXT NOT NULL,seller_name TEXT NOT NULL,cid TEXT NOT NULL,slot INTEGER NOT NULL,mode TEXT NOT NULL,name TEXT NOT NULL,item_json TEXT NOT NULL,currency TEXT NOT NULL,price INTEGER NOT NULL,created_at INTEGER NOT NULL,expires_at INTEGER NOT NULL,status TEXT NOT NULL,claimed INTEGER NOT NULL DEFAULT 0,buyer TEXT,sold_at INTEGER)`,
  `CREATE INDEX IF NOT EXISTS market_browse ON market_listings(mode,status,expires_at,created_at)`,
  `CREATE INDEX IF NOT EXISTS market_seller ON market_listings(seller,cid,status,claimed)`,
  `CREATE TABLE IF NOT EXISTS market_requests(account_id TEXT NOT NULL,request_id TEXT NOT NULL,client_id TEXT NOT NULL,response_json TEXT NOT NULL,created_at INTEGER NOT NULL,ok INTEGER NOT NULL CHECK(ok=1),PRIMARY KEY(account_id,request_id))`,
  `CREATE TABLE IF NOT EXISTS market_removed(account_id TEXT NOT NULL,cid TEXT NOT NULL,uid INTEGER NOT NULL,PRIMARY KEY(account_id,cid,uid))`,
  `CREATE TABLE IF NOT EXISTS admin_grants(account_id TEXT NOT NULL,request_id TEXT NOT NULL,client_id TEXT NOT NULL,slot INTEGER NOT NULL,entry_id TEXT NOT NULL,quantity INTEGER NOT NULL,created_at INTEGER NOT NULL,response_json TEXT NOT NULL,PRIMARY KEY(account_id,request_id))`,
  `CREATE TABLE IF NOT EXISTS player_rankings(actor_key TEXT NOT NULL,mode TEXT NOT NULL,char_id TEXT NOT NULL,name TEXT NOT NULL,fac TEXT NOT NULL,lvl INTEGER NOT NULL,xp REAL NOT NULL,power INTEGER NOT NULL,at INTEGER NOT NULL,PRIMARY KEY(actor_key,mode,char_id))`,
  `CREATE INDEX IF NOT EXISTS player_rankings_mode ON player_rankings(mode,lvl DESC,power DESC)`,
  `CREATE TABLE IF NOT EXISTS player_presence(tab_key TEXT PRIMARY KEY,actor_key TEXT NOT NULL,seen_at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS player_presence_seen ON player_presence(seen_at)`,
  `CREATE TABLE IF NOT EXISTS cloud_pvp_links(cloud_account_id TEXT NOT NULL,slot INTEGER NOT NULL,pvp_account_id TEXT NOT NULL UNIQUE,PRIMARY KEY(cloud_account_id,slot))`,
  `CREATE TABLE IF NOT EXISTS cloud_accounts(id TEXT PRIMARY KEY,username TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL,password_salt TEXT NOT NULL,password_iterations INTEGER NOT NULL,created_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS cloud_sessions(token_hash TEXT PRIMARY KEY,account_id TEXT NOT NULL,created_at INTEGER NOT NULL,expires_at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS cloud_sessions_account ON cloud_sessions(account_id)`,
  `CREATE TABLE IF NOT EXISTS cloud_saves(account_id TEXT PRIMARY KEY,revision INTEGER NOT NULL DEFAULT 0,snapshot TEXT,updated_at INTEGER,previous_snapshot TEXT,previous_revision INTEGER,previous_updated_at INTEGER,write_owner TEXT,write_label TEXT,write_until INTEGER NOT NULL DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS chat_sessions(id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE, name TEXT NOT NULL, at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS chat_messages(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, sender TEXT NOT NULL, text TEXT NOT NULL, at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS chat_messages_at ON chat_messages(at)`,
  `CREATE TABLE IF NOT EXISTS accounts(
    id TEXT PRIMARY KEY,
    token_hash TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    ip_hash TEXT,
    play_sec REAL NOT NULL DEFAULT 0,
    last_hb INTEGER,
    off_t0 INTEGER,
    off_sec REAL NOT NULL DEFAULT 0
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS accounts_name ON accounts(name COLLATE NOCASE)`,
  `CREATE TABLE IF NOT EXISTS chars(
    account_id TEXT PRIMARY KEY,
    mode TEXT NOT NULL DEFAULT 'ctc',
    fac TEXT,
    sex INTEGER,
    lvl INTEGER NOT NULL DEFAULT 1,
    xp REAL NOT NULL DEFAULT 0,
    snapshot TEXT,
    updated_at INTEGER,
    sync_n INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS rate(k TEXT PRIMARY KEY, n INTEGER NOT NULL, t INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS flags(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id TEXT NOT NULL,
    code TEXT NOT NULL,
    detail TEXT,
    at INTEGER NOT NULL,
    cleared_at INTEGER
  )`,
  `CREATE INDEX IF NOT EXISTS flags_acc ON flags(account_id, cleared_at)`,
  `CREATE INDEX IF NOT EXISTS flags_at ON flags(at)`,
  `CREATE TABLE IF NOT EXISTS feedback(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    at INTEGER NOT NULL,
    cat TEXT NOT NULL,
    text TEXT NOT NULL,
    contact TEXT,
    ctx TEXT,
    ip_hash TEXT,
    status TEXT NOT NULL DEFAULT 'open'
  )`,
  `CREATE INDEX IF NOT EXISTS feedback_at ON feedback(status, at)`,
];

// Cột thêm sau lần phát hành đầu: ALTER chạy riêng, bỏ qua lỗi "duplicate column" khi đã có.
const COLUMNS = [
  "ALTER TABLE chars ADD COLUMN mode TEXT NOT NULL DEFAULT 'ctc'",
  "ALTER TABLE chars ADD COLUMN power INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE chars ADD COLUMN bracket TEXT",
  "ALTER TABLE chars ADD COLUMN flagged INTEGER NOT NULL DEFAULT 0",
];

let ready = null;

export function ensureSchema(db) {
  if (!ready) {
    ready = db
      .batch(SCHEMA.map((s) => db.prepare(s)))
      .then(async () => {
        let addedMode=false;
        for(const sql of COLUMNS){try{await db.prepare(sql).run();if(sql===COLUMNS[0])addedMode=true;}catch(e){if(!/duplicate column/i.test(String(e&&e.message)))throw e;}}
        if(addedMode)await db.prepare("UPDATE chars SET mode=json_extract(snapshot,'$.mode') WHERE snapshot IS NOT NULL AND json_valid(snapshot) AND json_extract(snapshot,'$.mode') IN ('ctc','phlt','g2') AND mode<>json_extract(snapshot,'$.mode')").run();
        await db.prepare("CREATE INDEX IF NOT EXISTS chars_mode_ladder ON chars(mode,bracket,flagged,power)").run();
        await db.prepare("CREATE INDEX IF NOT EXISTS chars_ladder ON chars(bracket, flagged, power)").run();
      })
      .catch((e) => {
        ready = null;
        throw e;
      });
  }
  return ready;
}

// Giới hạn tốc độ đơn giản theo cửa sổ cố định, lưu trong D1.
export async function rateLimit(db, key, max, windowSec) {
  const now = Math.floor(Date.now() / 1000);
  const t0 = now - (now % windowSec);
  const row = await db
    .prepare(
      `INSERT INTO rate(k,n,t) VALUES(?1,1,?2)
       ON CONFLICT(k) DO UPDATE SET n=CASE WHEN rate.t=?2 THEN rate.n+1 ELSE 1 END, t=?2
       RETURNING n`
    )
    .bind(key, t0)
    .first();
  return row.n <= max;
}
