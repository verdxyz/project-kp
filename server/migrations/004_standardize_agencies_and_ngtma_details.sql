-- 1. Standarisasi Penamaan Instansi (Revisi 5)
-- Format diseragamkan menjadi "Pemkot" untuk Pemerintah Kota dan "Pemkab" untuk Pemerintah Kabupaten
UPDATE government_agencies SET name = 'Pemkab Semarang' WHERE name = 'Kabupaten Semarang';
UPDATE government_agencies SET name = 'Pemkot Semarang' WHERE name = 'Kota Semarang';
UPDATE government_agencies SET name = 'Pemkot Pekalongan' WHERE name = 'Kota Pekalongan';
UPDATE government_agencies SET name = 'Pemkot Tegal' WHERE name = 'Kota Tegal';

INSERT INTO government_agencies (name, agency_type, region) VALUES
  ('Pemkot Semarang', 'Pemerintah Kota', 'Semarang'),
  ('Pemkab Semarang', 'Pemerintah Kabupaten', 'Semarang'),
  ('Pemkot Pekalongan', 'Pemerintah Kota', 'Pekalongan'),
  ('Pemkot Tegal', 'Pemerintah Kota', 'Tegal')
ON CONFLICT (name) DO NOTHING;

-- 2. Penambahan Field NGTMA pada Projects (Revisi 1)
-- Field "Nama Pelanggan" (customer_name) & opsi "Nama Dinas" (dinas_name) terpisah
ALTER TABLE projects ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS dinas_name TEXT;

-- 3. Penambahan Field Titik Layanan pada project_service_points (Revisi 1, 2, 4)
-- Mendukung kondisi POTS dan Non-POTS (Lokasi, Quote, Nomor Order, Tanggal Aktif, dll.)
ALTER TABLE project_service_points ADD COLUMN IF NOT EXISTS service_group TEXT NOT NULL DEFAULT 'Non-POTS';
ALTER TABLE project_service_points ADD COLUMN IF NOT EXISTS order_no TEXT;
ALTER TABLE project_service_points ADD COLUMN IF NOT EXISTS quote TEXT;
ALTER TABLE project_service_points ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE project_service_points ADD COLUMN IF NOT EXISTS active_date DATE;
ALTER TABLE project_service_points ADD COLUMN IF NOT EXISTS bandwidth TEXT;

-- Perbolehkan product_type nullable untuk layanan POTS
ALTER TABLE project_service_points ALTER COLUMN product_type DROP NOT NULL;
