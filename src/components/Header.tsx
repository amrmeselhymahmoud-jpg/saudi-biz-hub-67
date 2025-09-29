import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="bg-card/80 backdrop-blur-sm border-b border-border shadow-soft sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">ق</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">منصة الأعمال</h1>
              <p className="text-sm text-muted-foreground">نظام إدارة شامل</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8 rtl:space-x-reverse">
            <a href="#features" className="text-foreground hover:text-primary transition-smooth">المميزات</a>
            <a href="#services" className="text-foreground hover:text-primary transition-smooth">الخدمات</a>
            <a href="#pricing" className="text-foreground hover:text-primary transition-smooth">الأسعار</a>
            <a href="#contact" className="text-foreground hover:text-primary transition-smooth">اتصل بنا</a>
          </nav>

          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <Button variant="outline" className="hidden sm:flex" onClick={() => window.location.href = '/auth'}>
              تسجيل الدخول
            </Button>
            <Button variant="default" className="bg-gradient-primary hover:opacity-90" onClick={() => window.location.href = '/free-trial'}>
              ابدأ التجربة المجانية
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;