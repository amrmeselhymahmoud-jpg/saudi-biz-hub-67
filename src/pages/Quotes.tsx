import { FileText } from "lucide-react";

const Quotes = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">عروض الأسعار</h1>
      </div>
      <p className="text-muted-foreground">صفحة إدارة عروض الأسعار</p>
    </div>
  );
};

export default Quotes;
