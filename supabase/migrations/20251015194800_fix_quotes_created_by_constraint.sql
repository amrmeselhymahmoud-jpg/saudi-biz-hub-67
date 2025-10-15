/*
  # إصلاح قيد المفتاح الأجنبي لجدول عروض الأسعار

  1. التغييرات
    - حذف القيد الأجنبي `quotes_created_by_fkey`
    - حقل `created_by` سيبقى موجوداً كحقل اختياري لكن بدون قيد أجنبي
    - هذا يسمح بإنشاء عروض أسعار بدون الحاجة لوجود profile للمستخدم
  
  2. الأمان
    - لا يؤثر على Row Level Security
    - الحقل يبقى موجوداً للاستخدام المستقبلي
*/

-- حذف القيد الأجنبي إذا كان موجوداً
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'quotes_created_by_fkey' 
    AND table_name = 'quotes'
  ) THEN
    ALTER TABLE quotes DROP CONSTRAINT quotes_created_by_fkey;
  END IF;
END $$;