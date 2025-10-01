/*
  # إنشاء جداول الأصول الثابتة والإهلاك

  1. جداول جديدة
    - `fixed_assets` - الأصول الثابتة
      - `id` (uuid, primary key)
      - `user_id` (uuid, مرجع للمستخدم)
      - `asset_code` (text, كود الأصل الفريد)
      - `asset_name` (text, اسم الأصل)
      - `category` (text, فئة الأصل)
      - `purchase_date` (date, تاريخ الشراء)
      - `purchase_cost` (numeric, تكلفة الشراء)
      - `salvage_value` (numeric, القيمة المتبقية)
      - `useful_life_years` (numeric, العمر الإنتاجي بالسنوات)
      - `depreciation_method` (text, طريقة الإهلاك)
      - `current_value` (numeric, القيمة الحالية)
      - `accumulated_depreciation` (numeric, الإهلاك المتراكم)
      - `location` (text, موقع الأصل)
      - `status` (text, حالة الأصل)
      - `notes` (text, ملاحظات)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `depreciation_records` - سجلات الإهلاك
      - `id` (uuid, primary key)
      - `user_id` (uuid, مرجع للمستخدم)
      - `asset_id` (uuid, مرجع للأصل)
      - `period_date` (date, تاريخ الفترة)
      - `depreciation_amount` (numeric, مبلغ الإهلاك)
      - `accumulated_depreciation` (numeric, الإهلاك المتراكم)
      - `book_value` (numeric, القيمة الدفترية)
      - `notes` (text, ملاحظات)
      - `created_at` (timestamptz)

    - `asset_additions` - إضافات الأصول
      - `id` (uuid, primary key)
      - `user_id` (uuid, مرجع للمستخدم)
      - `asset_id` (uuid, مرجع للأصل)
      - `addition_date` (date, تاريخ الإضافة)
      - `description` (text, وصف الإضافة)
      - `cost` (numeric, التكلفة)
      - `notes` (text, ملاحظات)
      - `created_at` (timestamptz)

    - `asset_disposals` - استعادات/استبعادات الأصول
      - `id` (uuid, primary key)
      - `user_id` (uuid, مرجع للمستخدم)
      - `asset_id` (uuid, مرجع للأصل)
      - `disposal_date` (date, تاريخ الاستبعاد)
      - `disposal_method` (text, طريقة الاستبعاد)
      - `sale_price` (numeric, سعر البيع)
      - `book_value` (numeric, القيمة الدفترية)
      - `gain_loss` (numeric, الربح/الخسارة)
      - `notes` (text, ملاحظات)
      - `created_at` (timestamptz)

  2. الأمان
    - تفعيل RLS على جميع الجداول
    - سياسات للمستخدمين المصادقين
*/

-- جدول الأصول الثابتة
CREATE TABLE IF NOT EXISTS fixed_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
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
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- جدول سجلات الإهلاك
CREATE TABLE IF NOT EXISTS depreciation_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  asset_id uuid REFERENCES fixed_assets(id) ON DELETE CASCADE NOT NULL,
  period_date date NOT NULL,
  depreciation_amount numeric NOT NULL CHECK (depreciation_amount >= 0),
  accumulated_depreciation numeric NOT NULL,
  book_value numeric NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- جدول إضافات الأصول
CREATE TABLE IF NOT EXISTS asset_additions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  asset_id uuid REFERENCES fixed_assets(id) ON DELETE CASCADE NOT NULL,
  addition_date date NOT NULL,
  description text NOT NULL,
  cost numeric NOT NULL CHECK (cost >= 0),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- جدول استبعادات الأصول
CREATE TABLE IF NOT EXISTS asset_disposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  asset_id uuid REFERENCES fixed_assets(id) ON DELETE CASCADE NOT NULL,
  disposal_date date NOT NULL,
  disposal_method text NOT NULL CHECK (disposal_method IN ('sale', 'scrap', 'donation', 'trade')),
  sale_price numeric DEFAULT 0,
  book_value numeric NOT NULL,
  gain_loss numeric NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE fixed_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE depreciation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_additions ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_disposals ENABLE ROW LEVEL SECURITY;

-- سياسات الأصول الثابتة
CREATE POLICY "Users can view own fixed assets"
  ON fixed_assets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fixed assets"
  ON fixed_assets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fixed assets"
  ON fixed_assets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own fixed assets"
  ON fixed_assets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- سياسات سجلات الإهلاك
CREATE POLICY "Users can view own depreciation records"
  ON depreciation_records FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own depreciation records"
  ON depreciation_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own depreciation records"
  ON depreciation_records FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own depreciation records"
  ON depreciation_records FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- سياسات إضافات الأصول
CREATE POLICY "Users can view own asset additions"
  ON asset_additions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own asset additions"
  ON asset_additions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own asset additions"
  ON asset_additions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own asset additions"
  ON asset_additions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- سياسات استبعادات الأصول
CREATE POLICY "Users can view own asset disposals"
  ON asset_disposals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own asset disposals"
  ON asset_disposals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own asset disposals"
  ON asset_disposals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own asset disposals"
  ON asset_disposals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- الفهارس
CREATE INDEX IF NOT EXISTS idx_fixed_assets_user_id ON fixed_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_status ON fixed_assets(status);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_category ON fixed_assets(category);
CREATE INDEX IF NOT EXISTS idx_depreciation_records_asset_id ON depreciation_records(asset_id);
CREATE INDEX IF NOT EXISTS idx_depreciation_records_period_date ON depreciation_records(period_date);
CREATE INDEX IF NOT EXISTS idx_asset_additions_asset_id ON asset_additions(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_disposals_asset_id ON asset_disposals(asset_id);
