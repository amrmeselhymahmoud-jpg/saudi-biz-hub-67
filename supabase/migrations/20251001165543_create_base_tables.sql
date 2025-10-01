/*
  # Create Base Tables for Business Operations

  ## Overview
  Creates fundamental tables for customers, suppliers, and products that are required
  for purchase and sales operations.

  ## Tables Created

  ### 1. customers
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key) - References auth.users
  - `customer_code` (text, unique) - Auto-generated customer code
  - `name` (text) - Customer name
  - `email` (text) - Customer email
  - `phone` (text) - Customer phone
  - `address` (text) - Customer address
  - `city` (text) - City
  - `country` (text) - Country
  - `tax_number` (text) - Tax identification number
  - `credit_limit` (decimal) - Credit limit
  - `balance` (decimal) - Current balance
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. suppliers
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key) - References auth.users
  - `supplier_code` (text, unique) - Auto-generated supplier code
  - `name` (text) - Supplier name
  - `email` (text) - Supplier email
  - `phone` (text) - Supplier phone
  - `address` (text) - Supplier address
  - `city` (text) - City
  - `country` (text) - Country
  - `tax_number` (text) - Tax identification number
  - `credit_limit` (decimal) - Credit limit
  - `balance` (decimal) - Current balance
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. products
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key) - References auth.users
  - `product_code` (text, unique) - Auto-generated product code
  - `name` (text) - Product name
  - `description` (text) - Product description
  - `category` (text) - Product category
  - `unit` (text) - Unit of measurement
  - `cost_price` (decimal) - Purchase cost price
  - `selling_price` (decimal) - Selling price
  - `tax_rate` (decimal) - Tax rate percentage
  - `stock_quantity` (decimal) - Current stock quantity
  - `min_stock_level` (decimal) - Minimum stock level for alerts
  - `is_active` (boolean) - Product active status
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access their own records
  - Policies for SELECT, INSERT, UPDATE, DELETE operations

  ## Indexes
  - Created on foreign keys and frequently queried columns
*/

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  customer_code text UNIQUE NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  address text,
  city text,
  country text DEFAULT 'السعودية',
  tax_number text,
  credit_limit decimal(15,2) DEFAULT 0,
  balance decimal(15,2) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  supplier_code text UNIQUE NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  address text,
  city text,
  country text DEFAULT 'السعودية',
  tax_number text,
  credit_limit decimal(15,2) DEFAULT 0,
  balance decimal(15,2) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  category text,
  unit text DEFAULT 'قطعة',
  cost_price decimal(15,2) DEFAULT 0,
  selling_price decimal(15,2) DEFAULT 0,
  tax_rate decimal(5,2) DEFAULT 15,
  stock_quantity decimal(15,2) DEFAULT 0,
  min_stock_level decimal(15,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customers
CREATE POLICY "Users can view own customers"
  ON customers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own customers"
  ON customers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for suppliers
CREATE POLICY "Users can view own suppliers"
  ON suppliers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own suppliers"
  ON suppliers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own suppliers"
  ON suppliers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own suppliers"
  ON suppliers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for products
CREATE POLICY "Users can view own products"
  ON products FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products"
  ON products FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own products"
  ON products FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Triggers for updated_at
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();