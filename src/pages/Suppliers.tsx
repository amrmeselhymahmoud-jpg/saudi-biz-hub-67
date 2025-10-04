import { Building2, Plus, Search, MoveHorizontal as MoreHorizontal, CreditCard as Edit, Trash2, Loader as Loader2, DollarSign, Download, Upload } from "lucide-react";
import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { AddSupplierDialog } from "@/components/suppliers/AddSupplierDialog";
import { EditSupplierDialog } from "@/components/suppliers/EditSupplierDialog";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { EmptyTableMessage } from "@/components/EmptyTableMessage";

interface Supplier {
  id: string;
  supplier_code: string;
  supplier_name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  tax_number?: string;
  credit_limit?: number;
  payment_terms?: number;
  notes?: string;
  status: string;
  created_by: string;
  created_at: string;
}

const Suppliers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);
  
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: suppliers = [], isLoading, error: queryError } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("created_by", session?.user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Supplier[];
    },
    enabled: !!session?.user?.id,
    retry: false,
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: async (supplierId: string) => {
      const { error } = await supabase
        .from("suppliers")
        .delete()
        .eq("id", supplierId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast({
        title: "تم بنجاح",
        description: "تم حذف المورد بنجاح",
      });
      setDeleteDialogOpen(false);
      setSupplierToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setEditDialogOpen(true);
  };

  const handleDelete = (supplierId: string) => {
    setSupplierToDelete(supplierId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (supplierToDelete) {
      deleteSupplierMutation.mutate(supplierToDelete);
    }
  };

  if (queryError) {
    console.error('Error loading suppliers:', queryError);
  }

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (supplier.email && supplier.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (supplier.supplier_code && supplier.supplier_code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleExport = () => {
    const exportData = suppliers.map(s => ({
      supplier_code: s.supplier_code,
      supplier_name: s.supplier_name,
      email: s.email || '',
      phone: s.phone || '',
      city: s.city || '',
      credit_limit: s.credit_limit || 0,
      payment_terms: s.payment_terms || 0,
      status: s.status === 'active' ? 'نشط' : 'غير نشط'
    }));

    const csv = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `suppliers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleImport = () => {
    toast({
      title: "قريباً",
      description: "سيتم إضافة وظيفة الاستيراد قريباً",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/20 to-red-50/30">
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">الموردين</h1>
            <p className="text-gray-600 mt-1">إدارة بيانات الموردين ومتابعة مستحقاتهم</p>
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
          <Button size="lg" className="h-12 px-6 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-lg hover:shadow-xl transition-all gap-2" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-5 w-5" />
            إضافة مورد جديد
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-500">إجمالي الموردين</div>
              <div className="text-4xl font-bold text-gray-900 mt-2">{suppliers.length}</div>
              <p className="text-xs text-gray-500 mt-1">مورد</p>
            </div>
            <div className="h-16 w-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center">
              <Building2 className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </Card>
        <Card className="bg-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-500">الموردين النشطين</div>
              <div className="text-4xl font-bold text-green-600 mt-2">
                {suppliers.filter((s) => s.status === 'active').length}
              </div>
              <p className="text-xs text-gray-500 mt-1">مورد نشط</p>
            </div>
            <div className="h-16 w-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center">
              <Building2 className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </Card>
        <Card className="bg-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-500">إجمالي حدود الائتمان</div>
              <div className="text-3xl font-bold text-red-600 mt-2">
                {suppliers.reduce((sum, s) => sum + (s.credit_limit || 0), 0).toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">ريال سعودي</p>
            </div>
            <div className="h-16 w-16 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center">
              <DollarSign className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="بحث عن مورد..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      <Card className="border-0 shadow-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">كود المورد</TableHead>
              <TableHead className="text-right">اسم المورد</TableHead>
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
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  لا توجد نتائج
                </TableCell>
              </TableRow>
            ) : (
              filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium text-gray-600">{supplier.supplier_code}</TableCell>
                  <TableCell className="font-medium">{supplier.supplier_name}</TableCell>
                  <TableCell>{supplier.email || "-"}</TableCell>
                  <TableCell>{supplier.phone || "-"}</TableCell>
                  <TableCell>{supplier.city || "-"}</TableCell>
                  <TableCell>{(supplier.credit_limit || 0).toLocaleString()} ر.س</TableCell>
                  <TableCell>
                    <Badge variant={supplier.status === 'active' ? "default" : "secondary"}>
                      {supplier.status === 'active' ? "نشط" : "غير نشط"}
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
                        <DropdownMenuItem className="gap-2 hover:bg-blue-50 hover:text-blue-600" onClick={() => handleEdit(supplier)}>
                          <Edit className="h-4 w-4" />
                          تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 text-destructive hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleDelete(supplier.id)}
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

      <AddSupplierDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      
      <EditSupplierDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        supplier={selectedSupplier}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف المورد نهائياً ولن يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSupplierMutation.isPending && (
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

export default Suppliers;
