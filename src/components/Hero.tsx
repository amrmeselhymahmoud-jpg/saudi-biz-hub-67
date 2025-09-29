import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import heroImage from "@/assets/hero-business.jpg";

const Hero = () => {
  return (
    <section className="relative py-20 bg-gradient-hero overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-right space-y-8">
            <Badge variant="secondary" className="bg-secondary/20 text-secondary border-secondary/30">
              🇸🇦 خدمة سعودية متطورة
            </Badge>
            
            <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight">
              منصة الأعمال
              <span className="block text-accent">الشاملة</span>
            </h1>
            
            <p className="text-xl text-white/90 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              نظام إدارة شامل لجميع الأنشطة التجارية في المملكة العربية السعودية. 
              محاسبة، مبيعات، مخزون، وتقارير مالية في منصة واحدة متكاملة.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-medium">
                ابدأ التجربة المجانية
                <span className="mr-2">←</span>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                شاهد العرض التوضيحي
              </Button>
            </div>
            
            <div className="flex items-center justify-center lg:justify-start space-x-8 rtl:space-x-reverse text-white/80">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold">1000+</span>
                <span className="text-sm">منشأة تجارية</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold">99.9%</span>
                <span className="text-sm">وقت التشغيل</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold">24/7</span>
                <span className="text-sm">دعم فني</span>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-strong">
              <img 
                src={heroImage} 
                alt="منصة إدارة الأعمال السعودية"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>
            </div>
            
            {/* شارات متحركة */}
            <div className="absolute -top-4 -right-4 bg-card p-4 rounded-xl shadow-medium animate-pulse">
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">+25%</div>
                <div className="text-sm text-muted-foreground">نمو الأرباح</div>
              </div>
            </div>
            
            <div className="absolute -bottom-4 -left-4 bg-card p-4 rounded-xl shadow-medium animate-pulse delay-1000">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">50%</div>
                <div className="text-sm text-muted-foreground">توفير الوقت</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;