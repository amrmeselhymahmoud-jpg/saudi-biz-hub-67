-- Create Comprehensive Budgets System
-- Overview: Complete budget management system with accounts, periods, and tracking

-- Table 1: Budgets (main budget headers)
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  budget_code text NOT NULL,
  budget_name text NOT NULL,
  fiscal_year integer NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  budget_type text DEFAULT 'سنوي' CHECK (budget_type IN ('سنوي', 'ربع سنوي', 'شهري')),
  status text DEFAULT 'مسودة' CHECK (status IN ('مسودة', 'معتمد', 'نشط', 'مغلق')),
  total_budget decimal(15,2) DEFAULT 0,
  total_actual decimal(15,2) DEFAULT 0,
  total_variance decimal(15,2) DEFAULT 0,
  description text,
  notes text,
  approved_by text,
  approved_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, budget_code)
);

-- Table 2: Budget Items (budget details per account)
CREATE TABLE IF NOT EXISTS budget_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  budget_id uuid REFERENCES budgets(id) ON DELETE CASCADE NOT NULL,
  account_id uuid REFERENCES chart_of_accounts(id) ON DELETE RESTRICT NOT NULL,
  budget_amount decimal(15,2) NOT NULL DEFAULT 0,
  actual_amount decimal(15,2) DEFAULT 0,
  variance_amount decimal(15,2) DEFAULT 0,
  variance_percentage decimal(5,2) DEFAULT 0,
  period text DEFAULT 'سنوي',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table 3: Budget Periods (monthly/quarterly breakdown)
CREATE TABLE IF NOT EXISTS budget_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  budget_item_id uuid REFERENCES budget_items(id) ON DELETE CASCADE NOT NULL,
  period_name text NOT NULL,
  period_number integer NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  budget_amount decimal(15,2) NOT NULL DEFAULT 0,
  actual_amount decimal(15,2) DEFAULT 0,
  variance_amount decimal(15,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_periods ENABLE ROW LEVEL SECURITY;

-- RLS Policies for budgets
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

-- RLS Policies for budget_items
CREATE POLICY "Users can view own budget items"
  ON budget_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budget items"
  ON budget_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budget items"
  ON budget_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own budget items"
  ON budget_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for budget_periods
CREATE POLICY "Users can view own budget periods"
  ON budget_periods FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budget periods"
  ON budget_periods FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budget periods"
  ON budget_periods FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own budget periods"
  ON budget_periods FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_fiscal_year ON budgets(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON budgets(status);
CREATE INDEX IF NOT EXISTS idx_budget_items_budget_id ON budget_items(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_account_id ON budget_items(account_id);
CREATE INDEX IF NOT EXISTS idx_budget_periods_item_id ON budget_periods(budget_item_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_budgets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_budgets_updated_at_trigger
  BEFORE UPDATE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_budgets_updated_at();

CREATE TRIGGER update_budget_items_updated_at_trigger
  BEFORE UPDATE ON budget_items
  FOR EACH ROW
  EXECUTE FUNCTION update_budgets_updated_at();

-- Function to generate budget code
CREATE OR REPLACE FUNCTION generate_budget_code()
RETURNS TRIGGER AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(budget_code FROM 4) AS integer)), 0) + 1
  INTO next_num
  FROM budgets
  WHERE user_id = NEW.user_id AND fiscal_year = NEW.fiscal_year;
  
  NEW.budget_code := 'BG-' || LPAD(next_num::text, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate budget code
CREATE TRIGGER generate_budget_code_trigger
  BEFORE INSERT ON budgets
  FOR EACH ROW
  WHEN (NEW.budget_code IS NULL OR NEW.budget_code = '')
  EXECUTE FUNCTION generate_budget_code();

-- Function to calculate budget totals
CREATE OR REPLACE FUNCTION calculate_budget_totals()
RETURNS TRIGGER AS $$
DECLARE
  total_budget_val decimal(15,2);
  total_actual_val decimal(15,2);
BEGIN
  SELECT 
    COALESCE(SUM(budget_amount), 0),
    COALESCE(SUM(actual_amount), 0)
  INTO total_budget_val, total_actual_val
  FROM budget_items
  WHERE budget_id = NEW.budget_id;
  
  UPDATE budgets
  SET 
    total_budget = total_budget_val,
    total_actual = total_actual_val,
    total_variance = total_actual_val - total_budget_val
  WHERE id = NEW.budget_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update budget totals
CREATE TRIGGER calculate_budget_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON budget_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_budget_totals();

-- Function to calculate variance
CREATE OR REPLACE FUNCTION calculate_item_variance()
RETURNS TRIGGER AS $$
BEGIN
  NEW.variance_amount := NEW.actual_amount - NEW.budget_amount;
  
  IF NEW.budget_amount != 0 THEN
    NEW.variance_percentage := (NEW.variance_amount / NEW.budget_amount) * 100;
  ELSE
    NEW.variance_percentage := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to calculate variance on budget items
CREATE TRIGGER calculate_item_variance_trigger
  BEFORE INSERT OR UPDATE ON budget_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_item_variance();