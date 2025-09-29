import { FileBox } from "lucide-react";

const CustomerBonds = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <FileBox className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">سندات العملاء</h1>
      </div>
      <p className="text-muted-foreground">صفحة إدارة سندات العملاء</p>
    </div>
  );
};

export default CustomerBonds;
