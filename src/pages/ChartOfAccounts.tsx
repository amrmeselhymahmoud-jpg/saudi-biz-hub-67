import { FolderTree } from "lucide-react";

const ChartOfAccounts = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <FolderTree className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">شجرة الحسابات</h1>
      </div>
      <p className="text-muted-foreground">صفحة إدارة شجرة الحسابات</p>
    </div>
  );
};

export default ChartOfAccounts;
