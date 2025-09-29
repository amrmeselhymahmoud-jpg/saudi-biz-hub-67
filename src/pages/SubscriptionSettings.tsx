import { CreditCard } from "lucide-react";

const SubscriptionSettings = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">إعدادات الاشتراك</h1>
      </div>
      <div className="bg-green-500/10 text-green-500 px-4 py-2 rounded-lg inline-block mb-4">
        جديد
      </div>
      <p className="text-muted-foreground">صفحة إعدادات الاشتراك</p>
    </div>
  );
};

export default SubscriptionSettings;
