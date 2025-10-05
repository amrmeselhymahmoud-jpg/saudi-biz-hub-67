import { Users, Plus, Search, MoveHorizontal as MoreHorizontal, CreditCard as Edit, Trash2, Eye, Loader as Loader2, DollarSign, Download, Upload } from "lucide-react";
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
import { AddCustomerDialog } from "@/components/customers/AddCustomerDialog";
import { EditCustomerDialog } from "@/components/customers/EditCustomerDialog";

interface Customer {
  id: string;
  customer_code: string;
  customer_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  tax_number: string | null;
  credit_limit: number;
  payment_terms: number;
  notes: string | null;
  status: string;
  created_by: string;
  created_at: string;
}

const Customers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch customers
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("يجب تسجيل الدخول أولاً");
      }

      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Customer[];
    },
  });

  // Delete customer mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", customerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({
        title: "تم بنجاح",
        description: "تم حذف العميل بنجاح",
      });
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredCustomers = customers.filter((customer) =>
    customer.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.customer_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditDialogOpen(true);
  };

  const handleDelete = (customerId: string) => {
    setCustomerToDelete(customerId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (customerToDelete) {
      deleteCustomerMutation.mutate(customerToDelete);
    }
  };

  const totalCreditLimit = customers.reduce((sum, c) => sum + c.credit_limit, 0);

  const handleExport = () => {
    if (customers.length === 0) {
      toast({
        title: "تنبيه",
        description: "لا توجد بيانات للتصدير",
        variant: "destructive",
      });
      return;
    }

    const exportData = customers.map(c => ({
      'كود العميل': c.customer_code,
      'اسم العميل': c.customer_name,
      'البريد الإلكتروني': c.email || '-',
      'رقم الهاتف': c.phone || '-',
      'المدينة': c.city || '-',
      'حد الائتمان': c.credit_limit,
      'شروط السداد': c.payment_terms,
      'الحالة': c.status === 'active' ? 'نشط' : 'غير نشط'
    }));

    const csv = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "تم التصدير",
      description: `تم تصدير ${customers.length} عميل بنجاح`,
    });
  };

  const handleImport = () => {
    toast({
      title: "قريباً",
      description: "سيتم إضافة وظيفة الاستيراد قريباً",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-teal-50/20 to-green-50/30">
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-gradient-to-br from-teal-500 to-green-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Users className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">العملاء</h1>
            <p className="text-gray-600 mt-1">إدارة بيانات العملاء ومتابعة أرصدتهم</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImport} className="gap-2 hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-all">
            <Upload className="h-4 w-4" />
            استيراد
          </Button>
          <Button variant="outline" onClick={handleExport} className="gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all">
            <Download className="h-4 w-4" />
            تصدير
          </Button>
          <Button size="lg" className="h-12 px-6 bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 shadow-lg hover:shadow-xl transition-all gap-2" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-5 w-5" />
            إضافة عميل جديد
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-500">إجمالي العملاء</div>
              <div className="text-4xl font-bold text-gray-900 mt-2">
                {isLoading ? <Skeleton className="h-10 w-16" /> : customers.length}
              </div>
              <p className="text-xs text-gray-500 mt-1">عميل</p>
            </div>
            <div className="h-16 w-16 bg-gradient-to-br from-teal-100 to-teal-200 rounded-2xl flex items-center justify-center">
              <Users className="h-8 w-8 text-teal-600" />
            </div>
          </div>
        </Card>
        <Card className="bg-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-500">العملاء النشطين</div>
              <div className="text-4xl font-bold text-green-600 mt-2">
                {isLoading ? (
                  <Skeleton className="h-10 w-16" />
                ) : (
                  customers.filter((c) => c.status === 'active').length
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">عميل نشط</p>
            </div>
            <div className="h-16 w-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center">
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </Card>
        <Card className="bg-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-500">إجمالي حدود الائتمان</div>
              <div className="text-3xl font-bold text-orange-600 mt-2">
                {isLoading ? (
                  <Skeleton className="h-10 w-24" />
                ) : (
                  `${totalCreditLimit.toLocaleString()}`
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">ريال سعودي</p>
            </div>
            <div className="h-16 w-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center">
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="بحث عن عميل..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      <Card className="border-0 shadow-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">كود العميل</TableHead>
              <TableHead className="text-right">اسم العميل</TableHead>
              <TableHead className="text-right">البريد الإلكتروني</TableHead>
              <TableHead className="text-right">رقم الهاتف</TableHead>
              <TableHead className="text-right">المدينة</TableHead>
              <TableHead className="text-right">حد الائتمان</TableHead>
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
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "لا توجد نتائج" : "لا يوجد عملاء. ابدأ بإضافة عميل جديد!"}
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium text-gray-600">{customer.customer_code}</TableCell>
                  <TableCell className="font-medium">{customer.customer_name}</TableCell>
                  <TableCell>{customer.email || "-"}</TableCell>
                  <TableCell>{customer.phone || "-"}</TableCell>
                  <TableCell>{customer.city || "-"}</TableCell>
                  <TableCell>{customer.credit_limit.toLocaleString()} ر.س</TableCell>
                  <TableCell>
                    <Badge variant={customer.status === 'active' ? "default" : "secondary"}>
                      {customer.status === 'active' ? "نشط" : "غير نشط"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2" onClick={() => handleEdit(customer)}>
                          <Edit className="h-4 w-4" />
                          تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="gap-2 text-destructive"
                          onClick={() => handleDelete(customer.id)}
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

      {/* Dialogs */}
      <AddCustomerDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      
      <EditCustomerDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        customer={selectedCustomer}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              هذا الإجراء لا يمكن التراجع عنه. سيتم حذف العميل نهائياً من قاعدة البيانات.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCustomerMutation.isPending && (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              )}
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
};

export default Customers;
