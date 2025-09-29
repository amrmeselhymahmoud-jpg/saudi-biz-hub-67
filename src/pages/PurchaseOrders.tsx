import { ClipboardList } from "lucide-react";

const PurchaseOrders = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <ClipboardList className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">أوامر الشراء</h1>
      </div>
      <p className="text-muted-foreground">صفحة إدارة أوامر الشراء</p>
    </div>
  );
};

export default PurchaseOrders;
