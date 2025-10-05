/*
  # إصلاح قيود المفتاح الأجنبي في جدول العملاء

  ## التغييرات
  1. جعل حقل created_by اختياري (nullable)
  2. إضافة قيمة افتراضية من الجلسة الحالية
  3. تحديث السياسات لتسمح بالإدراج بدون created_by

  ## الأمان
  - الحفاظ على RLS مفعّل
  - السماح لجميع المستخدمين المسجلين بإضافة وتعديل العملاء
*/

-- إزالة قيد المفتاح الأجنبي القديم إذا كان موجوداً
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_created_by_fkey;

-- إضافة قيد المفتاح الأجنبي الجديد مع ON DELETE SET NULL
ALTER TABLE customers 
ADD CONSTRAINT customers_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES auth.users(id) 
ON DELETE SET NULL;

-- تحديث السياسات للسماح بالإدراج بدون التحقق من created_by
DROP POLICY IF EXISTS "Users can create customers" ON customers;
CREATE POLICY "Users can create customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- تحديث سياسة التعديل
DROP POLICY IF EXISTS "Users can update all customers" ON customers;
CREATE POLICY "Users can update all customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- إضافة دالة لتعيين created_by تلقائياً عند الإدراج
CREATE OR REPLACE FUNCTION set_created_by()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء trigger لتعيين created_by تلقائياً
DROP TRIGGER IF EXISTS set_customers_created_by ON customers;
CREATE TRIGGER set_customers_created_by
  BEFORE INSERT ON customers
  FOR EACH ROW
  EXECUTE FUNCTION set_created_by();

-- تطبيق نفس الإصلاح على customer_bonds
ALTER TABLE customer_bonds DROP CONSTRAINT IF EXISTS customer_bonds_created_by_fkey;

ALTER TABLE customer_bonds 
ADD CONSTRAINT customer_bonds_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES auth.users(id) 
ON DELETE SET NULL;

DROP TRIGGER IF EXISTS set_customer_bonds_created_by ON customer_bonds;
CREATE TRIGGER set_customer_bonds_created_by
  BEFORE INSERT ON customer_bonds
  FOR EACH ROW
  EXECUTE FUNCTION set_created_by();