/*
  # إضافة عمود حد الائتمان لجدول الموردين
  
  1. التعديلات
    - إضافة عمود credit_limit إلى جدول suppliers
    - القيمة الافتراضية: 0
    - نوع البيانات: numeric
  
  2. الملاحظات
    - العمود اختياري (nullable)
    - يسمح بتحديد حد ائتماني لكل مورد
*/

-- إضافة عمود حد الائتمان
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'suppliers' AND column_name = 'credit_limit'
  ) THEN
    ALTER TABLE suppliers ADD COLUMN credit_limit numeric DEFAULT 0;
  END IF;
END $$;