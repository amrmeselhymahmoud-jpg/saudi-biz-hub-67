import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { File as FileEdit, Save, RefreshCw, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface NumberSetting {
  id: string;
  document_type: string;
  prefix: string;
  next_number: number;
  number_length: number;
  suffix: string;
  separator: string;
  reset_frequency: string;
  last_reset_date: string | null;
  sample_format: string;
  is_active: boolean;
}

const NumberSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<NumberSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const documentTypes: Record<string, { label: string; description: string }> = {
    'sales_invoice': { label: 'فواتير المبيعات', description: 'ترقيم فواتير البيع للعملاء' },
    'purchase_invoice': { label: 'فواتير المشتريات', description: 'ترقيم فواتير الشراء من الموردين' },
    'quote': { label: 'عروض الأسعار', description: 'ترقيم عروض الأسعار المقدمة للعملاء' },
    'purchase_order': { label: 'أوامر الشراء', description: 'ترقيم أوامر الشراء للموردين' },
    'customer_receipt': { label: 'سندات القبض', description: 'ترقيم سندات القبض من العملاء' },
    'supplier_payment': { label: 'سندات الصرف', description: 'ترقيم سندات الصرف للموردين' },
    'manual_entry': { label: 'القيود اليومية', description: 'ترقيم القيود المحاسبية اليدوية' },
    'annual_entry': { label: 'القيود السنوية', description: 'ترقيم القيود المحاسبية السنوية' },
    'simple_invoice': { label: 'الفواتير البسيطة', description: 'ترقيم الفواتير البسيطة' },
    'deferred_invoice': { label: 'الفواتير المؤجلة', description: 'ترقيم الفواتير المؤجلة' }
  };

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('number_settings')
        .select('*')
        .eq('user_id', user?.id)
        .order('document_type');

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "خطأ في تحميل الإعدادات",
        description: "حدث خطأ أثناء تحميل إعدادات الأرقام",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = (id: string, field: keyof NumberSetting, value: any) => {
    setSettings(prev => prev.map(setting => {
      if (setting.id === id) {
        const updated = { ...setting, [field]: value };

        const paddedNumber = String(updated.next_number).padStart(updated.number_length, '0');
        updated.sample_format = `${updated.prefix}${updated.separator}${paddedNumber}${updated.suffix}`;

        return updated;
      }
      return setting;
    }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const updates = settings.map(setting => ({
        id: setting.id,
        prefix: setting.prefix,
        next_number: setting.next_number,
        number_length: setting.number_length,
        suffix: setting.suffix,
        separator: setting.separator,
        reset_frequency: setting.reset_frequency,
        is_active: setting.is_active
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('number_settings')
          .update(update)
          .eq('id', update.id);

        if (error) throw error;
      }

      toast({
        title: "تم حفظ الإعدادات",
        description: "تم حفظ إعدادات الأرقام بنجاح"
      });

      await loadSettings();
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: "خطأ في الحفظ",
        description: error.message || "حدث خطأ أثناء حفظ الإعدادات",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetNumber = async (settingId: string) => {
    try {
      const { error } = await supabase
        .from('number_settings')
        .update({
          next_number: 1,
          last_reset_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', settingId);

      if (error) throw error;

      toast({
        title: "تم إعادة التعيين",
        description: "تم إعادة تعيين الترقيم إلى 1"
      });

      await loadSettings();
    } catch (error: any) {
      console.error('Error resetting number:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إعادة التعيين",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل الإعدادات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileEdit className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">إعدادات الأرقام</h1>
            <p className="text-sm text-muted-foreground">
              تخصيص تسلسل الأرقام للفواتير والمستندات
            </p>
          </div>
        </div>
        <Button onClick={handleSaveSettings} disabled={isSaving} className="gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? 'جاري الحفظ...' : 'حفظ جميع التغييرات'}
        </Button>
      </div>

      <div className="grid gap-6">
        {settings.map((setting) => {
          const docType = documentTypes[setting.document_type];
          return (
            <Card key={setting.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {docType.label}
                      <Badge className={setting.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {setting.is_active ? 'نشط' : 'معطل'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{docType.description}</CardDescription>
                  </div>
                  <Switch
                    checked={setting.is_active}
                    onCheckedChange={(checked) => updateSetting(setting.id, 'is_active', checked)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`prefix-${setting.id}`}>البادئة</Label>
                    <Input
                      id={`prefix-${setting.id}`}
                      value={setting.prefix}
                      onChange={(e) => updateSetting(setting.id, 'prefix', e.target.value)}
                      placeholder="INV"
                      maxLength={10}
                    />
                    <p className="text-xs text-muted-foreground">مثال: INV, QT</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`separator-${setting.id}`}>الفاصل</Label>
                    <Select
                      value={setting.separator}
                      onValueChange={(value) => updateSetting(setting.id, 'separator', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="-">شرطة (-)</SelectItem>
                        <SelectItem value="/">شرطة مائلة (/)</SelectItem>
                        <SelectItem value="_">شرطة سفلية (_)</SelectItem>
                        <SelectItem value="">بدون فاصل</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`number_length-${setting.id}`}>طول الرقم</Label>
                    <Input
                      id={`number_length-${setting.id}`}
                      type="number"
                      min="1"
                      max="10"
                      value={setting.number_length}
                      onChange={(e) => updateSetting(setting.id, 'number_length', Number(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">عدد الأرقام</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`suffix-${setting.id}`}>اللاحقة</Label>
                    <Input
                      id={`suffix-${setting.id}`}
                      value={setting.suffix}
                      onChange={(e) => updateSetting(setting.id, 'suffix', e.target.value)}
                      placeholder="اختياري"
                      maxLength={10}
                    />
                    <p className="text-xs text-muted-foreground">نص إضافي</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`next_number-${setting.id}`}>الرقم التالي</Label>
                    <div className="flex gap-2">
                      <Input
                        id={`next_number-${setting.id}`}
                        type="number"
                        min="1"
                        value={setting.next_number}
                        onChange={(e) => updateSetting(setting.id, 'next_number', Number(e.target.value))}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResetNumber(setting.id)}
                        title="إعادة تعيين إلى 1"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      الرقم المستخدم للمستند القادم
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`reset_frequency-${setting.id}`}>إعادة التعيين</Label>
                    <Select
                      value={setting.reset_frequency}
                      onValueChange={(value) => updateSetting(setting.id, 'reset_frequency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never">أبداً</SelectItem>
                        <SelectItem value="yearly">سنوياً</SelectItem>
                        <SelectItem value="monthly">شهرياً</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      تلقائياً إلى 1
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      معاينة النموذج
                    </Label>
                    <div className="h-10 px-3 py-2 border rounded-md bg-muted flex items-center">
                      <code className="text-sm font-mono font-semibold text-primary">
                        {setting.sample_format}
                      </code>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      شكل الرقم النهائي
                    </p>
                  </div>
                </div>

                {setting.last_reset_date && (
                  <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
                    آخر إعادة تعيين: {new Date(setting.last_reset_date).toLocaleDateString('ar-SA')}
                  </div>
                )}

                <div className="pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">الرقم الحالي:</span>
                      <span className="font-medium mr-2">{setting.sample_format}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">الرقم القادم:</span>
                      <span className="font-medium mr-2">
                        {setting.prefix}{setting.separator}
                        {String(setting.next_number + 1).padStart(setting.number_length, '0')}
                        {setting.suffix}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">مثال بعد 100:</span>
                      <span className="font-medium mr-2">
                        {setting.prefix}{setting.separator}
                        {String(setting.next_number + 100).padStart(setting.number_length, '0')}
                        {setting.suffix}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-blue-900 flex items-center gap-2">
              <FileEdit className="h-5 w-5" />
              نصائح مهمة
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>
                  <strong>البادئة واللاحقة:</strong> يمكنك استخدام اختصارات مثل INV للفواتير، QT لعروض الأسعار
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>
                  <strong>طول الرقم:</strong> يحدد عدد الأصفار قبل الرقم (5 = 00001، 4 = 0001)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>
                  <strong>إعادة التعيين:</strong> اختر "سنوياً" لبدء الترقيم من 1 كل سنة جديدة
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>
                  <strong>الرقم التالي:</strong> يمكنك تغييره يدوياً أو إعادة تعيينه إلى 1
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>
                  <strong>تعطيل الترقيم:</strong> استخدم المفتاح في الأعلى لتعطيل ترقيم مستند معين مؤقتاً
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h3 className="font-semibold text-yellow-900">تحذير</h3>
            <p className="text-sm text-yellow-800">
              تغيير إعدادات الأرقام لن يؤثر على المستندات المُنشأة سابقاً.
              سيتم تطبيق الإعدادات الجديدة فقط على المستندات المستقبلية.
              يُنصح بعدم تغيير إعدادات الأرقام بشكل متكرر للحفاظ على التسلسل المنطقي.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NumberSettings;
