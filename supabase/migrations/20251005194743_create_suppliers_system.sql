/*
  # إنشاء نظام الموردين

  ## الجداول الجديدة
  
  ### جدول suppliers (الموردين)
  - `id` (uuid, primary key)
  - `supplier_code` (text, unique) - كود المورد
  - `supplier_name` (text) - اسم المورد
  - `email` (text) - البريد الإلكتروني
  - `phone` (text) - رقم الهاتف
  - `tax_number` (text) - الرقم الضريبي
  - `address` (text) - العنوان
  - `city` (text) - المدينة
  - `country` (text) - الدولة
  - `credit_limit` (decimal) - حد الائتمان
  - `payment_terms` (integer) - شروط السداد بالأيام
  - `notes` (text) - ملاحظات
  - `status` (text) - الحالة (active, inactive)
  - `created_by` (uuid) - المستخدم المنشئ
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## الأمان
  - تفعيل RLS
  - سياسات للمستخدمين المسجلين
*/

-- إنشاء جدول الموردين
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
  credit_limit decimal(15,2) DEFAULT 0,
  payment_terms integer DEFAULT 30,
  notes text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- إنشاء الفهارس
CREATE INDEX IF NOT EXISTS idx_suppliers_supplier_code ON suppliers(supplier_code);
CREATE INDEX IF NOT EXISTS idx_suppliers_supplier_name ON suppliers(supplier_name);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_created_by ON suppliers(created_by);

-- تفعيل RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- سياسات الموردين
CREATE POLICY "Users can view all suppliers"
  ON suppliers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create suppliers"
  ON suppliers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update all suppliers"
  ON suppliers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete all suppliers"
  ON suppliers FOR DELETE
  TO authenticated
  USING (true);

-- تطبيق trigger لتحديث updated_at
DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- تطبيق trigger لتعيين created_by تلقائياً
DROP TRIGGER IF EXISTS set_suppliers_created_by ON suppliers;
CREATE TRIGGER set_suppliers_created_by
  BEFORE INSERT ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION set_created_by();

-- إضافة بيانات تجريبية
INSERT INTO suppliers (supplier_code, supplier_name, email, phone, city, payment_terms, status) VALUES
('SUP-001', 'شركة التوريدات المتقدمة', 'info@advanced-supply.sa', '+966501234567', 'الرياض', 30, 'active'),
('SUP-002', 'مؤسسة الإمداد التجاري', 'contact@emad-trading.sa', '+966507654321', 'جدة', 45, 'active'),
('SUP-003', 'شركة النجاح للتوريد', 'sales@alnajah.sa', '+966509876543', 'الدمام', 30, 'active')
ON CONFLICT (supplier_code) DO NOTHING;
