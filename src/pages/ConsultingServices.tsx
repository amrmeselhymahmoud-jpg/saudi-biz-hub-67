import { HelpCircle } from "lucide-react";

const ConsultingServices = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <HelpCircle className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">الخدمات الاستشارية</h1>
      </div>
      <p className="text-muted-foreground">صفحة الخدمات الاستشارية</p>
    </div>
  );
};

export default ConsultingServices;
