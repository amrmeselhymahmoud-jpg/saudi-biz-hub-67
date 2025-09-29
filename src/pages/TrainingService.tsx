import { BookOpen } from "lucide-react";

const TrainingService = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">خدمة التدريب</h1>
      </div>
      <p className="text-muted-foreground">صفحة خدمة التدريب</p>
    </div>
  );
};

export default TrainingService;
