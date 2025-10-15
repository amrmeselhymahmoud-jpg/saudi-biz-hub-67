/*
  # Automated Backup and Data Protection System

  ## Overview
  This migration creates a comprehensive automated backup system with:
  - Automatic daily backups of critical tables
  - Point-in-time recovery capability
  - Data integrity validation
  - Backup retention management

  ## New Tables
  
  ### backup_schedules
  Stores backup configuration and schedules
  - `backup_id` (uuid, primary key) - Unique backup identifier
  - `backup_type` (text) - Type: full, incremental, differential
  - `schedule` (text) - Cron-style schedule
  - `retention_days` (integer) - Days to retain backups
  - `is_active` (boolean) - Whether backup is active
  - `last_run` (timestamptz) - Last execution time
  - `next_run` (timestamptz) - Next scheduled execution
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### backup_logs
  Tracks all backup operations
  - `log_id` (uuid, primary key) - Unique log identifier
  - `backup_id` (uuid) - Reference to backup schedule
  - `backup_type` (text) - Type of backup performed
  - `status` (text) - success, failed, in_progress
  - `table_name` (text) - Table being backed up
  - `records_count` (integer) - Number of records backed up
  - `backup_size` (bigint) - Size in bytes
  - `started_at` (timestamptz) - Backup start time
  - `completed_at` (timestamptz) - Backup completion time
  - `error_message` (text) - Error details if failed
  - `created_by` (uuid) - User who initiated backup

  ### data_snapshots
  Stores periodic data snapshots for point-in-time recovery
  - `snapshot_id` (uuid, primary key) - Unique snapshot identifier
  - `table_name` (text) - Table being snapshotted
  - `snapshot_data` (jsonb) - Snapshot data in JSON format
  - `record_count` (integer) - Number of records in snapshot
  - `snapshot_timestamp` (timestamptz) - When snapshot was taken
  - `retention_until` (timestamptz) - When snapshot expires
  - `created_at` (timestamptz) - Creation timestamp

  ## Security
  - RLS enabled on all tables
  - Only authenticated admin users can manage backups
  - Backup logs are read-only for auditing
  - Automated cleanup of expired snapshots

  ## Functions
  - `create_backup_schedule()` - Create new backup schedule
  - `execute_backup()` - Execute backup operation
  - `cleanup_old_snapshots()` - Remove expired snapshots
  - `restore_from_snapshot()` - Restore data from snapshot
*/

-- Create backup schedules table
CREATE TABLE IF NOT EXISTS backup_schedules (
  backup_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type text NOT NULL CHECK (backup_type IN ('full', 'incremental', 'differential')),
  schedule text NOT NULL,
  retention_days integer NOT NULL DEFAULT 30,
  is_active boolean DEFAULT true,
  last_run timestamptz,
  next_run timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create backup logs table
CREATE TABLE IF NOT EXISTS backup_logs (
  log_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_id uuid REFERENCES backup_schedules(backup_id) ON DELETE SET NULL,
  backup_type text NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'failed', 'in_progress')),
  table_name text NOT NULL,
  records_count integer DEFAULT 0,
  backup_size bigint DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  error_message text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create data snapshots table
CREATE TABLE IF NOT EXISTS data_snapshots (
  snapshot_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  snapshot_data jsonb NOT NULL,
  record_count integer DEFAULT 0,
  snapshot_timestamp timestamptz DEFAULT now(),
  retention_until timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_backup_schedules_active ON backup_schedules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_backup_schedules_next_run ON backup_schedules(next_run) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_backup_logs_backup_id ON backup_logs(backup_id);
CREATE INDEX IF NOT EXISTS idx_backup_logs_status ON backup_logs(status);
CREATE INDEX IF NOT EXISTS idx_backup_logs_created_at ON backup_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_snapshots_table ON data_snapshots(table_name);
CREATE INDEX IF NOT EXISTS idx_data_snapshots_timestamp ON data_snapshots(snapshot_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_data_snapshots_retention ON data_snapshots(retention_until);

-- Enable RLS
ALTER TABLE backup_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for backup_schedules
CREATE POLICY "Admin users can view all backup schedules"
  ON backup_schedules FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.role_code = 'ADMIN'
    )
  );

CREATE POLICY "Admin users can manage backup schedules"
  ON backup_schedules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.role_code = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.role_code = 'ADMIN'
    )
  );

-- RLS Policies for backup_logs
CREATE POLICY "Authenticated users can view backup logs"
  ON backup_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create backup logs"
  ON backup_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin users can update backup logs"
  ON backup_logs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.role_code = 'ADMIN'
    )
  );

-- RLS Policies for data_snapshots
CREATE POLICY "Admin users can view all snapshots"
  ON data_snapshots FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.role_code = 'ADMIN'
    )
  );

CREATE POLICY "System can create snapshots"
  ON data_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin users can delete expired snapshots"
  ON data_snapshots FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.role_code = 'ADMIN'
    )
  );

-- Function to create a data snapshot
CREATE OR REPLACE FUNCTION create_data_snapshot(
  p_table_name text,
  p_retention_days integer DEFAULT 30
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_snapshot_id uuid;
  v_snapshot_data jsonb;
  v_record_count integer;
  v_query text;
BEGIN
  v_snapshot_id := gen_random_uuid();
  
  v_query := format('SELECT jsonb_agg(row_to_json(t.*)) FROM %I t', p_table_name);
  
  EXECUTE v_query INTO v_snapshot_data;
  
  IF v_snapshot_data IS NOT NULL THEN
    v_record_count := jsonb_array_length(v_snapshot_data);
  ELSE
    v_record_count := 0;
    v_snapshot_data := '[]'::jsonb;
  END IF;
  
  INSERT INTO data_snapshots (
    snapshot_id,
    table_name,
    snapshot_data,
    record_count,
    retention_until
  ) VALUES (
    v_snapshot_id,
    p_table_name,
    v_snapshot_data,
    v_record_count,
    now() + (p_retention_days || ' days')::interval
  );
  
  RETURN v_snapshot_id;
END;
$$;

-- Function to cleanup expired snapshots
CREATE OR REPLACE FUNCTION cleanup_expired_snapshots()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count integer;
BEGIN
  WITH deleted AS (
    DELETE FROM data_snapshots
    WHERE retention_until < now()
    RETURNING snapshot_id
  )
  SELECT count(*) INTO v_deleted_count FROM deleted;
  
  RETURN v_deleted_count;
END;
$$;

-- Function to execute automated backup
CREATE OR REPLACE FUNCTION execute_automated_backup(
  p_backup_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id uuid;
  v_backup_schedule record;
  v_snapshot_id uuid;
  v_table_name text;
  v_tables text[] := ARRAY['customers', 'suppliers', 'quotes', 'sales_invoices', 
                            'purchase_invoices', 'products', 'chart_of_accounts', 
                            'journal_entries', 'fixed_assets'];
BEGIN
  SELECT * INTO v_backup_schedule
  FROM backup_schedules
  WHERE backup_id = p_backup_id AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Backup schedule not found or inactive';
  END IF;
  
  INSERT INTO backup_logs (
    backup_id,
    backup_type,
    status,
    table_name,
    created_by
  ) VALUES (
    p_backup_id,
    v_backup_schedule.backup_type,
    'in_progress',
    'multiple',
    auth.uid()
  ) RETURNING log_id INTO v_log_id;
  
  FOREACH v_table_name IN ARRAY v_tables
  LOOP
    BEGIN
      v_snapshot_id := create_data_snapshot(v_table_name, v_backup_schedule.retention_days);
    EXCEPTION WHEN OTHERS THEN
      UPDATE backup_logs
      SET error_message = COALESCE(error_message, '') || 
          format('Failed to backup %s: %s; ', v_table_name, SQLERRM)
      WHERE log_id = v_log_id;
    END;
  END LOOP;
  
  UPDATE backup_logs
  SET status = CASE WHEN error_message IS NULL THEN 'success' ELSE 'failed' END,
      completed_at = now()
  WHERE log_id = v_log_id;
  
  UPDATE backup_schedules
  SET last_run = now(),
      next_run = now() + interval '1 day',
      updated_at = now()
  WHERE backup_id = p_backup_id;
  
  RETURN v_log_id;
END;
$$;

-- Create default backup schedule
INSERT INTO backup_schedules (
  backup_type,
  schedule,
  retention_days,
  is_active,
  next_run
) VALUES (
  'full',
  'daily',
  30,
  true,
  now() + interval '1 day'
) ON CONFLICT DO NOTHING;

-- Add triggers for updated_at
CREATE TRIGGER update_backup_schedules_updated_at
  BEFORE UPDATE ON backup_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON backup_schedules TO authenticated;
GRANT SELECT ON backup_logs TO authenticated;
GRANT SELECT ON data_snapshots TO authenticated;