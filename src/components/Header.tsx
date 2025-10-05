import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="bg-card/80 backdrop-blur-sm border-b border-border shadow-soft sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <img
              src="/finzo logo-01.svg"
              alt="Finzo Logo"
              className="h-12 w-auto"
            />
            <div>
              <h1 className="text-xl font-bold text-foreground">Finzo</h1>
              <p className="text-sm text-muted-foreground">نظام إدارة مالي متكامل</p>
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
            <Button variant="default" className="bg-primary hover:bg-primary/90" onClick={() => window.location.href = '/free-trial'}>
              ابدأ التجربة المجانية
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;