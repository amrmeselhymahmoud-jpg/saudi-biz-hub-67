/*
  # Create Profiles System

  ## New Tables
  1. profiles - User profiles with additional information

  ## Security
  - Enable RLS on profiles table
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text DEFAULT '',
  company_name text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  address text DEFAULT '',
  city text DEFAULT '',
  country text DEFAULT 'السعودية',
  postal_code text DEFAULT '',
  tax_number text DEFAULT '',
  commercial_register text DEFAULT '',
  avatar_url text DEFAULT '',
  language text DEFAULT 'ar',
  timezone text DEFAULT 'Asia/Riyadh',
  currency text DEFAULT 'SAR',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);