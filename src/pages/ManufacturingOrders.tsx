import { Factory } from "lucide-react";

const ManufacturingOrders = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Factory className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">أوامر التصنيع</h1>
      </div>
      <p className="text-muted-foreground">صفحة إدارة أوامر التصنيع</p>
    </div>
  );
};

export default ManufacturingOrders;
