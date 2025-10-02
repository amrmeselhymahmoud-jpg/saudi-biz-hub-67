import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings, Save, Building2, DollarSign, Globe, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GeneralSettings {
  id?: string;
  user_id?: string;
  company_name: string;
  company_name_en: string;
  tax_number: string;
  commercial_registration: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  country: string;
  postal_code: string;
  currency: string;
  currency_code: string;
  fiscal_year_start: string;
  vat_percentage: number;
  language: string;
  date_format: string;
  timezone: string;
  email_notifications: boolean;
  sms_notifications: boolean;
}

const GeneralSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<GeneralSettings>({
    company_name: '',
    company_name_en: '',
    tax_number: '',
    commercial_registration: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    city: '',
    country: 'المملكة العربية السعودية',
    postal_code: '',
    currency: 'ر.س',
    currency_code: 'SAR',
    fiscal_year_start: new Date().toISOString().split('T')[0],
    vat_percentage: 15,
    language: 'ar',
    date_format: 'DD/MM/YYYY',
    timezone: 'Asia/Riyadh',
    email_notifications: true,
    sms_notifications: false
  });

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('general_settings')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "خطأ في تحميل الإعدادات",
        description: "حدث خطأ أثناء تحميل الإعدادات",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const { data: existingSettings } = await supabase
        .from('general_settings')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (existingSettings) {
        const { error } = await supabase
          .from('general_settings')
          .update(settings)
          .eq('user_id', user?.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('general_settings')
          .insert([{
            ...settings,
            user_id: user?.id
          }]);

        if (error) throw error;
      }

      toast({
        title: "تم حفظ الإعدادات",
        description: "تم حفظ الإعدادات بنجاح"
      });

      await loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "خطأ في حفظ الإعدادات",
        description: "حدث خطأ أثناء حفظ الإعدادات",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key: keyof GeneralSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
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
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">الإعدادات العامة</h1>
            <p className="text-sm text-muted-foreground">إدارة إعدادات النظام والشركة</p>
          </div>
        </div>
        <Button onClick={handleSaveSettings} disabled={isSaving} className="gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </Button>
      </div>

      <Tabs defaultValue="company" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="company">معلومات الشركة</TabsTrigger>
          <TabsTrigger value="financial">الإعدادات المالية</TabsTrigger>
          <TabsTrigger value="system">إعدادات النظام</TabsTrigger>
          <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>معلومات الشركة</CardTitle>
                  <CardDescription>البيانات الأساسية للشركة أو المؤسسة</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">اسم الشركة (بالعربية) *</Label>
                  <Input
                    id="company_name"
                    value={settings.company_name}
                    onChange={(e) => updateSetting('company_name', e.target.value)}
                    placeholder="شركة الأعمال المتقدمة"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_name_en">اسم الشركة (بالإنجليزية)</Label>
                  <Input
                    id="company_name_en"
                    value={settings.company_name_en}
                    onChange={(e) => updateSetting('company_name_en', e.target.value)}
                    placeholder="Advanced Business Company"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tax_number">الرقم الضريبي</Label>
                  <Input
                    id="tax_number"
                    value={settings.tax_number}
                    onChange={(e) => updateSetting('tax_number', e.target.value)}
                    placeholder="300000000000003"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commercial_registration">رقم السجل التجاري</Label>
                  <Input
                    id="commercial_registration"
                    value={settings.commercial_registration}
                    onChange={(e) => updateSetting('commercial_registration', e.target.value)}
                    placeholder="1234567890"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={(e) => updateSetting('phone', e.target.value)}
                    placeholder="+966 XX XXX XXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => updateSetting('email', e.target.value)}
                    placeholder="info@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">الموقع الإلكتروني</Label>
                  <Input
                    id="website"
                    value={settings.website}
                    onChange={(e) => updateSetting('website', e.target.value)}
                    placeholder="www.company.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">العنوان</Label>
                <Textarea
                  id="address"
                  value={settings.address}
                  onChange={(e) => updateSetting('address', e.target.value)}
                  placeholder="شارع الملك فهد، حي العليا"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">المدينة</Label>
                  <Input
                    id="city"
                    value={settings.city}
                    onChange={(e) => updateSetting('city', e.target.value)}
                    placeholder="الرياض"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">الدولة</Label>
                  <Input
                    id="country"
                    value={settings.country}
                    onChange={(e) => updateSetting('country', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal_code">الرمز البريدي</Label>
                  <Input
                    id="postal_code"
                    value={settings.postal_code}
                    onChange={(e) => updateSetting('postal_code', e.target.value)}
                    placeholder="12345"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>الإعدادات المالية</CardTitle>
                  <CardDescription>إعدادات العملة والسنة المالية والضرائب</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">العملة</Label>
                  <Select
                    value={settings.currency_code}
                    onValueChange={(value) => {
                      updateSetting('currency_code', value);
                      const currencyMap: Record<string, string> = {
                        'SAR': 'ر.س',
                        'USD': '$',
                        'EUR': '€',
                        'AED': 'د.إ',
                        'KWD': 'د.ك',
                        'BHD': 'د.ب',
                        'OMR': 'ر.ع',
                        'QAR': 'ر.ق',
                        'EGP': 'ج.م'
                      };
                      updateSetting('currency', currencyMap[value] || value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SAR">ريال سعودي (ر.س)</SelectItem>
                      <SelectItem value="USD">دولار أمريكي ($)</SelectItem>
                      <SelectItem value="EUR">يورو (€)</SelectItem>
                      <SelectItem value="AED">درهم إماراتي (د.إ)</SelectItem>
                      <SelectItem value="KWD">دينار كويتي (د.ك)</SelectItem>
                      <SelectItem value="BHD">دينار بحريني (د.ب)</SelectItem>
                      <SelectItem value="OMR">ريال عماني (ر.ع)</SelectItem>
                      <SelectItem value="QAR">ريال قطري (ر.ق)</SelectItem>
                      <SelectItem value="EGP">جنيه مصري (ج.م)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vat_percentage">نسبة ضريبة القيمة المضافة (%)</Label>
                  <Input
                    id="vat_percentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={settings.vat_percentage}
                    onChange={(e) => updateSetting('vat_percentage', Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fiscal_year_start">بداية السنة المالية</Label>
                <Input
                  id="fiscal_year_start"
                  type="date"
                  value={settings.fiscal_year_start}
                  onChange={(e) => updateSetting('fiscal_year_start', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  تحديد تاريخ بداية السنة المالية للشركة (عادة 1 يناير)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>إعدادات النظام</CardTitle>
                  <CardDescription>اللغة والمنطقة الزمنية وتنسيق التاريخ</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">اللغة</Label>
                  <Select
                    value={settings.language}
                    onValueChange={(value) => updateSetting('language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_format">تنسيق التاريخ</Label>
                  <Select
                    value={settings.date_format}
                    onValueChange={(value) => updateSetting('date_format', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">المنطقة الزمنية</Label>
                  <Select
                    value={settings.timezone}
                    onValueChange={(value) => updateSetting('timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Riyadh">الرياض (GMT+3)</SelectItem>
                      <SelectItem value="Asia/Dubai">دبي (GMT+4)</SelectItem>
                      <SelectItem value="Asia/Kuwait">الكويت (GMT+3)</SelectItem>
                      <SelectItem value="Asia/Bahrain">البحرين (GMT+3)</SelectItem>
                      <SelectItem value="Asia/Qatar">قطر (GMT+3)</SelectItem>
                      <SelectItem value="Africa/Cairo">القاهرة (GMT+2)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>ملاحظة:</strong> تؤثر هذه الإعدادات على عرض التواريخ والأوقات في جميع أنحاء النظام.
                  تأكد من اختيار الإعدادات المناسبة لموقعك الجغرافي.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>إعدادات الإشعارات</CardTitle>
                  <CardDescription>تخصيص طريقة استلام الإشعارات</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="email_notifications" className="text-base">
                    إشعارات البريد الإلكتروني
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    استلام إشعارات عبر البريد الإلكتروني عند حدوث أحداث مهمة
                  </p>
                </div>
                <Switch
                  id="email_notifications"
                  checked={settings.email_notifications}
                  onCheckedChange={(checked) => updateSetting('email_notifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="sms_notifications" className="text-base">
                    إشعارات الرسائل النصية
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    استلام إشعارات عبر الرسائل النصية (SMS) للتنبيهات العاجلة
                  </p>
                </div>
                <Switch
                  id="sms_notifications"
                  checked={settings.sms_notifications}
                  onCheckedChange={(checked) => updateSetting('sms_notifications', checked)}
                />
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>تنويه:</strong> قد تخضع الرسائل النصية لرسوم إضافية حسب باقتك.
                  يُنصح بتفعيل الإشعارات المهمة فقط.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GeneralSettings;
