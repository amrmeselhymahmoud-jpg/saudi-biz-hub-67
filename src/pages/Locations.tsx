import { useState, useEffect } from "react";
import { MapPin, Plus, CreditCard as Edit, Trash2, Building2, Download, Upload } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { EmptyTableMessage } from "@/components/EmptyTableMessage";

interface Location {
  id: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  manager_name: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

const Locations = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    city: "",
    phone: "",
    manager_name: "",
    is_active: true,
    notes: "",
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLocations(data || []);
      setHasError(false);
    } catch (error: any) {
      console.error('Error loading locations:', error);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.code) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    try {
      const locationData = {
        name: formData.name,
        code: formData.code,
        address: formData.address || null,
        city: formData.city || null,
        phone: formData.phone || null,
        manager_name: formData.manager_name || null,
        is_active: formData.is_active,
        notes: formData.notes || null,
        user_id: (await supabase.auth.getUser()).data.user?.id,
      };

      let error;
      if (isEditing && selectedLocation) {
        const result = await supabase
          .from("locations")
          .update(locationData)
          .eq("id", selectedLocation.id);
        error = result.error;
      } else {
        const { error: checkError } = await supabase
          .from("locations")
          .select("code")
          .eq("code", formData.code)
          .maybeSingle();

        if (checkError) throw checkError;

        const result = await supabase
          .from("locations")
          .insert([locationData]);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: isEditing ? "تم تحديث الموقع" : "تم إضافة موقع جديد",
      });

      setDialogOpen(false);
      resetForm();
      fetchLocations();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف الموقع؟")) return;

    try {
      const { error } = await supabase
        .from("locations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف الموقع بنجاح",
      });

      fetchLocations();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (location: Location) => {
    setSelectedLocation(location);
    setIsEditing(true);
    setFormData({
      name: location.name,
      code: location.code,
      address: location.address || "",
      city: location.city || "",
      phone: location.phone || "",
      manager_name: location.manager_name || "",
      is_active: location.is_active,
      notes: location.notes || "",
    });
    setDialogOpen(true);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("locations")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة الموقع بنجاح",
      });

      fetchLocations();
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
      name: "",
      code: "",
      address: "",
      city: "",
      phone: "",
      manager_name: "",
      is_active: true,
      notes: "",
    });
    setIsEditing(false);
    setSelectedLocation(null);
  };

  const handleExport = () => {
    const exportData = locations.map(l => ({
      name: l.name,
      code: l.code,
      city: l.city || '',
      address: l.address || '',
      phone: l.phone || '',
      manager_name: l.manager_name || '',
      is_active: l.is_active ? 'نشط' : 'غير نشط'
    }));

    const csv = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `locations_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleImport = () => {
    toast({
      title: "قريباً",
      description: "سيتم إضافة وظيفة الاستيراد قريباً",
    });
  };

  if (hasError) {
    return <EmptyTableMessage title="المواقع والفروع" description="هذه الميزة قيد التطوير. سيتم إضافة جدول المواقع قريباً." />;
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-64 w-full bg-muted animate-pulse rounded" />
      </div>
    );
  }

  const filteredLocations = locations.filter((location) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      location.name.toLowerCase().includes(searchLower) ||
      location.code.toLowerCase().includes(searchLower) ||
      location.city?.toLowerCase().includes(searchLower) ||
      location.manager_name?.toLowerCase().includes(searchLower)
    );
  });

  const activeLocations = locations.filter(loc => loc.is_active).length;
  const inactiveLocations = locations.filter(loc => !loc.is_active).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-cyan-50/20 to-blue-50/30">
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
            <MapPin className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">المواقع</h1>
            <p className="text-gray-600 mt-1">إدارة المواقع والفروع والمستودعات</p>
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
          <Button onClick={() => { resetForm(); setDialogOpen(true); }} size="lg" className="h-12 px-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all">
            <Plus className="ml-2 h-5 w-5" />
            موقع جديد
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">إجمالي المواقع</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{locations.length}</p>
                <p className="text-xs text-gray-500 mt-1">موقع</p>
              </div>
              <div className="h-16 w-16 bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-2xl flex items-center justify-center">
                <Building2 className="h-8 w-8 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">مواقع نشطة</p>
                <p className="text-4xl font-bold text-green-600 mt-2">{activeLocations}</p>
                <p className="text-xs text-gray-500 mt-1">موقع نشط</p>
              </div>
              <div className="h-16 w-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center">
                <MapPin className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">مواقع غير نشطة</p>
                <p className="text-4xl font-bold text-gray-600 mt-2">{inactiveLocations}</p>
                <p className="text-xs text-gray-500 mt-1">موقع غير نشط</p>
              </div>
              <div className="h-16 w-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                <MapPin className="h-8 w-8 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg bg-white">
        <CardHeader>
          <Input
            placeholder="بحث بالاسم أو الكود أو المدينة أو المدير..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : filteredLocations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد مواقع
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الكود</TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead>المدينة</TableHead>
                    <TableHead>المدير</TableHead>
                    <TableHead>الهاتف</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLocations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell className="font-mono font-medium">
                        {location.code}
                      </TableCell>
                      <TableCell className="font-medium">{location.name}</TableCell>
                      <TableCell>{location.city || "-"}</TableCell>
                      <TableCell>{location.manager_name || "-"}</TableCell>
                      <TableCell>{location.phone || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={location.is_active}
                            onCheckedChange={() => handleToggleActive(location.id, location.is_active)}
                          />
                          <Badge
                            className={location.is_active ? "bg-green-500" : "bg-gray-500"}
                          >
                            {location.is_active ? "نشط" : "غير نشط"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(location)}
                            className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(location.id)}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "تعديل الموقع" : "موقع جديد"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم الموقع *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مستودع الرئيسي"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>كود الموقع *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="LOC-001"
                  disabled={isEditing}
                  required
                />
                {isEditing && (
                  <p className="text-xs text-muted-foreground">
                    لا يمكن تعديل كود الموقع
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>المدينة</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="الرياض"
                />
              </div>

              <div className="space-y-2">
                <Label>رقم الهاتف</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="05xxxxxxxx"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>العنوان</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="شارع الملك فهد، حي العليا"
                />
              </div>

              <div className="space-y-2">
                <Label>اسم المدير</Label>
                <Input
                  value={formData.manager_name}
                  onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                  placeholder="أحمد محمد"
                />
              </div>

              <div className="space-y-2">
                <Label>الحالة</Label>
                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <span className="text-sm">
                    {formData.is_active ? "نشط" : "غير نشط"}
                  </span>
                </div>
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
      </div>
    </div>
  );
};

export default Locations;
