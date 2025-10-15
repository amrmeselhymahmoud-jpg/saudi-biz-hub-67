import { Package, Plus, Search, MoreHorizontal, Eye, Pencil, Trash2, Loader2, DollarSign, TrendingUp, Download, Upload } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel, exportToCSV, importFromFile } from "@/utils/exportImport";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ProductForm } from "@/components/products/ProductForm";
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
import { Badge } from "@/components/ui/badge";
import { EmptyTableMessage } from "@/components/EmptyTableMessage";

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
  shipping_cost: number;
  additional_costs: number;
  total_cost: number;
  profit_margin: number;
  suggested_selling_price: number;
  notes: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
}

const ProductsCosts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [costDialogOpen, setCostDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const initialFormData = {
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
    shipping_cost: "0",
    additional_costs: "0",
    notes: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [costFormData, setCostFormData] = useState({
    shipping_cost: "",
    additional_costs: "",
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

  const resetForm = () => {
    setFormData(initialFormData);
  };

  const addProductMutation = useMutation({
    mutationFn: async (productData: typeof formData) => {
      if (!productData.product_name?.trim()) {
        throw new Error('اسم المنتج مطلوب');
      }

      if (!productData.cost_price || parseFloat(productData.cost_price) <= 0) {
        throw new Error('سعر التكلفة مطلوب ويجب أن يكون أكبر من صفر');
      }

      if (!productData.selling_price || parseFloat(productData.selling_price) <= 0) {
        throw new Error('سعر البيع مطلوب ويجب أن يكون أكبر من صفر');
      }

      const productCode = `PRD-${Date.now()}`;

      const { data, error } = await supabase.from("products").insert({
        product_code: productCode,
        product_name: productData.product_name.trim(),
        description: productData.description?.trim() || null,
        category: productData.category?.trim() || null,
        unit: productData.unit || 'قطعة',
        cost_price: parseFloat(productData.cost_price) || 0,
        selling_price: parseFloat(productData.selling_price) || 0,
        tax_rate: parseFloat(productData.tax_rate) || 15,
        min_stock_level: parseInt(productData.min_stock_level) || 0,
        max_stock_level: parseInt(productData.max_stock_level) || 1000,
        current_stock: parseInt(productData.current_stock) || 0,
        reorder_point: parseInt(productData.reorder_point) || 10,
        shipping_cost: parseFloat(productData.shipping_cost) || 0,
        additional_costs: parseFloat(productData.additional_costs) || 0,
        notes: productData.notes?.trim() || null,
        created_by: session?.user?.id || null,
        status: 'active',
      }).select();

      if (error) {
        console.error('Error adding product:', error);
        throw new Error(error.message || 'حدث خطأ أثناء إضافة المنتج');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "تم بنجاح",
        description: "تم إضافة المنتج بنجاح",
        duration: 3000,
      });
      setAddDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
        duration: 4000,
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      if (!data.product_name?.trim()) {
        throw new Error('اسم المنتج مطلوب');
      }

      const { error } = await supabase
        .from("products")
        .update({
          product_name: data.product_name.trim(),
          description: data.description?.trim() || null,
          category: data.category?.trim() || null,
          unit: data.unit,
          cost_price: parseFloat(data.cost_price) || 0,
          selling_price: parseFloat(data.selling_price) || 0,
          tax_rate: parseFloat(data.tax_rate) || 15,
          min_stock_level: parseInt(data.min_stock_level) || 0,
          max_stock_level: parseInt(data.max_stock_level) || 1000,
          current_stock: parseInt(data.current_stock) || 0,
          reorder_point: parseInt(data.reorder_point) || 10,
          shipping_cost: parseFloat(data.shipping_cost) || 0,
          additional_costs: parseFloat(data.additional_costs) || 0,
          notes: data.notes?.trim() || null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "تم بنجاح",
        description: "تم تحديث المنتج بنجاح",
        duration: 3000,
      });
      setEditDialogOpen(false);
      setSelectedProduct(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
        duration: 4000,
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase.from("products").delete().eq("id", productId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "تم بنجاح",
        description: "تم حذف المنتج بنجاح",
        duration: 3000,
      });
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
        duration: 4000,
      });
    },
  });

  const updateCostsMutation = useMutation({
    mutationFn: async ({ id, costs }: { id: string; costs: typeof costFormData }) => {
      const { error } = await supabase
        .from("products")
        .update({
          shipping_cost: parseFloat(costs.shipping_cost) || 0,
          additional_costs: parseFloat(costs.additional_costs) || 0,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "تم بنجاح",
        description: "تم تحديث التكاليف بنجاح",
        duration: 3000,
      });
      setCostDialogOpen(false);
      setSelectedProduct(null);
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
        duration: 4000,
      });
    },
  });

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
      shipping_cost: product.shipping_cost?.toString() || "0",
      additional_costs: product.additional_costs?.toString() || "0",
      notes: product.notes || "",
    });
    setEditDialogOpen(true);
  };

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setViewDialogOpen(true);
  };

  const handleAddCosts = (product: Product) => {
    setSelectedProduct(product);
    setCostFormData({
      shipping_cost: product.shipping_cost?.toString() || "0",
      additional_costs: product.additional_costs?.toString() || "0",
    });
    setCostDialogOpen(true);
  };

  const filteredProducts = products.filter(
    (product) =>
      product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.product_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.status === 'active').length;
  const lowStockProducts = products.filter(p => p.current_stock <= p.reorder_point).length;
  const totalValue = products.reduce((sum, p) => sum + (p.current_stock * p.cost_price), 0);


  return (
    <div className="flex flex-col gap-6 p-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8" />
            المنتجات والتكاليف
          </h1>
          <p className="text-muted-foreground mt-2">
            إدارة المنتجات وتتبع التكاليف والأسعار
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة منتج جديد
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">إجمالي المنتجات</p>
              <p className="text-2xl font-bold">{totalProducts}</p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">المنتجات النشطة</p>
              <p className="text-2xl font-bold">{activeProducts}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">مخزون منخفض</p>
              <p className="text-2xl font-bold text-orange-500">{lowStockProducts}</p>
            </div>
            <Package className="h-8 w-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">القيمة الإجمالية</p>
              <p className="text-2xl font-bold">{totalValue.toFixed(2)} ر.س</p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="ابحث عن منتج..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportToExcel(filteredProducts, 'products')}>
              <Download className="h-4 w-4 ml-2" />
              Excel
            </Button>
            <Button variant="outline" onClick={() => exportToCSV(filteredProducts, 'products')}>
              <Download className="h-4 w-4 ml-2" />
              CSV
            </Button>
            <Button variant="outline" onClick={() => document.getElementById('import-file')?.click()}>
              <Upload className="h-4 w-4 ml-2" />
              استيراد
            </Button>
            <input
              id="import-file"
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => importFromFile(e, 'products', queryClient)}
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الكود</TableHead>
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
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    <p className="mt-2 text-muted-foreground">جاري التحميل...</p>
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <EmptyTableMessage
                      message={searchQuery ? "لا توجد منتجات مطابقة لبحثك" : "لا توجد منتجات"}
                      onAdd={() => setAddDialogOpen(true)}
                      addButtonText="إضافة منتج جديد"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.product_code}</TableCell>
                    <TableCell>{product.product_name}</TableCell>
                    <TableCell>{product.category || '-'}</TableCell>
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
                        {product.status === 'active' ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" dir="rtl">
                          <DropdownMenuItem onClick={() => handleViewDetails(product)}>
                            <Eye className="ml-2 h-4 w-4" />
                            عرض التفاصيل
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(product)}>
                            <Pencil className="ml-2 h-4 w-4" />
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAddCosts(product)}>
                            <DollarSign className="ml-2 h-4 w-4" />
                            إضافة تكاليف
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setProductToDelete(product.id);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="ml-2 h-4 w-4" />
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

      <Dialog open={addDialogOpen} onOpenChange={(open) => {
        setAddDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto" style={{ pointerEvents: 'auto', zIndex: 50 }}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-right">إضافة منتج جديد</DialogTitle>
            <DialogDescription className="text-base text-right">
              قم بملء جميع الحقول المطلوبة لإضافة منتج جديد إلى النظام
            </DialogDescription>
          </DialogHeader>
          <div style={{ pointerEvents: 'auto' }}>
            <ProductForm formData={formData} onChange={setFormData} />
          </div>
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
              onClick={() => addProductMutation.mutate(formData)}
              disabled={addProductMutation.isPending || !formData.product_name}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-base font-bold"
            >
              {addProductMutation.isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Plus className="ml-2 h-4 w-4" />
                  حفظ المنتج
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) {
          setSelectedProduct(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-right">تعديل المنتج</DialogTitle>
            <DialogDescription className="text-base text-right">
              قم بتعديل المعلومات المطلوبة للمنتج
            </DialogDescription>
          </DialogHeader>
          <ProductForm formData={formData} onChange={setFormData} />
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
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-base font-bold"
            >
              {updateProductMutation.isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري التحديث...
                </>
              ) : (
                <>
                  <Pencil className="ml-2 h-4 w-4" />
                  حفظ التعديلات
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-right">تفاصيل المنتج</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4" dir="rtl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">الكود</p>
                  <p className="font-semibold">{selectedProduct.product_code}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">اسم المنتج</p>
                  <p className="font-semibold">{selectedProduct.product_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">التصنيف</p>
                  <p className="font-semibold">{selectedProduct.category || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الوحدة</p>
                  <p className="font-semibold">{selectedProduct.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">سعر التكلفة</p>
                  <p className="font-semibold text-blue-600">{selectedProduct.cost_price.toFixed(2)} ر.س</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">سعر البيع</p>
                  <p className="font-semibold text-green-600">{selectedProduct.selling_price.toFixed(2)} ر.س</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">المخزون الحالي</p>
                  <p className="font-semibold">{selectedProduct.current_stock}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">نقطة إعادة الطلب</p>
                  <p className="font-semibold">{selectedProduct.reorder_point}</p>
                </div>
              </div>
              {selectedProduct.description && (
                <div>
                  <p className="text-sm text-muted-foreground">الوصف</p>
                  <p className="mt-1">{selectedProduct.description}</p>
                </div>
              )}
              {selectedProduct.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">ملاحظات</p>
                  <p className="mt-1">{selectedProduct.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={costDialogOpen} onOpenChange={setCostDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-right">إضافة تكاليف إضافية</DialogTitle>
            <DialogDescription className="text-base text-right">
              أضف تكاليف الشحن والتكاليف الإضافية للمنتج
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4" dir="rtl">
            <div className="space-y-2">
              <Label htmlFor="shipping_cost" className="text-right block">تكلفة الشحن (ر.س)</Label>
              <Input
                id="shipping_cost"
                type="number"
                step="0.01"
                min="0"
                value={costFormData.shipping_cost}
                onChange={(e) => setCostFormData({ ...costFormData, shipping_cost: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="additional_costs" className="text-right block">تكاليف إضافية (ر.س)</Label>
              <Input
                id="additional_costs"
                type="number"
                step="0.01"
                min="0"
                value={costFormData.additional_costs}
                onChange={(e) => setCostFormData({ ...costFormData, additional_costs: e.target.value })}
                placeholder="0.00"
              />
            </div>
            {selectedProduct && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">سعر التكلفة الأساسي:</span>
                  <span className="font-semibold">{selectedProduct.cost_price.toFixed(2)} ر.س</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">تكلفة الشحن:</span>
                  <span className="font-semibold">{parseFloat(costFormData.shipping_cost || '0').toFixed(2)} ر.س</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">تكاليف إضافية:</span>
                  <span className="font-semibold">{parseFloat(costFormData.additional_costs || '0').toFixed(2)} ر.س</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-semibold">إجمالي التكلفة:</span>
                  <span className="font-bold text-blue-600">
                    {(selectedProduct.cost_price + parseFloat(costFormData.shipping_cost || '0') + parseFloat(costFormData.additional_costs || '0')).toFixed(2)} ر.س
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCostDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={() =>
                selectedProduct && updateCostsMutation.mutate({ id: selectedProduct.id, costs: costFormData })
              }
              disabled={updateCostsMutation.isPending}
            >
              {updateCostsMutation.isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                'حفظ التكاليف'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => productToDelete && deleteProductMutation.mutate(productToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteProductMutation.isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الحذف...
                </>
              ) : (
                'حذف'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductsCosts;
