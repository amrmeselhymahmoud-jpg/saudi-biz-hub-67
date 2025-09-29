import { Wallet } from "lucide-react";

const Payroll = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Wallet className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">الرواتب</h1>
      </div>
      <p className="text-muted-foreground">صفحة إدارة الرواتب</p>
    </div>
  );
};

export default Payroll;
