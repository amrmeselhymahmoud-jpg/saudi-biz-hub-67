import { Receipt, Plus, Search, MoveHorizontal as MoreHorizontal, Eye, CreditCard as Edit, Trash2, Download, Loader2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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
}

interface Customer {
  id: string;
  name: string;
}

const SalesInvoices = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);

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
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SalesInvoice[];
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers-list"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return [];

      const { data, error } = await supabase
        .from("customers")
        .select("id, name")
        .eq("user_id", user.id);

      if (error) throw error;
      return data as Customer[];
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

  const filteredInvoices = invoices.filter((invoice) =>
    invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (invoiceId: string) => {
    setInvoiceToDelete(invoiceId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (invoiceToDelete) {
      deleteInvoiceMutation.mutate(invoiceToDelete);
    }
  };

  const getCustomerName = (customerId: string | null) => {
    if (!customerId) return "-";
    const customer = customers.find((c) => c.id === customerId);
    return customer?.name || "-";
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      paid: { label: "مدفوعة", variant: "default" as const },
      partially_paid: { label: "مدفوعة جزئياً", variant: "secondary" as const },
      unpaid: { label: "غير مدفوعة", variant: "destructive" as const },
      draft: { label: "مسودة", variant: "outline" as const },
      sent: { label: "مرسلة", variant: "secondary" as const },
      overdue: { label: "متأخرة", variant: "destructive" as const },
      cancelled: { label: "ملغاة", variant: "destructive" as const },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: "outline" as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const totalSales = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.paid_amount, 0);
  const totalUnpaid = totalSales - totalPaid;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">إجمالي الفواتير</div>
          <div className="text-2xl font-bold mt-2">
            {isLoading ? <Skeleton className="h-8 w-16" /> : invoices.length}
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
          <div className="text-sm text-muted-foreground">المبالغ المحصلة</div>
          <div className="text-2xl font-bold mt-2 text-green-600">
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              `${totalPaid.toLocaleString()} ر.س`
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
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "لا توجد نتائج" : "لا توجد فواتير. ابدأ بإنشاء فاتورة جديدة!"}
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                  <TableCell>{getCustomerName(invoice.customer_id)}</TableCell>
                  <TableCell>{new Date(invoice.invoice_date).toLocaleDateString('ar-SA')}</TableCell>
                  <TableCell>
                    {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('ar-SA') : '-'}
                  </TableCell>
                  <TableCell>{invoice.total_amount.toLocaleString()} ر.س</TableCell>
                  <TableCell>{invoice.paid_amount.toLocaleString()} ر.س</TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2">
                          <Eye className="h-4 w-4" />
                          عرض
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <Edit className="h-4 w-4" />
                          تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <Download className="h-4 w-4" />
                          تحميل PDF
                        </DropdownMenuItem>
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
              ))
            )}
          </TableBody>
        </Table>
      </Card>

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
