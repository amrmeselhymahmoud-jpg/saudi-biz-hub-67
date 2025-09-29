import { BookOpen } from "lucide-react";

const QoyodAcademy = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">أكاديمية قيود</h1>
      </div>
      <div className="bg-blue-500/10 text-blue-500 px-4 py-2 rounded-lg inline-block">
        قريباً
      </div>
      <p className="text-muted-foreground mt-4">صفحة أكاديمية قيود - قريباً</p>
    </div>
  );
};

export default QoyodAcademy;
