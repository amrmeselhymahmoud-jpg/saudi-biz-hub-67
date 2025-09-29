import { UserCog } from "lucide-react";

const Users = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <UserCog className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">المستخدمين</h1>
      </div>
      <p className="text-muted-foreground">صفحة إدارة المستخدمين</p>
    </div>
  );
};

export default Users;
