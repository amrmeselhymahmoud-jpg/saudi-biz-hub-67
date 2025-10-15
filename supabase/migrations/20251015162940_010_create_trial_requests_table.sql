/*
  # Create Trial Requests Table

  ## Overview
  This migration creates a table to store free trial registration requests from potential customers.

  ## New Tables
  
  ### trial_requests
  Stores trial registration requests
  - `id` (uuid, primary key) - Unique request identifier
  - `company_name` (text) - Company/business name
  - `full_name` (text) - Full name of person requesting
  - `email` (text) - Email address
  - `phone` (text) - Phone number
  - `business_type` (text) - Type of business
  - `terms_agreed` (boolean) - Whether terms were agreed
  - `status` (text) - Request status: pending, approved, rejected, contacted
  - `notes` (text) - Internal notes about the request
  - `created_at` (timestamptz) - Request creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - RLS enabled on the table
  - Anyone can insert (for public registration form)
  - Only authenticated admin users can view/manage requests
  - Automatic timestamp tracking
*/

-- Create trial_requests table
CREATE TABLE IF NOT EXISTS trial_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  business_type text NOT NULL,
  terms_agreed boolean DEFAULT false NOT NULL,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'contacted')),
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trial_requests_email ON trial_requests(email);
CREATE INDEX IF NOT EXISTS idx_trial_requests_status ON trial_requests(status);
CREATE INDEX IF NOT EXISTS idx_trial_requests_created_at ON trial_requests(created_at DESC);

-- Enable RLS
ALTER TABLE trial_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Allow anyone to insert trial requests (public registration)
CREATE POLICY "Anyone can create trial requests"
  ON trial_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admin users can view trial requests
CREATE POLICY "Admin users can view trial requests"
  ON trial_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.role_code = 'ADMIN'
      AND ur.is_active = true
    )
  );

-- Only admin users can update trial requests
CREATE POLICY "Admin users can update trial requests"
  ON trial_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.role_code = 'ADMIN'
      AND ur.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.role_code = 'ADMIN'
      AND ur.is_active = true
    )
  );

-- Only admin users can delete trial requests
CREATE POLICY "Admin users can delete trial requests"
  ON trial_requests FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.role_code = 'ADMIN'
      AND ur.is_active = true
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_trial_requests_updated_at
  BEFORE UPDATE ON trial_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT INSERT ON trial_requests TO anon;
GRANT ALL ON trial_requests TO authenticated;