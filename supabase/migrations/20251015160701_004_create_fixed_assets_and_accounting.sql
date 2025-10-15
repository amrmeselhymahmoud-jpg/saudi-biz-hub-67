/*
  # نظام الأصول الثابتة والمحاسبة
  
  ## الجداول:
  1. fixed_assets: الأصول الثابتة
  2. depreciation_records: سجلات الإهلاك
  3. chart_of_accounts: دليل الحسابات
  4. journal_entries: القيود اليومية
  5. journal_entry_lines: أسطر القيود
*/

-- ==========================================
-- 1. الأصول الثابتة (Fixed Assets)
-- ==========================================

CREATE TABLE IF NOT EXISTS fixed_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_code text UNIQUE NOT NULL,
  asset_name text NOT NULL,
  category text DEFAULT 'equipment' CHECK (category IN ('equipment', 'vehicle', 'building', 'furniture', 'computer', 'other')),
  purchase_date date NOT NULL,
  purchase_cost numeric(15,2) NOT NULL CHECK (purchase_cost >= 0),
  salvage_value numeric(15,2) DEFAULT 0 NOT NULL CHECK (salvage_value >= 0),
  useful_life_years integer NOT NULL CHECK (useful_life_years > 0),
  depreciation_method text DEFAULT 'straight_line' CHECK (depreciation_method IN ('straight_line', 'declining_balance', 'units_of_production')),
  accumulated_depreciation numeric(15,2) DEFAULT 0 NOT NULL,
  book_value numeric(15,2) GENERATED ALWAYS AS (purchase_cost - accumulated_depreciation) STORED,
  location text,
  serial_number text,
  notes text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'disposed', 'under_maintenance')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fixed_assets_code ON fixed_assets(asset_code);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_category ON fixed_assets(category);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_status ON fixed_assets(status);

CREATE TRIGGER set_fixed_assets_updated_at
  BEFORE UPDATE ON fixed_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE fixed_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read fixed assets"
  ON fixed_assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert fixed assets"
  ON fixed_assets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update fixed assets"
  ON fixed_assets FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete fixed assets"
  ON fixed_assets FOR DELETE TO authenticated USING (true);

-- ==========================================
-- 2. سجلات الإهلاك (Depreciation Records)
-- ==========================================

CREATE TABLE IF NOT EXISTS depreciation_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES fixed_assets(id) ON DELETE CASCADE,
  period_date date NOT NULL,
  depreciation_amount numeric(15,2) NOT NULL CHECK (depreciation_amount >= 0),
  accumulated_depreciation numeric(15,2) NOT NULL,
  book_value numeric(15,2) NOT NULL,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_depreciation_records_asset ON depreciation_records(asset_id);
CREATE INDEX IF NOT EXISTS idx_depreciation_records_period ON depreciation_records(period_date DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_depreciation_records_unique ON depreciation_records(asset_id, period_date);

ALTER TABLE depreciation_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read depreciation records"
  ON depreciation_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert depreciation records"
  ON depreciation_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update depreciation records"
  ON depreciation_records FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete depreciation records"
  ON depreciation_records FOR DELETE TO authenticated USING (true);

-- ==========================================
-- 3. دليل الحسابات (Chart of Accounts)
-- ==========================================

CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_code text UNIQUE NOT NULL,
  account_name_ar text NOT NULL,
  account_name_en text,
  account_type text NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  account_category text,
  parent_account_id uuid REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
  level integer DEFAULT 1 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  allow_manual_entry boolean DEFAULT true NOT NULL,
  current_balance numeric(15,2) DEFAULT 0 NOT NULL,
  notes text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chart_accounts_code ON chart_of_accounts(account_code);
CREATE INDEX IF NOT EXISTS idx_chart_accounts_type ON chart_of_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_chart_accounts_parent ON chart_of_accounts(parent_account_id);
CREATE INDEX IF NOT EXISTS idx_chart_accounts_active ON chart_of_accounts(is_active);

CREATE TRIGGER set_chart_accounts_updated_at
  BEFORE UPDATE ON chart_of_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read chart of accounts"
  ON chart_of_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert chart of accounts"
  ON chart_of_accounts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update chart of accounts"
  ON chart_of_accounts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete chart of accounts"
  ON chart_of_accounts FOR DELETE TO authenticated USING (true);

-- ==========================================
-- 4. القيود اليومية (Journal Entries)
-- ==========================================

CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_number text UNIQUE NOT NULL,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  entry_type text DEFAULT 'manual' CHECK (entry_type IN ('manual', 'automatic', 'opening', 'closing', 'adjustment')),
  reference_type text CHECK (reference_type IN ('invoice', 'payment', 'adjustment', 'depreciation', 'other')),
  reference_id uuid,
  description text NOT NULL,
  total_debit numeric(15,2) DEFAULT 0 NOT NULL,
  total_credit numeric(15,2) DEFAULT 0 NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'cancelled')),
  posted_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_number ON journal_entries(entry_number);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_type ON journal_entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_journal_entries_status ON journal_entries(status);

CREATE TRIGGER set_journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read journal entries"
  ON journal_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert journal entries"
  ON journal_entries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update journal entries"
  ON journal_entries FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete journal entries"
  ON journal_entries FOR DELETE TO authenticated USING (true);

-- ==========================================
-- 5. أسطر القيود (Journal Entry Lines)
-- ==========================================

CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
  description text,
  debit numeric(15,2) DEFAULT 0 NOT NULL CHECK (debit >= 0),
  credit numeric(15,2) DEFAULT 0 NOT NULL CHECK (credit >= 0),
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT debit_or_credit_not_both CHECK ((debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0))
);

CREATE INDEX IF NOT EXISTS idx_journal_lines_entry ON journal_entry_lines(entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_account ON journal_entry_lines(account_id);

ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read journal entry lines"
  ON journal_entry_lines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert journal entry lines"
  ON journal_entry_lines FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update journal entry lines"
  ON journal_entry_lines FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete journal entry lines"
  ON journal_entry_lines FOR DELETE TO authenticated USING (true);
