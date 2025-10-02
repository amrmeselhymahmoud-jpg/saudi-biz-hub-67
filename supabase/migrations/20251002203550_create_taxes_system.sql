/*
  # Create Taxes System

  ## Overview
  Comprehensive tax management system for Saudi Arabia (VAT, Withholding Tax, etc.)

  ## New Tables
  1. `tax_types`
     - `id` (uuid, primary key)
     - `user_id` (uuid, references auth.users)
     - `tax_name` (text) - Name in Arabic
     - `tax_name_en` (text) - Name in English
     - `tax_code` (text) - Unique code (VAT, WHT, etc.)
     - `tax_rate` (decimal) - Tax rate percentage
     - `is_active` (boolean)
     - `applies_to` (text) - sales, purchases, both
     - `calculation_method` (text) - inclusive, exclusive, fixed
     - `description` (text)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  2. `tax_transactions`
     - `id` (uuid, primary key)
     - `user_id` (uuid, references auth.users)
     - `tax_type_id` (uuid, references tax_types)
     - `transaction_type` (text) - invoice, bill, payment
     - `transaction_reference` (text)
     - `transaction_date` (date)
     - `base_amount` (decimal)
     - `tax_amount` (decimal)
     - `total_amount` (decimal)
     - `status` (text) - pending, paid, submitted
     - `notes` (text)
     - `created_at` (timestamptz)

  3. `tax_returns`
     - `id` (uuid, primary key)
     - `user_id` (uuid, references auth.users)
     - `return_period` (text) - 2025-Q1, 2025-01, etc.
     - `period_start` (date)
     - `period_end` (date)
     - `total_sales` (decimal)
     - `total_purchases` (decimal)
     - `output_tax` (decimal)
     - `input_tax` (decimal)
     - `net_tax` (decimal)
     - `status` (text) - draft, submitted, paid
     - `submission_date` (date)
     - `payment_date` (date)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users
*/

-- Create tax_types table
CREATE TABLE IF NOT EXISTS tax_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tax_name text NOT NULL,
  tax_name_en text NOT NULL,
  tax_code text NOT NULL,
  tax_rate decimal(5, 2) NOT NULL,
  is_active boolean DEFAULT true,
  applies_to text DEFAULT 'both' CHECK (applies_to IN ('sales', 'purchases', 'both')),
  calculation_method text DEFAULT 'exclusive' CHECK (calculation_method IN ('inclusive', 'exclusive', 'fixed')),
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, tax_code)
);

-- Create tax_transactions table
CREATE TABLE IF NOT EXISTS tax_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tax_type_id uuid REFERENCES tax_types(id) ON DELETE CASCADE NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('invoice', 'bill', 'payment', 'receipt')),
  transaction_reference text DEFAULT '',
  transaction_date date DEFAULT CURRENT_DATE,
  base_amount decimal(18, 2) NOT NULL,
  tax_amount decimal(18, 2) NOT NULL,
  total_amount decimal(18, 2) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'submitted', 'cancelled')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create tax_returns table
CREATE TABLE IF NOT EXISTS tax_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  return_period text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_sales decimal(18, 2) DEFAULT 0,
  total_purchases decimal(18, 2) DEFAULT 0,
  output_tax decimal(18, 2) DEFAULT 0,
  input_tax decimal(18, 2) DEFAULT 0,
  net_tax decimal(18, 2) DEFAULT 0,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'paid', 'overdue')),
  submission_date date,
  payment_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, return_period)
);

-- Enable RLS
ALTER TABLE tax_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_returns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tax_types
CREATE POLICY "Users can view own tax types"
  ON tax_types FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tax types"
  ON tax_types FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tax types"
  ON tax_types FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tax types"
  ON tax_types FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for tax_transactions
CREATE POLICY "Users can view own tax transactions"
  ON tax_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tax transactions"
  ON tax_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tax transactions"
  ON tax_transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for tax_returns
CREATE POLICY "Users can view own tax returns"
  ON tax_returns FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tax returns"
  ON tax_returns FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tax returns"
  ON tax_returns FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tax_types_user_id ON tax_types(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_types_code ON tax_types(tax_code);
CREATE INDEX IF NOT EXISTS idx_tax_transactions_user_id ON tax_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_transactions_date ON tax_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_tax_returns_user_id ON tax_returns(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_returns_period ON tax_returns(return_period);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_tax_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_tax_types_updated_at_trigger
  BEFORE UPDATE ON tax_types
  FOR EACH ROW
  EXECUTE FUNCTION update_tax_updated_at();

CREATE TRIGGER update_tax_returns_updated_at_trigger
  BEFORE UPDATE ON tax_returns
  FOR EACH ROW
  EXECUTE FUNCTION update_tax_updated_at();