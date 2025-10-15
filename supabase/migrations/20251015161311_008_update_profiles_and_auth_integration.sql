/*
  # تحديث نظام المستخدمين وربطه بالأدوار
  
  ## التحديثات:
  1. تحديث trigger إنشاء الملف الشخصي لإضافة دور افتراضي
  2. دالة للحصول على دور المستخدم
  3. دالة لتسجيل الجلسات النشطة
*/

-- ==========================================
-- 1. تحديث دالة إنشاء الملف الشخصي
-- ==========================================

CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_role_id uuid;
  user_role_code text;
BEGIN
  -- إنشاء الملف الشخصي
  INSERT INTO public.profiles (id, email, full_name, company_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'company_name'
  );
  
  -- تحديد الدور الافتراضي (admin للمستخدم الأول، user لباقي المستخدمين)
  SELECT COUNT(*) INTO default_role_id FROM auth.users;
  
  IF default_role_id = 1 THEN
    user_role_code := 'ADMIN';
  ELSE
    user_role_code := COALESCE(NEW.raw_user_meta_data->>'role', 'VIEWER');
  END IF;
  
  -- إضافة الدور للمستخدم
  INSERT INTO public.user_roles (user_id, role_id, is_active)
  SELECT 
    NEW.id,
    id,
    true
  FROM public.roles
  WHERE role_code = user_role_code
  LIMIT 1;
  
  -- تسجيل النشاط
  PERFORM log_audit(
    NEW.id,
    'USER_REGISTERED',
    'auth.users',
    NEW.id,
    NULL,
    jsonb_build_object('email', NEW.email, 'role', user_role_code)
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- في حالة وجود خطأ، نكمل لكن نسجل الخطأ
    RAISE WARNING 'Error in create_profile_for_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 2. دالة للحصول على أدوار المستخدم
-- ==========================================

CREATE OR REPLACE FUNCTION get_user_roles(user_id_param uuid)
RETURNS TABLE (
  role_code text,
  role_name_ar text,
  role_name_en text,
  is_active boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.role_code,
    r.role_name_ar,
    r.role_name_en,
    ur.is_active
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = user_id_param
  ORDER BY r.role_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 3. دالة للتحقق من الدور
-- ==========================================

CREATE OR REPLACE FUNCTION has_role(
  user_id_param uuid,
  role_code_param text
)
RETURNS boolean AS $$
DECLARE
  has_role_result boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_id_param
      AND r.role_code = role_code_param
      AND ur.is_active = true
      AND r.is_active = true
  ) INTO has_role_result;
  
  RETURN has_role_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 4. دالة لتسجيل الجلسة النشطة
-- ==========================================

CREATE OR REPLACE FUNCTION create_active_session(
  p_user_id uuid,
  p_session_token text,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_expires_at timestamptz DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  session_id uuid;
  session_expires_at timestamptz;
BEGIN
  -- تحديد وقت انتهاء الجلسة (7 أيام افتراضياً)
  session_expires_at := COALESCE(p_expires_at, CURRENT_TIMESTAMP + INTERVAL '7 days');
  
  -- إضافة الجلسة الجديدة
  INSERT INTO active_sessions (
    user_id,
    session_token,
    ip_address,
    user_agent,
    expires_at,
    is_active
  )
  VALUES (
    p_user_id,
    p_session_token,
    p_ip_address,
    p_user_agent,
    session_expires_at,
    true
  )
  RETURNING id INTO session_id;
  
  -- تسجيل النشاط
  PERFORM log_audit(
    p_user_id,
    'SESSION_CREATED',
    'active_sessions',
    session_id,
    NULL,
    jsonb_build_object('ip_address', p_ip_address, 'expires_at', session_expires_at)
  );
  
  RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 5. دالة لتحديث آخر نشاط للجلسة
-- ==========================================

CREATE OR REPLACE FUNCTION update_session_activity(
  p_session_token text
)
RETURNS void AS $$
BEGIN
  UPDATE active_sessions
  SET last_activity = CURRENT_TIMESTAMP
  WHERE session_token = p_session_token
    AND is_active = true
    AND expires_at > CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 6. دالة لإنهاء الجلسة
-- ==========================================

CREATE OR REPLACE FUNCTION end_session(
  p_user_id uuid,
  p_session_token text
)
RETURNS void AS $$
BEGIN
  UPDATE active_sessions
  SET is_active = false
  WHERE user_id = p_user_id
    AND session_token = p_session_token;
    
  -- تسجيل النشاط
  PERFORM log_audit(
    p_user_id,
    'SESSION_ENDED',
    'active_sessions',
    NULL,
    NULL,
    jsonb_build_object('session_token', p_session_token)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 7. دالة لتنظيف الجلسات المنتهية
-- ==========================================

CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  WITH deleted AS (
    DELETE FROM active_sessions
    WHERE expires_at < CURRENT_TIMESTAMP
      OR (is_active = false AND created_at < CURRENT_TIMESTAMP - INTERVAL '30 days')
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 8. دالة للحصول على معلومات المستخدم الكاملة
-- ==========================================

CREATE OR REPLACE FUNCTION get_user_info(user_id_param uuid)
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  company_name text,
  role_code text,
  role_name_ar text,
  role_name_en text,
  permissions jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.company_name,
    r.role_code,
    r.role_name_ar,
    r.role_name_en,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'code', perm.permission_code,
          'name_ar', perm.permission_name_ar,
          'name_en', perm.permission_name_en,
          'category', perm.category
        )
      )
      FROM user_roles ur2
      JOIN role_permissions rp ON ur2.role_id = rp.role_id
      JOIN permissions perm ON rp.permission_id = perm.id
      WHERE ur2.user_id = user_id_param
        AND ur2.is_active = true
        AND perm.is_active = true
    ) as permissions
  FROM profiles p
  LEFT JOIN user_roles ur ON p.id = ur.user_id AND ur.is_active = true
  LEFT JOIN roles r ON ur.role_id = r.id
  WHERE p.id = user_id_param
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 9. سياسات RLS محدثة
-- ==========================================

-- السماح للمستخدمين بقراءة معلوماتهم الكاملة
CREATE POLICY "Users can read their complete info"
  ON profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid() OR 
    has_permission(auth.uid(), 'USERS_VIEW')
  );

-- السماح بالتحديث فقط للمستخدم نفسه أو admin
CREATE POLICY "Users can update own profile or admin"
  ON profiles FOR UPDATE TO authenticated
  USING (
    id = auth.uid() OR 
    has_role(auth.uid(), 'ADMIN')
  )
  WITH CHECK (
    id = auth.uid() OR 
    has_role(auth.uid(), 'ADMIN')
  );
