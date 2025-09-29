import { Layers } from "lucide-react";

const Budgets = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Layers className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">الموازنات</h1>
      </div>
      <p className="text-muted-foreground">صفحة إدارة الموازنات</p>
    </div>
  );
};

export default Budgets;
