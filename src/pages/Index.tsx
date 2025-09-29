import QoyodHeader from "@/components/QoyodHeader";
import QoyodLogin from "@/components/QoyodLogin";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const { isRTL } = useLanguage();
  
  return (
    <div className="min-h-screen relative" dir={isRTL ? "rtl" : "ltr"}>
      {/* Simple but visible animated background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-100 to-indigo-200">
        {/* Large visible animated elements */}
        <div className="absolute top-10 left-10 w-40 h-40 bg-blue-400/50 rounded-full animate-bounce"></div>
        <div className="absolute top-20 right-16 w-32 h-32 bg-purple-400/40 rounded-full animate-pulse"></div>
        <div className="absolute bottom-24 left-20 w-36 h-36 bg-pink-400/30 rounded-full animate-ping"></div>
        <div className="absolute bottom-16 right-12 w-28 h-28 bg-indigo-500/50 rounded-full animate-spin" style={{animationDuration: '10s'}}></div>
        
        {/* Moving gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/80 to-blue-50/80"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-20 bg-white/10 backdrop-blur-sm">
        <QoyodHeader />
        <QoyodLogin />
      </div>
    </div>
  );
};

export default Index;
