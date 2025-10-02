-- Create Recurring Transactions System
-- Overview: Complete system for managing recurring transactions like subscriptions, salaries, rent

-- Table 1: Recurring Transactions Templates
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_code text NOT NULL,
  transaction_name text NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('إيراد', 'مصروف')),
  category text NOT NULL CHECK (category IN ('اشتراكات', 'رواتب', 'إيجارات', 'فواتير', 'صيانة', 'أخرى')),
  account_id uuid REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
  party_name text,
  party_type text CHECK (party_type IN ('عميل', 'مورد', 'موظف', 'أخرى')),
  amount decimal(15,2) NOT NULL,
  currency text DEFAULT 'ر.س',
  frequency text NOT NULL CHECK (frequency IN ('يومي', 'أسبوعي', 'شهري', 'ربع سنوي', 'نصف سنوي', 'سنوي')),
  start_date date NOT NULL,
  end_date date,
  next_execution_date date NOT NULL,
  last_execution_date date,
  execution_count integer DEFAULT 0,
  status text DEFAULT 'نشط' CHECK (status IN ('نشط', 'متوقف', 'منتهي', 'معلق')),
  auto_generate boolean DEFAULT true,
  notify_before_days integer DEFAULT 3,
  description text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, transaction_code)
);

-- Table 2: Recurring Transaction History
CREATE TABLE IF NOT EXISTS recurring_transaction_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recurring_transaction_id uuid REFERENCES recurring_transactions(id) ON DELETE CASCADE NOT NULL,
  execution_date date NOT NULL,
  amount decimal(15,2) NOT NULL,
  status text DEFAULT 'مكتمل' CHECK (status IN ('مكتمل', 'فشل', 'ملغي', 'معلق')),
  invoice_id uuid,
  entry_id uuid,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Table 3: Recurring Transaction Schedules
CREATE TABLE IF NOT EXISTS recurring_transaction_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recurring_transaction_id uuid REFERENCES recurring_transactions(id) ON DELETE CASCADE NOT NULL,
  scheduled_date date NOT NULL,
  is_executed boolean DEFAULT false,
  executed_at timestamptz,
  status text DEFAULT 'معلق' CHECK (status IN ('معلق', 'منفذ', 'ملغي', 'فشل')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transaction_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transaction_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recurring_transactions
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

-- RLS Policies for recurring_transaction_history
CREATE POLICY "Users can view own history"
  ON recurring_transaction_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history"
  ON recurring_transaction_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for recurring_transaction_schedules
CREATE POLICY "Users can view own schedules"
  ON recurring_transaction_schedules FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own schedules"
  ON recurring_transaction_schedules FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schedules"
  ON recurring_transaction_schedules FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_recurring_trans_user_id ON recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_trans_status ON recurring_transactions(status);
CREATE INDEX IF NOT EXISTS idx_recurring_trans_next_date ON recurring_transactions(next_execution_date);
CREATE INDEX IF NOT EXISTS idx_recurring_history_trans_id ON recurring_transaction_history(recurring_transaction_id);
CREATE INDEX IF NOT EXISTS idx_recurring_schedules_trans_id ON recurring_transaction_schedules(recurring_transaction_id);
CREATE INDEX IF NOT EXISTS idx_recurring_schedules_date ON recurring_transaction_schedules(scheduled_date);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_recurring_trans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_recurring_trans_updated_at_trigger
  BEFORE UPDATE ON recurring_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_recurring_trans_updated_at();

-- Function to generate transaction code
CREATE OR REPLACE FUNCTION generate_recurring_transaction_code()
RETURNS TRIGGER AS $$
DECLARE
  next_num integer;
  prefix text;
BEGIN
  CASE NEW.transaction_type
    WHEN 'إيراد' THEN prefix := 'RIN';
    WHEN 'مصروف' THEN prefix := 'REX';
    ELSE prefix := 'REC';
  END CASE;
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(transaction_code FROM LENGTH(prefix) + 2) AS integer)), 0) + 1
  INTO next_num
  FROM recurring_transactions
  WHERE user_id = NEW.user_id 
  AND transaction_code LIKE prefix || '-%';
  
  NEW.transaction_code := prefix || '-' || LPAD(next_num::text, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to generate transaction code
CREATE TRIGGER generate_recurring_transaction_code_trigger
  BEFORE INSERT ON recurring_transactions
  FOR EACH ROW
  WHEN (NEW.transaction_code IS NULL OR NEW.transaction_code = '')
  EXECUTE FUNCTION generate_recurring_transaction_code();

-- Function to calculate next execution date
CREATE OR REPLACE FUNCTION calculate_next_execution_date(
  ref_date date,
  frequency_type text
)
RETURNS date AS $$
BEGIN
  RETURN CASE frequency_type
    WHEN 'يومي' THEN ref_date + INTERVAL '1 day'
    WHEN 'أسبوعي' THEN ref_date + INTERVAL '1 week'
    WHEN 'شهري' THEN ref_date + INTERVAL '1 month'
    WHEN 'ربع سنوي' THEN ref_date + INTERVAL '3 months'
    WHEN 'نصف سنوي' THEN ref_date + INTERVAL '6 months'
    WHEN 'سنوي' THEN ref_date + INTERVAL '1 year'
    ELSE ref_date + INTERVAL '1 month'
  END;
END;
$$ LANGUAGE plpgsql;

-- Function to check and update status
CREATE OR REPLACE FUNCTION check_recurring_transaction_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_date IS NOT NULL AND NEW.end_date < CURRENT_DATE THEN
    NEW.status := 'منتهي';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check status
CREATE TRIGGER check_recurring_transaction_status_trigger
  BEFORE INSERT OR UPDATE ON recurring_transactions
  FOR EACH ROW
  EXECUTE FUNCTION check_recurring_transaction_status();

-- Function to update execution count
CREATE OR REPLACE FUNCTION update_execution_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'مكتمل' THEN
    UPDATE recurring_transactions
    SET 
      execution_count = execution_count + 1,
      last_execution_date = NEW.execution_date,
      next_execution_date = calculate_next_execution_date(NEW.execution_date, 
        (SELECT frequency FROM recurring_transactions WHERE id = NEW.recurring_transaction_id))
    WHERE id = NEW.recurring_transaction_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update execution count
CREATE TRIGGER update_execution_count_trigger
  AFTER INSERT ON recurring_transaction_history
  FOR EACH ROW
  EXECUTE FUNCTION update_execution_count();