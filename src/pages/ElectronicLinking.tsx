import { Link2 } from "lucide-react";

const ElectronicLinking = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Link2 className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">الربط الإلكتروني</h1>
      </div>
      <p className="text-muted-foreground">صفحة الربط الإلكتروني</p>
    </div>
  );
};

export default ElectronicLinking;
