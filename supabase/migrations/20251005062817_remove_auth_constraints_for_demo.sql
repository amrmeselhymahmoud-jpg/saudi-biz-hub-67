/*
  # Remove Auth Constraints for Demo Mode

  Make created_by field nullable and remove foreign key constraint
  to allow demo mode without authentication
*/

-- Drop foreign key constraint on customers
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_created_by_fkey;

-- Drop foreign key constraint on customer_bonds
ALTER TABLE customer_bonds DROP CONSTRAINT IF EXISTS customer_bonds_created_by_fkey;