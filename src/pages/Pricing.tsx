import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, Check, Star } from "lucide-react";
import QoyodHeader from "@/components/QoyodHeader";

const PricingPage = () => {
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();

  const plans = [
    {
      name: isRTL ? "الباقة الأساسية" : "Basic Plan",
      price: isRTL ? "99 ر.س" : "$29",
      period: isRTL ? "/شهرياً" : "/month",
      description: isRTL ? "مثالية للشركات الناشئة" : "Perfect for startups",
      features: [
        isRTL ? "حتى 5 مستخدمين" : "Up to 5 users",
        isRTL ? "تخزين 10 جيجا" : "10GB storage", 
        isRTL ? "التقارير الأساسية" : "Basic reports",
        isRTL ? "دعم عبر الإيميل" : "Email support",
        isRTL ? "النسخ الاحتياطي اليومي" : "Daily backups"
      ],
      popular: false,
      buttonText: isRTL ? "ابدأ الآن" : "Get Started"
    },
    {
      name: isRTL ? "الباقة المتقدمة" : "Professional Plan",
      price: isRTL ? "199 ر.س" : "$59",
      period: isRTL ? "/شهرياً" : "/month",
      description: isRTL ? "الأكثر شعبية للشركات المتوسطة" : "Most popular for medium businesses",
      features: [
        isRTL ? "حتى 25 مستخدم" : "Up to 25 users",
        isRTL ? "تخزين 100 جيجا" : "100GB storage",
        isRTL ? "تقارير متقدمة وتحليلات" : "Advanced reports & analytics",
        isRTL ? "دعم هاتفي أولوية" : "Priority phone support", 
        isRTL ? "التكامل مع الأنظمة الأخرى" : "Third-party integrations",
        isRTL ? "التخصيص المتقدم" : "Advanced customization",
        isRTL ? "النسخ الاحتياطي كل ساعة" : "Hourly backups"
      ],
      popular: true,
      buttonText: isRTL ? "الأكثر شعبية" : "Most Popular"
    },
    {
      name: isRTL ? "باقة المؤسسات" : "Enterprise Plan",
      price: isRTL ? "مخصص" : "Custom",
      period: "",
      description: isRTL ? "للشركات الكبيرة والمؤسسات" : "For large companies & enterprises",
      features: [
        isRTL ? "مستخدمين غير محدود" : "Unlimited users",
        isRTL ? "تخزين غير محدود" : "Unlimited storage",
        isRTL ? "تقارير مخصصة" : "Custom reports",
        isRTL ? "مدير حساب مخصص" : "Dedicated account manager",
        isRTL ? "تدريب متخصص" : "Specialized training",
        isRTL ? "دعم فني 24/7" : "24/7 technical support",
        isRTL ? "نشر خاص (On-premise)" : "On-premise deployment"
      ],
      popular: false,
      buttonText: isRTL ? "تواصل معنا" : "Contact Us"
    }
  ];

  const faqs = [
    {
      question: isRTL ? "هل يمكنني تغيير الباقة لاحقاً؟" : "Can I change plans later?",
      answer: isRTL 
        ? "نعم، يمكنك ترقية أو تقليل باقتك في أي وقت من لوحة التحكم"
        : "Yes, you can upgrade or downgrade your plan anytime from the dashboard"
    },
    {
      question: isRTL ? "هل التجربة المجانية تتطلب بطاقة ائتمان؟" : "Does the free trial require a credit card?",
      answer: isRTL
        ? "لا، التجربة المجانية لا تتطلب بطاقة ائتمان ولا توجد التزامات مالية"
        : "No, the free trial doesn't require a credit card and there are no financial commitments"
    },
    {
      question: isRTL ? "ما هي طرق الدفع المتاحة؟" : "What payment methods are available?",
      answer: isRTL
        ? "نقبل جميع البطاقات الائتمانية الرئيسية والتحويل البنكي"
        : "We accept all major credit cards and bank transfers"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20" dir={isRTL ? 'rtl' : 'ltr'}>
      <QoyodHeader />
      
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            {isRTL ? "خطط الأسعار" : "Pricing Plans"}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {isRTL 
              ? "اختر الباقة التي تناسب احتياجات شركتك، مع إمكانية التجربة المجانية لجميع الباقات"
              : "Choose the plan that fits your company's needs, with free trial available for all plans"
            }
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative p-6 hover:shadow-lg transition-all duration-300 ${plan.popular ? 'border-primary scale-105' : 'border-primary/10'}`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-primary text-primary-foreground">
                  <Star className="w-3 h-3 mr-1" />
                  {isRTL ? "الأكثر شعبية" : "Most Popular"}
                </Badge>
              )}
              
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl text-foreground mb-2">{plan.name}</CardTitle>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-primary">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-muted-foreground">{plan.description}</p>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full ${plan.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => navigate("/free-trial")}
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            {isRTL ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="p-6 border-primary/10">
                <h3 className="text-lg font-semibold text-foreground mb-3">{faq.question}</h3>
                <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <Card className="p-8 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              {isRTL ? "جاهز لتبدأ؟" : "Ready to Get Started?"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              {isRTL 
                ? "ابدأ تجربتك المجانية اليوم واكتشف كيف يمكن لنظامنا تحسين إدارة أعمالك"
                : "Start your free trial today and discover how our system can improve your business management"
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

export default PricingPage;