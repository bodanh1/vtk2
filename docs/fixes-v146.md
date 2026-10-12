# v146 — show rebirth; rank by power

- Rank separately by game mode using power descending, then level, EXP and name. Rebirth count is displayed as information only, following the corrected user request.
- Capture `rw.stat.reborn`, display a Chuyển sinh column and include the counter in the frontend sync fingerprint. No extra recurring request is introduced.
- Add a default0 column for existing rankings, migrate once and backfill account entries from matching cloud save slots. Invalid JSON saves safely remain0; guest rows update on their next regular sync. Keep existing names, records and character IDs.
- Use a matching compound index. Tests cover ordering, update without duplicate rows, invalid counters and real SQLite migration of old tables.
