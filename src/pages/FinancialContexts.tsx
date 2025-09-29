import { Layers } from "lucide-react";

const FinancialContexts = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Layers className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">السياقات المالية</h1>
      </div>
      <p className="text-muted-foreground">صفحة إدارة السياقات المالية</p>
    </div>
  );
};

export default FinancialContexts;
