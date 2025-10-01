/*
  # Create User Profiles Table

  ## Overview
  Creates a profiles table to store additional user information beyond what's stored in auth.users.
  This enables us to track company details and user preferences.

  ## Tables Created
  1. `profiles`
     - `id` (uuid, primary key) - References auth.users
     - `email` (text) - User email
     - `display_name` (text) - Full name of the user
     - `company_name` (text) - Company or organization name
     - `business_type` (text) - Type of business activity
     - `created_at` (timestamptz) - Account creation timestamp
     - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  1. Enable Row Level Security on profiles table
  2. Policy: Users can view their own profile
  3. Policy: Users can insert their own profile
  4. Policy: Users can update their own profile

  ## Triggers
  - Auto-update `updated_at` timestamp on profile changes
  - Auto-create profile when new user signs up
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  display_name text,
  company_name text,
  business_type text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, company_name, business_type)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'business_type'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();