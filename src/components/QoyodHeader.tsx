import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Globe, X } from "lucide-react";

const QoyodHeader = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showNotification, setShowNotification] = useState(true);
  const [currentLang, setCurrentLang] = useState("AR");

  const handleFreeTrialClick = () => {
    navigate("/free-trial");
  };

  const handleLoginClick = () => {
    toast({
      title: "تسجيل الدخول",
      description: "أنت بالفعل في صفحة تسجيل الدخول",
    });
  };

  const handleLanguageToggle = () => {
    const newLang = currentLang === "AR" ? "EN" : "AR";
    setCurrentLang(newLang);
    toast({
      title: "تغيير اللغة",
      description: `تم تغيير اللغة إلى ${newLang}`,
    });
  };

  const handleCloseNotification = () => {
    setShowNotification(false);
    toast({
      title: "تم إغلاق التنبيه",
      description: "تم إخفاء رسالة التنبيه",
    });
  };
  return (
    <header className="bg-white border-b border-qoyod-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* الشعار والملاحة */}
          <div className="flex items-center space-x-8 rtl:space-x-reverse">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-qoyod-navy">QOYOD</h1>
            </div>
            
            <nav className="hidden md:flex items-center space-x-6 rtl:space-x-reverse">
              <button onClick={() => toast({ title: "عن قيود", description: "سيتم توجيهك لصفحة معلومات الشركة" })} className="text-qoyod-text hover:text-primary transition-qoyod">عن قيود</button>
              <button onClick={() => toast({ title: "المزايا", description: "سيتم توجيهك لصفحة المزايا" })} className="text-qoyod-text hover:text-primary transition-qoyod">المزايا</button>
              <button onClick={() => toast({ title: "الأسعار", description: "سيتم توجيهك لصفحة الأسعار" })} className="text-qoyod-text hover:text-primary transition-qoyod">الأسعار</button>
              <button onClick={handleLoginClick} className="text-qoyod-text hover:text-primary transition-qoyod">تسجيل الدخول</button>
            </nav>
          </div>

          {/* أزرار التسجيل */}
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <button 
              onClick={handleLanguageToggle}
              className="flex items-center space-x-2 rtl:space-x-reverse text-sm hover:bg-qoyod-light-blue p-2 rounded-lg transition-qoyod"
            >
              <span className="text-qoyod-muted">{currentLang}</span>
              <div className="w-6 h-6 bg-qoyod-light-blue rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-qoyod">
                <Globe size={12} className="text-primary" />
              </div>
            </button>
            
            <Button 
              variant="outline" 
              className="border-primary text-primary hover:bg-primary hover:text-white transition-qoyod"
              onClick={handleFreeTrialClick}
            >
              ابدأ تجربتنا المجانية
            </Button>
          </div>
        </div>
      </div>
      
      {/* شريط التنبيه */}
      {showNotification && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2">
          <div className="container mx-auto">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-600 text-center flex-1">
                يجب تسجيل الدخول أو الاشتراك قبل المتابعة
              </p>
              <button 
                onClick={handleCloseNotification}
                className="text-red-800 hover:text-red-900 hover:bg-red-100 p-1 rounded transition-qoyod"
                aria-label="إغلاق التنبيه"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default QoyodHeader;