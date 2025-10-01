import { useState, useEffect } from "react";
import { Receipt, Plus, Eye, Edit, Trash2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface PurchaseInvoice {
  id: string;
  invoice_number: string;
  supplier_id: string;
  purchase_order_id: string | null;
  invoice_date: string;
  due_date: string | null;
  status: string;
  payment_status: string;
  items: any[];
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  notes: string | null;
  suppliers?: { name: string };
}

interface Supplier {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  cost_price: number;
  tax_rate: number;
}

const PurchaseInvoices = () => {
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    supplier_id: "",
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: "",
    discount_amount: "0",
    notes: "",
  });

  const [paymentAmount, setPaymentAmount] = useState("");

  const [invoiceItems, setInvoiceItems] = useState<any[]>([
    { product_id: "", product_name: "", quantity: 1, unit_price: 0, tax_rate: 15, total: 0 }
  ]);

  const statusColors: Record<string, string> = {
    draft: "bg-gray-500",
    pending: "bg-yellow-500",
    paid: "bg-green-500",
    overdue: "bg-red-500",
    cancelled: "bg-red-700",
  };

  const statusLabels: Record<string, string> = {
    draft: "مسودة",
    pending: "قيد الانتظار",
    paid: "مدفوعة",
    overdue: "متأخرة",
    cancelled: "ملغية",
  };

  const paymentStatusColors: Record<string, string> = {
    unpaid: "bg-red-500",
    partial: "bg-yellow-500",
    paid: "bg-green-500",
  };

  const paymentStatusLabels: Record<string, string> = {
    unpaid: "غير مدفوعة",
    partial: "مدفوعة جزئياً",
    paid: "مدفوعة بالكامل",
  };

  useEffect(() => {
    fetchInvoices();
    fetchSuppliers();
    fetchProducts();
  }, []);

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from("purchase_invoices")
        .select(`
          *,
          suppliers (name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل فواتير المشتريات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    const { data } = await supabase
      .from("suppliers")
      .select("id, name")
      .order("name");
    setSuppliers(data || []);
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, name, cost_price, tax_rate")
      .eq("is_active", true)
      .order("name");
    setProducts(data || []);
  };

  const generateInvoiceNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `PI-${timestamp}`;
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let taxTotal = 0;

    invoiceItems.forEach(item => {
      if (item.product_id && item.quantity > 0 && item.unit_price > 0) {
        const itemSubtotal = item.quantity * item.unit_price;
        const itemTax = (itemSubtotal * item.tax_rate) / 100;
        subtotal += itemSubtotal;
        taxTotal += itemTax;
      }
    });

    const discount = parseFloat(formData.discount_amount) || 0;
    const total = subtotal + taxTotal - discount;

    return {
      subtotal: subtotal.toFixed(2),
      tax: taxTotal.toFixed(2),
      discount: discount.toFixed(2),
      total: total.toFixed(2),
    };
  };

  const handleAddItem = () => {
    setInvoiceItems([
      ...invoiceItems,
      { product_id: "", product_name: "", quantity: 1, unit_price: 0, tax_rate: 15, total: 0 }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (invoiceItems.length > 1) {
      setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...invoiceItems];
    updatedItems[index][field] = value;

    if (field === "product_id") {
      const product = products.find(p => p.id === value);
      if (product) {
        updatedItems[index].product_name = product.name;
        updatedItems[index].unit_price = product.cost_price;
        updatedItems[index].tax_rate = product.tax_rate;
      }
    }

    if (field === "quantity" || field === "unit_price" || field === "tax_rate") {
      const qty = parseFloat(updatedItems[index].quantity) || 0;
      const price = parseFloat(updatedItems[index].unit_price) || 0;
      const tax = parseFloat(updatedItems[index].tax_rate) || 0;
      const itemSubtotal = qty * price;
      updatedItems[index].total = itemSubtotal + (itemSubtotal * tax / 100);
    }

    setInvoiceItems(updatedItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.supplier_id) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار المورد",
        variant: "destructive",
      });
      return;
    }

    const validItems = invoiceItems.filter(item => item.product_id && item.quantity > 0);
    if (validItems.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى إضافة منتج واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    const totals = calculateTotals();

    try {
      const invoiceData = {
        invoice_number: isEditing ? selectedInvoice?.invoice_number : generateInvoiceNumber(),
        supplier_id: formData.supplier_id,
        invoice_date: formData.invoice_date,
        due_date: formData.due_date || null,
        status: "pending",
        payment_status: "unpaid",
        items: validItems,
        subtotal: parseFloat(totals.subtotal),
        tax_amount: parseFloat(totals.tax),
        discount_amount: parseFloat(totals.discount),
        total_amount: parseFloat(totals.total),
        paid_amount: 0,
        notes: formData.notes || null,
        user_id: (await supabase.auth.getUser()).data.user?.id,
      };

      let error;
      if (isEditing && selectedInvoice) {
        const result = await supabase
          .from("purchase_invoices")
          .update(invoiceData)
          .eq("id", selectedInvoice.id);
        error = result.error;
      } else {
        const result = await supabase
          .from("purchase_invoices")
          .insert([invoiceData]);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: isEditing ? "تم تحديث الفاتورة" : "تم إضافة فاتورة جديدة",
      });

      setDialogOpen(false);
      resetForm();
      fetchInvoices();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handlePayment = async () => {
    if (!selectedInvoice) return;

    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال مبلغ صحيح",
        variant: "destructive",
      });
      return;
    }

    const newPaidAmount = selectedInvoice.paid_amount + amount;
    if (newPaidAmount > selectedInvoice.total_amount) {
      toast({
        title: "خطأ",
        description: "المبلغ المدخل أكبر من المبلغ المتبقي",
        variant: "destructive",
      });
      return;
    }

    let paymentStatus = "partial";
    let status = "pending";
    if (newPaidAmount >= selectedInvoice.total_amount) {
      paymentStatus = "paid";
      status = "paid";
    }

    try {
      const { error } = await supabase
        .from("purchase_invoices")
        .update({
          paid_amount: newPaidAmount,
          payment_status: paymentStatus,
          status: status,
        })
        .eq("id", selectedInvoice.id);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم تسجيل الدفعة بنجاح",
      });

      setPaymentDialogOpen(false);
      setPaymentAmount("");
      fetchInvoices();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف الفاتورة؟")) return;

    try {
      const { error } = await supabase
        .from("purchase_invoices")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف الفاتورة بنجاح",
      });

      fetchInvoices();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (invoice: PurchaseInvoice) => {
    setSelectedInvoice(invoice);
    setIsEditing(true);
    setFormData({
      supplier_id: invoice.supplier_id,
      invoice_date: invoice.invoice_date,
      due_date: invoice.due_date || "",
      discount_amount: invoice.discount_amount.toString(),
      notes: invoice.notes || "",
    });
    setInvoiceItems(invoice.items.length > 0 ? invoice.items : [
      { product_id: "", product_name: "", quantity: 1, unit_price: 0, tax_rate: 15, total: 0 }
    ]);
    setDialogOpen(true);
  };

  const handleView = (invoice: PurchaseInvoice) => {
    setSelectedInvoice(invoice);
    setViewDialogOpen(true);
  };

  const openPaymentDialog = (invoice: PurchaseInvoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount("");
    setPaymentDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      supplier_id: "",
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: "",
      discount_amount: "0",
      notes: "",
    });
    setInvoiceItems([
      { product_id: "", product_name: "", quantity: 1, unit_price: 0, tax_rate: 15, total: 0 }
    ]);
    setIsEditing(false);
    setSelectedInvoice(null);
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.suppliers?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totals = calculateTotals();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Receipt className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">فواتير المشتريات</h1>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="ml-2 h-4 w-4" />
          فاتورة جديدة
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="بحث برقم الفاتورة أو اسم المورد..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="تصفية حسب حالة الدفع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="unpaid">غير مدفوعة</SelectItem>
                <SelectItem value="partial">مدفوعة جزئياً</SelectItem>
                <SelectItem value="paid">مدفوعة بالكامل</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد فواتير
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الفاتورة</TableHead>
                    <TableHead>المورد</TableHead>
                    <TableHead>تاريخ الفاتورة</TableHead>
                    <TableHead>تاريخ الاستحقاق</TableHead>
                    <TableHead>حالة الدفع</TableHead>
                    <TableHead>المبلغ الإجمالي</TableHead>
                    <TableHead>المدفوع</TableHead>
                    <TableHead>المتبقي</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.suppliers?.name}</TableCell>
                      <TableCell>{format(new Date(invoice.invoice_date), "yyyy-MM-dd")}</TableCell>
                      <TableCell>
                        {invoice.due_date ? format(new Date(invoice.due_date), "yyyy-MM-dd") : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={paymentStatusColors[invoice.payment_status]}>
                          {paymentStatusLabels[invoice.payment_status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{invoice.total_amount.toFixed(2)} ر.س</TableCell>
                      <TableCell>{invoice.paid_amount.toFixed(2)} ر.س</TableCell>
                      <TableCell>
                        {(invoice.total_amount - invoice.paid_amount).toFixed(2)} ر.س
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          {invoice.payment_status !== "paid" && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => openPaymentDialog(invoice)}
                            >
                              <DollarSign className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleView(invoice)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(invoice)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(invoice.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "تعديل فاتورة المشتريات" : "فاتورة مشتريات جديدة"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المورد *</Label>
                <Select
                  value={formData.supplier_id}
                  onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المورد" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>تاريخ الفاتورة *</Label>
                <Input
                  type="date"
                  value={formData.invoice_date}
                  onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>تاريخ الاستحقاق</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>الخصم</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.discount_amount}
                  onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>المنتجات *</Label>
                <Button type="button" size="sm" onClick={handleAddItem}>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة منتج
                </Button>
              </div>
              <div className="space-y-2">
                {invoiceItems.map((item, index) => (
                  <div key={index} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Select
                        value={item.product_id}
                        onValueChange={(value) => handleItemChange(index, "product_id", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المنتج" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      type="number"
                      placeholder="الكمية"
                      className="w-24"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="السعر"
                      className="w-32"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, "unit_price", e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="الضريبة %"
                      className="w-24"
                      value={item.tax_rate}
                      onChange={(e) => handleItemChange(index, "tax_rate", e.target.value)}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveItem(index)}
                      disabled={invoiceItems.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-end space-y-1 text-sm">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span>المجموع الفرعي:</span>
                    <span className="font-bold">{totals.subtotal} ر.س</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الضريبة:</span>
                    <span className="font-bold">{totals.tax} ر.س</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الخصم:</span>
                    <span className="font-bold">-{totals.discount} ر.س</span>
                  </div>
                  <div className="flex justify-between text-lg border-t pt-2">
                    <span>الإجمالي:</span>
                    <span className="font-bold text-primary">{totals.total} ر.س</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="أضف ملاحظات..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit">
                {isEditing ? "تحديث" : "إضافة"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تسجيل دفعة</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <div className="flex justify-between">
                  <span>المبلغ الإجمالي:</span>
                  <span className="font-bold">{selectedInvoice.total_amount.toFixed(2)} ر.س</span>
                </div>
                <div className="flex justify-between">
                  <span>المدفوع:</span>
                  <span className="font-bold">{selectedInvoice.paid_amount.toFixed(2)} ر.س</span>
                </div>
                <div className="flex justify-between text-primary">
                  <span>المتبقي:</span>
                  <span className="font-bold">
                    {(selectedInvoice.total_amount - selectedInvoice.paid_amount).toFixed(2)} ر.س
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>مبلغ الدفعة *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  max={selectedInvoice.total_amount - selectedInvoice.paid_amount}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handlePayment}>
                  تسجيل الدفعة
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>تفاصيل الفاتورة</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">رقم الفاتورة</Label>
                  <p className="font-bold">{selectedInvoice.invoice_number}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">المورد</Label>
                  <p className="font-bold">{selectedInvoice.suppliers?.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">تاريخ الفاتورة</Label>
                  <p>{format(new Date(selectedInvoice.invoice_date), "yyyy-MM-dd")}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">تاريخ الاستحقاق</Label>
                  <p>
                    {selectedInvoice.due_date
                      ? format(new Date(selectedInvoice.due_date), "yyyy-MM-dd")
                      : "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">حالة الدفع</Label>
                  <Badge className={paymentStatusColors[selectedInvoice.payment_status]}>
                    {paymentStatusLabels[selectedInvoice.payment_status]}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">المنتجات</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المنتج</TableHead>
                      <TableHead>الكمية</TableHead>
                      <TableHead>السعر</TableHead>
                      <TableHead>الضريبة</TableHead>
                      <TableHead>الإجمالي</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedInvoice.items.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.unit_price} ر.س</TableCell>
                        <TableCell>{item.tax_rate}%</TableCell>
                        <TableCell>{item.total.toFixed(2)} ر.س</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>المجموع الفرعي:</span>
                  <span className="font-bold">{selectedInvoice.subtotal.toFixed(2)} ر.س</span>
                </div>
                <div className="flex justify-between">
                  <span>الضريبة:</span>
                  <span className="font-bold">{selectedInvoice.tax_amount.toFixed(2)} ر.س</span>
                </div>
                <div className="flex justify-between">
                  <span>الخصم:</span>
                  <span className="font-bold">-{selectedInvoice.discount_amount.toFixed(2)} ر.س</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>الإجمالي:</span>
                  <span className="text-primary">{selectedInvoice.total_amount.toFixed(2)} ر.س</span>
                </div>
                <div className="flex justify-between">
                  <span>المدفوع:</span>
                  <span className="font-bold text-green-600">
                    {selectedInvoice.paid_amount.toFixed(2)} ر.س
                  </span>
                </div>
                <div className="flex justify-between text-lg">
                  <span>المتبقي:</span>
                  <span className="font-bold text-red-600">
                    {(selectedInvoice.total_amount - selectedInvoice.paid_amount).toFixed(2)} ر.س
                  </span>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div>
                  <Label className="text-muted-foreground">ملاحظات</Label>
                  <p>{selectedInvoice.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseInvoices;
