ALTER TABLE project_documents
  DROP CONSTRAINT IF EXISTS project_documents_document_type_check;

ALTER TABLE project_documents
  ADD CONSTRAINT project_documents_document_type_check CHECK (
    document_type IN (
      'p0', 'p1', 'ba_split', 'supporting_contract_doc', 'contract', 'bast', 'basto', 'other'
    )
  );