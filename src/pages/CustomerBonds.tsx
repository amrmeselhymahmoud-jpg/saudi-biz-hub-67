import { useState } from "react";
import { FileBox, Plus, Search, Download, Eye, CreditCard as Edit, Trash2, Printer, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { AddCustomerBondDialog } from "@/components/bonds/AddCustomerBondDialog";
import { exportToCSV, exportToJSON } from "@/utils/exportImport";

interface CustomerBond {
  id: string;
  bond_number: string;
  customer_id: string;
  bond_type: 'receipt' | 'payment';
  bond_date: string;
  amount: number;
  payment_method: string;
  reference_number?: string;
  bank_name?: string;
  notes?: string;
  status: 'draft' | 'posted' | 'cancelled';
  customers?: {
    customer_name: string;
    customer_code: string;
  };
}

const CustomerBonds = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBond, setSelectedBond] = useState<CustomerBond | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});

  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bonds = [], isLoading, refetch } = useQuery({
    queryKey: ['customer-bonds', statusFilter, typeFilter],
    queryFn: async () => {
      let query = supabase
        .from('customer_bonds')
        .select(`
          *,
          customers (
            customer_name,
            customer_code
          )
        `)
        .order('bond_date', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (typeFilter !== 'all') {
        query = query.eq('bond_type', typeFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as CustomerBond[];
    },
    enabled: !!session,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers-for-bonds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, customer_name, customer_code')
        .eq('status', 'active')
        .order('customer_name');

      if (error) throw error;
      return data;
    },
    enabled: !!session,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customer_bonds')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-bonds'] });
      toast({
        title: "تم الحذف",
        description: "تم حذف السند بنجاح",
      });
      setDeleteDialogOpen(false);
      setSelectedBond(null);
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('customer_bonds')
        .update(data)
        .eq('id', selectedBond?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-bonds'] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث السند بنجاح",
      });
      setEditDialogOpen(false);
      setSelectedBond(null);
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredBonds = bonds.filter(bond =>
    bond.bond_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bond.customers?.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bond.customers?.customer_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      draft: { label: "مسودة", className: "bg-gray-500" },
      posted: { label: "مرحل", className: "bg-green-500" },
      cancelled: { label: "ملغي", className: "bg-red-500" },
    };

    const config = statusConfig[status] || { label: status, className: "bg-gray-500" };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    return type === 'receipt'
      ? <Badge className="bg-green-500">سند قبض</Badge>
      : <Badge className="bg-blue-500">سند صرف</Badge>;
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      cash: 'نقدي',
      bank_transfer: 'تحويل بنكي',
      check: 'شيك',
      card: 'بطاقة',
    };
    return methods[method] || method;
  };

  const totalAmount = filteredBonds
    .filter(b => b.status === 'posted')
    .reduce((sum, bond) => {
      if (bond.bond_type === 'receipt') {
        return sum + Number(bond.amount);
      } else {
        return sum - Number(bond.amount);
      }
    }, 0);

  const receiptsTotal = filteredBonds
    .filter(b => b.bond_type === 'receipt' && b.status === 'posted')
    .reduce((sum, bond) => sum + Number(bond.amount), 0);

  const paymentsTotal = filteredBonds
    .filter(b => b.bond_type === 'payment' && b.status === 'posted')
    .reduce((sum, bond) => sum + Number(bond.amount), 0);

  const handleView = (bond: CustomerBond) => {
    setSelectedBond(bond);
    setViewDialogOpen(true);
  };

  const handleEdit = (bond: CustomerBond) => {
    setSelectedBond(bond);
    setEditFormData({
      customer_id: bond.customer_id,
      bond_type: bond.bond_type,
      bond_date: bond.bond_date,
      amount: bond.amount.toString(),
      payment_method: bond.payment_method,
      reference_number: bond.reference_number || '',
      bank_name: bond.bank_name || '',
      notes: bond.notes || '',
      status: bond.status,
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (bond: CustomerBond) => {
    setSelectedBond(bond);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedBond) {
      deleteMutation.mutate(selectedBond.id);
    }
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(editFormData);
  };

  const handleExport = (format: 'csv' | 'json') => {
    if (filteredBonds.length === 0) {
      toast({
        title: "تنبيه",
        description: "لا توجد بيانات للتصدير",
        variant: "destructive",
      });
      return;
    }

    const exportData = filteredBonds.map(bond => ({
      'رقم السند': bond.bond_number,
      'التاريخ': new Date(bond.bond_date).toLocaleDateString('ar-SA'),
      'العميل': bond.customers?.customer_name || '-',
      'كود العميل': bond.customers?.customer_code || '-',
      'النوع': bond.bond_type === 'receipt' ? 'سند قبض' : 'سند صرف',
      'المبلغ': bond.amount,
      'طريقة الدفع': getPaymentMethodLabel(bond.payment_method),
      'رقم المرجع': bond.reference_number || '-',
      'البنك': bond.bank_name || '-',
      'الحالة': bond.status === 'draft' ? 'مسودة' : bond.status === 'posted' ? 'مرحل' : 'ملغي',
      'الملاحظات': bond.notes || '-'
    }));

    if (format === 'csv') {
      exportToCSV(exportData, 'customer_bonds');
    } else {
      exportToJSON(exportData, 'customer_bonds');
    }

    toast({
      title: "تم التصدير",
      description: `تم تصدير ${filteredBonds.length} سند بنجاح`,
    });
  };

  const handleImport = () => {
    toast({
      title: "قريباً",
      description: "ميزة الاستيراد ستكون متاحة قريباً",
    });
  };

  const handlePrint = () => {
    if (filteredBonds.length === 0) {
      toast({
        title: "تنبيه",
        description: "لا توجد بيانات للطباعة",
        variant: "destructive",
      });
      return;
    }

    const printContent = filteredBonds.map(bond => `
      <tr>
        <td>${bond.bond_number}</td>
        <td>${new Date(bond.bond_date).toLocaleDateString('ar-SA')}</td>
        <td>${bond.customers?.customer_name || '-'}</td>
        <td>${bond.bond_type === 'receipt' ? 'قبض' : 'صرف'}</td>
        <td>${getPaymentMethodLabel(bond.payment_method)}</td>
        <td style="font-weight: bold; color: ${bond.bond_type === 'receipt' ? '#16a34a' : '#2563eb'};">
          ${Number(bond.amount).toLocaleString('ar-SA')} ر.س
        </td>
        <td>${bond.status === 'draft' ? 'مسودة' : bond.status === 'posted' ? 'مرحل' : 'ملغي'}</td>
      </tr>
    `).join('');

    const htmlContent = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>قائمة سندات العملاء</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; direction: rtl; padding: 20px; background: white; }
    h1 { text-align: center; color: #ea580c; margin-bottom: 10px; font-size: 28px; }
    .date { text-align: center; color: #666; margin-bottom: 20px; font-size: 14px; }
    .summary { margin: 20px 0; padding: 15px; background-color: #fff7ed; border-radius: 8px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
    .summary-item { text-align: center; }
    .summary-label { font-size: 14px; color: #666; margin-bottom: 5px; }
    .summary-value { font-size: 24px; font-weight: bold; }
    .receipts { color: #16a34a; }
    .payments { color: #2563eb; }
    .net { color: ${totalAmount >= 0 ? '#16a34a' : '#dc2626'}; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
    th { background-color: #ea580c; color: white; padding: 12px 8px; border: 1px solid #ddd; font-weight: bold; }
    td { padding: 8px; border: 1px solid #ddd; }
    tr:nth-child(even) { background-color: #f9fafb; }
    .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; border-top: 2px solid #ea580c; padding-top: 15px; }
    @media print {
      body { padding: 10px; }
      .summary { page-break-inside: avoid; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>قائمة سندات العملاء</h1>
  <p class="date">التاريخ: ${new Date().toLocaleDateString('ar-SA')}</p>
  <div class="summary">
    <div class="summary-item">
      <div class="summary-label">إجمالي المقبوضات</div>
      <div class="summary-value receipts">${receiptsTotal.toLocaleString('ar-SA')} ر.س</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">إجمالي المدفوعات</div>
      <div class="summary-value payments">${paymentsTotal.toLocaleString('ar-SA')} ر.س</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">الصافي</div>
      <div class="summary-value net">${totalAmount.toLocaleString('ar-SA')} ر.س</div>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>رقم السند</th>
        <th>التاريخ</th>
        <th>العميل</th>
        <th>النوع</th>
        <th>طريقة الدفع</th>
        <th>المبلغ</th>
        <th>الحالة</th>
      </tr>
    </thead>
    <tbody>${printContent}</tbody>
  </table>
  <div class="footer">
    <p>إجمالي السندات: ${filteredBonds.length}</p>
    <p>تم الطباعة في: ${new Date().toLocaleString('ar-SA')}</p>
  </div>
</body>
</html>`;

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();

      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        }, 500);
      };

      toast({
        title: "جاهز للطباعة",
        description: "تم تحضير الصفحة للطباعة",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
            <FileBox className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              سندات العملاء
            </h1>
            <p className="text-muted-foreground">إدارة سندات القبض والصرف للعملاء</p>
          </div>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="gap-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
        >
          <Plus className="h-4 w-4" />
          سند جديد
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardDescription>إجمالي المقبوضات</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {receiptsTotal.toLocaleString('ar-SA')} ر.س
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardDescription>إجمالي المدفوعات</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {paymentsTotal.toLocaleString('ar-SA')} ر.س
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className={`border-l-4 ${totalAmount >= 0 ? 'border-l-green-500' : 'border-l-red-500'}`}>
          <CardHeader className="pb-3">
            <CardDescription>الصافي</CardDescription>
            <CardTitle className={`text-3xl ${totalAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalAmount.toLocaleString('ar-SA')} ر.س
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="البحث برقم السند أو اسم العميل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="نوع السند" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="receipt">سند قبض</SelectItem>
                <SelectItem value="payment">سند صرف</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="posted">مرحل</SelectItem>
                <SelectItem value="cancelled">ملغي</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={handlePrint}
              className="gap-2 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300 transition-all"
            >
              <Printer className="h-4 w-4" />
              طباعة
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-all"
                >
                  <Download className="h-4 w-4" />
                  تصدير
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  تصدير CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('json')}>
                  تصدير JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              onClick={handleImport}
              className="gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all"
            >
              <Upload className="h-4 w-4" />
              استيراد
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredBonds.length === 0 ? (
            <div className="text-center py-12">
              <FileBox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد سندات</h3>
              <p className="text-muted-foreground mb-4">ابدأ بإضافة سند جديد</p>
              <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                إضافة سند
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم السند</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">العميل</TableHead>
                    <TableHead className="text-right">النوع</TableHead>
                    <TableHead className="text-right">طريقة الدفع</TableHead>
                    <TableHead className="text-right">المبلغ</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBonds.map((bond) => (
                    <TableRow key={bond.id}>
                      <TableCell className="font-medium">{bond.bond_number}</TableCell>
                      <TableCell>{new Date(bond.bond_date).toLocaleDateString('ar-SA')}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{bond.customers?.customer_name}</div>
                          <div className="text-sm text-muted-foreground">{bond.customers?.customer_code}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(bond.bond_type)}</TableCell>
                      <TableCell>{getPaymentMethodLabel(bond.payment_method)}</TableCell>
                      <TableCell className={`font-semibold ${bond.bond_type === 'receipt' ? 'text-green-600' : 'text-blue-600'}`}>
                        {Number(bond.amount).toLocaleString('ar-SA')} ر.س
                      </TableCell>
                      <TableCell>{getStatusBadge(bond.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(bond)}
                            className="hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {bond.status === 'draft' && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(bond)}
                                className="hover:bg-orange-50 hover:text-orange-600"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(bond)}
                                className="hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
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

      <AddCustomerBondDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={() => {
          refetch();
          setIsAddDialogOpen(false);
        }}
      />

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تفاصيل السند</DialogTitle>
          </DialogHeader>
          {selectedBond && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">رقم السند</Label>
                  <p className="font-bold">{selectedBond.bond_number}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">التاريخ</Label>
                  <p>{new Date(selectedBond.bond_date).toLocaleDateString('ar-SA')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">العميل</Label>
                  <p className="font-bold">{selectedBond.customers?.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedBond.customers?.customer_code}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">النوع</Label>
                  <div className="mt-1">{getTypeBadge(selectedBond.bond_type)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">المبلغ</Label>
                  <p className={`text-2xl font-bold ${selectedBond.bond_type === 'receipt' ? 'text-green-600' : 'text-blue-600'}`}>
                    {Number(selectedBond.amount).toLocaleString('ar-SA')} ر.س
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">طريقة الدفع</Label>
                  <p>{getPaymentMethodLabel(selectedBond.payment_method)}</p>
                </div>
                {selectedBond.reference_number && (
                  <div>
                    <Label className="text-muted-foreground">رقم المرجع</Label>
                    <p>{selectedBond.reference_number}</p>
                  </div>
                )}
                {selectedBond.bank_name && (
                  <div>
                    <Label className="text-muted-foreground">البنك</Label>
                    <p>{selectedBond.bank_name}</p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">الحالة</Label>
                  <div className="mt-1">{getStatusBadge(selectedBond.status)}</div>
                </div>
              </div>
              {selectedBond.notes && (
                <div>
                  <Label className="text-muted-foreground">الملاحظات</Label>
                  <p className="mt-1 p-3 bg-muted rounded-md">{selectedBond.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تعديل السند</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>العميل</Label>
                <Select
                  value={editFormData.customer_id}
                  onValueChange={(value) => setEditFormData({ ...editFormData, customer_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer: any) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.customer_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>نوع السند</Label>
                <Select
                  value={editFormData.bond_type}
                  onValueChange={(value) => setEditFormData({ ...editFormData, bond_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receipt">سند قبض</SelectItem>
                    <SelectItem value="payment">سند صرف</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>التاريخ</Label>
                <Input
                  type="date"
                  value={editFormData.bond_date}
                  onChange={(e) => setEditFormData({ ...editFormData, bond_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>المبلغ</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editFormData.amount}
                  onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>طريقة الدفع</Label>
                <Select
                  value={editFormData.payment_method}
                  onValueChange={(value) => setEditFormData({ ...editFormData, payment_method: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">نقدي</SelectItem>
                    <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                    <SelectItem value="check">شيك</SelectItem>
                    <SelectItem value="card">بطاقة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>الحالة</Label>
                <Select
                  value={editFormData.status}
                  onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">مسودة</SelectItem>
                    <SelectItem value="posted">مرحل</SelectItem>
                    <SelectItem value="cancelled">ملغي</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>رقم المرجع</Label>
                <Input
                  value={editFormData.reference_number}
                  onChange={(e) => setEditFormData({ ...editFormData, reference_number: e.target.value })}
                  placeholder="اختياري"
                />
              </div>

              <div className="space-y-2">
                <Label>البنك</Label>
                <Input
                  value={editFormData.bank_name}
                  onChange={(e) => setEditFormData({ ...editFormData, bank_name: e.target.value })}
                  placeholder="اختياري"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>الملاحظات</Label>
              <Textarea
                value={editFormData.notes}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                placeholder="أي ملاحظات إضافية..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
              >
                حفظ التعديلات
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف السند رقم {selectedBond?.bond_number} نهائياً. هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CustomerBonds;
