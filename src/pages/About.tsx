import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, Users, Target, Award } from "lucide-react";
import QoyodHeader from "@/components/QoyodHeader";

const About = () => {
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();

  const stats = [
    { number: "10+", label: isRTL ? "سنوات من الخبرة" : "Years of Experience" },
    { number: "1000+", label: isRTL ? "عميل راضٍ" : "Satisfied Clients" },
    { number: "99%", label: isRTL ? "معدل الرضا" : "Satisfaction Rate" },
    { number: "24/7", label: isRTL ? "دعم فني" : "Technical Support" }
  ];

  const values = [
    {
      icon: Target,
      title: isRTL ? "رؤيتنا" : "Our Vision",
      description: isRTL 
        ? "أن نكون الشريك الأول للشركات في رحلتها نحو التحول الرقمي وإدارة الأعمال بذكاء"
        : "To be the leading partner for companies in their digital transformation journey"
    },
    {
      icon: Users,
      title: isRTL ? "مهمتنا" : "Our Mission", 
      description: isRTL
        ? "تقديم حلول تقنية مبتكرة وموثوقة تساعد الشركات على تحقيق أهدافها وتحسين كفاءتها"
        : "Providing innovative and reliable technical solutions to help companies achieve their goals"
    },
    {
      icon: Award,
      title: isRTL ? "قيمنا" : "Our Values",
      description: isRTL
        ? "الشفافية والجودة والابتكار المستمر في خدمة عملائنا وتحقيق توقعاتهم"
        : "Transparency, quality, and continuous innovation in serving our clients"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20" dir={isRTL ? 'rtl' : 'ltr'}>
      <QoyodHeader />
      
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            {isRTL ? "من نحن" : "About Us"}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {isRTL 
              ? "نحن فريق من الخبراء المتخصصين في تطوير حلول الأعمال الذكية، نسعى لتمكين الشركات من تحقيق أقصى استفادة من التكنولوجيا لتطوير أعمالها وزيادة كفاءتها التشغيلية"
              : "We are a team of experts specialized in developing smart business solutions, seeking to enable companies to maximize their benefits from technology to develop their business and increase operational efficiency"
            }
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center p-6 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-0">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {stat.number}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            {isRTL ? "قيمنا ومبادئنا" : "Our Values & Principles"}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-all duration-300 border-primary/10">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl text-foreground">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center leading-relaxed">
                    {value.description}
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
              {isRTL ? "جاهز لتبدأ رحلتك معنا؟" : "Ready to Start Your Journey With Us?"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              {isRTL 
                ? "انضم إلى آلاف الشركات التي تثق في حلولنا لإدارة أعمالها بكفاءة وذكاء"
                : "Join thousands of companies that trust our solutions to manage their business efficiently and intelligently"
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

export default About;