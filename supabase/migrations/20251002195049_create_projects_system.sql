-- Create Projects Management System
-- Overview: Complete system for managing projects with tasks, expenses, and time tracking

-- Table 1: Projects
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_code text NOT NULL,
  project_name text NOT NULL,
  client_name text,
  project_type text DEFAULT 'داخلي' CHECK (project_type IN ('داخلي', 'خارجي', 'تطوير', 'استشاري', 'صيانة')),
  status text DEFAULT 'قيد التنفيذ' CHECK (status IN ('مخطط', 'قيد التنفيذ', 'متوقف', 'مكتمل', 'ملغي')),
  priority text DEFAULT 'متوسط' CHECK (priority IN ('منخفض', 'متوسط', 'عالي', 'عاجل')),
  start_date date NOT NULL,
  end_date date,
  estimated_end_date date,
  budget decimal(15,2) DEFAULT 0,
  actual_cost decimal(15,2) DEFAULT 0,
  progress_percentage integer DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  manager_name text,
  team_size integer DEFAULT 1,
  description text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, project_code)
);

-- Table 2: Project Tasks
CREATE TABLE IF NOT EXISTS project_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  task_name text NOT NULL,
  task_description text,
  assigned_to text,
  status text DEFAULT 'جديدة' CHECK (status IN ('جديدة', 'قيد التنفيذ', 'مكتملة', 'معلقة', 'ملغاة')),
  priority text DEFAULT 'متوسط' CHECK (priority IN ('منخفض', 'متوسط', 'عالي', 'عاجل')),
  start_date date,
  due_date date,
  completed_date date,
  estimated_hours decimal(8,2) DEFAULT 0,
  actual_hours decimal(8,2) DEFAULT 0,
  progress_percentage integer DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Table 3: Project Expenses
CREATE TABLE IF NOT EXISTS project_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  expense_date date NOT NULL,
  expense_type text NOT NULL CHECK (expense_type IN ('رواتب', 'مواد', 'معدات', 'نقل', 'استشارات', 'أخرى')),
  description text NOT NULL,
  amount decimal(15,2) NOT NULL,
  paid_by text,
  payment_method text CHECK (payment_method IN ('نقدي', 'تحويل بنكي', 'بطاقة', 'شيك')),
  receipt_number text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Table 4: Project Time Tracking
CREATE TABLE IF NOT EXISTS project_time_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  task_id uuid REFERENCES project_tasks(id) ON DELETE SET NULL,
  team_member text NOT NULL,
  work_date date NOT NULL,
  hours_worked decimal(8,2) NOT NULL,
  work_description text,
  billable boolean DEFAULT true,
  hourly_rate decimal(10,2) DEFAULT 0,
  total_amount decimal(15,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_time_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for project_tasks
CREATE POLICY "Users can view own project tasks"
  ON project_tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own project tasks"
  ON project_tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own project tasks"
  ON project_tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own project tasks"
  ON project_tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for project_expenses
CREATE POLICY "Users can view own project expenses"
  ON project_expenses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own project expenses"
  ON project_expenses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own project expenses"
  ON project_expenses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for project_time_tracking
CREATE POLICY "Users can view own project time"
  ON project_time_tracking FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own project time"
  ON project_time_tracking FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_status ON project_tasks(status);
CREATE INDEX IF NOT EXISTS idx_project_expenses_project_id ON project_expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_project_time_project_id ON project_time_tracking(project_id);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_projects_updated_at_trigger
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_projects_updated_at();

-- Function to generate project code
CREATE OR REPLACE FUNCTION generate_project_code()
RETURNS TRIGGER AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(project_code FROM 5) AS integer)), 0) + 1
  INTO next_num
  FROM projects
  WHERE user_id = NEW.user_id;
  
  NEW.project_code := 'PRJ-' || LPAD(next_num::text, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to generate project code
CREATE TRIGGER generate_project_code_trigger
  BEFORE INSERT ON projects
  FOR EACH ROW
  WHEN (NEW.project_code IS NULL OR NEW.project_code = '')
  EXECUTE FUNCTION generate_project_code();

-- Function to update project costs
CREATE OR REPLACE FUNCTION update_project_actual_cost()
RETURNS TRIGGER AS $$
DECLARE
  total_expenses decimal(15,2);
  total_time_cost decimal(15,2);
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO total_expenses
  FROM project_expenses
  WHERE project_id = COALESCE(NEW.project_id, OLD.project_id);
  
  SELECT COALESCE(SUM(total_amount), 0)
  INTO total_time_cost
  FROM project_time_tracking
  WHERE project_id = COALESCE(NEW.project_id, OLD.project_id);
  
  UPDATE projects
  SET actual_cost = total_expenses + total_time_cost
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers to update project costs
CREATE TRIGGER update_project_cost_on_expense_trigger
  AFTER INSERT OR UPDATE OR DELETE ON project_expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_project_actual_cost();

CREATE TRIGGER update_project_cost_on_time_trigger
  AFTER INSERT OR UPDATE OR DELETE ON project_time_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_project_actual_cost();

-- Function to calculate time tracking amount
CREATE OR REPLACE FUNCTION calculate_time_amount()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_amount := NEW.hours_worked * NEW.hourly_rate;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to calculate time amount
CREATE TRIGGER calculate_time_amount_trigger
  BEFORE INSERT OR UPDATE ON project_time_tracking
  FOR EACH ROW
  EXECUTE FUNCTION calculate_time_amount();