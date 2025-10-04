/*
  # Create Suppliers and Supplier Bonds System

  1. New Tables
    - `suppliers`
      - `id` (uuid, primary key)
      - `supplier_code` (text, unique) - كود المورد
      - `supplier_name` (text) - اسم المورد
      - `email` (text) - البريد الإلكتروني
      - `phone` (text) - رقم الهاتف
      - `tax_number` (text) - الرقم الضريبي
      - `address` (text) - العنوان
      - `city` (text) - المدينة
      - `country` (text) - البلد
      - `credit_limit` (decimal) - حد الائتمان
      - `payment_terms` (integer) - شروط السداد بالأيام
      - `notes` (text) - ملاحظات
      - `status` (text) - الحالة
      - `created_by` (uuid) - المستخدم المنشئ
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `supplier_bonds`
      - `id` (uuid, primary key)
      - `bond_number` (text, unique) - رقم السند
      - `supplier_id` (uuid, foreign key) - المورد
      - `bond_type` (text) - نوع السند (receipt/payment)
      - `bond_date` (date) - تاريخ السند
      - `amount` (decimal) - المبلغ
      - `payment_method` (text) - طريقة الدفع
      - `reference_number` (text) - رقم المرجع
      - `bank_name` (text) - اسم البنك
      - `notes` (text) - ملاحظات
      - `status` (text) - الحالة
      - `created_by` (uuid) - المستخدم المنشئ
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_code text UNIQUE NOT NULL,
  supplier_name text NOT NULL,
  email text,
  phone text,
  tax_number text,
  address text,
  city text,
  country text DEFAULT 'السعودية',
  credit_limit decimal(15,2) DEFAULT 0,
  payment_terms integer DEFAULT 30,
  notes text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create supplier_bonds table
CREATE TABLE IF NOT EXISTS supplier_bonds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bond_number text UNIQUE NOT NULL,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE RESTRICT,
  bond_type text NOT NULL CHECK (bond_type IN ('receipt', 'payment')),
  bond_date date NOT NULL DEFAULT CURRENT_DATE,
  amount decimal(15,2) NOT NULL CHECK (amount > 0),
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'check', 'card')),
  reference_number text,
  bank_name text,
  notes text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'cancelled')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_supplier_code ON suppliers(supplier_code);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
CREATE INDEX IF NOT EXISTS idx_supplier_bonds_supplier_id ON supplier_bonds(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_bonds_bond_date ON supplier_bonds(bond_date);

-- Enable RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_bonds ENABLE ROW LEVEL SECURITY;

-- Policies for suppliers
CREATE POLICY "Users can view suppliers"
  ON suppliers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create suppliers"
  ON suppliers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update suppliers"
  ON suppliers FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete suppliers"
  ON suppliers FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Policies for supplier_bonds
CREATE POLICY "Users can view supplier bonds"
  ON supplier_bonds FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create supplier bonds"
  ON supplier_bonds FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update supplier bonds"
  ON supplier_bonds FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete draft supplier bonds"
  ON supplier_bonds FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by AND status = 'draft');

-- Create triggers
DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_supplier_bonds_updated_at ON supplier_bonds;
CREATE TRIGGER update_supplier_bonds_updated_at
  BEFORE UPDATE ON supplier_bonds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();