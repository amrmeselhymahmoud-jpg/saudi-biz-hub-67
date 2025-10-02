import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  FileEdit,
  Plus,
  Type,
  Hash,
  Calendar as CalendarIcon,
  ToggleLeft,
  List,
  FileText,
  CheckCircle2,
  XCircle,
  Trash2,
  Settings,
  Star
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CustomField {
  id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  entity_type: string;
  is_required: boolean;
  default_value: string;
  options: string[];
  display_order: number;
  is_active: boolean;
}

const AdditionalFields = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fields, setFields] = useState<CustomField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [newField, setNewField] = useState({
    field_name: '',
    field_label: '',
    field_type: 'text',
    entity_type: 'invoice',
    is_required: false,
    default_value: '',
    options: '',
    display_order: ''
  });

  const entityTypes = [
    { value: 'invoice', label: 'الفواتير' },
    { value: 'customer', label: 'العملاء' },
    { value: 'supplier', label: 'الموردين' },
    { value: 'product', label: 'المنتجات' },
    { value: 'order', label: 'الطلبات' },
    { value: 'quote', label: 'عروض الأسعار' }
  ];

  const fieldTypes = [
    { value: 'text', label: 'نص', icon: Type },
    { value: 'number', label: 'رقم', icon: Hash },
    { value: 'date', label: 'تاريخ', icon: CalendarIcon },
    { value: 'boolean', label: 'نعم/لا', icon: ToggleLeft },
    { value: 'select', label: 'قائمة اختيار', icon: List },
    { value: 'textarea', label: 'نص طويل', icon: FileText }
  ];

  useEffect(() => {
    if (user) {
      loadFields();
    }
  }, [user]);

  const loadFields = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('custom_fields')
        .select('*')
        .eq('user_id', user?.id)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setFields(data || []);
    } catch (error) {
      console.error('Error loading fields:', error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل الحقول الإضافية",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddField = async () => {
    if (!newField.field_name || !newField.field_label) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال اسم الحقل والتسمية",
        variant: "destructive"
      });
      return;
    }

    try {
      const options = newField.field_type === 'select'
        ? newField.options.split(',').map(opt => opt.trim()).filter(opt => opt)
        : [];

      const { error } = await supabase
        .from('custom_fields')
        .insert({
          user_id: user?.id,
          field_name: newField.field_name.toLowerCase().replace(/\s+/g, '_'),
          field_label: newField.field_label,
          field_type: newField.field_type,
          entity_type: newField.entity_type,
          is_required: newField.is_required,
          default_value: newField.default_value,
          options: options,
          display_order: parseInt(newField.display_order || '0'),
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "تم الإضافة",
        description: "تم إضافة الحقل الإضافي بنجاح"
      });

      setIsDialogOpen(false);
      setNewField({
        field_name: '',
        field_label: '',
        field_type: 'text',
        entity_type: 'invoice',
        is_required: false,
        default_value: '',
        options: '',
        display_order: ''
      });
      await loadFields();
    } catch (error: any) {
      console.error('Error adding field:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إضافة الحقل",
        variant: "destructive"
      });
    }
  };

  const handleToggleField = async (fieldId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('custom_fields')
        .update({ is_active: !currentStatus })
        .eq('id', fieldId);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: `تم ${!currentStatus ? 'تفعيل' : 'إيقاف'} الحقل`
      });

      await loadFields();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء تحديث الحالة",
        variant: "destructive"
      });
    }
  };

  const handleToggleRequired = async (fieldId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('custom_fields')
        .update({ is_required: !currentStatus })
        .eq('id', fieldId);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: `الحقل ${!currentStatus ? 'الآن إلزامي' : 'أصبح اختياري'}`
      });

      await loadFields();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء التحديث",
        variant: "destructive"
      });
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الحقل؟ سيتم حذف جميع القيم المرتبطة به.')) return;

    try {
      const { error } = await supabase
        .from('custom_fields')
        .delete()
        .eq('id', fieldId);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف الحقل بنجاح"
      });

      await loadFields();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء حذف الحقل",
        variant: "destructive"
      });
    }
  };

  const getFieldTypeIcon = (type: string) => {
    const typeConfig = fieldTypes.find(ft => ft.value === type);
    const Icon = typeConfig?.icon || Type;
    return <Icon className="h-4 w-4" />;
  };

  const getFieldTypeBadge = (type: string) => {
    const typeConfig = fieldTypes.find(ft => ft.value === type);
    return (
      <Badge variant="outline" className="gap-1">
        {getFieldTypeIcon(type)}
        {typeConfig?.label || type}
      </Badge>
    );
  };

  const getEntityBadge = (entityType: string) => {
    const entity = entityTypes.find(e => e.value === entityType);
    const colors: Record<string, string> = {
      invoice: 'bg-blue-100 text-blue-800',
      customer: 'bg-green-100 text-green-800',
      supplier: 'bg-orange-100 text-orange-800',
      product: 'bg-purple-100 text-purple-800',
      order: 'bg-pink-100 text-pink-800',
      quote: 'bg-cyan-100 text-cyan-800'
    };
    return (
      <Badge className={colors[entityType] || 'bg-gray-100 text-gray-800'}>
        {entity?.label || entityType}
      </Badge>
    );
  };

  const groupedFields = entityTypes.reduce((acc, entity) => {
    acc[entity.value] = fields.filter(f => f.entity_type === entity.value);
    return acc;
  }, {} as Record<string, CustomField[]>);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل الحقول الإضافية...</p>
        </div>
      </div>
    );
  }

  const activeFields = fields.filter(f => f.is_active).length;
  const requiredFields = fields.filter(f => f.is_required).length;
  const fieldsByType = fieldTypes.map(type => ({
    type: type.label,
    count: fields.filter(f => f.field_type === type.value).length
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileEdit className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">إدارة الحقول الإضافية</h1>
            <p className="text-sm text-muted-foreground">
              تخصيص حقول إضافية للكيانات المختلفة
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الحقول</CardTitle>
            <FileEdit className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fields.length}</div>
            <p className="text-xs text-muted-foreground mt-1">حقل إضافي</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">الحقول النشطة</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeFields}</div>
            <p className="text-xs text-muted-foreground mt-1">من إجمالي {fields.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">الحقول الإلزامية</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requiredFields}</div>
            <p className="text-xs text-muted-foreground mt-1">حقل إلزامي</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">أنواع الكيانات</CardTitle>
            <Settings className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(groupedFields).filter(k => groupedFields[k].length > 0).length}</div>
            <p className="text-xs text-muted-foreground mt-1">كيان نشط</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">جميع الحقول</TabsTrigger>
          {entityTypes.map(entity => (
            <TabsTrigger key={entity.value} value={entity.value}>
              {entity.label} ({groupedFields[entity.value].length})
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                إضافة حقل إضافي
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>إضافة حقل إضافي جديد</DialogTitle>
                <DialogDescription>
                  قم بإضافة حقل مخصص لأي كيان في النظام
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>اسم الحقل (بالإنجليزية)</Label>
                    <Input
                      placeholder="customer_code"
                      value={newField.field_name}
                      onChange={(e) => setNewField({ ...newField, field_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>تسمية الحقل (بالعربية)</Label>
                    <Input
                      placeholder="كود العميل"
                      value={newField.field_label}
                      onChange={(e) => setNewField({ ...newField, field_label: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>نوع الحقل</Label>
                    <Select
                      value={newField.field_type}
                      onValueChange={(value) => setNewField({ ...newField, field_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>الكيان</Label>
                    <Select
                      value={newField.entity_type}
                      onValueChange={(value) => setNewField({ ...newField, entity_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {entityTypes.map((entity) => (
                          <SelectItem key={entity.value} value={entity.value}>
                            {entity.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {newField.field_type === 'select' && (
                  <div className="space-y-2">
                    <Label>الخيارات (مفصولة بفاصلة)</Label>
                    <Input
                      placeholder="الخيار 1, الخيار 2, الخيار 3"
                      value={newField.options}
                      onChange={(e) => setNewField({ ...newField, options: e.target.value })}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>القيمة الافتراضية</Label>
                    <Input
                      placeholder="القيمة الافتراضية"
                      value={newField.default_value}
                      onChange={(e) => setNewField({ ...newField, default_value: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ترتيب العرض</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newField.display_order}
                      onChange={(e) => setNewField({ ...newField, display_order: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={newField.is_required}
                    onCheckedChange={(checked) => setNewField({ ...newField, is_required: checked })}
                  />
                  <Label>حقل إلزامي</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleAddField}>إضافة</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="all" className="space-y-4">
          {fields.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <FileEdit className="h-16 w-16 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">لا توجد حقول إضافية</h3>
                    <p className="text-muted-foreground mb-4">
                      ابدأ بإضافة حقول مخصصة للنظام
                    </p>
                    <Button onClick={() => setIsDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      إضافة حقل جديد
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>جميع الحقول الإضافية</CardTitle>
                <CardDescription>جميع الحقول المخصصة في النظام</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم الحقل</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>الكيان</TableHead>
                      <TableHead>القيمة الافتراضية</TableHead>
                      <TableHead>الترتيب</TableHead>
                      <TableHead>إلزامي</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field) => (
                      <TableRow key={field.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{field.field_label}</div>
                            <div className="text-xs text-muted-foreground">{field.field_name}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getFieldTypeBadge(field.field_type)}</TableCell>
                        <TableCell>{getEntityBadge(field.entity_type)}</TableCell>
                        <TableCell>
                          {field.default_value ? (
                            <span className="text-sm">{field.default_value}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{field.display_order}</TableCell>
                        <TableCell>
                          <Switch
                            checked={field.is_required}
                            onCheckedChange={() => handleToggleRequired(field.id, field.is_required)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={field.is_active}
                              onCheckedChange={() => handleToggleField(field.id, field.is_active)}
                            />
                            {field.is_active ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                نشط
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-800">
                                <XCircle className="h-3 w-3 mr-1" />
                                معطل
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteField(field.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {entityTypes.map(entity => (
          <TabsContent key={entity.value} value={entity.value} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>حقول {entity.label}</CardTitle>
                <CardDescription>الحقول المخصصة لـ {entity.label}</CardDescription>
              </CardHeader>
              <CardContent>
                {groupedFields[entity.value].length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد حقول مضافة لـ {entity.label}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>اسم الحقل</TableHead>
                        <TableHead>النوع</TableHead>
                        <TableHead>القيمة الافتراضية</TableHead>
                        <TableHead>الترتيب</TableHead>
                        <TableHead>إلزامي</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedFields[entity.value].map((field) => (
                        <TableRow key={field.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{field.field_label}</div>
                              <div className="text-xs text-muted-foreground">{field.field_name}</div>
                            </div>
                          </TableCell>
                          <TableCell>{getFieldTypeBadge(field.field_type)}</TableCell>
                          <TableCell>
                            {field.default_value ? (
                              <span className="text-sm">{field.default_value}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>{field.display_order}</TableCell>
                          <TableCell>
                            <Switch
                              checked={field.is_required}
                              onCheckedChange={() => handleToggleRequired(field.id, field.is_required)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={field.is_active}
                                onCheckedChange={() => handleToggleField(field.id, field.is_active)}
                              />
                              {field.is_active ? (
                                <Badge className="bg-green-100 text-green-800">نشط</Badge>
                              ) : (
                                <Badge className="bg-gray-100 text-gray-800">معطل</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteField(field.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-blue-900 flex items-center gap-2">
              <FileEdit className="h-5 w-5" />
              نصائح للحقول الإضافية
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>التسمية:</strong> استخدم أسماء واضحة ومفهومة للحقول
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>النوع المناسب:</strong> اختر نوع الحقل المناسب لطبيعة البيانات
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>الترتيب:</strong> رتب الحقول بشكل منطقي حسب أهميتها
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>القيم الافتراضية:</strong> حدد قيم افتراضية لتسهيل الإدخال
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdditionalFields;
