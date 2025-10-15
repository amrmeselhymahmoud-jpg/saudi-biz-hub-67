/*
  # الجداول المتبقية للنظام
  
  ## الجداول:
  1. projects: المشاريع
  2. tasks: المهام
  3. taxes: الضرائب
  4. payment_terms: شروط الدفع
  5. currencies: العملات
  6. company_settings: إعدادات الشركة
*/

-- ==========================================
-- 1. المشاريع (Projects)
-- ==========================================

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_code text UNIQUE NOT NULL,
  project_name text NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  start_date date,
  end_date date,
  budget numeric(15,2) DEFAULT 0,
  actual_cost numeric(15,2) DEFAULT 0,
  revenue numeric(15,2) DEFAULT 0,
  profit_margin numeric(15,2) GENERATED ALWAYS AS (revenue - actual_cost) STORED,
  status text DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'on_hold', 'completed', 'cancelled')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  description text,
  notes text,
  manager_id uuid REFERENCES auth.users(id),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_code ON projects(project_code);
CREATE INDEX IF NOT EXISTS idx_projects_customer ON projects(customer_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_manager ON projects(manager_id);

CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read projects"
  ON projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert projects"
  ON projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update projects"
  ON projects FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete projects"
  ON projects FOR DELETE TO authenticated USING (true);

-- ==========================================
-- 2. المهام (Tasks)
-- ==========================================

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  task_name text NOT NULL,
  description text,
  assigned_to uuid REFERENCES auth.users(id),
  start_date date,
  due_date date,
  completed_date date,
  estimated_hours numeric(8,2),
  actual_hours numeric(8,2),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read tasks"
  ON tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert tasks"
  ON tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update tasks"
  ON tasks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete tasks"
  ON tasks FOR DELETE TO authenticated USING (true);

-- ==========================================
-- 3. الضرائب (Taxes)
-- ==========================================

CREATE TABLE IF NOT EXISTS taxes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_code text UNIQUE NOT NULL,
  tax_name text NOT NULL,
  tax_rate numeric(5,2) NOT NULL CHECK (tax_rate >= 0 AND tax_rate <= 100),
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  description text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_taxes_code ON taxes(tax_code);
CREATE INDEX IF NOT EXISTS idx_taxes_active ON taxes(is_active);

CREATE TRIGGER set_taxes_updated_at
  BEFORE UPDATE ON taxes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE taxes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read taxes"
  ON taxes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert taxes"
  ON taxes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update taxes"
  ON taxes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete taxes"
  ON taxes FOR DELETE TO authenticated USING (true);

-- ==========================================
-- 4. شروط الدفع (Payment Terms)
-- ==========================================

CREATE TABLE IF NOT EXISTS payment_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term_code text UNIQUE NOT NULL,
  term_name text NOT NULL,
  days integer NOT NULL CHECK (days >= 0),
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  description text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payment_terms_code ON payment_terms(term_code);
CREATE INDEX IF NOT EXISTS idx_payment_terms_active ON payment_terms(is_active);

CREATE TRIGGER set_payment_terms_updated_at
  BEFORE UPDATE ON payment_terms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE payment_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read payment terms"
  ON payment_terms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert payment terms"
  ON payment_terms FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update payment terms"
  ON payment_terms FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete payment terms"
  ON payment_terms FOR DELETE TO authenticated USING (true);

-- ==========================================
-- 5. العملات (Currencies)
-- ==========================================

CREATE TABLE IF NOT EXISTS currencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  currency_code text UNIQUE NOT NULL,
  currency_name text NOT NULL,
  symbol text NOT NULL,
  exchange_rate numeric(12,6) DEFAULT 1 NOT NULL CHECK (exchange_rate > 0),
  is_base boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_currencies_code ON currencies(currency_code);
CREATE INDEX IF NOT EXISTS idx_currencies_active ON currencies(is_active);

CREATE TRIGGER set_currencies_updated_at
  BEFORE UPDATE ON currencies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read currencies"
  ON currencies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert currencies"
  ON currencies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update currencies"
  ON currencies FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete currencies"
  ON currencies FOR DELETE TO authenticated USING (true);

-- ==========================================
-- 6. إعدادات الشركة (Company Settings)
-- ==========================================

CREATE TABLE IF NOT EXISTS company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  company_name_en text,
  tax_number text,
  commercial_registration text,
  phone text,
  email text,
  website text,
  address text,
  city text,
  country text DEFAULT 'Saudi Arabia',
  postal_code text,
  logo_url text,
  default_currency_id uuid REFERENCES currencies(id),
  default_tax_id uuid REFERENCES taxes(id),
  fiscal_year_start_month integer DEFAULT 1 CHECK (fiscal_year_start_month >= 1 AND fiscal_year_start_month <= 12),
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TRIGGER set_company_settings_updated_at
  BEFORE UPDATE ON company_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read company settings"
  ON company_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert company settings"
  ON company_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update company settings"
  ON company_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
