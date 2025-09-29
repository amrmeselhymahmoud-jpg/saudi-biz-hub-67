import { Building2 } from "lucide-react";

const Suppliers = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">الموردين</h1>
      </div>
      <p className="text-muted-foreground">صفحة إدارة الموردين</p>
    </div>
  );
};

export default Suppliers;
