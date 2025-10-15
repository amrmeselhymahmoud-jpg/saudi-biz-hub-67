/*
  # نظام الصلاحيات المتقدم
  
  ## الوصف
  نظام صلاحيات شامل يدعم:
  - أدوار متعددة (admin, sales, accountant, manager, viewer)
  - صلاحيات دقيقة لكل دور
  - تدقيق الأنشطة (audit logs)
  - جلسات نشطة
  
  ## الجداول:
  1. roles: الأدوار المتاحة
  2. permissions: الصلاحيات المتاحة
  3. role_permissions: ربط الأدوار بالصلاحيات
  4. user_roles: ربط المستخدمين بالأدوار
  5. audit_logs: سجل التدقيق
  6. active_sessions: الجلسات النشطة
*/

-- ==========================================
-- 1. جدول الأدوار (Roles)
-- ==========================================

CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_code text UNIQUE NOT NULL,
  role_name_ar text NOT NULL,
  role_name_en text NOT NULL,
  description text,
  is_system boolean DEFAULT false NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_roles_code ON roles(role_code);
CREATE INDEX idx_roles_active ON roles(is_active);

CREATE TRIGGER set_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 2. جدول الصلاحيات (Permissions)
-- ==========================================

CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_code text UNIQUE NOT NULL,
  permission_name_ar text NOT NULL,
  permission_name_en text NOT NULL,
  category text NOT NULL,
  description text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_permissions_code ON permissions(permission_code);
CREATE INDEX idx_permissions_category ON permissions(category);
CREATE INDEX idx_permissions_active ON permissions(is_active);

-- ==========================================
-- 3. ربط الأدوار بالصلاحيات (Role Permissions)
-- ==========================================

CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  granted_by uuid REFERENCES auth.users(id),
  UNIQUE(role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);

-- ==========================================
-- 4. ربط المستخدمين بالأدوار (User Roles)
-- ==========================================

CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  assigned_by uuid REFERENCES auth.users(id),
  expires_at timestamptz,
  is_active boolean DEFAULT true NOT NULL,
  UNIQUE(user_id, role_id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
CREATE INDEX idx_user_roles_active ON user_roles(is_active);

-- ==========================================
-- 5. سجل التدقيق (Audit Logs)
-- ==========================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  action text NOT NULL,
  table_name text,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ==========================================
-- 6. الجلسات النشطة (Active Sessions)
-- ==========================================

CREATE TABLE IF NOT EXISTS active_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token text NOT NULL,
  ip_address text,
  user_agent text,
  device_info jsonb,
  last_activity timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  expires_at timestamptz NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_active_sessions_user ON active_sessions(user_id);
CREATE INDEX idx_active_sessions_token ON active_sessions(session_token);
CREATE INDEX idx_active_sessions_active ON active_sessions(is_active);
CREATE INDEX idx_active_sessions_expires ON active_sessions(expires_at);

-- ==========================================
-- 7. إدراج الأدوار الأساسية
-- ==========================================

INSERT INTO roles (role_code, role_name_ar, role_name_en, description, is_system, is_active)
VALUES 
  ('ADMIN', 'مدير النظام', 'Administrator', 'صلاحيات كاملة على النظام', true, true),
  ('SALES', 'موظف مبيعات', 'Sales Representative', 'إدارة المبيعات والعملاء', true, true),
  ('ACCOUNTANT', 'محاسب', 'Accountant', 'إدارة الحسابات والمالية', true, true),
  ('MANAGER', 'مدير', 'Manager', 'صلاحيات إدارية متوسطة', true, true),
  ('VIEWER', 'مراقب', 'Viewer', 'عرض البيانات فقط', true, true)
ON CONFLICT (role_code) DO NOTHING;

-- ==========================================
-- 8. إدراج الصلاحيات الأساسية
-- ==========================================

INSERT INTO permissions (permission_code, permission_name_ar, permission_name_en, category)
VALUES 
  -- صلاحيات العملاء
  ('CUSTOMERS_VIEW', 'عرض العملاء', 'View Customers', 'customers'),
  ('CUSTOMERS_CREATE', 'إضافة عملاء', 'Create Customers', 'customers'),
  ('CUSTOMERS_EDIT', 'تعديل عملاء', 'Edit Customers', 'customers'),
  ('CUSTOMERS_DELETE', 'حذف عملاء', 'Delete Customers', 'customers'),
  
  -- صلاحيات الموردين
  ('SUPPLIERS_VIEW', 'عرض الموردين', 'View Suppliers', 'suppliers'),
  ('SUPPLIERS_CREATE', 'إضافة موردين', 'Create Suppliers', 'suppliers'),
  ('SUPPLIERS_EDIT', 'تعديل موردين', 'Edit Suppliers', 'suppliers'),
  ('SUPPLIERS_DELETE', 'حذف موردين', 'Delete Suppliers', 'suppliers'),
  
  -- صلاحيات المنتجات
  ('PRODUCTS_VIEW', 'عرض المنتجات', 'View Products', 'products'),
  ('PRODUCTS_CREATE', 'إضافة منتجات', 'Create Products', 'products'),
  ('PRODUCTS_EDIT', 'تعديل منتجات', 'Edit Products', 'products'),
  ('PRODUCTS_DELETE', 'حذف منتجات', 'Delete Products', 'products'),
  
  -- صلاحيات المبيعات
  ('SALES_VIEW', 'عرض المبيعات', 'View Sales', 'sales'),
  ('SALES_CREATE', 'إضافة مبيعات', 'Create Sales', 'sales'),
  ('SALES_EDIT', 'تعديل مبيعات', 'Edit Sales', 'sales'),
  ('SALES_DELETE', 'حذف مبيعات', 'Delete Sales', 'sales'),
  ('QUOTES_VIEW', 'عرض عروض الأسعار', 'View Quotes', 'sales'),
  ('QUOTES_CREATE', 'إضافة عروض أسعار', 'Create Quotes', 'sales'),
  
  -- صلاحيات المشتريات
  ('PURCHASES_VIEW', 'عرض المشتريات', 'View Purchases', 'purchases'),
  ('PURCHASES_CREATE', 'إضافة مشتريات', 'Create Purchases', 'purchases'),
  ('PURCHASES_EDIT', 'تعديل مشتريات', 'Edit Purchases', 'purchases'),
  ('PURCHASES_DELETE', 'حذف مشتريات', 'Delete Purchases', 'purchases'),
  
  -- صلاحيات المحاسبة
  ('ACCOUNTING_VIEW', 'عرض الحسابات', 'View Accounting', 'accounting'),
  ('ACCOUNTING_CREATE', 'إضافة قيود', 'Create Entries', 'accounting'),
  ('ACCOUNTING_EDIT', 'تعديل قيود', 'Edit Entries', 'accounting'),
  ('ACCOUNTING_DELETE', 'حذف قيود', 'Delete Entries', 'accounting'),
  ('ACCOUNTING_POST', 'ترحيل قيود', 'Post Entries', 'accounting'),
  
  -- صلاحيات التقارير
  ('REPORTS_VIEW', 'عرض التقارير', 'View Reports', 'reports'),
  ('REPORTS_EXPORT', 'تصدير التقارير', 'Export Reports', 'reports'),
  ('REPORTS_FINANCIAL', 'التقارير المالية', 'Financial Reports', 'reports'),
  
  -- صلاحيات المستخدمين
  ('USERS_VIEW', 'عرض المستخدمين', 'View Users', 'users'),
  ('USERS_CREATE', 'إضافة مستخدمين', 'Create Users', 'users'),
  ('USERS_EDIT', 'تعديل مستخدمين', 'Edit Users', 'users'),
  ('USERS_DELETE', 'حذف مستخدمين', 'Delete Users', 'users'),
  ('USERS_ROLES', 'إدارة الأدوار', 'Manage Roles', 'users'),
  
  -- صلاحيات الإعدادات
  ('SETTINGS_VIEW', 'عرض الإعدادات', 'View Settings', 'settings'),
  ('SETTINGS_EDIT', 'تعديل الإعدادات', 'Edit Settings', 'settings'),
  
  -- صلاحيات الأصول
  ('ASSETS_VIEW', 'عرض الأصول', 'View Assets', 'assets'),
  ('ASSETS_CREATE', 'إضافة أصول', 'Create Assets', 'assets'),
  ('ASSETS_EDIT', 'تعديل أصول', 'Edit Assets', 'assets'),
  ('ASSETS_DELETE', 'حذف أصول', 'Delete Assets', 'assets')
ON CONFLICT (permission_code) DO NOTHING;

-- ==========================================
-- 9. ربط الأدوار بالصلاحيات
-- ==========================================

-- صلاحيات المدير (كل شيء)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE role_code = 'ADMIN'),
  id
FROM permissions
ON CONFLICT DO NOTHING;

-- صلاحيات موظف المبيعات
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE role_code = 'SALES'),
  id
FROM permissions
WHERE permission_code IN (
  'CUSTOMERS_VIEW', 'CUSTOMERS_CREATE', 'CUSTOMERS_EDIT',
  'PRODUCTS_VIEW',
  'SALES_VIEW', 'SALES_CREATE', 'SALES_EDIT',
  'QUOTES_VIEW', 'QUOTES_CREATE',
  'REPORTS_VIEW'
)
ON CONFLICT DO NOTHING;

-- صلاحيات المحاسب
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE role_code = 'ACCOUNTANT'),
  id
FROM permissions
WHERE permission_code IN (
  'CUSTOMERS_VIEW',
  'SUPPLIERS_VIEW',
  'PRODUCTS_VIEW',
  'SALES_VIEW',
  'PURCHASES_VIEW',
  'ACCOUNTING_VIEW', 'ACCOUNTING_CREATE', 'ACCOUNTING_EDIT', 'ACCOUNTING_POST',
  'REPORTS_VIEW', 'REPORTS_EXPORT', 'REPORTS_FINANCIAL',
  'ASSETS_VIEW', 'ASSETS_CREATE', 'ASSETS_EDIT'
)
ON CONFLICT DO NOTHING;

-- صلاحيات المدير
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE role_code = 'MANAGER'),
  id
FROM permissions
WHERE permission_code NOT IN ('USERS_DELETE', 'SETTINGS_EDIT', 'ACCOUNTING_DELETE')
ON CONFLICT DO NOTHING;

-- صلاحيات المراقب (عرض فقط)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE role_code = 'VIEWER'),
  id
FROM permissions
WHERE permission_code LIKE '%_VIEW' OR permission_code = 'REPORTS_VIEW'
ON CONFLICT DO NOTHING;

-- ==========================================
-- 10. دالة للتحقق من الصلاحيات
-- ==========================================

CREATE OR REPLACE FUNCTION has_permission(
  user_id_param uuid,
  permission_code_param text
)
RETURNS boolean AS $$
DECLARE
  has_perm boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = user_id_param
      AND p.permission_code = permission_code_param
      AND ur.is_active = true
      AND p.is_active = true
  ) INTO has_perm;
  
  RETURN has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 11. دالة للحصول على صلاحيات المستخدم
-- ==========================================

CREATE OR REPLACE FUNCTION get_user_permissions(user_id_param uuid)
RETURNS TABLE (
  permission_code text,
  permission_name_ar text,
  permission_name_en text,
  category text
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.permission_code,
    p.permission_name_ar,
    p.permission_name_en,
    p.category
  FROM user_roles ur
  JOIN role_permissions rp ON ur.role_id = rp.role_id
  JOIN permissions p ON rp.permission_id = p.id
  WHERE ur.user_id = user_id_param
    AND ur.is_active = true
    AND p.is_active = true
  ORDER BY p.category, p.permission_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 12. دالة لتسجيل الأنشطة
-- ==========================================

CREATE OR REPLACE FUNCTION log_audit(
  p_user_id uuid,
  p_action text,
  p_table_name text DEFAULT NULL,
  p_record_id uuid DEFAULT NULL,
  p_old_data jsonb DEFAULT NULL,
  p_new_data jsonb DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  audit_id uuid;
BEGIN
  INSERT INTO audit_logs (
    user_id,
    user_email,
    action,
    table_name,
    record_id,
    old_data,
    new_data
  )
  VALUES (
    p_user_id,
    (SELECT email FROM auth.users WHERE id = p_user_id),
    p_action,
    p_table_name,
    p_record_id,
    p_old_data,
    p_new_data
  )
  RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 13. تفعيل RLS على الجداول الجديدة
-- ==========================================

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

-- سياسات القراءة للمستخدمين المصادقين
CREATE POLICY "Authenticated users can read roles"
  ON roles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read permissions"
  ON permissions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read their role permissions"
  ON role_permissions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can read their own roles"
  ON user_roles FOR SELECT TO authenticated 
  USING (user_id = auth.uid() OR has_permission(auth.uid(), 'USERS_VIEW'));

CREATE POLICY "Users can read audit logs"
  ON audit_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_permission(auth.uid(), 'USERS_VIEW'));

CREATE POLICY "Users can read their own sessions"
  ON active_sessions FOR SELECT TO authenticated
  USING (user_id = auth.uid());
