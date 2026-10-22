ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS projects_budget_check,
  DROP CONSTRAINT IF EXISTS projects_service_price_check;

ALTER TABLE projects
  ADD CONSTRAINT projects_budget_check CHECK (budget >= 0),
  ADD CONSTRAINT projects_service_price_check CHECK (service_price >= 0);
