import { useState, useEffect } from "react";
import { FileBox, Plus, Eye, CreditCard as Edit, Trash2, Download } from "lucide-react";
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
import { exportToCSV, exportToJSON } from "@/utils/exportImport";

interface SupplierBond {
  id: string;
  bond_number: string;
  supplier_id: string;
  bond_type: string;
  bond_date: string;
  amount: number;
  payment_method: string;
  reference_number: string | null;
  description: string;
  status: string;
  notes: string | null;
  suppliers?: { name: string };
}

interface Supplier {
  id: string;
  name: string;
}

const SupplierBonds = () => {
  const [bonds, setBonds] = useState<SupplierBond[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedBond, setSelectedBond] = useState<SupplierBond | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    supplier_id: "",
    bond_type: "payment",
    bond_date: new Date().toISOString().split('T')[0],
    amount: "",
    payment_method: "cash",
    reference_number: "",
    description: "",
    notes: "",
  });

  const bondTypeColors: Record<string, string> = {
    payment: "bg-red-500",
    receipt: "bg-green-500",
  };

  const bondTypeLabels: Record<string, string> = {
    payment: "دفع",
    receipt: "قبض",
  };

  const statusColors: Record<string, string> = {
    draft: "bg-gray-500",
    issued: "bg-blue-500",
    cleared: "bg-green-500",
    cancelled: "bg-red-500",
  };

  const statusLabels: Record<string, string> = {
    draft: "مسودة",
    issued: "صادر",
    cleared: "تم الصرف",
    cancelled: "ملغي",
  };

  const paymentMethodLabels: Record<string, string> = {
    cash: "نقداً",
    bank_transfer: "تحويل بنكي",
    check: "شيك",
    credit_card: "بطاقة ائتمان",
  };

  useEffect(() => {
    initializeDemoData();
    fetchBonds();
    fetchSuppliers();
  }, []);

  const initializeDemoData = () => {
    // Initialize demo suppliers if not exists
    const storedSuppliers = localStorage.getItem('demo_suppliers');
    if (!storedSuppliers) {
      const demoSuppliers = [
        { id: 'sup_1', name: 'شركة الأمانة للتوريدات' },
        { id: 'sup_2', name: 'مؤسسة النجاح التجارية' },
        { id: 'sup_3', name: 'شركة الجودة للمواد' },
      ];
      localStorage.setItem('demo_suppliers', JSON.stringify(demoSuppliers));
    }

    // Initialize demo supplier bonds if not exists
    const storedBonds = localStorage.getItem('demo_supplier_bonds');
    if (!storedBonds) {
      const demoBonds = [
        {
          id: 'sb_1',
          bond_number: 'SB-100001',
          supplier_id: 'sup_1',
          bond_type: 'payment',
          bond_date: new Date().toISOString().split('T')[0],
          amount: 5000,
          payment_method: 'bank_transfer',
          reference_number: 'TRN-2024-001',
          description: 'دفع مستحقات فواتير شهر يناير',
          status: 'cleared',
          notes: 'تم الدفع عن طريق التحويل البنكي',
          created_at: new Date().toISOString(),
        },
        {
          id: 'sb_2',
          bond_number: 'SB-100002',
          supplier_id: 'sup_2',
          bond_type: 'receipt',
          bond_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          amount: 2000,
          payment_method: 'cash',
          reference_number: null,
          description: 'قبض دفعة مقدمة لشراء مواد',
          status: 'issued',
          notes: null,
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'sb_3',
          bond_number: 'SB-100003',
          supplier_id: 'sup_3',
          bond_type: 'payment',
          bond_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          amount: 8500,
          payment_method: 'check',
          reference_number: 'CHK-789456',
          description: 'دفع فاتورة مواد خام',
          status: 'issued',
          notes: 'شيك مؤجل لنهاية الشهر',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
      localStorage.setItem('demo_supplier_bonds', JSON.stringify(demoBonds));
    }
  };

  const fetchBonds = async () => {
    try {
      // Demo mode: load from localStorage
      const storedBonds = localStorage.getItem('demo_supplier_bonds');
      const storedSuppliers = localStorage.getItem('demo_suppliers');

      if (storedBonds && storedSuppliers) {
        const bondsArray = JSON.parse(storedBonds);
        const suppliersArray = JSON.parse(storedSuppliers);

        // Join bonds with suppliers
        const bondsWithSuppliers = bondsArray.map((bond: SupplierBond) => {
          const supplier = suppliersArray.find((s: Supplier) => s.id === bond.supplier_id);
          return {
            ...bond,
            suppliers: supplier ? { name: supplier.name } : undefined,
          };
        });

        setBonds(bondsWithSuppliers);
      } else {
        setBonds([]);
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل سندات الموردين",
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
      setSuppliers(JSON.parse(storedSuppliers));
    } else {
      setSuppliers([]);
    }
  };

  const generateBondNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `SB-${timestamp}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.supplier_id || !formData.description || !formData.amount) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (amount <= 0) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال مبلغ صحيح",
        variant: "destructive",
      });
      return;
    }

    try {
      const bondData = {
        id: isEditing ? selectedBond?.id : 'sb_' + Date.now(),
        bond_number: isEditing ? selectedBond?.bond_number : generateBondNumber(),
        supplier_id: formData.supplier_id,
        bond_type: formData.bond_type,
        bond_date: formData.bond_date,
        amount: amount,
        payment_method: formData.payment_method,
        reference_number: formData.reference_number || null,
        description: formData.description,
        status: isEditing ? selectedBond?.status || "issued" : "issued",
        notes: formData.notes || null,
        created_at: isEditing ? selectedBond?.created_at : new Date().toISOString(),
      };

      // Demo mode: save to localStorage
      const storedBonds = localStorage.getItem('demo_supplier_bonds');
      let bondsArray = storedBonds ? JSON.parse(storedBonds) : [];

      if (isEditing && selectedBond) {
        bondsArray = bondsArray.map((bond: SupplierBond) =>
          bond.id === selectedBond.id ? bondData : bond
        );
      } else {
        bondsArray.unshift(bondData);
      }

      localStorage.setItem('demo_supplier_bonds', JSON.stringify(bondsArray));

      toast({
        title: "تم بنجاح",
        description: isEditing ? "تم تحديث السند" : "تم إضافة سند جديد",
      });

      setDialogOpen(false);
      resetForm();
      fetchBonds();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف السند؟")) return;

    try {
      // Demo mode: delete from localStorage
      const storedBonds = localStorage.getItem('demo_supplier_bonds');
      if (storedBonds) {
        const bondsArray = JSON.parse(storedBonds);
        const updatedBonds = bondsArray.filter((bond: SupplierBond) => bond.id !== id);
        localStorage.setItem('demo_supplier_bonds', JSON.stringify(updatedBonds));
      }

      toast({
        title: "تم الحذف",
        description: "تم حذف السند بنجاح",
      });

      fetchBonds();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (bond: SupplierBond) => {
    setSelectedBond(bond);
    setIsEditing(true);
    setFormData({
      supplier_id: bond.supplier_id,
      bond_type: bond.bond_type,
      bond_date: bond.bond_date,
      amount: bond.amount.toString(),
      payment_method: bond.payment_method,
      reference_number: bond.reference_number || "",
      description: bond.description,
      notes: bond.notes || "",
    });
    setDialogOpen(true);
  };

  const handleView = (bond: SupplierBond) => {
    setSelectedBond(bond);
    setViewDialogOpen(true);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      // Demo mode: update in localStorage
      const storedBonds = localStorage.getItem('demo_supplier_bonds');
      if (storedBonds) {
        const bondsArray = JSON.parse(storedBonds);
        const updatedBonds = bondsArray.map((bond: SupplierBond) => {
          if (bond.id === id) {
            return { ...bond, status: newStatus };
          }
          return bond;
        });
        localStorage.setItem('demo_supplier_bonds', JSON.stringify(updatedBonds));
      }

      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة السند بنجاح",
      });

      fetchBonds();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleExport = (format: 'csv' | 'json') => {
    if (filteredBonds.length === 0) {
      toast({
        title: "تنبيه",
        description: "لا توجد بيانات للتصدير",
        variant: "destructive",
      });
      return;
    }

    const exportData = filteredBonds.map(bond => ({
      'رقم السند': bond.bond_number,
      'المورد': bond.suppliers?.name || '-',
      'النوع': bondTypeLabels[bond.bond_type],
      'تاريخ السند': format(new Date(bond.bond_date), "yyyy-MM-dd"),
      'المبلغ': bond.amount,
      'طريقة الدفع': paymentMethodLabels[bond.payment_method],
      'رقم المرجع': bond.reference_number || '-',
      'الوصف': bond.description,
      'الحالة': statusLabels[bond.status],
      'الملاحظات': bond.notes || '-'
    }));

    if (format === 'csv') {
      exportToCSV(exportData, 'supplier_bonds');
    } else {
      exportToJSON(exportData, 'supplier_bonds');
    }

    toast({
      title: "تم التصدير",
      description: `تم تصدير ${filteredBonds.length} سند بنجاح`,
    });
  };

  const resetForm = () => {
    setFormData({
      supplier_id: "",
      bond_type: "payment",
      bond_date: new Date().toISOString().split('T')[0],
      amount: "",
      payment_method: "cash",
      reference_number: "",
      description: "",
      notes: "",
    });
    setIsEditing(false);
    setSelectedBond(null);
  };

  const filteredBonds = bonds.filter((bond) => {
    const matchesSearch = bond.bond_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bond.suppliers?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bond.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || bond.bond_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileBox className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">سندات الموردين</h1>
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
              <DropdownMenuItem onClick={() => handleExport('json')}>
                تصدير JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="ml-2 h-4 w-4" />
            سند جديد
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="بحث برقم السند أو اسم المورد أو الوصف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="تصفية حسب النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="payment">دفع</SelectItem>
                <SelectItem value="receipt">قبض</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : filteredBonds.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد سندات
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم السند</TableHead>
                    <TableHead>المورد</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>طريقة الدفع</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBonds.map((bond) => (
                    <TableRow key={bond.id}>
                      <TableCell className="font-medium">{bond.bond_number}</TableCell>
                      <TableCell>{bond.suppliers?.name}</TableCell>
                      <TableCell>
                        <Badge className={bondTypeColors[bond.bond_type]}>
                          {bondTypeLabels[bond.bond_type]}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(bond.bond_date), "yyyy-MM-dd")}</TableCell>
                      <TableCell className="font-bold">
                        {bond.amount.toFixed(2)} ر.س
                      </TableCell>
                      <TableCell>{paymentMethodLabels[bond.payment_method]}</TableCell>
                      <TableCell>
                        <Select
                          value={bond.status}
                          onValueChange={(value) => handleStatusChange(bond.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <Badge className={statusColors[bond.status]}>
                              {statusLabels[bond.status]}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">مسودة</SelectItem>
                            <SelectItem value="issued">صادر</SelectItem>
                            <SelectItem value="cleared">تم الصرف</SelectItem>
                            <SelectItem value="cancelled">ملغي</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleView(bond)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(bond)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(bond.id)}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "تعديل سند المورد" : "سند مورد جديد"}
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
                <Label>نوع السند *</Label>
                <Select
                  value={formData.bond_type}
                  onValueChange={(value) => setFormData({ ...formData, bond_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="payment">سند دفع</SelectItem>
                    <SelectItem value="receipt">سند قبض</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>تاريخ السند *</Label>
                <Input
                  type="date"
                  value={formData.bond_date}
                  onChange={(e) => setFormData({ ...formData, bond_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>المبلغ (ر.س) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>طريقة الدفع *</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">نقداً</SelectItem>
                    <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                    <SelectItem value="check">شيك</SelectItem>
                    <SelectItem value="credit_card">بطاقة ائتمان</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>رقم المرجع</Label>
                <Input
                  value={formData.reference_number}
                  onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                  placeholder="رقم الشيك أو رقم التحويل"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>الوصف *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف السند..."
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="أضف ملاحظات إضافية..."
                rows={2}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تفاصيل السند</DialogTitle>
          </DialogHeader>
          {selectedBond && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <Label className="text-muted-foreground">رقم السند</Label>
                  <p className="font-bold text-lg">{selectedBond.bond_number}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">النوع</Label>
                  <div className="mt-1">
                    <Badge className={bondTypeColors[selectedBond.bond_type]}>
                      {bondTypeLabels[selectedBond.bond_type]}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">المورد</Label>
                  <p className="font-medium">{selectedBond.suppliers?.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">الحالة</Label>
                  <div className="mt-1">
                    <Badge className={statusColors[selectedBond.status]}>
                      {statusLabels[selectedBond.status]}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">تاريخ السند</Label>
                  <p>{format(new Date(selectedBond.bond_date), "yyyy-MM-dd")}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">المبلغ</Label>
                  <p className="font-bold text-xl text-primary">
                    {selectedBond.amount.toFixed(2)} ر.س
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">طريقة الدفع</Label>
                  <p className="font-medium">{paymentMethodLabels[selectedBond.payment_method]}</p>
                </div>
                {selectedBond.reference_number && (
                  <div>
                    <Label className="text-muted-foreground">رقم المرجع</Label>
                    <p className="font-medium">{selectedBond.reference_number}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">الوصف</Label>
                <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                  {selectedBond.description}
                </div>
              </div>

              {selectedBond.notes && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">ملاحظات</Label>
                  <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                    {selectedBond.notes}
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

export default SupplierBonds;
