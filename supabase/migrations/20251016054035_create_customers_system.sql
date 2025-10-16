/*
  # إنشاء نظام العملاء والسندات

  ## الجداول الجديدة
  
  ### جدول `customers` - العملاء
  - `id` (uuid، مفتاح أساسي)
  - `customer_code` (text، فريد) - كود العميل
  - `customer_name` (text) - اسم العميل
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

  ### جدول `customer_bonds` - سندات العملاء
  - `id` (uuid، مفتاح أساسي)
  - `bond_number` (text، فريد) - رقم السند
  - `customer_id` (uuid، مفتاح أجنبي) - العميل
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

  ## الأمان
  - تفعيل RLS على كل الجداول
  - السماح لجميع المستخدمين المصادقين بالقراءة والتعديل
*/

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code text UNIQUE NOT NULL,
  customer_name text NOT NULL,
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
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create customer_bonds table
CREATE TABLE IF NOT EXISTS customer_bonds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bond_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE RESTRICT,
  bond_type text NOT NULL CHECK (bond_type IN ('receipt', 'payment')),
  bond_date date NOT NULL DEFAULT CURRENT_DATE,
  amount decimal(15,2) NOT NULL CHECK (amount > 0),
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'check', 'card')),
  reference_number text,
  bank_name text,
  notes text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'cancelled')),
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_customers_customer_code ON customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customer_bonds_customer_id ON customer_bonds(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_bonds_bond_date ON customer_bonds(bond_date);
CREATE INDEX IF NOT EXISTS idx_customer_bonds_status ON customer_bonds(status);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_bonds ENABLE ROW LEVEL SECURITY;

-- Policies for customers
CREATE POLICY "Users can view all customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update all customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete all customers"
  ON customers FOR DELETE
  TO authenticated
  USING (true);

-- Policies for customer_bonds
CREATE POLICY "Users can view all customer bonds"
  ON customer_bonds FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create customer bonds"
  ON customer_bonds FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update all customer bonds"
  ON customer_bonds FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete all customer bonds"
  ON customer_bonds FOR DELETE
  TO authenticated
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customer_bonds_updated_at ON customer_bonds;
CREATE TRIGGER update_customer_bonds_updated_at
  BEFORE UPDATE ON customer_bonds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();