import { useState, useEffect } from "react";
import { Factory, Plus, CreditCard as Edit, Trash2, Eye, Package } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
  products?: { name: string; product_code: string };
}

interface Product {
  id: string;
  name: string;
  product_code: string;
  selling_price: number;
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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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
    priority: "medium",
    notes: "",
  });

  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500",
    in_progress: "bg-blue-500",
    completed: "bg-green-500",
    cancelled: "bg-red-500",
    on_hold: "bg-gray-500",
  };

  const statusLabels: Record<string, string> = {
    pending: "قيد الانتظار",
    in_progress: "قيد التنفيذ",
    completed: "مكتمل",
    cancelled: "ملغي",
    on_hold: "معلق",
  };

  const priorityColors: Record<string, string> = {
    low: "bg-green-500",
    medium: "bg-yellow-500",
    high: "bg-orange-500",
    urgent: "bg-red-500",
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
          products (name, product_code)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل أوامر التصنيع",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, name, product_code, selling_price")
      .eq("is_active", true)
      .order("name");
    setProducts(data || []);
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
        description: "يرجى إدخال كمية صحيحة",
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
        status: isEditing ? selectedOrder?.status : "pending",
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

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };

      if (newStatus === "completed") {
        updateData.actual_completion_date = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from("manufacturing_orders")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة أمر التصنيع بنجاح",
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

  const resetForm = () => {
    setFormData({
      product_id: "",
      quantity: "",
      start_date: new Date().toISOString().split('T')[0],
      expected_completion_date: "",
      priority: "medium",
      notes: "",
    });
    setRawMaterials([]);
    setIsEditing(false);
    setSelectedOrder(null);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.products?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.products?.product_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const inProgressOrders = orders.filter(o => o.status === "in_progress").length;
  const completedOrders = orders.filter(o => o.status === "completed").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Factory className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">أوامر التصنيع</h1>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="ml-2 h-4 w-4" />
          أمر تصنيع جديد
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الأوامر</p>
                <p className="text-3xl font-bold">{totalOrders}</p>
              </div>
              <Factory className="h-12 w-12 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">قيد الانتظار</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingOrders}</p>
              </div>
              <Package className="h-12 w-12 text-yellow-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">قيد التنفيذ</p>
                <p className="text-3xl font-bold text-blue-600">{inProgressOrders}</p>
              </div>
              <Factory className="h-12 w-12 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">مكتملة</p>
                <p className="text-3xl font-bold text-green-600">{completedOrders}</p>
              </div>
              <Package className="h-12 w-12 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="بحث برقم الأمر أو اسم المنتج أو الكود..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="تصفية حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="pending">قيد الانتظار</SelectItem>
                <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                <SelectItem value="completed">مكتمل</SelectItem>
                <SelectItem value="on_hold">معلق</SelectItem>
                <SelectItem value="cancelled">ملغي</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.products?.name}</div>
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
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleStatusChange(order.id, value)}
                        >
                          <SelectTrigger className="w-36">
                            <Badge className={statusColors[order.status]}>
                              {statusLabels[order.status]}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">قيد الانتظار</SelectItem>
                            <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                            <SelectItem value="completed">مكتمل</SelectItem>
                            <SelectItem value="on_hold">معلق</SelectItem>
                            <SelectItem value="cancelled">ملغي</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleView(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(order)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(order.id)}
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
                        {product.name} - {product.product_code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>الكمية *</Label>
                <Input
                  type="number"
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
                <Button type="button" onClick={handleAddRawMaterial} size="sm">
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة مادة
                </Button>
              </div>

              {rawMaterials.map((material, index) => (
                <div key={material.id} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    <Input
                      placeholder="اسم المادة"
                      value={material.name}
                      onChange={(e) =>
                        handleRawMaterialChange(material.id, "name", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="الكمية"
                      value={material.quantity || ""}
                      onChange={(e) =>
                        handleRawMaterialChange(material.id, "quantity", parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      placeholder="الوحدة"
                      value={material.unit}
                      onChange={(e) =>
                        handleRawMaterialChange(material.id, "unit", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="التكلفة"
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
                <div className="flex justify-end mt-2">
                  <div className="text-lg font-bold">
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
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <Label className="text-muted-foreground">رقم الأمر</Label>
                  <p className="font-bold text-lg">{selectedOrder.order_number}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">المنتج</Label>
                  <p className="font-medium">{selectedOrder.products?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrder.products?.product_code}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">الكمية</Label>
                  <p className="font-bold text-xl">{selectedOrder.quantity}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">الحالة</Label>
                  <div className="mt-1">
                    <Badge className={statusColors[selectedOrder.status]}>
                      {statusLabels[selectedOrder.status]}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">الأولوية</Label>
                  <div className="mt-1">
                    <Badge className={priorityColors[selectedOrder.priority]}>
                      {priorityLabels[selectedOrder.priority]}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">تكلفة الإنتاج</Label>
                  <p className="font-bold text-xl text-primary">
                    {selectedOrder.production_cost.toFixed(2)} ر.س
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">تاريخ البدء</Label>
                  <p>{format(new Date(selectedOrder.start_date), "yyyy-MM-dd")}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">الانتهاء المتوقع</Label>
                  <p>{format(new Date(selectedOrder.expected_completion_date), "yyyy-MM-dd")}</p>
                </div>
                {selectedOrder.actual_completion_date && (
                  <div>
                    <Label className="text-muted-foreground">تاريخ الانتهاء الفعلي</Label>
                    <p className="font-medium">
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
  );
};

export default ManufacturingOrders;
