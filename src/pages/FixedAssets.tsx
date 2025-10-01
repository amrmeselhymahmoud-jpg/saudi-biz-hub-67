import { useState, useEffect } from "react";
import { Building2, Plus, CreditCard as Edit, Trash2, Eye, TrendingDown } from "lucide-react";
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

interface FixedAsset {
  id: string;
  asset_code: string;
  asset_name: string;
  category: string;
  purchase_date: string;
  purchase_cost: number;
  salvage_value: number;
  useful_life_years: number;
  depreciation_method: string;
  current_value: number;
  accumulated_depreciation: number;
  location: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

const FixedAssets = () => {
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<FixedAsset | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    asset_code: "",
    asset_name: "",
    category: "",
    purchase_date: new Date().toISOString().split('T')[0],
    purchase_cost: "",
    salvage_value: "0",
    useful_life_years: "",
    depreciation_method: "straight_line",
    location: "",
    notes: "",
  });

  const statusColors: Record<string, string> = {
    active: "bg-green-500",
    disposed: "bg-red-500",
    under_maintenance: "bg-yellow-500",
  };

  const statusLabels: Record<string, string> = {
    active: "نشط",
    disposed: "مستبعد",
    under_maintenance: "تحت الصيانة",
  };

  const depreciationMethodLabels: Record<string, string> = {
    straight_line: "القسط الثابت",
    declining_balance: "الرصيد المتناقص",
    sum_of_years: "مجموع أرقام السنوات",
  };

  const categories = [
    "مباني",
    "أثاث ومفروشات",
    "معدات",
    "سيارات",
    "أجهزة كمبيوتر",
    "برمجيات",
    "أخرى",
  ];

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const { data, error } = await supabase
        .from("fixed_assets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAssets(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل الأصول الثابتة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateCurrentValue = (
    purchaseCost: number,
    salvageValue: number,
    usefulLifeYears: number,
    purchaseDate: string
  ) => {
    const yearsElapsed = (new Date().getTime() - new Date(purchaseDate).getTime()) / (365 * 24 * 60 * 60 * 1000);
    const annualDepreciation = (purchaseCost - salvageValue) / usefulLifeYears;
    const accumulatedDepreciation = Math.min(annualDepreciation * yearsElapsed, purchaseCost - salvageValue);
    return {
      currentValue: purchaseCost - accumulatedDepreciation,
      accumulatedDepreciation: accumulatedDepreciation,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.asset_code || !formData.asset_name || !formData.category || !formData.purchase_cost || !formData.useful_life_years) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    try {
      const purchaseCost = parseFloat(formData.purchase_cost);
      const salvageValue = parseFloat(formData.salvage_value);
      const usefulLifeYears = parseFloat(formData.useful_life_years);

      const { currentValue, accumulatedDepreciation } = calculateCurrentValue(
        purchaseCost,
        salvageValue,
        usefulLifeYears,
        formData.purchase_date
      );

      const assetData = {
        asset_code: formData.asset_code,
        asset_name: formData.asset_name,
        category: formData.category,
        purchase_date: formData.purchase_date,
        purchase_cost: purchaseCost,
        salvage_value: salvageValue,
        useful_life_years: usefulLifeYears,
        depreciation_method: formData.depreciation_method,
        current_value: currentValue,
        accumulated_depreciation: accumulatedDepreciation,
        location: formData.location || null,
        status: isEditing ? selectedAsset?.status : "active",
        notes: formData.notes || null,
        user_id: (await supabase.auth.getUser()).data.user?.id,
      };

      let error;
      if (isEditing && selectedAsset) {
        const result = await supabase
          .from("fixed_assets")
          .update(assetData)
          .eq("id", selectedAsset.id);
        error = result.error;
      } else {
        const result = await supabase
          .from("fixed_assets")
          .insert([assetData]);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: isEditing ? "تم تحديث الأصل الثابت" : "تم إضافة أصل ثابت جديد",
      });

      setDialogOpen(false);
      resetForm();
      fetchAssets();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف الأصل الثابت؟")) return;

    try {
      const { error } = await supabase
        .from("fixed_assets")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف الأصل الثابت بنجاح",
      });

      fetchAssets();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (asset: FixedAsset) => {
    setSelectedAsset(asset);
    setIsEditing(true);
    setFormData({
      asset_code: asset.asset_code,
      asset_name: asset.asset_name,
      category: asset.category,
      purchase_date: asset.purchase_date,
      purchase_cost: asset.purchase_cost.toString(),
      salvage_value: asset.salvage_value.toString(),
      useful_life_years: asset.useful_life_years.toString(),
      depreciation_method: asset.depreciation_method,
      location: asset.location || "",
      notes: asset.notes || "",
    });
    setDialogOpen(true);
  };

  const handleView = (asset: FixedAsset) => {
    setSelectedAsset(asset);
    setViewDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      asset_code: "",
      asset_name: "",
      category: "",
      purchase_date: new Date().toISOString().split('T')[0],
      purchase_cost: "",
      salvage_value: "0",
      useful_life_years: "",
      depreciation_method: "straight_line",
      location: "",
      notes: "",
    });
    setIsEditing(false);
    setSelectedAsset(null);
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = asset.asset_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || asset.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAssets = assets.length;
  const activeAssets = assets.filter(a => a.status === "active").length;
  const totalValue = assets.reduce((sum, a) => sum + a.current_value, 0);
  const totalDepreciation = assets.reduce((sum, a) => sum + a.accumulated_depreciation, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">الأصول الثابتة</h1>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="ml-2 h-4 w-4" />
          أصل ثابت جديد
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الأصول</p>
                <p className="text-3xl font-bold">{totalAssets}</p>
              </div>
              <Building2 className="h-12 w-12 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">أصول نشطة</p>
                <p className="text-3xl font-bold text-green-600">{activeAssets}</p>
              </div>
              <Building2 className="h-12 w-12 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">القيمة الحالية</p>
                <p className="text-2xl font-bold text-blue-600">{totalValue.toFixed(2)} ر.س</p>
              </div>
              <TrendingDown className="h-12 w-12 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">الإهلاك المتراكم</p>
                <p className="text-2xl font-bold text-red-600">{totalDepreciation.toFixed(2)} ر.س</p>
              </div>
              <TrendingDown className="h-12 w-12 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="بحث بالكود أو الاسم أو الفئة..."
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
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="disposed">مستبعد</SelectItem>
                <SelectItem value="under_maintenance">تحت الصيانة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد أصول ثابتة
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الكود</TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead>الفئة</TableHead>
                    <TableHead>تاريخ الشراء</TableHead>
                    <TableHead>تكلفة الشراء</TableHead>
                    <TableHead>القيمة الحالية</TableHead>
                    <TableHead>الإهلاك المتراكم</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell className="font-mono font-medium">{asset.asset_code}</TableCell>
                      <TableCell className="font-medium">{asset.asset_name}</TableCell>
                      <TableCell>{asset.category}</TableCell>
                      <TableCell>{format(new Date(asset.purchase_date), "yyyy-MM-dd")}</TableCell>
                      <TableCell className="font-bold">{asset.purchase_cost.toFixed(2)} ر.س</TableCell>
                      <TableCell className="font-bold text-blue-600">
                        {asset.current_value.toFixed(2)} ر.س
                      </TableCell>
                      <TableCell className="font-bold text-red-600">
                        {asset.accumulated_depreciation.toFixed(2)} ر.س
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[asset.status]}>
                          {statusLabels[asset.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleView(asset)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(asset)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(asset.id)}
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "تعديل الأصل الثابت" : "أصل ثابت جديد"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>كود الأصل *</Label>
                <Input
                  value={formData.asset_code}
                  onChange={(e) => setFormData({ ...formData, asset_code: e.target.value })}
                  placeholder="ASSET-001"
                  disabled={isEditing}
                  required
                />
                {isEditing && (
                  <p className="text-xs text-muted-foreground">
                    لا يمكن تعديل كود الأصل
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>اسم الأصل *</Label>
                <Input
                  value={formData.asset_name}
                  onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
                  placeholder="مبنى المكتب"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>الفئة *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>تاريخ الشراء *</Label>
                <Input
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>تكلفة الشراء *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.purchase_cost}
                  onChange={(e) => setFormData({ ...formData, purchase_cost: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>القيمة المتبقية</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.salvage_value}
                  onChange={(e) => setFormData({ ...formData, salvage_value: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label>العمر الإنتاجي (سنوات) *</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.useful_life_years}
                  onChange={(e) => setFormData({ ...formData, useful_life_years: e.target.value })}
                  placeholder="5"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>طريقة الإهلاك *</Label>
                <Select
                  value={formData.depreciation_method}
                  onValueChange={(value) => setFormData({ ...formData, depreciation_method: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="straight_line">القسط الثابت</SelectItem>
                    <SelectItem value="declining_balance">الرصيد المتناقص</SelectItem>
                    <SelectItem value="sum_of_years">مجموع أرقام السنوات</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>الموقع</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="الطابق الأول - المبنى الرئيسي"
                />
              </div>
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>تفاصيل الأصل الثابت</DialogTitle>
          </DialogHeader>
          {selectedAsset && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <Label className="text-muted-foreground">كود الأصل</Label>
                  <p className="font-bold text-lg">{selectedAsset.asset_code}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">اسم الأصل</Label>
                  <p className="font-medium">{selectedAsset.asset_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">الفئة</Label>
                  <p>{selectedAsset.category}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">تاريخ الشراء</Label>
                  <p>{format(new Date(selectedAsset.purchase_date), "yyyy-MM-dd")}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">تكلفة الشراء</Label>
                  <p className="font-bold text-xl">{selectedAsset.purchase_cost.toFixed(2)} ر.س</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">القيمة المتبقية</Label>
                  <p>{selectedAsset.salvage_value.toFixed(2)} ر.س</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">العمر الإنتاجي</Label>
                  <p>{selectedAsset.useful_life_years} سنة</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">طريقة الإهلاك</Label>
                  <p>{depreciationMethodLabels[selectedAsset.depreciation_method]}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">القيمة الحالية</Label>
                  <p className="font-bold text-xl text-blue-600">
                    {selectedAsset.current_value.toFixed(2)} ر.س
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">الإهلاك المتراكم</Label>
                  <p className="font-bold text-xl text-red-600">
                    {selectedAsset.accumulated_depreciation.toFixed(2)} ر.س
                  </p>
                </div>
                {selectedAsset.location && (
                  <div className="md:col-span-2">
                    <Label className="text-muted-foreground">الموقع</Label>
                    <p>{selectedAsset.location}</p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">الحالة</Label>
                  <div className="mt-1">
                    <Badge className={statusColors[selectedAsset.status]}>
                      {statusLabels[selectedAsset.status]}
                    </Badge>
                  </div>
                </div>
              </div>

              {selectedAsset.notes && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">ملاحظات</Label>
                  <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                    {selectedAsset.notes}
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

export default FixedAssets;
