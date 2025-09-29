import { Repeat } from "lucide-react";

const RecurringTransactions = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Repeat className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">المعاملات المتكررة</h1>
      </div>
      <p className="text-muted-foreground">صفحة إدارة المعاملات المتكررة</p>
    </div>
  );
};

export default RecurringTransactions;
