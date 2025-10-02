/*
  # Create Users Management System

  ## New Tables
  1. system_users - System users with roles and permissions
  2. user_roles - Role definitions
  3. user_permissions - Permission tracking

  ## Security
  - Enable RLS on all tables
*/

CREATE TABLE IF NOT EXISTS system_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text DEFAULT '',
  role text DEFAULT 'user',
  department text DEFAULT '',
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(owner_id, email)
);

CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role_name text NOT NULL,
  role_code text NOT NULL,
  description text DEFAULT '',
  permissions jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(owner_id, role_code)
);

CREATE TABLE IF NOT EXISTS user_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES system_users(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  description text DEFAULT '',
  ip_address text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own system users" ON system_users FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can manage own roles" ON user_roles FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can view own activity logs" ON user_activity_logs FOR SELECT TO authenticated USING (auth.uid() = owner_id);

CREATE INDEX IF NOT EXISTS idx_system_users_owner ON system_users(owner_id);
CREATE INDEX IF NOT EXISTS idx_system_users_email ON system_users(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_owner ON user_roles(owner_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON user_activity_logs(user_id);