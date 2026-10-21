CREATE TABLE IF NOT EXISTS global_admin (
  singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS government_agencies (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  agency_type TEXT NOT NULL,
  region TEXT NOT NULL
);

INSERT INTO government_agencies (name, agency_type, region) VALUES
  ('Pemkot Salatiga', 'Pemerintah Kota', 'Salatiga'),
  ('Kabupaten Semarang', 'Pemerintah Kabupaten', 'Semarang'),
  ('Kota Semarang', 'Pemerintah Kota', 'Semarang'),
  ('Pemkab Kendal', 'Pemerintah Kabupaten', 'Kendal'),
  ('Pemkab Batang', 'Pemerintah Kabupaten', 'Batang'),
  ('Pemkab Pekalongan', 'Pemerintah Kabupaten', 'Pekalongan'),
  ('Kota Pekalongan', 'Pemerintah Kota', 'Pekalongan'),
  ('Pemkab Pemalang', 'Pemerintah Kabupaten', 'Pemalang'),
  ('Kota Tegal', 'Pemerintah Kota', 'Tegal'),
  ('Pemkab Tegal', 'Pemerintah Kabupaten', 'Tegal'),
  ('Pemkab Brebes', 'Pemerintah Kabupaten', 'Brebes'),
  ('Provinsi Jawa Tengah', 'Pemerintah Provinsi', 'Semarang'),
  ('Polda Jawa Tengah', 'Kepolisian Daerah', 'Semarang')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY,
  id_lop TEXT NOT NULL UNIQUE,
  project_name TEXT NOT NULL,
  agency_id BIGINT NOT NULL REFERENCES government_agencies(id),
  budget NUMERIC(18, 2) NOT NULL CHECK (budget > 0),
  procurement_method TEXT NOT NULL CHECK (procurement_method IN ('Tender/e-Katalog', 'Penunjukan Langsung')),
  stage TEXT NOT NULL CHECK (stage IN ('F0', 'F1', 'F2', 'F3', 'F4', 'F5', 'Loss', 'Cancel')),
  progress SMALLINT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  start_date DATE,
  end_date DATE,
  pic TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('On Channel', 'GTMA', 'NGTMA')),
  service_type TEXT NOT NULL,
  total_capacity_mbps NUMERIC(12, 3) CHECK (total_capacity_mbps IS NULL OR total_capacity_mbps >= 0),
  sid TEXT,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'At Risk', 'Completed', 'Lost', 'Cancelled')),
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS projects_agency_id_idx ON projects (agency_id);
CREATE INDEX IF NOT EXISTS projects_stage_idx ON projects (stage);

CREATE TABLE IF NOT EXISTS project_documents (
  id UUID PRIMARY KEY,
  id_lop TEXT NOT NULL REFERENCES projects(id_lop) ON UPDATE CASCADE ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (
    document_type IN ('p0', 'p1', 'ba_split', 'supporting_contract_doc', 'contract', 'bast', 'basto')
  ),
  original_name TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes > 0),
  uploaded_by TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (id_lop, document_type)
);

CREATE INDEX IF NOT EXISTS project_documents_lop_idx ON project_documents (id_lop);
