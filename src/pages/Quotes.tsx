import { FileText, Plus, Search, MoveHorizontal as MoreHorizontal, CreditCard as Edit, Trash2, Eye, Send, CircleCheck as CheckCircle, Circle as XCircle, Clock, Loader as Loader2, Download, Upload, Printer } from "lucide-react";
import { useState, useMemo } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { exportToCSV } from "@/utils/exportImport";
import { AddQuoteDialog } from "@/components/quotes/AddQuoteDialog";
import { safeFormatDate, formatCurrency, safeToLocaleString } from "@/utils/formatters";

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
  } | null;
}

// Safe property access helper
const safeGet = <T,>(obj: any, path: string, defaultValue: T): T => {
  try {
    if (!obj) return defaultValue;
    const keys = path.split('.');
    let result = obj;
    for (const key of keys) {
      if (result === null || result === undefined) return defaultValue;
      result = result[key];
    }
    return result !== undefined && result !== null ? result : defaultValue;
  } catch {
    return defaultValue;
  }
};

// Normalize quote data with all safeguards
const normalizeQuote = (quote: any): Quote => {
  try {
    return {
      id: safeGet(quote, 'id', ''),
      quote_number: safeGet(quote, 'quote_number', 'N/A'),
      customer_id: safeGet(quote, 'customer_id', null),
      quote_date: safeGet(quote, 'quote_date', new Date().toISOString()),
      expiry_date: safeGet(quote, 'expiry_date', null),
      status: safeGet(quote, 'status', 'draft'),
      subtotal: typeof quote?.subtotal === 'number' ? quote.subtotal : 0,
      tax_amount: typeof quote?.tax_amount === 'number' ? quote.tax_amount : 0,
      discount_amount: typeof quote?.discount_amount === 'number' ? quote.discount_amount : 0,
      total_amount: typeof quote?.total_amount === 'number' ? quote.total_amount : 0,
      notes: safeGet(quote, 'notes', null),
      created_at: safeGet(quote, 'created_at', new Date().toISOString()),
      customers: quote?.customers ? {
        customer_name: safeGet(quote.customers, 'customer_name', 'غير محدد')
      } : null,
    };
  } catch (error) {
    console.error('Error normalizing quote:', error);
    return {
      id: quote?.id || '',
      quote_number: 'N/A',
      customer_id: null,
      quote_date: new Date().toISOString(),
      expiry_date: null,
      status: 'draft',
      subtotal: 0,
      tax_amount: 0,
      discount_amount: 0,
      total_amount: 0,
      notes: null,
      created_at: new Date().toISOString(),
      customers: null,
    };
  }
};

// Safe array operations
const safeArray = <T,>(data: any): T[] => {
  try {
    if (Array.isArray(data)) return data;
    return [];
  } catch {
    return [];
  }
};

const Quotes = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewQuote, setViewQuote] = useState<Quote | null>(null);
  const [editQuote, setEditQuote] = useState<Quote | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query with comprehensive error handling and fallback
  const { data: quotesData = [], isLoading, error: queryError } = useQuery({
    queryKey: ["quotes"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("quotes")
          .select(`
            *,
            customers (
              customer_name
            )
          `)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }

        const safeData = safeArray<any>(data);
        return safeData.map(normalizeQuote);
      } catch (error) {
        console.error("Error fetching quotes:", error);
        return [];
      }
    },
    retry: 3,
    retryDelay: 1000,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  // Memoize quotes array with safety
  const quotes = useMemo(() => {
    try {
      return safeArray<Quote>(quotesData);
    } catch {
      return [];
    }
  }, [quotesData]);

  if (queryError) {
    console.error('Error loading quotes:', queryError);
  }

  const deleteQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      try {
        if (!quoteId) {
          throw new Error("Invalid quote ID");
        }

        const { error } = await supabase
          .from("quotes")
          .delete()
          .eq("id", quoteId);

        if (error) throw error;
      } catch (error) {
        console.error("Delete mutation error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      try {
        queryClient.invalidateQueries({ queryKey: ["quotes"] });
        toast({
          title: "تم بنجاح",
          description: "تم حذف عرض السعر بنجاح",
        });
        setDeleteDialogOpen(false);
        setQuoteToDelete(null);
      } catch (error) {
        console.error("Error after delete success:", error);
      }
    },
    onError: (error: Error) => {
      try {
        toast({
          title: "خطأ",
          description: error?.message || "حدث خطأ غير متوقع",
          variant: "destructive",
        });
      } catch (e) {
        console.error("Error showing toast:", e);
      }
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      try {
        if (!id || !status) {
          throw new Error("Invalid parameters");
        }

        const { error } = await supabase
          .from("quotes")
          .update({ status })
          .eq("id", id);

        if (error) throw error;
      } catch (error) {
        console.error("Update status mutation error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      try {
        queryClient.invalidateQueries({ queryKey: ["quotes"] });
        toast({
          title: "تم بنجاح",
          description: "تم تحديث حالة عرض السعر بنجاح",
        });
      } catch (error) {
        console.error("Error after update success:", error);
      }
    },
    onError: (error: Error) => {
      try {
        toast({
          title: "خطأ",
          description: error?.message || "حدث خطأ غير متوقع",
          variant: "destructive",
        });
      } catch (e) {
        console.error("Error showing toast:", e);
      }
    },
  });

  // Safe filtering with comprehensive checks
  const filteredQuotes = useMemo(() => {
    try {
      if (!Array.isArray(quotes)) return [];

      return quotes.filter((quote) => {
        try {
          const safeStringIncludes = (haystack: any, needle: string): boolean => {
            try {
              if (!needle) return true;
              if (!haystack) return false;
              const str = String(haystack).toLowerCase();
              return str.includes(needle.toLowerCase());
            } catch {
              return false;
            }
          };

          const matchesQuoteNumber = safeStringIncludes(quote.quote_number, searchQuery);
          const matchesCustomerName = safeStringIncludes(quote.customers?.customer_name, searchQuery);

          return matchesQuoteNumber || matchesCustomerName;
        } catch (error) {
          console.error("Error filtering quote:", error);
          return false;
        }
      });
    } catch (error) {
      console.error("Error in filteredQuotes:", error);
      return [];
    }
  }, [quotes, searchQuery]);

  const handleView = (quote: Quote) => {
    try {
      if (!quote || !quote.id) {
        console.error("Invalid quote for view");
        return;
      }
      setViewQuote(quote);
      toast({
        title: "عرض تفاصيل عرض السعر",
        description: `عرض السعر رقم: ${quote.quote_number}`,
      });
    } catch (error) {
      console.error("Error in handleView:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء عرض التفاصيل",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (quote: Quote) => {
    try {
      if (!quote || !quote.id) {
        console.error("Invalid quote for edit");
        return;
      }
      setEditQuote(quote);
      toast({
        title: "تعديل عرض السعر",
        description: `يتم تحضير عرض السعر رقم: ${quote.quote_number} للتعديل`,
      });
    } catch (error) {
      console.error("Error in handleEdit:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحضير التعديل",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (quoteId: string) => {
    try {
      if (!quoteId) {
        console.error("Invalid quote ID for delete");
        return;
      }
      setQuoteToDelete(quoteId);
      setDeleteDialogOpen(true);
    } catch (error) {
      console.error("Error in handleDelete:", error);
    }
  };

  const confirmDelete = () => {
    try {
      if (quoteToDelete) {
        deleteQuoteMutation.mutate(quoteToDelete);
      }
    } catch (error) {
      console.error("Error in confirmDelete:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    try {
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
    } catch (error) {
      console.error("Error in getStatusBadge:", error);
      return <Badge variant="secondary">غير محدد</Badge>;
    }
  };

  // Safe calculations with memoization
  const totalValue = useMemo(() => {
    try {
      if (!Array.isArray(quotes)) return 0;
      return quotes.reduce((sum, q) => {
        try {
          const amount = typeof q?.total_amount === 'number' ? q.total_amount : 0;
          return sum + amount;
        } catch {
          return sum;
        }
      }, 0);
    } catch {
      return 0;
    }
  }, [quotes]);

  const acceptedValue = useMemo(() => {
    try {
      if (!Array.isArray(quotes)) return 0;
      return quotes
        .filter((q) => {
          try {
            return q?.status === "accepted";
          } catch {
            return false;
          }
        })
        .reduce((sum, q) => {
          try {
            const amount = typeof q?.total_amount === 'number' ? q.total_amount : 0;
            return sum + amount;
          } catch {
            return sum;
          }
        }, 0);
    } catch {
      return 0;
    }
  }, [quotes]);

  const acceptedCount = useMemo(() => {
    try {
      if (!Array.isArray(quotes)) return 0;
      return quotes.filter((q) => {
        try {
          return q?.status === "accepted";
        } catch {
          return false;
        }
      }).length;
    } catch {
      return 0;
    }
  }, [quotes]);

  const handleExport = () => {
    try {
      if (filteredQuotes.length === 0) {
        toast({
          title: "تنبيه",
          description: "لا توجد بيانات للتصدير",
          variant: "destructive",
        });
        return;
      }

      const exportData = filteredQuotes.map(quote => {
        try {
          return {
            'رقم العرض': quote.quote_number || '-',
            'العميل': quote.customers?.customer_name || '-',
            'تاريخ العرض': safeFormatDate(quote.quote_date, 'yyyy-MM-dd'),
            'تاريخ الانتهاء': safeFormatDate(quote.expiry_date, 'yyyy-MM-dd'),
            'المبلغ الإجمالي': safeToLocaleString(quote.total_amount),
            'الحالة': quote.status || '-'
          };
        } catch (error) {
          console.error("Error mapping quote for export:", error);
          return {
            'رقم العرض': '-',
            'العميل': '-',
            'تاريخ العرض': '-',
            'تاريخ الانتهاء': '-',
            'المبلغ الإجمالي': '0',
            'الحالة': '-'
          };
        }
      });

      exportToCSV(exportData, 'quotes');
      toast({
        title: "تم التصدير بنجاح",
        description: `تم تصدير ${filteredQuotes.length} عرض سعر بنجاح`,
      });
    } catch (error) {
      console.error("Error in handleExport:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء التصدير",
        variant: "destructive",
      });
    }
  };

  const handleImport = () => {
    try {
      toast({
        title: "قريباً",
        description: "ميزة الاستيراد ستكون متاحة قريباً",
      });
    } catch (error) {
      console.error("Error in handleImport:", error);
    }
  };

  const handlePrint = () => {
    try {
      const statusLabels: Record<string, string> = {
        draft: 'مسودة',
        sent: 'مرسل',
        accepted: 'مقبول',
        rejected: 'مرفوض',
        expired: 'منتهي',
      };

      const printContent = filteredQuotes.map(q => {
        try {
          return `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${q.quote_number || '-'}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${q.customers?.customer_name || '-'}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${safeFormatDate(q.quote_date, 'yyyy-MM-dd')}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${safeFormatDate(q.expiry_date, 'yyyy-MM-dd')}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${safeToLocaleString(q.total_amount)} ر.س</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${statusLabels[q.status] || q.status}</td>
            </tr>
          `;
        } catch (error) {
          console.error("Error creating print row:", error);
          return '';
        }
      }).join('');

      const printWindow = window.open('', '', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html dir="rtl">
            <head>
              <title>قائمة عروض الأسعار</title>
              <style>
                body { font-family: Arial, sans-serif; direction: rtl; padding: 20px; }
                h1 { text-align: center; color: #0891b2; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background-color: #0891b2; color: white; padding: 12px; border: 1px solid #ddd; }
                td { padding: 8px; border: 1px solid #ddd; }
                .summary { margin-top: 20px; padding: 15px; background-color: #f0f9ff; border-radius: 8px; }
                .footer { margin-top: 20px; text-align: center; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <h1>قائمة عروض الأسعار</h1>
              <p>التاريخ: ${safeFormatDate(new Date().toISOString(), 'yyyy-MM-dd')}</p>
              <div class="summary">
                <p><strong>إجمالي العروض:</strong> ${filteredQuotes.length}</p>
                <p><strong>قيمة العروض الكلية:</strong> ${safeToLocaleString(totalValue)} ر.س</p>
                <p><strong>قيمة العروض المقبولة:</strong> ${safeToLocaleString(acceptedValue)} ر.س</p>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>رقم العرض</th>
                    <th>العميل</th>
                    <th>تاريخ العرض</th>
                    <th>تاريخ الانتهاء</th>
                    <th>المبلغ الإجمالي</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  ${printContent}
                </tbody>
              </table>
              <div class="footer">
                <p>تم الطباعة في: ${safeFormatDate(new Date().toISOString(), 'yyyy-MM-dd HH:mm:ss')}</p>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }

      toast({
        title: "جاهز للطباعة",
        description: "تم فتح نافذة الطباعة",
      });
    } catch (error) {
      console.error("Error in handlePrint:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء التحضير للطباعة",
        variant: "destructive",
      });
    }
  };

  // Safe rendering helper
  const renderQuoteRow = (quote: Quote) => {
    try {
      if (!quote || !quote.id) return null;

      return (
        <TableRow key={quote.id}>
          <TableCell className="font-medium">{quote.quote_number || 'N/A'}</TableCell>
          <TableCell>{quote.customers?.customer_name || "-"}</TableCell>
          <TableCell>{safeFormatDate(quote.quote_date, "yyyy-MM-dd")}</TableCell>
          <TableCell>{safeFormatDate(quote.expiry_date, "yyyy-MM-dd")}</TableCell>
          <TableCell>{formatCurrency(quote.total_amount)}</TableCell>
          <TableCell>{getStatusBadge(quote.status)}</TableCell>
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => handleView(quote)}
                >
                  <Eye className="h-4 w-4" />
                  عرض
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => handleEdit(quote)}
                >
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
      );
    } catch (error) {
      console.error("Error rendering quote row:", error, quote);
      return null;
    }
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
              onClick={handlePrint}
              className="gap-2 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300 transition-all"
            >
              <Printer className="h-4 w-4" />
              طباعة
            </Button>
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
              {isLoading ? <Skeleton className="h-8 w-16" /> : acceptedCount}
            </div>
          </Card>
          <Card className="p-6 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm hover:shadow-md transition-all">
            <div className="text-sm text-gray-600 font-medium">قيمة العروض الكلية</div>
            <div className="text-2xl font-bold mt-2 bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              {isLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(totalValue)}
            </div>
          </Card>
          <Card className="p-6 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm hover:shadow-md transition-all">
            <div className="text-sm text-gray-600 font-medium">قيمة العروض المقبولة</div>
            <div className="text-2xl font-bold mt-2 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              {isLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(acceptedValue)}
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
                  <TableCell colSpan={7} className="text-center py-12">
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg font-medium">
                      {searchQuery ? "لا توجد نتائج" : "لا توجد عروض أسعار. ابدأ بإنشاء عرض سعر جديد!"}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredQuotes.map(renderQuoteRow).filter(Boolean)
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

        <Dialog open={!!viewQuote} onOpenChange={(open) => !open && setViewQuote(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">تفاصيل عرض السعر</DialogTitle>
              <DialogDescription>
                عرض تفاصيل عرض السعر رقم: {viewQuote?.quote_number}
              </DialogDescription>
            </DialogHeader>
            {viewQuote && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">رقم العرض</label>
                    <p className="text-base font-semibold">{viewQuote.quote_number}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">الحالة</label>
                    <div>{getStatusBadge(viewQuote.status)}</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">العميل</label>
                    <p className="text-base">{viewQuote.customers?.customer_name || "غير محدد"}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">تاريخ العرض</label>
                    <p className="text-base">{safeFormatDate(viewQuote.quote_date, "yyyy-MM-dd")}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">تاريخ الانتهاء</label>
                    <p className="text-base">{safeFormatDate(viewQuote.expiry_date, "yyyy-MM-dd")}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">تاريخ الإنشاء</label>
                    <p className="text-base">{safeFormatDate(viewQuote.created_at, "yyyy-MM-dd HH:mm")}</p>
                  </div>
                </div>
                <div className="border-t pt-4 space-y-3">
                  <h3 className="font-semibold text-lg">التفاصيل المالية</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">المبلغ الفرعي:</span>
                      <span className="font-semibold">{formatCurrency(viewQuote.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">الضريبة:</span>
                      <span className="font-semibold">{formatCurrency(viewQuote.tax_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">الخصم:</span>
                      <span className="font-semibold text-red-600">-{formatCurrency(viewQuote.discount_amount)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-900 font-bold">المبلغ الإجمالي:</span>
                      <span className="font-bold text-lg text-cyan-600">{formatCurrency(viewQuote.total_amount)}</span>
                    </div>
                  </div>
                </div>
                {viewQuote.notes && (
                  <div className="border-t pt-4 space-y-2">
                    <h3 className="font-semibold text-lg">ملاحظات</h3>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded">{viewQuote.notes}</p>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setViewQuote(null)}>
                إغلاق
              </Button>
              <Button onClick={() => {
                if (viewQuote) {
                  setViewQuote(null);
                  handleEdit(viewQuote);
                }
              }}>
                <Edit className="h-4 w-4 ml-2" />
                تعديل
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editQuote} onOpenChange={(open) => !open && setEditQuote(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">تعديل عرض السعر</DialogTitle>
              <DialogDescription>
                تعديل عرض السعر رقم: {editQuote?.quote_number}
              </DialogDescription>
            </DialogHeader>
            {editQuote && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  try {
                    const formData = new FormData(e.currentTarget);
                    const updatedData = {
                      quote_date: formData.get('quote_date') as string,
                      expiry_date: formData.get('expiry_date') as string || null,
                      notes: formData.get('notes') as string || null,
                    };

                    supabase
                      .from('quotes')
                      .update(updatedData)
                      .eq('id', editQuote.id)
                      .then(({ error }) => {
                        if (error) {
                          console.error('Update error:', error);
                          toast({
                            title: 'خطأ',
                            description: error.message,
                            variant: 'destructive',
                          });
                        } else {
                          queryClient.invalidateQueries({ queryKey: ['quotes'] });
                          toast({
                            title: 'تم بنجاح',
                            description: 'تم تحديث عرض السعر بنجاح',
                          });
                          setEditQuote(null);
                        }
                      });
                  } catch (error) {
                    console.error('Form error:', error);
                    toast({
                      title: 'خطأ',
                      description: 'حدث خطأ أثناء التحديث',
                      variant: 'destructive',
                    });
                  }
                }}
                className="space-y-6 py-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">رقم العرض</label>
                    <Input
                      value={editQuote.quote_number}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">الحالة</label>
                    <div className="flex items-center h-10 px-3 border rounded-md bg-gray-50">
                      {getStatusBadge(editQuote.status)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">العميل</label>
                    <Input
                      value={editQuote.customers?.customer_name || 'غير محدد'}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="edit-quote_date" className="text-sm font-medium">
                      تاريخ العرض *
                    </label>
                    <Input
                      id="edit-quote_date"
                      name="quote_date"
                      type="date"
                      defaultValue={editQuote.quote_date?.split('T')[0]}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="edit-expiry_date" className="text-sm font-medium">
                      تاريخ الانتهاء
                    </label>
                    <Input
                      id="edit-expiry_date"
                      name="expiry_date"
                      type="date"
                      defaultValue={editQuote.expiry_date?.split('T')[0] || ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">تاريخ الإنشاء</label>
                    <Input
                      value={safeFormatDate(editQuote.created_at, 'yyyy-MM-dd HH:mm')}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-gradient-to-br from-gray-50 to-blue-50/30 space-y-3">
                  <h3 className="font-semibold text-lg">التفاصيل المالية</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">المبلغ الفرعي</label>
                      <Input
                        value={formatCurrency(editQuote.subtotal)}
                        disabled
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">الضريبة</label>
                      <Input
                        value={formatCurrency(editQuote.tax_amount)}
                        disabled
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">الخصم</label>
                      <Input
                        value={formatCurrency(editQuote.discount_amount)}
                        disabled
                        className="bg-white text-red-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-900 font-bold">المبلغ الإجمالي</label>
                      <Input
                        value={formatCurrency(editQuote.total_amount)}
                        disabled
                        className="bg-white font-bold text-cyan-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="edit-notes" className="text-sm font-medium">
                    ملاحظات
                  </label>
                  <Textarea
                    id="edit-notes"
                    name="notes"
                    defaultValue={editQuote.notes || ''}
                    placeholder="أي ملاحظات إضافية..."
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-blue-600">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-sm text-blue-800">
                    يمكنك تعديل التواريخ والملاحظات فقط. لتعديل التفاصيل المالية، يرجى حذف العرض وإنشاء عرض جديد.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditQuote(null)}
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (editQuote) {
                        setEditQuote(null);
                        handleView(editQuote);
                      }
                    }}
                  >
                    <Eye className="h-4 w-4 ml-2" />
                    عرض التفاصيل
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                  >
                    <Edit className="h-4 w-4 ml-2" />
                    حفظ التعديلات
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        <AddQuoteDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      </div>
    </div>
  );
};

export default Quotes;
