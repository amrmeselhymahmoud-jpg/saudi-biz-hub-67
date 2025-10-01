/*
  # Create Purchase Management Tables

  ## Overview
  Creates comprehensive tables for purchase management including purchase orders,
  purchase invoices, simple invoices, and supplier bonds.

  ## Tables Created

  ### 1. purchase_orders
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key) - References auth.users
  - `order_number` (text, unique) - Auto-generated order number
  - `supplier_id` (uuid, foreign key) - References suppliers table
  - `order_date` (date) - Date of order
  - `delivery_date` (date) - Expected delivery date
  - `status` (text) - Order status: draft, sent, received, cancelled
  - `items` (jsonb) - Array of order items with product details
  - `subtotal` (decimal) - Subtotal before tax
  - `tax_amount` (decimal) - Total tax amount
  - `total_amount` (decimal) - Total amount including tax
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. purchase_invoices
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key) - References auth.users
  - `invoice_number` (text, unique) - Auto-generated invoice number
  - `supplier_id` (uuid, foreign key) - References suppliers table
  - `purchase_order_id` (uuid, foreign key, nullable) - Optional link to purchase order
  - `invoice_date` (date) - Date of invoice
  - `due_date` (date) - Payment due date
  - `status` (text) - Invoice status: draft, pending, paid, overdue, cancelled
  - `payment_status` (text) - Payment status: unpaid, partial, paid
  - `items` (jsonb) - Array of invoice items with product details
  - `subtotal` (decimal) - Subtotal before tax
  - `tax_amount` (decimal) - Total tax amount
  - `discount_amount` (decimal) - Discount amount
  - `total_amount` (decimal) - Total amount including tax and discount
  - `paid_amount` (decimal) - Amount paid so far
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. simple_invoices
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key) - References auth.users
  - `invoice_number` (text, unique) - Auto-generated invoice number
  - `recipient_name` (text) - Name of recipient
  - `recipient_phone` (text) - Phone number
  - `invoice_date` (date) - Date of invoice
  - `description` (text) - Simple description of items/services
  - `amount` (decimal) - Total amount
  - `status` (text) - Invoice status: draft, issued, paid, cancelled
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. supplier_bonds
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key) - References auth.users
  - `bond_number` (text, unique) - Auto-generated bond number
  - `supplier_id` (uuid, foreign key) - References suppliers table
  - `bond_type` (text) - Type: payment, receipt
  - `bond_date` (date) - Date of bond
  - `amount` (decimal) - Bond amount
  - `payment_method` (text) - Payment method: cash, bank_transfer, check, credit_card
  - `reference_number` (text) - Check number or transaction reference
  - `description` (text) - Description of bond
  - `status` (text) - Bond status: draft, issued, cleared, cancelled
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access their own records
  - Policies for SELECT, INSERT, UPDATE, DELETE operations

  ## Indexes
  - Created on foreign keys and frequently queried columns for better performance
*/

-- Create purchase_orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_number text UNIQUE NOT NULL,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE RESTRICT NOT NULL,
  order_date date DEFAULT CURRENT_DATE NOT NULL,
  delivery_date date,
  status text DEFAULT 'draft' NOT NULL CHECK (status IN ('draft', 'sent', 'received', 'cancelled')),
  items jsonb DEFAULT '[]'::jsonb NOT NULL,
  subtotal decimal(15,2) DEFAULT 0 NOT NULL,
  tax_amount decimal(15,2) DEFAULT 0 NOT NULL,
  total_amount decimal(15,2) DEFAULT 0 NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create purchase_invoices table
CREATE TABLE IF NOT EXISTS purchase_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invoice_number text UNIQUE NOT NULL,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE RESTRICT NOT NULL,
  purchase_order_id uuid REFERENCES purchase_orders(id) ON DELETE SET NULL,
  invoice_date date DEFAULT CURRENT_DATE NOT NULL,
  due_date date,
  status text DEFAULT 'draft' NOT NULL CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'cancelled')),
  payment_status text DEFAULT 'unpaid' NOT NULL CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
  items jsonb DEFAULT '[]'::jsonb NOT NULL,
  subtotal decimal(15,2) DEFAULT 0 NOT NULL,
  tax_amount decimal(15,2) DEFAULT 0 NOT NULL,
  discount_amount decimal(15,2) DEFAULT 0 NOT NULL,
  total_amount decimal(15,2) DEFAULT 0 NOT NULL,
  paid_amount decimal(15,2) DEFAULT 0 NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create simple_invoices table
CREATE TABLE IF NOT EXISTS simple_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invoice_number text UNIQUE NOT NULL,
  recipient_name text NOT NULL,
  recipient_phone text,
  invoice_date date DEFAULT CURRENT_DATE NOT NULL,
  description text NOT NULL,
  amount decimal(15,2) NOT NULL,
  status text DEFAULT 'draft' NOT NULL CHECK (status IN ('draft', 'issued', 'paid', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create supplier_bonds table
CREATE TABLE IF NOT EXISTS supplier_bonds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bond_number text UNIQUE NOT NULL,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE RESTRICT NOT NULL,
  bond_type text NOT NULL CHECK (bond_type IN ('payment', 'receipt')),
  bond_date date DEFAULT CURRENT_DATE NOT NULL,
  amount decimal(15,2) NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'check', 'credit_card')),
  reference_number text,
  description text NOT NULL,
  status text DEFAULT 'draft' NOT NULL CHECK (status IN ('draft', 'issued', 'cleared', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE simple_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_bonds ENABLE ROW LEVEL SECURITY;

-- RLS Policies for purchase_orders
CREATE POLICY "Users can view own purchase orders"
  ON purchase_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchase orders"
  ON purchase_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own purchase orders"
  ON purchase_orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own purchase orders"
  ON purchase_orders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for purchase_invoices
CREATE POLICY "Users can view own purchase invoices"
  ON purchase_invoices FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchase invoices"
  ON purchase_invoices FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own purchase invoices"
  ON purchase_invoices FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own purchase invoices"
  ON purchase_invoices FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for simple_invoices
CREATE POLICY "Users can view own simple invoices"
  ON simple_invoices FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own simple invoices"
  ON simple_invoices FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own simple invoices"
  ON simple_invoices FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own simple invoices"
  ON simple_invoices FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for supplier_bonds
CREATE POLICY "Users can view own supplier bonds"
  ON supplier_bonds FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own supplier bonds"
  ON supplier_bonds FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own supplier bonds"
  ON supplier_bonds FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own supplier bonds"
  ON supplier_bonds FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_purchase_orders_user_id ON purchase_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_date ON purchase_orders(order_date);

CREATE INDEX IF NOT EXISTS idx_purchase_invoices_user_id ON purchase_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_supplier_id ON purchase_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_status ON purchase_invoices(status);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_invoice_date ON purchase_invoices(invoice_date);

CREATE INDEX IF NOT EXISTS idx_simple_invoices_user_id ON simple_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_simple_invoices_status ON simple_invoices(status);
CREATE INDEX IF NOT EXISTS idx_simple_invoices_invoice_date ON simple_invoices(invoice_date);

CREATE INDEX IF NOT EXISTS idx_supplier_bonds_user_id ON supplier_bonds(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_bonds_supplier_id ON supplier_bonds(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_bonds_status ON supplier_bonds(status);
CREATE INDEX IF NOT EXISTS idx_supplier_bonds_bond_date ON supplier_bonds(bond_date);

-- Triggers for updated_at
CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_invoices_updated_at
  BEFORE UPDATE ON purchase_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_simple_invoices_updated_at
  BEFORE UPDATE ON simple_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_bonds_updated_at
  BEFORE UPDATE ON supplier_bonds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();