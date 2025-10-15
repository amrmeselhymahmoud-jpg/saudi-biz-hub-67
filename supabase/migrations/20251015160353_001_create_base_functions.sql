/*
  # إنشاء الدوال الأساسية

  هذا الـ migration ينشئ الدوال المشتركة التي ستستخدم في كل الجداول
*/

-- دالة تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
