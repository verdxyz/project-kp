ALTER TABLE projects ADD COLUMN IF NOT EXISTS subsidiary_name TEXT;

ALTER TABLE project_documents
  DROP CONSTRAINT IF EXISTS project_documents_document_type_check;

ALTER TABLE project_documents
  ADD CONSTRAINT project_documents_document_type_check CHECK (
    document_type IN (
      'p0', 'p1', 'ba_split', 'supporting_contract_doc', 'contract', 'bast', 'basto', 'other',
      'ngtma_agreement', 'nce_quote', 'rpa', 'invoice', 'billing_evidence'
    )
  );

CREATE TABLE IF NOT EXISTS project_service_points (
  id UUID PRIMARY KEY,
  id_lop TEXT NOT NULL REFERENCES projects(id_lop) ON UPDATE CASCADE ON DELETE CASCADE,
  sid TEXT NOT NULL,
  product_type TEXT NOT NULL,
  capacity_mbps NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (capacity_mbps >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (id_lop, sid)
);

CREATE INDEX IF NOT EXISTS project_service_points_lop_idx ON project_service_points (id_lop);
CREATE INDEX IF NOT EXISTS project_service_points_product_idx ON project_service_points (product_type);

INSERT INTO project_service_points (id, id_lop, sid, product_type, capacity_mbps)
SELECT gen_random_uuid(), p.id_lop, p.sid,
       CASE
         WHEN lower(p.service_type) LIKE '%hsi%' THEN 'HSI'
         WHEN lower(p.service_type) LIKE '%wms%' OR lower(p.service_type) LIKE '%wifi%' THEN 'WMS'
         WHEN lower(p.service_type) LIKE '%astinet%' THEN 'Astinet'
         WHEN lower(p.service_type) LIKE '%ip transit%' THEN 'IP Transit'
         WHEN lower(p.service_type) LIKE '%vpn%' THEN 'VPN'
         ELSE p.service_type
       END,
       COALESCE(p.total_capacity_mbps, 0)
  FROM projects p
 WHERE p.sid IS NOT NULL AND btrim(p.sid) <> ''
ON CONFLICT (id_lop, sid) DO NOTHING;
