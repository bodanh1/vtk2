CREATE TABLE IF NOT EXISTS player_rankings(actor_key TEXT NOT NULL,mode TEXT NOT NULL,char_id TEXT NOT NULL,name TEXT NOT NULL,fac TEXT NOT NULL,lvl INTEGER NOT NULL,xp REAL NOT NULL,power INTEGER NOT NULL,at INTEGER NOT NULL,PRIMARY KEY(actor_key,mode,char_id));
CREATE INDEX IF NOT EXISTS player_rankings_mode ON player_rankings(mode,lvl DESC,power DESC);
