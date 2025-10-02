/*
  # Create Financial Contexts System

  ## Overview
  System for managing financial contexts (cost centers, branches, departments) for tracking and categorizing financial transactions

  ## New Tables
  1. `financial_contexts`
     - `id` (uuid, primary key)
     - `user_id` (uuid, references auth.users)
     - `context_code` (text, unique per user)
     - `context_name` (text)
     - `context_type` (text) - 'cost_center', 'branch', 'department', 'project', 'custom'
     - `parent_id` (uuid, self-reference for hierarchy)
     - `description` (text)
     - `is_active` (boolean, default true)
     - `manager_name` (text)
     - `budget_allocated` (decimal)
     - `phone` (text)
     - `email` (text)
     - `address` (text)
     - `notes` (text)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users to manage their own contexts
*/

-- Create financial_contexts table
CREATE TABLE IF NOT EXISTS financial_contexts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  context_code text NOT NULL,
  context_name text NOT NULL,
  context_type text NOT NULL CHECK (context_type IN ('cost_center', 'branch', 'department', 'project', 'custom')),
  parent_id uuid REFERENCES financial_contexts(id) ON DELETE SET NULL,
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  manager_name text DEFAULT '',
  budget_allocated decimal(15,2) DEFAULT 0,
  phone text DEFAULT '',
  email text DEFAULT '',
  address text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, context_code)
);

-- Enable RLS
ALTER TABLE financial_contexts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for financial_contexts
CREATE POLICY "Users can view own contexts"
  ON financial_contexts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contexts"
  ON financial_contexts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contexts"
  ON financial_contexts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own contexts"
  ON financial_contexts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_financial_contexts_user_id ON financial_contexts(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_contexts_context_type ON financial_contexts(context_type);
CREATE INDEX IF NOT EXISTS idx_financial_contexts_parent_id ON financial_contexts(parent_id);
CREATE INDEX IF NOT EXISTS idx_financial_contexts_is_active ON financial_contexts(is_active);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_financial_contexts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_financial_contexts_updated_at_trigger
  BEFORE UPDATE ON financial_contexts
  FOR EACH ROW
  EXECUTE FUNCTION update_financial_contexts_updated_at();