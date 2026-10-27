-- Older local databases may already have a global_admin table with a different
-- shape. Add the columns used by the current admin session flow in place.
ALTER TABLE global_admin ADD COLUMN IF NOT EXISTS singleton BOOLEAN;
ALTER TABLE global_admin ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE global_admin ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE global_admin ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE global_admin ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE global_admin SET singleton = FALSE WHERE singleton IS NULL;

WITH ranked_admins AS (
  SELECT ctid, row_number() OVER (ORDER BY ctid) AS row_number
  FROM global_admin
  WHERE singleton IS TRUE
)
UPDATE global_admin AS admins
SET singleton = FALSE
FROM ranked_admins
WHERE admins.ctid = ranked_admins.ctid
  AND ranked_admins.row_number > 1;

UPDATE global_admin
SET singleton = TRUE
WHERE ctid = (SELECT ctid FROM global_admin ORDER BY ctid LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM global_admin WHERE singleton IS TRUE);

CREATE UNIQUE INDEX IF NOT EXISTS global_admin_singleton_true_idx
  ON global_admin (singleton)
  WHERE singleton IS TRUE;
