/*
  # Create Electronic Linking System

  ## Overview
  System for managing electronic linking with external systems (ZATCA, Banks, Payment Gateways, etc.)

  ## New Tables
  1. `electronic_integrations`
     - `id` (uuid, primary key)
     - `user_id` (uuid, references auth.users)
     - `integration_type` (text) - 'zatca', 'bank', 'payment_gateway', 'shipping', 'crm'
     - `integration_name` (text) - Name of the integration
     - `status` (text) - 'active', 'inactive', 'pending', 'error'
     - `api_key` (text) - Encrypted API key
     - `api_secret` (text) - Encrypted API secret
     - `config` (jsonb) - Configuration settings
     - `last_sync` (timestamptz) - Last synchronization time
     - `sync_status` (text) - 'success', 'failed', 'in_progress'
     - `error_message` (text)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  2. `sync_logs`
     - `id` (uuid, primary key)
     - `user_id` (uuid, references auth.users)
     - `integration_id` (uuid, references electronic_integrations)
     - `sync_type` (text) - 'invoice', 'payment', 'customer', 'product'
     - `direction` (text) - 'inbound', 'outbound'
     - `status` (text) - 'success', 'failed', 'pending'
     - `records_count` (integer)
     - `error_details` (text)
     - `started_at` (timestamptz)
     - `completed_at` (timestamptz)
     - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users to manage their own integrations
*/

-- Create electronic_integrations table
CREATE TABLE IF NOT EXISTS electronic_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  integration_type text NOT NULL CHECK (integration_type IN ('zatca', 'bank', 'payment_gateway', 'shipping', 'crm', 'accounting')),
  integration_name text NOT NULL,
  status text DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'pending', 'error')),
  api_key text DEFAULT '',
  api_secret text DEFAULT '',
  config jsonb DEFAULT '{}'::jsonb,
  last_sync timestamptz,
  sync_status text DEFAULT 'success' CHECK (sync_status IN ('success', 'failed', 'in_progress')),
  error_message text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sync_logs table
CREATE TABLE IF NOT EXISTS sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  integration_id uuid REFERENCES electronic_integrations(id) ON DELETE CASCADE NOT NULL,
  sync_type text NOT NULL CHECK (sync_type IN ('invoice', 'payment', 'customer', 'product', 'tax')),
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  status text DEFAULT 'pending' CHECK (status IN ('success', 'failed', 'pending')),
  records_count integer DEFAULT 0,
  error_details text DEFAULT '',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE electronic_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for electronic_integrations
CREATE POLICY "Users can view own integrations"
  ON electronic_integrations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own integrations"
  ON electronic_integrations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own integrations"
  ON electronic_integrations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own integrations"
  ON electronic_integrations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for sync_logs
CREATE POLICY "Users can view own sync logs"
  ON sync_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync logs"
  ON sync_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_electronic_integrations_user_id ON electronic_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_electronic_integrations_type ON electronic_integrations(integration_type);
CREATE INDEX IF NOT EXISTS idx_sync_logs_user_id ON sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_integration_id ON sync_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON sync_logs(created_at DESC);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_electronic_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_electronic_integrations_updated_at_trigger
  BEFORE UPDATE ON electronic_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_electronic_integrations_updated_at();