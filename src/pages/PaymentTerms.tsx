import { HandCoins } from "lucide-react";

const PaymentTerms = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <HandCoins className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">شروط الدفع</h1>
      </div>
      <p className="text-muted-foreground">صفحة إدارة شروط الدفع</p>
    </div>
  );
};

export default PaymentTerms;
