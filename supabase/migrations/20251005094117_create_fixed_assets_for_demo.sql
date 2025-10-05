/*
  # إنشاء جدول الأصول الثابتة
  
  1. الجداول الجديدة
    - `fixed_assets` - الأصول الثابتة
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable للتجربة)
      - `asset_code` (text, كود فريد)
      - `asset_name` (text, اسم الأصل)
      - `category` (text, الفئة)
      - `purchase_date` (date, تاريخ الشراء)
      - `purchase_cost` (numeric, التكلفة)
      - `salvage_value` (numeric, القيمة المتبقية)
      - `useful_life_years` (numeric, العمر الإنتاجي)
      - `depreciation_method` (text, طريقة الإهلاك)
      - `current_value` (numeric, القيمة الحالية)
      - `accumulated_depreciation` (numeric, الإهلاك المتراكم)
      - `location` (text, الموقع)
      - `status` (text, الحالة)
      - `notes` (text, ملاحظات)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. الأمان
    - تفعيل RLS
    - سياسات عامة للتجربة
*/

-- إنشاء جدول الأصول الثابتة
CREATE TABLE IF NOT EXISTS fixed_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  asset_code text NOT NULL UNIQUE,
  asset_name text NOT NULL,
  category text NOT NULL,
  purchase_date date NOT NULL,
  purchase_cost numeric NOT NULL CHECK (purchase_cost >= 0),
  salvage_value numeric DEFAULT 0 CHECK (salvage_value >= 0),
  useful_life_years numeric NOT NULL CHECK (useful_life_years > 0),
  depreciation_method text NOT NULL DEFAULT 'straight_line' CHECK (depreciation_method IN ('straight_line', 'declining_balance', 'sum_of_years')),
  current_value numeric DEFAULT 0,
  accumulated_depreciation numeric DEFAULT 0,
  location text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disposed', 'under_maintenance')),
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- تفعيل RLS
ALTER TABLE fixed_assets ENABLE ROW LEVEL SECURITY;

-- سياسات للجميع (للتجربة)
CREATE POLICY "Allow read access to all users"
  ON fixed_assets
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow insert access to all users"
  ON fixed_assets
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow update access to all users"
  ON fixed_assets
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete access to all users"
  ON fixed_assets
  FOR DELETE
  TO public
  USING (true);

-- الفهارس
CREATE INDEX IF NOT EXISTS idx_fixed_assets_status ON fixed_assets(status);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_category ON fixed_assets(category);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_asset_code ON fixed_assets(asset_code);

-- دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_fixed_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger لتحديث updated_at
DROP TRIGGER IF EXISTS fixed_assets_updated_at_trigger ON fixed_assets;
CREATE TRIGGER fixed_assets_updated_at_trigger
  BEFORE UPDATE ON fixed_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_fixed_assets_updated_at();