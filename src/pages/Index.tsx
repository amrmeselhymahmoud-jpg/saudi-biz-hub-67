import QoyodHeader from "@/components/QoyodHeader";
import QoyodLogin from "@/components/QoyodLogin";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const { isRTL } = useLanguage();
  
  return (
    <div className="min-h-screen" dir={isRTL ? "rtl" : "ltr"}>
      <QoyodHeader />
      <QoyodLogin />
    </div>
  );
};

export default Index;
