import { Package, Plus, Search, MoveHorizontal as MoreHorizontal, Eye, CreditCard as Edit, Trash2, Loader as Loader2, CircleAlert as AlertCircle, TrendingUp, TrendingDown, Download, Upload } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel, exportToCSV, importFromFile } from "@/utils/exportImport";
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
  DropdownMenuSeparator,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Product {
  id: string;
  product_code: string;
  product_name: string;
  description: string | null;
  category: string | null;
  unit: string;
  cost_price: number;
  selling_price: number;
  tax_rate: number;
  min_stock_level: number;
  max_stock_level: number;
  current_stock: number;
  reorder_point: number;
  notes: string | null;
  status: string;
  created_by: string;
  created_at: string;
}

const ProductsCosts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    product_name: "",
    description: "",
    category: "",
    unit: "قطعة",
    cost_price: "",
    selling_price: "",
    tax_rate: "15",
    min_stock_level: "0",
    max_stock_level: "1000",
    current_stock: "0",
    reorder_point: "10",
    notes: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Product[];
    },
  });

  const addProductMutation = useMutation({
    mutationFn: async (productData: typeof formData) => {
      if (!productData.product_name || productData.product_name.trim() === '') {
        throw new Error('اسم المنتج مطلوب');
      }

      const productCode = `PRD-${Date.now()}`;

      const { data, error } = await supabase.from("products").insert({
        product_code: productCode,
        product_name: productData.product_name.trim(),
        description: productData.description?.trim() || null,
        category: productData.category?.trim() || null,
        unit: productData.unit,
        cost_price: parseFloat(productData.cost_price) || 0,
        selling_price: parseFloat(productData.selling_price) || 0,
        tax_rate: parseFloat(productData.tax_rate) || 15,
        min_stock_level: parseInt(productData.min_stock_level) || 0,
        max_stock_level: parseInt(productData.max_stock_level) || 1000,
        current_stock: parseInt(productData.current_stock) || 0,
        reorder_point: parseInt(productData.reorder_point) || 10,
        notes: productData.notes?.trim() || null,
        created_by: session?.user?.id || null,
      }).select();

      if (error) {
        console.error('Error adding product:', error);
        throw new Error(error.message || 'حدث خطأ أثناء إضافة المنتج');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "تم بنجاح", description: "تم إضافة المنتج بنجاح" });
      setAddDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("products")
        .update({
          product_name: data.product_name,
          description: data.description || null,
          category: data.category || null,
          unit: data.unit,
          cost_price: parseFloat(data.cost_price) || 0,
          selling_price: parseFloat(data.selling_price) || 0,
          tax_rate: parseFloat(data.tax_rate) || 15,
          min_stock_level: parseInt(data.min_stock_level) || 0,
          max_stock_level: parseInt(data.max_stock_level) || 1000,
          current_stock: parseInt(data.current_stock) || 0,
          reorder_point: parseInt(data.reorder_point) || 10,
          notes: data.notes || null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "تم بنجاح", description: "تم تحديث المنتج بنجاح" });
      setEditDialogOpen(false);
      setSelectedProduct(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase.from("products").delete().eq("id", productId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "تم بنجاح", description: "تم حذف المنتج بنجاح" });
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const filteredProducts = products.filter((product) =>
    product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.product_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      product_name: "",
      description: "",
      category: "",
      unit: "قطعة",
      cost_price: "",
      selling_price: "",
      tax_rate: "15",
      min_stock_level: "0",
      max_stock_level: "1000",
      current_stock: "0",
      reorder_point: "10",
      notes: "",
    });
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      product_name: product.product_name,
      description: product.description || "",
      category: product.category || "",
      unit: product.unit,
      cost_price: product.cost_price.toString(),
      selling_price: product.selling_price.toString(),
      tax_rate: product.tax_rate.toString(),
      min_stock_level: product.min_stock_level.toString(),
      max_stock_level: product.max_stock_level.toString(),
      current_stock: product.current_stock.toString(),
      reorder_point: product.reorder_point.toString(),
      notes: product.notes || "",
    });
    setEditDialogOpen(true);
  };

  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.status === 'active').length;
  const lowStockProducts = products.filter(p => p.current_stock <= p.reorder_point).length;
  const totalValue = products.reduce((sum, p) => sum + (p.current_stock * p.cost_price), 0);

  const ProductForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="product_name" className="text-base font-semibold">
            اسم المنتج <span className="text-red-500">*</span>
          </Label>
          <Input
            id="product_name"
            name="product_name"
            type="text"
            value={formData.product_name}
            onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
            placeholder="مثال: كمبيوتر محمول Dell"
            className="text-base"
            dir="rtl"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category" className="text-base font-semibold">
              التصنيف
            </Label>
            <Input
              id="category"
              name="category"
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="مثال: إلكترونيات"
              className="text-base"
              dir="rtl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit" className="text-base font-semibold">
              الوحدة <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.unit}
              onValueChange={(value) => setFormData({ ...formData, unit: value })}
            >
              <SelectTrigger id="unit" className="text-base" dir="rtl">
                <SelectValue placeholder="اختر الوحدة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="قطعة">قطعة</SelectItem>
                <SelectItem value="كيلو">كيلو</SelectItem>
                <SelectItem value="لتر">لتر</SelectItem>
                <SelectItem value="متر">متر</SelectItem>
                <SelectItem value="علبة">علبة</SelectItem>
                <SelectItem value="كرتون">كرتون</SelectItem>
                <SelectItem value="صندوق">صندوق</SelectItem>
                <SelectItem value="باكو">باكو</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cost_price" className="text-base font-semibold">
              سعر التكلفة (ر.س) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cost_price"
              name="cost_price"
              type="number"
              step="0.01"
              min="0"
              value={formData.cost_price}
              onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
              placeholder="0.00"
              className="text-base"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="selling_price" className="text-base font-semibold">
              سعر البيع (ر.س) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="selling_price"
              name="selling_price"
              type="number"
              step="0.01"
              min="0"
              value={formData.selling_price}
              onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
              placeholder="0.00"
              className="text-base"
              dir="ltr"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tax_rate" className="text-base font-semibold">
            نسبة الضريبة (%)
          </Label>
          <Input
            id="tax_rate"
            name="tax_rate"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.tax_rate}
            onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
            placeholder="15"
            className="text-base"
            dir="ltr"
          />
        </div>

        <div className="border-t pt-4 mt-4">
          <h3 className="text-lg font-semibold mb-4">إدارة المخزون</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="current_stock" className="text-base font-semibold">
                المخزون الحالي
              </Label>
              <Input
                id="current_stock"
                name="current_stock"
                type="number"
                min="0"
                value={formData.current_stock}
                onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                placeholder="0"
                className="text-base"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorder_point" className="text-base font-semibold">
                نقطة إعادة الطلب
              </Label>
              <Input
                id="reorder_point"
                name="reorder_point"
                type="number"
                min="0"
                value={formData.reorder_point}
                onChange={(e) => setFormData({ ...formData, reorder_point: e.target.value })}
                placeholder="10"
                className="text-base"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_stock_level" className="text-base font-semibold">
                الحد الأدنى للمخزون
              </Label>
              <Input
                id="min_stock_level"
                name="min_stock_level"
                type="number"
                min="0"
                value={formData.min_stock_level}
                onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                placeholder="0"
                className="text-base"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_stock_level" className="text-base font-semibold">
                الحد الأقصى للمخزون
              </Label>
              <Input
                id="max_stock_level"
                name="max_stock_level"
                type="number"
                min="0"
                value={formData.max_stock_level}
                onChange={(e) => setFormData({ ...formData, max_stock_level: e.target.value })}
                placeholder="1000"
                className="text-base"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-4 mt-4">
          <h3 className="text-lg font-semibold mb-4">معلومات إضافية</h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description" className="text-base font-semibold">
                الوصف
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="أدخل وصف تفصيلي للمنتج..."
                rows={3}
                className="text-base resize-none"
                dir="rtl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-base font-semibold">
                ملاحظات
              </Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="أي ملاحظات إضافية..."
                rows={2}
                className="text-base resize-none"
                dir="rtl"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/30">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Package className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">المنتجات والمخزون</h1>
              <p className="text-gray-600 mt-1">إدارة المنتجات والأسعار ومراقبة المخزون</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-6 border-2 gap-2 hover:bg-gray-50"
              onClick={() => {
                const headers = ['كود المنتج', 'اسم المنتج', 'التصنيف', 'الوحدة', 'سعر التكلفة', 'سعر البيع', 'نسبة الضريبة', 'المخزون الحالي', 'نقطة إعادة الطلب', 'الحد الأدنى', 'الحد الأقصى', 'الحالة'];
                const data = products.map(p => [
                  p.product_code,
                  p.product_name,
                  p.category || '',
                  p.unit,
                  p.cost_price,
                  p.selling_price,
                  p.tax_rate,
                  p.current_stock,
                  p.reorder_point,
                  p.min_stock_level,
                  p.max_stock_level,
                  p.status === 'active' ? 'نشط' : 'غير نشط'
                ]);
                exportToExcel(headers, data, 'المنتجات');
                toast({ title: 'تم التصدير بنجاح', description: 'تم تصدير البيانات إلى ملف Excel' });
              }}
            >
              <Download className="h-5 w-5" />
              تصدير
            </Button>
            <Button
              size="lg"
              className="h-12 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all gap-2"
              onClick={() => setAddDialogOpen(true)}
            >
              <Plus className="h-5 w-5" />
              إضافة منتج جديد
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <Card className="bg-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500">إجمالي المنتجات</div>
                <div className="text-4xl font-bold text-gray-900 mt-2">{totalProducts}</div>
                <p className="text-xs text-gray-500 mt-1">منتج</p>
              </div>
              <div className="h-16 w-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500">المنتجات النشطة</div>
                <div className="text-4xl font-bold text-green-600 mt-2">{activeProducts}</div>
                <p className="text-xs text-gray-500 mt-1">منتج نشط</p>
              </div>
              <div className="h-16 w-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500">مخزون منخفض</div>
                <div className="text-4xl font-bold text-orange-600 mt-2">{lowStockProducts}</div>
                <p className="text-xs text-gray-500 mt-1">منتج</p>
              </div>
              <div className="h-16 w-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500">قيمة المخزون</div>
                <div className="text-3xl font-bold text-purple-600 mt-2">
                  {totalValue.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 mt-1">ريال سعودي</p>
              </div>
              <div className="h-16 w-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center">
                <TrendingDown className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث عن منتج..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Button
            variant="outline"
            size="lg"
            className="h-10 px-4 border-2 gap-2 hover:bg-gray-50"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.xlsx,.xls,.csv';
              input.onchange = async (e: any) => {
                const file = e.target?.files?.[0];
                if (file) {
                  try {
                    toast({ title: 'جاري الاستيراد...', description: 'يرجى الانتظار' });
                  } catch (error) {
                    toast({ title: 'خطأ', description: 'حدث خطأ أثناء الاستيراد', variant: 'destructive' });
                  }
                }
              };
              input.click();
            }}
          >
            <Upload className="h-4 w-4" />
            استيراد
          </Button>
        </div>

        <Card className="border-0 shadow-lg bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">كود المنتج</TableHead>
                <TableHead className="text-right">اسم المنتج</TableHead>
                <TableHead className="text-right">التصنيف</TableHead>
                <TableHead className="text-right">الوحدة</TableHead>
                <TableHead className="text-right">سعر التكلفة</TableHead>
                <TableHead className="text-right">سعر البيع</TableHead>
                <TableHead className="text-right">المخزون</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    لا توجد منتجات
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium text-gray-600">{product.product_code}</TableCell>
                    <TableCell className="font-medium">{product.product_name}</TableCell>
                    <TableCell>{product.category || "-"}</TableCell>
                    <TableCell>{product.unit}</TableCell>
                    <TableCell>{product.cost_price.toFixed(2)} ر.س</TableCell>
                    <TableCell>{product.selling_price.toFixed(2)} ر.س</TableCell>
                    <TableCell>
                      <Badge variant={product.current_stock <= product.reorder_point ? "destructive" : "default"}>
                        {product.current_stock}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.status === 'active' ? "default" : "secondary"}>
                        {product.status === 'active' ? "نشط" : "غير نشط"}
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
                          <DropdownMenuItem className="gap-2 hover:bg-blue-50 hover:text-blue-600" onClick={() => handleEdit(product)}>
                            <Edit className="h-4 w-4" />
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="gap-2 text-destructive hover:bg-red-50 hover:text-red-600"
                            onClick={() => {
                              setProductToDelete(product.id);
                              setDeleteDialogOpen(true);
                            }}
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

        {/* Add Product Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={(open) => {
          setAddDialogOpen(open);
          if (!open) {
            resetForm();
          }
        }}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">إضافة منتج جديد</DialogTitle>
              <DialogDescription className="text-base">
                قم بملء جميع الحقول المطلوبة لإضافة منتج جديد إلى النظام
              </DialogDescription>
            </DialogHeader>
            <ProductForm />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  setAddDialogOpen(false);
                  resetForm();
                }}
                className="text-base"
              >
                إلغاء
              </Button>
              <Button
                onClick={() => {
                  if (!formData.product_name.trim()) {
                    toast({
                      title: 'خطأ',
                      description: 'اسم المنتج مطلوب',
                      variant: 'destructive'
                    });
                    return;
                  }
                  addProductMutation.mutate(formData);
                }}
                disabled={addProductMutation.isPending || !formData.product_name}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-base"
              >
                {addProductMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                إضافة المنتج
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Product Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setSelectedProduct(null);
            resetForm();
          }
        }}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">تعديل المنتج</DialogTitle>
              <DialogDescription className="text-base">
                قم بتحديث معلومات المنتج حسب الحاجة
              </DialogDescription>
            </DialogHeader>
            <ProductForm isEdit />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  setSelectedProduct(null);
                  resetForm();
                }}
                className="text-base"
              >
                إلغاء
              </Button>
              <Button
                onClick={() =>
                  selectedProduct && updateProductMutation.mutate({ id: selectedProduct.id, data: formData })
                }
                disabled={updateProductMutation.isPending || !formData.product_name}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-base"
              >
                {updateProductMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                تحديث المنتج
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => productToDelete && deleteProductMutation.mutate(productToDelete)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default ProductsCosts;
