import { Settings } from "lucide-react";

const GeneralSettings = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">الإعدادات العامة</h1>
      </div>
      <p className="text-muted-foreground">صفحة الإعدادات العامة</p>
    </div>
  );
};

export default GeneralSettings;
