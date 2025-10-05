import { FileText, Plus, Search, MoveHorizontal as MoreHorizontal, CreditCard as Edit, Trash2, Eye, Send, CircleCheck as CheckCircle, Circle as XCircle, Clock, Loader as Loader2, Download, Upload } from "lucide-react";
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
import { EmptyTableMessage } from "@/components/EmptyTableMessage";
import { exportToCSV } from "@/utils/exportImport";
import { AddQuoteDialog } from "@/components/quotes/AddQuoteDialog";

interface Quote {
  id: string;
  quote_number: string;
  customer_id: string | null;
  quote_date: string;
  expiry_date: string | null;
  status: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  notes: string | null;
  created_at: string;
  customers?: {
    customer_name: string;
  };
}

const Quotes = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: quotes = [], isLoading, error: queryError } = useQuery({
    queryKey: ["quotes"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("يجب تسجيل الدخول أولاً");
      }

      const { data, error } = await supabase
        .from("quotes")
        .select(`
          *,
          customers (
            customer_name
          )
        `)
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Quote[];
    },
    retry: false,
  });

  if (queryError) {
    console.error('Error loading quotes:', queryError);
  }

  const deleteQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      const { error } = await supabase
        .from("quotes")
        .delete()
        .eq("id", quoteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast({
        title: "تم بنجاح",
        description: "تم حذف عرض السعر بنجاح",
      });
      setDeleteDialogOpen(false);
      setQuoteToDelete(null);
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
        .from("quotes")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast({
        title: "تم بنجاح",
        description: "تم تحديث حالة عرض السعر بنجاح",
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

  const filteredQuotes = quotes.filter((quote) =>
    quote.quote_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    quote.customers?.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (quoteId: string) => {
    setQuoteToDelete(quoteId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (quoteToDelete) {
      deleteQuoteMutation.mutate(quoteToDelete);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: "مسودة", variant: "secondary" as const, icon: Edit },
      sent: { label: "مرسل", variant: "default" as const, icon: Send },
      accepted: { label: "مقبول", variant: "default" as const, icon: CheckCircle, className: "bg-green-500" },
      rejected: { label: "مرفوض", variant: "destructive" as const, icon: XCircle },
      expired: { label: "منتهي", variant: "outline" as const, icon: Clock },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.draft;
    const Icon = statusInfo.icon;

    return (
      <Badge variant={statusInfo.variant} className={statusInfo.className}>
        <Icon className="h-3 w-3 ml-1" />
        {statusInfo.label}
      </Badge>
    );
  };

  const totalValue = quotes.reduce((sum, q) => sum + q.total_amount, 0);
  const acceptedValue = quotes
    .filter((q) => q.status === "accepted")
    .reduce((sum, q) => sum + q.total_amount, 0);

  const handleExport = () => {
    const exportData = quotes.map(quote => ({
      'رقم العرض': quote.quote_number,
      'العميل': quote.customers?.customer_name || '-',
      'تاريخ العرض': new Date(quote.quote_date).toLocaleDateString('ar-SA'),
      'تاريخ الانتهاء': quote.expiry_date ? new Date(quote.expiry_date).toLocaleDateString('ar-SA') : '-',
      'المبلغ الإجمالي': quote.total_amount,
      'الحالة': quote.status
    }));
    exportToCSV(exportData, 'quotes');
    toast({
      title: "تم التصدير بنجاح",
      description: "تم تصدير عروض الأسعار إلى ملف CSV",
    });
  };

  const handleImport = () => {
    toast({
      title: "قريباً",
      description: "ميزة الاستيراد ستكون متاحة قريباً",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-cyan-50/30">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">عروض الأسعار</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExport}
              className="gap-2 hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-all"
            >
              <Download className="h-4 w-4" />
              تصدير
            </Button>
            <Button
              variant="outline"
              onClick={handleImport}
              className="gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all"
            >
              <Upload className="h-4 w-4" />
              استيراد
            </Button>
            <Button
              onClick={() => setAddDialogOpen(true)}
              className="gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-md"
            >
              <Plus className="h-4 w-4" />
              إنشاء عرض سعر جديد
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-6 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm hover:shadow-md transition-all">
            <div className="text-sm text-gray-600 font-medium">إجمالي العروض</div>
            <div className="text-2xl font-bold mt-2 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              {isLoading ? <Skeleton className="h-8 w-16" /> : quotes.length}
            </div>
          </Card>
          <Card className="p-6 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm hover:shadow-md transition-all">
            <div className="text-sm text-gray-600 font-medium">عروض مقبولة</div>
            <div className="text-2xl font-bold mt-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                quotes.filter((q) => q.status === "accepted").length
              )}
            </div>
          </Card>
          <Card className="p-6 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm hover:shadow-md transition-all">
            <div className="text-sm text-gray-600 font-medium">قيمة العروض الكلية</div>
            <div className="text-2xl font-bold mt-2 bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                `${totalValue.toLocaleString()} ر.س`
              )}
            </div>
          </Card>
          <Card className="p-6 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm hover:shadow-md transition-all">
            <div className="text-sm text-gray-600 font-medium">قيمة العروض المقبولة</div>
            <div className="text-2xl font-bold mt-2 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                `${acceptedValue.toLocaleString()} ر.س`
              )}
            </div>
          </Card>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث عن عرض سعر..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 bg-white/80 backdrop-blur-sm"
          />
        </div>

        <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">رقم العرض</TableHead>
              <TableHead className="text-right">العميل</TableHead>
              <TableHead className="text-right">تاريخ العرض</TableHead>
              <TableHead className="text-right">تاريخ الانتهاء</TableHead>
              <TableHead className="text-right">المبلغ الإجمالي</TableHead>
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
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : filteredQuotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "لا توجد نتائج" : "لا توجد عروض أسعار. ابدأ بإنشاء عرض سعر جديد!"}
                </TableCell>
              </TableRow>
            ) : (
              filteredQuotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium">{quote.quote_number}</TableCell>
                  <TableCell>{quote.customers?.customer_name || "-"}</TableCell>
                  <TableCell>{new Date(quote.quote_date).toLocaleDateString("ar-SA")}</TableCell>
                  <TableCell>
                    {quote.expiry_date
                      ? new Date(quote.expiry_date).toLocaleDateString("ar-SA")
                      : "-"
                    }
                  </TableCell>
                  <TableCell>{quote.total_amount.toLocaleString()} ر.س</TableCell>
                  <TableCell>{getStatusBadge(quote.status)}</TableCell>
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
                        {quote.status === "draft" && (
                          <DropdownMenuItem
                            className="gap-2"
                            onClick={() => updateStatusMutation.mutate({ id: quote.id, status: "sent" })}
                          >
                            <Send className="h-4 w-4" />
                            إرسال
                          </DropdownMenuItem>
                        )}
                        {quote.status === "sent" && (
                          <>
                            <DropdownMenuItem
                              className="gap-2 text-green-600"
                              onClick={() => updateStatusMutation.mutate({ id: quote.id, status: "accepted" })}
                            >
                              <CheckCircle className="h-4 w-4" />
                              قبول
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 text-destructive"
                              onClick={() => updateStatusMutation.mutate({ id: quote.id, status: "rejected" })}
                            >
                              <XCircle className="h-4 w-4" />
                              رفض
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem
                          className="gap-2 text-destructive"
                          onClick={() => handleDelete(quote.id)}
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
              هذا الإجراء لا يمكن التراجع عنه. سيتم حذف عرض السعر نهائياً من قاعدة البيانات.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteQuoteMutation.isPending && (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              )}
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
        </AlertDialog>

        <AddQuoteDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      </div>
    </div>
  );
};

export default Quotes;
