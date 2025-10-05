/*
  # تحديث سياسات الأمان لجدول المنتجات لدعم وضع Demo

  1. التغييرات
    - إزالة القيود على created_by للسماح بالعمل في وضع Demo
    - السماح للجميع بقراءة وكتابة المنتجات (للتطوير والعرض التوضيحي)

  2. ملاحظة أمنية
    - هذه السياسات مناسبة لوضع Demo والتطوير
    - في الإنتاج، يجب استخدام سياسات أكثر صرامة
*/

-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Users can view all products" ON products;
DROP POLICY IF EXISTS "Users can create products" ON products;
DROP POLICY IF EXISTS "Users can update own products" ON products;
DROP POLICY IF EXISTS "Users can delete own products" ON products;

-- إنشاء سياسات جديدة للسماح بالوصول الكامل (Demo Mode)
CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create products"
  ON products FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update products"
  ON products FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete products"
  ON products FOR DELETE
  TO public
  USING (true);

-- تحديث سياسات inventory_transactions أيضاً
DROP POLICY IF EXISTS "Users can view all inventory transactions" ON inventory_transactions;
DROP POLICY IF EXISTS "Users can create inventory transactions" ON inventory_transactions;

CREATE POLICY "Anyone can view inventory transactions"
  ON inventory_transactions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create inventory transactions"
  ON inventory_transactions FOR INSERT
  TO public
  WITH CHECK (true);