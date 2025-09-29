import QoyodHeader from "@/components/QoyodHeader";
import QoyodLogin from "@/components/QoyodLogin";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const { isRTL } = useLanguage();
  
  return (
    <div className="min-h-screen relative overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
      {/* Animated Background - covers entire page */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 pointer-events-none">
        {/* Floating animated shapes */}
        <div className="absolute top-16 left-16 w-32 h-32 bg-blue-400/30 rounded-full animate-bounce pointer-events-none"></div>
        <div className="absolute top-32 right-24 w-24 h-24 bg-purple-400/40 rounded-full animate-pulse pointer-events-none"></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-pink-400/25 rounded-full animate-ping pointer-events-none"></div>
        <div className="absolute bottom-20 right-16 w-28 h-28 bg-indigo-500/35 rounded-full animate-spin pointer-events-none" style={{animationDuration: '12s'}}></div>
        
        {/* Additional floating elements */}
        <div className="absolute top-1/2 left-8 w-20 h-20 bg-cyan-400/30 rounded-full animate-bounce pointer-events-none" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/3 right-1/3 w-16 h-16 bg-green-400/40 rounded-full animate-pulse pointer-events-none" style={{animationDelay: '2s'}}></div>
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-white/30 to-white/60 pointer-events-none"></div>
      </div>

      {/* Content with higher z-index */}
      <div className="relative z-20">
        <QoyodHeader />
        <QoyodLogin />
      </div>
    </div>
  );
};

export default Index;
