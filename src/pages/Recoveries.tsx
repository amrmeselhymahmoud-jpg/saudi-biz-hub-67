import { Recycle } from "lucide-react";

const Recoveries = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Recycle className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">الاستعادات</h1>
      </div>
      <p className="text-muted-foreground">صفحة إدارة الاستعادات</p>
    </div>
  );
};

export default Recoveries;
