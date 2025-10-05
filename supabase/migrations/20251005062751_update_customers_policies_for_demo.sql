/*
  # Update Customer Policies for Demo Mode

  Allow public access to customer data for demo purposes
  Remove authentication requirements
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view customers" ON customers;
DROP POLICY IF EXISTS "Users can create customers" ON customers;
DROP POLICY IF EXISTS "Users can update customers" ON customers;
DROP POLICY IF EXISTS "Users can delete customers" ON customers;

-- Create new policies for demo mode (allow all operations)
CREATE POLICY "Allow all to view customers"
  ON customers FOR SELECT
  USING (true);

CREATE POLICY "Allow all to create customers"
  ON customers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all to update customers"
  ON customers FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all to delete customers"
  ON customers FOR DELETE
  USING (true);