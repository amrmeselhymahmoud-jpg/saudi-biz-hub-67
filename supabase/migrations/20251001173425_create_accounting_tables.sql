/*
  # إنشاء جداول المحاسبة

  1. جداول جديدة
    - `chart_of_accounts` - شجرة الحسابات
    - `manual_entries` - القيود اليدوية
    - `annual_entries` - القيود السنوية
    - `deferred_invoices` - فواتير التأجيل
    - `budgets` - الموازنات
    - `commercial_documents` - المستندات التجارية
    - `recurring_transactions` - المعاملات المتكررة

  2. الأمان
    - تفعيل RLS على جميع الجداول
    - سياسات للمستخدمين المصادقين
*/

-- شجرة الحسابات
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  account_code text NOT NULL UNIQUE,
  account_name text NOT NULL,
  account_type text NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  parent_account_id uuid REFERENCES chart_of_accounts(id),
  balance numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- القيود اليدوية
CREATE TABLE IF NOT EXISTS manual_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  entry_number text NOT NULL UNIQUE,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL,
  reference_number text,
  total_debit numeric DEFAULT 0,
  total_credit numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'cancelled')),
  entries jsonb DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- القيود السنوية
CREATE TABLE IF NOT EXISTS annual_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  entry_number text NOT NULL UNIQUE,
  fiscal_year integer NOT NULL,
  entry_type text NOT NULL CHECK (entry_type IN ('opening', 'closing', 'adjustment')),
  entry_date date NOT NULL,
  description text NOT NULL,
  total_debit numeric DEFAULT 0,
  total_credit numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'cancelled')),
  entries jsonb DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- فواتير التأجيل
CREATE TABLE IF NOT EXISTS deferred_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  invoice_number text NOT NULL UNIQUE,
  customer_name text NOT NULL,
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  recognized_amount numeric DEFAULT 0,
  remaining_amount numeric DEFAULT 0,
  recognition_method text NOT NULL DEFAULT 'monthly' CHECK (recognition_method IN ('monthly', 'quarterly', 'custom')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  items jsonb DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- الموازنات
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  budget_name text NOT NULL,
  fiscal_year integer NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_budget numeric DEFAULT 0,
  actual_amount numeric DEFAULT 0,
  variance numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'active', 'closed')),
  budget_items jsonb DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- المستندات التجارية
CREATE TABLE IF NOT EXISTS commercial_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  document_number text NOT NULL UNIQUE,
  document_type text NOT NULL CHECK (document_type IN ('contract', 'agreement', 'po', 'receipt', 'certificate', 'other')),
  document_name text NOT NULL,
  party_name text NOT NULL,
  document_date date NOT NULL DEFAULT CURRENT_DATE,
  expiry_date date,
  amount numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'archived')),
  file_url text,
  description text,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- المعاملات المتكررة
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  transaction_name text NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('income', 'expense', 'transfer', 'journal')),
  frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  start_date date NOT NULL,
  end_date date,
  next_occurrence date NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  account_from_id uuid REFERENCES chart_of_accounts(id),
  account_to_id uuid REFERENCES chart_of_accounts(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  auto_post boolean DEFAULT false,
  description text,
  entries jsonb DEFAULT '[]'::jsonb,
  occurrences_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE annual_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE deferred_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;

-- سياسات شجرة الحسابات
CREATE POLICY "Users can view own accounts"
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

-- سياسات القيود اليدوية
CREATE POLICY "Users can view own manual entries"
  ON manual_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own manual entries"
  ON manual_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own manual entries"
  ON manual_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own manual entries"
  ON manual_entries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- سياسات القيود السنوية
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

-- سياسات فواتير التأجيل
CREATE POLICY "Users can view own deferred invoices"
  ON deferred_invoices FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deferred invoices"
  ON deferred_invoices FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deferred invoices"
  ON deferred_invoices FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own deferred invoices"
  ON deferred_invoices FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- سياسات الموازنات
CREATE POLICY "Users can view own budgets"
  ON budgets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets"
  ON budgets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets"
  ON budgets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets"
  ON budgets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- سياسات المستندات التجارية
CREATE POLICY "Users can view own commercial documents"
  ON commercial_documents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own commercial documents"
  ON commercial_documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own commercial documents"
  ON commercial_documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own commercial documents"
  ON commercial_documents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- سياسات المعاملات المتكررة
CREATE POLICY "Users can view own recurring transactions"
  ON recurring_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recurring transactions"
  ON recurring_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring transactions"
  ON recurring_transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring transactions"
  ON recurring_transactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- الفهارس
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_user_id ON chart_of_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_type ON chart_of_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_parent ON chart_of_accounts(parent_account_id);
CREATE INDEX IF NOT EXISTS idx_manual_entries_user_id ON manual_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_manual_entries_date ON manual_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_manual_entries_status ON manual_entries(status);
CREATE INDEX IF NOT EXISTS idx_annual_entries_user_id ON annual_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_annual_entries_year ON annual_entries(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_deferred_invoices_user_id ON deferred_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_deferred_invoices_status ON deferred_invoices(status);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_year ON budgets(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_commercial_documents_user_id ON commercial_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_commercial_documents_type ON commercial_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_user_id ON recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_status ON recurring_transactions(status);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_next_occurrence ON recurring_transactions(next_occurrence);
