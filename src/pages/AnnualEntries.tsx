import { FileEdit } from "lucide-react";

const AnnualEntries = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <FileEdit className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">قيود سنوية</h1>
      </div>
      <p className="text-muted-foreground">صفحة إدارة القيود السنوية</p>
    </div>
  );
};

export default AnnualEntries;
