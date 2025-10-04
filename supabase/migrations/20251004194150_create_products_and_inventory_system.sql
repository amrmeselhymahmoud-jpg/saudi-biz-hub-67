/*
  # Create Products and Inventory System

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `product_code` (text, unique) - كود المنتج
      - `product_name` (text) - اسم المنتج
      - `description` (text) - وصف المنتج
      - `category` (text) - التصنيف
      - `unit` (text) - الوحدة
      - `cost_price` (decimal) - سعر التكلفة
      - `selling_price` (decimal) - سعر البيع
      - `tax_rate` (decimal) - نسبة الضريبة
      - `min_stock_level` (integer) - الحد الأدنى للمخزون
      - `max_stock_level` (integer) - الحد الأقصى للمخزون
      - `current_stock` (integer) - المخزون الحالي
      - `reorder_point` (integer) - نقطة إعادة الطلب
      - `notes` (text) - ملاحظات
      - `status` (text) - الحالة
      - `created_by` (uuid) - المستخدم المنشئ
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `inventory_transactions`
      - `id` (uuid, primary key)
      - `transaction_code` (text, unique) - كود الحركة
      - `product_id` (uuid, foreign key) - المنتج
      - `transaction_type` (text) - نوع الحركة (in/out/adjustment)
      - `quantity` (integer) - الكمية
      - `unit_price` (decimal) - سعر الوحدة
      - `total_value` (decimal) - القيمة الإجمالية
      - `reference_number` (text) - رقم المرجع
      - `notes` (text) - ملاحظات
      - `transaction_date` (date) - تاريخ الحركة
      - `created_by` (uuid) - المستخدم المنشئ
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code text UNIQUE NOT NULL,
  product_name text NOT NULL,
  description text,
  category text,
  unit text NOT NULL DEFAULT 'قطعة',
  cost_price decimal(15,2) DEFAULT 0,
  selling_price decimal(15,2) DEFAULT 0,
  tax_rate decimal(5,2) DEFAULT 15,
  min_stock_level integer DEFAULT 0,
  max_stock_level integer DEFAULT 1000,
  current_stock integer DEFAULT 0,
  reorder_point integer DEFAULT 10,
  notes text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create inventory_transactions table
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_code text UNIQUE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE RESTRICT NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('in', 'out', 'adjustment')),
  quantity integer NOT NULL,
  unit_price decimal(15,2) DEFAULT 0,
  total_value decimal(15,2) DEFAULT 0,
  reference_number text,
  notes text,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_product_code ON products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product_id ON inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_transaction_date ON inventory_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_transaction_type ON inventory_transactions(transaction_type);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for products
CREATE POLICY "Users can view products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Policies for inventory_transactions
CREATE POLICY "Users can view inventory transactions"
  ON inventory_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create inventory transactions"
  ON inventory_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Create triggers
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to update product stock after transaction
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transaction_type = 'in' THEN
    UPDATE products 
    SET current_stock = current_stock + NEW.quantity
    WHERE id = NEW.product_id;
  ELSIF NEW.transaction_type = 'out' THEN
    UPDATE products 
    SET current_stock = current_stock - NEW.quantity
    WHERE id = NEW.product_id;
  ELSIF NEW.transaction_type = 'adjustment' THEN
    UPDATE products 
    SET current_stock = NEW.quantity
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stock updates
DROP TRIGGER IF EXISTS update_stock_after_transaction ON inventory_transactions;
CREATE TRIGGER update_stock_after_transaction
  AFTER INSERT ON inventory_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock();