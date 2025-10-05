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
    const checkUser = () => {
      const session = localStorage.getItem('demo_session');
      if (session) {
        const sessionData = JSON.parse(session);
        // Check if session is still valid
        if (sessionData.expires_at > Date.now()) {
          navigate("/dashboard");
        } else {
          // Clear expired session
          localStorage.removeItem('demo_session');
        }
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate input data
      const validatedData = loginSchema.parse({
        email: loginData.email.trim(),
        password: loginData.password
      });

      // Check localStorage for demo mode
      const storedUsers = localStorage.getItem('demo_users');

      if (!storedUsers) {
        throw new Error("لا يوجد حسابات مسجلة. يرجى إنشاء حساب جديد أولاً");
      }

      const users = JSON.parse(storedUsers);
      const user = users.find((u: any) =>
        u.email.toLowerCase() === validatedData.email.toLowerCase() &&
        u.password === validatedData.password
      );

      if (!user) {
        throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      }

      // Store session in localStorage
      const session = {
        user: {
          id: user.id,
          email: user.email,
          user_metadata: {
            display_name: user.displayName,
            company_name: user.companyName,
            business_type: user.businessType
          }
        },
        access_token: 'demo_token_' + Date.now(),
        expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000
      };

      localStorage.setItem('demo_session', JSON.stringify(session));

      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: `مرحباً بك ${user.displayName}`
      });

      // Clear form
      setLoginData({ email: "", password: "" });

      // Navigate to dashboard
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
        window.location.reload();
      }, 500);

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
          description: error instanceof Error ? error.message : "حدث خطأ أثناء تسجيل الدخول",
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
      // Validate input data
      const validatedData = signupSchema.parse({
        email: signupData.email.trim(),
        password: signupData.password,
        confirmPassword: signupData.confirmPassword,
        displayName: signupData.displayName.trim(),
        companyName: signupData.companyName.trim(),
        businessType: signupData.businessType
      });

      // Use localStorage for demo mode
      const storedUsers = localStorage.getItem('demo_users');
      const users = storedUsers ? JSON.parse(storedUsers) : [];

      // Check if email already exists (case insensitive)
      const existingUser = users.find((u: any) =>
        u.email.toLowerCase() === validatedData.email.toLowerCase()
      );

      if (existingUser) {
        toast({
          title: "الحساب موجود مسبقاً",
          description: "هذا البريد الإلكتروني مسجل مسبقاً. يرجى تسجيل الدخول بدلاً من ذلك.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Create new user
      const newUser = {
        id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        email: validatedData.email.toLowerCase(),
        password: validatedData.password,
        displayName: validatedData.displayName,
        companyName: validatedData.companyName,
        businessType: validatedData.businessType,
        createdAt: new Date().toISOString()
      };

      // Save user
      users.push(newUser);
      localStorage.setItem('demo_users', JSON.stringify(users));

      // Create session
      const session = {
        user: {
          id: newUser.id,
          email: newUser.email,
          user_metadata: {
            display_name: newUser.displayName,
            company_name: newUser.companyName,
            business_type: newUser.businessType
          }
        },
        access_token: 'demo_token_' + Date.now(),
        expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000
      };

      localStorage.setItem('demo_session', JSON.stringify(session));

      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: `مرحباً بك ${newUser.displayName}! يتم الآن تحويلك إلى لوحة التحكم...`
      });

      // Reset form
      setSignupData({
        email: "",
        password: "",
        confirmPassword: "",
        displayName: "",
        companyName: "",
        businessType: ""
      });

      // Navigate to dashboard
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
        window.location.reload();
      }, 500);

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
          description: error instanceof Error ? error.message : "حدث خطأ أثناء إنشاء الحساب",
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
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800 text-center font-medium">
                          ليس لديك حساب؟ انتقل إلى تبويب "حساب جديد" لإنشاء حساب
                        </p>
                      </div>
                    </div>

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
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md"
                      disabled={isLoading}
                    >
                      {isLoading ? "جاري إنشاء الحساب..." : "إنشاء حساب جديد"}
                    </Button>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                      <p className="text-xs text-green-800 text-center">
                        بعد إنشاء الحساب، يمكنك تسجيل الدخول مباشرة بنفس البريد الإلكتروني وكلمة المرور
                      </p>
                    </div>
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