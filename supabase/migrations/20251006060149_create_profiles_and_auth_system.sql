/*
  # إنشاء نظام المصادقة الكامل
  
  1. الجداول الجديدة
    - `profiles` - ملفات تعريف المستخدمين
      - `id` (uuid, مرجع لـ auth.users)
      - `email` (text)
      - `display_name` (text, الاسم الظاهر)
      - `company_name` (text, اسم الشركة)
      - `business_type` (text, نوع النشاط)
      - `avatar_url` (text, صورة الملف الشخصي)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. الأمان
    - تفعيل RLS على جدول profiles
    - سياسات للقراءة والتحديث
    
  3. Triggers
    - إنشاء profile تلقائياً عند إنشاء مستخدم جديد
    - تحديث updated_at تلقائياً
*/

-- إنشاء جدول profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  display_name text,
  company_name text,
  business_type text,
  avatar_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- تفعيل RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- سياسة للقراءة العامة (اختياري - للمستخدمين غير المسجلين)
CREATE POLICY "Allow public read access for demo"
  ON profiles
  FOR SELECT
  TO public
  USING (true);

-- Function لإنشاء profile تلقائياً
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, company_name, business_type)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', ''),
    COALESCE(new.raw_user_meta_data->>'company_name', ''),
    COALESCE(new.raw_user_meta_data->>'business_type', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger لإنشاء profile عند إنشاء مستخدم
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function لتحديث updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger لتحديث updated_at
DROP TRIGGER IF EXISTS set_updated_at ON profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- الفهارس
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);