/*
  # Create Invoices System

  1. New Tables
    - `sales_invoices`
      - `id` (uuid, primary key)
      - `invoice_number` (text, unique) - رقم الفاتورة
      - `customer_id` (uuid, foreign key) - العميل
      - `invoice_date` (date) - تاريخ الفاتورة
      - `due_date` (date) - تاريخ الاستحقاق
      - `subtotal` (decimal) - المجموع قبل الضريبة
      - `tax_amount` (decimal) - قيمة الضريبة
      - `discount` (decimal) - الخصم
      - `total_amount` (decimal) - الإجمالي
      - `paid_amount` (decimal) - المدفوع
      - `remaining_amount` (decimal) - المتبقي
      - `payment_status` (text) - حالة الدفع
      - `notes` (text) - ملاحظات
      - `status` (text) - الحالة
      - `created_by` (uuid)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `sales_invoice_items`
      - `id` (uuid, primary key)
      - `invoice_id` (uuid, foreign key) - الفاتورة
      - `product_id` (uuid, foreign key) - المنتج
      - `quantity` (integer) - الكمية
      - `unit_price` (decimal) - سعر الوحدة
      - `tax_rate` (decimal) - نسبة الضريبة
      - `tax_amount` (decimal) - قيمة الضريبة
      - `discount` (decimal) - الخصم
      - `total` (decimal) - الإجمالي

    - `purchase_invoices`
      - Similar structure to sales_invoices but with supplier_id

    - `purchase_invoice_items`
      - Similar structure to sales_invoice_items

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create sales_invoices table
CREATE TABLE IF NOT EXISTS sales_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE RESTRICT NOT NULL,
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  subtotal decimal(15,2) DEFAULT 0,
  tax_amount decimal(15,2) DEFAULT 0,
  discount decimal(15,2) DEFAULT 0,
  total_amount decimal(15,2) DEFAULT 0,
  paid_amount decimal(15,2) DEFAULT 0,
  remaining_amount decimal(15,2) DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'unpaid', 'partial')),
  notes text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'cancelled')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sales_invoice_items table
CREATE TABLE IF NOT EXISTS sales_invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES sales_invoices(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE RESTRICT NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price decimal(15,2) NOT NULL,
  tax_rate decimal(5,2) DEFAULT 15,
  tax_amount decimal(15,2) DEFAULT 0,
  discount decimal(15,2) DEFAULT 0,
  total decimal(15,2) DEFAULT 0
);

-- Create purchase_invoices table
CREATE TABLE IF NOT EXISTS purchase_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE RESTRICT NOT NULL,
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  subtotal decimal(15,2) DEFAULT 0,
  tax_amount decimal(15,2) DEFAULT 0,
  discount decimal(15,2) DEFAULT 0,
  total_amount decimal(15,2) DEFAULT 0,
  paid_amount decimal(15,2) DEFAULT 0,
  remaining_amount decimal(15,2) DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'unpaid', 'partial')),
  notes text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'cancelled')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create purchase_invoice_items table
CREATE TABLE IF NOT EXISTS purchase_invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES purchase_invoices(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE RESTRICT NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price decimal(15,2) NOT NULL,
  tax_rate decimal(5,2) DEFAULT 15,
  tax_amount decimal(15,2) DEFAULT 0,
  discount decimal(15,2) DEFAULT 0,
  total decimal(15,2) DEFAULT 0
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer_id ON sales_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_invoice_date ON sales_invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_status ON sales_invoices(status);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_items_invoice_id ON sales_invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_supplier_id ON purchase_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_invoice_date ON purchase_invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_status ON purchase_invoices(status);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_items_invoice_id ON purchase_invoice_items(invoice_id);

-- Enable RLS
ALTER TABLE sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoice_items ENABLE ROW LEVEL SECURITY;

-- Policies for sales_invoices
CREATE POLICY "Users can view sales invoices"
  ON sales_invoices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create sales invoices"
  ON sales_invoices FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update sales invoices"
  ON sales_invoices FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete draft sales invoices"
  ON sales_invoices FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by AND status = 'draft');

-- Policies for sales_invoice_items
CREATE POLICY "Users can view sales invoice items"
  ON sales_invoice_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create sales invoice items"
  ON sales_invoice_items FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM sales_invoices 
    WHERE id = invoice_id AND created_by = auth.uid()
  ));

CREATE POLICY "Users can update sales invoice items"
  ON sales_invoice_items FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sales_invoices 
    WHERE id = invoice_id AND created_by = auth.uid()
  ));

CREATE POLICY "Users can delete sales invoice items"
  ON sales_invoice_items FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sales_invoices 
    WHERE id = invoice_id AND created_by = auth.uid()
  ));

-- Policies for purchase_invoices
CREATE POLICY "Users can view purchase invoices"
  ON purchase_invoices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create purchase invoices"
  ON purchase_invoices FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update purchase invoices"
  ON purchase_invoices FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete draft purchase invoices"
  ON purchase_invoices FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by AND status = 'draft');

-- Policies for purchase_invoice_items
CREATE POLICY "Users can view purchase invoice items"
  ON purchase_invoice_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create purchase invoice items"
  ON purchase_invoice_items FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM purchase_invoices 
    WHERE id = invoice_id AND created_by = auth.uid()
  ));

CREATE POLICY "Users can update purchase invoice items"
  ON purchase_invoice_items FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM purchase_invoices 
    WHERE id = invoice_id AND created_by = auth.uid()
  ));

CREATE POLICY "Users can delete purchase invoice items"
  ON purchase_invoice_items FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM purchase_invoices 
    WHERE id = invoice_id AND created_by = auth.uid()
  ));

-- Create triggers
DROP TRIGGER IF EXISTS update_sales_invoices_updated_at ON sales_invoices;
CREATE TRIGGER update_sales_invoices_updated_at
  BEFORE UPDATE ON sales_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_purchase_invoices_updated_at ON purchase_invoices;
CREATE TRIGGER update_purchase_invoices_updated_at
  BEFORE UPDATE ON purchase_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();