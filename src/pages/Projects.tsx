import { Briefcase } from "lucide-react";

const Projects = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Briefcase className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">المشاريع</h1>
      </div>
      <p className="text-muted-foreground">صفحة إدارة المشاريع</p>
    </div>
  );
};

export default Projects;
