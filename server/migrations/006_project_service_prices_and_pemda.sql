ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS pemda_name TEXT,
  ADD COLUMN IF NOT EXISTS service_price NUMERIC(18, 2);

UPDATE projects p
   SET pemda_name = a.name
  FROM government_agencies a
 WHERE p.agency_id = a.id
   AND p.pemda_name IS NULL;

UPDATE projects
   SET service_price = budget
 WHERE service_price IS NULL;

ALTER TABLE projects
  ALTER COLUMN pemda_name SET NOT NULL,
  ALTER COLUMN service_price SET NOT NULL,
  ADD CONSTRAINT projects_service_price_check CHECK (service_price > 0);

ALTER TABLE project_service_points
  ADD COLUMN IF NOT EXISTS service_price NUMERIC(18, 2),
  ADD CONSTRAINT project_service_points_service_price_check
    CHECK (service_price IS NULL OR service_price > 0);
