CREATE TABLE IF NOT EXISTS market_listings(id TEXT PRIMARY KEY,seller TEXT NOT NULL,seller_name TEXT NOT NULL,cid TEXT NOT NULL,slot INTEGER NOT NULL,mode TEXT NOT NULL,name TEXT NOT NULL,item_json TEXT NOT NULL,currency TEXT NOT NULL,price INTEGER NOT NULL,created_at INTEGER NOT NULL,expires_at INTEGER NOT NULL,status TEXT NOT NULL,claimed INTEGER NOT NULL DEFAULT 0,buyer TEXT,sold_at INTEGER);
CREATE INDEX IF NOT EXISTS market_browse ON market_listings(mode,status,expires_at,created_at);
CREATE INDEX IF NOT EXISTS market_seller ON market_listings(seller,cid,status,claimed);
CREATE TABLE IF NOT EXISTS market_requests(account_id TEXT NOT NULL,request_id TEXT NOT NULL,client_id TEXT NOT NULL,response_json TEXT NOT NULL,created_at INTEGER NOT NULL,ok INTEGER NOT NULL CHECK(ok=1),PRIMARY KEY(account_id,request_id));
CREATE TABLE IF NOT EXISTS market_removed(account_id TEXT NOT NULL,cid TEXT NOT NULL,uid INTEGER NOT NULL,PRIMARY KEY(account_id,cid,uid));
