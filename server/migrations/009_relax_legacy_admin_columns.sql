-- Legacy versions created columns from account values. Keep those columns and
-- their data, but allow new canonical admin rows to leave them empty.
DO $$
DECLARE
  legacy_column RECORD;
BEGIN
  FOR legacy_column IN
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'global_admin'
      AND column_name NOT IN ('singleton', 'email', 'display_name', 'password_hash', 'updated_at')
      AND is_nullable = 'NO'
  LOOP
    EXECUTE format(
      'ALTER TABLE %I.%I ALTER COLUMN %I DROP NOT NULL',
      current_schema(), 'global_admin', legacy_column.column_name
    );
  END LOOP;
END $$;
