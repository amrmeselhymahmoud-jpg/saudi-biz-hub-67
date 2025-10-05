/*
  # إنشاء نظام المصادقة والملفات الشخصية

  ## نظرة عامة
  إنشاء نظام مصادقة كامل مع Supabase Auth وجدول الملفات الشخصية

  ## الجداول الجديدة
  
  ### `profiles`
  - `id` (uuid, primary key) - معرف المستخدم من auth.users
  - `email` (text) - البريد الإلكتروني
  - `display_name` (text) - الاسم الكامل
  - `company_name` (text) - اسم الشركة
  - `business_type` (text) - نوع النشاط التجاري
  - `created_at` (timestamptz) - تاريخ الإنشاء
  - `updated_at` (timestamptz) - تاريخ آخر تحديث

  ## الأمان
  - تفعيل RLS على جدول profiles
  - السماح للمستخدمين بقراءة وتحديث ملفاتهم الشخصية فقط
  - السماح للمستخدمين الجدد بإنشاء ملفهم الشخصي
  - إنشاء trigger لإنشاء ملف شخصي تلقائياً عند التسجيل

  ## الوظائف
  - دالة لإنشاء ملف شخصي جديد تلقائياً عند تسجيل مستخدم جديد
  - trigger لاستدعاء هذه الدالة
*/

-- إنشاء جدول الملفات الشخصية
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text NOT NULL,
  company_name text NOT NULL,
  business_type text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- تفعيل RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة: المستخدمون يمكنهم قراءة ملفاتهم الشخصية فقط
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- سياسة الإدراج: المستخدمون يمكنهم إنشاء ملفاتهم الشخصية فقط
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- سياسة التحديث: المستخدمون يمكنهم تحديث ملفاتهم الشخصية فقط
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- إنشاء دالة لإنشاء ملف شخصي جديد تلقائياً
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, company_name, business_type)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', new.email),
    COALESCE(new.raw_user_meta_data->>'company_name', 'شركة جديدة'),
    COALESCE(new.raw_user_meta_data->>'business_type', 'أخرى')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء trigger لإنشاء ملف شخصي عند تسجيل مستخدم جديد
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- إنشاء دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger لتحديث updated_at
DROP TRIGGER IF EXISTS set_updated_at ON profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- إنشاء فهرس للبريد الإلكتروني
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);