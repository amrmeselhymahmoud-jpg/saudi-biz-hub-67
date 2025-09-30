/*
  # إنشاء جدول عروض الأسعار

  1. جداول جديدة
    - `quotes` - جدول عروض الأسعار الرئيسي
      - `id` (uuid, primary key)
      - `user_id` (uuid, مرجع للمستخدم)
      - `quote_number` (text, رقم عرض السعر)
      - `customer_id` (uuid, مرجع للعميل)
      - `quote_date` (date, تاريخ العرض)
      - `expiry_date` (date, تاريخ انتهاء الصلاحية)
      - `status` (text, الحالة: draft/sent/accepted/rejected/expired)
      - `subtotal` (numeric, المجموع الفرعي)
      - `tax_amount` (numeric, قيمة الضريبة)
      - `discount_amount` (numeric, قيمة الخصم)
      - `total_amount` (numeric, المجموع الكلي)
      - `notes` (text, ملاحظات)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `quote_items` - جدول بنود عرض السعر
      - `id` (uuid, primary key)
      - `quote_id` (uuid, مرجع لعرض السعر)
      - `product_id` (uuid, مرجع للمنتج)
      - `description` (text, الوصف)
      - `quantity` (numeric, الكمية)
      - `unit_price` (numeric, سعر الوحدة)
      - `tax_rate` (numeric, نسبة الضريبة)
      - `discount_rate` (numeric, نسبة الخصم)
      - `total` (numeric, المجموع)
      - `created_at` (timestamptz)

  2. الأمان
    - تفعيل RLS على جميع الجداول
    - سياسات للمستخدمين المصرح لهم لإدارة بياناتهم الخاصة
*/

CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  quote_number text NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  quote_date date NOT NULL DEFAULT CURRENT_DATE,
  expiry_date date,
  status text DEFAULT 'draft',
  subtotal numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  total_amount numeric NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity numeric NOT NULL,
  unit_price numeric NOT NULL,
  tax_rate numeric DEFAULT 0,
  discount_rate numeric DEFAULT 0,
  total numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quotes"
  ON quotes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own quotes"
  ON quotes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quotes"
  ON quotes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own quotes"
  ON quotes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own quote items"
  ON quote_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
      AND quotes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own quote items"
  ON quote_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
      AND quotes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own quote items"
  ON quote_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
      AND quotes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own quote items"
  ON quote_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
      AND quotes.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_product_id ON quote_items(product_id);