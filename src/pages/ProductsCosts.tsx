import { Package, Plus, Search, Eye, Pencil, Trash2, Loader2, AlertCircle } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Badge } from "@/components/ui/badge";
import { ProductForm, ProductFormData } from "@/components/products/ProductForm";

interface Product {
  id: string;
  product_code: string;
  product_name: string;
  description: string | null;
  category: string | null;
  unit: string | null;
  cost_price: number;
  selling_price: number;
  tax_rate: number;
  min_stock_level: number;
  max_stock_level: number;
  current_stock: number;
  reorder_point: number;
  status: string;
  created_at: string;
}

const getUnitLabel = (unit: string | null) => {
  const unitMap: Record<string, string> = {
    'piece': 'قطعة',
    'box': 'صندوق',
    'carton': 'كرتون',
    'kg': 'كيلوغرام',
    'gram': 'جرام',
    'liter': 'لتر',
    'meter': 'متر',
    'pack': 'باكو',
  };
  return unitMap[unit || 'piece'] || unit || '-';
};

export default function ProductsCosts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const initialFormData: ProductFormData = {
    product_name: "",
    description: "",
    category: "",
    unit: "piece",
    cost_price: "",
    selling_price: "",
    tax_rate: "15",
    min_stock_level: "5",
    max_stock_level: "1000",
    current_stock: "0",
    reorder_point: "10",
    shipping_cost: "0",
    additional_costs: "0",
  };

  const [formData, setFormData] = useState<ProductFormData>(initialFormData);

  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    mutationFn: async (data: ProductFormData) => {
      if (!data.product_name || !data.cost_price || !data.selling_price) {
        throw new Error("الرجاء ملء جميع الحقول المطلوبة");
      }

      const productCode = `P-${Date.now()}`;

      const { data: product, error } = await supabase
        .from("products")
        .insert({
          product_code: productCode,
          product_name: data.product_name,
          description: data.description || null,
          category: data.category || null,
          unit: data.unit || "piece",
          cost_price: parseFloat(data.cost_price),
          selling_price: parseFloat(data.selling_price),
          tax_rate: parseFloat(data.tax_rate) || 15,
          min_stock_level: parseFloat(data.min_stock_level) || 0,
          max_stock_level: parseFloat(data.max_stock_level) || 1000,
          current_stock: parseFloat(data.current_stock) || 0,
          reorder_point: parseFloat(data.reorder_point) || 10,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;
      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setAddDialogOpen(false);
      setFormData(initialFormData);
      toast({
        title: "تم بنجاح",
        description: "تم إضافة المنتج بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إضافة المنتج",
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      if (!selectedProduct || !data.product_name || !data.cost_price || !data.selling_price) {
        throw new Error("الرجاء ملء جميع الحقول المطلوبة");
      }

      const { error } = await supabase
        .from("products")
        .update({
          product_name: data.product_name,
          description: data.description || null,
          category: data.category || null,
          unit: data.unit || "piece",
          cost_price: parseFloat(data.cost_price),
          selling_price: parseFloat(data.selling_price),
          tax_rate: parseFloat(data.tax_rate) || 15,
          min_stock_level: parseFloat(data.min_stock_level) || 0,
          max_stock_level: parseFloat(data.max_stock_level) || 1000,
          current_stock: parseFloat(data.current_stock) || 0,
          reorder_point: parseFloat(data.reorder_point) || 10,
        })
        .eq("id", selectedProduct.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setEditDialogOpen(false);
      setSelectedProduct(null);
      setFormData(initialFormData);
      toast({
        title: "تم بنجاح",
        description: "تم تحديث المنتج بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء تحديث المنتج",
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setDeleteDialogOpen(false);
      setSelectedProduct(null);
      toast({
        title: "تم بنجاح",
        description: "تم حذف المنتج بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء حذف المنتج",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      product_name: product.product_name,
      description: product.description || "",
      category: product.category || "",
      unit: product.unit || "piece",
      cost_price: product.cost_price.toString(),
      selling_price: product.selling_price.toString(),
      tax_rate: product.tax_rate.toString(),
      min_stock_level: product.min_stock_level.toString(),
      max_stock_level: product.max_stock_level.toString(),
      current_stock: product.current_stock.toString(),
      reorder_point: product.reorder_point.toString(),
      shipping_cost: "0",
      additional_costs: "0",
    });
    setEditDialogOpen(true);
  };

  const handleView = (product: Product) => {
    setSelectedProduct(product);
    setViewDialogOpen(true);
  };

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  const filteredProducts = products.filter((product) =>
    product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.product_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 md:h-8 md:w-8" />
            إدارة المنتجات
          </h1>
          <p className="text-muted-foreground mt-1">
            إدارة المنتجات والمخزون بسهولة
          </p>
        </div>
        <Button
          onClick={() => {
            setFormData(initialFormData);
            setAddDialogOpen(true);
          }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          size="lg"
        >
          <Plus className="ml-2 h-5 w-5" />
          إضافة منتج جديد
        </Button>
      </div>

      <Card className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="ابحث عن منتج..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
              dir="rtl"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center p-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold">لا توجد منتجات</p>
            <p className="text-sm mt-2">قم بإضافة منتج جديد للبدء</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">اسم المنتج</TableHead>
                  <TableHead className="text-right hidden md:table-cell">التصنيف</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">الوحدة</TableHead>
                  <TableHead className="text-right">سعر التكلفة</TableHead>
                  <TableHead className="text-right">سعر البيع</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">الضريبة %</TableHead>
                  <TableHead className="text-right hidden md:table-cell">المخزون</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{product.product_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {product.product_code}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">{product.category || "-"}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{getUnitLabel(product.unit)}</TableCell>
                    <TableCell>{product.cost_price.toFixed(2)} ر.س</TableCell>
                    <TableCell>{product.selling_price.toFixed(2)} ر.س</TableCell>
                    <TableCell className="hidden lg:table-cell">{product.tax_rate}%</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge
                        variant={
                          product.current_stock <= product.reorder_point
                            ? "destructive"
                            : "default"
                        }
                      >
                        {product.current_stock}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(product)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(product)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-right">إضافة منتج جديد</DialogTitle>
            <DialogDescription className="text-right">
              قم بملء جميع الحقول المطلوبة لإضافة منتج جديد
            </DialogDescription>
          </DialogHeader>
          <ProductForm formData={formData} onChange={setFormData} />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={() => addProductMutation.mutate(formData)}
              disabled={addProductMutation.isPending || !formData.product_name}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
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

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-right">تعديل المنتج</DialogTitle>
            <DialogDescription className="text-right">
              قم بتعديل البيانات المطلوبة
            </DialogDescription>
          </DialogHeader>
          <ProductForm formData={formData} onChange={setFormData} />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={() => updateProductMutation.mutate(formData)}
              disabled={updateProductMutation.isPending || !formData.product_name}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {updateProductMutation.isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                "حفظ التعديلات"
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">اسم المنتج</p>
                  <p className="font-semibold">{selectedProduct.product_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">رمز المنتج</p>
                  <p className="font-semibold">{selectedProduct.product_code}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">التصنيف</p>
                  <p className="font-semibold">{selectedProduct.category || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الوحدة</p>
                  <p className="font-semibold">{getUnitLabel(selectedProduct.unit)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">سعر التكلفة</p>
                  <p className="font-semibold">{selectedProduct.cost_price.toFixed(2)} ر.س</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">سعر البيع</p>
                  <p className="font-semibold">{selectedProduct.selling_price.toFixed(2)} ر.س</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">نسبة الضريبة</p>
                  <p className="font-semibold">{selectedProduct.tax_rate}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">المخزون الحالي</p>
                  <p className="font-semibold">{selectedProduct.current_stock}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الحد الأدنى</p>
                  <p className="font-semibold">{selectedProduct.min_stock_level}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الحد الأقصى</p>
                  <p className="font-semibold">{selectedProduct.max_stock_level}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">نقطة إعادة الطلب</p>
                  <p className="font-semibold">{selectedProduct.reorder_point}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الحالة</p>
                  <Badge>{selectedProduct.status}</Badge>
                </div>
              </div>
              {selectedProduct.description && (
                <div>
                  <p className="text-sm text-muted-foreground">الوصف</p>
                  <p className="font-semibold">{selectedProduct.description}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              تأكيد الحذف
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              هل أنت متأكد من حذف المنتج "{selectedProduct?.product_name}"؟
              <br />
              <span className="font-semibold text-destructive">
                لا يمكن التراجع عن هذا الإجراء!
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedProduct && deleteProductMutation.mutate(selectedProduct.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProductMutation.isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الحذف...
                </>
              ) : (
                "حذف"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
