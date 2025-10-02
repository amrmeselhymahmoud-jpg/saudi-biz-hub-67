/*
  # Create Payroll Settings System

  ## New Tables
  1. payroll_settings - General payroll configuration
  2. allowance_types - Types of employee allowances
  3. deduction_types - Types of employee deductions

  ## Security
  - Enable RLS on all tables
*/

CREATE TABLE IF NOT EXISTS payroll_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  setting_key text NOT NULL,
  setting_value text NOT NULL,
  setting_type text DEFAULT 'text',
  category text DEFAULT 'general',
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, setting_key)
);

CREATE TABLE IF NOT EXISTS allowance_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  allowance_name text NOT NULL,
  allowance_code text NOT NULL,
  calculation_type text DEFAULT 'fixed',
  default_amount decimal(18, 2) DEFAULT 0,
  is_taxable boolean DEFAULT false,
  is_subject_to_gosi boolean DEFAULT false,
  is_active boolean DEFAULT true,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, allowance_code)
);

CREATE TABLE IF NOT EXISTS deduction_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  deduction_name text NOT NULL,
  deduction_code text NOT NULL,
  calculation_type text DEFAULT 'fixed',
  default_amount decimal(18, 2) DEFAULT 0,
  is_mandatory boolean DEFAULT false,
  is_active boolean DEFAULT true,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, deduction_code)
);

ALTER TABLE payroll_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE allowance_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE deduction_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own payroll settings" ON payroll_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own allowances" ON allowance_types FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own deductions" ON deduction_types FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);