/*
  # إنشاء نظام عروض الأسعار الكامل

  ## الجداول الجديدة
  
  ### 1. جدول quotes (عروض الأسعار)
  - `id` (uuid, primary key)
  - `quote_number` (text, unique) - رقم عرض السعر
  - `customer_id` (uuid, foreign key) - العميل
  - `quote_date` (date) - تاريخ العرض
  - `expiry_date` (date) - تاريخ الانتهاء
  - `status` (text) - الحالة (draft, sent, accepted, rejected, expired)
  - `subtotal` (decimal) - المجموع الفرعي
  - `tax_amount` (decimal) - مبلغ الضريبة
  - `discount_amount` (decimal) - مبلغ الخصم
  - `total_amount` (decimal) - المجموع الإجمالي
  - `notes` (text) - ملاحظات
  - `created_by` (uuid) - المستخدم المنشئ
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. جدول quote_items (بنود عروض الأسعار)
  - `id` (uuid, primary key)
  - `quote_id` (uuid, foreign key) - عرض السعر
  - `description` (text) - وصف البند
  - `quantity` (decimal) - الكمية
  - `unit_price` (decimal) - سعر الوحدة
  - `tax_rate` (decimal) - نسبة الضريبة
  - `discount_rate` (decimal) - نسبة الخصم
  - `total` (decimal) - المجموع
  - `created_at` (timestamptz)

  ## الأمان
  - تفعيل RLS على جميع الجداول
  - سياسات للمستخدمين المسجلين فقط
*/

-- إنشاء جدول عروض الأسعار
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  quote_date date NOT NULL DEFAULT CURRENT_DATE,
  expiry_date date,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  subtotal decimal(15,2) NOT NULL DEFAULT 0,
  tax_amount decimal(15,2) NOT NULL DEFAULT 0,
  discount_amount decimal(15,2) NOT NULL DEFAULT 0,
  total_amount decimal(15,2) NOT NULL DEFAULT 0,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- إنشاء جدول بنود عروض الأسعار
CREATE TABLE IF NOT EXISTS quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity decimal(10,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price decimal(15,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  tax_rate decimal(5,2) NOT NULL DEFAULT 15 CHECK (tax_rate >= 0 AND tax_rate <= 100),
  discount_rate decimal(5,2) NOT NULL DEFAULT 0 CHECK (discount_rate >= 0 AND discount_rate <= 100),
  total decimal(15,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- إنشاء الفهارس
CREATE INDEX IF NOT EXISTS idx_quotes_quote_number ON quotes(quote_number);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_quote_date ON quotes(quote_date);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_by ON quotes(created_by);

CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);

-- تفعيل RLS على جدول عروض الأسعار
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- سياسات عروض الأسعار
CREATE POLICY "Users can view all quotes"
  ON quotes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create quotes"
  ON quotes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update all quotes"
  ON quotes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete all quotes"
  ON quotes FOR DELETE
  TO authenticated
  USING (true);

-- تفعيل RLS على جدول بنود عروض الأسعار
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;

-- سياسات بنود عروض الأسعار
CREATE POLICY "Users can view all quote items"
  ON quote_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create quote items"
  ON quote_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update all quote items"
  ON quote_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete all quote items"
  ON quote_items FOR DELETE
  TO authenticated
  USING (true);

-- تطبيق trigger لتحديث updated_at على جدول quotes
DROP TRIGGER IF EXISTS update_quotes_updated_at ON quotes;
CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- تطبيق trigger لتعيين created_by تلقائياً
DROP TRIGGER IF EXISTS set_quotes_created_by ON quotes;
CREATE TRIGGER set_quotes_created_by
  BEFORE INSERT ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION set_created_by();
