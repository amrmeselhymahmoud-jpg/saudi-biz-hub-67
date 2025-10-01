import { useState, useEffect } from "react";
import { TrendingDown, Plus, Eye, Calendar } from "lucide-react";
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

interface DepreciationRecord {
  id: string;
  asset_id: string;
  period_date: string;
  depreciation_amount: number;
  accumulated_depreciation: number;
  book_value: number;
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
  accumulated_depreciation: number;
  current_value: number;
  useful_life_years: number;
  salvage_value: number;
}

const Depreciation = () => {
  const [records, setRecords] = useState<DepreciationRecord[]>([]);
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [assetFilter, setAssetFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DepreciationRecord | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    asset_id: "",
    period_date: new Date().toISOString().split('T')[0],
    depreciation_amount: "",
    notes: "",
  });

  useEffect(() => {
    fetchRecords();
    fetchAssets();
  }, []);

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from("depreciation_records")
        .select(`
          *,
          fixed_assets (asset_code, asset_name, category)
        `)
        .order("period_date", { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل سجلات الإهلاك",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    const { data } = await supabase
      .from("fixed_assets")
      .select("id, asset_code, asset_name, category, purchase_cost, accumulated_depreciation, current_value, useful_life_years, salvage_value")
      .eq("status", "active")
      .order("asset_name");
    setAssets(data || []);
  };

  const calculateDepreciationAmount = (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return 0;

    const annualDepreciation = (asset.purchase_cost - asset.salvage_value) / asset.useful_life_years;
    const monthlyDepreciation = annualDepreciation / 12;

    return monthlyDepreciation;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.asset_id || !formData.period_date || !formData.depreciation_amount) {
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

      const depreciationAmount = parseFloat(formData.depreciation_amount);
      const newAccumulatedDepreciation = asset.accumulated_depreciation + depreciationAmount;
      const newBookValue = asset.purchase_cost - newAccumulatedDepreciation;

      const recordData = {
        asset_id: formData.asset_id,
        period_date: formData.period_date,
        depreciation_amount: depreciationAmount,
        accumulated_depreciation: newAccumulatedDepreciation,
        book_value: newBookValue,
        notes: formData.notes || null,
        user_id: (await supabase.auth.getUser()).data.user?.id,
      };

      const { error: recordError } = await supabase
        .from("depreciation_records")
        .insert([recordData]);

      if (recordError) throw recordError;

      const { error: assetError } = await supabase
        .from("fixed_assets")
        .update({
          accumulated_depreciation: newAccumulatedDepreciation,
          current_value: newBookValue,
        })
        .eq("id", formData.asset_id);

      if (assetError) throw assetError;

      toast({
        title: "تم بنجاح",
        description: "تم تسجيل الإهلاك بنجاح",
      });

      setDialogOpen(false);
      resetForm();
      fetchRecords();
      fetchAssets();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleView = (record: DepreciationRecord) => {
    setSelectedRecord(record);
    setViewDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      asset_id: "",
      period_date: new Date().toISOString().split('T')[0],
      depreciation_amount: "",
      notes: "",
    });
  };

  const handleAssetChange = (assetId: string) => {
    setFormData({ ...formData, asset_id: assetId });
    const calculatedAmount = calculateDepreciationAmount(assetId);
    setFormData({
      ...formData,
      asset_id: assetId,
      depreciation_amount: calculatedAmount.toFixed(2),
    });
  };

  const filteredRecords = records.filter((record) => {
    const matchesSearch = record.fixed_assets?.asset_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.fixed_assets?.asset_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAsset = assetFilter === "all" || record.asset_id === assetFilter;
    return matchesSearch && matchesAsset;
  });

  const totalRecords = records.length;
  const totalDepreciation = records.reduce((sum, r) => sum + r.depreciation_amount, 0);
  const thisMonthDepreciation = records
    .filter(r => new Date(r.period_date).getMonth() === new Date().getMonth())
    .reduce((sum, r) => sum + r.depreciation_amount, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingDown className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">الإهلاك</h1>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="ml-2 h-4 w-4" />
          تسجيل إهلاك جديد
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي السجلات</p>
                <p className="text-3xl font-bold">{totalRecords}</p>
              </div>
              <Calendar className="h-12 w-12 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إهلاك هذا الشهر</p>
                <p className="text-2xl font-bold text-blue-600">{thisMonthDepreciation.toFixed(2)} ر.س</p>
              </div>
              <TrendingDown className="h-12 w-12 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الإهلاك</p>
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
                placeholder="بحث بكود الأصل أو الاسم..."
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
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد سجلات إهلاك
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>كود الأصل</TableHead>
                    <TableHead>اسم الأصل</TableHead>
                    <TableHead>الفئة</TableHead>
                    <TableHead>تاريخ الفترة</TableHead>
                    <TableHead>مبلغ الإهلاك</TableHead>
                    <TableHead>الإهلاك المتراكم</TableHead>
                    <TableHead>القيمة الدفترية</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-mono font-medium">
                        {record.fixed_assets?.asset_code}
                      </TableCell>
                      <TableCell className="font-medium">
                        {record.fixed_assets?.asset_name}
                      </TableCell>
                      <TableCell>{record.fixed_assets?.category}</TableCell>
                      <TableCell>{format(new Date(record.period_date), "yyyy-MM-dd")}</TableCell>
                      <TableCell className="font-bold text-red-600">
                        {record.depreciation_amount.toFixed(2)} ر.س
                      </TableCell>
                      <TableCell className="font-bold">
                        {record.accumulated_depreciation.toFixed(2)} ر.س
                      </TableCell>
                      <TableCell className="font-bold text-blue-600">
                        {record.book_value.toFixed(2)} ر.س
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleView(record)}
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
            <DialogTitle>تسجيل إهلاك جديد</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>الأصل الثابت *</Label>
              <Select
                value={formData.asset_id}
                onValueChange={handleAssetChange}
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
              <div className="p-4 bg-muted rounded-lg space-y-2">
                {(() => {
                  const asset = assets.find(a => a.id === formData.asset_id);
                  if (!asset) return null;
                  return (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground text-xs">تكلفة الشراء</Label>
                          <p className="font-bold">{asset.purchase_cost.toFixed(2)} ر.س</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-xs">القيمة الحالية</Label>
                          <p className="font-bold text-blue-600">{asset.current_value.toFixed(2)} ر.س</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-xs">الإهلاك المتراكم</Label>
                          <p className="font-bold text-red-600">{asset.accumulated_depreciation.toFixed(2)} ر.س</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-xs">العمر الإنتاجي</Label>
                          <p className="font-bold">{asset.useful_life_years} سنة</p>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>تاريخ الفترة *</Label>
                <Input
                  type="date"
                  value={formData.period_date}
                  onChange={(e) => setFormData({ ...formData, period_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>مبلغ الإهلاك *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.depreciation_amount}
                  onChange={(e) => setFormData({ ...formData, depreciation_amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  القيمة المحسوبة تلقائياً بناءً على طريقة القسط الثابت الشهري
                </p>
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
                تسجيل الإهلاك
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تفاصيل سجل الإهلاك</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <Label className="text-muted-foreground">كود الأصل</Label>
                  <p className="font-bold text-lg">{selectedRecord.fixed_assets?.asset_code}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">اسم الأصل</Label>
                  <p className="font-medium">{selectedRecord.fixed_assets?.asset_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">الفئة</Label>
                  <p>{selectedRecord.fixed_assets?.category}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">تاريخ الفترة</Label>
                  <p>{format(new Date(selectedRecord.period_date), "yyyy-MM-dd")}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">مبلغ الإهلاك</Label>
                  <p className="font-bold text-xl text-red-600">
                    {selectedRecord.depreciation_amount.toFixed(2)} ر.س
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">الإهلاك المتراكم</Label>
                  <p className="font-bold text-xl">
                    {selectedRecord.accumulated_depreciation.toFixed(2)} ر.س
                  </p>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-muted-foreground">القيمة الدفترية</Label>
                  <p className="font-bold text-2xl text-blue-600">
                    {selectedRecord.book_value.toFixed(2)} ر.س
                  </p>
                </div>
              </div>

              {selectedRecord.notes && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">ملاحظات</Label>
                  <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                    {selectedRecord.notes}
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

export default Depreciation;
