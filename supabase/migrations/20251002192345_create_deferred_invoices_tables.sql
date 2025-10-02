-- Create Comprehensive Deferred Invoices System Tables
-- Overview: Complete system for managing deferred/credit invoices with installment payments

-- Table 1: Deferred Invoices
CREATE TABLE IF NOT EXISTS deferred_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invoice_number text UNIQUE NOT NULL,
  invoice_type text DEFAULT 'مبيعات' CHECK (invoice_type IN ('مبيعات', 'مشتريات')),
  customer_supplier_name text NOT NULL,
  customer_supplier_phone text,
  customer_supplier_email text,
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  total_amount decimal(12,2) NOT NULL DEFAULT 0,
  paid_amount decimal(12,2) DEFAULT 0,
  remaining_amount decimal(12,2) NOT NULL DEFAULT 0,
  currency text DEFAULT 'ر.س',
  payment_terms text,
  number_of_installments integer DEFAULT 1,
  installment_frequency text DEFAULT 'شهري' CHECK (installment_frequency IN ('شهري', 'ربع سنوي', 'نصف سنوي', 'سنوي', 'أسبوعي')),
  status text DEFAULT 'نشط' CHECK (status IN ('نشط', 'مكتمل', 'متأخر', 'ملغي')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table 2: Invoice Items (for deferred invoices)
CREATE TABLE IF NOT EXISTS deferred_invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invoice_id uuid REFERENCES deferred_invoices(id) ON DELETE CASCADE NOT NULL,
  item_name text NOT NULL,
  description text,
  quantity decimal(10,2) NOT NULL DEFAULT 1,
  unit_price decimal(12,2) NOT NULL DEFAULT 0,
  discount_percent decimal(5,2) DEFAULT 0,
  tax_percent decimal(5,2) DEFAULT 0,
  total_amount decimal(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Table 3: Installment Schedule
CREATE TABLE IF NOT EXISTS installment_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invoice_id uuid REFERENCES deferred_invoices(id) ON DELETE CASCADE NOT NULL,
  installment_number integer NOT NULL,
  due_date date NOT NULL,
  amount decimal(12,2) NOT NULL DEFAULT 0,
  paid_amount decimal(12,2) DEFAULT 0,
  status text DEFAULT 'معلق' CHECK (status IN ('معلق', 'مدفوع', 'متأخر', 'مدفوع جزئي')),
  payment_date date,
  payment_method text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table 4: Payment Transactions
CREATE TABLE IF NOT EXISTS deferred_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invoice_id uuid REFERENCES deferred_invoices(id) ON DELETE CASCADE NOT NULL,
  installment_id uuid REFERENCES installment_schedule(id) ON DELETE SET NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  amount decimal(12,2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'نقدي' CHECK (payment_method IN ('نقدي', 'بنكي', 'شيك', 'بطاقة ائتمان', 'تحويل إلكتروني')),
  reference_number text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE deferred_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE deferred_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE installment_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE deferred_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deferred_invoices
CREATE POLICY "Users can view own deferred invoices"
  ON deferred_invoices FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deferred invoices"
  ON deferred_invoices FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deferred invoices"
  ON deferred_invoices FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own deferred invoices"
  ON deferred_invoices FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for deferred_invoice_items
CREATE POLICY "Users can view own invoice items"
  ON deferred_invoice_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own invoice items"
  ON deferred_invoice_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invoice items"
  ON deferred_invoice_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own invoice items"
  ON deferred_invoice_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for installment_schedule
CREATE POLICY "Users can view own installment schedule"
  ON installment_schedule FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own installment schedule"
  ON installment_schedule FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own installment schedule"
  ON installment_schedule FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own installment schedule"
  ON installment_schedule FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for deferred_payments
CREATE POLICY "Users can view own deferred payments"
  ON deferred_payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deferred payments"
  ON deferred_payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deferred payments"
  ON deferred_payments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own deferred payments"
  ON deferred_payments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_deferred_invoices_user_id ON deferred_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_deferred_invoices_status ON deferred_invoices(status);
CREATE INDEX IF NOT EXISTS idx_deferred_invoice_items_invoice_id ON deferred_invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_installment_schedule_invoice_id ON installment_schedule(invoice_id);
CREATE INDEX IF NOT EXISTS idx_installment_schedule_status ON installment_schedule(status);
CREATE INDEX IF NOT EXISTS idx_deferred_payments_invoice_id ON deferred_payments(invoice_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_deferred_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_deferred_invoices_updated_at
  BEFORE UPDATE ON deferred_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_deferred_updated_at();

CREATE TRIGGER update_installment_schedule_updated_at
  BEFORE UPDATE ON installment_schedule
  FOR EACH ROW
  EXECUTE FUNCTION update_deferred_updated_at();

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_deferred_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num integer;
  prefix text;
BEGIN
  IF NEW.invoice_type = 'مبيعات' THEN
    prefix := 'DFS-';
  ELSE
    prefix := 'DFP-';
  END IF;
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM LENGTH(prefix) + 1) AS integer)), 0) + 1
  INTO next_num
  FROM deferred_invoices
  WHERE user_id = NEW.user_id AND invoice_type = NEW.invoice_type;
  
  NEW.invoice_number := prefix || LPAD(next_num::text, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate invoice number
CREATE TRIGGER generate_deferred_invoice_number_trigger
  BEFORE INSERT ON deferred_invoices
  FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '')
  EXECUTE FUNCTION generate_deferred_invoice_number();

-- Function to update invoice status based on payments
CREATE OR REPLACE FUNCTION update_deferred_invoice_status()
RETURNS TRIGGER AS $$
DECLARE
  v_total_paid decimal(12,2);
  v_total_amount decimal(12,2);
BEGIN
  SELECT 
    COALESCE(SUM(amount), 0),
    (SELECT total_amount FROM deferred_invoices WHERE id = NEW.invoice_id)
  INTO v_total_paid, v_total_amount
  FROM deferred_payments
  WHERE invoice_id = NEW.invoice_id;
  
  UPDATE deferred_invoices
  SET 
    paid_amount = v_total_paid,
    remaining_amount = v_total_amount - v_total_paid,
    status = CASE 
      WHEN v_total_paid >= v_total_amount THEN 'مكتمل'
      ELSE status
    END
  WHERE id = NEW.invoice_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update invoice status on payment
CREATE TRIGGER update_invoice_status_on_payment
  AFTER INSERT OR UPDATE ON deferred_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_deferred_invoice_status();