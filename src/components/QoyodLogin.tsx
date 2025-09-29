import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

const QoyodLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: t('message.dataError'),
        description: t('message.emailPasswordRequired'),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // محاكاة عملية تسجيل الدخول
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: t('message.loginSuccess'),
        description: t('message.welcomeQoyod'),
      });
    } catch (error) {
      toast({
        title: t('message.loginError'),
        description: t('message.tryAgain'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFreeTrialClick = () => {
    navigate("/free-trial");
  };

  const handleForgotPassword = () => {
    toast({
      title: t('message.passwordReset'),
      description: t('message.passwordResetDesc'),
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* القسم الأيسر - النموذج */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white/80 backdrop-blur-sm">
        <div className="w-full max-w-md space-y-8">
          {/* العنوان الرئيسي */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-qoyod-text mb-2">
              {t('login.welcome')}
            </h1>
          </div>

          {/* نموذج تسجيل الدخول */}
          <form onSubmit={handleLogin}>
            <Card className="border-qoyod-border shadow-card">
              <CardContent className="p-8 space-y-6">
                {/* البريد الإلكتروني */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-qoyod-text font-medium">
                  البريد الإلكتروني <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@gmail.com مثال:"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-qoyod-border focus:border-primary focus:ring-primary pr-12"
                    dir="ltr"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-qoyod-muted">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* كلمة المرور */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-qoyod-text font-medium">
                    كلمة المرور <span className="text-red-500">*</span>
                  </Label>
                  <button 
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-primary text-sm hover:underline"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="يرجى إدخال كلمة المرور"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-qoyod-border focus:border-primary focus:ring-primary pl-20 pr-12"
                  />
                  {/* أيقونة القفل */}
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-qoyod-muted">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <circle cx="12" cy="16" r="1"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  {/* أيقونة إظهار/إخفاء كلمة المرور */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-10 top-1/2 transform -translate-y-1/2 text-qoyod-muted hover:text-qoyod-text"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      {showPassword ? (
                        <>
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </>
                      ) : (
                        <>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              {/* تذكرني */}
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  className="border-qoyod-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <Label htmlFor="remember" className="text-qoyod-text text-sm">
                  تذكرني
                </Label>
              </div>

                {/* زر تسجيل الدخول */}
                <Button 
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-dark text-white py-3 text-lg font-medium transition-qoyod"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
              </Button>
            </CardContent>
          </Card>

          {/* قسم التجربة المجانية */}
          <Card className="border-qoyod-border border-2 border-dashed bg-qoyod-light-blue/30">
            <CardHeader className="text-center pb-3">
              <CardTitle className="text-lg text-qoyod-text">تجربة مجانية</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-qoyod-muted text-sm">
                لم تسجل بعد؟ جرب قيود مجاناً
              </p>
              <Button 
                variant="outline" 
                className="border-primary text-primary hover:bg-primary hover:text-white transition-qoyod"
                onClick={handleFreeTrialClick}
              >
                ابدأ تجربتك المجانية
              </Button>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>

      {/* القسم الأيمن - الخلفية */}
      <div className="hidden lg:block flex-1 bg-gradient-qoyod overflow-hidden">
        <div className="absolute inset-0 bg-qoyod-navy/10"></div>
        <div className="relative h-full flex items-center justify-center p-12">
          <div className="text-center text-white space-y-6">
            <div className="w-32 h-32 bg-white/20 rounded-full mx-auto flex items-center justify-center mb-8">
              <span className="text-4xl font-bold">ق</span>
            </div>
            <h2 className="text-3xl font-bold">منصة قيود للمحاسبة</h2>
            <p className="text-xl opacity-90 max-w-md">
              النظام الأول لإدارة الأعمال والمحاسبة في المملكة العربية السعودية
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QoyodLogin;