import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Building2, Mail, Phone, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

// Schema validation
const trialRequestSchema = z.object({
  companyName: z.string().trim().min(1, "اسم المنشأة مطلوب").max(100, "اسم المنشأة يجب أن يكون أقل من 100 حرف"),
  fullName: z.string().trim().min(1, "الاسم الكامل مطلوب").max(100, "الاسم يجب أن يكون أقل من 100 حرف"),
  email: z.string().trim().email("البريد الإلكتروني غير صحيح").max(255, "البريد الإلكتروني طويل جداً"),
  phone: z.string().trim().min(1, "رقم الهاتف مطلوب").max(20, "رقم الهاتف طويل جداً"),
  businessType: z.string().min(1, "نوع النشاط التجاري مطلوب"),
  agreeToTerms: z.boolean().refine(val => val === true, "يجب الموافقة على الشروط")
});

const FreeTrial = () => {
  const [formData, setFormData] = useState({
    companyName: "",
    fullName: "",
    email: "",
    phone: "",
    businessType: "",
    agreeToTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const businessTypes = [
    "تجارة التجزئة",
    "الخدمات",
    "التصنيع",
    "المقاولات",
    "التجارة الإلكترونية",
    "المطاعم والضيافة",
    "الاستشارات",
    "أخرى"
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Validate form data
      const validatedData = trialRequestSchema.parse(formData);
      
      // Save to Supabase
      const { error } = await supabase
        .from('trial_requests')
        .insert({
          company_name: validatedData.companyName,
          full_name: validatedData.fullName,
          email: validatedData.email,
          phone: validatedData.phone,
          business_type: validatedData.businessType,
          terms_agreed: validatedData.agreeToTerms
        });

      if (error) {
        throw error;
      }

      // Send confirmation email
      try {
        const emailResponse = await supabase.functions.invoke('send-trial-confirmation', {
          body: {
            fullName: validatedData.fullName,
            email: validatedData.email,
            companyName: validatedData.companyName,
            businessType: validatedData.businessType
          }
        });

        if (emailResponse.error) {
          console.error('Error sending confirmation email:', emailResponse.error);
          toast({
            title: "تم إنشاء حسابك بنجاح!",
            description: "تم حفظ بياناتك، ولكن حدث خطأ في إرسال رسالة التأكيد. سيتم التواصل معك قريباً",
          });
        } else {
          toast({
            title: "تم إنشاء حسابك بنجاح!",
            description: "مرحباً بك في قيود. تم إرسال رسالة تأكيد على البريد الإلكتروني",
          });
        }
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
        toast({
          title: "تم إنشاء حسابك بنجاح!",
          description: "تم حفظ بياناتك، ولكن حدث خطأ في إرسال رسالة التأكيد. سيتم التواصل معك قريباً",
        });
      }
      
      // Reset form
      setFormData({
        companyName: "",
        fullName: "",
        email: "",
        phone: "",
        businessType: "",
        agreeToTerms: false,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const firstError = error.issues[0];
        toast({
          title: "خطأ في البيانات",
          description: firstError.message,
          variant: "destructive",
        });
      } else {
        let errorMessage = "حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى";

        if (error?.message) {
          if (error.message.includes("duplicate") || error.message.includes("already exists")) {
            errorMessage = "هذا البريد الإلكتروني مسجل مسبقاً. يرجى استخدام بريد آخر";
          } else if (error.message.includes("network") || error.message.includes("fetch")) {
            errorMessage = "خطأ في الاتصال بالإنترنت. يرجى التحقق من الاتصال والمحاولة مرة أخرى";
          }
        }

        toast({
          title: "خطأ في التسجيل",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* العودة إلى الصفحة الرئيسية */}
      <div className="container mx-auto px-4 py-6">
        <Button 
          variant="outline" 
          onClick={() => window.history.back()}
          className="mb-6"
        >
          <ArrowRight className="ml-2 h-4 w-4" />
          العودة إلى تسجيل الدخول
        </Button>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* العنوان الرئيسي */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-qoyod-text mb-4">
              ابدأ تجربتك المجانية مع قيود
            </h1>
            <p className="text-lg text-qoyod-muted">
              جرب جميع مميزات قيود مجاناً لمدة 14 يوم دون الحاجة لبطاقة ائتمان
            </p>
          </div>

          {/* نموذج التسجيل */}
          <Card className="border-qoyod-border shadow-card">
            <CardHeader>
              <CardTitle className="text-xl text-center">بيانات المنشأة</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* اسم المنشأة */}
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-qoyod-text font-medium">
                    اسم المنشأة <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="companyName"
                      type="text"
                      placeholder="اسم الشركة أو المؤسسة"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      className="border-qoyod-border focus:border-primary focus:ring-primary pr-12"
                    />
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-qoyod-muted h-4 w-4" />
                  </div>
                </div>

                {/* الاسم الكامل */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-qoyod-text font-medium">
                    الاسم الكامل <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="الاسم الأول والأخير"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className="border-qoyod-border focus:border-primary focus:ring-primary pr-12"
                    />
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-qoyod-muted h-4 w-4" />
                  </div>
                </div>

                {/* البريد الإلكتروني */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-qoyod-text font-medium">
                    البريد الإلكتروني <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="border-qoyod-border focus:border-primary focus:ring-primary pr-12"
                      dir="ltr"
                    />
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-qoyod-muted h-4 w-4" />
                  </div>
                </div>

                {/* رقم الهاتف */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-qoyod-text font-medium">
                    رقم الهاتف <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="05xxxxxxxx"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="border-qoyod-border focus:border-primary focus:ring-primary pr-12"
                      dir="ltr"
                    />
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-qoyod-muted h-4 w-4" />
                  </div>
                </div>

                {/* نوع النشاط التجاري */}
                <div className="space-y-2">
                  <Label htmlFor="businessType" className="text-qoyod-text font-medium">
                    نوع النشاط التجاري <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="businessType"
                    value={formData.businessType}
                    onChange={(e) => handleInputChange('businessType', e.target.value)}
                    className="w-full p-3 border border-qoyod-border rounded-md focus:border-primary focus:ring-primary focus:ring-1 focus:outline-none"
                  >
                    <option value="">اختر نوع النشاط</option>
                    {businessTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* الموافقة على الشروط */}
                <div className="flex items-start space-x-2 rtl:space-x-reverse">
                  <Checkbox
                    id="terms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, agreeToTerms: checked === true }))}
                    className="border-qoyod-border data-[state=checked]:bg-primary data-[state=checked]:border-primary mt-1"
                  />
                  <Label htmlFor="terms" className="text-qoyod-text text-sm leading-relaxed">
                    أوافق على{" "}
                    <button type="button" className="text-primary hover:underline">
                      شروط الاستخدام
                    </button>
                    {" "}و{" "}
                    <button type="button" className="text-primary hover:underline">
                      سياسة الخصوصية
                    </button>
                  </Label>
                </div>

                {/* زر التسجيل */}
                <Button 
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-dark text-white py-3 text-lg font-medium transition-qoyod"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? "جاري إنشاء الحساب..." : "ابدأ تجربتك المجانية الآن"}
                </Button>

                {/* رسالة إضافية */}
                <div className="text-center text-sm text-qoyod-muted">
                  <p>✅ 14 يوم تجربة مجانية</p>
                  <p>✅ لا توجد رسوم خفية</p>
                  <p>✅ إلغاء في أي وقت</p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FreeTrial;