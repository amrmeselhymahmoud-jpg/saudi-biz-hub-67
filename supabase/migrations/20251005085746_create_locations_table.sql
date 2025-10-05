/*
  # إنشاء جدول المواقع والفروع
  
  1. الجداول الجديدة
    - `locations`
      - `id` (uuid, primary key)
      - `code` (text, unique) - كود الموقع الفريد
      - `name` (text) - اسم الموقع
      - `address` (text, nullable) - العنوان
      - `city` (text, nullable) - المدينة
      - `phone` (text, nullable) - رقم الهاتف
      - `manager_name` (text, nullable) - اسم المدير
      - `is_active` (boolean) - حالة النشاط
      - `notes` (text, nullable) - ملاحظات
      - `user_id` (uuid, nullable) - المستخدم الذي أنشأ الموقع
      - `created_at` (timestamptz) - تاريخ الإنشاء
      - `updated_at` (timestamptz) - تاريخ آخر تحديث
  
  2. الأمان
    - تفعيل RLS على جدول `locations`
    - سياسات للسماح بالقراءة والإضافة والتعديل والحذف للجميع (وضع التجربة)
*/

-- إنشاء جدول المواقع
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  address text,
  city text,
  phone text,
  manager_name text,
  is_active boolean DEFAULT true NOT NULL,
  notes text,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- تفعيل RLS
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة للجميع
CREATE POLICY "Allow read access to all users"
  ON locations
  FOR SELECT
  TO public
  USING (true);

-- سياسة الإضافة للجميع
CREATE POLICY "Allow insert access to all users"
  ON locations
  FOR INSERT
  TO public
  WITH CHECK (true);

-- سياسة التحديث للجميع
CREATE POLICY "Allow update access to all users"
  ON locations
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- سياسة الحذف للجميع
CREATE POLICY "Allow delete access to all users"
  ON locations
  FOR DELETE
  TO public
  USING (true);

-- إنشاء فهرس لتسريع البحث
CREATE INDEX IF NOT EXISTS idx_locations_code ON locations(code);
CREATE INDEX IF NOT EXISTS idx_locations_name ON locations(name);
CREATE INDEX IF NOT EXISTS idx_locations_city ON locations(city);
CREATE INDEX IF NOT EXISTS idx_locations_is_active ON locations(is_active);

-- دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger لتحديث updated_at
DROP TRIGGER IF EXISTS locations_updated_at_trigger ON locations;
CREATE TRIGGER locations_updated_at_trigger
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_locations_updated_at();