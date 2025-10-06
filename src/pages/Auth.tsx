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
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل")
});

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
  const { session, loading } = useAuth();

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
    if (!loading && session) {
      navigate("/dashboard");
    }
  }, [session, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validatedData = loginSchema.parse({
        email: loginData.email.trim(),
        password: loginData.password
      });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password
      });

      if (error) {
        throw error;
      }

      if (data.user && data.session) {
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: `مرحباً بك ${data.user.email}`
        });

        setLoginData({ email: "", password: "" });

        // انتظر قليلاً لتحديث الجلسة
        setTimeout(() => {
          navigate("/dashboard");
        }, 100);
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "خطأ في البيانات",
          description: error.issues[0].message,
          variant: "destructive"
        });
      } else {
        console.error("Login error:", error);
        let errorMessage = "حدث خطأ أثناء تسجيل الدخول";

        if (error.message === "Invalid login credentials" || error.message.includes("Invalid")) {
          errorMessage = "البريد الإلكتروني أو كلمة المرور غير صحيحة";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "يرجى تأكيد بريدك الإلكتروني أولاً";
        }

        toast({
          title: "خطأ في تسجيل الدخول",
          description: errorMessage,
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
      const validatedData = signupSchema.parse({
        email: signupData.email.trim(),
        password: signupData.password,
        confirmPassword: signupData.confirmPassword,
        displayName: signupData.displayName.trim(),
        companyName: signupData.companyName.trim(),
        businessType: signupData.businessType
      });

      const { data, error } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          data: {
            display_name: validatedData.displayName,
            company_name: validatedData.companyName,
            business_type: validatedData.businessType
          },
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        const hasSession = !!data.session;

        toast({
          title: "تم إنشاء الحساب بنجاح",
          description: hasSession
            ? `مرحباً بك ${validatedData.displayName}!`
            : `تم إنشاء الحساب بنجاح. يمكنك الآن تسجيل الدخول`
        });

        setSignupData({
          email: "",
          password: "",
          confirmPassword: "",
          displayName: "",
          companyName: "",
          businessType: ""
        });

        if (hasSession) {
          // انتظر قليلاً لتحديث الجلسة
          setTimeout(() => {
            navigate("/dashboard");
          }, 100);
        }
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "خطأ في البيانات",
          description: error.issues[0].message,
          variant: "destructive"
        });
      } else {
        console.error("Signup error:", error);
        let errorMessage = "حدث خطأ أثناء إنشاء الحساب";

        if (error.message.includes("already registered") || error.message.includes("already been registered") || error.message.includes("User already registered")) {
          errorMessage = "هذا البريد الإلكتروني مسجل مسبقاً. حاول تسجيل الدخول";
        } else if (error.message.includes("password")) {
          errorMessage = "كلمة المرور ضعيفة جداً";
        }

        toast({
          title: "خطأ في إنشاء الحساب",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="mb-6"
          >
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة إلى الصفحة الرئيسية
          </Button>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-qoyod-text mb-4">
              مرحباً بك في قيود
            </h1>
            <p className="text-lg text-qoyod-muted">
              سجل دخولك أو أنشئ حساباً جديداً
            </p>
          </div>

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
                          required
                          disabled={isLoading}
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
                          required
                          disabled={isLoading}
                        />
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-qoyod-muted h-4 w-4" />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-md"
                      disabled={isLoading}
                    >
                      {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                    </Button>
                  </form>
                </TabsContent>

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
                          required
                          disabled={isLoading}
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
                          required
                          disabled={isLoading}
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
                          required
                          disabled={isLoading}
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
                        required
                        disabled={isLoading}
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
                          required
                          disabled={isLoading}
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
                          required
                          disabled={isLoading}
                        />
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-qoyod-muted h-4 w-4" />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md"
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

      <EnhancedBackground />
    </div>
  );
};

export default Auth;
