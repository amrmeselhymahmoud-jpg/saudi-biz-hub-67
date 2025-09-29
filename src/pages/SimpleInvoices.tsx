import { FileText } from "lucide-react";

const SimpleInvoices = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">فواتير بسيطة</h1>
      </div>
      <p className="text-muted-foreground">صفحة إدارة الفواتير البسيطة</p>
    </div>
  );
};

export default SimpleInvoices;
