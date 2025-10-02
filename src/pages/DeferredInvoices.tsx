import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Plus,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface DeferredInvoice {
  id: string;
  invoice_number: string;
  invoice_type: string;
  customer_supplier_name: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: string;
  number_of_installments: number;
  installment_frequency: string;
}

interface Installment {
  id: string;
  installment_number: number;
  due_date: string;
  amount: number;
  paid_amount: number;
  status: string;
  payment_date: string | null;
}

interface InvoiceStats {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  overdueCount: number;
}

const DeferredInvoices = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<DeferredInvoice[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [stats, setStats] = useState<InvoiceStats>({
    totalInvoices: 0,
    totalAmount: 0,
    paidAmount: 0,
    remainingAmount: 0,
    overdueCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [showInstallments, setShowInstallments] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<DeferredInvoice | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [newInvoice, setNewInvoice] = useState({
    invoice_type: "مبيعات",
    customer_supplier_name: "",
    customer_supplier_phone: "",
    customer_supplier_email: "",
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: "",
    total_amount: 0,
    number_of_installments: 1,
    installment_frequency: "شهري",
    payment_terms: "",
    notes: ""
  });
  const [newPayment, setNewPayment] = useState({
    amount: 0,
    payment_method: "نقدي",
    reference_number: "",
    notes: ""
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, filterType, filterStatus]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadInvoices(),
        loadStats()
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل بيانات الفواتير",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadInvoices = async () => {
    let query = supabase
      .from("deferred_invoices")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    if (filterType !== "all") {
      query = query.eq("invoice_type", filterType);
    }

    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }

    const { data, error } = await query;

    if (error) throw error;
    setInvoices(data || []);
  };

  const loadStats = async () => {
    const { data } = await supabase
      .from("deferred_invoices")
      .select("total_amount, paid_amount, remaining_amount, status, due_date")
      .eq("user_id", user?.id);

    if (data) {
      const today = new Date().toISOString().split('T')[0];
      const overdueCount = data.filter(inv =>
        inv.status !== 'مكتمل' && inv.due_date < today
      ).length;

      setStats({
        totalInvoices: data.length,
        totalAmount: data.reduce((sum, inv) => sum + Number(inv.total_amount), 0),
        paidAmount: data.reduce((sum, inv) => sum + Number(inv.paid_amount), 0),
        remainingAmount: data.reduce((sum, inv) => sum + Number(inv.remaining_amount), 0),
        overdueCount
      });
    }
  };

  const loadInstallments = async (invoiceId: string) => {
    const { data, error } = await supabase
      .from("installment_schedule")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("installment_number", { ascending: true });

    if (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل الأقساط",
        variant: "destructive"
      });
      return;
    }

    setInstallments(data || []);
  };

  const handleAddInvoice = async () => {
    if (!newInvoice.customer_supplier_name || !newInvoice.due_date || newInvoice.total_amount <= 0) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى إدخال جميع البيانات المطلوبة",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("deferred_invoices")
        .insert([{
          user_id: user?.id,
          invoice_number: "",
          ...newInvoice,
          remaining_amount: newInvoice.total_amount
        }])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      const installmentAmount = newInvoice.total_amount / newInvoice.number_of_installments;
      const installments = [];
      const startDate = new Date(newInvoice.invoice_date);

      for (let i = 0; i < newInvoice.number_of_installments; i++) {
        const dueDate = new Date(startDate);

        switch (newInvoice.installment_frequency) {
          case "شهري":
            dueDate.setMonth(dueDate.getMonth() + i);
            break;
          case "ربع سنوي":
            dueDate.setMonth(dueDate.getMonth() + (i * 3));
            break;
          case "نصف سنوي":
            dueDate.setMonth(dueDate.getMonth() + (i * 6));
            break;
          case "سنوي":
            dueDate.setFullYear(dueDate.getFullYear() + i);
            break;
          case "أسبوعي":
            dueDate.setDate(dueDate.getDate() + (i * 7));
            break;
        }

        installments.push({
          user_id: user?.id,
          invoice_id: invoiceData.id,
          installment_number: i + 1,
          due_date: dueDate.toISOString().split('T')[0],
          amount: installmentAmount
        });
      }

      const { error: installmentsError } = await supabase
        .from("installment_schedule")
        .insert(installments);

      if (installmentsError) throw installmentsError;

      toast({
        title: "تم إضافة الفاتورة",
        description: "تم إضافة الفاتورة بنجاح"
      });

      setShowAddInvoice(false);
      resetNewInvoice();
      loadData();
    } catch (error) {
      console.error("Error adding invoice:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة الفاتورة",
        variant: "destructive"
      });
    }
  };

  const handleAddPayment = async () => {
    if (!selectedInvoice || newPayment.amount <= 0) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى إدخال مبلغ الدفعة",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("deferred_payments")
        .insert([{
          user_id: user?.id,
          invoice_id: selectedInvoice.id,
          amount: newPayment.amount,
          payment_method: newPayment.payment_method,
          reference_number: newPayment.reference_number,
          notes: newPayment.notes
        }]);

      if (error) throw error;

      toast({
        title: "تم تسجيل الدفعة",
        description: "تم تسجيل الدفعة بنجاح"
      });

      setShowAddPayment(false);
      setNewPayment({
        amount: 0,
        payment_method: "نقدي",
        reference_number: "",
        notes: ""
      });
      loadData();
    } catch (error) {
      console.error("Error adding payment:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تسجيل الدفعة",
        variant: "destructive"
      });
    }
  };

  const resetNewInvoice = () => {
    setNewInvoice({
      invoice_type: "مبيعات",
      customer_supplier_name: "",
      customer_supplier_phone: "",
      customer_supplier_email: "",
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: "",
      total_amount: 0,
      number_of_installments: 1,
      installment_frequency: "شهري",
      payment_terms: "",
      notes: ""
    });
  };

  const viewInstallments = async (invoice: DeferredInvoice) => {
    setSelectedInvoice(invoice);
    await loadInstallments(invoice.id);
    setShowInstallments(true);
  };

  const openPaymentDialog = (invoice: DeferredInvoice) => {
    setSelectedInvoice(invoice);
    setNewPayment({
      ...newPayment,
      amount: Number(invoice.remaining_amount)
    });
    setShowAddPayment(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "مكتمل":
        return "bg-green-100 text-green-800";
      case "نشط":
        return "bg-blue-100 text-blue-800";
      case "متأخر":
        return "bg-red-100 text-red-800";
      case "ملغي":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getInstallmentStatusColor = (status: string) => {
    switch (status) {
      case "مدفوع":
        return "bg-green-100 text-green-800";
      case "معلق":
        return "bg-yellow-100 text-yellow-800";
      case "متأخر":
        return "bg-red-100 text-red-800";
      case "مدفوع جزئي":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">فواتير الأجل</h1>
        </div>
        <Button onClick={() => setShowAddInvoice(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة فاتورة
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الفواتير</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInvoices}</div>
            <p className="text-xs text-muted-foreground">فاتورة أجل</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المبالغ</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAmount.toLocaleString()} ر.س</div>
            <p className="text-xs text-muted-foreground">مجموع الفواتير</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">المبالغ المدفوعة</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.paidAmount.toLocaleString()} ر.س</div>
            <p className="text-xs text-muted-foreground">تم السداد</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">المبالغ المتبقية</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.remainingAmount.toLocaleString()} ر.س</div>
            <p className="text-xs text-muted-foreground">{stats.overdueCount} فاتورة متأخرة</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>قائمة الفواتير</CardTitle>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="مبيعات">مبيعات</SelectItem>
                  <SelectItem value="مشتريات">مشتريات</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="نشط">نشط</SelectItem>
                  <SelectItem value="مكتمل">مكتمل</SelectItem>
                  <SelectItem value="متأخر">متأخر</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                تصدير
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد فواتير مسجلة</p>
              <Button onClick={() => setShowAddInvoice(true)} className="mt-4">
                إضافة فاتورة جديدة
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الفاتورة</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>العميل/المورد</TableHead>
                  <TableHead>تاريخ الفاتورة</TableHead>
                  <TableHead>تاريخ الاستحقاق</TableHead>
                  <TableHead>المبلغ الإجمالي</TableHead>
                  <TableHead>المدفوع</TableHead>
                  <TableHead>المتبقي</TableHead>
                  <TableHead>عدد الأقساط</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{invoice.invoice_type}</Badge>
                    </TableCell>
                    <TableCell>{invoice.customer_supplier_name}</TableCell>
                    <TableCell>{new Date(invoice.invoice_date).toLocaleDateString('ar-SA')}</TableCell>
                    <TableCell>{new Date(invoice.due_date).toLocaleDateString('ar-SA')}</TableCell>
                    <TableCell>{Number(invoice.total_amount).toLocaleString()} ر.س</TableCell>
                    <TableCell className="text-green-600">{Number(invoice.paid_amount).toLocaleString()} ر.س</TableCell>
                    <TableCell className="text-red-600 font-bold">{Number(invoice.remaining_amount).toLocaleString()} ر.س</TableCell>
                    <TableCell>{invoice.number_of_installments} ({invoice.installment_frequency})</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewInstallments(invoice)}
                        >
                          الأقساط
                        </Button>
                        {invoice.status !== 'مكتمل' && (
                          <Button
                            size="sm"
                            onClick={() => openPaymentDialog(invoice)}
                          >
                            دفع
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddInvoice} onOpenChange={setShowAddInvoice}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة فاتورة أجل جديدة</DialogTitle>
            <DialogDescription>
              أدخل بيانات الفاتورة وخطة الأقساط
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="invoice_type">نوع الفاتورة *</Label>
                <Select
                  value={newInvoice.invoice_type}
                  onValueChange={(v) => setNewInvoice({...newInvoice, invoice_type: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="مبيعات">مبيعات</SelectItem>
                    <SelectItem value="مشتريات">مشتريات</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="customer_name">اسم العميل/المورد *</Label>
                <Input
                  id="customer_name"
                  value={newInvoice.customer_supplier_name}
                  onChange={(e) => setNewInvoice({...newInvoice, customer_supplier_name: e.target.value})}
                  placeholder="أدخل الاسم"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">رقم الجوال</Label>
                <Input
                  id="phone"
                  value={newInvoice.customer_supplier_phone}
                  onChange={(e) => setNewInvoice({...newInvoice, customer_supplier_phone: e.target.value})}
                  placeholder="05xxxxxxxx"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={newInvoice.customer_supplier_email}
                  onChange={(e) => setNewInvoice({...newInvoice, customer_supplier_email: e.target.value})}
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="invoice_date">تاريخ الفاتورة *</Label>
                <Input
                  id="invoice_date"
                  type="date"
                  value={newInvoice.invoice_date}
                  onChange={(e) => setNewInvoice({...newInvoice, invoice_date: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="due_date">تاريخ الاستحقاق *</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={newInvoice.due_date}
                  onChange={(e) => setNewInvoice({...newInvoice, due_date: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="total_amount">المبلغ الإجمالي *</Label>
                <Input
                  id="total_amount"
                  type="number"
                  value={newInvoice.total_amount}
                  onChange={(e) => setNewInvoice({...newInvoice, total_amount: Number(e.target.value)})}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="installments">عدد الأقساط *</Label>
                <Input
                  id="installments"
                  type="number"
                  min="1"
                  value={newInvoice.number_of_installments}
                  onChange={(e) => setNewInvoice({...newInvoice, number_of_installments: Number(e.target.value)})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="frequency">دورية الأقساط *</Label>
                <Select
                  value={newInvoice.installment_frequency}
                  onValueChange={(v) => setNewInvoice({...newInvoice, installment_frequency: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="أسبوعي">أسبوعي</SelectItem>
                    <SelectItem value="شهري">شهري</SelectItem>
                    <SelectItem value="ربع سنوي">ربع سنوي</SelectItem>
                    <SelectItem value="نصف سنوي">نصف سنوي</SelectItem>
                    <SelectItem value="سنوي">سنوي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="payment_terms">شروط الدفع</Label>
              <Input
                id="payment_terms"
                value={newInvoice.payment_terms}
                onChange={(e) => setNewInvoice({...newInvoice, payment_terms: e.target.value})}
                placeholder="مثال: دفعة أولى 30% والباقي على أقساط"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                value={newInvoice.notes}
                onChange={(e) => setNewInvoice({...newInvoice, notes: e.target.value})}
                placeholder="أدخل أي ملاحظات إضافية"
                rows={3}
              />
            </div>

            {newInvoice.total_amount > 0 && newInvoice.number_of_installments > 0 && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  قيمة القسط الواحد: {(newInvoice.total_amount / newInvoice.number_of_installments).toLocaleString()} ر.س
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddInvoice(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddInvoice}>
              إضافة الفاتورة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showInstallments} onOpenChange={setShowInstallments}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>الأقساط - {selectedInvoice?.invoice_number}</DialogTitle>
            <DialogDescription>
              عرض تفاصيل الأقساط المجدولة
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {installments.length === 0 ? (
              <p className="text-center text-muted-foreground">لا توجد أقساط مسجلة</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم القسط</TableHead>
                    <TableHead>تاريخ الاستحقاق</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>المدفوع</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>تاريخ السداد</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {installments.map((installment) => (
                    <TableRow key={installment.id}>
                      <TableCell className="font-medium">القسط {installment.installment_number}</TableCell>
                      <TableCell>{new Date(installment.due_date).toLocaleDateString('ar-SA')}</TableCell>
                      <TableCell>{Number(installment.amount).toLocaleString()} ر.س</TableCell>
                      <TableCell className="text-green-600">{Number(installment.paid_amount).toLocaleString()} ر.س</TableCell>
                      <TableCell>
                        <Badge className={getInstallmentStatusColor(installment.status)}>
                          {installment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {installment.payment_date
                          ? new Date(installment.payment_date).toLocaleDateString('ar-SA')
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddPayment} onOpenChange={setShowAddPayment}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>تسجيل دفعة جديدة</DialogTitle>
            <DialogDescription>
              سجل دفعة لفاتورة {selectedInvoice?.invoice_number}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="p-4 bg-gray-50 rounded-lg space-y-1">
              <p className="text-sm text-muted-foreground">المبلغ المتبقي</p>
              <p className="text-2xl font-bold text-red-600">
                {selectedInvoice?.remaining_amount.toLocaleString()} ر.س
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="payment_amount">المبلغ المدفوع *</Label>
              <Input
                id="payment_amount"
                type="number"
                value={newPayment.amount}
                onChange={(e) => setNewPayment({...newPayment, amount: Number(e.target.value)})}
                placeholder="0"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="payment_method">طريقة الدفع *</Label>
              <Select
                value={newPayment.payment_method}
                onValueChange={(v) => setNewPayment({...newPayment, payment_method: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="نقدي">نقدي</SelectItem>
                  <SelectItem value="بنكي">تحويل بنكي</SelectItem>
                  <SelectItem value="شيك">شيك</SelectItem>
                  <SelectItem value="بطاقة ائتمان">بطاقة ائتمان</SelectItem>
                  <SelectItem value="تحويل إلكتروني">تحويل إلكتروني</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reference">رقم المرجع</Label>
              <Input
                id="reference"
                value={newPayment.reference_number}
                onChange={(e) => setNewPayment({...newPayment, reference_number: e.target.value})}
                placeholder="رقم الإيصال أو الشيك"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="payment_notes">ملاحظات</Label>
              <Textarea
                id="payment_notes"
                value={newPayment.notes}
                onChange={(e) => setNewPayment({...newPayment, notes: e.target.value})}
                placeholder="أي ملاحظات إضافية"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPayment(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddPayment}>
              تسجيل الدفعة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeferredInvoices;
