/*
  # Add Payment Method and Auto-Calculate Payment Status

  1. **New Columns**
    - Add `payment_method` column to `sales_invoices` table
    - Values: 'cash', 'transfer', 'card', 'credit' (آجل)

  2. **Business Logic**
    - When payment_method = 'credit' → payment_status = 'unpaid'
    - When payment_method = 'cash' OR 'transfer' OR 'card' → payment_status = 'paid'

  3. **Functions Created**
    - `calculate_payment_status()` - Calculates status based on payment_method
    - Auto-updates paid_amount and remaining_amount accordingly

  4. **Triggers Created**
    - Trigger on INSERT to set payment_status automatically
    - Trigger on UPDATE to recalculate when payment_method changes

  5. **Security**
    - Maintains data integrity
    - Ensures consistent payment status across the system
*/

-- Add payment_method column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sales_invoices' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE sales_invoices 
    ADD COLUMN payment_method text DEFAULT 'credit' CHECK (payment_method IN ('cash', 'transfer', 'card', 'credit'));
  END IF;
END $$;

-- Create function to calculate payment status based on payment method
CREATE OR REPLACE FUNCTION calculate_payment_status_from_method()
RETURNS TRIGGER AS $$
BEGIN
  -- If payment method is credit (آجل), set as unpaid
  IF NEW.payment_method = 'credit' THEN
    NEW.payment_status := 'unpaid';
    NEW.paid_amount := 0;
    NEW.remaining_amount := NEW.total_amount;
  
  -- If payment method is cash, transfer, or card, set as paid
  ELSIF NEW.payment_method IN ('cash', 'transfer', 'card') THEN
    NEW.payment_status := 'paid';
    NEW.paid_amount := NEW.total_amount;
    NEW.remaining_amount := 0;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_calculate_payment_status_on_insert ON sales_invoices;
DROP TRIGGER IF EXISTS trigger_calculate_payment_status_on_update ON sales_invoices;

-- Create trigger for INSERT
CREATE TRIGGER trigger_calculate_payment_status_on_insert
  BEFORE INSERT ON sales_invoices
  FOR EACH ROW
  EXECUTE FUNCTION calculate_payment_status_from_method();

-- Create trigger for UPDATE (only when payment_method changes)
CREATE TRIGGER trigger_calculate_payment_status_on_update
  BEFORE UPDATE OF payment_method ON sales_invoices
  FOR EACH ROW
  WHEN (OLD.payment_method IS DISTINCT FROM NEW.payment_method)
  EXECUTE FUNCTION calculate_payment_status_from_method();