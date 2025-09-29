import { Receipt } from "lucide-react";

const SalesInvoices = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Receipt className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">فواتير المبيعات</h1>
      </div>
      <p className="text-muted-foreground">صفحة إدارة فواتير المبيعات</p>
    </div>
  );
};

export default SalesInvoices;
