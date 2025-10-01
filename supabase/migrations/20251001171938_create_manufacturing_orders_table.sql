/*
  # إنشاء جدول أوامر التصنيع

  1. جدول جديد
    - `manufacturing_orders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, مرجع للمستخدم)
      - `order_number` (text, رقم الأمر الفريد - مطلوب)
      - `product_id` (uuid, مرجع للمنتج - مطلوب)
      - `quantity` (numeric, الكمية المطلوب تصنيعها - مطلوب)
      - `start_date` (date, تاريخ البدء - مطلوب)
      - `expected_completion_date` (date, تاريخ الانتهاء المتوقع - مطلوب)
      - `actual_completion_date` (date, تاريخ الانتهاء الفعلي)
      - `status` (text, حالة الأمر - افتراضي pending)
      - `priority` (text, أولوية الأمر - افتراضي medium)
      - `raw_materials` (jsonb, قائمة المواد الخام المستخدمة)
      - `production_cost` (numeric, تكلفة الإنتاج - افتراضي 0)
      - `notes` (text, ملاحظات)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. الأمان
    - تفعيل RLS على جدول `manufacturing_orders`
    - سياسات للمستخدمين المصادقين لإدارة أوامر التصنيع الخاصة بهم
*/

CREATE TABLE IF NOT EXISTS manufacturing_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  order_number text NOT NULL UNIQUE,
  product_id uuid REFERENCES products(id) NOT NULL,
  quantity numeric NOT NULL CHECK (quantity > 0),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  expected_completion_date date NOT NULL,
  actual_completion_date date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'on_hold')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  raw_materials jsonb DEFAULT '[]'::jsonb,
  production_cost numeric DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE manufacturing_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own manufacturing orders"
  ON manufacturing_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own manufacturing orders"
  ON manufacturing_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own manufacturing orders"
  ON manufacturing_orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own manufacturing orders"
  ON manufacturing_orders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_manufacturing_orders_user_id ON manufacturing_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_manufacturing_orders_product_id ON manufacturing_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_manufacturing_orders_status ON manufacturing_orders(status);
CREATE INDEX IF NOT EXISTS idx_manufacturing_orders_order_number ON manufacturing_orders(order_number);
