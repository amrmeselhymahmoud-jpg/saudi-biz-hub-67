/*
  # Create update_updated_at_column Function

  1. إنشاء دالة
    - `update_updated_at_column()` - دالة لتحديث حقل updated_at تلقائياً

  2. الوصف
    - هذه الدالة تستخدم مع triggers لتحديث حقل updated_at تلقائياً عند كل تحديث
*/

-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;