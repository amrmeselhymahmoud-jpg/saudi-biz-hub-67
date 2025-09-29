import QoyodHeader from "@/components/QoyodHeader";
import QoyodLogin from "@/components/QoyodLogin";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect } from "react";

const Index = () => {
  const { isRTL } = useLanguage();
  
  useEffect(() => {
    console.log("Index page loaded - checking background animation");
    const backgroundElement = document.querySelector('.animate-grid-move');
    console.log("Background element found:", backgroundElement);
  }, []);
  
  return (
    <div className="min-h-screen relative overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        {/* Simple gradient background that should definitely work */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50"></div>
        
        {/* Floating shapes with simple animations */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200/30 rounded-full animate-bounce"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-indigo-200/40 rounded-full animate-pulse"></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-purple-200/20 rounded-full animate-ping"></div>
        <div className="absolute bottom-20 right-10 w-28 h-28 bg-blue-300/25 rounded-full animate-spin" style={{animationDuration: '8s'}}></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'linear-gradient(to right, #3b82f6 1px, transparent 1px), linear-gradient(to bottom, #3b82f6 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>
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
