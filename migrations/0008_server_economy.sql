CREATE TABLE IF NOT EXISTS economy_backup_marks(id TEXT PRIMARY KEY,created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS economy_market_backup(id TEXT PRIMARY KEY,row_json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS economy_states(account_id TEXT PRIMARY KEY,meta_json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS economy_backups(account_id TEXT PRIMARY KEY,snapshot TEXT,previous_snapshot TEXT,revision INTEGER NOT NULL,updated_at INTEGER NOT NULL,market_json TEXT NOT NULL,created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS economy_requests(account_id TEXT NOT NULL,request_id TEXT NOT NULL,client_id TEXT NOT NULL,revision INTEGER NOT NULL,created_at INTEGER NOT NULL,ok INTEGER NOT NULL CHECK(ok=1),PRIMARY KEY(account_id,request_id));
CREATE INDEX IF NOT EXISTS economy_requests_age ON economy_requests(account_id,created_at);
CREATE TABLE IF NOT EXISTS economy_ledger(account_id TEXT NOT NULL,request_id TEXT NOT NULL,action TEXT NOT NULL,delta_json TEXT NOT NULL,created_at INTEGER NOT NULL,PRIMARY KEY(account_id,request_id));
CREATE INDEX IF NOT EXISTS economy_ledger_age ON economy_ledger(account_id,created_at);
