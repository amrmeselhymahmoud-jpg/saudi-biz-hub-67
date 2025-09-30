import { Receipt, Plus, Search, MoveHorizontal as MoreHorizontal, Eye, CreditCard as Edit, Trash2, Download } from "lucide-react";
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

const SalesInvoices = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // Sample data - will be replaced with Supabase query
  const invoices = [
    {
      id: "1",
      invoiceNumber: "INV-2025-001",
      customerName: "أحمد محمد العلي",
      date: "2025-01-15",
      dueDate: "2025-02-15",
      status: "paid",
      totalAmount: 5500,
      paidAmount: 5500,
    },
    {
      id: "2",
      invoiceNumber: "INV-2025-002",
      customerName: "شركة النور للتجارة",
      date: "2025-01-18",
      dueDate: "2025-02-18",
      status: "partially_paid",
      totalAmount: 12500,
      paidAmount: 7000,
    },
    {
      id: "3",
      invoiceNumber: "INV-2025-003",
      customerName: "فاطمة عبدالله",
      date: "2025-01-20",
      dueDate: "2025-02-20",
      status: "unpaid",
      totalAmount: 3200,
      paidAmount: 0,
    },
    {
      id: "4",
      invoiceNumber: "INV-2025-004",
      customerName: "مؤسسة الأفق",
      date: "2025-01-22",
      dueDate: "2025-02-22",
      status: "draft",
      totalAmount: 8900,
      paidAmount: 0,
    },
  ];

  const filteredInvoices = invoices.filter((invoice) =>
    invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusMap = {
      paid: { label: "مدفوعة", variant: "default" as const },
      partially_paid: { label: "مدفوعة جزئياً", variant: "secondary" as const },
      unpaid: { label: "غير مدفوعة", variant: "destructive" as const },
      draft: { label: "مسودة", variant: "outline" as const },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap];
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const totalSales = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
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
          <div className="text-2xl font-bold mt-2">{invoices.length}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">إجمالي المبيعات</div>
          <div className="text-2xl font-bold mt-2">
            {totalSales.toLocaleString()} ر.س
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">المبالغ المحصلة</div>
          <div className="text-2xl font-bold mt-2 text-green-600">
            {totalPaid.toLocaleString()} ر.س
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">المبالغ المستحقة</div>
          <div className="text-2xl font-bold mt-2 text-destructive">
            {totalUnpaid.toLocaleString()} ر.س
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
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  لا توجد نتائج
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.customerName}</TableCell>
                  <TableCell>{new Date(invoice.date).toLocaleDateString('ar-SA')}</TableCell>
                  <TableCell>{new Date(invoice.dueDate).toLocaleDateString('ar-SA')}</TableCell>
                  <TableCell>{invoice.totalAmount.toLocaleString()} ر.س</TableCell>
                  <TableCell>{invoice.paidAmount.toLocaleString()} ر.س</TableCell>
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
                        <DropdownMenuItem className="gap-2 text-destructive">
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
    </div>
  );
};

export default SalesInvoices;
