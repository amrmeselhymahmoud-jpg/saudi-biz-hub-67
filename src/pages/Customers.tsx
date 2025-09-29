import { Users } from "lucide-react";

const Customers = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">العملاء</h1>
      </div>
      <p className="text-muted-foreground">صفحة إدارة العملاء</p>
    </div>
  );
};

export default Customers;
