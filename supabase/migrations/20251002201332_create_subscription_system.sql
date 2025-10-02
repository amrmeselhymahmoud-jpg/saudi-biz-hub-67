/*
  # Create Subscription System

  ## Overview
  System for managing user subscriptions, plans, and billing

  ## New Tables
  1. `subscriptions`
     - `id` (uuid, primary key)
     - `user_id` (uuid, references auth.users)
     - `plan_type` (text) - 'free', 'basic', 'professional', 'enterprise'
     - `status` (text) - 'active', 'cancelled', 'expired', 'trial'
     - `start_date` (date)
     - `end_date` (date)
     - `trial_end_date` (date)
     - `auto_renew` (boolean)
     - `max_users` (integer)
     - `max_invoices` (integer)
     - `storage_gb` (integer)
     - `features` (jsonb) - Feature flags
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  2. `payment_history`
     - `id` (uuid, primary key)
     - `user_id` (uuid, references auth.users)
     - `subscription_id` (uuid, references subscriptions)
     - `amount` (decimal)
     - `currency` (text)
     - `payment_method` (text)
     - `payment_date` (timestamptz)
     - `status` (text) - 'completed', 'pending', 'failed', 'refunded'
     - `invoice_number` (text)
     - `notes` (text)
     - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users to manage their own subscriptions
*/

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan_type text DEFAULT 'free' CHECK (plan_type IN ('free', 'basic', 'professional', 'enterprise')),
  status text DEFAULT 'trial' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  start_date date DEFAULT CURRENT_DATE,
  end_date date,
  trial_end_date date DEFAULT (CURRENT_DATE + INTERVAL '14 days'),
  auto_renew boolean DEFAULT true,
  max_users integer DEFAULT 1,
  max_invoices integer DEFAULT 100,
  storage_gb integer DEFAULT 5,
  features jsonb DEFAULT '{
    "multi_currency": false,
    "advanced_reports": false,
    "api_access": false,
    "priority_support": false,
    "custom_branding": false,
    "multi_branch": false,
    "inventory_management": false,
    "payroll": false,
    "manufacturing": false,
    "projects": false
  }'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payment_history table
CREATE TABLE IF NOT EXISTS payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount decimal(15,2) NOT NULL,
  currency text DEFAULT 'SAR',
  payment_method text DEFAULT 'credit_card',
  payment_date timestamptz DEFAULT now(),
  status text DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed', 'refunded')),
  invoice_number text,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for payment_history
CREATE POLICY "Users can view own payment history"
  ON payment_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment history"
  ON payment_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_subscription_id ON payment_history(subscription_id);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at_trigger
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- Function to create default subscription for new users
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (user_id, plan_type, status, start_date, trial_end_date)
  VALUES (
    NEW.id,
    'free',
    'trial',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '14 days'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default subscription for new users
CREATE TRIGGER create_default_subscription_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_subscription();