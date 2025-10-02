/*
  # Create Attachments System

  ## New Tables
  1. attachments - File attachments for various entities

  ## Security
  - Enable RLS on attachments table
*/

CREATE TABLE IF NOT EXISTS attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  file_name text NOT NULL,
  file_type text DEFAULT '',
  file_size integer DEFAULT 0,
  file_url text DEFAULT '',
  description text DEFAULT '',
  uploaded_by text DEFAULT '',
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own attachments" ON attachments FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_attachments_user ON attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_attachments_entity ON attachments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_attachments_created ON attachments(created_at DESC);