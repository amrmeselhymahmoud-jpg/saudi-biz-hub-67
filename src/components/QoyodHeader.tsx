import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const QoyodHeader = () => {
  const { toast } = useToast();

  const handleFreeTrialClick = () => {
    toast({
      title: "التجربة المجانية",
      description: "سيتم توجيهك لصفحة التسجيل للتجربة المجانية",
    });
  };

  const handleLoginClick = () => {
    toast({
      title: "تسجيل الدخول",
      description: "أنت بالفعل في صفحة تسجيل الدخول",
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
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm">
              <span className="text-qoyod-muted">EN</span>
              <div className="w-6 h-6 bg-qoyod-light-blue rounded-full flex items-center justify-center">
                <span className="text-xs">🌐</span>
              </div>
            </div>
            
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
      <div className="bg-red-50 border-b border-red-200 px-4 py-2">
        <div className="container mx-auto">
          <p className="text-sm text-red-600 text-center">
            يجب تسجيل الدخول أو الاشتراك قبل المتابعة
            <button className="mr-4 text-red-800 hover:underline">×</button>
          </p>
        </div>
      </div>
    </header>
  );
};

export default QoyodHeader;