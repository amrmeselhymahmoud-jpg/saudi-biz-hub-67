/*
  # إنشاء نظام عروض الأسعار والفواتير

  ## الجداول الجديدة
  
  ### جدول `quotes` - عروض الأسعار
  - معلومات عروض الأسعار
  
  ### جدول `quote_items` - بنود عروض الأسعار
  - بنود كل عرض سعر
  
  ### جدول `sales_invoices` - فواتير المبيعات
  - فواتير البيع
  
  ### جدول `sales_invoice_items` - بنود فواتير المبيعات
  - بنود الفواتير

  ## الأمان
  - RLS مفعّل على جميع الجداول
*/

-- جدول عروض الأسعار
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
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- جدول بنود عروض الأسعار
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

-- جدول فواتير المبيعات
CREATE TABLE IF NOT EXISTS sales_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  payment_method text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  subtotal decimal(15,2) NOT NULL DEFAULT 0,
  tax_amount decimal(15,2) NOT NULL DEFAULT 0,
  discount_amount decimal(15,2) NOT NULL DEFAULT 0,
  total_amount decimal(15,2) NOT NULL DEFAULT 0,
  paid_amount decimal(15,2) NOT NULL DEFAULT 0,
  notes text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- جدول بنود فواتير المبيعات
CREATE TABLE IF NOT EXISTS sales_invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity decimal(10,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price decimal(15,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  tax_rate decimal(5,2) NOT NULL DEFAULT 15 CHECK (tax_rate >= 0 AND tax_rate <= 100),
  discount_rate decimal(5,2) NOT NULL DEFAULT 0 CHECK (discount_rate >= 0 AND discount_rate <= 100),
  total decimal(15,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- الفهارس
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer_id ON sales_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_status ON sales_invoices(status);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_items_invoice_id ON sales_invoice_items(invoice_id);

-- RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_invoice_items ENABLE ROW LEVEL SECURITY;

-- سياسات quotes
CREATE POLICY "Users can view all quotes"
  ON quotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create quotes"
  ON quotes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update quotes"
  ON quotes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can delete quotes"
  ON quotes FOR DELETE TO authenticated USING (true);

-- سياسات quote_items
CREATE POLICY "Users can view quote items"
  ON quote_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create quote items"
  ON quote_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update quote items"
  ON quote_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can delete quote items"
  ON quote_items FOR DELETE TO authenticated USING (true);

-- سياسات sales_invoices
CREATE POLICY "Users can view all invoices"
  ON sales_invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create invoices"
  ON sales_invoices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update invoices"
  ON sales_invoices FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can delete invoices"
  ON sales_invoices FOR DELETE TO authenticated USING (true);

-- سياسات sales_invoice_items
CREATE POLICY "Users can view invoice items"
  ON sales_invoice_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create invoice items"
  ON sales_invoice_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update invoice items"
  ON sales_invoice_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can delete invoice items"
  ON sales_invoice_items FOR DELETE TO authenticated USING (true);

-- Triggers
DROP TRIGGER IF EXISTS update_quotes_updated_at ON quotes;
CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sales_invoices_updated_at ON sales_invoices;
CREATE TRIGGER update_sales_invoices_updated_at
  BEFORE UPDATE ON sales_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();