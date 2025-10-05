/*
  # إنشاء نظام فواتير المشتريات الكامل

  ## الجداول الجديدة
  
  ### 1. جدول purchase_invoices (فواتير المشتريات)
  - `id` (uuid, primary key)
  - `invoice_number` (text, unique) - رقم الفاتورة
  - `supplier_id` (uuid) - المورد
  - `purchase_order_id` (uuid) - أمر الشراء (اختياري)
  - `invoice_date` (date) - تاريخ الفاتورة
  - `due_date` (date) - تاريخ الاستحقاق
  - `status` (text) - الحالة (draft, pending, paid, overdue, cancelled)
  - `payment_status` (text) - حالة الدفع (unpaid, partial, paid)
  - `subtotal` (decimal) - المجموع الفرعي
  - `tax_amount` (decimal) - مبلغ الضريبة
  - `discount_amount` (decimal) - مبلغ الخصم
  - `total_amount` (decimal) - المجموع الإجمالي
  - `paid_amount` (decimal) - المبلغ المدفوع
  - `notes` (text) - ملاحظات
  - `created_by` (uuid) - المستخدم المنشئ
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. جدول purchase_invoice_items (بنود فواتير المشتريات)
  - `id` (uuid, primary key)
  - `invoice_id` (uuid) - الفاتورة
  - `product_name` (text) - اسم المنتج
  - `description` (text) - وصف إضافي
  - `quantity` (decimal) - الكمية
  - `unit_price` (decimal) - سعر الوحدة
  - `tax_rate` (decimal) - نسبة الضريبة
  - `tax_amount` (decimal) - مبلغ الضريبة
  - `discount_rate` (decimal) - نسبة الخصم
  - `discount_amount` (decimal) - مبلغ الخصم
  - `total` (decimal) - المجموع
  - `created_at` (timestamptz)

  ## الأمان
  - تفعيل RLS على جميع الجداول
  - سياسات للمستخدمين المسجلين
*/

-- إنشاء جدول فواتير المشتريات
CREATE TABLE IF NOT EXISTS purchase_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  purchase_order_id uuid,
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'cancelled')),
  payment_status text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
  subtotal decimal(15,2) NOT NULL DEFAULT 0,
  tax_amount decimal(15,2) NOT NULL DEFAULT 0,
  discount_amount decimal(15,2) NOT NULL DEFAULT 0,
  total_amount decimal(15,2) NOT NULL DEFAULT 0,
  paid_amount decimal(15,2) NOT NULL DEFAULT 0,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- إنشاء جدول بنود فواتير المشتريات
CREATE TABLE IF NOT EXISTS purchase_invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  description text,
  quantity decimal(10,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price decimal(15,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  tax_rate decimal(5,2) NOT NULL DEFAULT 15 CHECK (tax_rate >= 0 AND tax_rate <= 100),
  tax_amount decimal(15,2) NOT NULL DEFAULT 0,
  discount_rate decimal(5,2) DEFAULT 0 CHECK (discount_rate >= 0 AND discount_rate <= 100),
  discount_amount decimal(15,2) DEFAULT 0,
  total decimal(15,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- إنشاء الفهارس
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_invoice_number ON purchase_invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_supplier_id ON purchase_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_invoice_date ON purchase_invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_status ON purchase_invoices(status);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_payment_status ON purchase_invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_created_by ON purchase_invoices(created_by);

CREATE INDEX IF NOT EXISTS idx_purchase_invoice_items_invoice_id ON purchase_invoice_items(invoice_id);

-- تفعيل RLS على جدول فواتير المشتريات
ALTER TABLE purchase_invoices ENABLE ROW LEVEL SECURITY;

-- سياسات فواتير المشتريات
CREATE POLICY "Users can view all purchase invoices"
  ON purchase_invoices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create purchase invoices"
  ON purchase_invoices FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update all purchase invoices"
  ON purchase_invoices FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete all purchase invoices"
  ON purchase_invoices FOR DELETE
  TO authenticated
  USING (true);

-- تفعيل RLS على جدول بنود فواتير المشتريات
ALTER TABLE purchase_invoice_items ENABLE ROW LEVEL SECURITY;

-- سياسات بنود فواتير المشتريات
CREATE POLICY "Users can view all purchase invoice items"
  ON purchase_invoice_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create purchase invoice items"
  ON purchase_invoice_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update all purchase invoice items"
  ON purchase_invoice_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete all purchase invoice items"
  ON purchase_invoice_items FOR DELETE
  TO authenticated
  USING (true);

-- تطبيق trigger لتحديث updated_at
DROP TRIGGER IF EXISTS update_purchase_invoices_updated_at ON purchase_invoices;
CREATE TRIGGER update_purchase_invoices_updated_at
  BEFORE UPDATE ON purchase_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- تطبيق trigger لتعيين created_by تلقائياً
DROP TRIGGER IF EXISTS set_purchase_invoices_created_by ON purchase_invoices;
CREATE TRIGGER set_purchase_invoices_created_by
  BEFORE INSERT ON purchase_invoices
  FOR EACH ROW
  EXECUTE FUNCTION set_created_by();
