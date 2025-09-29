import { BarChart3 } from "lucide-react";

const ProjectReports = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">تقارير المشاريع</h1>
      </div>
      <p className="text-muted-foreground">صفحة تقارير المشاريع</p>
    </div>
  );
};

export default ProjectReports;
