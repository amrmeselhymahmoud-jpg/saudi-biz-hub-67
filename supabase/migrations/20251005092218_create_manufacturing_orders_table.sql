/*
  # إنشاء جدول أوامر التصنيع
  
  1. الجداول الجديدة
    - `manufacturing_orders`
      - `id` (uuid, primary key)
      - `order_number` (text, unique) - رقم أمر التصنيع الفريد
      - `product_id` (uuid) - معرف المنتج المراد تصنيعه
      - `quantity` (integer) - الكمية المطلوب تصنيعها
      - `start_date` (date) - تاريخ بدء التصنيع
      - `expected_completion_date` (date) - تاريخ الانتهاء المتوقع
      - `actual_completion_date` (date, nullable) - تاريخ الانتهاء الفعلي
      - `status` (text) - حالة الأمر (pending, in_progress, completed, on_hold, cancelled)
      - `priority` (text) - الأولوية (low, medium, high, urgent)
      - `raw_materials` (jsonb) - المواد الخام المطلوبة
      - `production_cost` (numeric) - تكلفة الإنتاج
      - `notes` (text, nullable) - ملاحظات
      - `user_id` (uuid, nullable) - المستخدم الذي أنشأ الأمر
      - `created_at` (timestamptz) - تاريخ الإنشاء
      - `updated_at` (timestamptz) - تاريخ آخر تحديث
  
  2. الأمان
    - تفعيل RLS على جدول `manufacturing_orders`
    - سياسات للسماح بالقراءة والإضافة والتعديل والحذف للجميع (وضع التجربة)
*/

-- إنشاء جدول أوامر التصنيع
CREATE TABLE IF NOT EXISTS manufacturing_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  expected_completion_date date NOT NULL,
  actual_completion_date date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'on_hold', 'cancelled')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  raw_materials jsonb DEFAULT '[]'::jsonb,
  production_cost numeric DEFAULT 0 NOT NULL CHECK (production_cost >= 0),
  notes text,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- تفعيل RLS
ALTER TABLE manufacturing_orders ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة للجميع
CREATE POLICY "Allow read access to all users"
  ON manufacturing_orders
  FOR SELECT
  TO public
  USING (true);

-- سياسة الإضافة للجميع
CREATE POLICY "Allow insert access to all users"
  ON manufacturing_orders
  FOR INSERT
  TO public
  WITH CHECK (true);

-- سياسة التحديث للجميع
CREATE POLICY "Allow update access to all users"
  ON manufacturing_orders
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- سياسة الحذف للجميع
CREATE POLICY "Allow delete access to all users"
  ON manufacturing_orders
  FOR DELETE
  TO public
  USING (true);

-- إنشاء فهارس لتسريع البحث
CREATE INDEX IF NOT EXISTS idx_manufacturing_orders_order_number ON manufacturing_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_manufacturing_orders_product_id ON manufacturing_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_manufacturing_orders_status ON manufacturing_orders(status);
CREATE INDEX IF NOT EXISTS idx_manufacturing_orders_priority ON manufacturing_orders(priority);
CREATE INDEX IF NOT EXISTS idx_manufacturing_orders_start_date ON manufacturing_orders(start_date);

-- دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_manufacturing_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger لتحديث updated_at
DROP TRIGGER IF EXISTS manufacturing_orders_updated_at_trigger ON manufacturing_orders;
CREATE TRIGGER manufacturing_orders_updated_at_trigger
  BEFORE UPDATE ON manufacturing_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_manufacturing_orders_updated_at();