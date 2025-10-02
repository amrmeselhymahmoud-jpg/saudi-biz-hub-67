/*
  # Create General Settings System

  ## Overview
  Complete system for managing general application settings for each user

  ## New Tables
  1. `general_settings`
     - `id` (uuid, primary key)
     - `user_id` (uuid, references auth.users)
     - Company Information
       - `company_name` (text)
       - `company_name_en` (text)
       - `tax_number` (text)
       - `commercial_registration` (text)
       - `phone` (text)
       - `email` (text)
       - `website` (text)
       - `address` (text)
       - `city` (text)
       - `country` (text, default 'المملكة العربية السعودية')
       - `postal_code` (text)
     - Financial Settings
       - `currency` (text, default 'ر.س')
       - `currency_code` (text, default 'SAR')
       - `fiscal_year_start` (date)
       - `vat_percentage` (decimal, default 15)
     - System Settings
       - `language` (text, default 'ar')
       - `date_format` (text, default 'DD/MM/YYYY')
       - `timezone` (text, default 'Asia/Riyadh')
     - Notification Settings
       - `email_notifications` (boolean, default true)
       - `sms_notifications` (boolean, default false)
     - Timestamps
       - `created_at` (timestamptz)
       - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users to manage their own settings
*/

-- Create general_settings table
CREATE TABLE IF NOT EXISTS general_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Company Information
  company_name text NOT NULL DEFAULT '',
  company_name_en text DEFAULT '',
  tax_number text DEFAULT '',
  commercial_registration text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  website text DEFAULT '',
  address text DEFAULT '',
  city text DEFAULT '',
  country text DEFAULT 'المملكة العربية السعودية',
  postal_code text DEFAULT '',
  
  -- Financial Settings
  currency text DEFAULT 'ر.س',
  currency_code text DEFAULT 'SAR',
  fiscal_year_start date DEFAULT '2024-01-01',
  vat_percentage decimal(5,2) DEFAULT 15.00,
  
  -- System Settings
  language text DEFAULT 'ar' CHECK (language IN ('ar', 'en')),
  date_format text DEFAULT 'DD/MM/YYYY',
  timezone text DEFAULT 'Asia/Riyadh',
  
  -- Notification Settings
  email_notifications boolean DEFAULT true,
  sms_notifications boolean DEFAULT false,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE general_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for general_settings
CREATE POLICY "Users can view own settings"
  ON general_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON general_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON general_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings"
  ON general_settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_general_settings_user_id ON general_settings(user_id);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_general_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_general_settings_updated_at_trigger
  BEFORE UPDATE ON general_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_general_settings_updated_at();

-- Function to create default settings for new users
CREATE OR REPLACE FUNCTION create_default_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO general_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default settings when a new user signs up
CREATE TRIGGER create_default_settings_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_settings();