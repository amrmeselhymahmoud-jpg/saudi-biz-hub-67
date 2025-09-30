import { Receipt, Plus, Search, MoreHorizontal, Eye, Edit, Trash2, Download, Loader2, DollarSign, Send, XCircle, FileText } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

interface SalesInvoice {
  id: string;
  invoice_number: string;
  customer_id: string | null;
  invoice_date: string;
  due_date: string | null;
  status: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  notes: string | null;
  created_at: string;
  customers?: {
    name: string;
    email: string | null;
    phone: string | null;
  };
}

const SalesInvoices = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["sales-invoices"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("يجب تسجيل الدخول أولاً");
      }

      const { data, error } = await supabase
        .from("sales_invoices")
        .select(`
          *,
          customers (
            name,
            email,
            phone
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SalesInvoice[];
    },
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
      toast({
        title: "تم بنجاح",
        description: "تم حذف الفاتورة بنجاح",
      });
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("sales_invoices")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-invoices"] });
      toast({
        title: "تم بنجاح",
        description: "تم تحديث حالة الفاتورة بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addPaymentMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      const invoice = invoices.find(inv => inv.id === id);
      if (!invoice) throw new Error("الفاتورة غير موجودة");

      const newPaidAmount = invoice.paid_amount + amount;

      const { error } = await supabase
        .from("sales_invoices")
        .update({ paid_amount: newPaidAmount })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-invoices"] });
      toast({
        title: "تم بنجاح",
        description: "تم تسجيل الدفعة بنجاح",
      });
      setPaymentDialogOpen(false);
      setPaymentAmount("");
      setSelectedInvoice(null);
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredInvoices = invoices.filter((invoice) =>
    invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.customers?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (invoiceId: string) => {
    setInvoiceToDelete(invoiceId);
    setDeleteDialogOpen(true);
  };

  const handleView = (invoice: SalesInvoice) => {
    setSelectedInvoice(invoice);
    setViewDialogOpen(true);
  };

  const handlePayment = (invoice: SalesInvoice) => {
    setSelectedInvoice(invoice);
    const remaining = invoice.total_amount - invoice.paid_amount;
    setPaymentAmount(remaining.toString());
    setPaymentDialogOpen(true);
  };

  const confirmDelete = () => {
    if (invoiceToDelete) {
      deleteInvoiceMutation.mutate(invoiceToDelete);
    }
  };

  const confirmPayment = () => {
    if (selectedInvoice && paymentAmount) {
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: "خطأ",
          description: "يرجى إدخال مبلغ صحيح",
          variant: "destructive",
        });
        return;
      }

      const remaining = selectedInvoice.total_amount - selectedInvoice.paid_amount;
      if (amount > remaining) {
        toast({
          title: "خطأ",
          description: "المبلغ المدخل أكبر من المبلغ المتبقي",
          variant: "destructive",
        });
        return;
      }

      addPaymentMutation.mutate({ id: selectedInvoice.id, amount });
    }
  };

  const handleDownloadPDF = (invoice: SalesInvoice) => {
    toast({
      title: "قيد التطوير",
      description: "ميزة تحميل PDF قيد التطوير حالياً",
    });
  };

  const getStatusBadge = (status: string, paidAmount: number, totalAmount: number) => {
    let actualStatus = status;

    if (status !== 'draft' && status !== 'cancelled') {
      if (paidAmount === 0) {
        actualStatus = 'unpaid';
      } else if (paidAmount >= totalAmount) {
        actualStatus = 'paid';
      } else {
        actualStatus = 'partially_paid';
      }
    }

    const statusMap = {
      paid: { label: "مدفوعة", variant: "default" as const, className: "bg-green-600" },
      partially_paid: { label: "مدفوعة جزئياً", variant: "secondary" as const, className: "bg-yellow-600" },
      unpaid: { label: "غير مدفوعة", variant: "destructive" as const },
      draft: { label: "مسودة", variant: "outline" as const },
      cancelled: { label: "ملغاة", variant: "destructive" as const },
    };

    const statusInfo = statusMap[actualStatus as keyof typeof statusMap] || {
      label: actualStatus,
      variant: "outline" as const,
      className: ""
    };

    return (
      <Badge variant={statusInfo.variant} className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    );
  };

  const totalSales = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.paid_amount, 0);
  const totalUnpaid = totalSales - totalPaid;
  const paidInvoicesCount = invoices.filter(inv => inv.paid_amount >= inv.total_amount).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Receipt className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">فواتير المبيعات</h1>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          فاتورة جديدة
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">إجمالي الفواتير</div>
          <div className="text-2xl font-bold mt-2">
            {isLoading ? <Skeleton className="h-8 w-16" /> : invoices.length}
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">الفواتير المدفوعة</div>
          <div className="text-2xl font-bold mt-2 text-green-600">
            {isLoading ? <Skeleton className="h-8 w-16" /> : paidInvoicesCount}
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">إجمالي المبيعات</div>
          <div className="text-2xl font-bold mt-2">
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              `${totalSales.toLocaleString()} ر.س`
            )}
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">المبالغ المستحقة</div>
          <div className="text-2xl font-bold mt-2 text-destructive">
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              `${totalUnpaid.toLocaleString()} ر.س`
            )}
          </div>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="بحث عن فاتورة أو عميل..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">رقم الفاتورة</TableHead>
              <TableHead className="text-right">العميل</TableHead>
              <TableHead className="text-right">التاريخ</TableHead>
              <TableHead className="text-right">تاريخ الاستحقاق</TableHead>
              <TableHead className="text-right">المبلغ الإجمالي</TableHead>
              <TableHead className="text-right">المبلغ المدفوع</TableHead>
              <TableHead className="text-right">المتبقي</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "لا توجد نتائج" : "لا توجد فواتير. ابدأ بإنشاء فاتورة جديدة!"}
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => {
                const remaining = invoice.total_amount - invoice.paid_amount;
                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{invoice.customers?.name || "-"}</TableCell>
                    <TableCell>{new Date(invoice.invoice_date).toLocaleDateString('ar-SA')}</TableCell>
                    <TableCell>
                      {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('ar-SA') : '-'}
                    </TableCell>
                    <TableCell className="font-semibold">{invoice.total_amount.toLocaleString()} ر.س</TableCell>
                    <TableCell className="text-green-600">{invoice.paid_amount.toLocaleString()} ر.س</TableCell>
                    <TableCell className={remaining > 0 ? "text-destructive font-semibold" : ""}>
                      {remaining.toLocaleString()} ر.س
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status, invoice.paid_amount, invoice.total_amount)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2" onClick={() => handleView(invoice)}>
                            <Eye className="h-4 w-4" />
                            عرض التفاصيل
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <Edit className="h-4 w-4" />
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => handleDownloadPDF(invoice)}>
                            <Download className="h-4 w-4" />
                            تحميل PDF
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {remaining > 0 && (
                            <DropdownMenuItem className="gap-2" onClick={() => handlePayment(invoice)}>
                              <DollarSign className="h-4 w-4" />
                              تسجيل دفعة
                            </DropdownMenuItem>
                          )}
                          {invoice.status === 'draft' && (
                            <DropdownMenuItem
                              className="gap-2"
                              onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: 'sent' })}
                            >
                              <Send className="h-4 w-4" />
                              إرسال للعميل
                            </DropdownMenuItem>
                          )}
                          {invoice.status !== 'cancelled' && (
                            <DropdownMenuItem
                              className="gap-2 text-orange-600"
                              onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: 'cancelled' })}
                            >
                              <XCircle className="h-4 w-4" />
                              إلغاء الفاتورة
                            </DropdownMenuItem>
                          )}
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
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              تفاصيل الفاتورة
            </DialogTitle>
            <DialogDescription>
              معلومات تفصيلية عن الفاتورة رقم {selectedInvoice?.invoice_number}
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">العميل</Label>
                  <p className="font-medium">{selectedInvoice.customers?.name || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">البريد الإلكتروني</Label>
                  <p className="font-medium">{selectedInvoice.customers?.email || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">رقم الهاتف</Label>
                  <p className="font-medium">{selectedInvoice.customers?.phone || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">تاريخ الفاتورة</Label>
                  <p className="font-medium">{new Date(selectedInvoice.invoice_date).toLocaleDateString('ar-SA')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">تاريخ الاستحقاق</Label>
                  <p className="font-medium">
                    {selectedInvoice.due_date ? new Date(selectedInvoice.due_date).toLocaleDateString('ar-SA') : '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">الحالة</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedInvoice.status, selectedInvoice.paid_amount, selectedInvoice.total_amount)}
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المجموع الفرعي:</span>
                  <span className="font-medium">{selectedInvoice.subtotal.toLocaleString()} ر.س</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الضريبة:</span>
                  <span className="font-medium">{selectedInvoice.tax_amount.toLocaleString()} ر.س</span>
                </div>
                {selectedInvoice.discount_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الخصم:</span>
                    <span className="font-medium text-green-600">-{selectedInvoice.discount_amount.toLocaleString()} ر.س</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">المجموع الإجمالي:</span>
                  <span className="font-bold">{selectedInvoice.total_amount.toLocaleString()} ر.س</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المبلغ المدفوع:</span>
                  <span className="font-medium text-green-600">{selectedInvoice.paid_amount.toLocaleString()} ر.س</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">المبلغ المتبقي:</span>
                  <span className="font-bold text-destructive">
                    {(selectedInvoice.total_amount - selectedInvoice.paid_amount).toLocaleString()} ر.س
                  </span>
                </div>
              </div>
              {selectedInvoice.notes && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-muted-foreground">ملاحظات</Label>
                    <p className="mt-1 text-sm">{selectedInvoice.notes}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              تسجيل دفعة
            </DialogTitle>
            <DialogDescription>
              تسجيل دفعة جديدة للفاتورة رقم {selectedInvoice?.invoice_number}
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>المبلغ المتبقي</Label>
                <p className="text-2xl font-bold text-destructive">
                  {(selectedInvoice.total_amount - selectedInvoice.paid_amount).toLocaleString()} ر.س
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-amount">مبلغ الدفعة</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  placeholder="أدخل المبلغ"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={confirmPayment} disabled={addPaymentMutation.isPending}>
              {addPaymentMutation.isPending && (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              )}
              تسجيل الدفعة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              هذا الإجراء لا يمكن التراجع عنه. سيتم حذف الفاتورة وجميع البنود المرتبطة بها نهائياً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteInvoiceMutation.isPending && (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              )}
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SalesInvoices;
