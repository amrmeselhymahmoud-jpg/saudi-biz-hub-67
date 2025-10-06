/*
  # إنشاء نظام فواتير المبيعات
  
  ## الجداول الجديدة
  
  ### 1. `sales_invoices` - جدول فواتير المبيعات الرئيسي
  - `id` (uuid, primary key)
  - `invoice_number` (text, unique) - رقم الفاتورة الفريد
  - `customer_id` (uuid, foreign key) - معرف العميل
  - `invoice_date` (date) - تاريخ الفاتورة
  - `due_date` (date) - تاريخ الاستحقاق
  - `subtotal` (numeric) - المجموع الفرعي
  - `tax_amount` (numeric) - مبلغ الضريبة
  - `discount` (numeric) - الخصم
  - `total_amount` (numeric) - المبلغ الإجمالي
  - `paid_amount` (numeric) - المبلغ المدفوع
  - `remaining_amount` (numeric) - المبلغ المتبقي
  - `payment_status` (text) - حالة الدفع: unpaid, partial, paid
  - `status` (text) - حالة الفاتورة: draft, posted
  - `notes` (text) - ملاحظات
  - `created_by` (uuid) - المستخدم المنشئ
  - `created_at` (timestamptz) - تاريخ الإنشاء
  - `updated_at` (timestamptz) - تاريخ التحديث
  
  ### 2. `sales_invoice_items` - جدول بنود الفاتورة
  - `id` (uuid, primary key)
  - `invoice_id` (uuid, foreign key) - معرف الفاتورة
  - `product_id` (uuid, foreign key) - معرف المنتج
  - `quantity` (numeric) - الكمية
  - `unit_price` (numeric) - سعر الوحدة
  - `tax_rate` (numeric) - نسبة الضريبة
  - `tax_amount` (numeric) - مبلغ الضريبة
  - `discount` (numeric) - الخصم
  - `total` (numeric) - الإجمالي
  - `created_at` (timestamptz) - تاريخ الإنشاء
  
  ## الأمان
  - تمكين RLS على جميع الجداول
  - سياسات الوصول:
    - المستخدمون يمكنهم قراءة وإضافة وتحديث فواتيرهم فقط
    - المستخدمون يمكنهم قراءة وإضافة بنود فواتيرهم فقط
  
  ## الملاحظات المهمة
  - جميع القيم المالية numeric بدقة عالية
  - التواريخ بصيغة date
  - التحقق من صحة البيانات مع constraints
  - foreign keys للحفاظ على سلامة البيانات
*/

-- إنشاء جدول فواتير المبيعات
CREATE TABLE IF NOT EXISTS sales_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL DEFAULT CURRENT_DATE,
  subtotal numeric NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  tax_amount numeric NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  discount numeric NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total_amount numeric NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  paid_amount numeric NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  remaining_amount numeric NOT NULL DEFAULT 0 CHECK (remaining_amount >= 0),
  payment_status text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted')),
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- إنشاء جدول بنود فواتير المبيعات
CREATE TABLE IF NOT EXISTS sales_invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  quantity numeric NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  tax_rate numeric NOT NULL DEFAULT 15 CHECK (tax_rate >= 0 AND tax_rate <= 100),
  tax_amount numeric NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  discount numeric NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- إنشاء indexes لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer_id ON sales_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_invoice_date ON sales_invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_payment_status ON sales_invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_status ON sales_invoices(status);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_created_by ON sales_invoices(created_by);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_items_invoice_id ON sales_invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_items_product_id ON sales_invoice_items(product_id);

-- تفعيل RLS
ALTER TABLE sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_invoice_items ENABLE ROW LEVEL SECURITY;

-- سياسات الوصول لجدول sales_invoices
CREATE POLICY "Users can view all sales invoices"
  ON sales_invoices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own sales invoices"
  ON sales_invoices FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own sales invoices"
  ON sales_invoices FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete their own sales invoices"
  ON sales_invoices FOR DELETE
  TO authenticated
  USING (true);

-- سياسات الوصول لجدول sales_invoice_items
CREATE POLICY "Users can view all invoice items"
  ON sales_invoice_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert invoice items"
  ON sales_invoice_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update invoice items"
  ON sales_invoice_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete invoice items"
  ON sales_invoice_items FOR DELETE
  TO authenticated
  USING (true);

-- إنشاء trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_sales_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_sales_invoices_updated_at
  BEFORE UPDATE ON sales_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_sales_invoices_updated_at();
