/*
  # إضافة حقل الوصف لجدول بنود عروض الأسعار

  1. التغييرات
    - إضافة حقل `description` نصي لوصف البند
    - إضافة حقل `discount_rate` لنسبة الخصم
    - جعل حقل `product_id` اختيارياً تماماً (nullable بدون قيد)
    - حذف القيد الأجنبي على product_id
  
  2. السبب
    - عروض الأسعار قد تحتوي على بنود مخصصة بدون ربطها بمنتج موجود
    - الوصف يسمح بإدخال نص حر لوصف الخدمة أو المنتج
*/

-- حذف القيد الأجنبي على product_id إذا كان موجوداً
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'quote_items_product_id_fkey' 
    AND table_name = 'quote_items'
  ) THEN
    ALTER TABLE quote_items DROP CONSTRAINT quote_items_product_id_fkey;
  END IF;
END $$;

-- إضافة حقل description إذا لم يكن موجوداً
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quote_items' AND column_name = 'description'
  ) THEN
    ALTER TABLE quote_items ADD COLUMN description TEXT;
  END IF;
END $$;

-- إضافة حقل discount_rate إذا لم يكن موجوداً
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quote_items' AND column_name = 'discount_rate'
  ) THEN
    ALTER TABLE quote_items ADD COLUMN discount_rate NUMERIC DEFAULT 0;
  END IF;
END $$;