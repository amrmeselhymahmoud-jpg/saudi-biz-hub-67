-- Create Comprehensive Payroll System Tables
-- Overview: Complete payroll management system with employees, salaries, allowances, deductions, and payroll records

-- Table 1: Employees
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  employee_code text UNIQUE NOT NULL,
  full_name text NOT NULL,
  national_id text,
  email text,
  phone text,
  hire_date date NOT NULL DEFAULT CURRENT_DATE,
  department text NOT NULL,
  position text NOT NULL,
  employment_type text DEFAULT 'دوام كامل' CHECK (employment_type IN ('دوام كامل', 'دوام جزئي', 'عقد مؤقت')),
  basic_salary decimal(12,2) NOT NULL DEFAULT 0,
  bank_name text,
  bank_account text,
  iban text,
  status text DEFAULT 'نشط' CHECK (status IN ('نشط', 'غير نشط', 'مفصول')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table 2: Allowances
CREATE TABLE IF NOT EXISTS allowances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  allowance_type text NOT NULL,
  amount decimal(12,2) NOT NULL DEFAULT 0,
  is_recurring boolean DEFAULT true,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Table 3: Deductions
CREATE TABLE IF NOT EXISTS deductions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  deduction_type text NOT NULL,
  amount decimal(12,2) NOT NULL DEFAULT 0,
  is_recurring boolean DEFAULT true,
  remaining_installments integer DEFAULT 0,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Table 4: Payroll Records
CREATE TABLE IF NOT EXISTS payroll_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  year integer NOT NULL,
  basic_salary decimal(12,2) NOT NULL DEFAULT 0,
  total_allowances decimal(12,2) DEFAULT 0,
  total_deductions decimal(12,2) DEFAULT 0,
  net_salary decimal(12,2) NOT NULL DEFAULT 0,
  working_days integer DEFAULT 0,
  absent_days integer DEFAULT 0,
  overtime_hours decimal(8,2) DEFAULT 0,
  overtime_amount decimal(12,2) DEFAULT 0,
  status text DEFAULT 'مسودة' CHECK (status IN ('مسودة', 'معتمد', 'مدفوع')),
  payment_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, month, year)
);

-- Table 5: Attendance Records
CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  check_in time,
  check_out time,
  status text DEFAULT 'حاضر' CHECK (status IN ('حاضر', 'غائب', 'متأخر', 'نصف يوم', 'إجازة')),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- Enable RLS on all tables
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE allowances ENABLE ROW LEVEL SECURITY;
ALTER TABLE deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employees
CREATE POLICY "Users can view own employees"
  ON employees FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own employees"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own employees"
  ON employees FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own employees"
  ON employees FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for allowances
CREATE POLICY "Users can view own allowances"
  ON allowances FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own allowances"
  ON allowances FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own allowances"
  ON allowances FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own allowances"
  ON allowances FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for deductions
CREATE POLICY "Users can view own deductions"
  ON deductions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deductions"
  ON deductions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deductions"
  ON deductions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own deductions"
  ON deductions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for payroll_records
CREATE POLICY "Users can view own payroll records"
  ON payroll_records FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payroll records"
  ON payroll_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payroll records"
  ON payroll_records FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own payroll records"
  ON payroll_records FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for attendance_records
CREATE POLICY "Users can view own attendance records"
  ON attendance_records FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attendance records"
  ON attendance_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attendance records"
  ON attendance_records FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own attendance records"
  ON attendance_records FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_allowances_employee_id ON allowances(employee_id);
CREATE INDEX IF NOT EXISTS idx_deductions_employee_id ON deductions(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_employee_id ON payroll_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_month_year ON payroll_records(month, year);
CREATE INDEX IF NOT EXISTS idx_attendance_records_employee_id ON attendance_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON attendance_records(date);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_records_updated_at
  BEFORE UPDATE ON payroll_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate employee code
CREATE OR REPLACE FUNCTION generate_employee_code()
RETURNS TRIGGER AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(employee_code FROM 5) AS integer)), 0) + 1
  INTO next_num
  FROM employees
  WHERE user_id = NEW.user_id;
  
  NEW.employee_code := 'EMP-' || LPAD(next_num::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate employee code
CREATE TRIGGER generate_employee_code_trigger
  BEFORE INSERT ON employees
  FOR EACH ROW
  WHEN (NEW.employee_code IS NULL OR NEW.employee_code = '')
  EXECUTE FUNCTION generate_employee_code();