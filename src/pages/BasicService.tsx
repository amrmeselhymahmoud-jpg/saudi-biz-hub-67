import { Info } from "lucide-react";

const BasicService = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Info className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">خدمة الأساسي</h1>
      </div>
      <p className="text-muted-foreground">صفحة خدمة الأساسي</p>
    </div>
  );
};

export default BasicService;
