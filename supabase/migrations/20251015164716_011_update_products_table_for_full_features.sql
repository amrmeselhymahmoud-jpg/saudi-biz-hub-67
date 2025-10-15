/*
  # تحديث جدول المنتجات لإضافة ميزات التكاليف الكاملة

  ## التحديثات
  
  ### إضافة حقول جديدة لجدول products
  - `max_stock_level` (numeric) - الحد الأقصى للمخزون
  - `reorder_point` (numeric) - نقطة إعادة الطلب
  - `shipping_cost` (numeric) - تكلفة الشحن
  - `additional_costs` (numeric) - تكاليف إضافية
  - `total_cost` (numeric) - إجمالي التكلفة (محسوبة)
  - `profit_margin` (numeric) - هامش الربح (محسوبة)
  - `suggested_selling_price` (numeric) - سعر البيع المقترح (محسوبة)
  - `category` (text) - التصنيف كنص بسيط بدلاً من category_id

  ## الفوائد
  - إدارة كاملة للمخزون مع حدود عليا وسفلى
  - حساب دقيق للتكاليف الإجمالية
  - اقتراح تلقائي لأسعار البيع
  - حساب هامش الربح
*/

-- إضافة الحقول المفقودة إلى جدول products
DO $$ 
BEGIN
  -- إضافة max_stock_level إذا لم يكن موجوداً
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'max_stock_level'
  ) THEN
    ALTER TABLE products ADD COLUMN max_stock_level numeric DEFAULT 1000;
  END IF;

  -- إضافة reorder_point إذا لم يكن موجوداً
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'reorder_point'
  ) THEN
    ALTER TABLE products ADD COLUMN reorder_point numeric DEFAULT 10;
  END IF;

  -- إضافة shipping_cost إذا لم يكن موجوداً
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'shipping_cost'
  ) THEN
    ALTER TABLE products ADD COLUMN shipping_cost numeric DEFAULT 0;
  END IF;

  -- إضافة additional_costs إذا لم يكن موجوداً
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'additional_costs'
  ) THEN
    ALTER TABLE products ADD COLUMN additional_costs numeric DEFAULT 0;
  END IF;

  -- إضافة total_cost إذا لم يكن موجوداً
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'total_cost'
  ) THEN
    ALTER TABLE products ADD COLUMN total_cost numeric DEFAULT 0;
  END IF;

  -- إضافة profit_margin إذا لم يكن موجوداً
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'profit_margin'
  ) THEN
    ALTER TABLE products ADD COLUMN profit_margin numeric DEFAULT 0;
  END IF;

  -- إضافة suggested_selling_price إذا لم يكن موجوداً
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'suggested_selling_price'
  ) THEN
    ALTER TABLE products ADD COLUMN suggested_selling_price numeric DEFAULT 0;
  END IF;

  -- إضافة category كنص إذا لم يكن موجوداً
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'category'
  ) THEN
    ALTER TABLE products ADD COLUMN category text;
  END IF;
END $$;

-- إنشاء دالة لحساب التكلفة الإجمالية وهامش الربح تلقائياً
CREATE OR REPLACE FUNCTION calculate_product_costs()
RETURNS TRIGGER AS $$
BEGIN
  -- حساب التكلفة الإجمالية = تكلفة الشراء + تكلفة الشحن + تكاليف إضافية
  NEW.total_cost := COALESCE(NEW.cost_price, 0) + 
                    COALESCE(NEW.shipping_cost, 0) + 
                    COALESCE(NEW.additional_costs, 0);
  
  -- حساب هامش الربح = سعر البيع - التكلفة الإجمالية
  NEW.profit_margin := COALESCE(NEW.selling_price, 0) - NEW.total_cost;
  
  -- حساب سعر البيع المقترح = التكلفة الإجمالية + 30% هامش ربح
  NEW.suggested_selling_price := NEW.total_cost * 1.30;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger لتشغيل الحساب التلقائي عند الإضافة أو التحديث
DROP TRIGGER IF EXISTS trigger_calculate_product_costs ON products;
CREATE TRIGGER trigger_calculate_product_costs
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION calculate_product_costs();

-- تحديث السجلات الموجودة لحساب القيم
UPDATE products 
SET 
  total_cost = COALESCE(cost_price, 0) + COALESCE(shipping_cost, 0) + COALESCE(additional_costs, 0),
  profit_margin = COALESCE(selling_price, 0) - (COALESCE(cost_price, 0) + COALESCE(shipping_cost, 0) + COALESCE(additional_costs, 0)),
  suggested_selling_price = (COALESCE(cost_price, 0) + COALESCE(shipping_cost, 0) + COALESCE(additional_costs, 0)) * 1.30
WHERE id IS NOT NULL;

-- إضافة تعليقات توضيحية للحقول الجديدة
COMMENT ON COLUMN products.max_stock_level IS 'الحد الأقصى للمخزون';
COMMENT ON COLUMN products.reorder_point IS 'نقطة إعادة الطلب';
COMMENT ON COLUMN products.shipping_cost IS 'تكلفة الشحن';
COMMENT ON COLUMN products.additional_costs IS 'تكاليف إضافية';
COMMENT ON COLUMN products.total_cost IS 'إجمالي التكلفة (محسوبة تلقائياً)';
COMMENT ON COLUMN products.profit_margin IS 'هامش الربح (محسوب تلقائياً)';
COMMENT ON COLUMN products.suggested_selling_price IS 'سعر البيع المقترح (محسوب تلقائياً)';
COMMENT ON COLUMN products.category IS 'التصنيف';