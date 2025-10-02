-- Create Comprehensive Accounting System Tables
-- Overview: Complete accounting system with chart of accounts, manual entries, and annual entries

-- Table 1: Chart of Accounts (شجرة الحسابات)
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_code text NOT NULL,
  account_name text NOT NULL,
  account_name_en text,
  account_type text NOT NULL CHECK (account_type IN ('أصول', 'التزامات', 'حقوق ملكية', 'إيرادات', 'مصروفات')),
  account_category text,
  parent_account_id uuid REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
  level integer DEFAULT 1,
  is_active boolean DEFAULT true,
  is_parent boolean DEFAULT false,
  opening_balance decimal(12,2) DEFAULT 0,
  current_balance decimal(12,2) DEFAULT 0,
  description text,
  currency text DEFAULT 'ر.س',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, account_code)
);

-- Table 2: Manual Journal Entries (قيود محاسبية يدوية)
CREATE TABLE IF NOT EXISTS manual_journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entry_number text UNIQUE NOT NULL,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  entry_type text DEFAULT 'يدوي' CHECK (entry_type IN ('يدوي', 'افتتاحي', 'تسوية', 'إقفال')),
  reference_number text,
  description text NOT NULL,
  total_debit decimal(12,2) NOT NULL DEFAULT 0,
  total_credit decimal(12,2) NOT NULL DEFAULT 0,
  status text DEFAULT 'مسودة' CHECK (status IN ('مسودة', 'معتمد', 'مرحل', 'ملغي')),
  posted_date date,
  fiscal_year integer,
  notes text,
  created_by text,
  approved_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table 3: Journal Entry Lines (تفاصيل القيود)
CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entry_id uuid REFERENCES manual_journal_entries(id) ON DELETE CASCADE NOT NULL,
  line_number integer NOT NULL,
  account_id uuid REFERENCES chart_of_accounts(id) ON DELETE RESTRICT NOT NULL,
  description text,
  debit_amount decimal(12,2) DEFAULT 0,
  credit_amount decimal(12,2) DEFAULT 0,
  cost_center text,
  created_at timestamptz DEFAULT now()
);

-- Table 4: Annual Entries (قيود سنوية)
CREATE TABLE IF NOT EXISTS annual_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entry_number text UNIQUE NOT NULL,
  fiscal_year integer NOT NULL,
  entry_type text NOT NULL CHECK (entry_type IN ('افتتاحي', 'ختامي', 'تسوية', 'نتائج أعمال')),
  entry_date date NOT NULL,
  description text NOT NULL,
  total_debit decimal(12,2) NOT NULL DEFAULT 0,
  total_credit decimal(12,2) NOT NULL DEFAULT 0,
  status text DEFAULT 'مسودة' CHECK (status IN ('مسودة', 'معتمد', 'مرحل', 'ملغي')),
  posted_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table 5: Annual Entry Lines
CREATE TABLE IF NOT EXISTS annual_entry_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entry_id uuid REFERENCES annual_entries(id) ON DELETE CASCADE NOT NULL,
  line_number integer NOT NULL,
  account_id uuid REFERENCES chart_of_accounts(id) ON DELETE RESTRICT NOT NULL,
  description text,
  debit_amount decimal(12,2) DEFAULT 0,
  credit_amount decimal(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE annual_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE annual_entry_lines ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chart_of_accounts
CREATE POLICY "Users can view own chart of accounts"
  ON chart_of_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts"
  ON chart_of_accounts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts"
  ON chart_of_accounts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts"
  ON chart_of_accounts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for manual_journal_entries
CREATE POLICY "Users can view own manual entries"
  ON manual_journal_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own manual entries"
  ON manual_journal_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own manual entries"
  ON manual_journal_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own manual entries"
  ON manual_journal_entries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for journal_entry_lines
CREATE POLICY "Users can view own entry lines"
  ON journal_entry_lines FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own entry lines"
  ON journal_entry_lines FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entry lines"
  ON journal_entry_lines FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own entry lines"
  ON journal_entry_lines FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for annual_entries
CREATE POLICY "Users can view own annual entries"
  ON annual_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own annual entries"
  ON annual_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own annual entries"
  ON annual_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own annual entries"
  ON annual_entries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for annual_entry_lines
CREATE POLICY "Users can view own annual entry lines"
  ON annual_entry_lines FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own annual entry lines"
  ON annual_entry_lines FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own annual entry lines"
  ON annual_entry_lines FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own annual entry lines"
  ON annual_entry_lines FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_user_id ON chart_of_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_type ON chart_of_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_parent ON chart_of_accounts(parent_account_id);
CREATE INDEX IF NOT EXISTS idx_manual_entries_user_id ON manual_journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_manual_entries_status ON manual_journal_entries(status);
CREATE INDEX IF NOT EXISTS idx_manual_entries_date ON manual_journal_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_entry_lines_entry_id ON journal_entry_lines(entry_id);
CREATE INDEX IF NOT EXISTS idx_entry_lines_account_id ON journal_entry_lines(account_id);
CREATE INDEX IF NOT EXISTS idx_annual_entries_user_id ON annual_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_annual_entries_year ON annual_entries(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_annual_entry_lines_entry_id ON annual_entry_lines(entry_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_accounting_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_chart_of_accounts_updated_at
  BEFORE UPDATE ON chart_of_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_accounting_updated_at();

CREATE TRIGGER update_manual_entries_updated_at
  BEFORE UPDATE ON manual_journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_accounting_updated_at();

CREATE TRIGGER update_annual_entries_updated_at
  BEFORE UPDATE ON annual_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_accounting_updated_at();

-- Function to generate manual entry number
CREATE OR REPLACE FUNCTION generate_manual_entry_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(entry_number FROM 5) AS integer)), 0) + 1
  INTO next_num
  FROM manual_journal_entries
  WHERE user_id = NEW.user_id;
  
  NEW.entry_number := 'JE-' || LPAD(next_num::text, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate manual entry number
CREATE TRIGGER generate_manual_entry_number_trigger
  BEFORE INSERT ON manual_journal_entries
  FOR EACH ROW
  WHEN (NEW.entry_number IS NULL OR NEW.entry_number = '')
  EXECUTE FUNCTION generate_manual_entry_number();

-- Function to generate annual entry number
CREATE OR REPLACE FUNCTION generate_annual_entry_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(entry_number FROM 5) AS integer)), 0) + 1
  INTO next_num
  FROM annual_entries
  WHERE user_id = NEW.user_id AND fiscal_year = NEW.fiscal_year;
  
  NEW.entry_number := 'AE-' || LPAD(next_num::text, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate annual entry number
CREATE TRIGGER generate_annual_entry_number_trigger
  BEFORE INSERT ON annual_entries
  FOR EACH ROW
  WHEN (NEW.entry_number IS NULL OR NEW.entry_number = '')
  EXECUTE FUNCTION generate_annual_entry_number();

-- Function to validate entry balance
CREATE OR REPLACE FUNCTION validate_entry_balance()
RETURNS TRIGGER AS $$
DECLARE
  entry_total_debit decimal(12,2);
  entry_total_credit decimal(12,2);
BEGIN
  IF TG_TABLE_NAME = 'journal_entry_lines' THEN
    SELECT 
      COALESCE(SUM(debit_amount), 0),
      COALESCE(SUM(credit_amount), 0)
    INTO entry_total_debit, entry_total_credit
    FROM journal_entry_lines
    WHERE entry_id = NEW.entry_id;
    
    UPDATE manual_journal_entries
    SET 
      total_debit = entry_total_debit,
      total_credit = entry_total_credit
    WHERE id = NEW.entry_id;
  ELSIF TG_TABLE_NAME = 'annual_entry_lines' THEN
    SELECT 
      COALESCE(SUM(debit_amount), 0),
      COALESCE(SUM(credit_amount), 0)
    INTO entry_total_debit, entry_total_credit
    FROM annual_entry_lines
    WHERE entry_id = NEW.entry_id;
    
    UPDATE annual_entries
    SET 
      total_debit = entry_total_debit,
      total_credit = entry_total_credit
    WHERE id = NEW.entry_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to validate balance
CREATE TRIGGER validate_manual_entry_balance
  AFTER INSERT OR UPDATE ON journal_entry_lines
  FOR EACH ROW
  EXECUTE FUNCTION validate_entry_balance();

CREATE TRIGGER validate_annual_entry_balance
  AFTER INSERT OR UPDATE ON annual_entry_lines
  FOR EACH ROW
  EXECUTE FUNCTION validate_entry_balance();