/*
  # إضافة بيانات تجريبية
  
  ## البيانات المضافة:
  1. ضرائب افتراضية (VAT 15%)
  2. شروط دفع افتراضية
  3. عملة افتراضية (ريال سعودي)
  4. فئات منتجات أساسية
  5. حسابات رئيسية في دليل الحسابات
*/

-- ==========================================
-- 1. الضرائب (Taxes)
-- ==========================================

INSERT INTO taxes (tax_code, tax_name, tax_rate, is_default, is_active, description)
VALUES 
  ('VAT15', 'ضريبة القيمة المضافة', 15.00, true, true, 'ضريبة القيمة المضافة السعودية 15%'),
  ('EXEMPT', 'معفى من الضريبة', 0.00, false, true, 'منتجات معفاة من الضريبة'),
  ('ZERO', 'نسبة صفرية', 0.00, false, true, 'منتجات بنسبة ضريبة صفرية')
ON CONFLICT (tax_code) DO NOTHING;

-- ==========================================
-- 2. شروط الدفع (Payment Terms)
-- ==========================================

INSERT INTO payment_terms (term_code, term_name, days, is_default, is_active, description)
VALUES 
  ('IMMEDIATE', 'فوري', 0, false, true, 'الدفع فوري عند الاستلام'),
  ('NET15', 'صافي 15 يوم', 15, false, true, 'الدفع خلال 15 يوم من تاريخ الفاتورة'),
  ('NET30', 'صافي 30 يوم', 30, true, true, 'الدفع خلال 30 يوم من تاريخ الفاتورة'),
  ('NET45', 'صافي 45 يوم', 45, false, true, 'الدفع خلال 45 يوم من تاريخ الفاتورة'),
  ('NET60', 'صافي 60 يوم', 60, false, true, 'الدفع خلال 60 يوم من تاريخ الفاتورة'),
  ('NET90', 'صافي 90 يوم', 90, false, true, 'الدفع خلال 90 يوم من تاريخ الفاتورة')
ON CONFLICT (term_code) DO NOTHING;

-- ==========================================
-- 3. العملات (Currencies)
-- ==========================================

INSERT INTO currencies (currency_code, currency_name, symbol, exchange_rate, is_base, is_active)
VALUES 
  ('SAR', 'ريال سعودي', 'ر.س', 1.000000, true, true),
  ('USD', 'دولار أمريكي', '$', 3.750000, false, true),
  ('EUR', 'يورو', '€', 4.100000, false, true),
  ('GBP', 'جنيه إسترليني', '£', 4.800000, false, true)
ON CONFLICT (currency_code) DO NOTHING;

-- ==========================================
-- 4. فئات المنتجات (Product Categories)
-- ==========================================

INSERT INTO product_categories (category_name, description, status)
VALUES 
  ('إلكترونيات', 'أجهزة إلكترونية ومعدات تقنية', 'active'),
  ('أثاث', 'أثاث مكتبي ومنزلي', 'active'),
  ('قرطاسية', 'مستلزمات مكتبية وقرطاسية', 'active'),
  ('خدمات', 'خدمات استشارية وفنية', 'active'),
  ('متنوعة', 'منتجات متنوعة', 'active')
ON CONFLICT (category_name) DO NOTHING;

-- ==========================================
-- 5. دليل الحسابات الرئيسي (Chart of Accounts)
-- ==========================================

INSERT INTO chart_of_accounts (account_code, account_name_ar, account_name_en, account_type, level, is_active, allow_manual_entry)
VALUES 
  -- الأصول
  ('1000', 'الأصول', 'Assets', 'asset', 1, true, false),
  ('1100', 'الأصول المتداولة', 'Current Assets', 'asset', 2, true, false),
  ('1110', 'النقدية والبنوك', 'Cash and Banks', 'asset', 3, true, true),
  ('1120', 'العملاء', 'Accounts Receivable', 'asset', 3, true, true),
  ('1130', 'المخزون', 'Inventory', 'asset', 3, true, true),
  ('1200', 'الأصول الثابتة', 'Fixed Assets', 'asset', 2, true, false),
  ('1210', 'معدات', 'Equipment', 'asset', 3, true, true),
  ('1220', 'مباني', 'Buildings', 'asset', 3, true, true),
  ('1230', 'سيارات', 'Vehicles', 'asset', 3, true, true),
  ('1250', 'مجمع الإهلاك', 'Accumulated Depreciation', 'asset', 3, true, true),
  
  -- الخصوم
  ('2000', 'الخصوم', 'Liabilities', 'liability', 1, true, false),
  ('2100', 'الخصوم المتداولة', 'Current Liabilities', 'liability', 2, true, false),
  ('2110', 'الموردون', 'Accounts Payable', 'liability', 3, true, true),
  ('2120', 'ضريبة القيمة المضافة', 'VAT Payable', 'liability', 3, true, true),
  ('2130', 'رواتب مستحقة', 'Salaries Payable', 'liability', 3, true, true),
  
  -- حقوق الملكية
  ('3000', 'حقوق الملكية', 'Equity', 'equity', 1, true, false),
  ('3100', 'رأس المال', 'Capital', 'equity', 2, true, true),
  ('3200', 'الأرباح المحتجزة', 'Retained Earnings', 'equity', 2, true, true),
  ('3300', 'أرباح العام الحالي', 'Current Year Profit', 'equity', 2, true, true),
  
  -- الإيرادات
  ('4000', 'الإيرادات', 'Revenue', 'revenue', 1, true, false),
  ('4100', 'إيرادات المبيعات', 'Sales Revenue', 'revenue', 2, true, true),
  ('4200', 'إيرادات الخدمات', 'Service Revenue', 'revenue', 2, true, true),
  ('4900', 'إيرادات أخرى', 'Other Revenue', 'revenue', 2, true, true),
  
  -- المصروفات
  ('5000', 'المصروفات', 'Expenses', 'expense', 1, true, false),
  ('5100', 'تكلفة المبيعات', 'Cost of Goods Sold', 'expense', 2, true, true),
  ('5200', 'مصروفات الرواتب', 'Salary Expenses', 'expense', 2, true, true),
  ('5300', 'مصروفات الإيجار', 'Rent Expenses', 'expense', 2, true, true),
  ('5400', 'مصروفات الكهرباء', 'Utilities Expenses', 'expense', 2, true, true),
  ('5500', 'مصروفات الصيانة', 'Maintenance Expenses', 'expense', 2, true, true),
  ('5600', 'مصروفات الإهلاك', 'Depreciation Expenses', 'expense', 2, true, true),
  ('5900', 'مصروفات أخرى', 'Other Expenses', 'expense', 2, true, true)
ON CONFLICT (account_code) DO NOTHING;

-- تحديث العلاقات الهرمية للحسابات
UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '1000') WHERE account_code = '1100';
UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '1000') WHERE account_code = '1200';
UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '1100') WHERE account_code IN ('1110', '1120', '1130');
UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '1200') WHERE account_code IN ('1210', '1220', '1230', '1250');

UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '2000') WHERE account_code = '2100';
UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '2100') WHERE account_code IN ('2110', '2120', '2130');

UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '3000') WHERE account_code IN ('3100', '3200', '3300');

UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '4000') WHERE account_code IN ('4100', '4200', '4900');

UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '5000') WHERE account_code IN ('5100', '5200', '5300', '5400', '5500', '5600', '5900');
