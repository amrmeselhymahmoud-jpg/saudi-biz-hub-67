import { TrendingUp } from "lucide-react";

const Depreciation = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">الإهلاك</h1>
      </div>
      <p className="text-muted-foreground">صفحة إدارة الإهلاك</p>
    </div>
  );
};

export default Depreciation;
