import { useState, useEffect } from "react";
import { Factory, Plus, CreditCard as Edit, Trash2, Package, Download, Upload, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { EmptyTableMessage } from "@/components/EmptyTableMessage";
import { format } from "date-fns";

interface ManufacturingOrder {
  id: string;
  order_number: string;
  product_id: string;
  quantity: number;
  start_date: string;
  expected_completion_date: string;
  actual_completion_date: string | null;
  status: string;
  priority: string;
  raw_materials: any[];
  production_cost: number;
  notes: string | null;
  created_at: string;
  products?: { product_name: string; product_code: string };
}

interface Product {
  id: string;
  product_name: string;
  product_code: string;
}

interface RawMaterial {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  cost: number;
}

const ManufacturingOrders = () => {
  const [orders, setOrders] = useState<ManufacturingOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ManufacturingOrder | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    product_id: "",
    quantity: "",
    start_date: new Date().toISOString().split('T')[0],
    expected_completion_date: "",
    status: "pending",
    priority: "medium",
    notes: "",
  });

  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500 hover:bg-yellow-600",
    in_progress: "bg-blue-500 hover:bg-blue-600",
    completed: "bg-green-500 hover:bg-green-600",
    cancelled: "bg-red-500 hover:bg-red-600",
    on_hold: "bg-gray-500 hover:bg-gray-600",
  };

  const statusLabels: Record<string, string> = {
    pending: "قيد الانتظار",
    in_progress: "قيد التنفيذ",
    completed: "مكتمل",
    cancelled: "ملغي",
    on_hold: "معلق",
  };

  const priorityColors: Record<string, string> = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    urgent: "bg-red-100 text-red-800",
  };

  const priorityLabels: Record<string, string> = {
    low: "منخفضة",
    medium: "متوسطة",
    high: "عالية",
    urgent: "عاجلة",
  };

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("manufacturing_orders")
        .select(`
          *,
          products (product_name, product_code)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
      setHasError(false);
    } catch (error: any) {
      console.error('Error loading manufacturing orders:', error);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, product_name, product_code")
        .eq("status", "active")
        .order("product_name");

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error('Error loading products:', error);
    }
  };

  const generateOrderNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `MO-${timestamp}`;
  };

  const handleAddRawMaterial = () => {
    setRawMaterials([
      ...rawMaterials,
      { id: crypto.randomUUID(), name: "", quantity: 0, unit: "قطعة", cost: 0 },
    ]);
  };

  const handleRemoveRawMaterial = (id: string) => {
    setRawMaterials(rawMaterials.filter((m) => m.id !== id));
  };

  const handleRawMaterialChange = (id: string, field: string, value: any) => {
    setRawMaterials(
      rawMaterials.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const calculateProductionCost = () => {
    return rawMaterials.reduce((total, material) => {
      return total + (material.quantity * material.cost);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.product_id || !formData.quantity || !formData.expected_completion_date) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const quantity = parseFloat(formData.quantity);
    if (quantity <= 0) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال كمية صحيحة أكبر من صفر",
        variant: "destructive",
      });
      return;
    }

    try {
      const productionCost = calculateProductionCost();

      const orderData = {
        order_number: isEditing ? selectedOrder?.order_number : generateOrderNumber(),
        product_id: formData.product_id,
        quantity: quantity,
        start_date: formData.start_date,
        expected_completion_date: formData.expected_completion_date,
        status: formData.status,
        priority: formData.priority,
        raw_materials: rawMaterials,
        production_cost: productionCost,
        notes: formData.notes || null,
        user_id: (await supabase.auth.getUser()).data.user?.id,
      };

      let error;
      if (isEditing && selectedOrder) {
        const result = await supabase
          .from("manufacturing_orders")
          .update(orderData)
          .eq("id", selectedOrder.id);
        error = result.error;
      } else {
        const result = await supabase
          .from("manufacturing_orders")
          .insert([orderData]);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: isEditing ? "تم تحديث أمر التصنيع" : "تم إضافة أمر تصنيع جديد",
      });

      setDialogOpen(false);
      resetForm();
      fetchOrders();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف أمر التصنيع؟")) return;

    try {
      const { error } = await supabase
        .from("manufacturing_orders")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف أمر التصنيع بنجاح",
      });

      fetchOrders();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (order: ManufacturingOrder) => {
    setSelectedOrder(order);
    setIsEditing(true);
    setFormData({
      product_id: order.product_id,
      quantity: order.quantity.toString(),
      start_date: order.start_date,
      expected_completion_date: order.expected_completion_date,
      status: order.status,
      priority: order.priority,
      notes: order.notes || "",
    });
    setRawMaterials(order.raw_materials || []);
    setDialogOpen(true);
  };

  const handleView = (order: ManufacturingOrder) => {
    setSelectedOrder(order);
    setViewDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      product_id: "",
      quantity: "",
      start_date: new Date().toISOString().split('T')[0],
      expected_completion_date: "",
      status: "pending",
      priority: "medium",
      notes: "",
    });
    setRawMaterials([]);
    setIsEditing(false);
    setSelectedOrder(null);
  };

  const handleExport = () => {
    if (orders.length === 0) {
      toast({
        title: "تنبيه",
        description: "لا توجد بيانات للتصدير",
        variant: "destructive",
      });
      return;
    }

    const exportData = orders.map(o => ({
      order_number: o.order_number,
      product_name: o.products?.product_name || '',
      product_code: o.products?.product_code || '',
      quantity: o.quantity,
      start_date: o.start_date,
      expected_completion_date: o.expected_completion_date,
      status: statusLabels[o.status],
      priority: priorityLabels[o.priority],
      production_cost: o.production_cost
    }));

    const csv = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manufacturing_orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    toast({
      title: "قريباً",
      description: "سيتم إضافة وظيفة الاستيراد قريباً",
    });
  };

  if (hasError) {
    return <EmptyTableMessage title="أوامر التصنيع" description="هذه الميزة قيد التطوير. سيتم إضافة جدول أوامر التصنيع قريباً." />;
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-64 w-full bg-muted animate-pulse rounded" />
      </div>
    );
  }

  const filteredOrders = orders.filter((order) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      order.order_number.toLowerCase().includes(searchLower) ||
      order.products?.product_name.toLowerCase().includes(searchLower) ||
      order.products?.product_code.toLowerCase().includes(searchLower)
    );
  });

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const inProgressOrders = orders.filter(o => o.status === "in_progress").length;
  const completedOrders = orders.filter(o => o.status === "completed").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-indigo-50/30">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Factory className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">أوامر التصنيع</h1>
              <p className="text-gray-600 mt-1">إدارة أوامر التصنيع والإنتاج</p>
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
            <Button onClick={() => { resetForm(); setDialogOpen(true); }} size="lg" className="h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all">
              <Plus className="ml-2 h-5 w-5" />
              أمر تصنيع جديد
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">إجمالي الأوامر</p>
                  <p className="text-4xl font-bold text-gray-900 mt-2">{totalOrders}</p>
                  <p className="text-xs text-gray-500 mt-1">أمر تصنيع</p>
                </div>
                <div className="h-16 w-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
                  <Factory className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">قيد الانتظار</p>
                  <p className="text-4xl font-bold text-yellow-600 mt-2">{pendingOrders}</p>
                  <p className="text-xs text-gray-500 mt-1">أمر منتظر</p>
                </div>
                <div className="h-16 w-16 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl flex items-center justify-center">
                  <Package className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">قيد التنفيذ</p>
                  <p className="text-4xl font-bold text-blue-600 mt-2">{inProgressOrders}</p>
                  <p className="text-xs text-gray-500 mt-1">أمر قيد التنفيذ</p>
                </div>
                <div className="h-16 w-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
                  <Factory className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">مكتملة</p>
                  <p className="text-4xl font-bold text-green-600 mt-2">{completedOrders}</p>
                  <p className="text-xs text-gray-500 mt-1">أمر مكتمل</p>
                </div>
                <div className="h-16 w-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center">
                  <Package className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-lg bg-white">
          <CardHeader>
            <Input
              placeholder="بحث برقم الأمر أو اسم المنتج أو الكود..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">جاري التحميل...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد أوامر تصنيع
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الأمر</TableHead>
                      <TableHead>المنتج</TableHead>
                      <TableHead>الكمية</TableHead>
                      <TableHead>تاريخ البدء</TableHead>
                      <TableHead>الانتهاء المتوقع</TableHead>
                      <TableHead>الأولوية</TableHead>
                      <TableHead>التكلفة</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-left">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono font-medium">
                          {order.order_number}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.products?.product_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {order.products?.product_code}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold">{order.quantity}</TableCell>
                        <TableCell>{format(new Date(order.start_date), "yyyy-MM-dd")}</TableCell>
                        <TableCell>
                          {format(new Date(order.expected_completion_date), "yyyy-MM-dd")}
                        </TableCell>
                        <TableCell>
                          <Badge className={priorityColors[order.priority]}>
                            {priorityLabels[order.priority]}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold">
                          {order.production_cost.toFixed(2)} ر.س
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[order.status]}>
                            {statusLabels[order.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleView(order)}
                              className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(order)}
                              className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(order.id)}
                              className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "تعديل أمر التصنيع" : "أمر تصنيع جديد"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>المنتج *</Label>
                  <Select
                    value={formData.product_id}
                    onValueChange={(value) => setFormData({ ...formData, product_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المنتج" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.product_name} - {product.product_code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>الكمية *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="0"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>تاريخ البدء *</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>تاريخ الانتهاء المتوقع *</Label>
                  <Input
                    type="date"
                    value={formData.expected_completion_date}
                    onChange={(e) => setFormData({ ...formData, expected_completion_date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>الحالة *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">قيد الانتظار</SelectItem>
                      <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                      <SelectItem value="completed">مكتمل</SelectItem>
                      <SelectItem value="on_hold">معلق</SelectItem>
                      <SelectItem value="cancelled">ملغي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>الأولوية *</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">منخفضة</SelectItem>
                      <SelectItem value="medium">متوسطة</SelectItem>
                      <SelectItem value="high">عالية</SelectItem>
                      <SelectItem value="urgent">عاجلة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>المواد الخام</Label>
                  <Button type="button" onClick={handleAddRawMaterial} size="sm" variant="outline">
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة مادة
                  </Button>
                </div>

                {rawMaterials.map((material) => (
                  <div key={material.id} className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded-lg">
                    <div className="col-span-4">
                      <Label className="text-xs">اسم المادة</Label>
                      <Input
                        placeholder="اسم المادة"
                        value={material.name}
                        onChange={(e) =>
                          handleRawMaterialChange(material.id, "name", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">الكمية</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={material.quantity || ""}
                        onChange={(e) =>
                          handleRawMaterialChange(material.id, "quantity", parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">الوحدة</Label>
                      <Input
                        placeholder="قطعة"
                        value={material.unit}
                        onChange={(e) =>
                          handleRawMaterialChange(material.id, "unit", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs">التكلفة</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={material.cost || ""}
                        onChange={(e) =>
                          handleRawMaterialChange(material.id, "cost", parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveRawMaterial(material.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {rawMaterials.length > 0 && (
                  <div className="flex justify-end mt-2 p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-900">
                      إجمالي التكلفة: {calculateProductionCost().toFixed(2)} ر.س
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>ملاحظات</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="أضف ملاحظات إضافية..."
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">
                  {isEditing ? "تحديث" : "إضافة"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>تفاصيل أمر التصنيع</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                  <div>
                    <Label className="text-muted-foreground text-xs">رقم الأمر</Label>
                    <p className="font-bold text-lg">{selectedOrder.order_number}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">المنتج</Label>
                    <p className="font-medium">{selectedOrder.products?.product_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.products?.product_code}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">الكمية</Label>
                    <p className="font-bold text-xl">{selectedOrder.quantity}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">الحالة</Label>
                    <div className="mt-1">
                      <Badge className={statusColors[selectedOrder.status]}>
                        {statusLabels[selectedOrder.status]}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">الأولوية</Label>
                    <div className="mt-1">
                      <Badge className={priorityColors[selectedOrder.priority]}>
                        {priorityLabels[selectedOrder.priority]}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">تكلفة الإنتاج</Label>
                    <p className="font-bold text-xl text-blue-600">
                      {selectedOrder.production_cost.toFixed(2)} ر.س
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">تاريخ البدء</Label>
                    <p>{format(new Date(selectedOrder.start_date), "yyyy-MM-dd")}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">الانتهاء المتوقع</Label>
                    <p>{format(new Date(selectedOrder.expected_completion_date), "yyyy-MM-dd")}</p>
                  </div>
                  {selectedOrder.actual_completion_date && (
                    <div className="col-span-2">
                      <Label className="text-muted-foreground text-xs">تاريخ الانتهاء الفعلي</Label>
                      <p className="font-medium text-green-600">
                        {format(new Date(selectedOrder.actual_completion_date), "yyyy-MM-dd")}
                      </p>
                    </div>
                  )}
                </div>

                {selectedOrder.raw_materials && selectedOrder.raw_materials.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">المواد الخام</Label>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>المادة</TableHead>
                            <TableHead>الكمية</TableHead>
                            <TableHead>الوحدة</TableHead>
                            <TableHead>التكلفة</TableHead>
                            <TableHead>الإجمالي</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedOrder.raw_materials.map((material: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{material.name}</TableCell>
                              <TableCell>{material.quantity}</TableCell>
                              <TableCell>{material.unit}</TableCell>
                              <TableCell>{material.cost.toFixed(2)} ر.س</TableCell>
                              <TableCell className="font-bold">
                                {(material.quantity * material.cost).toFixed(2)} ر.س
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {selectedOrder.notes && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">ملاحظات</Label>
                    <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                      {selectedOrder.notes}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={() => setViewDialogOpen(false)}>
                    إغلاق
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ManufacturingOrders;
