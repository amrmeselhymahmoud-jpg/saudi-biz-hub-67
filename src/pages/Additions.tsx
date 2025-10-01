import { useState, useEffect } from "react";
import { PlusCircle, Plus, Eye } from "lucide-react";
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

interface AssetAddition {
  id: string;
  asset_id: string;
  addition_date: string;
  description: string;
  cost: number;
  notes: string | null;
  created_at: string;
  fixed_assets?: {
    asset_code: string;
    asset_name: string;
    category: string;
  };
}

interface FixedAsset {
  id: string;
  asset_code: string;
  asset_name: string;
  category: string;
  purchase_cost: number;
  current_value: number;
}

const Additions = () => {
  const [additions, setAdditions] = useState<AssetAddition[]>([]);
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [assetFilter, setAssetFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedAddition, setSelectedAddition] = useState<AssetAddition | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    asset_id: "",
    addition_date: new Date().toISOString().split('T')[0],
    description: "",
    cost: "",
    notes: "",
  });

  useEffect(() => {
    fetchAdditions();
    fetchAssets();
  }, []);

  const fetchAdditions = async () => {
    try {
      const { data, error } = await supabase
        .from("asset_additions")
        .select(`
          *,
          fixed_assets (asset_code, asset_name, category)
        `)
        .order("addition_date", { ascending: false });

      if (error) throw error;
      setAdditions(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل سجلات الإضافات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    const { data } = await supabase
      .from("fixed_assets")
      .select("id, asset_code, asset_name, category, purchase_cost, current_value")
      .eq("status", "active")
      .order("asset_name");
    setAssets(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.asset_id || !formData.addition_date || !formData.description || !formData.cost) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    try {
      const asset = assets.find(a => a.id === formData.asset_id);
      if (!asset) throw new Error("الأصل غير موجود");

      const cost = parseFloat(formData.cost);

      const additionData = {
        asset_id: formData.asset_id,
        addition_date: formData.addition_date,
        description: formData.description,
        cost: cost,
        notes: formData.notes || null,
        user_id: (await supabase.auth.getUser()).data.user?.id,
      };

      const { error: additionError } = await supabase
        .from("asset_additions")
        .insert([additionData]);

      if (additionError) throw additionError;

      const newPurchaseCost = asset.purchase_cost + cost;
      const newCurrentValue = asset.current_value + cost;

      const { error: assetError } = await supabase
        .from("fixed_assets")
        .update({
          purchase_cost: newPurchaseCost,
          current_value: newCurrentValue,
        })
        .eq("id", formData.asset_id);

      if (assetError) throw assetError;

      toast({
        title: "تم بنجاح",
        description: "تم تسجيل الإضافة بنجاح",
      });

      setDialogOpen(false);
      resetForm();
      fetchAdditions();
      fetchAssets();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleView = (addition: AssetAddition) => {
    setSelectedAddition(addition);
    setViewDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      asset_id: "",
      addition_date: new Date().toISOString().split('T')[0],
      description: "",
      cost: "",
      notes: "",
    });
  };

  const filteredAdditions = additions.filter((addition) => {
    const matchesSearch = addition.fixed_assets?.asset_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         addition.fixed_assets?.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         addition.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAsset = assetFilter === "all" || addition.asset_id === assetFilter;
    return matchesSearch && matchesAsset;
  });

  const totalAdditions = additions.length;
  const totalCost = additions.reduce((sum, a) => sum + a.cost, 0);
  const thisMonthAdditions = additions
    .filter(a => new Date(a.addition_date).getMonth() === new Date().getMonth())
    .reduce((sum, a) => sum + a.cost, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PlusCircle className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">إضافات الأصول</h1>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="ml-2 h-4 w-4" />
          إضافة جديدة
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الإضافات</p>
                <p className="text-3xl font-bold">{totalAdditions}</p>
              </div>
              <PlusCircle className="h-12 w-12 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إضافات هذا الشهر</p>
                <p className="text-2xl font-bold text-blue-600">{thisMonthAdditions.toFixed(2)} ر.س</p>
              </div>
              <PlusCircle className="h-12 w-12 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي التكلفة</p>
                <p className="text-2xl font-bold text-green-600">{totalCost.toFixed(2)} ر.س</p>
              </div>
              <PlusCircle className="h-12 w-12 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="بحث بكود الأصل أو الاسم أو الوصف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={assetFilter} onValueChange={setAssetFilter}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="تصفية حسب الأصل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأصول</SelectItem>
                {assets.map((asset) => (
                  <SelectItem key={asset.id} value={asset.id}>
                    {asset.asset_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : filteredAdditions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد سجلات إضافات
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>كود الأصل</TableHead>
                    <TableHead>اسم الأصل</TableHead>
                    <TableHead>تاريخ الإضافة</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead>التكلفة</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdditions.map((addition) => (
                    <TableRow key={addition.id}>
                      <TableCell className="font-mono font-medium">
                        {addition.fixed_assets?.asset_code}
                      </TableCell>
                      <TableCell className="font-medium">
                        {addition.fixed_assets?.asset_name}
                      </TableCell>
                      <TableCell>{format(new Date(addition.addition_date), "yyyy-MM-dd")}</TableCell>
                      <TableCell>{addition.description}</TableCell>
                      <TableCell className="font-bold text-green-600">
                        {addition.cost.toFixed(2)} ر.س
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleView(addition)}
                          >
                            <Eye className="h-4 w-4" />
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
            <DialogTitle>إضافة جديدة للأصل</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>الأصل الثابت *</Label>
              <Select
                value={formData.asset_id}
                onValueChange={(value) => setFormData({ ...formData, asset_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الأصل" />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.asset_name} - {asset.asset_code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.asset_id && (
              <div className="p-4 bg-muted rounded-lg">
                {(() => {
                  const asset = assets.find(a => a.id === formData.asset_id);
                  if (!asset) return null;
                  return (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground text-xs">تكلفة الشراء الحالية</Label>
                        <p className="font-bold text-lg">{asset.purchase_cost.toFixed(2)} ر.س</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">القيمة الحالية</Label>
                        <p className="font-bold text-lg text-blue-600">{asset.current_value.toFixed(2)} ر.س</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>تاريخ الإضافة *</Label>
                <Input
                  type="date"
                  value={formData.addition_date}
                  onChange={(e) => setFormData({ ...formData, addition_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>التكلفة *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>الوصف *</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="صيانة وتحديثات، إضافة ملحق جديد..."
                  required
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
                تسجيل الإضافة
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تفاصيل الإضافة</DialogTitle>
          </DialogHeader>
          {selectedAddition && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <Label className="text-muted-foreground">كود الأصل</Label>
                  <p className="font-bold text-lg">{selectedAddition.fixed_assets?.asset_code}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">اسم الأصل</Label>
                  <p className="font-medium">{selectedAddition.fixed_assets?.asset_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">الفئة</Label>
                  <p>{selectedAddition.fixed_assets?.category}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">تاريخ الإضافة</Label>
                  <p>{format(new Date(selectedAddition.addition_date), "yyyy-MM-dd")}</p>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-muted-foreground">الوصف</Label>
                  <p className="font-medium">{selectedAddition.description}</p>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-muted-foreground">التكلفة</Label>
                  <p className="font-bold text-2xl text-green-600">
                    {selectedAddition.cost.toFixed(2)} ر.س
                  </p>
                </div>
              </div>

              {selectedAddition.notes && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">ملاحظات</Label>
                  <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                    {selectedAddition.notes}
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

export default Additions;
