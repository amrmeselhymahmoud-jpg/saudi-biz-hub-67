const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <img
                src="/finzo logo-01.svg"
                alt="Finzo Logo"
                className="h-10 w-auto"
              />
              <span className="text-xl font-bold">Finzo</span>
            </div>
            <p className="text-muted-foreground">
              نظام إدارة مالي متكامل للشركات السعودية
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">الخدمات</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-smooth">النظام المحاسبي</a></li>
              <li><a href="#" className="hover:text-primary transition-smooth">إدارة المبيعات</a></li>
              <li><a href="#" className="hover:text-primary transition-smooth">إدارة المخزون</a></li>
              <li><a href="#" className="hover:text-primary transition-smooth">التقارير المالية</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">الدعم</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-smooth">مركز المساعدة</a></li>
              <li><a href="#" className="hover:text-primary transition-smooth">الدعم الفني</a></li>
              <li><a href="#" className="hover:text-primary transition-smooth">التدريب</a></li>
              <li><a href="#" className="hover:text-primary transition-smooth">الأسئلة الشائعة</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">تواصل معنا</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>الرياض، المملكة العربية السعودية</li>
              <li>+966 11 123 4567</li>
              <li>info@finzo.sa</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
          <p>&copy; 2024 Finzo. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;