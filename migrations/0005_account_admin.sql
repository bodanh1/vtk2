CREATE TABLE IF NOT EXISTS admin_grants(
  account_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  slot INTEGER NOT NULL,
  entry_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  response_json TEXT NOT NULL,
  PRIMARY KEY(account_id,request_id)
);
