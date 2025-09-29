import { DollarSign } from "lucide-react";

const OpeningBalanceService = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <DollarSign className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">خدمة إدخال الأرصدة الافتتاحية</h1>
      </div>
      <p className="text-muted-foreground">صفحة خدمة إدخال الأرصدة الافتتاحية</p>
    </div>
  );
};

export default OpeningBalanceService;
