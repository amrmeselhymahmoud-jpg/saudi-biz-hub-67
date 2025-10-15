import { Receipt, Plus, Search, MoveHorizontal as MoreHorizontal, Eye, Trash2, Download, Loader as Loader2, DollarSign, FileText, CircleCheck as CheckCircle2, Clock, Circle as XCircle, Printer, CreditCard as Edit } from "lucide-react";
import { useState, useMemo } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
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

// Calculate payment status based on payment method
const getPaymentStatusFromMethod = (paymentMethod: string): string => {
  if (paymentMethod === 'credit') {
    return 'unpaid';
  }
  return 'paid';
};

// Normalize invoice data with safety checks
const normalizeInvoice = (invoice: any): SalesInvoice | null => {
  try {
    if (!invoice || !invoice.id) return null;

    const paymentMethod = invoice.payment_method || 'credit';
    const calculatedPaymentStatus = getPaymentStatusFromMethod(paymentMethod);

    return {
      id: invoice.id || '',
      invoice_number: invoice.invoice_number || 'N/A',
      customer_id: invoice.customer_id || '',
      invoice_date: invoice.invoice_date || new Date().toISOString(),
      due_date: invoice.due_date || new Date().toISOString(),
      subtotal: parseFloat(invoice.subtotal) || 0,
      tax_amount: parseFloat(invoice.tax_amount) || 0,
      discount: parseFloat(invoice.discount) || 0,
      total_amount: parseFloat(invoice.total_amount) || 0,
      paid_amount: parseFloat(invoice.paid_amount) || 0,
      remaining_amount: parseFloat(invoice.remaining_amount) || 0,
      payment_status: calculatedPaymentStatus,
      payment_method: paymentMethod,
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

  const [formData, setFormData] = useState({
    customer_id: "",
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: "",
    notes: "",
  });

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [newItem, setNewItem] = useState({
    product_id: "",
    quantity: "1",
    discount: "0",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query with retry and error handling
  const { data: invoicesData = [], isLoading, error: queryError } = useQuery({
    queryKey: ["sales-invoices"],
    queryFn: async () => {
      try {
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
          console.error('Query error:', error);
          throw error;
        }

        return data || [];
      } catch (error) {
        console.error('Fetch error:', error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Safe data normalization with memoization
  const invoices = useMemo(() => {
    try {
      if (!Array.isArray(invoicesData)) return [];
      return invoicesData
        .map(normalizeInvoice)
        .filter((inv): inv is SalesInvoice => inv !== null);
    } catch (error) {
      console.error('Error processing invoices:', error);
      return [];
    }
  }, [invoicesData]);

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("customers")
          .select("id, customer_name, email, phone")
          .eq("status", "active")
          .order("customer_name");

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Customers fetch error:', error);
        return [];
      }
    },
    retry: 2,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("id, product_name, selling_price, tax_rate")
          .eq("status", "active")
          .order("product_name");

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Products fetch error:', error);
        return [];
      }
    },
    retry: 2,
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      try {
        if (!invoiceId) throw new Error("معرف الفاتورة غير صحيح");

        const { error } = await supabase
          .from("sales_invoices")
          .delete()
          .eq("id", invoiceId);

        if (error) throw error;
      } catch (error) {
        console.error('Delete error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      try {
        queryClient.invalidateQueries({ queryKey: ["sales-invoices"] });
        toast({ title: "تم بنجاح", description: "تم حذف الفاتورة بنجاح" });
        setDeleteDialogOpen(false);
        setInvoiceToDelete(null);
      } catch (error) {
        console.error('Error after delete success:', error);
      }
    },
    onError: (error: Error) => {
      try {
        toast({ title: "خطأ", description: error.message, variant: "destructive" });
      } catch (e) {
        console.error('Error showing toast:', e);
      }
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async () => {
      try {
        if (items.length === 0) throw new Error("يجب إضافة منتج واحد على الأقل");
        if (!formData.customer_id) throw new Error("يجب اختيار عميل");
        if (!formData.invoice_date) throw new Error("يجب تحديد تاريخ الفاتورة");

        const invoiceNumber = `INV-${Date.now()}`;
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
        const taxAmount = items.reduce((sum, item) => sum + item.tax_amount, 0);
        const discount = items.reduce((sum, item) => sum + item.discount, 0);
        const totalAmount = subtotal + taxAmount - discount;

        const { data: invoice, error: invoiceError } = await supabase
          .from("sales_invoices")
          .insert({
            invoice_number: invoiceNumber,
            customer_id: formData.customer_id,
            invoice_date: formData.invoice_date,
            due_date: formData.due_date || formData.invoice_date,
            subtotal,
            tax_amount: taxAmount,
            discount,
            total_amount: totalAmount,
            paid_amount: 0,
            remaining_amount: totalAmount,
            payment_status: "unpaid",
            status: "draft",
            notes: formData.notes || null,
          })
          .select()
          .single();

        if (invoiceError) throw invoiceError;
        if (!invoice) throw new Error("فشل إنشاء الفاتورة");

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

        const { error: itemsError } = await supabase
          .from("sales_invoice_items")
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;

        return invoice;
      } catch (error) {
        console.error('Create invoice error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      try {
        queryClient.invalidateQueries({ queryKey: ["sales-invoices"] });
        toast({ title: "تم بنجاح", description: "تم إنشاء الفاتورة بنجاح" });
        setAddDialogOpen(false);
        resetForm();
      } catch (error) {
        console.error('Error after create success:', error);
      }
    },
    onError: (error: Error) => {
      try {
        toast({ title: "خطأ", description: error.message, variant: "destructive" });
      } catch (e) {
        console.error('Error showing toast:', e);
      }
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: async (data: { id: string; invoice_date: string; due_date: string; notes: string | null; payment_method?: string }) => {
      try {
        const updateData: any = {
          invoice_date: data.invoice_date,
          due_date: data.due_date,
          notes: data.notes,
        };

        if (data.payment_method) {
          updateData.payment_method = data.payment_method;
        }

        const { error } = await supabase
          .from("sales_invoices")
          .update(updateData)
          .eq("id", data.id);

        if (error) throw error;
      } catch (error) {
        console.error('Update error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      try {
        queryClient.invalidateQueries({ queryKey: ["sales-invoices"] });
        toast({ title: "تم بنجاح", description: "تم تحديث الفاتورة بنجاح" });
        setEditDialogOpen(false);
        setEditInvoice(null);
      } catch (error) {
        console.error('Error after update success:', error);
      }
    },
    onError: (error: Error) => {
      try {
        toast({ title: "خطأ", description: error.message, variant: "destructive" });
      } catch (e) {
        console.error('Error showing toast:', e);
      }
    },
  });

  const resetForm = () => {
    try {
      setFormData({
        customer_id: "",
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: "",
        notes: "",
      });
      setItems([]);
      setNewItem({ product_id: "", quantity: "1", discount: "0" });
    } catch (error) {
      console.error('Error resetting form:', error);
    }
  };

  const addItem = () => {
    try {
      const product = products.find(p => p.id === newItem.product_id);
      if (!product) {
        toast({ title: "خطأ", description: "يرجى اختيار منتج", variant: "destructive" });
        return;
      }

      const quantity = parseInt(newItem.quantity) || 0;
      const discount = parseFloat(newItem.discount) || 0;

      if (quantity <= 0) {
        toast({ title: "خطأ", description: "الكمية يجب أن تكون أكبر من صفر", variant: "destructive" });
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
    } catch (error) {
      console.error('Error adding item:', error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء إضافة المنتج", variant: "destructive" });
    }
  };

  const removeItem = (index: number) => {
    try {
      setItems(items.filter((_, i) => i !== index));
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  // Fetch invoice items
  const fetchInvoiceItems = async (invoiceId: string) => {
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

      if (error) throw error;

      return data?.map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.products?.product_name || 'N/A',
        quantity: parseFloat(item.quantity) || 0,
        unit_price: parseFloat(item.unit_price) || 0,
        tax_rate: parseFloat(item.tax_rate) || 0,
        tax_amount: parseFloat(item.tax_amount) || 0,
        discount: parseFloat(item.discount) || 0,
        total: parseFloat(item.total) || 0,
      })) || [];
    } catch (error) {
      console.error('Error fetching invoice items:', error);
      return [];
    }
  };

  // Safe filtering with comprehensive checks
  const filteredInvoices = useMemo(() => {
    try {
      if (!Array.isArray(invoices)) return [];
      if (!searchQuery || searchQuery.trim() === '') return invoices;

      const query = searchQuery.toLowerCase().trim();
      return invoices.filter((invoice) => {
        try {
          if (!invoice) return false;

          const invoiceNumber = (invoice.invoice_number || '').toLowerCase();
          const customerName = (invoice.customers?.customer_name || '').toLowerCase();
          const email = (invoice.customers?.email || '').toLowerCase();

          return invoiceNumber.includes(query) ||
                 customerName.includes(query) ||
                 email.includes(query);
        } catch (error) {
          console.error('Error filtering invoice:', error, invoice);
          return false;
        }
      });
    } catch (error) {
      console.error('Error in filteredInvoices:', error);
      return [];
    }
  }, [invoices, searchQuery]);

  // Safe calculations with memoization
  const stats = useMemo(() => {
    try {
      if (!Array.isArray(invoices)) return {
        totalInvoices: 0,
        paidInvoices: 0,
        unpaidInvoices: 0,
        totalRevenue: 0
      };

      const totalInvoices = invoices.length;
      const paidInvoices = invoices.filter(inv => inv?.payment_status === 'paid').length;
      const unpaidInvoices = invoices.filter(inv => inv?.payment_status === 'unpaid').length;
      const totalRevenue = invoices.reduce((sum, inv) => {
        try {
          const amount = parseFloat(String(inv?.total_amount || 0));
          return sum + (isNaN(amount) ? 0 : amount);
        } catch (error) {
          console.error('Error calculating revenue for invoice:', error, inv);
          return sum;
        }
      }, 0);

      return { totalInvoices, paidInvoices, unpaidInvoices, totalRevenue };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return { totalInvoices: 0, paidInvoices: 0, unpaidInvoices: 0, totalRevenue: 0 };
    }
  }, [invoices]);

  const calculateTotals = () => {
    try {
      if (!Array.isArray(items) || items.length === 0) {
        return { subtotal: 0, taxAmount: 0, discount: 0, total: 0 };
      }

      const subtotal = items.reduce((sum, item) => {
        try {
          const qty = parseFloat(String(item?.quantity || 0));
          const price = parseFloat(String(item?.unit_price || 0));
          return sum + (qty * price);
        } catch (error) {
          console.error('Error calculating subtotal for item:', error, item);
          return sum;
        }
      }, 0);

      const taxAmount = items.reduce((sum, item) => {
        try {
          const tax = parseFloat(String(item?.tax_amount || 0));
          return sum + tax;
        } catch (error) {
          console.error('Error calculating tax for item:', error, item);
          return sum;
        }
      }, 0);

      const discount = items.reduce((sum, item) => {
        try {
          const disc = parseFloat(String(item?.discount || 0));
          return sum + disc;
        } catch (error) {
          console.error('Error calculating discount for item:', error, item);
          return sum;
        }
      }, 0);

      const total = subtotal + taxAmount - discount;

      return { subtotal, taxAmount, discount, total };
    } catch (error) {
      console.error('Error in calculateTotals:', error);
      return { subtotal: 0, taxAmount: 0, discount: 0, total: 0 };
    }
  };

  const totals = calculateTotals();

  const handleExportPDF = async () => {
    try {
      if (filteredInvoices.length === 0) {
        toast({
          title: "تنبيه",
          description: "لا توجد فواتير للتصدير",
          variant: "default",
        });
        return;
      }

      const doc = new jsPDF();

      doc.addFileToVFS('Amiri-Regular.ttf', amiriRegularBase64);
      doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
      doc.setFont('Amiri');

      doc.setFontSize(18);
      doc.text('فواتير المبيعات', 105, 20, { align: 'center' });

      doc.setFontSize(10);
      const currentDate = new Date().toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(`تاريخ التصدير: ${currentDate}`, 105, 30, { align: 'center' });

      doc.setFontSize(10);
      let yPos = 40;
      doc.text(`إجمالي الفواتير: ${stats.totalInvoices}`, 20, yPos);
      doc.text(`مدفوعة: ${stats.paidInvoices}`, 80, yPos);
      doc.text(`غير مدفوعة: ${stats.unpaidInvoices}`, 120, yPos);
      yPos += 10;
      doc.text(`إجمالي الإيرادات: ${safeToLocaleString(stats.totalRevenue)} ر.س`, 20, yPos);

      const tableData = filteredInvoices.map((invoice, index) => {
        try {
          return [
            String(index + 1),
            safeValue(invoice.invoice_number),
            safeValue(invoice.customers?.customer_name),
            safeValue(invoice.customers?.email),
            safeFormatDate(invoice.invoice_date, 'yyyy-MM-dd'),
            `${safeToLocaleString(invoice.total_amount)} ر.س`,
            invoice.payment_status === 'paid' ? 'مدفوعة' :
            invoice.payment_status === 'partial' ? 'جزئي' : 'غير مدفوعة',
          ];
        } catch (error) {
          console.error('Error formatting invoice row:', error, invoice);
          return ['', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A'];
        }
      });

      (doc as any).autoTable({
        startY: yPos + 10,
        head: [['#', 'رقم الفاتورة', 'العميل', 'البريد', 'التاريخ', 'الإجمالي', 'الحالة']],
        body: tableData,
        styles: {
          font: 'Amiri',
          fontStyle: 'normal',
          halign: 'right',
          fontSize: 9,
        },
        headStyles: {
          fillColor: [16, 185, 129],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
        margin: { top: 10, right: 10, bottom: 10, left: 10 },
      });

      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `صفحة ${i} من ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }

      doc.save(`sales-invoices-${Date.now()}.pdf`);

      toast({
        title: "تم بنجاح",
        description: "تم تصدير الفواتير إلى PDF بنجاح",
      });
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء التصدير إلى PDF",
        variant: "destructive",
      });
    }
  };

  // Print invoice with items
  const handlePrint = async (invoice: SalesInvoice) => {
    console.log('=== handlePrint CALLED ===', invoice);

    try {
      if (!invoice || !invoice.id) {
        console.error('Invalid invoice:', invoice);
        toast({ title: "خطأ", description: "فاتورة غير صالحة", variant: "destructive" });
        return;
      }

      console.log('Starting print for invoice:', invoice.invoice_number);

      // Fetch invoice items
      const items = await fetchInvoiceItems(invoice.id);
      console.log('Fetched items:', items.length);

      const customer = invoice.customers;
      console.log('Customer:', customer?.customer_name);

      // Generate items table rows
      const itemsRows = items.map((item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${safeValue(item.product_name)}</td>
          <td>${safeToLocaleString(item.quantity)}</td>
          <td>${safeToLocaleString(item.unit_price)}</td>
          <td>${safeToLocaleString(item.tax_rate)}%</td>
          <td>${safeToLocaleString(item.discount)}</td>
          <td>${safeToLocaleString(item.total)}</td>
        </tr>
      `).join('');

      console.log('Generated HTML rows');

      // Generate full HTML content
      const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>فاتورة ${safeValue(invoice.invoice_number)}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 40px; direction: rtl; }
            .invoice-header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #10b981; padding-bottom: 20px; }
            .invoice-header h1 { color: #10b981; font-size: 32px; margin-bottom: 10px; }
            .invoice-info { display: flex; justify-content: space-between; margin: 30px 0; }
            .info-box { flex: 1; padding: 15px; background: #f9fafb; border-radius: 8px; margin: 0 5px; }
            .info-box h3 { color: #374151; margin-bottom: 12px; font-size: 16px; }
            .info-box p { color: #6b7280; line-height: 1.8; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin: 30px 0; }
            th { background: #10b981; color: white; padding: 15px; text-align: right; font-size: 14px; }
            td { padding: 12px 15px; border-bottom: 1px solid #e5e7eb; font-size: 13px; text-align: right; }
            tr:hover { background: #f9fafb; }
            .totals { margin-top: 30px; text-align: left; background: #f9fafb; padding: 20px; border-radius: 8px; }
            .totals div { padding: 10px 0; display: flex; justify-content: space-between; font-size: 14px; }
            .total-final { font-size: 22px; font-weight: bold; color: #10b981; border-top: 2px solid #10b981; padding-top: 15px; margin-top: 15px; }
            .footer { margin-top: 50px; text-align: center; color: #6b7280; font-size: 13px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
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
                ${itemsRows}
              </tbody>
            </table>
          ` : ''}

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

          <script>
            window.onload = function() {
              console.log('Print window loaded');
              setTimeout(function() {
                window.print();
              }, 500);
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
        </html>
      `;

      console.log('Opening print window...');

      // Open window and write content
      const printWindow = window.open('', '_blank');
      if (!printWindow || printWindow.closed || typeof printWindow.closed === 'undefined') {
        console.error('Failed to open print window - popup blocked?');
        toast({
          title: "تنبيه",
          description: "يرجى السماح بالنوافذ المنبثقة لهذا الموقع ثم المحاولة مرة أخرى",
          variant: "destructive"
        });
        return;
      }

      try {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        console.log('Print window content written successfully');
      } catch (writeError) {
        console.error('Error writing to print window:', writeError);
        printWindow.close();
        toast({
          title: "خطأ",
          description: "فشل في كتابة محتوى الطباعة",
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      console.error('Error printing invoice:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء الطباعة",
        variant: "destructive",
      });
    }
  };

  // Handle delete
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

  // Handle view
  const handleView = async (invoice: SalesInvoice) => {
    try {
      if (!invoice || !invoice.id) {
        console.error("Invalid invoice");
        return;
      }

      // Fetch items for this invoice
      const items = await fetchInvoiceItems(invoice.id);
      setInvoiceItems(items);
      setSelectedInvoice(invoice);
      setViewDialogOpen(true);
    } catch (error) {
      console.error('Error in handleView:', error);
    }
  };

  // Handle edit
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

  // Handle update
  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();
      if (!editInvoice) return;

      const formData = new FormData(e.currentTarget);
      updateInvoiceMutation.mutate({
        id: editInvoice.id,
        invoice_date: formData.get('invoice_date') as string,
        due_date: formData.get('due_date') as string,
        notes: formData.get('notes') as string || null,
        payment_method: formData.get('payment_method') as string,
      });
    } catch (error) {
      console.error('Error in handleUpdate:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء التحديث",
        variant: "destructive",
      });
    }
  };

  // Get status badge
  const getPaymentStatusBadge = (status: string) => {
    try {
      const statusMap = {
        paid: { label: "مدفوعة", className: "bg-green-500 text-white" },
        partial: { label: "جزئي", className: "bg-yellow-500 text-white" },
        unpaid: { label: "غير مدفوعة", className: "bg-red-500 text-white" },
      };

      const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.unpaid;

      return (
        <Badge className={statusInfo.className}>
          {statusInfo.label}
        </Badge>
      );
    } catch (error) {
      console.error('Error in getPaymentStatusBadge:', error);
      return <Badge variant="secondary">غير محدد</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    try {
      return status === 'posted' ? (
        <Badge className="bg-blue-500 text-white">منشورة</Badge>
      ) : (
        <Badge variant="secondary">مسودة</Badge>
      );
    } catch (error) {
      console.error('Error in getStatusBadge:', error);
      return <Badge variant="secondary">غير محدد</Badge>;
    }
  };

  // Render invoice row
  const renderInvoiceRow = (invoice: SalesInvoice) => {
    try {
      if (!invoice || !invoice.id) return null;

      return (
        <TableRow key={invoice.id}>
          <TableCell className="font-medium">{safeValue(invoice.invoice_number)}</TableCell>
          <TableCell>{safeValue(invoice.customers?.customer_name, '-')}</TableCell>
          <TableCell className="text-left" dir="ltr">{safeValue(invoice.customers?.email, '-')}</TableCell>
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
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => handleView(invoice)}
                >
                  <Eye className="h-4 w-4" />
                  عرض
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => handleEdit(invoice)}
                >
                  <Edit className="h-4 w-4" />
                  تعديل
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => handlePrint(invoice)}
                >
                  <Printer className="h-4 w-4" />
                  طباعة
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 text-destructive"
                  onClick={() => handleDelete(invoice.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  حذف
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      );
    } catch (error) {
      console.error('Error rendering invoice row:', error, invoice);
      return null;
    }
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-6 gap-2"
              onClick={handleExportPDF}
            >
              <Download className="h-5 w-5" />
              تصدير PDF
            </Button>
            <Button
              size="lg"
              className="h-12 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all gap-2"
              onClick={() => navigate('/new-sales-invoice')}
            >
              <Plus className="h-5 w-5" />
              فاتورة جديدة
            </Button>
          </div>
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
                  {safeToLocaleString(stats.totalRevenue)}
                </div>
                <p className="text-xs text-gray-500 mt-1">ريال سعودي</p>
              </div>
              <div className="h-16 w-16 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center">
                <DollarSign className="h-8 w-8 text-emerald-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث عن فاتورة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
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
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-green-600" />
                    <p className="text-sm text-gray-500 mt-2">جاري التحميل...</p>
                  </TableCell>
                </TableRow>
              ) : queryError ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="text-red-600">
                      <p className="font-semibold">حدث خطأ أثناء تحميل البيانات</p>
                      <p className="text-sm mt-1">يرجى المحاولة مرة أخرى</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <Receipt className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600 font-medium">لا توجد فواتير</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {searchQuery ? 'لا توجد نتائج للبحث' : 'ابدأ بإنشاء فاتورة جديدة'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map(renderInvoiceRow).filter(Boolean)
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
                أدخل تفاصيل الفاتورة والمنتجات
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>العميل *</Label>
                  <Select value={formData.customer_id} onValueChange={(value) => setFormData({ ...formData, customer_id: value })}>
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

                <div>
                  <Label>تاريخ الفاتورة *</Label>
                  <Input
                    type="date"
                    value={formData.invoice_date}
                    onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                  />
                </div>

                <div>
                  <Label>تاريخ الاستحقاق *</Label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">المنتجات</h3>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  <Select value={newItem.product_id} onValueChange={(value) => setNewItem({ ...newItem, product_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المنتج" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.product_name} - {product.selling_price} ر.س
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="number"
                    placeholder="الكمية"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                  />

                  <Input
                    type="number"
                    placeholder="الخصم"
                    value={newItem.discount}
                    onChange={(e) => setNewItem({ ...newItem, discount: e.target.value })}
                  />

                  <Button onClick={addItem} className="w-full">
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة
                  </Button>
                </div>

                {items.length > 0 && (
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
                          <TableCell>{item.product_name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.unit_price.toFixed(2)}</TableCell>
                          <TableCell>{item.tax_amount.toFixed(2)}</TableCell>
                          <TableCell>{item.discount.toFixed(2)}</TableCell>
                          <TableCell>{item.total.toFixed(2)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => removeItem(index)}>
                              <XCircle className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {items.length > 0 && (
                  <div className="mt-4 space-y-2 text-left bg-gray-50 p-4 rounded">
                    <div className="flex justify-between">
                      <span>المجموع الفرعي:</span>
                      <span>{totals.subtotal.toFixed(2)} ر.س</span>
                    </div>
                    <div className="flex justify-between">
                      <span>الضريبة:</span>
                      <span>{totals.taxAmount.toFixed(2)} ر.س</span>
                    </div>
                    <div className="flex justify-between">
                      <span>الخصم:</span>
                      <span>{totals.discount.toFixed(2)} ر.س</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>الإجمالي:</span>
                      <span>{totals.total.toFixed(2)} ر.س</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label>ملاحظات</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="ملاحظات إضافية..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                إلغاء
              </Button>
              <Button
                onClick={() => createInvoiceMutation.mutate()}
                disabled={createInvoiceMutation.isPending || !formData.customer_id || items.length === 0}
              >
                {createInvoiceMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
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
                  <div>
                    <Label>رقم الفاتورة</Label>
                    <Input value={editInvoice.invoice_number} disabled className="bg-gray-50" />
                  </div>

                  <div>
                    <Label>العميل</Label>
                    <Input value={editInvoice.customers?.customer_name || 'غير محدد'} disabled className="bg-gray-50" />
                  </div>

                  <div>
                    <Label htmlFor="edit-invoice_date">تاريخ الفاتورة *</Label>
                    <Input
                      id="edit-invoice_date"
                      name="invoice_date"
                      type="date"
                      defaultValue={editInvoice.invoice_date?.split('T')[0]}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-due_date">تاريخ الاستحقاق *</Label>
                    <Input
                      id="edit-due_date"
                      name="due_date"
                      type="date"
                      defaultValue={editInvoice.due_date?.split('T')[0]}
                      required
                    />
                  </div>

                  <div>
                    <Label>المبلغ الإجمالي</Label>
                    <Input value={formatCurrency(editInvoice.total_amount)} disabled className="bg-gray-50" />
                  </div>

                  <div>
                    <Label>طريقة الدفع</Label>
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

                  <div>
                    <Label>حالة الدفع</Label>
                    <div className="flex items-center h-10 px-3 border rounded-md bg-gray-50">
                      {getPaymentStatusBadge(editInvoice.payment_status)}
                      <span className="mr-2 text-xs text-muted-foreground">(تلقائي)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-notes">ملاحظات</Label>
                  <Textarea
                    id="edit-notes"
                    name="notes"
                    defaultValue={editInvoice.notes || ''}
                    placeholder="ملاحظات إضافية..."
                    rows={3}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    يمكنك تعديل التواريخ والملاحظات فقط. لتعديل المنتجات أو المبالغ، يرجى حذف الفاتورة وإنشاء واحدة جديدة.
                  </p>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={updateInvoiceMutation.isPending}>
                    {updateInvoiceMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
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
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>رقم الفاتورة</Label>
                    <p className="font-semibold">{safeValue(selectedInvoice.invoice_number)}</p>
                  </div>
                  <div>
                    <Label>العميل</Label>
                    <p className="font-semibold">{safeValue(selectedInvoice.customers?.customer_name, '-')}</p>
                  </div>
                  <div>
                    <Label>التاريخ</Label>
                    <p>{safeFormatDate(selectedInvoice.invoice_date, 'yyyy-MM-dd')}</p>
                  </div>
                  <div>
                    <Label>تاريخ الاستحقاق</Label>
                    <p>{safeFormatDate(selectedInvoice.due_date, 'yyyy-MM-dd')}</p>
                  </div>
                </div>

                {invoiceItems.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-3">بنود الفاتورة</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>المنتج</TableHead>
                            <TableHead>الكمية</TableHead>
                            <TableHead>السعر</TableHead>
                            <TableHead>الإجمالي</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoiceItems.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{safeValue(item.product_name)}</TableCell>
                              <TableCell>{safeToLocaleString(item.quantity)}</TableCell>
                              <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                              <TableCell className="font-semibold">{formatCurrency(item.total)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}

                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>المجموع الفرعي:</span>
                    <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الضريبة:</span>
                    <span>{formatCurrency(selectedInvoice.tax_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الخصم:</span>
                    <span>{formatCurrency(selectedInvoice.discount)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>الإجمالي:</span>
                    <span>{formatCurrency(selectedInvoice.total_amount)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>المدفوع:</span>
                    <span>{formatCurrency(selectedInvoice.paid_amount)}</span>
                  </div>
                  <div className="flex justify-between text-orange-600">
                    <span>المتبقي:</span>
                    <span>{formatCurrency(selectedInvoice.remaining_amount)}</span>
                  </div>
                </div>
                {selectedInvoice.notes && (
                  <>
                    <Separator />
                    <div>
                      <Label>ملاحظات</Label>
                      <p className="text-sm text-gray-600">{safeValue(selectedInvoice.notes)}</p>
                    </div>
                  </>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                إغلاق
              </Button>
              <Button onClick={() => {
                console.log('Print button clicked in view dialog');
                console.log('Selected invoice:', selectedInvoice);
                if (selectedInvoice) {
                  handlePrint(selectedInvoice);
                } else {
                  console.error('No selected invoice!');
                }
              }}>
                <Printer className="h-4 w-4 ml-2" />
                طباعة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف هذه الفاتورة؟ لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteInvoiceMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default SalesInvoices;
