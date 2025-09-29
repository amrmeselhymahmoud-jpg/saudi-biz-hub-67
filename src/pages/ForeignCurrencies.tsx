import { Coins } from "lucide-react";

const ForeignCurrencies = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Coins className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">العملات الأجنبية</h1>
      </div>
      <p className="text-muted-foreground">صفحة إدارة العملات الأجنبية</p>
    </div>
  );
};

export default ForeignCurrencies;
