import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Mail, Lock, User, Building2 } from "lucide-react";
import EnhancedBackground from "@/components/animations/EnhancedBackground";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

// Schema validation for login
const loginSchema = z.object({
  email: z.string().trim().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل")
});

// Schema validation for signup
const signupSchema = z.object({
  email: z.string().trim().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  confirmPassword: z.string(),
  displayName: z.string().trim().min(1, "الاسم مطلوب"),
  companyName: z.string().trim().min(1, "اسم الشركة مطلوب"),
  businessType: z.string().min(1, "نوع النشاط مطلوب")
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"]
});

const Auth = () => {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
    companyName: "",
    businessType: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validatedData = loginSchema.parse(loginData);
      
      const { error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
        }
        throw error;
      }

      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك في قيود"
      });

      navigate("/");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "خطأ في البيانات",
          description: error.issues[0].message,
          variant: "destructive"
        });
      } else {
        console.error("Login error:", error);
        toast({
          title: "خطأ في تسجيل الدخول",
          description: error.message || "حدث خطأ أثناء تسجيل الدخول",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validatedData = signupSchema.parse(signupData);
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: validatedData.displayName,
            company_name: validatedData.companyName,
            business_type: validatedData.businessType
          }
        }
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          throw new Error("هذا البريد الإلكتروني مسجل مسبقاً");
        }
        throw error;
      }

      if (data.session) {
        toast({
          title: "تم إنشاء الحساب بنجاح",
          description: "مرحباً بك في قيود"
        });
        navigate("/");
      } else {
        toast({
          title: "تم إنشاء الحساب بنجاح",
          description: "يرجى فحص بريدك الإلكتروني لتأكيد الحساب"
        });
      }

      // Reset form
      setSignupData({
        email: "",
        password: "",
        confirmPassword: "",
        displayName: "",
        companyName: "",
        businessType: ""
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "خطأ في البيانات",
          description: error.issues[0].message,
          variant: "destructive"
        });
      } else {
        console.error("Signup error:", error);
        toast({
          title: "خطأ في إنشاء الحساب",
          description: error.message || "حدث خطأ أثناء إنشاء الحساب",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex"
    >
      {/* القسم الأيسر - النموذج */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* العودة إلى الصفحة الرئيسية */}
          <Button 
            variant="outline" 
            onClick={() => navigate("/")}
            className="mb-6"
          >
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة إلى الصفحة الرئيسية
          </Button>

          {/* العنوان الرئيسي */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-qoyod-text mb-4">
              مرحباً بك في قيود
            </h1>
            <p className="text-lg text-qoyod-muted">
              سجل دخولك أو أنشئ حساباً جديداً
            </p>
          </div>

          {/* نموذج تسجيل الدخول والتسجيل */}
          <Card className="border-qoyod-border shadow-card">
            <CardHeader>
              <CardTitle className="text-xl text-center">دخول النظام</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
                  <TabsTrigger value="signup">حساب جديد</TabsTrigger>
                </TabsList>

                {/* تسجيل الدخول */}
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-qoyod-text">
                        البريد الإلكتروني
                      </Label>
                      <div className="relative">
                        <Input
                          id="email"
                          type="email"
                          placeholder="name@company.com"
                          value={loginData.email}
                          onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                          className="border-qoyod-border focus:border-primary pr-12"
                          dir="ltr"
                        />
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-qoyod-muted h-4 w-4" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-qoyod-text">
                        كلمة المرور
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={loginData.password}
                          onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                          className="border-qoyod-border focus:border-primary pr-12"
                        />
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-qoyod-muted h-4 w-4" />
                      </div>
                    </div>

                    <Button 
                      type="submit"
                      className="w-full bg-primary hover:bg-primary-dark text-white"
                      disabled={isLoading}
                    >
                      {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                    </Button>
                  </form>
                </TabsContent>

                {/* إنشاء حساب جديد */}
                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-qoyod-text">
                        البريد الإلكتروني
                      </Label>
                      <div className="relative">
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="name@company.com"
                          value={signupData.email}
                          onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                          className="border-qoyod-border focus:border-primary pr-12"
                          dir="ltr"
                        />
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-qoyod-muted h-4 w-4" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="display-name" className="text-qoyod-text">
                        الاسم الكامل
                      </Label>
                      <div className="relative">
                        <Input
                          id="display-name"
                          type="text"
                          placeholder="الاسم الأول والأخير"
                          value={signupData.displayName}
                          onChange={(e) => setSignupData({...signupData, displayName: e.target.value})}
                          className="border-qoyod-border focus:border-primary pr-12"
                        />
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-qoyod-muted h-4 w-4" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company-name" className="text-qoyod-text">
                        اسم الشركة
                      </Label>
                      <div className="relative">
                        <Input
                          id="company-name"
                          type="text"
                          placeholder="اسم الشركة أو المؤسسة"
                          value={signupData.companyName}
                          onChange={(e) => setSignupData({...signupData, companyName: e.target.value})}
                          className="border-qoyod-border focus:border-primary pr-12"
                        />
                        <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-qoyod-muted h-4 w-4" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="business-type" className="text-qoyod-text">
                        نوع النشاط التجاري
                      </Label>
                      <select
                        id="business-type"
                        value={signupData.businessType}
                        onChange={(e) => setSignupData({...signupData, businessType: e.target.value})}
                        className="w-full p-3 border border-qoyod-border rounded-md focus:border-primary focus:ring-primary focus:ring-1 focus:outline-none"
                      >
                        <option value="">اختر نوع النشاط</option>
                        {businessTypes.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-qoyod-text">
                        كلمة المرور
                      </Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="••••••••"
                          value={signupData.password}
                          onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                          className="border-qoyod-border focus:border-primary pr-12"
                        />
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-qoyod-muted h-4 w-4" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-qoyod-text">
                        تأكيد كلمة المرور
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="••••••••"
                          value={signupData.confirmPassword}
                          onChange={(e) => setSignupData({...signupData, confirmPassword: e.target.value})}
                          className="border-qoyod-border focus:border-primary pr-12"
                        />
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-qoyod-muted h-4 w-4" />
                      </div>
                    </div>

                    <Button 
                      type="submit"
                      className="w-full bg-primary hover:bg-primary-dark text-white"
                      disabled={isLoading}
                    >
                      {isLoading ? "جاري إنشاء الحساب..." : "إنشاء حساب جديد"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* القسم الأيمن - الخلفية المتحركة */}
      <EnhancedBackground />
    </div>
  );
};

export default Auth;