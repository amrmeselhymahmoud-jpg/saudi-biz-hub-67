import { Info, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const AboutPageFooter = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <Button 
        variant="outline" 
        onClick={() => navigate("/dashboard")}
        className="mb-6"
      >
        <ArrowRight className="ml-2 h-4 w-4" />
        العودة للوحة التحكم
      </Button>
      
      <div className="flex items-center gap-3 mb-6">
        <Info className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">تعرف على هذه الصفحة</h1>
      </div>
      
      <div className="space-y-6">
        <p className="text-muted-foreground text-lg">
          هذه الصفحة تحتوي على معلومات مفصلة حول النظام ومميزاته.
        </p>
        
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">حول النظام</h2>
          <p className="text-muted-foreground leading-relaxed">
            نظام قيود هو منصة محاسبية شاملة مصممة خصيصاً للشركات السعودية. 
            يوفر النظام جميع الأدوات اللازمة لإدارة الأعمال بكفاءة عالية.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutPageFooter;
