import { Repeat } from "lucide-react";

const AccountTransferService = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Repeat className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">خدمة نقل الحسابات</h1>
      </div>
      <p className="text-muted-foreground">صفحة خدمة نقل الحسابات</p>
    </div>
  );
};

export default AccountTransferService;
