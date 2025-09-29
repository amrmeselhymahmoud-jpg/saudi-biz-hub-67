import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Features = () => {
  const features = [
    {
      icon: "💰",
      title: "النظام المحاسبي",
      description: "محاسبة شاملة متوافقة مع القوانين السعودية",
      highlights: ["ضريبة القيمة المضافة", "التقارير المالية", "الميزانية العمومية"]
    },
    {
      icon: "📊",
      title: "إدارة المبيعات",
      description: "نظام مبيعات متطور لإدارة العملاء والفواتير",
      highlights: ["فواتير إلكترونية", "متابعة العملاء", "تحليل المبيعات"]
    },
    {
      icon: "📦",
      title: "إدارة المخزون",
      description: "تتبع المنتجات والمخزون بدقة عالية",
      highlights: ["تتبع المخزون", "تنبيهات النفاد", "باركود المنتجات"]
    },
    {
      icon: "👥",
      title: "إدارة العملاء",
      description: "قاعدة بيانات شاملة للعملاء والموردين",
      highlights: ["سجل العملاء", "تاريخ المعاملات", "تقييم الائتمان"]
    },
    {
      icon: "📈",
      title: "التقارير المالية",
      description: "تقارير مفصلة وتحليلات ذكية للأعمال",
      highlights: ["تقارير فورية", "تحليل الأداء", "رسوم بيانية"]
    },
    {
      icon: "🏪",
      title: "أنواع الأنشطة",
      description: "دعم جميع الأنشطة التجارية في السعودية",
      highlights: ["تجارة التجزئة", "الخدمات", "التصنيع"]
    }
  ];

  return (
    <section id="features" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            مميزات النظام
          </Badge>
          <h2 className="text-3xl lg:text-5xl font-bold mb-6">
            كل ما تحتاجه لإدارة أعمالك
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            منصة شاملة ومتكاملة تضم جميع الأدوات اللازمة لإدارة نشاطك التجاري بكفاءة عالية
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="bg-gradient-card border-0 shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-2">
              <CardHeader className="text-center">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {feature.highlights.map((highlight, idx) => (
                    <div key={idx} className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-primary rounded-full ml-2"></div>
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;