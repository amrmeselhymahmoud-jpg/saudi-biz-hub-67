import { Receipt, Plus, Search, MoreHorizontal, Eye, Trash2, Loader2, DollarSign, FileText, CheckCircle2, Clock, CircleX, Printer, Edit, Download } from "lucide-react";
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

const safeValue = (value: any, fallback: string = 'N/A'): string => {
  try {
    if (value === null || value === undefined || value === '') return fallback;
    if (typeof value === 'number' && isNaN(value)) return fallback;
    return String(value);
  } catch {
    return fallback;
  }
};

const getPaymentStatus = (paymentMethod: string, paidAmount: number, totalAmount: number): string => {
  if (paidAmount >= totalAmount) return 'paid';
  if (paidAmount > 0 && paidAmount < totalAmount) return 'partial';
  if (paymentMethod === 'cash' && paidAmount === 0) return 'unpaid';
  return paymentMethod === 'credit' ? 'unpaid' : 'paid';
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

const normalizeInvoice = (invoice: any): SalesInvoice | null => {
  try {
    if (!invoice || !invoice.id || !invoice.invoice_number) return null;
    const subtotal = parseFloat(invoice.subtotal) || 0;
    const taxAmount = parseFloat(invoice.tax_amount) || 0;
    const discount = parseFloat(invoice.discount) || 0;
    const totalAmount = parseFloat(invoice.total_amount) || 0;
    const paidAmount = parseFloat(invoice.paid_amount) || 0;
    const remainingAmount = parseFloat(invoice.remaining_amount) || (totalAmount - paidAmount);
    const paymentStatus = getPaymentStatus(invoice.payment_method || 'credit', paidAmount, totalAmount);
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
  } catch {
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
  const [isPrinting, setIsPrinting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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

  const { data: invoicesData = [], isLoading } = useQuery({
    queryKey: ["sales-invoices"],
    queryFn: async () => {
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
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const invoices = useMemo(() => {
    if (!Array.isArray(invoicesData)) return [];
    return invoicesData
      .map(normalizeInvoice)
      .filter((inv): inv is SalesInvoice => inv !== null);
  }, [invoicesData]);

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, customer_name, email, phone")
        .eq("status", "active")
        .order("customer_name");
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, product_name, selling_price, tax_rate, stock_quantity")
        .eq("status", "active")
        .order("product_name");
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase
        .from("sales_invoices")
        .delete()
        .eq("id", invoiceId);
      if (error) throw new Error(error.message);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-invoices"] });
      toast({ title: "تم الحذف بنجاح", description: "تم حذف الفاتورة بنجاح" });
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    },
    onError: (error: Error) => {
      toast({ title: "خطأ في الحذف", description: error.message, variant: "destructive" });
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async () => {
      if (items.length === 0) throw new Error("يجب إضافة منتج واحد على الأقل");
      if (!formData.customer_id) throw new Error("يجب اختيار عميل");
      if (!formData.invoice_date) throw new Error("يجب تحديد تاريخ الفاتورة");
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
      if (invoiceError) throw new Error(invoiceError.message);
      if (!invoice) throw new Error("فشل في إنشاء الفاتورة - لا توجد بيانات مسترجعة");
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
      if (itemsError) throw new Error(itemsError.message);
      return invoice;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sales-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "تم الإنشاء بنجاح", description: `تم إنشاء الفاتورة ${data.invoice_number} بنجاح` });
      setAddDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "خطأ في الإنشاء", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      customer_id: "",
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: "",
      payment_method: "credit"
    });
    setItems([]);
    setNewItem({ product_id: "", quantity: "1", discount: "0" });
  };

  const addItem = () => {
    const product = products.find(p => p.id === newItem.product_id);
    if (!product) {
      toast({ title: "خطأ", description: "يرجى اختيار منتج صحيح", variant: "destructive" });
      return;
    }
    const quantity = parseInt(newItem.quantity) || 0;
    const discount = parseFloat(newItem.discount) || 0;
    if (quantity <= 0) {
      toast({ title: "خطأ", description: "الكمية يجب أن تكون أكبر من صفر", variant: "destructive" });
      return;
    }
    if (product.stock_quantity < quantity) {
      toast({ title: "خطأ في المخزون", description: `الكمية المطلوبة غير متوفرة. المخزون الحالي: ${product.stock_quantity}`, variant: "destructive" });
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
    toast({ title: "تم الإضافة", description: "تم إضافة المنتج إلى الفاتورة بنجاح" });
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const fetchInvoiceItems = async (invoiceId: string): Promise<InvoiceItem[]> => {
    const { data, error } = await supabase
      .from("sales_invoice_items")
      .select(`*, products ( product_name )`)
      .eq("invoice_id", invoiceId);
    if (error) throw new Error(error.message);
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
  };

  const filteredInvoices = useMemo(() => {
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
  }, [invoices, searchQuery]);

  const stats = useMemo(() => {
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
    const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + (parseFloat(String(inv?.total_amount || 0)) || 0), 0);
    const collectedRevenue = filteredInvoices.reduce((sum, inv) => sum + (parseFloat(String(inv?.paid_amount || 0)) || 0), 0);
    const pendingRevenue = filteredInvoices.reduce((sum, inv) => sum + (parseFloat(String(inv?.remaining_amount || 0)) || 0), 0);

    return {
      totalInvoices,
      paidInvoices,
      unpaidInvoices,
      partialInvoices,
      totalRevenue,
      collectedRevenue,
      pendingRevenue
    };
  }, [filteredInvoices]);

  const calculateTotals = () => {
    if (!Array.isArray(items) || items.length === 0) {
      return { subtotal: 0, taxAmount: 0, discount: 0, total: 0 };
    }
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(String(item?.quantity || 0)) * parseFloat(String(item?.unit_price || 0))), 0);
    const taxAmount = items.reduce((sum, item) => sum + (parseFloat(String(item?.tax_amount || 0))), 0);
    const discount = items.reduce((sum, item) => sum + (parseFloat(String(item?.discount || 0))), 0);
    const total = subtotal + taxAmount - discount;
    return { subtotal, taxAmount, discount, total };
  };

  const totals = calculateTotals();

  const handlePrint = async (invoice: SalesInvoice) => {
    setIsPrinting(true);
    try {
      if (!invoice || !invoice.id) throw new Error("فاتورة غير صالحة");
      const items = await fetchInvoiceItems(invoice.id);
      const customer = invoice.customers;
      let paymentMethodLabel = '';
      switch (invoice.payment_method) {
        case 'cash': paymentMethodLabel = 'نقداً'; break;
        case 'transfer': paymentMethodLabel = 'تحويل بنكي'; break;
        case 'card': paymentMethodLabel = 'بطاقة ائتمانية'; break;
        default: paymentMethodLabel = 'آجل'; break;
      }
      const printContent = `
        <html>
          <head>
            <title>فاتورة ${invoice.invoice_number}</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; color: #333; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #10b981; padding-bottom: 20px; }
              .header h1 { color: #10b981; margin: 0; font-size: 2.5em; }
              .header p { color: #555; font-size: 1.1em; margin-top: 5px; }
              .info-section { display: flex; justify-content: space-between; margin-bottom: 30px; gap: 20px; }
              .info-box { flex: 1; padding: 20px; background: #f0fdf4; border-radius: 10px; border: 1px solid #dcfce7; }
              .info-box h3 { color: #047857; margin-top: 0; margin-bottom: 15px; font-size: 1.3em; }
              .info-box p { margin: 5px 0; font-size: 1em; }
              .info-box strong { color: #333; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; box-shadow: 0 0 15px rgba(0,0,0,0.05); border-radius: 10px; overflow: hidden; }
              th, td { border: 1px solid #e0f2f1; padding: 15px; text-align: right; }
              th { background: #0d9488; color: white; font-weight: bold; }
              tr:nth-child(even) { background-color: #f7fcfb; }
              .totals { margin-top: 30px; background: #f0fdf4; padding: 25px; border-radius: 10px; border: 1px solid #dcfce7; }
              .total-row { display: flex; justify-content: space-between; margin: 10px 0; font-size: 1.1em; }
              .total-row span:first-child { color: #555; }
              .total-row span:last-child { font-weight: bold; color: #10b981; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>فاتورة مبيعات</h1>
              <p>رقم الفاتورة: <strong>${safeValue(invoice.invoice_number)}</strong></p>
              <p>التاريخ: <strong>${safeFormatDate(invoice.invoice_date)}</strong></p>
            </div>
            <div class="info-section">
              <div class="info-box">
                <h3>بيانات العميل</h3>
                <p><strong>الاسم:</strong> ${safeValue(customer?.customer_name)}</p>
                <p><strong>الهاتف:</strong> ${safeValue(customer?.phone)}</p>
                <p><strong>البريد:</strong> ${safeValue(customer?.email)}</p>
              </div>
              <div class="info-box">
                <h3>بيانات الفاتورة</h3>
                <p><strong>تاريخ الإصدار:</strong> ${safeFormatDate(invoice.invoice_date)}</p>
                <p><strong>تاريخ الاستحقاق:</strong> ${safeFormatDate(invoice.due_date)}</p>
                <p><strong>طريقة الدفع:</strong> ${paymentMethodLabel}</p>
                <p><strong>الحالة:</strong> ${safeValue(invoice.payment_status)}</p>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>م</th>
                  <th>المنتج</th>
                  <th>الكمية</th>
                  <th>سعر الوحدة</th>
                  <th>الضريبة</th>
                  <th>الخصم</th>
                  <th>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                ${items.map((item, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${safeValue(item.product_name)}</td>
                    <td>${safeToLocaleString(item.quantity)}</td>
                    <td>${formatCurrency(item.unit_price)}</td>
                    <td>${formatCurrency(item.tax_amount)}</td>
                    <td>${formatCurrency(item.discount)}</td>
                    <td>${formatCurrency(item.total)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="totals">
              <div class="total-row">
                <span>المجموع الفرعي:</span> <span>${formatCurrency(invoice.subtotal)}</span>
              </div>
              <div class="total-row">
                <span>إجمالي الضريبة:</span> <span>${formatCurrency(invoice.tax_amount)}</span>
              </div>
              <div class="total-row">
                <span>الخصم:</span> <span>${formatCurrency(invoice.discount)}</span>
              </div>
              <div class="total-row">
                <span><strong>الإجمالي الكلي:</strong></span> <span><strong>${formatCurrency(invoice.total_amount)}</strong></span>
              </div>
              <div class="total-row">
                <span>المدفوع:</span> <span>${formatCurrency(invoice.paid_amount)}</span>
              </div>
              <div class="total-row">
                <span>المتبقي:</span> <span>${formatCurrency(invoice.remaining_amount)}</span>
              </div>
            </div>
            ${invoice.notes ? `<p style="margin-top:40px;"><strong>ملاحظات:</strong> ${invoice.notes}</p>` : ''}
          </body>
        </html>
      `;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 400);
      }
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div>
      {/* ضع عناصر الواجهة هنا أو صممها كما يناسبك */}
    </div>
  );
};

export default SalesInvoices;
