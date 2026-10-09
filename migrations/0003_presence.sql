-- Thống kê người chơi online dùng chung mọi map/chế độ; tự khởi tạo trong ensureSchema.
CREATE TABLE IF NOT EXISTS player_presence(tab_key TEXT PRIMARY KEY,actor_key TEXT NOT NULL,seen_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS player_presence_seen ON player_presence(seen_at);
