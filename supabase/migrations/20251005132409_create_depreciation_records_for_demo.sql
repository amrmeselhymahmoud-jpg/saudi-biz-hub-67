/*
  # إنشاء جدول سجلات الإهلاك
  
  1. الجداول الجديدة
    - `depreciation_records` - سجلات الإهلاك الشهرية
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable للتجربة)
      - `asset_id` (uuid, مرجع للأصل الثابت)
      - `period_date` (date, تاريخ فترة الإهلاك)
      - `depreciation_amount` (numeric, مبلغ الإهلاك)
      - `accumulated_depreciation` (numeric, الإهلاك المتراكم)
      - `book_value` (numeric, القيمة الدفترية)
      - `notes` (text, ملاحظات)
      - `created_at` (timestamptz)
  
  2. الأمان
    - تفعيل RLS
    - سياسات عامة للتجربة
*/

-- إنشاء جدول سجلات الإهلاك
CREATE TABLE IF NOT EXISTS depreciation_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  asset_id uuid REFERENCES fixed_assets(id) ON DELETE CASCADE NOT NULL,
  period_date date NOT NULL,
  depreciation_amount numeric NOT NULL CHECK (depreciation_amount >= 0),
  accumulated_depreciation numeric NOT NULL,
  book_value numeric NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- تفعيل RLS
ALTER TABLE depreciation_records ENABLE ROW LEVEL SECURITY;

-- سياسات للجميع (للتجربة)
CREATE POLICY "Allow read access to all users"
  ON depreciation_records
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow insert access to all users"
  ON depreciation_records
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow update access to all users"
  ON depreciation_records
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete access to all users"
  ON depreciation_records
  FOR DELETE
  TO public
  USING (true);

-- الفهارس
CREATE INDEX IF NOT EXISTS idx_depreciation_records_asset_id ON depreciation_records(asset_id);
CREATE INDEX IF NOT EXISTS idx_depreciation_records_period_date ON depreciation_records(period_date);
CREATE INDEX IF NOT EXISTS idx_depreciation_records_created_at ON depreciation_records(created_at);