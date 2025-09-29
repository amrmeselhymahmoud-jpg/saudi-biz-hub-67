import { Building2 } from "lucide-react";

const FixedAssets = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">الأصول الثابتة</h1>
      </div>
      <p className="text-muted-foreground">صفحة إدارة الأصول الثابتة</p>
    </div>
  );
};

export default FixedAssets;
