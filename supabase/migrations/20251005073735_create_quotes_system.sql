/*
  # إنشاء نظام عروض الأسعار

  1. الجداول الجديدة
    - `quotes` - جدول عروض الأسعار الرئيسي
      - `id` (uuid, primary key) - معرف فريد لعرض السعر
      - `quote_number` (text, unique) - رقم عرض السعر
      - `customer_id` (uuid) - معرف العميل (مرجع لجدول customers)
      - `quote_date` (date) - تاريخ إصدار العرض
      - `expiry_date` (date) - تاريخ انتهاء صلاحية العرض
      - `status` (text) - حالة العرض (draft/sent/accepted/rejected/expired)
      - `subtotal` (numeric) - المجموع الفرعي قبل الضريبة والخصم
      - `tax_amount` (numeric) - قيمة الضريبة المضافة
      - `discount_amount` (numeric) - قيمة الخصم
      - `total_amount` (numeric) - المبلغ الإجمالي النهائي
      - `notes` (text) - ملاحظات إضافية
      - `created_by` (uuid) - المستخدم الذي أنشأ العرض
      - `created_at` (timestamptz) - تاريخ الإنشاء
      - `updated_at` (timestamptz) - تاريخ آخر تحديث
    
    - `quote_items` - جدول بنود عرض السعر (تفاصيل المنتجات/الخدمات)
      - `id` (uuid, primary key) - معرف فريد للبند
      - `quote_id` (uuid) - معرف عرض السعر
      - `description` (text) - وصف المنتج أو الخدمة
      - `quantity` (numeric) - الكمية
      - `unit_price` (numeric) - سعر الوحدة
      - `tax_rate` (numeric) - نسبة الضريبة
      - `discount_rate` (numeric) - نسبة الخصم
      - `total` (numeric) - المجموع الكلي للبند
      - `created_at` (timestamptz) - تاريخ الإنشاء

  2. الأمان (Row Level Security)
    - تفعيل RLS على جميع الجداول
    - سياسة SELECT: يمكن للمستخدمين عرض عروض الأسعار التي أنشأوها فقط
    - سياسة INSERT: يمكن للمستخدمين إنشاء عروض أسعار جديدة
    - سياسة UPDATE: يمكن للمستخدمين تعديل عروض الأسعار الخاصة بهم فقط
    - سياسة DELETE: يمكن للمستخدمين حذف عروض الأسعار الخاصة بهم فقط

  3. الفهارس (Indexes)
    - فهرس على created_by لتحسين أداء الاستعلامات
    - فهرس على customer_id للربط مع جدول العملاء
    - فهرس على quote_id في جدول quote_items للربط مع الجدول الرئيسي
*/

-- إنشاء جدول عروض الأسعار الرئيسي
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number text NOT NULL UNIQUE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  quote_date date NOT NULL DEFAULT CURRENT_DATE,
  expiry_date date,
  status text NOT NULL DEFAULT 'draft',
  subtotal numeric NOT NULL DEFAULT 0,
  tax_amount numeric NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  CONSTRAINT positive_amounts CHECK (
    subtotal >= 0 AND 
    tax_amount >= 0 AND 
    discount_amount >= 0 AND 
    total_amount >= 0
  )
);

-- إنشاء جدول بنود عرض السعر
CREATE TABLE IF NOT EXISTS quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  tax_rate numeric NOT NULL DEFAULT 0,
  discount_rate numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT positive_quantity CHECK (quantity > 0),
  CONSTRAINT positive_unit_price CHECK (unit_price >= 0),
  CONSTRAINT valid_tax_rate CHECK (tax_rate >= 0 AND tax_rate <= 100),
  CONSTRAINT valid_discount_rate CHECK (discount_rate >= 0 AND discount_rate <= 100)
);

-- تفعيل Row Level Security
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان لجدول quotes
CREATE POLICY "Users can view own quotes"
  ON quotes FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create own quotes"
  ON quotes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own quotes"
  ON quotes FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own quotes"
  ON quotes FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- سياسات الأمان لجدول quote_items
CREATE POLICY "Users can view own quote items"
  ON quote_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
      AND quotes.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can create own quote items"
  ON quote_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
      AND quotes.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update own quote items"
  ON quote_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
      AND quotes.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete own quote items"
  ON quote_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
      AND quotes.created_by = auth.uid()
    )
  );

-- إنشاء الفهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_quotes_created_by ON quotes(created_by);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_quote_date ON quotes(quote_date);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);