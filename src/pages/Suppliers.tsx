import { Building2, Plus, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react";
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

const Suppliers = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // Sample data - will be replaced with Supabase query
  const suppliers = [
    {
      id: "1",
      name: "شركة التوريدات المتحدة",
      email: "info@united-supply.com",
      phone: "+966 50 123 4567",
      balance: 15000,
      creditLimit: 50000,
      isActive: true,
    },
    {
      id: "2",
      name: "مؤسسة الجودة للتجارة",
      email: "sales@quality-trade.com",
      phone: "+966 55 234 5678",
      balance: 8500,
      creditLimit: 30000,
      isActive: true,
    },
    {
      id: "3",
      name: "شركة الأفق للمواد",
      email: "contact@horizon-materials.com",
      phone: "+966 56 345 6789",
      balance: 22000,
      creditLimit: 60000,
      isActive: false,
    },
  ];

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">الموردين</h1>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة مورد جديد
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">إجمالي الموردين</div>
          <div className="text-2xl font-bold mt-2">{suppliers.length}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">الموردين النشطين</div>
          <div className="text-2xl font-bold mt-2">
            {suppliers.filter((s) => s.isActive).length}
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">إجمالي المستحقات</div>
          <div className="text-2xl font-bold mt-2">
            {suppliers.reduce((sum, s) => sum + s.balance, 0).toLocaleString()} ر.س
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

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">اسم المورد</TableHead>
              <TableHead className="text-right">البريد الإلكتروني</TableHead>
              <TableHead className="text-right">رقم الهاتف</TableHead>
              <TableHead className="text-right">الرصيد المستحق</TableHead>
              <TableHead className="text-right">حد الائتمان</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  لا توجد نتائج
                </TableCell>
              </TableRow>
            ) : (
              filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.email}</TableCell>
                  <TableCell>{supplier.phone}</TableCell>
                  <TableCell>{supplier.balance.toLocaleString()} ر.س</TableCell>
                  <TableCell>{supplier.creditLimit.toLocaleString()} ر.س</TableCell>
                  <TableCell>
                    <Badge variant={supplier.isActive ? "default" : "secondary"}>
                      {supplier.isActive ? "نشط" : "غير نشط"}
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
                        <DropdownMenuItem className="gap-2">
                          <Edit className="h-4 w-4" />
                          تعديل
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

export default Suppliers;
