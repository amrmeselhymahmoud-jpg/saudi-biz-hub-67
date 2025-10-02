import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  UserCog,
  Save,
  User,
  Building,
  Phone,
  Mail,
  MapPin,
  Globe,
  CreditCard,
  FileText,
  Camera,
  CheckCircle2
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Profile {
  id: string;
  full_name: string;
  company_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  postal_code: string;
  tax_number: string;
  commercial_register: string;
  avatar_url: string;
  language: string;
  timezone: string;
  currency: string;
}

const ProfileEdit = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    id: '',
    full_name: '',
    company_name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    country: 'السعودية',
    postal_code: '',
    tax_number: '',
    commercial_register: '',
    avatar_url: '',
    language: 'ar',
    timezone: 'Asia/Riyadh',
    currency: 'SAR'
  });

  const countries = [
    'السعودية',
    'الإمارات',
    'الكويت',
    'قطر',
    'البحرين',
    'عمان',
    'مصر',
    'الأردن',
    'لبنان',
    'العراق'
  ];

  const languages = [
    { value: 'ar', label: 'العربية' },
    { value: 'en', label: 'English' }
  ];

  const timezones = [
    { value: 'Asia/Riyadh', label: 'الرياض (GMT+3)' },
    { value: 'Asia/Dubai', label: 'دبي (GMT+4)' },
    { value: 'Asia/Kuwait', label: 'الكويت (GMT+3)' },
    { value: 'Asia/Qatar', label: 'الدوحة (GMT+3)' },
    { value: 'Asia/Bahrain', label: 'المنامة (GMT+3)' }
  ];

  const currencies = [
    { value: 'SAR', label: 'ريال سعودي (SAR)' },
    { value: 'AED', label: 'درهم إماراتي (AED)' },
    { value: 'KWD', label: 'دينار كويتي (KWD)' },
    { value: 'QAR', label: 'ريال قطري (QAR)' },
    { value: 'BHD', label: 'دينار بحريني (BHD)' },
    { value: 'OMR', label: 'ريال عماني (OMR)' },
    { value: 'EGP', label: 'جنيه مصري (EGP)' },
    { value: 'JOD', label: 'دينار أردني (JOD)' }
  ];

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProfile({
          ...data,
          email: data.email || user?.email || ''
        });
      } else {
        setProfile(prev => ({
          ...prev,
          id: user?.id || '',
          email: user?.email || ''
        }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل الملف الشخصي",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile.full_name) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال الاسم الكامل",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user?.id)
        .maybeSingle();

      if (existingProfile) {
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: profile.full_name,
            company_name: profile.company_name,
            phone: profile.phone,
            email: profile.email,
            address: profile.address,
            city: profile.city,
            country: profile.country,
            postal_code: profile.postal_code,
            tax_number: profile.tax_number,
            commercial_register: profile.commercial_register,
            language: profile.language,
            timezone: profile.timezone,
            currency: profile.currency,
            updated_at: new Date().toISOString()
          })
          .eq('id', user?.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: user?.id,
            full_name: profile.full_name,
            company_name: profile.company_name,
            phone: profile.phone,
            email: profile.email,
            address: profile.address,
            city: profile.city,
            country: profile.country,
            postal_code: profile.postal_code,
            tax_number: profile.tax_number,
            commercial_register: profile.commercial_register,
            language: profile.language,
            timezone: profile.timezone,
            currency: profile.currency
          });

        if (error) throw error;
      }

      toast({
        title: "تم الحفظ",
        description: "تم حفظ الملف الشخصي بنجاح"
      });
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء حفظ الملف الشخصي",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل الملف الشخصي...</p>
        </div>
      </div>
    );
  };

  const getInitials = () => {
    if (!profile.full_name) return '؟';
    const names = profile.full_name.split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[1][0];
    }
    return profile.full_name[0];
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserCog className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">تعديل الملف الشخصي</h1>
            <p className="text-sm text-muted-foreground">
              قم بتحديث معلوماتك الشخصية والتجارية
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              حفظ التغييرات
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>الصورة الشخصية</CardTitle>
            <CardDescription>صورة الملف الشخصي</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <Avatar className="h-32 w-32">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" className="gap-2" disabled>
              <Camera className="h-4 w-4" />
              تغيير الصورة
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              JPG, GIF أو PNG. حجم أقصى 800KB
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>معلومات سريعة</CardTitle>
            <CardDescription>نظرة عامة على الملف الشخصي</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">الاسم:</span>
                  <span>{profile.full_name || 'غير محدد'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">الشركة:</span>
                  <span>{profile.company_name || 'غير محدد'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">البريد:</span>
                  <span className="truncate">{profile.email || 'غير محدد'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">الهاتف:</span>
                  <span>{profile.phone || 'غير محدد'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">المدينة:</span>
                  <span>{profile.city || 'غير محدد'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">الدولة:</span>
                  <span>{profile.country}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal">المعلومات الشخصية</TabsTrigger>
          <TabsTrigger value="business">المعلومات التجارية</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>المعلومات الشخصية</CardTitle>
              <CardDescription>قم بتحديث معلوماتك الشخصية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full_name">الاسم الكامل *</Label>
                  <Input
                    id="full_name"
                    placeholder="أحمد محمد العلي"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ahmed@example.com"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    placeholder="05xxxxxxxx"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">المدينة</Label>
                  <Input
                    id="city"
                    placeholder="الرياض"
                    value={profile.city}
                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">العنوان</Label>
                <Input
                  id="address"
                  placeholder="الشارع، الحي"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="country">الدولة</Label>
                  <Select
                    value={profile.country}
                    onValueChange={(value) => setProfile({ ...profile, country: value })}
                  >
                    <SelectTrigger id="country">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal_code">الرمز البريدي</Label>
                  <Input
                    id="postal_code"
                    placeholder="12345"
                    value={profile.postal_code}
                    onChange={(e) => setProfile({ ...profile, postal_code: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>المعلومات التجارية</CardTitle>
              <CardDescription>معلومات الشركة والسجلات الرسمية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">اسم الشركة</Label>
                <Input
                  id="company_name"
                  placeholder="شركة الأمثلة المحدودة"
                  value={profile.company_name}
                  onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tax_number">الرقم الضريبي</Label>
                  <Input
                    id="tax_number"
                    placeholder="300000000000003"
                    value={profile.tax_number}
                    onChange={(e) => setProfile({ ...profile, tax_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commercial_register">السجل التجاري</Label>
                  <Input
                    id="commercial_register"
                    placeholder="1010000000"
                    value={profile.commercial_register}
                    onChange={(e) => setProfile({ ...profile, commercial_register: e.target.value })}
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium text-blue-900">معلومات مهمة</p>
                    <p className="text-sm text-blue-800">
                      الرقم الضريبي والسجل التجاري مطلوبان للفواتير الضريبية والمستندات الرسمية.
                      تأكد من صحة البيانات قبل الحفظ.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الإعدادات العامة</CardTitle>
              <CardDescription>إعدادات اللغة والمنطقة الزمنية والعملة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">اللغة</Label>
                <Select
                  value={profile.language}
                  onValueChange={(value) => setProfile({ ...profile, language: value })}
                >
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">المنطقة الزمنية</Label>
                <Select
                  value={profile.timezone}
                  onValueChange={(value) => setProfile({ ...profile, timezone: value })}
                >
                  <SelectTrigger id="timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">العملة الافتراضية</Label>
                <Select
                  value={profile.currency}
                  onValueChange={(value) => setProfile({ ...profile, currency: value })}
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((curr) => (
                      <SelectItem key={curr.value} value={curr.value}>
                        {curr.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-green-900 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              نصائح لإكمال الملف الشخصي
            </h3>
            <ul className="space-y-2 text-sm text-green-800">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>اسم واضح:</strong> استخدم اسمك الكامل لسهولة التعريف
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>معلومات صحيحة:</strong> تأكد من صحة البريد الإلكتروني ورقم الهاتف
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>السجلات الرسمية:</strong> أضف الرقم الضريبي والسجل التجاري للفواتير
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>التحديث المستمر:</strong> حدث معلوماتك عند حدوث أي تغييرات
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileEdit;
