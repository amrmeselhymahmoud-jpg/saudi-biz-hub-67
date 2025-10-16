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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const QoyodHeader = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data;
    },
    enabled: !!user?.id,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'مستخدم';
  const companyName = profile?.company_name || user?.user_metadata?.company_name || 'مستخدم';
  const businessType = profile?.business_type || user?.user_metadata?.business_type || '';

  const getUserInitials = () => {
    if (displayName && displayName !== 'مستخدم') {
      const names = displayName.split(' ');
      return names.length > 1
        ? `${names[0][0]}${names[1][0]}`.toUpperCase()
        : names[0][0].toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };
  return (
    <header className="bg-gradient-to-r from-cyan-600 via-blue-600 to-blue-700 border-b border-blue-800/30 sticky top-0 z-30 shadow-lg backdrop-blur-sm">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between max-w-full">
          {/* الشعار */}
          <div className="flex items-center">
            <img
              src="/finzo logo-01.svg"
              alt="Finzo Logo"
              className="h-12 w-auto filter brightness-0 invert"
            />
          </div>

          {/* الإجراءات الجانبية */}
          <div className="flex items-center gap-2">
            {/* زر الإشعارات */}
            <Button variant="ghost" size="sm" className="relative hover:bg-white/10 text-white h-9 w-9 p-0 rounded-lg transition-all">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full border border-white shadow-sm"></span>
            </Button>

            {/* معلومات المستخدم */}
            <div className="flex items-center gap-3 px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <Avatar className="h-10 w-10 border-2 border-white shadow-md">
                <AvatarFallback className="bg-white text-blue-600 font-bold text-base">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="text-right">
                <div className="text-sm font-bold text-white leading-tight">
                  {isLoading ? 'جاري التحميل...' : displayName}
                </div>
                <div className="text-xs text-blue-100 leading-tight mt-1">
                  {isLoading ? '...' : (companyName !== 'مستخدم' ? companyName : user?.email)}
                </div>
              </div>
            </div>

            {/* قائمة المستخدم */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hover:bg-white/10 text-white h-9 w-9 p-0 rounded-lg transition-all">
                  <Settings className="h-5 w-5" />
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