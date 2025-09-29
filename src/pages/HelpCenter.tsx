import { LifeBuoy } from "lucide-react";

const HelpCenter = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <LifeBuoy className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">مركز المساعدة</h1>
      </div>
      <p className="text-muted-foreground">مركز المساعدة والدعم</p>
    </div>
  );
};

export default HelpCenter;
