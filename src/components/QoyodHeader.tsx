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
    <header className="bg-white border-b border-qoyod-border sticky top-0 z-50">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          {/* الشعار */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-qoyod-navy">QOYOD</h1>
          </div>

          {/* الإجراءات الجانبية */}
          <div className="flex items-center gap-3">
            {/* زر الإشعارات */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </Button>

            {/* قائمة المستخدم */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-white">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-right hidden md:block">
                    <div className="text-sm font-medium">
                      {user?.user_metadata?.display_name || user?.email}
                    </div>
                    <div className="text-xs text-muted-foreground">
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