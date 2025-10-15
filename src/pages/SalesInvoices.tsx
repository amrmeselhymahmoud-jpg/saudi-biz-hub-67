import { Receipt, Plus, Search, MoreHorizontal, Eye, Trash2, Loader2, DollarSign, FileText, CheckCircle2, Clock, Printer, Download } from "lucide-react";
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
  if (paidAmount >= totalAmount) {
    return 'paid';
  } else if (paidAmount > 0 && paidAmount < totalAmount) {
    return 'partial';
  } else if (paymentMethod === 'cash' && paidAmount === 0) {
    return 'unpaid';
  }
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
  const [isPrinting, setIsPrinting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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
          .select("*, customers ( id, customer_name, email, phone )")
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
    staleTime: 5 * 60 * 1000,
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

  // Enhanced delete mutation
  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      try {
        if (!invoiceId) {
          throw new Error("معرف الفاتورة غير صحيح");
        }

        console.log('Deleting invoice:', invoiceId);
        
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
          description: "تم حذف الفاتورة بنجاح" 
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

  // Enhanced fetch invoice items
  const fetchInvoiceItems = async (invoiceId: string): Promise<InvoiceItem[]> => {
    try {
      const { data, error } = await supabase
        .from("sales_invoice_items")
        .select("*, products ( product_name )")
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

  // FIXED: Enhanced print functionality
  const handlePrint = async (invoice: SalesInvoice) => {
    console.log('Starting print process for invoice:', invoice.invoice_number);
    setIsPrinting(true);

    try {
      if (!invoice || !invoice.id) {
        throw new Error("فاتورة غير صالحة");
      }

      // Fetch invoice items
      const items = await fetchInvoiceItems(invoice.id);
      const customer = invoice.customers;

      // Create simple HTML content for printing
      const printContent = `
        <html>
          <head>
            <title>فاتورة ${invoice.invoice_number}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 20px; 
                direction: rtl; 
              }
              .header { 
                text-align: center; 
                margin-bottom: 30px; 
                border-bottom: 2px solid #10b981; 
                padding-bottom: 20px; 
              }
              .header h1 { 
                color: #10b981; 
                margin: 0; 
              }
              .info-section { 
                display: flex; 
                justify-content: space-between; 
                margin-bottom: 30px; 
              }
              .info-box { 
                flex: 1; 
                margin: 0 10px; 
                padding: 15px; 
                background: #f9fafb; 
                border-radius: 8px; 
              }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 20px 0; 
              }
              th, td { 
                border: 1px solid #ddd; 
                padding: 12px; 
                text-align: right; 
              }
              th { 
                background: #10b981; 
                color: white; 
              }
              .totals { 
                margin-top: 30px; 
                background: #f9fafb; 
                padding: 20px; 
                border-radius: 8px; 
              }
              .total-row { 
                display: flex; 
                justify-content: space-between; 
                margin: 5px 0; 
              }
              .footer { 
                margin-top: 50px; 
                text-align: center; 
                color: #666; 
              }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>فاتورة مبيعات</h1>
              <p>رقم الفاتورة: ${invoice.invoice_number}</p>
            </div>

            <div class="info-section">
              <div class="info-box">
                <h3>بيانات العميل</h3>
                <p><strong>الاسم:</strong> ${customer?.customer_name || 'غير محدد'}</p>
                ${customer?.email ? `<p><strong>البريد:</strong> ${customer.email}</p>` : ''}
                ${customer?.phone ? `<p><strong>الهاتف:</strong> ${customer.phone}</p>` : ''}
              </div>
              <div class="info-box">
                <h3>تفاصيل الفاتورة</h3>
                <p><strong>التاريخ:</strong> ${safeFormatDate(invoice.invoice_date, 'yyyy-MM-dd')}</p>
                <p><strong>تاريخ الاستحقاق:</strong> ${safeFormatDate(invoice.due_date, 'yyyy-MM-dd')}</p>
                <p><strong>حالة الدفع:</strong> ${invoice.payment_status === 'paid' ? 'مدفوعة' : invoice.payment_status === 'partial' ? 'مدفوعة جزئياً' : 'غير مدفوعة'}</p>
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
                      <td>${item.product_name}</td>
                      <td>${item.quantity}</td>
                      <td>${item.unit_price.toFixed(2)}</td>
                      <td>${item.tax_amount.toFixed(2)}</td>
                      <td>${item.discount.toFixed(2)}</td>
                      <td>${item.total.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p style="text-align: center;">لا توجد بنود في هذه الفاتورة</p>'}

            <div class="totals">
              <div class="total-row">
                <span>المجموع الفرعي:</span>
                <span>${invoice.subtotal.toFixed(2)} ر.س</span>
              </div>
              <div class="total-row">
                <span>الضريبة:</span>
                <span>${invoice.tax_amount.toFixed(2)} ر.س</span>
              </div>
              <div class="total-row">
                <span>الخصم:</span>
                <span>${invoice.discount.toFixed(2)} ر.س</span>
              </div>
              <div class="total-row" style="font-weight: bold; font-size: 1.2em; border-top: 2px solid #10b981; padding-top: 10px;">
                <span>الإجمالي:</span>
                <span>${invoice.total_amount.toFixed(2)} ر.س</span>
              </div>
              <div class="total-row" style="color: #10b981;">
                <span>المدفوع:</span>
                <span>${invoice.paid_amount.toFixed(2)} ر.س</span>
              </div>
              <div class="total-row" style="color: #f59e0b;">
                <span>المتبقي:</span>
                <span>${invoice.remaining_amount.toFixed(2)} ر.س</span>
              </div>
            </div>

            ${invoice.notes ? `
              <div style="margin-top: 30px; padding: 15px; background: #f9fafb; border-radius: 8px;">
                <strong>ملاحظات:</strong>
                <p>${invoice.notes}</p>
              </div>
            ` : ''}

            <div class="footer">
              <p>شكراً لتعاملكم معنا</p>
              <p>تم الطباعة في: ${new Date().toLocaleString('ar-SA')}</p>
            </div>

            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 1000);
              };
            </script>
          </body>
        </html>
      `;

      // Create print window
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        throw new Error('فشل في فتح نافذة الطباعة. يرجى السماح بالنوافذ المنبثقة.');
      }

      printWindow.document.write(printContent);
      printWindow.document.close();

      toast({
        title: "جاري الطباعة",
        description: "يتم الآن فتح نافذة الطباعة"
      });

    } catch (error) {
      console.error('Error printing invoice:', error);
      toast({
        title: "خطأ في الطباعة",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء الطباعة",
        variant: "destructive",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  // FIXED: Enhanced PDF export
  const handleExportInvoicePDF = async (invoice: SalesInvoice) => {
    console.log('Exporting invoice to PDF:', invoice.invoice_number);
    setIsExporting(true);

    try {
      if (!invoice || !invoice.id) {
        throw new Error("فاتورة غير صالحة");
      }

      const items = await fetchInvoiceItems(invoice.id);
      const customer = invoice.customers;

      // Create PDF with landscape orientation for better layout
      const doc = new jsPDF('p', 'mm', 'a4');
      
      // Set initial position
      let yPos = 20;

      // Header
      doc.setFillColor(16, 185, 129);
      doc.rect(0, 0, 210, 25, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('فاتورة مبيعات', 105, 12, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`رقم الفاتورة: ${invoice.invoice_number}`, 105, 18, { align: 'center' });

      // Reset colors
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');

      yPos = 35;

      // Customer Info
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('بيانات العميل:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`الاسم: ${customer?.customer_name || 'غير محدد'}`, 20, yPos + 8);
      if (customer?.email) {
        doc.text(`البريد: ${customer.email}`, 20, yPos + 16);
      }
      if (customer?.phone) {
        doc.text(`الهاتف: ${customer.phone}`, 20, yPos + 24);
      }

      // Invoice Info
      doc.setFont('helvetica', 'bold');
      doc.text('تفاصيل الفاتورة:', 150, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(`التاريخ: ${safeFormatDate(invoice.invoice_date, 'yyyy-MM-dd')}`, 150, yPos + 8);
      doc.text(`تاريخ الاستحقاق: ${safeFormatDate(invoice.due_date, 'yyyy-MM-dd')}`, 150, yPos + 16);
      doc.text(`حالة الدفع: ${invoice.payment_status === 'paid' ? 'مدفوعة' : invoice.payment_status === 'partial' ? 'مدفوعة جزئياً' : 'غير مدفوعة'}`, 150, yPos + 24);

      yPos += 40;

      // Items Table
      if (items.length > 0) {
        const tableData = items.map((item, index) => [
          (index + 1).toString(),
          item.product_name || 'N/A',
          item.quantity.toString(),
          item.unit_price.toFixed(2),
          item.tax_amount.toFixed(2),
          item.discount.toFixed(2),
          item.total.toFixed(2)
        ]);

        (doc as any).autoTable({
          startY: yPos,
          head: [['#', 'المنتج', 'الكمية', 'السعر', 'الضريبة', 'الخصم', 'الإجمالي']],
          body: tableData,
          styles: { 
            halign: 'center',
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
      } else {
        doc.setFontSize(12);
        doc.text('لا توجد بنود في هذه الفاتورة', 105, yPos, { align: 'center' });
        yPos += 20;
      }

      // Totals Section
      const totalsStartY = yPos;
      
      doc.setFillColor(249, 250, 251);
      doc.rect(120, totalsStartY, 80, 60, 'F');
      doc.setDrawColor(229, 231, 235);
      doc.rect(120, totalsStartY, 80, 60, 'S');

      doc.setFontSize(10);
      let currentY = totalsStartY + 10;

      // Subtotal
      doc.text('المجموع الفرعي:', 195, currentY, { align: 'right' });
      doc.text(`${invoice.subtotal.toFixed(2)} ر.س`, 125, currentY);
      currentY += 8;

      // Tax
      doc.text('الضريبة:', 195, currentY, { align: 'right' });
      doc.text(`${invoice.tax_amount.toFixed(2)} ر.س`, 125, currentY);
      currentY += 8;

      // Discount
      doc.setTextColor(220, 38, 38);
      doc.text('الخصم:', 195, currentY, { align: 'right' });
      doc.text(`${invoice.discount.toFixed(2)} ر.س`, 125, currentY);
      currentY += 10;

      // Total
      doc.setTextColor(16, 185, 129);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('الإجمالي:', 195, currentY, { align: 'right' });
      doc.text(`${invoice.total_amount.toFixed(2)} ر.س`, 125, currentY);
      currentY += 10;

      // Paid
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('المدفوع:', 195, currentY, { align: 'right' });
      doc.text(`${invoice.paid_amount.toFixed(2)} ر.س`, 125, currentY);
      currentY += 8;

      // Remaining
      doc.setTextColor(245, 158, 11);
      doc.text('المتبقي:', 195, currentY, { align: 'right' });
      doc.text(`${invoice.remaining_amount.toFixed(2)} ر.س`, 125, currentY);

      yPos = totalsStartY + 70;

      // Notes
      if (invoice.notes) {
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text('ملاحظات:', 20, yPos);
        const splitNotes = doc.splitTextToSize(invoice.notes, 180);
        doc.text(splitNotes, 20, yPos + 8);
        yPos += 20 + (splitNotes.length * 4);
      }

      // Footer
      doc.setDrawColor(16, 185, 129);
      doc.line(20, 280, 190, 280);
      
      doc.setFontSize(12);
      doc.setTextColor(16, 185, 129);
      doc.text('شكراً لتعاملكم معنا', 105, 285, { align: 'center' });
      
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text(`تم التصدير في: ${new Date().toLocaleString('ar-SA')}`, 105, 290, { align: 'center' });

      // Save PDF
      const fileName = `invoice-${invoice.invoice_number}.pdf`;
      doc.save(fileName);

      toast({
        title: "تم التصدير بنجاح",
        description: `تم حفظ الملف كـ ${fileName}`,
      });

    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "خطأ في التصدير",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء تصدير الفاتورة إلى PDF",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
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
      setSelectedInvoice(invoice);
      setViewDialogOpen(true);
    } catch (error) {
      console.error('Error in handleView:', error);
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
                onClick={() => handlePrint(invoice)}
                disabled={isPrinting}
              >
                <Printer className="h-4 w-4" />
                {isPrinting ? 'جاري الطباعة...' : 'طباعة الفاتورة'}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onClick={() => handleExportInvoicePDF(invoice)}
                disabled={isExporting}
              >
                <Download className="h-4 w-4" />
                {isExporting ? 'جاري التصدير...' : 'تصدير PDF'}
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
            onClick={() => navigate('/sales-invoices/new')}
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
                        onClick={() => navigate('/sales-invoices/new')}
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
                      <Label className="text-sm text-gray-500">حالة الدفع</Label>
                      <div className="mt-1">
                        {getPaymentStatusBadge(selectedInvoice.payment_status)}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Invoice Items */}
                {selectedInvoice && (
                  <div>
                    <h3 className="font-semibold text-lg mb-4">الملخص المالي</h3>
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
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedInvoice?.notes && (
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
                  disabled={isExporting}
                >
                  <Download className="h-4 w-4 ml-2" />
                  {isExporting ? 'جاري التصدير...' : 'تصدير PDF'}
                </Button>
                <Button 
                  onClick={() => {
                    if (selectedInvoice) {
                      handlePrint(selectedInvoice);
                    }
                  }}
                  disabled={isPrinting}
                >
                  <Printer className="h-4 w-4 ml-2" />
                  {isPrinting ? 'جاري الطباعة...' : 'طباعة الفاتورة'}
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
                  هذا الإجراء لا يمكن التراجع عنه.
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