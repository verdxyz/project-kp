ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS projects_procurement_method_check;

UPDATE projects
   SET procurement_method = 'E-Katalog'
 WHERE procurement_method = 'Tender/e-Katalog';

ALTER TABLE projects
  ADD CONSTRAINT projects_procurement_method_check
  CHECK (procurement_method IN (
    'E-Katalog',
    'Pengadaan Langsung',
    'Penunjukan Langsung',
    'Tender Cepat',
    'Tender'
  ));
