-- Create Customers table (العملاء)
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  tax_number TEXT,
  customer_type TEXT DEFAULT 'individual',
  balance DECIMAL(15,2) DEFAULT 0,
  credit_limit DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Suppliers table (الموردين)
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  tax_number TEXT,
  balance DECIMAL(15,2) DEFAULT 0,
  credit_limit DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Products table (المنتجات)
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  description TEXT,
  category TEXT,
  unit TEXT DEFAULT 'piece',
  cost_price DECIMAL(15,2) DEFAULT 0,
  selling_price DECIMAL(15,2) NOT NULL,
  quantity DECIMAL(15,2) DEFAULT 0,
  min_stock_level DECIMAL(15,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Sales Invoices table (فواتير المبيعات)
CREATE TABLE public.sales_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  invoice_number TEXT NOT NULL,
  customer_id UUID REFERENCES public.customers(id),
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT DEFAULT 'draft',
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  paid_amount DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Sales Invoice Items table
CREATE TABLE public.sales_invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.sales_invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  description TEXT NOT NULL,
  quantity DECIMAL(15,2) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  discount_rate DECIMAL(5,2) DEFAULT 0,
  total DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Purchase Invoices table (فواتير المشتريات)
CREATE TABLE public.purchase_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  invoice_number TEXT NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id),
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT DEFAULT 'draft',
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  paid_amount DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Purchase Invoice Items table
CREATE TABLE public.purchase_invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.purchase_invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  description TEXT NOT NULL,
  quantity DECIMAL(15,2) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  discount_rate DECIMAL(5,2) DEFAULT 0,
  total DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_invoice_items ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for Customers
CREATE POLICY "Users can view their own customers"
  ON public.customers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own customers"
  ON public.customers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customers"
  ON public.customers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own customers"
  ON public.customers FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS Policies for Suppliers
CREATE POLICY "Users can view their own suppliers"
  ON public.suppliers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own suppliers"
  ON public.suppliers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own suppliers"
  ON public.suppliers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own suppliers"
  ON public.suppliers FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS Policies for Products
CREATE POLICY "Users can view their own products"
  ON public.products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own products"
  ON public.products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products"
  ON public.products FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products"
  ON public.products FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS Policies for Sales Invoices
CREATE POLICY "Users can view their own sales invoices"
  ON public.sales_invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sales invoices"
  ON public.sales_invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sales invoices"
  ON public.sales_invoices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sales invoices"
  ON public.sales_invoices FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS Policies for Sales Invoice Items
CREATE POLICY "Users can view invoice items through invoice"
  ON public.sales_invoice_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sales_invoices
      WHERE sales_invoices.id = sales_invoice_items.invoice_id
      AND sales_invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create invoice items through invoice"
  ON public.sales_invoice_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sales_invoices
      WHERE sales_invoices.id = sales_invoice_items.invoice_id
      AND sales_invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update invoice items through invoice"
  ON public.sales_invoice_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.sales_invoices
      WHERE sales_invoices.id = sales_invoice_items.invoice_id
      AND sales_invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete invoice items through invoice"
  ON public.sales_invoice_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.sales_invoices
      WHERE sales_invoices.id = sales_invoice_items.invoice_id
      AND sales_invoices.user_id = auth.uid()
    )
  );

-- Create RLS Policies for Purchase Invoices
CREATE POLICY "Users can view their own purchase invoices"
  ON public.purchase_invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own purchase invoices"
  ON public.purchase_invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchase invoices"
  ON public.purchase_invoices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own purchase invoices"
  ON public.purchase_invoices FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS Policies for Purchase Invoice Items
CREATE POLICY "Users can view purchase invoice items through invoice"
  ON public.purchase_invoice_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.purchase_invoices
      WHERE purchase_invoices.id = purchase_invoice_items.invoice_id
      AND purchase_invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create purchase invoice items through invoice"
  ON public.purchase_invoice_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.purchase_invoices
      WHERE purchase_invoices.id = purchase_invoice_items.invoice_id
      AND purchase_invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update purchase invoice items through invoice"
  ON public.purchase_invoice_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.purchase_invoices
      WHERE purchase_invoices.id = purchase_invoice_items.invoice_id
      AND purchase_invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete purchase invoice items through invoice"
  ON public.purchase_invoice_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.purchase_invoices
      WHERE purchase_invoices.id = purchase_invoice_items.invoice_id
      AND purchase_invoices.user_id = auth.uid()
    )
  );

-- Create triggers for updated_at
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_invoices_updated_at
  BEFORE UPDATE ON public.sales_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchase_invoices_updated_at
  BEFORE UPDATE ON public.purchase_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_customers_user_id ON public.customers(user_id);
CREATE INDEX idx_suppliers_user_id ON public.suppliers(user_id);
CREATE INDEX idx_products_user_id ON public.products(user_id);
CREATE INDEX idx_sales_invoices_user_id ON public.sales_invoices(user_id);
CREATE INDEX idx_sales_invoices_customer_id ON public.sales_invoices(customer_id);
CREATE INDEX idx_sales_invoice_items_invoice_id ON public.sales_invoice_items(invoice_id);
CREATE INDEX idx_purchase_invoices_user_id ON public.purchase_invoices(user_id);
CREATE INDEX idx_purchase_invoices_supplier_id ON public.purchase_invoices(supplier_id);
CREATE INDEX idx_purchase_invoice_items_invoice_id ON public.purchase_invoice_items(invoice_id);