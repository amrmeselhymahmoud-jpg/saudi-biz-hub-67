/*
  # نظام عروض الأسعار والفواتير
  
  ## الجداول:
  1. quotes: عروض الأسعار
  2. quote_items: بنود عروض الأسعار
  3. sales_invoices: فواتير المبيعات
  4. sales_invoice_items: بنود فواتير المبيعات
  5. purchase_invoices: فواتير المشتريات
  6. purchase_invoice_items: بنود فواتير المشتريات
  
  ## الأمان:
  - RLS مفعل على جميع الجداول
*/

-- ==========================================
-- 1. عروض الأسعار (Quotes)
-- ==========================================

CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE RESTRICT,
  quote_date date NOT NULL DEFAULT CURRENT_DATE,
  expiry_date date,
  subtotal numeric(15,2) DEFAULT 0 NOT NULL,
  tax_amount numeric(15,2) DEFAULT 0 NOT NULL,
  discount_amount numeric(15,2) DEFAULT 0 NOT NULL,
  total_amount numeric(15,2) DEFAULT 0 NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quotes_number ON quotes(quote_number);
CREATE INDEX IF NOT EXISTS idx_quotes_customer ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_date ON quotes(quote_date DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);

CREATE TRIGGER set_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read quotes"
  ON quotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert quotes"
  ON quotes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update quotes"
  ON quotes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete quotes"
  ON quotes FOR DELETE TO authenticated USING (true);

-- ==========================================
-- 2. بنود عروض الأسعار (Quote Items)
-- ==========================================

CREATE TABLE IF NOT EXISTS quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE RESTRICT,
  description text NOT NULL,
  quantity numeric(15,3) NOT NULL CHECK (quantity > 0),
  unit_price numeric(15,2) NOT NULL,
  tax_rate numeric(5,2) DEFAULT 15,
  tax_amount numeric(15,2) DEFAULT 0,
  discount numeric(15,2) DEFAULT 0,
  total numeric(15,2) NOT NULL,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quote_items_quote ON quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_product ON quote_items(product_id);

ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read quote items"
  ON quote_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert quote items"
  ON quote_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update quote items"
  ON quote_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete quote items"
  ON quote_items FOR DELETE TO authenticated USING (true);

-- ==========================================
-- 3. فواتير المبيعات (Sales Invoices)
-- ==========================================

CREATE TABLE IF NOT EXISTS sales_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  subtotal numeric(15,2) DEFAULT 0 NOT NULL,
  tax_amount numeric(15,2) DEFAULT 0 NOT NULL,
  discount numeric(15,2) DEFAULT 0 NOT NULL,
  total_amount numeric(15,2) DEFAULT 0 NOT NULL,
  paid_amount numeric(15,2) DEFAULT 0 NOT NULL,
  remaining_amount numeric(15,2) DEFAULT 0 NOT NULL,
  payment_status text DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'partial', 'unpaid', 'overdue')),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'cancelled')),
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sales_invoices_number ON sales_invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer ON sales_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_date ON sales_invoices(invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_payment_status ON sales_invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_status ON sales_invoices(status);

CREATE TRIGGER set_sales_invoices_updated_at
  BEFORE UPDATE ON sales_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE sales_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read sales invoices"
  ON sales_invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert sales invoices"
  ON sales_invoices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update sales invoices"
  ON sales_invoices FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete sales invoices"
  ON sales_invoices FOR DELETE TO authenticated USING (true);

-- ==========================================
-- 4. بنود فواتير المبيعات (Sales Invoice Items)
-- ==========================================

CREATE TABLE IF NOT EXISTS sales_invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  description text,
  quantity numeric(15,3) NOT NULL CHECK (quantity > 0),
  unit_price numeric(15,2) NOT NULL,
  tax_rate numeric(5,2) DEFAULT 15,
  tax_amount numeric(15,2) DEFAULT 0,
  discount numeric(15,2) DEFAULT 0,
  total numeric(15,2) NOT NULL,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sales_invoice_items_invoice ON sales_invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_items_product ON sales_invoice_items(product_id);

ALTER TABLE sales_invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read sales invoice items"
  ON sales_invoice_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert sales invoice items"
  ON sales_invoice_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update sales invoice items"
  ON sales_invoice_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete sales invoice items"
  ON sales_invoice_items FOR DELETE TO authenticated USING (true);

-- ==========================================
-- 5. فواتير المشتريات (Purchase Invoices)
-- ==========================================

CREATE TABLE IF NOT EXISTS purchase_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  subtotal numeric(15,2) DEFAULT 0 NOT NULL,
  tax_amount numeric(15,2) DEFAULT 0 NOT NULL,
  discount numeric(15,2) DEFAULT 0 NOT NULL,
  total_amount numeric(15,2) DEFAULT 0 NOT NULL,
  paid_amount numeric(15,2) DEFAULT 0 NOT NULL,
  remaining_amount numeric(15,2) DEFAULT 0 NOT NULL,
  payment_status text DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'partial', 'unpaid', 'overdue')),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'cancelled')),
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_purchase_invoices_number ON purchase_invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_supplier ON purchase_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_date ON purchase_invoices(invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_payment_status ON purchase_invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_status ON purchase_invoices(status);

CREATE TRIGGER set_purchase_invoices_updated_at
  BEFORE UPDATE ON purchase_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE purchase_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read purchase invoices"
  ON purchase_invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert purchase invoices"
  ON purchase_invoices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update purchase invoices"
  ON purchase_invoices FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete purchase invoices"
  ON purchase_invoices FOR DELETE TO authenticated USING (true);

-- ==========================================
-- 6. بنود فواتير المشتريات (Purchase Invoice Items)
-- ==========================================

CREATE TABLE IF NOT EXISTS purchase_invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  description text,
  quantity numeric(15,3) NOT NULL CHECK (quantity > 0),
  unit_price numeric(15,2) NOT NULL,
  tax_rate numeric(5,2) DEFAULT 15,
  tax_amount numeric(15,2) DEFAULT 0,
  discount numeric(15,2) DEFAULT 0,
  total numeric(15,2) NOT NULL,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_purchase_invoice_items_invoice ON purchase_invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_items_product ON purchase_invoice_items(product_id);

ALTER TABLE purchase_invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read purchase invoice items"
  ON purchase_invoice_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert purchase invoice items"
  ON purchase_invoice_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update purchase invoice items"
  ON purchase_invoice_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete purchase invoice items"
  ON purchase_invoice_items FOR DELETE TO authenticated USING (true);
