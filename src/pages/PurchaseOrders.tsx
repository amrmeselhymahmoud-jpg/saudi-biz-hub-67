import { useState, useEffect } from "react";
import { ClipboardList, Plus, Eye, CreditCard as Edit, Trash2, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { exportToCSV } from "@/utils/exportImport";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PurchaseOrder {
  id: string;
  order_number: string;
  supplier_id: string;
  order_date: string;
  delivery_date: string | null;
  status: string;
  items: any[];
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  notes: string | null;
  suppliers?: { name: string };
}

interface Supplier {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  cost_price: number;
  tax_rate: number;
}

const PurchaseOrders = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    supplier_id: "",
    order_date: new Date().toISOString().split('T')[0],
    delivery_date: "",
    notes: "",
  });

  const [orderItems, setOrderItems] = useState<any[]>([
    { product_id: "", product_name: "", quantity: 1, unit_price: 0, tax_rate: 15, total: 0 }
  ]);

  const statusColors: Record<string, string> = {
    draft: "bg-gray-500",
    sent: "bg-blue-500",
    received: "bg-green-500",
    cancelled: "bg-red-500",
  };

  const statusLabels: Record<string, string> = {
    draft: "مسودة",
    sent: "تم الإرسال",
    received: "تم الاستلام",
    cancelled: "ملغي",
  };

  useEffect(() => {
    // Initialize demo data if not exists
    initializeDemoData();
    fetchOrders();
    fetchSuppliers();
    fetchProducts();
  }, []);

  const initializeDemoData = () => {
    // Initialize demo suppliers if not exists
    const storedSuppliers = localStorage.getItem('demo_suppliers');
    if (!storedSuppliers) {
      const demoSuppliers = [
        { id: 'sup_1', name: 'شركة التوريدات المتقدمة' },
        { id: 'sup_2', name: 'مؤسسة الإمداد التجاري' },
        { id: 'sup_3', name: 'شركة النجاح للتوريد' },
      ];
      localStorage.setItem('demo_suppliers', JSON.stringify(demoSuppliers));
    }

    // Initialize demo products if not exists
    const storedProducts = localStorage.getItem('demo_products');
    if (!storedProducts) {
      const demoProducts = [
        { id: 'prod_1', name: 'منتج أ', cost_price: 100, tax_rate: 15 },
        { id: 'prod_2', name: 'منتج ب', cost_price: 200, tax_rate: 15 },
        { id: 'prod_3', name: 'منتج ج', cost_price: 150, tax_rate: 15 },
      ];
      localStorage.setItem('demo_products', JSON.stringify(demoProducts));
    }

    // Initialize demo purchase orders if not exists
    const storedOrders = localStorage.getItem('demo_purchase_orders');
    if (!storedOrders) {
      const demoOrders = [
        {
          id: 'po_1',
          order_number: 'PO-100001',
          supplier_id: 'sup_1',
          order_date: new Date().toISOString().split('T')[0],
          delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'draft',
          items: [
            { product_id: 'prod_1', product_name: 'منتج أ', quantity: 5, unit_price: 100, tax_rate: 15, total: 575 }
          ],
          subtotal: 500,
          tax_amount: 75,
          total_amount: 575,
          notes: 'أمر شراء تجريبي',
          suppliers: { name: 'شركة التوريدات المتقدمة' },
          created_at: new Date().toISOString(),
        },
        {
          id: 'po_2',
          order_number: 'PO-100002',
          supplier_id: 'sup_2',
          order_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          delivery_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'sent',
          items: [
            { product_id: 'prod_2', product_name: 'منتج ب', quantity: 10, unit_price: 200, tax_rate: 15, total: 2300 }
          ],
          subtotal: 2000,
          tax_amount: 300,
          total_amount: 2300,
          notes: null,
          suppliers: { name: 'مؤسسة الإمداد التجاري' },
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
      localStorage.setItem('demo_purchase_orders', JSON.stringify(demoOrders));
    }
  };

  const fetchOrders = async () => {
    try {
      // Demo mode: load from localStorage
      const storedOrders = localStorage.getItem('demo_purchase_orders');
      if (storedOrders) {
        setOrders(JSON.parse(storedOrders));
      } else {
        setOrders([]);
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل أوامر الشراء",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    // Demo mode: load from localStorage
    const storedSuppliers = localStorage.getItem('demo_suppliers');
    if (storedSuppliers) {
      const suppliers = JSON.parse(storedSuppliers);
      setSuppliers(suppliers);
    } else {
      setSuppliers([]);
    }
  };

  const fetchProducts = async () => {
    // Demo mode: load from localStorage
    const storedProducts = localStorage.getItem('demo_products');
    if (storedProducts) {
      const products = JSON.parse(storedProducts);
      setProducts(products);
    } else {
      setProducts([]);
    }
  };

  const generateOrderNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `PO-${timestamp}`;
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let taxTotal = 0;

    orderItems.forEach(item => {
      if (item.product_id && item.quantity > 0 && item.unit_price > 0) {
        const itemSubtotal = item.quantity * item.unit_price;
        const itemTax = (itemSubtotal * item.tax_rate) / 100;
        subtotal += itemSubtotal;
        taxTotal += itemTax;
      }
    });

    return {
      subtotal: subtotal.toFixed(2),
      tax: taxTotal.toFixed(2),
      total: (subtotal + taxTotal).toFixed(2),
    };
  };

  const handleAddItem = () => {
    setOrderItems([
      ...orderItems,
      { product_id: "", product_name: "", quantity: 1, unit_price: 0, tax_rate: 15, total: 0 }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...orderItems];
    updatedItems[index][field] = value;

    if (field === "product_id") {
      const product = products.find(p => p.id === value);
      if (product) {
        updatedItems[index].product_name = product.name;
        updatedItems[index].unit_price = product.cost_price;
        updatedItems[index].tax_rate = product.tax_rate;
      }
    }

    if (field === "quantity" || field === "unit_price" || field === "tax_rate") {
      const qty = parseFloat(updatedItems[index].quantity) || 0;
      const price = parseFloat(updatedItems[index].unit_price) || 0;
      const tax = parseFloat(updatedItems[index].tax_rate) || 0;
      const itemSubtotal = qty * price;
      updatedItems[index].total = itemSubtotal + (itemSubtotal * tax / 100);
    }

    setOrderItems(updatedItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.supplier_id) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار المورد",
        variant: "destructive",
      });
      return;
    }

    const validItems = orderItems.filter(item => item.product_id && item.quantity > 0);
    if (validItems.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى إضافة منتج واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    const totals = calculateTotals();

    try {
      // Find supplier name
      const supplier = suppliers.find(s => s.id === formData.supplier_id);

      const orderData = {
        id: isEditing ? selectedOrder?.id : 'po_' + Date.now(),
        order_number: isEditing ? selectedOrder?.order_number : generateOrderNumber(),
        supplier_id: formData.supplier_id,
        order_date: formData.order_date,
        delivery_date: formData.delivery_date || null,
        status: "draft",
        items: validItems,
        subtotal: parseFloat(totals.subtotal),
        tax_amount: parseFloat(totals.tax),
        total_amount: parseFloat(totals.total),
        notes: formData.notes || null,
        suppliers: { name: supplier?.name || '' },
        created_at: isEditing ? selectedOrder?.created_at : new Date().toISOString(),
      };

      // Demo mode: save to localStorage
      const storedOrders = localStorage.getItem('demo_purchase_orders');
      let ordersArray = storedOrders ? JSON.parse(storedOrders) : [];

      if (isEditing && selectedOrder) {
        ordersArray = ordersArray.map((order: PurchaseOrder) =>
          order.id === selectedOrder.id ? orderData : order
        );
      } else {
        ordersArray.unshift(orderData);
      }

      localStorage.setItem('demo_purchase_orders', JSON.stringify(ordersArray));

      toast({
        title: "تم بنجاح",
        description: isEditing ? "تم تحديث أمر الشراء" : "تم إضافة أمر شراء جديد",
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
    if (!confirm("هل أنت متأكد من حذف أمر الشراء؟")) return;

    try {
      // Demo mode: delete from localStorage
      const storedOrders = localStorage.getItem('demo_purchase_orders');
      if (storedOrders) {
        const ordersArray = JSON.parse(storedOrders);
        const updatedOrders = ordersArray.filter((order: PurchaseOrder) => order.id !== id);
        localStorage.setItem('demo_purchase_orders', JSON.stringify(updatedOrders));
      }

      toast({
        title: "تم الحذف",
        description: "تم حذف أمر الشراء بنجاح",
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

  const handleExport = async (exportFormat: 'csv' | 'pdf') => {
    if (filteredOrders.length === 0) {
      toast({
        title: "تنبيه",
        description: "لا توجد بيانات للتصدير",
        variant: "destructive",
      });
      return;
    }

    if (exportFormat === 'csv') {
      const exportData = filteredOrders.map(order => ({
        'رقم الأمر': order.order_number,
        'المورد': order.suppliers?.name,
        'تاريخ الأمر': format(new Date(order.order_date), "yyyy-MM-dd"),
        'تاريخ التسليم': order.delivery_date ? format(new Date(order.delivery_date), "yyyy-MM-dd") : '-',
        'الحالة': statusLabels[order.status],
        'المبلغ الفرعي': order.subtotal,
        'الضريبة': order.tax_amount,
        'الإجمالي': order.total_amount,
        'الملاحظات': order.notes || '-'
      }));
      exportToCSV(exportData, 'purchase_orders');
    } else if (exportFormat === 'pdf') {
      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text("Purchase Orders / Awamer Al-Shera", 105, 15, { align: "center" });

      const tableData = filteredOrders.map(order => [
        order.order_number,
        order.suppliers?.name || '',
        format(new Date(order.order_date), "yyyy-MM-dd"),
        order.delivery_date ? format(new Date(order.delivery_date), "yyyy-MM-dd") : '-',
        statusLabels[order.status],
        order.subtotal.toFixed(2),
        order.tax_amount.toFixed(2),
        order.total_amount.toFixed(2),
      ]);

      autoTable(doc, {
        head: [['Order No', 'Supplier', 'Order Date', 'Delivery Date', 'Status', 'Subtotal', 'Tax', 'Total']],
        body: tableData,
        startY: 25,
        styles: {
          fontSize: 10,
          halign: "center",
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: "bold",
        },
        margin: { top: 25 },
      });

      doc.save(`purchase_orders_${new Date().toISOString().split('T')[0]}.pdf`);
    }

    toast({
      title: "تم التصدير",
      description: `تم تصدير ${filteredOrders.length} أمر شراء بنجاح`,
    });
  };

  const handleEdit = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setIsEditing(true);
    setFormData({
      supplier_id: order.supplier_id,
      order_date: order.order_date,
      delivery_date: order.delivery_date || "",
      notes: order.notes || "",
    });
    setOrderItems(order.items.length > 0 ? order.items : [
      { product_id: "", product_name: "", quantity: 1, unit_price: 0, tax_rate: 15, total: 0 }
    ]);
    setDialogOpen(true);
  };

  const handleView = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setViewDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      supplier_id: "",
      order_date: new Date().toISOString().split('T')[0],
      delivery_date: "",
      notes: "",
    });
    setOrderItems([
      { product_id: "", product_name: "", quantity: 1, unit_price: 0, tax_rate: 15, total: 0 }
    ]);
    setIsEditing(false);
    setSelectedOrder(null);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.suppliers?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totals = calculateTotals();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">أوامر الشراء</h1>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="ml-2 h-4 w-4" />
                تصدير
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                تصدير CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                تصدير PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="ml-2 h-4 w-4" />
            أمر شراء جديد
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="بحث برقم الأمر أو اسم المورد..."
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
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="sent">تم الإرسال</SelectItem>
                <SelectItem value="received">تم الاستلام</SelectItem>
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
              لا توجد أوامر شراء
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الأمر</TableHead>
                    <TableHead>المورد</TableHead>
                    <TableHead>تاريخ الأمر</TableHead>
                    <TableHead>تاريخ التسليم</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>المبلغ الإجمالي</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>{order.suppliers?.name}</TableCell>
                      <TableCell>{format(new Date(order.order_date), "yyyy-MM-dd")}</TableCell>
                      <TableCell>
                        {order.delivery_date ? format(new Date(order.delivery_date), "yyyy-MM-dd") : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[order.status]}>
                          {statusLabels[order.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.total_amount.toFixed(2)} ر.س</TableCell>
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
              {isEditing ? "تعديل أمر الشراء" : "أمر شراء جديد"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المورد *</Label>
                <Select
                  value={formData.supplier_id}
                  onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المورد" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>تاريخ الأمر *</Label>
                <Input
                  type="date"
                  value={formData.order_date}
                  onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>تاريخ التسليم المتوقع</Label>
                <Input
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>المنتجات *</Label>
                <Button type="button" size="sm" onClick={handleAddItem}>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة منتج
                </Button>
              </div>
              <div className="space-y-2">
                {orderItems.map((item, index) => (
                  <div key={index} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Select
                        value={item.product_id}
                        onValueChange={(value) => handleItemChange(index, "product_id", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المنتج" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      type="number"
                      placeholder="الكمية"
                      className="w-24"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="السعر"
                      className="w-32"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, "unit_price", e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="الضريبة %"
                      className="w-24"
                      value={item.tax_rate}
                      onChange={(e) => handleItemChange(index, "tax_rate", e.target.value)}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveItem(index)}
                      disabled={orderItems.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-end space-y-1 text-sm">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span>المجموع الفرعي:</span>
                    <span className="font-bold">{totals.subtotal} ر.س</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الضريبة:</span>
                    <span className="font-bold">{totals.tax} ر.س</span>
                  </div>
                  <div className="flex justify-between text-lg border-t pt-2">
                    <span>الإجمالي:</span>
                    <span className="font-bold text-primary">{totals.total} ر.س</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="أضف ملاحظات..."
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>تفاصيل أمر الشراء</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">رقم الأمر</Label>
                  <p className="font-bold">{selectedOrder.order_number}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">المورد</Label>
                  <p className="font-bold">{selectedOrder.suppliers?.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">تاريخ الأمر</Label>
                  <p>{format(new Date(selectedOrder.order_date), "yyyy-MM-dd")}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">تاريخ التسليم</Label>
                  <p>
                    {selectedOrder.delivery_date
                      ? format(new Date(selectedOrder.delivery_date), "yyyy-MM-dd")
                      : "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">الحالة</Label>
                  <Badge className={statusColors[selectedOrder.status]}>
                    {statusLabels[selectedOrder.status]}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">المنتجات</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المنتج</TableHead>
                      <TableHead>الكمية</TableHead>
                      <TableHead>السعر</TableHead>
                      <TableHead>الضريبة</TableHead>
                      <TableHead>الإجمالي</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.items.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.unit_price} ر.س</TableCell>
                        <TableCell>{item.tax_rate}%</TableCell>
                        <TableCell>{item.total.toFixed(2)} ر.س</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>المجموع الفرعي:</span>
                  <span className="font-bold">{selectedOrder.subtotal.toFixed(2)} ر.س</span>
                </div>
                <div className="flex justify-between">
                  <span>الضريبة:</span>
                  <span className="font-bold">{selectedOrder.tax_amount.toFixed(2)} ر.س</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>الإجمالي:</span>
                  <span className="text-primary">{selectedOrder.total_amount.toFixed(2)} ر.س</span>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <Label className="text-muted-foreground">ملاحظات</Label>
                  <p>{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseOrders;
