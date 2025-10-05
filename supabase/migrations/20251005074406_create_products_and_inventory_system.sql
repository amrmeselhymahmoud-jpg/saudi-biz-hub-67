/*
  # إنشاء نظام المنتجات والمخزون

  1. الجداول الجديدة
    - `products` - جدول المنتجات الرئيسي
      - `id` (uuid, primary key) - معرف فريد للمنتج
      - `product_code` (text, unique) - كود المنتج الفريد
      - `product_name` (text) - اسم المنتج
      - `description` (text) - وصف تفصيلي للمنتج
      - `category` (text) - تصنيف المنتج
      - `unit` (text) - وحدة القياس (قطعة، كيلو، لتر، متر، إلخ)
      - `cost_price` (decimal) - سعر التكلفة
      - `selling_price` (decimal) - سعر البيع
      - `tax_rate` (decimal) - نسبة الضريبة المضافة
      - `min_stock_level` (integer) - الحد الأدنى للمخزون
      - `max_stock_level` (integer) - الحد الأقصى للمخزون
      - `current_stock` (integer) - المخزون الحالي
      - `reorder_point` (integer) - نقطة إعادة الطلب (عندما يجب إعادة الطلب)
      - `notes` (text) - ملاحظات إضافية
      - `status` (text) - حالة المنتج (active/inactive/discontinued)
      - `created_by` (uuid) - المستخدم الذي أنشأ المنتج
      - `created_at` (timestamptz) - تاريخ الإنشاء
      - `updated_at` (timestamptz) - تاريخ آخر تحديث

    - `inventory_transactions` - جدول حركات المخزون
      - `id` (uuid, primary key) - معرف فريد للحركة
      - `transaction_code` (text, unique) - كود الحركة الفريد
      - `product_id` (uuid) - معرف المنتج
      - `transaction_type` (text) - نوع الحركة (in: إدخال, out: إخراج, adjustment: تعديل)
      - `quantity` (integer) - الكمية
      - `unit_price` (decimal) - سعر الوحدة
      - `total_value` (decimal) - القيمة الإجمالية
      - `reference_number` (text) - رقم المرجع (رقم فاتورة مثلاً)
      - `notes` (text) - ملاحظات
      - `transaction_date` (date) - تاريخ الحركة
      - `created_by` (uuid) - المستخدم الذي أجرى الحركة
      - `created_at` (timestamptz) - تاريخ تسجيل الحركة

  2. الأمان (Row Level Security)
    - تفعيل RLS على جميع الجداول
    - سياسة SELECT: يمكن للمستخدمين المصادقين عرض جميع المنتجات
    - سياسة INSERT: يمكن للمستخدمين إضافة منتجات جديدة
    - سياسة UPDATE: يمكن للمستخدمين تعديل المنتجات التي أنشأوها فقط
    - سياسة DELETE: يمكن للمستخدمين حذف المنتجات التي أنشأوها فقط

  3. الفهارس (Indexes)
    - فهرس على product_code للبحث السريع
    - فهرس على category للتصفية حسب التصنيف
    - فهرس على status لعرض المنتجات النشطة
    - فهرس على product_id في جدول inventory_transactions
    - فهرس على transaction_date للتقارير الزمنية

  4. المحفزات (Triggers)
    - محفز لتحديث updated_at تلقائياً عند التعديل
    - محفز لتحديث المخزون تلقائياً عند إضافة حركة مخزون
*/

-- إنشاء جدول المنتجات
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code text UNIQUE NOT NULL,
  product_name text NOT NULL,
  description text,
  category text,
  unit text NOT NULL DEFAULT 'قطعة',
  cost_price decimal(15,2) NOT NULL DEFAULT 0,
  selling_price decimal(15,2) NOT NULL DEFAULT 0,
  tax_rate decimal(5,2) NOT NULL DEFAULT 15,
  min_stock_level integer NOT NULL DEFAULT 0,
  max_stock_level integer NOT NULL DEFAULT 1000,
  current_stock integer NOT NULL DEFAULT 0,
  reorder_point integer NOT NULL DEFAULT 10,
  notes text,
  status text NOT NULL DEFAULT 'active',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'discontinued')),
  CONSTRAINT positive_prices CHECK (cost_price >= 0 AND selling_price >= 0),
  CONSTRAINT valid_tax_rate CHECK (tax_rate >= 0 AND tax_rate <= 100),
  CONSTRAINT valid_stock_levels CHECK (min_stock_level >= 0 AND max_stock_level >= min_stock_level),
  CONSTRAINT valid_current_stock CHECK (current_stock >= 0)
);

-- إنشاء جدول حركات المخزون
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_code text UNIQUE NOT NULL,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  transaction_type text NOT NULL,
  quantity integer NOT NULL,
  unit_price decimal(15,2) NOT NULL DEFAULT 0,
  total_value decimal(15,2) NOT NULL DEFAULT 0,
  reference_number text,
  notes text,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_transaction_type CHECK (transaction_type IN ('in', 'out', 'adjustment')),
  CONSTRAINT non_zero_quantity CHECK (quantity != 0)
);

-- إنشاء الفهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_products_product_code ON products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_created_by ON products(created_by);
CREATE INDEX IF NOT EXISTS idx_products_current_stock ON products(current_stock);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product_id ON inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_transaction_date ON inventory_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_transaction_type ON inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created_by ON inventory_transactions(created_by);

-- تفعيل Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان لجدول products
CREATE POLICY "Users can view all products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own products"
  ON products FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own products"
  ON products FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- سياسات الأمان لجدول inventory_transactions
CREATE POLICY "Users can view all inventory transactions"
  ON inventory_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create inventory transactions"
  ON inventory_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- إنشاء محفز لتحديث updated_at تلقائياً
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- إنشاء دالة لتحديث المخزون تلقائياً بعد حركات المخزون
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transaction_type = 'in' THEN
    -- إضافة إلى المخزون
    UPDATE products 
    SET current_stock = current_stock + NEW.quantity
    WHERE id = NEW.product_id;
  ELSIF NEW.transaction_type = 'out' THEN
    -- سحب من المخزون
    UPDATE products 
    SET current_stock = current_stock - NEW.quantity
    WHERE id = NEW.product_id;
  ELSIF NEW.transaction_type = 'adjustment' THEN
    -- تعديل المخزون (تعيين قيمة جديدة)
    UPDATE products 
    SET current_stock = NEW.quantity
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء محفز لتحديث المخزون
DROP TRIGGER IF EXISTS update_stock_after_transaction ON inventory_transactions;
CREATE TRIGGER update_stock_after_transaction
  AFTER INSERT ON inventory_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock();