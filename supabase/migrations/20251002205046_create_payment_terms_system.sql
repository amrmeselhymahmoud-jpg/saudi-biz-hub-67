/*
  # Create Payment Terms System

  ## New Tables
  1. payment_terms - Payment terms and conditions
  2. payment_schedules - Payment schedule templates

  ## Security
  - Enable RLS on all tables
*/

CREATE TABLE IF NOT EXISTS payment_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  term_name text NOT NULL,
  term_code text NOT NULL,
  days_until_due integer DEFAULT 0,
  discount_percentage decimal(5, 2) DEFAULT 0,
  discount_days integer DEFAULT 0,
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, term_code)
);

CREATE TABLE IF NOT EXISTS payment_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  payment_term_id uuid REFERENCES payment_terms(id) ON DELETE CASCADE,
  schedule_name text NOT NULL,
  number_of_installments integer DEFAULT 1,
  installment_percentage decimal(5, 2) DEFAULT 100,
  days_between_installments integer DEFAULT 30,
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payment_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own payment terms" ON payment_terms FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own schedules" ON payment_schedules FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_payment_terms_user ON payment_terms(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_user ON payment_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_term ON payment_schedules(payment_term_id);