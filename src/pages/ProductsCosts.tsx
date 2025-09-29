import { Package, Plus, Search, MoreHorizontal, Edit, Trash2, AlertCircle } from "lucide-react";
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

const ProductsCosts = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // Sample data - will be replaced with Supabase query
  const products = [
    {
      id: "1",
      name: "لابتوب HP ProBook",
      sku: "LAP-HP-001",
      category: "إلكترونيات",
      quantity: 25,
      minStockLevel: 10,
      costPrice: 2500,
      sellingPrice: 3200,
      unit: "قطعة",
      isActive: true,
    },
    {
      id: "2",
      name: "طابعة Canon",
      sku: "PRT-CAN-002",
      category: "إلكترونيات",
      quantity: 8,
      minStockLevel: 10,
      costPrice: 800,
      sellingPrice: 1100,
      unit: "قطعة",
      isActive: true,
    },
    {
      id: "3",
      name: "ورق A4",
      sku: "PAP-A4-003",
      category: "قرطاسية",
      quantity: 150,
      minStockLevel: 50,
      costPrice: 15,
      sellingPrice: 25,
      unit: "رزمة",
      isActive: true,
    },
  ];

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalValue = products.reduce((sum, p) => sum + (p.costPrice * p.quantity), 0);
  const lowStockCount = products.filter(p => p.quantity <= p.minStockLevel).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">المنتجات والتكاليف</h1>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة منتج جديد
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">إجمالي المنتجات</div>
          <div className="text-2xl font-bold mt-2">{products.length}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">قيمة المخزون</div>
          <div className="text-2xl font-bold mt-2">
            {totalValue.toLocaleString()} ر.س
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">منتجات نشطة</div>
          <div className="text-2xl font-bold mt-2">
            {products.filter((p) => p.isActive).length}
          </div>
        </Card>
        <Card className="p-6 border-destructive/50">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            مخزون منخفض
          </div>
          <div className="text-2xl font-bold mt-2 text-destructive">
            {lowStockCount}
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="بحث عن منتج..."
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
              <TableHead className="text-right">اسم المنتج</TableHead>
              <TableHead className="text-right">رمز المنتج</TableHead>
              <TableHead className="text-right">الفئة</TableHead>
              <TableHead className="text-right">الكمية</TableHead>
              <TableHead className="text-right">سعر التكلفة</TableHead>
              <TableHead className="text-right">سعر البيع</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  لا توجد نتائج
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{product.quantity} {product.unit}</span>
                      {product.quantity <= product.minStockLevel && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{product.costPrice.toLocaleString()} ر.س</TableCell>
                  <TableCell>{product.sellingPrice.toLocaleString()} ر.س</TableCell>
                  <TableCell>
                    <Badge variant={product.isActive ? "default" : "secondary"}>
                      {product.isActive ? "نشط" : "غير نشط"}
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

export default ProductsCosts;
