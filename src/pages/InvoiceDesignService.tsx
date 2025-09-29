import { FileText } from "lucide-react";

const InvoiceDesignService = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">خدمة تصميم الشواتير</h1>
      </div>
      <p className="text-muted-foreground">صفحة خدمة تصميم الشواتير</p>
    </div>
  );
};

export default InvoiceDesignService;
