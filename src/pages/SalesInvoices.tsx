import { Receipt, Plus, Search, MoveHorizontal as MoreHorizontal, Eye, Trash2, Download, Loader as Loader2, DollarSign, FileText, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
  product_id: string;
  product_name: string;
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
  notes: string | null;
  status: string;
  created_at: string;
  customers?: Customer;
}

const SalesInvoices = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

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
  const { session } = useAuth();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["sales-invoices"],
    queryFn: async () => {
      if (!session?.user?.id) throw new Error("يجب تسجيل الدخول أولاً");

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
        .eq("created_by", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SalesInvoice[];
    },
    enabled: !!session?.user?.id,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      if (!session?.user?.id) throw new Error("يجب تسجيل الدخول أولاً");

      const { data, error } = await supabase
        .from("customers")
        .select("id, customer_name, email, phone")
        .eq("created_by", session.user.id)
        .eq("status", "active");

      if (error) throw error;
      return data as Customer[];
    },
    enabled: !!session?.user?.id,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      if (!session?.user?.id) throw new Error("يجب تسجيل الدخول أولاً");

      const { data, error } = await supabase
        .from("products")
        .select("id, product_name, selling_price, tax_rate")
        .eq("created_by", session.user.id)
        .eq("status", "active");

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!session?.user?.id,
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase
        .from("sales_invoices")
        .delete()
        .eq("id", invoiceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-invoices"] });
      toast({ title: "تم بنجاح", description: "تم حذف الفاتورة بنجاح" });
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async () => {
      if (!session?.user?.id) throw new Error("يجب تسجيل الدخول أولاً");
      if (items.length === 0) throw new Error("يجب إضافة منتج واحد على الأقل");

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
          due_date: formData.due_date,
          subtotal,
          tax_amount: taxAmount,
          discount,
          total_amount: totalAmount,
          paid_amount: 0,
          remaining_amount: totalAmount,
          payment_status: "unpaid",
          notes: formData.notes,
          created_by: session.user.id,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-invoices"] });
      toast({ title: "تم بنجاح", description: "تم إنشاء الفاتورة بنجاح" });
      setAddDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      customer_id: "",
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: "",
      notes: "",
    });
    setItems([]);
    setNewItem({ product_id: "", quantity: "1", discount: "0" });
  };

  const addItem = () => {
    const product = products.find(p => p.id === newItem.product_id);
    if (!product) {
      toast({ title: "خطأ", description: "يرجى اختيار منتج", variant: "destructive" });
      return;
    }

    const quantity = parseInt(newItem.quantity);
    const discount = parseFloat(newItem.discount);

    if (quantity <= 0) {
      toast({ title: "خطأ", description: "الكمية يجب أن تكون أكبر من صفر", variant: "destructive" });
      return;
    }

    const unitPrice = product.selling_price;
    const lineTotal = quantity * unitPrice;
    const taxAmount = (lineTotal * product.tax_rate) / 100;
    const total = lineTotal + taxAmount - discount;

    const item: InvoiceItem = {
      product_id: product.id,
      product_name: product.product_name,
      quantity,
      unit_price: unitPrice,
      tax_rate: product.tax_rate,
      tax_amount: taxAmount,
      discount,
      total,
    };

    setItems([...items, item]);
    setNewItem({ product_id: "", quantity: "1", discount: "0" });
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const filteredInvoices = invoices.filter((invoice) =>
    invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.customers?.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePrint = (invoice: SalesInvoice) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const customer = invoice.customers;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>فاتورة ${invoice.invoice_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; direction: rtl; }
          .invoice-header { text-align: center; margin-bottom: 30px; }
          .invoice-header h1 { color: #1e40af; font-size: 28px; margin-bottom: 10px; }
          .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .info-box { flex: 1; }
          .info-box h3 { color: #374151; margin-bottom: 10px; }
          .info-box p { color: #6b7280; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; margin: 30px 0; }
          th { background: #1e40af; color: white; padding: 12px; text-align: right; }
          td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
          .totals { margin-top: 20px; text-align: left; }
          .totals div { padding: 8px 0; }
          .total-final { font-size: 20px; font-weight: bold; color: #1e40af; border-top: 2px solid #1e40af; padding-top: 10px; margin-top: 10px; }
          .footer { margin-top: 50px; text-align: center; color: #6b7280; font-size: 14px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <h1>فاتورة مبيعات</h1>
          <p>رقم الفاتورة: ${invoice.invoice_number}</p>
        </div>

        <div class="invoice-info">
          <div class="info-box">
            <h3>بيانات العميل:</h3>
            <p><strong>${customer?.customer_name || 'غير محدد'}</strong></p>
            ${customer?.email ? `<p>البريد: ${customer.email}</p>` : ''}
            ${customer?.phone ? `<p>الهاتف: ${customer.phone}</p>` : ''}
          </div>

          <div class="info-box">
            <h3>تفاصيل الفاتورة:</h3>
            <p>التاريخ: ${new Date(invoice.invoice_date).toLocaleDateString('ar-SA')}</p>
            <p>تاريخ الاستحقاق: ${new Date(invoice.due_date).toLocaleDateString('ar-SA')}</p>
            <p>الحالة: ${invoice.status === 'posted' ? 'منشورة' : 'مسودة'}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>المنتج</th>
              <th>الكمية</th>
              <th>السعر</th>
              <th>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="4" style="text-align: center; padding: 20px;">بيانات المنتجات</td>
            </tr>
          </tbody>
        </table>

        <div class="totals">
          <div>المجموع الفرعي: ${invoice.subtotal.toFixed(2)} ر.س</div>
          <div>الضريبة: ${invoice.tax_amount.toFixed(2)} ر.س</div>
          <div>الخصم: ${invoice.discount.toFixed(2)} ر.س</div>
          <div class="total-final">الإجمالي: ${invoice.total_amount.toFixed(2)} ر.س</div>
          <div>المدفوع: ${invoice.paid_amount.toFixed(2)} ر.س</div>
          <div>المتبقي: ${invoice.remaining_amount.toFixed(2)} ر.س</div>
        </div>

        ${invoice.notes ? `<div style="margin-top: 30px;"><strong>ملاحظات:</strong> ${invoice.notes}</div>` : ''}

        <div class="footer">
          <p>شكراً لتعاملكم معنا</p>
          <p>تم الطباعة في: ${new Date().toLocaleString('ar-SA')}</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `);

    printWindow.document.close();
  };

  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(inv => inv.payment_status === 'paid').length;
  const unpaidInvoices = invoices.filter(inv => inv.payment_status === 'unpaid').length;
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const taxAmount = items.reduce((sum, item) => sum + item.tax_amount, 0);
    const discount = items.reduce((sum, item) => sum + item.discount, 0);
    const total = subtotal + taxAmount - discount;
    return { subtotal, taxAmount, discount, total };
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/20 to-emerald-50/30">
      <div className="p-6 space-y-6">
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

        <div className="grid gap-6 md:grid-cols-4">
          <Card className="bg-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500">إجمالي الفواتير</div>
                <div className="text-4xl font-bold text-gray-900 mt-2">{totalInvoices}</div>
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
                <div className="text-4xl font-bold text-green-600 mt-2">{paidInvoices}</div>
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
                <div className="text-4xl font-bold text-orange-600 mt-2">{unpaidInvoices}</div>
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
                  {totalRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 mt-1">ريال سعودي</p>
              </div>
              <div className="h-16 w-16 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center">
                <DollarSign className="h-8 w-8 text-emerald-600" />
              </div>
            </div>
          </Card>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث عن فاتورة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>

        <Card className="border-0 shadow-lg bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رقم الفاتورة</TableHead>
                <TableHead className="text-right">العميل</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">الإجمالي</TableHead>
                <TableHead className="text-right">المدفوع</TableHead>
                <TableHead className="text-right">المتبقي</TableHead>
                <TableHead className="text-right">حالة الدفع</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    لا توجد فواتير
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium text-gray-600">{invoice.invoice_number}</TableCell>
                    <TableCell>{invoice.customers?.customer_name || "-"}</TableCell>
                    <TableCell>{new Date(invoice.invoice_date).toLocaleDateString('ar-SA')}</TableCell>
                    <TableCell>{invoice.total_amount.toFixed(2)} ر.س</TableCell>
                    <TableCell>{invoice.paid_amount.toFixed(2)} ر.س</TableCell>
                    <TableCell>{invoice.remaining_amount.toFixed(2)} ر.س</TableCell>
                    <TableCell>
                      <Badge variant={
                        invoice.payment_status === 'paid' ? 'default' :
                        invoice.payment_status === 'partial' ? 'secondary' :
                        'destructive'
                      }>
                        {invoice.payment_status === 'paid' ? 'مدفوعة' :
                         invoice.payment_status === 'partial' ? 'مدفوعة جزئياً' :
                         'غير مدفوعة'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={invoice.status === 'posted' ? 'default' : 'secondary'}>
                        {invoice.status === 'posted' ? 'منشورة' : 'مسودة'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="hover:bg-gray-100">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2" onClick={() => handlePrint(invoice)}>
                            <Download className="h-4 w-4" />
                            طباعة
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => {
                            setSelectedInvoice(invoice);
                            setViewDialogOpen(true);
                          }}>
                            <Eye className="h-4 w-4" />
                            عرض
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="gap-2 text-destructive"
                            onClick={() => {
                              setInvoiceToDelete(invoice.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
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

        {/* View Invoice Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>تفاصيل الفاتورة</DialogTitle>
            </DialogHeader>
            {selectedInvoice && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>رقم الفاتورة</Label>
                    <p className="font-semibold">{selectedInvoice.invoice_number}</p>
                  </div>
                  <div>
                    <Label>العميل</Label>
                    <p className="font-semibold">{selectedInvoice.customers?.customer_name}</p>
                  </div>
                  <div>
                    <Label>التاريخ</Label>
                    <p>{new Date(selectedInvoice.invoice_date).toLocaleDateString('ar-SA')}</p>
                  </div>
                  <div>
                    <Label>تاريخ الاستحقاق</Label>
                    <p>{new Date(selectedInvoice.due_date).toLocaleDateString('ar-SA')}</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>المجموع الفرعي:</span>
                    <span>{selectedInvoice.subtotal.toFixed(2)} ر.س</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الضريبة:</span>
                    <span>{selectedInvoice.tax_amount.toFixed(2)} ر.س</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الخصم:</span>
                    <span>{selectedInvoice.discount.toFixed(2)} ر.س</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>الإجمالي:</span>
                    <span>{selectedInvoice.total_amount.toFixed(2)} ر.س</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>المدفوع:</span>
                    <span>{selectedInvoice.paid_amount.toFixed(2)} ر.س</span>
                  </div>
                  <div className="flex justify-between text-orange-600">
                    <span>المتبقي:</span>
                    <span>{selectedInvoice.remaining_amount.toFixed(2)} ر.س</span>
                  </div>
                </div>
                {selectedInvoice.notes && (
                  <>
                    <Separator />
                    <div>
                      <Label>ملاحظات</Label>
                      <p className="text-sm text-gray-600">{selectedInvoice.notes}</p>
                    </div>
                  </>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                إغلاق
              </Button>
              <Button onClick={() => selectedInvoice && handlePrint(selectedInvoice)}>
                <Download className="h-4 w-4 ml-2" />
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
                onClick={() => invoiceToDelete && deleteInvoiceMutation.mutate(invoiceToDelete)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
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
