import { useState } from "react";
import { FileBox, Plus, Search, Filter, Download, Eye, Edit, Trash2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AddCustomerBondDialog } from "@/components/bonds/AddCustomerBondDialog";

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
  const { session } = useAuth();

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

  const filteredBonds = bonds.filter(bond =>
    bond.bond_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bond.customers?.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bond.customers?.customer_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      draft: { label: "مسودة", variant: "secondary" },
      posted: { label: "مرحل", variant: "default" },
      cancelled: { label: "ملغي", variant: "destructive" },
    };

    const config = statusConfig[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    return type === 'receipt'
      ? <Badge variant="default" className="bg-green-500">سند قبض</Badge>
      : <Badge variant="default" className="bg-blue-500">سند صرف</Badge>;
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileBox className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">سندات العملاء</h1>
            <p className="text-muted-foreground">إدارة سندات القبض والصرف للعملاء</p>
          </div>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          سند جديد
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>إجمالي المقبوضات</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {receiptsTotal.toLocaleString('ar-SA')} ر.س
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>إجمالي المدفوعات</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {paymentsTotal.toLocaleString('ar-SA')} ر.س
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
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

            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              تصدير
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
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {bond.status === 'draft' && (
                            <>
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
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
    </div>
  );
};

export default CustomerBonds;
