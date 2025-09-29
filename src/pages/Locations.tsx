import { MapPin } from "lucide-react";

const Locations = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <MapPin className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">المواقع</h1>
      </div>
      <p className="text-muted-foreground">صفحة إدارة المواقع</p>
    </div>
  );
};

export default Locations;
