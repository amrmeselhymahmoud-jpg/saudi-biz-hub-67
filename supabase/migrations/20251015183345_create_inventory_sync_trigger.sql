/*
  # Create Inventory Synchronization System

  1. **Purpose**
    - Automatically update product inventory when sales invoices are created
    - Deduct quantities from stock when invoice items are added
    - Ensure data integrity between sales and inventory

  2. **Functions Created**
    - `sync_inventory_on_sales()` - Deducts inventory when invoice items are inserted

  3. **Triggers Created**
    - Trigger on `sales_invoice_items` AFTER INSERT
    - Automatically updates `products` table inventory

  4. **Security**
    - Function executes with SECURITY DEFINER to ensure proper permissions
    - Only affects inventory for valid product IDs
*/

-- Create function to sync inventory
CREATE OR REPLACE FUNCTION sync_inventory_on_sales()
RETURNS TRIGGER AS $$
BEGIN
  -- Update product inventory by deducting the sold quantity
  UPDATE products
  SET 
    current_stock = COALESCE(current_stock, 0) - NEW.quantity,
    updated_at = now()
  WHERE id = NEW.product_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_sync_inventory_on_sales ON sales_invoice_items;

-- Create trigger
CREATE TRIGGER trigger_sync_inventory_on_sales
  AFTER INSERT ON sales_invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION sync_inventory_on_sales();