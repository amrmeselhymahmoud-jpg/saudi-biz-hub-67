import { useState, useEffect } from "react";
import { Recycle, Plus, Eye } from "lucide-react";
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

interface AssetDisposal {
  id: string;
  asset_id: string;
  disposal_date: string;
  disposal_method: string;
  sale_price: number;
  book_value: number;
  gain_loss: number;
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
  current_value: number;
}

const Recoveries = () => {
  const [disposals, setDisposals] = useState<AssetDisposal[]>([]);
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedDisposal, setSelectedDisposal] = useState<AssetDisposal | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    asset_id: "",
    disposal_date: new Date().toISOString().split('T')[0],
    disposal_method: "sale",
    sale_price: "",
    notes: "",
  });

  const disposalMethodLabels: Record<string, string> = {
    sale: "بيع",
    scrap: "خردة",
    donation: "تبرع",
    trade: "مقايضة",
  };

  useEffect(() => {
    fetchDisposals();
    fetchAssets();
  }, []);

  const fetchDisposals = async () => {
    try {
      const { data, error } = await supabase
        .from("asset_disposals")
        .select(`
          *,
          fixed_assets (asset_code, asset_name, category)
        `)
        .order("disposal_date", { ascending: false });

      if (error) throw error;
      setDisposals(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل سجلات الاستبعاد",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    const { data } = await supabase
      .from("fixed_assets")
      .select("id, asset_code, asset_name, category, current_value")
      .eq("status", "active")
      .order("asset_name");
    setAssets(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.asset_id || !formData.disposal_date || !formData.sale_price) {
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

      const salePrice = parseFloat(formData.sale_price);
      const bookValue = asset.current_value;
      const gainLoss = salePrice - bookValue;

      const disposalData = {
        asset_id: formData.asset_id,
        disposal_date: formData.disposal_date,
        disposal_method: formData.disposal_method,
        sale_price: salePrice,
        book_value: bookValue,
        gain_loss: gainLoss,
        notes: formData.notes || null,
        user_id: (await supabase.auth.getUser()).data.user?.id,
      };

      const { error: disposalError } = await supabase
        .from("asset_disposals")
        .insert([disposalData]);

      if (disposalError) throw disposalError;

      const { error: assetError } = await supabase
        .from("fixed_assets")
        .update({ status: "disposed" })
        .eq("id", formData.asset_id);

      if (assetError) throw assetError;

      toast({
        title: "تم بنجاح",
        description: "تم تسجيل الاستبعاد بنجاح",
      });

      setDialogOpen(false);
      resetForm();
      fetchDisposals();
      fetchAssets();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleView = (disposal: AssetDisposal) => {
    setSelectedDisposal(disposal);
    setViewDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      asset_id: "",
      disposal_date: new Date().toISOString().split('T')[0],
      disposal_method: "sale",
      sale_price: "",
      notes: "",
    });
  };

  const filteredDisposals = disposals.filter((disposal) => {
    const matchesSearch = disposal.fixed_assets?.asset_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         disposal.fixed_assets?.asset_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = methodFilter === "all" || disposal.disposal_method === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const totalDisposals = disposals.length;
  const totalGains = disposals.filter(d => d.gain_loss > 0).reduce((sum, d) => sum + d.gain_loss, 0);
  const totalLosses = Math.abs(disposals.filter(d => d.gain_loss < 0).reduce((sum, d) => sum + d.gain_loss, 0));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Recycle className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">الاستبعادات</h1>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="ml-2 h-4 w-4" />
          استبعاد أصل
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الاستبعادات</p>
                <p className="text-3xl font-bold">{totalDisposals}</p>
              </div>
              <Recycle className="h-12 w-12 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الأرباح</p>
                <p className="text-2xl font-bold text-green-600">{totalGains.toFixed(2)} ر.س</p>
              </div>
              <Recycle className="h-12 w-12 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الخسائر</p>
                <p className="text-2xl font-bold text-red-600">{totalLosses.toFixed(2)} ر.س</p>
              </div>
              <Recycle className="h-12 w-12 text-red-600 opacity-20" />
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
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="تصفية حسب الطريقة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الطرق</SelectItem>
                <SelectItem value="sale">بيع</SelectItem>
                <SelectItem value="scrap">خردة</SelectItem>
                <SelectItem value="donation">تبرع</SelectItem>
                <SelectItem value="trade">مقايضة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : filteredDisposals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد سجلات استبعاد
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>كود الأصل</TableHead>
                    <TableHead>اسم الأصل</TableHead>
                    <TableHead>تاريخ الاستبعاد</TableHead>
                    <TableHead>الطريقة</TableHead>
                    <TableHead>سعر البيع</TableHead>
                    <TableHead>القيمة الدفترية</TableHead>
                    <TableHead>الربح/الخسارة</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDisposals.map((disposal) => (
                    <TableRow key={disposal.id}>
                      <TableCell className="font-mono font-medium">
                        {disposal.fixed_assets?.asset_code}
                      </TableCell>
                      <TableCell className="font-medium">
                        {disposal.fixed_assets?.asset_name}
                      </TableCell>
                      <TableCell>{format(new Date(disposal.disposal_date), "yyyy-MM-dd")}</TableCell>
                      <TableCell>
                        <Badge>{disposalMethodLabels[disposal.disposal_method]}</Badge>
                      </TableCell>
                      <TableCell className="font-bold">
                        {disposal.sale_price.toFixed(2)} ر.س
                      </TableCell>
                      <TableCell className="font-bold">
                        {disposal.book_value.toFixed(2)} ر.س
                      </TableCell>
                      <TableCell className={`font-bold ${disposal.gain_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {disposal.gain_loss >= 0 ? '+' : ''}{disposal.gain_loss.toFixed(2)} ر.س
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleView(disposal)}
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
            <DialogTitle>استبعاد أصل ثابت</DialogTitle>
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
                    <div>
                      <Label className="text-muted-foreground text-xs">القيمة الدفترية الحالية</Label>
                      <p className="font-bold text-xl text-blue-600">{asset.current_value.toFixed(2)} ر.س</p>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>تاريخ الاستبعاد *</Label>
                <Input
                  type="date"
                  value={formData.disposal_date}
                  onChange={(e) => setFormData({ ...formData, disposal_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>طريقة الاستبعاد *</Label>
                <Select
                  value={formData.disposal_method}
                  onValueChange={(value) => setFormData({ ...formData, disposal_method: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">بيع</SelectItem>
                    <SelectItem value="scrap">خردة</SelectItem>
                    <SelectItem value="donation">تبرع</SelectItem>
                    <SelectItem value="trade">مقايضة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>سعر البيع / القيمة *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.sale_price}
                  onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                  placeholder="0.00"
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
                تسجيل الاستبعاد
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تفاصيل الاستبعاد</DialogTitle>
          </DialogHeader>
          {selectedDisposal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <Label className="text-muted-foreground">كود الأصل</Label>
                  <p className="font-bold text-lg">{selectedDisposal.fixed_assets?.asset_code}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">اسم الأصل</Label>
                  <p className="font-medium">{selectedDisposal.fixed_assets?.asset_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">الفئة</Label>
                  <p>{selectedDisposal.fixed_assets?.category}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">تاريخ الاستبعاد</Label>
                  <p>{format(new Date(selectedDisposal.disposal_date), "yyyy-MM-dd")}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">طريقة الاستبعاد</Label>
                  <div className="mt-1">
                    <Badge>{disposalMethodLabels[selectedDisposal.disposal_method]}</Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">سعر البيع</Label>
                  <p className="font-bold text-xl">{selectedDisposal.sale_price.toFixed(2)} ر.س</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">القيمة الدفترية</Label>
                  <p className="font-bold text-xl">{selectedDisposal.book_value.toFixed(2)} ر.س</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">الربح/الخسارة</Label>
                  <p className={`font-bold text-2xl ${selectedDisposal.gain_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedDisposal.gain_loss >= 0 ? '+' : ''}{selectedDisposal.gain_loss.toFixed(2)} ر.س
                  </p>
                </div>
              </div>

              {selectedDisposal.notes && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">ملاحظات</Label>
                  <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                    {selectedDisposal.notes}
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

export default Recoveries;
