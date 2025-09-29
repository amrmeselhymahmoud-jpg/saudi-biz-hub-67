import { FileBox } from "lucide-react";

const CommercialDocuments = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <FileBox className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">المستندات التجارية</h1>
      </div>
      <p className="text-muted-foreground">صفحة إدارة المستندات التجارية</p>
    </div>
  );
};

export default CommercialDocuments;
