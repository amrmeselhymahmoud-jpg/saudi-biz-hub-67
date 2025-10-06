import { Users, Plus, Search, MoreHorizontal, Edit as EditIcon, Trash2, Loader2, DollarSign, Calendar, Activity } from "lucide-react";
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
import { AdvancedFilters } from "@/components/common/AdvancedFilters";
import { ExportButtons } from "@/components/common/ExportButtons";
import { InlineEdit } from "@/components/common/InlineEdit";
import { format } from "date-fns";

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
  const [filters, setFilters] = useState<Record<string, any>>({
    status: "",
    city: "",
    minCreditLimit: "",
    maxCreditLimit: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Customer[];
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: any }) => {
      const { error } = await supabase
        .from("customers")
        .update({ [field]: value })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث البيانات بنجاح",
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

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.customer_code?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = !filters.status || customer.status === filters.status;
    const matchesCity = !filters.city || customer.city?.toLowerCase().includes(filters.city.toLowerCase());
    const matchesMinCredit = !filters.minCreditLimit || customer.credit_limit >= Number(filters.minCreditLimit);
    const matchesMaxCredit = !filters.maxCreditLimit || customer.credit_limit <= Number(filters.maxCreditLimit);

    return matchesSearch && matchesStatus && matchesCity && matchesMinCredit && matchesMaxCredit;
  });

  const handleInlineUpdate = (customerId: string, field: string, value: string) => {
    updateCustomerMutation.mutate({ id: customerId, field, value });
  };

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
  const activeCustomers = customers.filter((c) => c.status === "active").length;

  const filterOptions = [
    {
      key: "status",
      label: "الحالة",
      type: "select" as const,
      options: [
        { value: "active", label: "نشط" },
        { value: "inactive", label: "غير نشط" },
      ],
    },
    {
      key: "city",
      label: "المدينة",
      type: "text" as const,
    },
    {
      key: "minCreditLimit",
      label: "الحد الأدنى للائتمان",
      type: "number" as const,
    },
    {
      key: "maxCreditLimit",
      label: "الحد الأقصى للائتمان",
      type: "number" as const,
    },
  ];

  const exportColumns = [
    { key: "customer_code", label: "كود العميل" },
    { key: "customer_name", label: "اسم العميل" },
    { key: "email", label: "البريد الإلكتروني" },
    { key: "phone", label: "رقم الهاتف" },
    { key: "city", label: "المدينة" },
    { key: "credit_limit", label: "حد الائتمان" },
    { key: "payment_terms", label: "شروط السداد" },
    { key: "status", label: "الحالة" },
    { key: "created_at", label: "تاريخ الإضافة" },
  ];

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
          <Button
            size="lg"
            className="h-12 px-6 bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 shadow-lg hover:shadow-xl transition-all gap-2"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="h-5 w-5" />
            إضافة عميل جديد
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
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
                  {isLoading ? <Skeleton className="h-10 w-16" /> : activeCustomers}
                </div>
                <p className="text-xs text-gray-500 mt-1">عميل نشط</p>
              </div>
              <div className="h-16 w-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center">
                <Activity className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500">حدود الائتمان</div>
                <div className="text-3xl font-bold text-orange-600 mt-2">
                  {isLoading ? <Skeleton className="h-10 w-24" /> : `${totalCreditLimit.toLocaleString()}`}
                </div>
                <p className="text-xs text-gray-500 mt-1">ريال سعودي</p>
              </div>
              <div className="h-16 w-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center">
                <DollarSign className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500">نتائج التصفية</div>
                <div className="text-4xl font-bold text-blue-600 mt-2">
                  {filteredCustomers.length}
                </div>
                <p className="text-xs text-gray-500 mt-1">عميل</p>
              </div>
              <div className="h-16 w-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </Card>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث عن عميل (الاسم، البريد، الكود)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 h-11"
            />
          </div>
          <AdvancedFilters
            filters={filters}
            onFiltersChange={setFilters}
            filterOptions={filterOptions}
          />
          <ExportButtons
            data={filteredCustomers}
            filename="العملاء"
            columns={exportColumns}
          />
        </div>

        <Card className="border-0 shadow-lg bg-white">
          <div className="overflow-x-auto">
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
                  <TableHead className="text-right">تاريخ الإضافة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg font-medium">
                        {searchQuery || Object.values(filters).some((v) => v)
                          ? "لا توجد نتائج"
                          : "لا يوجد عملاء. ابدأ بإضافة عميل جديد!"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="font-mono font-medium text-gray-900">
                        {customer.customer_code}
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">
                        <InlineEdit
                          value={customer.customer_name}
                          onSave={(value) => handleInlineUpdate(customer.id, "customer_name", value)}
                        />
                      </TableCell>
                      <TableCell>
                        <InlineEdit
                          value={customer.email || ""}
                          onSave={(value) => handleInlineUpdate(customer.id, "email", value)}
                          type="email"
                        />
                      </TableCell>
                      <TableCell>
                        <InlineEdit
                          value={customer.phone || ""}
                          onSave={(value) => handleInlineUpdate(customer.id, "phone", value)}
                          type="tel"
                        />
                      </TableCell>
                      <TableCell>
                        <InlineEdit
                          value={customer.city || ""}
                          onSave={(value) => handleInlineUpdate(customer.id, "city", value)}
                        />
                      </TableCell>
                      <TableCell className="font-bold text-orange-600">
                        {customer.credit_limit.toLocaleString()} ر.س
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer.status === "active" ? "default" : "secondary"}>
                          {customer.status === "active" ? "نشط" : "غير نشط"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {format(new Date(customer.created_at), "yyyy-MM-dd")}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:bg-gray-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2" onClick={() => handleEdit(customer)}>
                              <EditIcon className="h-4 w-4" />
                              تعديل كامل
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleDelete(customer.id)}>
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
          </div>
        </Card>

        <AddCustomerDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
        <EditCustomerDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} customer={selectedCustomer} />

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
                {deleteCustomerMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
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
