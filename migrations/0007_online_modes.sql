-- Runtime ensureSchema applies this column automatically, then backfills once.
ALTER TABLE chars ADD COLUMN mode TEXT NOT NULL DEFAULT 'ctc';
UPDATE chars SET mode=json_extract(snapshot,'$.mode') WHERE snapshot IS NOT NULL AND json_valid(snapshot) AND json_extract(snapshot,'$.mode') IN ('ctc','phlt','g2');
CREATE INDEX IF NOT EXISTS chars_mode_ladder ON chars(mode,bracket,flagged,power);
