import { Receipt, Plus, Search, MoreHorizontal, Eye, Trash2, Loader2, DollarSign, FileText, CheckCircle2, Clock, CircleX, Printer, Edit, Download } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { amiriRegularBase64 } from "@/utils/arabicFont";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { safeFormatDate, formatCurrency, safeToLocaleString } from "@/utils/formatters";

// Safe value helper
const safeValue = (value: any, fallback: string = 'N/A'): string => {
  try {
    if (value === null || value === undefined || value === '') return fallback;
    if (typeof value === 'number' && isNaN(value)) return fallback;
    return String(value);
  } catch (error) {
    console.error('Error in safeValue:', error);
    return fallback;
  }
};

// Enhanced payment status calculation
const getPaymentStatus = (paymentMethod: string, paidAmount: number, totalAmount: number): string => {
  if (paymentMethod === 'cash' && paidAmount >= totalAmount) {
    return 'paid';
  } else if (paidAmount > 0 && paidAmount < totalAmount) {
    return 'partial';
  } else if (paymentMethod === 'credit' && paidAmount === 0) {
    return 'unpaid';
  }
  return paidAmount >= totalAmount ? 'paid' : 'unpaid';
};

interface Customer {
  id: string;
  customer_name: string;
  email: string | null;
  phone: string | null;
}

interface Product {
  id: string;
  product_name: string;
  selling_price: number;
  tax_rate: number;
  stock_quantity: number;
}

interface InvoiceItem {
  id?: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  tax_amount: number;
  discount: number;
  total: number;
}

interface SalesInvoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  discount: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  payment_status: string;
  payment_method: string;
  notes: string | null;
  status: string;
  created_at: string;
  customers?: Customer;
}

// Enhanced invoice normalization with better validation
const normalizeInvoice = (invoice: any): SalesInvoice | null => {
  try {
    if (!invoice || !invoice.id || !invoice.invoice_number) {
      console.warn('Invalid invoice data:', invoice);
      return null;
    }

    const subtotal = parseFloat(invoice.subtotal) || 0;
    const taxAmount = parseFloat(invoice.tax_amount) || 0;
    const discount = parseFloat(invoice.discount) || 0;
    const totalAmount = parseFloat(invoice.total_amount) || 0;
    const paidAmount = parseFloat(invoice.paid_amount) || 0;
    const remainingAmount = parseFloat(invoice.remaining_amount) || (totalAmount - paidAmount);

    const paymentStatus = getPaymentStatus(
      invoice.payment_method || 'credit',
      paidAmount,
      totalAmount
    );

    return {
      id: String(invoice.id),
      invoice_number: String(invoice.invoice_number),
      customer_id: String(invoice.customer_id || ''),
      invoice_date: invoice.invoice_date || new Date().toISOString(),
      due_date: invoice.due_date || invoice.invoice_date || new Date().toISOString(),
      subtotal,
      tax_amount: taxAmount,
      discount,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      remaining_amount: remainingAmount,
      payment_status: paymentStatus,
      payment_method: invoice.payment_method || 'credit',
      notes: invoice.notes || null,
      status: invoice.status || 'draft',
      created_at: invoice.created_at || new Date().toISOString(),
      customers: invoice.customers || undefined,
    };
  } catch (error) {
    console.error('Error normalizing invoice:', error, invoice);
    return null;
  }
};

const SalesInvoices = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<SalesInvoice | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [invoiceToPrint, setInvoiceToPrint] = useState<SalesInvoice | null>(null);

  const [formData, setFormData] = useState({
    customer_id: "",
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: "",
    payment_method: "credit"
  });

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [newItem, setNewItem] = useState({
    product_id: "",
    quantity: "1",
    discount: "0",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Enhanced query with better error handling and caching
  const { 
    data: invoicesData = [], 
    isLoading, 
    error: queryError,
    refetch 
  } = useQuery({
    queryKey: ["sales-invoices"],
    queryFn: async () => {
      try {
        console.log('Fetching sales invoices...');
        const { data, error } = await supabase
          .from("sales_invoices")
          .select(`
            *,
            customers (
              id,
              customer_name,
              email,
              phone
            )
          `)
          .order("created_at", { ascending: false });

        if (error) {
          console.error('Supabase query error:', error);
          throw new Error(`فشل في تحميل الفواتير: ${error.message}`);
        }

        console.log('Fetched invoices:', data?.length);
        return data || [];
      } catch (error) {
        console.error('Fetch error:', error);
        throw error;
      }
    },
    retry: 2,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Safe data normalization with memoization
  const invoices = useMemo(() => {
    try {
      if (!Array.isArray(invoicesData)) {
        console.warn('invoicesData is not an array:', invoicesData);
        return [];
      }
      
      const normalized = invoicesData
        .map(normalizeInvoice)
        .filter((inv): inv is SalesInvoice => inv !== null);
      
      console.log('Normalized invoices:', normalized.length);
      return normalized;
    } catch (error) {
      console.error('Error processing invoices:', error);
      return [];
    }
  }, [invoicesData]);

  // Enhanced customers query
  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("customers")
          .select("id, customer_name, email, phone")
          .eq("status", "active")
          .order("customer_name");

        if (error) {
          console.error('Customers fetch error:', error);
          throw error;
        }
        return data || [];
      } catch (error) {
        console.error('Customers query error:', error);
        return [];
      }
    },
    retry: 2,
  });

  // Enhanced products query with stock validation
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("id, product_name, selling_price, tax_rate, stock_quantity")
          .eq("status", "active")
          .order("product_name");

        if (error) {
          console.error('Products fetch error:', error);
          throw error;
        }
        return data || [];
      } catch (error) {
        console.error('Products query error:', error);
        return [];
      }
    },
    retry: 2,
  });

  // Enhanced delete mutation
  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      try {
        if (!invoiceId) {
          throw new Error("معرف الفاتورة غير صحيح");
        }

        console.log('Deleting invoice:', invoiceId);
        
        // First delete related items
        const { error: itemsError } = await supabase
          .from("sales_invoice_items")
          .delete()
          .eq("invoice_id", invoiceId);

        if (itemsError) {
          console.error('Error deleting invoice items:', itemsError);
          throw new Error(`فشل في حذف بنود الفاتورة: ${itemsError.message}`);
        }

        // Then delete the invoice
        const { error } = await supabase
          .from("sales_invoices")
          .delete()
          .eq("id", invoiceId);

        if (error) {
          console.error('Error deleting invoice:', error);
          throw new Error(`فشل في حذف الفاتورة: ${error.message}`);
        }

        return true;
      } catch (error) {
        console.error('Delete mutation error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      try {
        queryClient.invalidateQueries({ queryKey: ["sales-invoices"] });
        toast({ 
          title: "تم الحذف بنجاح", 
          description: "تم حذف الفاتورة وجميع بنودها بنجاح" 
        });
        setDeleteDialogOpen(false);
        setInvoiceToDelete(null);
      } catch (error) {
        console.error('Error after delete success:', error);
      }
    },
    onError: (error: Error) => {
      console.error('Delete error:', error);
      toast({ 
        title: "خطأ في الحذف", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Enhanced create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async () => {
      try {
        // Validation
        if (items.length === 0) {
          throw new Error("يجب إضافة منتج واحد على الأقل");
        }
        
        if (!formData.customer_id) {
          throw new Error("يجب اختيار عميل");
        }
        
        if (!formData.invoice_date) {
          throw new Error("يجب تحديد تاريخ الفاتورة");
        }

        // Validate stock availability
        for (const item of items) {
          const product = products.find(p => p.id === item.product_id);
          if (product && product.stock_quantity < item.quantity) {
            throw new Error(`الكمية المطلوبة للمنتج ${product.product_name} غير متوفرة في المخزون`);
          }
        }

        const invoiceNumber = `INV-${Date.now()}`;
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
        const taxAmount = items.reduce((sum, item) => sum + item.tax_amount, 0);
        const discount = items.reduce((sum, item) => sum + item.discount, 0);
        const totalAmount = subtotal + taxAmount - discount;
        const paidAmount = formData.payment_method === 'cash' ? totalAmount : 0;
        const remainingAmount = totalAmount - paidAmount;

        console.log('Creating invoice with data:', {
          invoiceNumber,
          customer_id: formData.customer_id,
          totalAmount,
          itemsCount: items.length
        });

        // Create invoice
        const { data: invoice, error: invoiceError } = await supabase
          .from("sales_invoices")
          .insert({
            invoice_number: invoiceNumber,
            customer_id: formData.customer_id,
            invoice_date: formData.invoice_date,
            due_date: formData.due_date,
            subtotal,
            tax_amount: taxAmount,
            discount,
            total_amount: totalAmount,
            paid_amount: paidAmount,
            remaining_amount: remainingAmount,
            payment_status: getPaymentStatus(formData.payment_method, paidAmount, totalAmount),
            payment_method: formData.payment_method,
            status: "posted",
            notes: formData.notes || null,
          })
          .select()
          .single();

        if (invoiceError) {
          console.error('Invoice creation error:', invoiceError);
          throw new Error(`فشل في إنشاء الفاتورة: ${invoiceError.message}`);
        }

        if (!invoice) {
          throw new Error("فشل في إنشاء الفاتورة - لا توجد بيانات مسترجعة");
        }

        console.log('Invoice created, ID:', invoice.id);

        // Prepare items for insertion
        const itemsToInsert = items.map(item => ({
          invoice_id: invoice.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate,
          tax_amount: item.tax_amount,
          discount: item.discount,
          total: item.total,
        }));

        // Insert items
        const { error: itemsError } = await supabase
          .from("sales_invoice_items")
          .insert(itemsToInsert);

        if (itemsError) {
          console.error('Items insertion error:', itemsError);
          throw new Error(`فشل في إضافة بنود الفاتورة: ${itemsError.message}`);
        }

        // Update product stock
        for (const item of items) {
          const product = products.find(p => p.id === item.product_id);
          if (product) {
            const newStock = product.stock_quantity - item.quantity;
            const { error: stockError } = await supabase
              .from("products")
              .update({ stock_quantity: newStock })
              .eq("id", item.product_id);

            if (stockError) {
              console.error('Stock update error:', stockError);
              // Don't throw here, just log the error
            }
          }
        }

        return invoice;
      } catch (error) {
        console.error('Create invoice error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      try {
        queryClient.invalidateQueries({ queryKey: ["sales-invoices"] });
        queryClient.invalidateQueries({ queryKey: ["products"] });
        toast({ 
          title: "تم الإنشاء بنجاح", 
          description: `تم إنشاء الفاتورة ${data.invoice_number} بنجاح` 
        });
        setAddDialogOpen(false);
        resetForm();
      } catch (error) {
        console.error('Error after create success:', error);
      }
    },
    onError: (error: Error) => {
      console.error('Create invoice mutation error:', error);
      toast({ 
        title: "خطأ في الإنشاء", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Enhanced update mutation
  const updateInvoiceMutation = useMutation({
    mutationFn: async (data: { 
      id: string; 
      invoice_date: string; 
      due_date: string; 
      notes: string | null; 
      payment_method?: string;
      payment_status?: string;
    }) => {
      try {
        const updateData: any = {
          invoice_date: data.invoice_date,
          due_date: data.due_date,
          notes: data.notes,
        };

        if (data.payment_method) {
          updateData.payment_method = data.payment_method;
        }

        if (data.payment_status) {
          updateData.payment_status = data.payment_status;
        }

        console.log('Updating invoice:', data.id, updateData);

        const { error } = await supabase
          .from("sales_invoices")
          .update(updateData)
          .eq("id", data.id);

        if (error) {
          console.error('Update error:', error);
          throw new Error(`فشل في تحديث الفاتورة: ${error.message}`);
        }

        return true;
      } catch (error) {
        console.error('Update mutation error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      try {
        queryClient.invalidateQueries({ queryKey: ["sales-invoices"] });
        toast({ 
          title: "تم التحديث بنجاح", 
          description: "تم تحديث الفاتورة بنجاح" 
        });
        setEditDialogOpen(false);
        setEditInvoice(null);
      } catch (error) {
        console.error('Error after update success:', error);
      }
    },
    onError: (error: Error) => {
      console.error('Update error:', error);
      toast({ 
        title: "خطأ في التحديث", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Reset form function
  const resetForm = () => {
    try {
      setFormData({
        customer_id: "",
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: "",
        payment_method: "credit"
      });
      setItems([]);
      setNewItem({ product_id: "", quantity: "1", discount: "0" });
    } catch (error) {
      console.error('Error resetting form:', error);
    }
  };

  // Enhanced add item function with stock validation
  const addItem = () => {
    try {
      const product = products.find(p => p.id === newItem.product_id);
      if (!product) {
        toast({ 
          title: "خطأ", 
          description: "يرجى اختيار منتج صحيح", 
          variant: "destructive" 
        });
        return;
      }

      const quantity = parseInt(newItem.quantity) || 0;
      const discount = parseFloat(newItem.discount) || 0;

      if (quantity <= 0) {
        toast({ 
          title: "خطأ", 
          description: "الكمية يجب أن تكون أكبر من صفر", 
          variant: "destructive" 
        });
        return;
      }

      // Check stock availability
      if (product.stock_quantity < quantity) {
        toast({ 
          title: "خطأ في المخزون", 
          description: `الكمية المطلوبة غير متوفرة. المخزون الحالي: ${product.stock_quantity}`,
          variant: "destructive" 
        });
        return;
      }

      const unitPrice = product.selling_price || 0;
      const lineTotal = quantity * unitPrice;
      const taxAmount = (lineTotal * (product.tax_rate || 0)) / 100;
      const total = lineTotal + taxAmount - discount;

      const item: InvoiceItem = {
        product_id: product.id,
        product_name: product.product_name,
        quantity,
        unit_price: unitPrice,
        tax_rate: product.tax_rate || 0,
        tax_amount: taxAmount,
        discount,
        total,
      };

      setItems([...items, item]);
      setNewItem({ product_id: "", quantity: "1", discount: "0" });
      
      toast({
        title: "تم الإضافة",
        description: "تم إضافة المنتج إلى الفاتورة بنجاح"
      });
    } catch (error) {
      console.error('Error adding item:', error);
      toast({ 
        title: "خطأ", 
        description: "حدث خطأ أثناء إضافة المنتج", 
        variant: "destructive" 
      });
    }
  };

  // Remove item function
  const removeItem = (index: number) => {
    try {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  // Enhanced fetch invoice items
  const fetchInvoiceItems = async (invoiceId: string): Promise<InvoiceItem[]> => {
    try {
      const { data, error } = await supabase
        .from("sales_invoice_items")
        .select(`
          *,
          products (
            product_name
          )
        `)
        .eq("invoice_id", invoiceId);

      if (error) {
        console.error('Error fetching invoice items:', error);
        throw error;
      }

      return (data || []).map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.products?.product_name || 'N/A',
        quantity: parseFloat(item.quantity) || 0,
        unit_price: parseFloat(item.unit_price) || 0,
        tax_rate: parseFloat(item.tax_rate) || 0,
        tax_amount: parseFloat(item.tax_amount) || 0,
        discount: parseFloat(item.discount) || 0,
        total: parseFloat(item.total) || 0,
      }));
    } catch (error) {
      console.error('Error fetching invoice items:', error);
      return [];
    }
  };

  // Enhanced search filtering
  const filteredInvoices = useMemo(() => {
    try {
      if (!Array.isArray(invoices)) return [];
      if (!searchQuery || searchQuery.trim() === '') return invoices;

      const query = searchQuery.toLowerCase().trim();
      return invoices.filter((invoice) => {
        if (!invoice) return false;

        const invoiceNumber = (invoice.invoice_number || '').toLowerCase();
        const customerName = (invoice.customers?.customer_name || '').toLowerCase();
        const email = (invoice.customers?.email || '').toLowerCase();
        const totalAmount = String(invoice.total_amount || '').toLowerCase();

        return invoiceNumber.includes(query) ||
               customerName.includes(query) ||
               email.includes(query) ||
               totalAmount.includes(query);
      });
    } catch (error) {
      console.error('Error in filteredInvoices:', error);
      return [];
    }
  }, [invoices, searchQuery]);

  // Enhanced statistics calculation
  const stats = useMemo(() => {
    try {
      if (!Array.isArray(filteredInvoices)) {
        return {
          totalInvoices: 0,
          paidInvoices: 0,
          unpaidInvoices: 0,
          partialInvoices: 0,
          totalRevenue: 0,
          collectedRevenue: 0,
          pendingRevenue: 0
        };
      }

      const totalInvoices = filteredInvoices.length;
      const paidInvoices = filteredInvoices.filter(inv => inv?.payment_status === 'paid').length;
      const unpaidInvoices = filteredInvoices.filter(inv => inv?.payment_status === 'unpaid').length;
      const partialInvoices = filteredInvoices.filter(inv => inv?.payment_status === 'partial').length;
      
      const totalRevenue = filteredInvoices.reduce((sum, inv) => {
        const amount = parseFloat(String(inv?.total_amount || 0));
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

      const collectedRevenue = filteredInvoices.reduce((sum, inv) => {
        const amount = parseFloat(String(inv?.paid_amount || 0));
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

      const pendingRevenue = filteredInvoices.reduce((sum, inv) => {
        const amount = parseFloat(String(inv?.remaining_amount || 0));
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

      return { 
        totalInvoices, 
        paidInvoices, 
        unpaidInvoices, 
        partialInvoices,
        totalRevenue, 
        collectedRevenue,
        pendingRevenue
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return { 
        totalInvoices: 0, 
        paidInvoices: 0, 
        unpaidInvoices: 0, 
        partialInvoices: 0,
        totalRevenue: 0,
        collectedRevenue: 0,
        pendingRevenue: 0
      };
    }
  }, [filteredInvoices]);

  // Calculate totals for new invoice
  const calculateTotals = () => {
    try {
      if (!Array.isArray(items) || items.length === 0) {
        return { subtotal: 0, taxAmount: 0, discount: 0, total: 0 };
      }

      const subtotal = items.reduce((sum, item) => {
        const qty = parseFloat(String(item?.quantity || 0));
        const price = parseFloat(String(item?.unit_price || 0));
        return sum + (qty * price);
      }, 0);

      const taxAmount = items.reduce((sum, item) => {
        const tax = parseFloat(String(item?.tax_amount || 0));
        return sum + tax;
      }, 0);

      const discount = items.reduce((sum, item) => {
        const disc = parseFloat(String(item?.discount || 0));
        return sum + disc;
      }, 0);

      const total = subtotal + taxAmount - discount;

      return { subtotal, taxAmount, discount, total };
    } catch (error) {
      console.error('Error in calculateTotals:', error);
      return { subtotal: 0, taxAmount: 0, discount: 0, total: 0 };
    }
  };

  const totals = calculateTotals();

  // Enhanced print functionality
  const handlePrint = async (invoice: SalesInvoice) => {
    console.log('Starting print process for invoice:', invoice.invoice_number);

    try {
      if (!invoice || !invoice.id) {
        console.error('Invalid invoice:', invoice);
        toast({ 
          title: "خطأ", 
          description: "فاتورة غير صالحة", 
          variant: "destructive" 
        });
        return;
      }

      // Fetch invoice items
      const items = await fetchInvoiceItems(invoice.id);
      const customer = invoice.customers;

      // Generate print content
      const printContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>فاتورة ${safeValue(invoice.invoice_number)}</title>
          <style>
            * { 
              margin: 0; 
              padding: 0; 
              box-sizing: border-box; 
              font-family: 'Segoe UI', 'Tahoma', 'Arial', sans-serif;
            }
            body { 
              padding: 20px; 
              direction: rtl; 
              background: white;
              color: #333;
            }
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              padding: 30px;
              border: 2px solid #10b981;
              border-radius: 12px;
            }
            .invoice-header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 3px solid #10b981; 
              padding-bottom: 20px; 
            }
            .invoice-header h1 { 
              color: #10b981; 
              font-size: 32px; 
              margin-bottom: 10px; 
            }
            .invoice-info { 
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin: 30px 0; 
            }
            .info-box { 
              padding: 20px; 
              background: #f9fafb; 
              border-radius: 8px; 
              border: 1px solid #e5e7eb;
            }
            .info-box h3 { 
              color: #374151; 
              margin-bottom: 12px; 
              font-size: 16px; 
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 8px;
            }
            .info-box p { 
              color: #6b7280; 
              line-height: 1.8; 
              font-size: 14px; 
              margin-bottom: 5px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 30px 0; 
              font-size: 14px;
            }
            th { 
              background: #10b981; 
              color: white; 
              padding: 15px; 
              text-align: right; 
              font-size: 14px; 
              border: 1px solid #0da271;
            }
            td { 
              padding: 12px 15px; 
              border-bottom: 1px solid #e5e7eb; 
              font-size: 13px; 
              text-align: right; 
              border: 1px solid #e5e7eb;
            }
            tr:nth-child(even) { 
              background: #f9fafb; 
            }
            .totals { 
              margin-top: 30px; 
              background: #f9fafb; 
              padding: 25px; 
              border-radius: 8px; 
              border: 1px solid #e5e7eb;
            }
            .totals div { 
              padding: 8px 0; 
              display: flex; 
              justify-content: space-between; 
              font-size: 14px; 
            }
            .total-final { 
              font-size: 20px; 
              font-weight: bold; 
              color: #10b981; 
              border-top: 2px solid #10b981; 
              padding-top: 15px; 
              margin-top: 15px; 
            }
            .footer { 
              margin-top: 50px; 
              text-align: center; 
              color: #6b7280; 
              font-size: 13px; 
              padding-top: 20px; 
              border-top: 1px solid #e5e7eb; 
            }
            @media print {
              body { 
                padding: 10px; 
                background: white;
              }
              .invoice-container {
                border: none;
                box-shadow: none;
                padding: 0;
              }
              .no-print { 
                display: none; 
              }
              .info-box {
                border: 1px solid #ccc;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="invoice-header">
              <h1>فاتورة مبيعات</h1>
              <p style="font-size: 16px; color: #6b7280; margin-top: 5px;">رقم الفاتورة: ${safeValue(invoice.invoice_number)}</p>
            </div>

            <div class="invoice-info">
              <div class="info-box">
                <h3>بيانات العميل:</h3>
                <p><strong style="color: #111827; font-size: 15px;">${safeValue(customer?.customer_name, 'غير محدد')}</strong></p>
                ${customer?.email ? `<p><strong>البريد:</strong> ${safeValue(customer.email)}</p>` : ''}
                ${customer?.phone ? `<p><strong>الهاتف:</strong> ${safeValue(customer.phone)}</p>` : ''}
              </div>

              <div class="info-box">
                <h3>تفاصيل الفاتورة:</h3>
                <p><strong>التاريخ:</strong> ${safeFormatDate(invoice.invoice_date, 'yyyy-MM-dd')}</p>
                <p><strong>تاريخ الاستحقاق:</strong> ${safeFormatDate(invoice.due_date, 'yyyy-MM-dd')}</p>
                <p><strong>الحالة:</strong> ${invoice.status === 'posted' ? 'منشورة' : 'مسودة'}</p>
                <p><strong>حالة الدفع:</strong> ${
                  invoice.payment_status === 'paid' ? 'مدفوعة' :
                  invoice.payment_status === 'partial' ? 'مدفوعة جزئياً' :
                  'غير مدفوعة'
                }</p>
              </div>
            </div>

            ${items.length > 0 ? `
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>المنتج</th>
                    <th>الكمية</th>
                    <th>السعر</th>
                    <th>الضريبة</th>
                    <th>الخصم</th>
                    <th>الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.map((item, index) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${safeValue(item.product_name)}</td>
                      <td>${safeToLocaleString(item.quantity)}</td>
                      <td>${safeToLocaleString(item.unit_price)}</td>
                      <td>${safeToLocaleString(item.tax_rate)}%</td>
                      <td>${safeToLocaleString(item.discount)}</td>
                      <td>${safeToLocaleString(item.total)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p style="text-align: center; color: #6b7280; margin: 40px 0;">لا توجد بنود في هذه الفاتورة</p>'}

            <div class="totals">
              <div>
                <span>المجموع الفرعي:</span>
                <span><strong>${safeToLocaleString(invoice.subtotal)} ر.س</strong></span>
              </div>
              <div>
                <span>الضريبة:</span>
                <span><strong>${safeToLocaleString(invoice.tax_amount)} ر.س</strong></span>
              </div>
              <div>
                <span>الخصم:</span>
                <span style="color: #dc2626;"><strong>${safeToLocaleString(invoice.discount)} ر.س</strong></span>
              </div>
              <div class="total-final">
                <span>الإجمالي:</span>
                <span>${safeToLocaleString(invoice.total_amount)} ر.س</span>
              </div>
              <div style="color: #10b981;">
                <span>المدفوع:</span>
                <span><strong>${safeToLocaleString(invoice.paid_amount)} ر.س</strong></span>
              </div>
              <div style="color: #f59e0b;">
                <span>المتبقي:</span>
                <span><strong>${safeToLocaleString(invoice.remaining_amount)} ر.س</strong></span>
              </div>
            </div>

            ${invoice.notes ? `
              <div style="margin-top: 30px; padding: 20px; background: #f9fafb; border-radius: 8px; border-right: 4px solid #10b981;">
                <strong style="color: #374151; font-size: 15px;">ملاحظات:</strong>
                <p style="margin-top: 10px; color: #6b7280; line-height: 1.6;">${safeValue(invoice.notes)}</p>
              </div>
            ` : ''}

            <div class="footer">
              <p style="font-size: 16px; font-weight: bold; color: #10b981; margin-bottom: 5px;">شكراً لتعاملكم معنا</p>
              <p>تم الطباعة في: ${safeFormatDate(new Date().toISOString(), 'yyyy-MM-dd HH:mm')}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Create print window
      const printWindow = window.open('', '_blank', 'width=900,height=600');
      if (!printWindow) {
        toast({
          title: "تنبيه",
          description: "يرجى السماح بالنوافذ المنبثقة لهذا الموقع ثم المحاولة مرة أخرى",
          variant: "destructive"
        });
        return;
      }

      printWindow.document.open();
      printWindow.document.write(printContent);
      printWindow.document.close();

      // Wait for content to load then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          // Don't close immediately to allow print dialog to show
        }, 500);
      };

    } catch (error) {
      console.error('Error printing invoice:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء الطباعة",
        variant: "destructive",
      });
    }
  };

  // Enhanced PDF export
  const handleExportInvoicePDF = async (invoice: SalesInvoice) => {
    console.log('Exporting invoice to PDF:', invoice.invoice_number);

    try {
      if (!invoice || !invoice.id) {
        toast({ 
          title: "خطأ", 
          description: "فاتورة غير صالحة", 
          variant: "destructive" 
        });
        return;
      }

      const items = await fetchInvoiceItems(invoice.id);
      const customer = invoice.customers;

      // Create PDF
      const doc = new jsPDF();
      
      // Try to add Arabic font
      let useCustomFont = false;
      try {
        if (amiriRegularBase64) {
          doc.addFileToVFS('Amiri-Regular.ttf', amiriRegularBase64);
          doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
          doc.setFont('Amiri');
          useCustomFont = true;
        }
      } catch (fontError) {
        console.warn('Custom font not available, using default');
      }

      // Header
      doc.setFillColor(16, 185, 129);
      doc.rect(0, 0, 210, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text('فاتورة مبيعات', 105, 12, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text(`رقم الفاتورة: ${safeValue(invoice.invoice_number)}`, 105, 20, { align: 'center' });

      // Reset colors
      doc.setTextColor(0, 0, 0);
      doc.setFillColor(255, 255, 255);

      let yPos = 40;

      // Customer and Invoice info
      const customerInfo = [
        `العميل: ${safeValue(customer?.customer_name, 'غير محدد')}`,
        ...(customer?.email ? [`البريد: ${safeValue(customer.email)}`] : []),
        ...(customer?.phone ? [`الهاتف: ${safeValue(customer.phone)}`] : [])
      ];

      const invoiceInfo = [
        `التاريخ: ${safeFormatDate(invoice.invoice_date, 'yyyy-MM-dd')}`,
        `تاريخ الاستحقاق: ${safeFormatDate(invoice.due_date, 'yyyy-MM-dd')}`,
        `الحالة: ${invoice.status === 'posted' ? 'منشورة' : 'مسودة'}`,
        `حالة الدفع: ${invoice.payment_status === 'paid' ? 'مدفوعة' : invoice.payment_status === 'partial' ? 'مدفوعة جزئياً' : 'غير مدفوعة'}`
      ];

      // Customer info box
      doc.setFillColor(249, 250, 251);
      doc.rect(110, yPos, 90, 40, 'F');
      doc.setDrawColor(229, 231, 235);
      doc.rect(110, yPos, 90, 40, 'S');
      
      doc.setFontSize(12);
      doc.text('بيانات العميل', 195, yPos + 8, { align: 'right' });
      doc.setFontSize(9);
      customerInfo.forEach((line, index) => {
        doc.text(line, 195, yPos + 16 + (index * 5), { align: 'right' });
      });

      // Invoice info box
      doc.setFillColor(249, 250, 251);
      doc.rect(10, yPos, 90, 40, 'F');
      doc.setDrawColor(229, 231, 235);
      doc.rect(10, yPos, 90, 40, 'S');
      
      doc.setFontSize(12);
      doc.text('تفاصيل الفاتورة', 95, yPos + 8, { align: 'right' });
      doc.setFontSize(9);
      invoiceInfo.forEach((line, index) => {
        doc.text(line, 95, yPos + 16 + (index * 5), { align: 'right' });
      });

      yPos += 50;

      // Items table
      if (items.length > 0) {
        const tableData = items.map((item, index) => [
          String(index + 1),
          safeValue(item.product_name),
          safeToLocaleString(item.quantity),
          safeToLocaleString(item.unit_price),
          `${safeToLocaleString(item.tax_rate)}%`,
          safeToLocaleString(item.discount),
          safeToLocaleString(item.total),
        ]);

        (doc as any).autoTable({
          startY: yPos,
          head: [['#', 'المنتج', 'الكمية', 'السعر', 'الضريبة', 'الخصم', 'الإجمالي']],
          body: tableData,
          styles: { 
            halign: 'right',
            fontSize: 8,
          },
          headStyles: {
            fillColor: [16, 185, 129],
            textColor: [255, 255, 255],
            halign: 'center',
            fontSize: 9,
          },
          alternateRowStyles: {
            fillColor: [249, 250, 251],
          },
          margin: { top: 10 },
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;
      }

      // Totals section
      const totalsData = [
        ['المجموع الفرعي:', `${safeToLocaleString(invoice.subtotal)} ر.س`],
        ['الضريبة:', `${safeToLocaleString(invoice.tax_amount)} ر.س`],
        ['الخصم:', `${safeToLocaleString(invoice.discount)} ر.س`],
        ['الإجمالي:', `${safeToLocaleString(invoice.total_amount)} ر.س`],
        ['المدفوع:', `${safeToLocaleString(invoice.paid_amount)} ر.س`],
        ['المتبقي:', `${safeToLocaleString(invoice.remaining_amount)} ر.س`],
      ];

      doc.setFillColor(249, 250, 251);
      doc.rect(120, yPos, 80, 50, 'F');
      doc.setDrawColor(229, 231, 235);
      doc.rect(120, yPos, 80, 50, 'S');

      doc.setFontSize(10);
      totalsData.forEach(([label, value], index) => {
        const isTotal = index === 3;
        const isLast = index === totalsData.length - 1;
        
        if (isTotal) {
          doc.setFontSize(12);
          doc.setTextColor(16, 185, 129);
          doc.setFont(useCustomFont ? 'Amiri' : 'helvetica', 'bold');
        } else if (isLast) {
          doc.setTextColor(245, 158, 11);
        } else {
          doc.setTextColor(0, 0, 0);
        }

        doc.text(label, 195, yPos + 12 + (index * 8), { align: 'right' });
        doc.text(value, 125, yPos + 12 + (index * 8), { align: 'left' });

        if (isTotal) {
          doc.setFontSize(10);
          doc.setFont(useCustomFont ? 'Amiri' : 'helvetica', 'normal');
        }
      });

      yPos += 60;

      // Notes
      if (invoice.notes) {
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text('ملاحظات:', 195, yPos, { align: 'right' });
        doc.setFontSize(9);
        const splitNotes = doc.splitTextToSize(safeValue(invoice.notes), 180);
        doc.text(splitNotes, 195, yPos + 6, { align: 'right' });
        yPos += 20;
      }

      // Footer
      doc.setDrawColor(16, 185, 129);
      doc.line(10, 280, 200, 280);
      
      doc.setFontSize(12);
      doc.setTextColor(16, 185, 129);
      doc.text('شكراً لتعاملكم معنا', 105, 285, { align: 'center' });
      
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text(`تم التصدير في: ${safeFormatDate(new Date().toISOString(), 'yyyy-MM-dd HH:mm')}`, 105, 290, { align: 'center' });

      // Save PDF
      const fileName = `فاتورة-${safeValue(invoice.invoice_number)}.pdf`;
      doc.save(fileName);

      toast({
        title: "تم التصدير بنجاح",
        description: `تم حفظ الملف كـ ${fileName}`,
      });

    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير الفاتورة إلى PDF",
        variant: "destructive",
      });
    }
  };

  // Delete handler
  const handleDelete = (invoiceId: string) => {
    try {
      if (!invoiceId) {
        console.error("Invalid invoice ID");
        return;
      }
      setInvoiceToDelete(invoiceId);
      setDeleteDialogOpen(true);
    } catch (error) {
      console.error('Error in handleDelete:', error);
    }
  };

  const confirmDelete = () => {
    try {
      if (invoiceToDelete) {
        deleteInvoiceMutation.mutate(invoiceToDelete);
      }
    } catch (error) {
      console.error('Error in confirmDelete:', error);
    }
  };

  // View handler
  const handleView = async (invoice: SalesInvoice) => {
    try {
      if (!invoice || !invoice.id) {
        console.error("Invalid invoice");
        return;
      }

      const items = await fetchInvoiceItems(invoice.id);
      setInvoiceItems(items);
      setSelectedInvoice(invoice);
      setViewDialogOpen(true);
    } catch (error) {
      console.error('Error in handleView:', error);
    }
  };

  // Edit handler
  const handleEdit = (invoice: SalesInvoice) => {
    try {
      if (!invoice || !invoice.id) {
        console.error("Invalid invoice");
        return;
      }
      setEditInvoice(invoice);
      setEditDialogOpen(true);
    } catch (error) {
      console.error('Error in handleEdit:', error);
    }
  };

  // Update handler
  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();
      if (!editInvoice) return;

      const formData = new FormData(e.currentTarget);
      const updateData = {
        id: editInvoice.id,
        invoice_date: formData.get('invoice_date') as string,
        due_date: formData.get('due_date') as string,
        notes: formData.get('notes') as string || null,
        payment_method: formData.get('payment_method') as string,
      };

      updateInvoiceMutation.mutate(updateData);
    } catch (error) {
      console.error('Error in handleUpdate:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء التحديث",
        variant: "destructive",
      });
    }
  };

  // Status badge components
  const getPaymentStatusBadge = (status: string) => {
    const statusMap = {
      paid: { label: "مدفوعة", className: "bg-green-500 text-white" },
      partial: { label: "مدفوعة جزئياً", className: "bg-yellow-500 text-white" },
      unpaid: { label: "غير مدفوعة", className: "bg-red-500 text-white" },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.unpaid;

    return (
      <Badge className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    return status === 'posted' ? (
      <Badge className="bg-blue-500 text-white">منشورة</Badge>
    ) : (
      <Badge variant="secondary">مسودة</Badge>
    );
  };

  // Render invoice row
  const renderInvoiceRow = (invoice: SalesInvoice) => {
    if (!invoice || !invoice.id) return null;

    return (
      <TableRow key={invoice.id} className="hover:bg-gray-50/50">
        <TableCell className="font-medium">{safeValue(invoice.invoice_number)}</TableCell>
        <TableCell>{safeValue(invoice.customers?.customer_name, '-')}</TableCell>
        <TableCell className="text-right">{safeValue(invoice.customers?.email, '-')}</TableCell>
        <TableCell>{safeFormatDate(invoice.invoice_date, 'yyyy-MM-dd')}</TableCell>
        <TableCell className="font-semibold">{formatCurrency(invoice.total_amount)}</TableCell>
        <TableCell>{getPaymentStatusBadge(invoice.payment_status)}</TableCell>
        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-gray-100">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onClick={() => handleView(invoice)}
              >
                <Eye className="h-4 w-4" />
                عرض التفاصيل
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onClick={() => handleEdit(invoice)}
              >
                <Edit className="h-4 w-4" />
                تعديل الفاتورة
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onClick={() => handlePrint(invoice)}
              >
                <Printer className="h-4 w-4" />
                طباعة الفاتورة
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onClick={() => handleExportInvoicePDF(invoice)}
              >
                <Download className="h-4 w-4" />
                تصدير PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                onClick={() => handleDelete(invoice.id)}
              >
                <Trash2 className="h-4 w-4" />
                حذف الفاتورة
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/20 to-emerald-50/30">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Receipt className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">فواتير المبيعات</h1>
              <p className="text-gray-600 mt-1">إدارة وإصدار فواتير المبيعات</p>
            </div>
          </div>
          <Button
            size="lg"
            className="h-12 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all gap-2"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="h-5 w-5" />
            فاتورة جديدة
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="bg-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500">إجمالي الفواتير</div>
                <div className="text-4xl font-bold text-gray-900 mt-2">{stats.totalInvoices}</div>
                <p className="text-xs text-gray-500 mt-1">فاتورة</p>
              </div>
              <div className="h-16 w-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center">
                <FileText className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500">مدفوعة</div>
                <div className="text-4xl font-bold text-green-600 mt-2">{stats.paidInvoices}</div>
                <p className="text-xs text-gray-500 mt-1">فاتورة</p>
              </div>
              <div className="h-16 w-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500">غير مدفوعة</div>
                <div className="text-4xl font-bold text-orange-600 mt-2">{stats.unpaidInvoices}</div>
                <p className="text-xs text-gray-500 mt-1">فاتورة</p>
              </div>
              <div className="h-16 w-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center">
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500">إجمالي الإيرادات</div>
                <div className="text-3xl font-bold text-emerald-600 mt-2">
                  {safeToLocaleString(stats.totalRevenue)} ر.س
                </div>
                <p className="text-xs text-gray-500 mt-1">ريال سعودي</p>
              </div>
              <div className="h-16 w-16 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center">
                <DollarSign className="h-8 w-8 text-emerald-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث برقم الفاتورة، اسم العميل، أو المبلغ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
            تحديث البيانات
          </Button>
        </div>

        {/* Table */}
        <Card className="border-0 shadow-lg bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رقم الفاتورة</TableHead>
                <TableHead className="text-right">اسم العميل</TableHead>
                <TableHead className="text-right">البريد الإلكتروني</TableHead>
                <TableHead className="text-right">تاريخ الإصدار</TableHead>
                <TableHead className="text-right">المبلغ الإجمالي</TableHead>
                <TableHead className="text-right">حالة الدفع</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                      <span className="text-sm text-gray-500">جاري تحميل الفواتير...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : queryError ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="text-red-600 text-center">
                      <p className="font-semibold">حدث خطأ أثناء تحميل البيانات</p>
                      <p className="text-sm mt-1">يرجى المحاولة مرة أخرى</p>
                      <Button 
                        variant="outline" 
                        className="mt-2"
                        onClick={() => refetch()}
                      >
                        إعادة المحاولة
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <Receipt className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600 font-medium">لا توجد فواتير</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {searchQuery ? 'لا توجد نتائج تطابق بحثك' : 'ابدأ بإنشاء فاتورة جديدة'}
                    </p>
                    {!searchQuery && (
                      <Button 
                        className="mt-4"
                        onClick={() => setAddDialogOpen(true)}
                      >
                        <Plus className="h-4 w-4 ml-2" />
                        إنشاء فاتورة جديدة
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map(renderInvoiceRow)
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Add Invoice Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إنشاء فاتورة مبيعات جديدة</DialogTitle>
              <DialogDescription>
                أدخل تفاصيل الفاتورة والمنتجات. الحقول marked with * are required.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">العميل *</Label>
                  <Select 
                    value={formData.customer_id} 
                    onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر العميل" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.customer_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_method">طريقة الدفع</Label>
                  <Select 
                    value={formData.payment_method} 
                    onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر طريقة الدفع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">نقداً</SelectItem>
                      <SelectItem value="transfer">تحويل بنكي</SelectItem>
                      <SelectItem value="card">بطاقة</SelectItem>
                      <SelectItem value="credit">آجل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice_date">تاريخ الفاتورة *</Label>
                  <Input
                    id="invoice_date"
                    type="date"
                    value={formData.invoice_date}
                    onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_date">تاريخ الاستحقاق *</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">إضافة المنتجات</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="product">المنتج</Label>
                    <Select 
                      value={newItem.product_id} 
                      onValueChange={(value) => setNewItem({ ...newItem, product_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المنتج" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.product_name} - {product.selling_price} ر.س
                            {product.stock_quantity > 0 ? ` (${product.stock_quantity} متوفر)` : ' (غير متوفر)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">الكمية</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      placeholder="الكمية"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discount">الخصم (ر.س)</Label>
                    <Input
                      id="discount"
                      type="number"
                      min="0"
                      placeholder="الخصم"
                      value={newItem.discount}
                      onChange={(e) => setNewItem({ ...newItem, discount: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="invisible">إضافة</Label>
                    <Button onClick={addItem} className="w-full" disabled={!newItem.product_id}>
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة للمفاتورة
                    </Button>
                  </div>
                </div>

                {items.length > 0 ? (
                  <>
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>المنتج</TableHead>
                            <TableHead>الكمية</TableHead>
                            <TableHead>السعر</TableHead>
                            <TableHead>الضريبة</TableHead>
                            <TableHead>الخصم</TableHead>
                            <TableHead>الإجمالي</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{item.product_name}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>{item.unit_price.toFixed(2)} ر.س</TableCell>
                              <TableCell>{item.tax_amount.toFixed(2)} ر.س</TableCell>
                              <TableCell>{item.discount.toFixed(2)} ر.س</TableCell>
                              <TableCell className="font-semibold">{item.total.toFixed(2)} ر.س</TableCell>
                              <TableCell>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => removeItem(index)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <CircleX className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">المجموع الفرعي:</span>
                        <span className="font-semibold">{totals.subtotal.toFixed(2)} ر.س</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">الضريبة:</span>
                        <span className="font-semibold">{totals.taxAmount.toFixed(2)} ر.س</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">الخصم:</span>
                        <span className="font-semibold text-red-600">{totals.discount.toFixed(2)} ر.س</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center text-lg">
                        <span className="font-bold">الإجمالي النهائي:</span>
                        <span className="font-bold text-green-600">{totals.total.toFixed(2)} ر.س</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500">لم يتم إضافة أي منتجات بعد</p>
                    <p className="text-sm text-gray-400 mt-1">استخدم النموذج أعلاه لإضافة المنتجات</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات إضافية</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="أي ملاحظات إضافية حول الفاتورة..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="flex gap-2 sm:gap-0">
              <Button 
                variant="outline" 
                onClick={() => {
                  setAddDialogOpen(false);
                  resetForm();
                }}
              >
                إلغاء
              </Button>
              <Button
                onClick={() => createInvoiceMutation.mutate()}
                disabled={createInvoiceMutation.isPending || !formData.customer_id || items.length === 0}
                className="gap-2"
              >
                {createInvoiceMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                إنشاء الفاتورة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Invoice Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>تعديل فاتورة المبيعات</DialogTitle>
              <DialogDescription>
                تعديل تفاصيل الفاتورة رقم: {editInvoice?.invoice_number}
              </DialogDescription>
            </DialogHeader>

            {editInvoice && (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>رقم الفاتورة</Label>
                    <Input value={editInvoice.invoice_number} disabled className="bg-gray-50" />
                  </div>

                  <div className="space-y-2">
                    <Label>العميل</Label>
                    <Input value={editInvoice.customers?.customer_name || 'غير محدد'} disabled className="bg-gray-50" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-invoice_date">تاريخ الفاتورة *</Label>
                    <Input
                      id="edit-invoice_date"
                      name="invoice_date"
                      type="date"
                      defaultValue={editInvoice.invoice_date?.split('T')[0]}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-due_date">تاريخ الاستحقاق *</Label>
                    <Input
                      id="edit-due_date"
                      name="due_date"
                      type="date"
                      defaultValue={editInvoice.due_date?.split('T')[0]}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>المبلغ الإجمالي</Label>
                    <Input value={formatCurrency(editInvoice.total_amount)} disabled className="bg-gray-50" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-payment_method">طريقة الدفع</Label>
                    <Select name="payment_method" defaultValue={editInvoice.payment_method || 'credit'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">نقداً</SelectItem>
                        <SelectItem value="transfer">تحويل بنكي</SelectItem>
                        <SelectItem value="card">بطاقة</SelectItem>
                        <SelectItem value="credit">آجل</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>حالة الدفع</Label>
                    <div className="flex items-center justify-between h-10 px-3 border rounded-md bg-gray-50">
                      {getPaymentStatusBadge(editInvoice.payment_status)}
                      <span className="text-xs text-muted-foreground">(تلقائي حسب طريقة الدفع والمبلغ)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-notes">ملاحظات</Label>
                  <Textarea
                    id="edit-notes"
                    name="notes"
                    defaultValue={editInvoice.notes || ''}
                    placeholder="ملاحظات إضافية..."
                    rows={3}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    يمكنك تعديل التواريخ والملاحظات وطريقة الدفع فقط. لتعديل المنتجات أو المبالغ، يرجى حذف الفاتورة وإنشاء واحدة جديدة.
                  </p>
                </div>

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditDialogOpen(false)}
                  >
                    إلغاء
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateInvoiceMutation.isPending}
                    className="gap-2"
                  >
                    {updateInvoiceMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    حفظ التعديلات
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* View Invoice Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>تفاصيل الفاتورة</DialogTitle>
              <DialogDescription>
                فاتورة رقم: {selectedInvoice?.invoice_number}
              </DialogDescription>
            </DialogHeader>
            
            {selectedInvoice && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm text-gray-500">رقم الفاتورة</Label>
                      <p className="font-semibold text-lg">{safeValue(selectedInvoice.invoice_number)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">العميل</Label>
                      <p className="font-semibold">{safeValue(selectedInvoice.customers?.customer_name, '-')}</p>
                    </div>
                    {selectedInvoice.customers?.email && (
                      <div>
                        <Label className="text-sm text-gray-500">البريد الإلكتروني</Label>
                        <p>{safeValue(selectedInvoice.customers.email)}</p>
                      </div>
                    )}
                    {selectedInvoice.customers?.phone && (
                      <div>
                        <Label className="text-sm text-gray-500">الهاتف</Label>
                        <p>{safeValue(selectedInvoice.customers.phone)}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm text-gray-500">التاريخ</Label>
                      <p>{safeFormatDate(selectedInvoice.invoice_date, 'yyyy-MM-dd')}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">تاريخ الاستحقاق</Label>
                      <p>{safeFormatDate(selectedInvoice.due_date, 'yyyy-MM-dd')}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">طريقة الدفع</Label>
                      <p>
                        {selectedInvoice.payment_method === 'cash' ? 'نقداً' :
                         selectedInvoice.payment_method === 'transfer' ? 'تحويل بنكي' :
                         selectedInvoice.payment_method === 'card' ? 'بطاقة' : 'آجل'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">الحالة</Label>
                      <div className="mt-1">
                        {getStatusBadge(selectedInvoice.status)}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Invoice Items */}
                {invoiceItems.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-4">بنود الفاتورة</h3>
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>المنتج</TableHead>
                            <TableHead>الكمية</TableHead>
                            <TableHead>السعر</TableHead>
                            <TableHead>الضريبة</TableHead>
                            <TableHead>الخصم</TableHead>
                            <TableHead>الإجمالي</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoiceItems.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{safeValue(item.product_name)}</TableCell>
                              <TableCell>{safeToLocaleString(item.quantity)}</TableCell>
                              <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                              <TableCell>{formatCurrency(item.tax_amount)}</TableCell>
                              <TableCell>{formatCurrency(item.discount)}</TableCell>
                              <TableCell className="font-semibold">{formatCurrency(item.total)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Totals */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">الملخص المالي</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">المجموع الفرعي:</span>
                        <span className="font-semibold">{formatCurrency(selectedInvoice.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">الضريبة:</span>
                        <span className="font-semibold">{formatCurrency(selectedInvoice.tax_amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">الخصم:</span>
                        <span className="font-semibold text-red-600">{formatCurrency(selectedInvoice.discount)}</span>
                      </div>
                    </div>
                    <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center text-lg">
                        <span className="font-bold">الإجمالي:</span>
                        <span className="font-bold text-green-600">{formatCurrency(selectedInvoice.total_amount)}</span>
                      </div>
                      <div className="flex justify-between items-center text-green-600">
                        <span>المدفوع:</span>
                        <span className="font-semibold">{formatCurrency(selectedInvoice.paid_amount)}</span>
                      </div>
                      <div className="flex justify-between items-center text-orange-600">
                        <span>المتبقي:</span>
                        <span className="font-semibold">{formatCurrency(selectedInvoice.remaining_amount)}</span>
                      </div>
                      <div className="mt-2">
                        {getPaymentStatusBadge(selectedInvoice.payment_status)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedInvoice.notes && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-sm text-gray-500">ملاحظات</Label>
                      <p className="mt-2 p-3 bg-gray-50 rounded-lg text-gray-700">
                        {safeValue(selectedInvoice.notes)}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={() => setViewDialogOpen(false)}
                className="sm:order-2"
              >
                إغلاق
              </Button>
              <div className="flex gap-2 sm:order-1">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (selectedInvoice) {
                      handleExportInvoicePDF(selectedInvoice);
                    }
                  }}
                >
                  <Download className="h-4 w-4 ml-2" />
                  تصدير PDF
                </Button>
                <Button 
                  onClick={() => {
                    if (selectedInvoice) {
                      handlePrint(selectedInvoice);
                    }
                  }}
                >
                  <Printer className="h-4 w-4 ml-2" />
                  طباعة الفاتورة
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من رغبتك في حذف هذه الفاتورة؟ 
                <br />
                <span className="font-semibold text-red-600">
                  هذا الإجراء لا يمكن التراجع عنه وسيتم حذف جميع بنود الفاتورة المرتبطة بها.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteInvoiceMutation.isPending}>
                إلغاء
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={deleteInvoiceMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
              >
                {deleteInvoiceMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                نعم، احذف الفاتورة
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default SalesInvoices;