/*
  # إنشاء نظام المصادقة والملفات الشخصية الكامل

  ## الجداول الجديدة
  
  ### جدول `profiles`
  - `id` (uuid، مفتاح أساسي، مرتبط بـ auth.users)
  - `email` (text، البريد الإلكتروني)
  - `display_name` (text، الاسم الكامل)
  - `company_name` (text، اسم الشركة)
  - `business_type` (text، نوع النشاط التجاري)
  - `avatar_url` (text، رابط صورة الملف الشخصي)
  - `created_at` (timestamptz، تاريخ الإنشاء)
  - `updated_at` (timestamptz، تاريخ آخر تحديث)

  ## الأمان (RLS)
  
  1. تفعيل RLS على جدول profiles
  2. سياسات للمستخدمين المصادقين:
     - قراءة الملف الشخصي الخاص
     - تحديث الملف الشخصي الخاص
  3. سياسة لإنشاء الملف الشخصي عند التسجيل
  
  ## الدوال (Functions)
  
  - دالة لإنشاء الملف الشخصي تلقائياً عند تسجيل مستخدم جديد
  - Trigger لتنفيذ الدالة عند إضافة مستخدم جديد في auth.users

  ## ملاحظات مهمة
  
  - الجدول يستخدم UUID كمفتاح أساسي مرتبط بـ auth.users
  - RLS مفعّل لحماية البيانات
  - تم استخدام ON CONFLICT DO NOTHING لتجنب الأخطاء عند التشغيل المتكرر
*/

-- إنشاء جدول profiles إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text,
  company_name text,
  business_type text,
  avatar_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- تفعيل RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة إن وجدت
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- سياسة قراءة الملف الشخصي
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- سياسة تحديث الملف الشخصي
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- سياسة إنشاء الملف الشخصي
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- حذف الدالة القديمة إن وجدت
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- دالة لإنشاء الملف الشخصي تلقائياً
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, company_name, business_type)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', new.email),
    COALESCE(new.raw_user_meta_data->>'company_name', ''),
    COALESCE(new.raw_user_meta_data->>'business_type', '')
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- حذف الـ trigger القديم إن وجد
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- إنشاء trigger لتنفيذ الدالة عند إضافة مستخدم جديد
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- إنشاء index لتحسين الأداء
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS profiles_company_name_idx ON public.profiles(company_name);