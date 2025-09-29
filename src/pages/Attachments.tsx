import { Paperclip } from "lucide-react";

const Attachments = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Paperclip className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">المرفقات</h1>
      </div>
      <p className="text-muted-foreground">صفحة إدارة المرفقات</p>
    </div>
  );
};

export default Attachments;
