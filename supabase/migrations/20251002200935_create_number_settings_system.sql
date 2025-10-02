/*
  # Create Number Settings System

  ## Overview
  System for managing document numbering sequences (invoices, quotes, purchase orders, etc.)

  ## New Tables
  1. `number_settings`
     - `id` (uuid, primary key)
     - `user_id` (uuid, references auth.users)
     - `document_type` (text) - 'sales_invoice', 'purchase_invoice', 'quote', etc.
     - `prefix` (text) - INV-, QT-, PO-, etc.
     - `next_number` (integer) - Next number to use
     - `number_length` (integer) - Padding length (e.g., 5 = 00001)
     - `suffix` (text) - Optional suffix
     - `separator` (text) - Separator between prefix and number (default: -)
     - `reset_frequency` (text) - 'never', 'yearly', 'monthly'
     - `last_reset_date` (date)
     - `sample_format` (text) - Generated sample
     - `is_active` (boolean)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users to manage their own settings
*/

-- Create number_settings table
CREATE TABLE IF NOT EXISTS number_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL CHECK (document_type IN (
    'sales_invoice',
    'purchase_invoice',
    'quote',
    'purchase_order',
    'customer_receipt',
    'supplier_payment',
    'manual_entry',
    'annual_entry',
    'simple_invoice',
    'deferred_invoice'
  )),
  prefix text DEFAULT '',
  next_number integer DEFAULT 1,
  number_length integer DEFAULT 5 CHECK (number_length > 0 AND number_length <= 10),
  suffix text DEFAULT '',
  separator text DEFAULT '-',
  reset_frequency text DEFAULT 'never' CHECK (reset_frequency IN ('never', 'yearly', 'monthly')),
  last_reset_date date,
  sample_format text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, document_type)
);

-- Enable RLS
ALTER TABLE number_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for number_settings
CREATE POLICY "Users can view own number settings"
  ON number_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own number settings"
  ON number_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own number settings"
  ON number_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own number settings"
  ON number_settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_number_settings_user_id ON number_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_number_settings_document_type ON number_settings(document_type);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_number_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_number_settings_updated_at_trigger
  BEFORE UPDATE ON number_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_number_settings_updated_at();

-- Function to generate sample format
CREATE OR REPLACE FUNCTION generate_sample_format()
RETURNS TRIGGER AS $$
DECLARE
  padded_number text;
BEGIN
  padded_number := lpad(NEW.next_number::text, NEW.number_length, '0');
  NEW.sample_format := NEW.prefix || NEW.separator || padded_number || NEW.suffix;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to generate sample format
CREATE TRIGGER generate_sample_format_trigger
  BEFORE INSERT OR UPDATE ON number_settings
  FOR EACH ROW
  EXECUTE FUNCTION generate_sample_format();

-- Function to create default number settings for new users
CREATE OR REPLACE FUNCTION create_default_number_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO number_settings (user_id, document_type, prefix, next_number, number_length)
  VALUES 
    (NEW.id, 'sales_invoice', 'INV', 1, 5),
    (NEW.id, 'purchase_invoice', 'PINV', 1, 5),
    (NEW.id, 'quote', 'QT', 1, 5),
    (NEW.id, 'purchase_order', 'PO', 1, 5),
    (NEW.id, 'customer_receipt', 'REC', 1, 5),
    (NEW.id, 'supplier_payment', 'PAY', 1, 5),
    (NEW.id, 'manual_entry', 'ME', 1, 5),
    (NEW.id, 'annual_entry', 'AE', 1, 5),
    (NEW.id, 'simple_invoice', 'SI', 1, 5),
    (NEW.id, 'deferred_invoice', 'DI', 1, 5)
  ON CONFLICT (user_id, document_type) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default number settings for new users
CREATE TRIGGER create_default_number_settings_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_number_settings();