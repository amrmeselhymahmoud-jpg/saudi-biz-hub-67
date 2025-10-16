/*
  # إنشاء نظام المنتجات والموردين

  ## الجداول الجديدة
  
  ### جدول `products` - المنتجات
  - معلومات المنتج الكاملة مع المخزون
  
  ### جدول `suppliers` - الموردين
  - معلومات الموردين
  
  ### جدول `inventory_transactions` - حركات المخزون
  - تتبع حركات المخزون

  ## الأمان
  - RLS مفعّل على جميع الجداول
  - السماح للمستخدمين المصادقين بالقراءة والكتابة
*/

-- جدول المنتجات
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
  CONSTRAINT valid_tax_rate CHECK (tax_rate >= 0 AND tax_rate <= 100)
);

-- جدول الموردين
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_code text UNIQUE NOT NULL,
  supplier_name text NOT NULL,
  email text,
  phone text,
  tax_number text,
  address text,
  city text,
  country text DEFAULT 'السعودية',
  payment_terms integer DEFAULT 30,
  notes text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- جدول حركات المخزون
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_code text UNIQUE NOT NULL,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  transaction_type text NOT NULL CHECK (transaction_type IN ('in', 'out', 'adjustment')),
  quantity integer NOT NULL CHECK (quantity != 0),
  unit_price decimal(15,2) NOT NULL DEFAULT 0,
  total_value decimal(15,2) NOT NULL DEFAULT 0,
  reference_number text,
  notes text,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- الفهارس
CREATE INDEX IF NOT EXISTS idx_products_product_code ON products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_supplier_code ON suppliers(supplier_code);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product_id ON inventory_transactions(product_id);

-- RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- سياسات products
CREATE POLICY "Users can view all products"
  ON products FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create products"
  ON products FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update products"
  ON products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can delete products"
  ON products FOR DELETE TO authenticated USING (true);

-- سياسات suppliers
CREATE POLICY "Users can view all suppliers"
  ON suppliers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create suppliers"
  ON suppliers FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update suppliers"
  ON suppliers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can delete suppliers"
  ON suppliers FOR DELETE TO authenticated USING (true);

-- سياسات inventory_transactions
CREATE POLICY "Users can view inventory transactions"
  ON inventory_transactions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create inventory transactions"
  ON inventory_transactions FOR INSERT TO authenticated WITH CHECK (true);

-- Triggers
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();