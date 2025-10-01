/*
  # إنشاء جدول المواقع

  1. جدول جديد
    - `locations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, مرجع للمستخدم)
      - `name` (text, اسم الموقع - مطلوب)
      - `code` (text, كود الموقع الفريد - مطلوب)
      - `address` (text, العنوان)
      - `city` (text, المدينة)
      - `phone` (text, رقم الهاتف)
      - `manager_name` (text, اسم المدير)
      - `is_active` (boolean, حالة الموقع - افتراضي true)
      - `notes` (text, ملاحظات)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. الأمان
    - تفعيل RLS على جدول `locations`
    - سياسات للمستخدمين المصادقين لإدارة مواقعهم الخاصة
*/

CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  address text,
  city text,
  phone text,
  manager_name text,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own locations"
  ON locations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own locations"
  ON locations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own locations"
  ON locations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own locations"
  ON locations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_locations_user_id ON locations(user_id);
CREATE INDEX IF NOT EXISTS idx_locations_code ON locations(code);
CREATE INDEX IF NOT EXISTS idx_locations_is_active ON locations(is_active);
