import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, BarChart3, Shield, Smartphone, Cloud, Users, Zap, CreditCard, FileText, Settings, Headphones } from "lucide-react";
import QoyodHeader from "@/components/QoyodHeader";

const FeaturesPage = () => {
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();

  const mainFeatures = [
    {
      icon: BarChart3,
      title: isRTL ? "التقارير والتحليلات" : "Reports & Analytics",
      description: isRTL 
        ? "تقارير مفصلة وتحليلات ذكية لمساعدتك في اتخاذ قرارات مدروسة"
        : "Detailed reports and smart analytics to help you make informed decisions"
    },
    {
      icon: Shield,
      title: isRTL ? "الأمان والحماية" : "Security & Protection", 
      description: isRTL
        ? "حماية متقدمة لبياناتك مع تشفير عالي المستوى وأمان كامل"
        : "Advanced data protection with high-level encryption and complete security"
    },
    {
      icon: Smartphone,
      title: isRTL ? "الوصول من أي مكان" : "Access Anywhere",
      description: isRTL
        ? "إدارة أعمالك من الهاتف أو الكمبيوتر بسهولة تامة"
        : "Manage your business from phone or computer with complete ease"
    },
    {
      icon: Cloud,
      title: isRTL ? "التخزين السحابي" : "Cloud Storage",
      description: isRTL
        ? "جميع بياناتك محفوظة في السحابة مع إمكانية الوصول الفوري"
        : "All your data is saved in the cloud with instant access"
    }
  ];

  const businessFeatures = [
    {
      icon: Users,
      title: isRTL ? "إدارة الموظفين" : "Employee Management",
      description: isRTL ? "نظام شامل لإدارة الموظفين والحضور والانصراف" : "Complete system for employee and attendance management"
    },
    {
      icon: CreditCard,
      title: isRTL ? "المحاسبة المالية" : "Financial Accounting", 
      description: isRTL ? "نظام محاسبي متكامل لإدارة الفواتير والمدفوعات" : "Integrated accounting system for invoice and payment management"
    },
    {
      icon: FileText,
      title: isRTL ? "إدارة المستندات" : "Document Management",
      description: isRTL ? "تنظيم وحفظ جميع المستندات بطريقة احترافية" : "Organize and save all documents professionally"
    },
    {
      icon: Zap,
      title: isRTL ? "الأتمتة الذكية" : "Smart Automation",
      description: isRTL ? "أتمتة المهام الروتينية لتوفير الوقت والجهد" : "Automate routine tasks to save time and effort"
    },
    {
      icon: Settings,
      title: isRTL ? "التخصيص الكامل" : "Full Customization",
      description: isRTL ? "تخصيص النظام ليناسب احتياجات شركتك" : "Customize the system to fit your company needs"
    },
    {
      icon: Headphones,
      title: isRTL ? "الدعم المستمر" : "24/7 Support",
      description: isRTL ? "دعم فني متاح على مدار الساعة" : "Technical support available around the clock"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20" dir={isRTL ? 'rtl' : 'ltr'}>
      <QoyodHeader />
      
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            {isRTL ? "مميزات النظام" : "System Features"}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {isRTL 
              ? "اكتشف مجموعة شاملة من المميزات المصممة خصيصاً لتلبية احتياجات شركتك وتطوير أعمالك"
              : "Discover a comprehensive set of features designed specifically to meet your company's needs and develop your business"
            }
          </p>
        </div>

        {/* Main Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            {isRTL ? "المميزات الأساسية" : "Core Features"}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mainFeatures.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-all duration-300 hover:scale-105 border-primary/10">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-lg text-foreground">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Business Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            {isRTL ? "مميزات الأعمال" : "Business Features"}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businessFeatures.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-all duration-300 border-primary/10">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl text-foreground">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <Card className="p-8 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              {isRTL ? "جرب جميع المميزات مجاناً" : "Try All Features for Free"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              {isRTL 
                ? "احصل على تجربة مجانية لمدة 30 يوماً واكتشف كيف يمكن لنظامنا تحسين إدارة أعمالك"
                : "Get a free 30-day trial and discover how our system can improve your business management"
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => navigate("/free-trial")}
                className="bg-gradient-primary hover:opacity-90"
              >
                {isRTL ? "ابدأ التجربة المجانية" : "Start Free Trial"}
                {isRTL ? <ArrowLeft className="w-4 h-4 mr-2" /> : <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate("/")}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                {isRTL ? "العودة للرئيسية" : "Back to Home"}
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default FeaturesPage;