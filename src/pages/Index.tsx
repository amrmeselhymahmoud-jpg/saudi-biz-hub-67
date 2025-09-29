import QoyodHeader from "@/components/QoyodHeader";
import QoyodLogin from "@/components/QoyodLogin";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const { isRTL } = useLanguage();
  
  return (
    <div className="min-h-screen relative overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/10">
        {/* Floating geometric shapes */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-secondary/30 to-transparent rounded-full blur-lg animate-bounce"></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-gradient-to-br from-accent/15 to-transparent rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 right-10 w-28 h-28 bg-gradient-to-br from-primary/25 to-transparent rounded-full blur-xl animate-bounce delay-500"></div>
        
        {/* Animated grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5 animate-grid-move"></div>
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-transparent to-background/90"></div>
        
        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-primary rounded-full animate-float"></div>
        <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-secondary rounded-full animate-float delay-700"></div>
        <div className="absolute bottom-1/3 left-1/5 w-1.5 h-1.5 bg-accent rounded-full animate-float delay-1500"></div>
        <div className="absolute bottom-1/4 right-1/3 w-2 h-2 bg-primary/70 rounded-full animate-float delay-300"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        <QoyodHeader />
        <QoyodLogin />
      </div>
    </div>
  );
};

export default Index;
