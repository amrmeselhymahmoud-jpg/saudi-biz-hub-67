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
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 border-b border-blue-700 sticky top-0 z-40 shadow-md">
      <div className="px-4 py-2">
        <div className="flex items-center justify-between">
          {/* الشعار */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-md">
              <span className="text-blue-600 font-bold text-lg">ق</span>
            </div>
            <h1 className="text-xl font-bold text-white">قيود</h1>
          </div>

          {/* الإجراءات الجانبية */}
          <div className="flex items-center gap-2">
            {/* زر الإشعارات */}
            <Button variant="ghost" size="icon" className="relative hover:bg-white/20 text-white">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
            </Button>

            {/* قائمة المستخدم */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 hover:bg-white/20">
                  <Avatar className="h-7 w-7 border-2 border-white">
                    <AvatarFallback className="bg-white text-blue-600 font-semibold text-sm">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-right hidden md:block">
                    <div className="text-sm font-medium text-white">
                      {user?.user_metadata?.display_name || user?.email}
                    </div>
                    <div className="text-xs text-blue-100">
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