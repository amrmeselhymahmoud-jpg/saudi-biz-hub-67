import { useState, useEffect } from "react";
import { MapPin, Plus, Edit, Trash2, Building2 } from "lucide-react";
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
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل المواقع",
        variant: "destructive",
      });
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPin className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">المواقع</h1>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="ml-2 h-4 w-4" />
          موقع جديد
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المواقع</p>
                <p className="text-3xl font-bold">{locations.length}</p>
              </div>
              <Building2 className="h-12 w-12 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">مواقع نشطة</p>
                <p className="text-3xl font-bold text-green-600">{activeLocations}</p>
              </div>
              <MapPin className="h-12 w-12 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">مواقع غير نشطة</p>
                <p className="text-3xl font-bold text-gray-600">{inactiveLocations}</p>
              </div>
              <MapPin className="h-12 w-12 text-gray-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
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
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(location.id)}
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
  );
};

export default Locations;
