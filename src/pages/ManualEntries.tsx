import { FileEdit } from "lucide-react";

const ManualEntries = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <FileEdit className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">قيود محاسبية يدوية</h1>
      </div>
      <p className="text-muted-foreground">صفحة إدارة القيود المحاسبية اليدوية</p>
    </div>
  );
};

export default ManualEntries;
