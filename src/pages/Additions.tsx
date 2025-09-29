import { Plus } from "lucide-react";

const Additions = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Plus className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">الإضافات</h1>
      </div>
      <p className="text-muted-foreground">صفحة إدارة الإضافات</p>
    </div>
  );
};

export default Additions;
