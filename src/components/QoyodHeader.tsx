import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, Settings, LogOut, User } from "lucide-react";

const QoyodHeader = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const getUserInitials = () => {
    if (user?.user_metadata?.display_name) {
      const names = user.user_metadata.display_name.split(' ');
      return names.length > 1
        ? `${names[0][0]}${names[1][0]}`
        : names[0][0];
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };
  return (
    <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 border-b border-blue-800/30 sticky top-0 z-30 shadow-lg backdrop-blur-sm">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between max-w-full">
          {/* الشعار */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
              <span className="text-blue-600 font-bold text-2xl">ق</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-white leading-tight">قيود</h1>
              <span className="text-xs text-blue-100/80 leading-none">نظام محاسبي</span>
            </div>
          </div>

          {/* الإجراءات الجانبية */}
          <div className="flex items-center gap-2">
            {/* زر الإشعارات */}
            <Button variant="ghost" size="sm" className="relative hover:bg-white/10 text-white h-9 w-9 p-0 rounded-lg transition-all">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full border border-white shadow-sm"></span>
            </Button>

            {/* قائمة المستخدم */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2.5 hover:bg-white/10 h-10 px-3 rounded-lg transition-all">
                  <Avatar className="h-8 w-8 border-2 border-white/50 shadow-md">
                    <AvatarFallback className="bg-white text-blue-600 font-semibold text-sm">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-white leading-tight">
                      {user?.user_metadata?.display_name || user?.email?.split('@')[0]}
                    </div>
                    <div className="text-xs text-blue-100/80 leading-tight mt-0.5">
                      {user?.user_metadata?.company_name || 'مستخدم'}
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate("/profile-edit")}>
                  <User className="ml-2 h-4 w-4" />
                  <span>الملف الشخصي</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/general-settings")}>
                  <Settings className="ml-2 h-4 w-4" />
                  <span>الإعدادات</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                  <LogOut className="ml-2 h-4 w-4" />
                  <span>تسجيل الخروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default QoyodHeader;