-- Create Commercial Documents System
-- Overview: Complete system for managing commercial documents like contracts, agreements, and licenses

-- Table 1: Commercial Documents
CREATE TABLE IF NOT EXISTS commercial_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_number text NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('عقد', 'اتفاقية', 'ترخيص', 'شهادة', 'وثيقة تأمين', 'سند ملكية', 'عقد إيجار', 'أخرى')),
  document_title text NOT NULL,
  party_name text NOT NULL,
  party_type text DEFAULT 'عميل' CHECK (party_type IN ('عميل', 'مورد', 'شريك', 'جهة حكومية', 'أخرى')),
  issue_date date NOT NULL,
  expiry_date date,
  start_date date,
  end_date date,
  document_value decimal(15,2) DEFAULT 0,
  currency text DEFAULT 'ر.س',
  status text DEFAULT 'نشط' CHECK (status IN ('مسودة', 'نشط', 'منتهي', 'ملغي', 'معلق')),
  renewal_type text DEFAULT 'يدوي' CHECK (renewal_type IN ('تلقائي', 'يدوي', 'لا يتجدد')),
  reminder_days integer DEFAULT 30,
  description text,
  terms_conditions text,
  notes text,
  file_path text,
  file_name text,
  file_size integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, document_number)
);

-- Table 2: Document Attachments
CREATE TABLE IF NOT EXISTS document_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_id uuid REFERENCES commercial_documents(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer,
  file_type text,
  description text,
  uploaded_at timestamptz DEFAULT now()
);

-- Table 3: Document Renewals
CREATE TABLE IF NOT EXISTS document_renewals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_id uuid REFERENCES commercial_documents(id) ON DELETE CASCADE NOT NULL,
  renewal_date date NOT NULL,
  new_expiry_date date NOT NULL,
  renewal_amount decimal(15,2) DEFAULT 0,
  status text DEFAULT 'معلق' CHECK (status IN ('معلق', 'مكتمل', 'ملغي')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Table 4: Document Notifications
CREATE TABLE IF NOT EXISTS document_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_id uuid REFERENCES commercial_documents(id) ON DELETE CASCADE NOT NULL,
  notification_type text NOT NULL CHECK (notification_type IN ('تجديد', 'انتهاء', 'تذكير')),
  notification_date date NOT NULL,
  is_sent boolean DEFAULT false,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE commercial_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_renewals ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for commercial_documents
CREATE POLICY "Users can view own documents"
  ON commercial_documents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
  ON commercial_documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON commercial_documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON commercial_documents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for document_attachments
CREATE POLICY "Users can view own attachments"
  ON document_attachments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attachments"
  ON document_attachments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own attachments"
  ON document_attachments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for document_renewals
CREATE POLICY "Users can view own renewals"
  ON document_renewals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own renewals"
  ON document_renewals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own renewals"
  ON document_renewals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for document_notifications
CREATE POLICY "Users can view own notifications"
  ON document_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON document_notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON document_notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_commercial_docs_user_id ON commercial_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_commercial_docs_type ON commercial_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_commercial_docs_status ON commercial_documents(status);
CREATE INDEX IF NOT EXISTS idx_commercial_docs_expiry ON commercial_documents(expiry_date);
CREATE INDEX IF NOT EXISTS idx_doc_attachments_doc_id ON document_attachments(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_renewals_doc_id ON document_renewals(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_notifications_doc_id ON document_notifications(document_id);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_commercial_docs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_commercial_docs_updated_at_trigger
  BEFORE UPDATE ON commercial_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_commercial_docs_updated_at();

-- Function to generate document number
CREATE OR REPLACE FUNCTION generate_document_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num integer;
  prefix text;
BEGIN
  CASE NEW.document_type
    WHEN 'عقد' THEN prefix := 'CNT';
    WHEN 'اتفاقية' THEN prefix := 'AGR';
    WHEN 'ترخيص' THEN prefix := 'LIC';
    WHEN 'شهادة' THEN prefix := 'CRT';
    WHEN 'وثيقة تأمين' THEN prefix := 'INS';
    WHEN 'سند ملكية' THEN prefix := 'OWN';
    WHEN 'عقد إيجار' THEN prefix := 'RNT';
    ELSE prefix := 'DOC';
  END CASE;
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(document_number FROM LENGTH(prefix) + 2) AS integer)), 0) + 1
  INTO next_num
  FROM commercial_documents
  WHERE user_id = NEW.user_id 
  AND document_number LIKE prefix || '-%';
  
  NEW.document_number := prefix || '-' || LPAD(next_num::text, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to generate document number
CREATE TRIGGER generate_document_number_trigger
  BEFORE INSERT ON commercial_documents
  FOR EACH ROW
  WHEN (NEW.document_number IS NULL OR NEW.document_number = '')
  EXECUTE FUNCTION generate_document_number();

-- Function to check expiry and update status
CREATE OR REPLACE FUNCTION check_document_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expiry_date IS NOT NULL AND NEW.expiry_date < CURRENT_DATE THEN
    NEW.status := 'منتهي';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check expiry
CREATE TRIGGER check_document_expiry_trigger
  BEFORE INSERT OR UPDATE ON commercial_documents
  FOR EACH ROW
  EXECUTE FUNCTION check_document_expiry();