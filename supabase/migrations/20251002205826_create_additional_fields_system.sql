/*
  # Create Additional Fields System

  ## New Tables
  1. custom_fields - Custom field definitions
  2. field_values - Values for custom fields

  ## Security
  - Enable RLS on all tables
*/

CREATE TABLE IF NOT EXISTS custom_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  field_name text NOT NULL,
  field_label text NOT NULL,
  field_type text DEFAULT 'text',
  entity_type text NOT NULL,
  is_required boolean DEFAULT false,
  default_value text DEFAULT '',
  options jsonb DEFAULT '[]'::jsonb,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, entity_type, field_name)
);

CREATE TABLE IF NOT EXISTS field_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  custom_field_id uuid REFERENCES custom_fields(id) ON DELETE CASCADE NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  field_value text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(custom_field_id, entity_id)
);

ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own custom fields" ON custom_fields FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own field values" ON field_values FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_custom_fields_user ON custom_fields(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_fields_entity ON custom_fields(entity_type);
CREATE INDEX IF NOT EXISTS idx_field_values_user ON field_values(user_id);
CREATE INDEX IF NOT EXISTS idx_field_values_field ON field_values(custom_field_id);
CREATE INDEX IF NOT EXISTS idx_field_values_entity ON field_values(entity_type, entity_id);