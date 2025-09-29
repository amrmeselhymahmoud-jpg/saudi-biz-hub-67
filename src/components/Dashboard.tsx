import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  Plus,
  CheckCircle,
  FileText,
  Users,
  Package,
  CreditCard,
  BarChart3,
  ArrowRight,
  Star,
  ShieldCheck,
  Zap,
  Globe
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const generalSteps = [
    {
      title: "اضغط هنا لإضافة حساب",
      description: "هذه الخطوات هي للمستخدمين الذين لديهم خبرة محاسبية",
      icon: CheckCircle,
      color: "text-green-600",
      completed: true
    },
    {
      title: "اضغط هنا لإضافة رصيد افتتاحي",
      description: "",
      icon: FileText,
      color: "text-blue-600",
      completed: false
    }
  ];

  const advancedSteps = [
    {
      title: "ليس لديك أي منتجات، اضغط هنا لإضافة منتج",
      description: "هذه الخطوات هي لاستخدام نظام قيود",
      icon: Package,
      color: "text-blue-600",
      completed: false
    },
    {
      title: "ليس لديك أي عملاء، اضغط هنا لإضافة عميل",
      description: "",
      icon: Users,
      color: "text-blue-600",
      completed: false
    },
    {
      title: "ليس لديك أي فواتير مبيعات، اضغط هنا لإضافة فاتورة مبيعات",
      description: "",
      icon: FileText,
      color: "text-blue-600",
      completed: false
    },
    {
      title: "لديك 1 مواقع، اضغط هنا لإضافة المزيد",
      description: "",
      icon: Globe,
      color: "text-purple-600",
      completed: false
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-white to-slate-50/80 border-b border-border/60 shadow-sm sticky top-0 z-10 backdrop-blur-sm w-full">
        {/* Top Navigation */}
        <div className="border-b border-border/30">
          <div className="px-6 py-2">
            <nav className="flex items-center justify-center space-x-8 rtl:space-x-reverse">
              <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">الصفحة الرئيسية</Link>
              <Link to="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">من نحن</Link>
              <Link to="/features" className="text-sm text-muted-foreground hover:text-primary transition-colors">المميزات</Link>
              <Link to="/pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors">الأسعار</Link>
              <a href="#contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">اتصل بنا</a>
            </nav>
          </div>
        </div>
        
        {/* Main Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <SidebarTrigger className="hover:bg-muted rounded-lg p-2 transition-colors" />
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="بحث..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 w-64 bg-white/80 border-border/60 focus:border-primary"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <Button variant="ghost" size="sm" className="relative hover:bg-muted">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center animate-pulse">
                3
              </span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatars/01.png" alt="المستخدم" />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                      م
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white border-border/60" align="end" forceMount>
                <DropdownMenuLabel className="font-normal text-right">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">مرحباً بك في قيود</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-right hover:bg-muted">
                  <User className="ml-2 h-4 w-4" />
                  <span>الملف الشخصي</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-right hover:bg-muted">
                  <Settings className="ml-2 h-4 w-4" />
                  <span>الإعدادات</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-right text-red-600 hover:bg-red-50 hover:text-red-600"
                  onClick={handleSignOut}
                >
                  <LogOut className="ml-2 h-4 w-4" />
                  <span>تسجيل الخروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl p-8 text-center">
            <h1 className="text-3xl font-bold mb-2">مرحباً بك في قيود</h1>
            <p className="text-primary-foreground/90 text-lg">نظام المحاسبة الذكي</p>
          </div>
        </div>

        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm text-muted-foreground">
            <span>الصفحة الرئيسية</span>
            <span>/</span>
            <span className="text-primary font-medium">لوحة المتابعة</span>
          </div>
        </div>

        {/* Steps Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* General Steps */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-xl text-foreground">خطوات عامة</CardTitle>
              <CardDescription className="text-muted-foreground">
                هذه الخطوات هي للمستخدمين الذين لديهم خبرة محاسبية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {generalSteps.map((step, index) => (
                <div key={index} className="flex items-start space-x-4 rtl:space-x-reverse p-4 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer border border-border/30">
                  <div className={`p-2 rounded-full ${step.completed ? 'bg-green-100' : 'bg-blue-100'}`}>
                    <step.icon className={`h-5 w-5 ${step.completed ? 'text-green-600' : step.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                      {step.title}
                    </p>
                    {step.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {step.description}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Advanced Steps */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-xl text-foreground">خطوات متقدمة</CardTitle>
              <CardDescription className="text-muted-foreground">
                هذه الخطوات هي لاستخدام نظام قيود
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {advancedSteps.map((step, index) => (
                <div key={index} className="flex items-start space-x-4 rtl:space-x-reverse p-4 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer border border-border/30">
                  <div className="p-2 rounded-full bg-blue-100">
                    <step.icon className={`h-5 w-5 ${step.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                      {step.title}
                    </p>
                    {step.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {step.description}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="bg-blue-600 text-white rounded-lg p-4 inline-block mb-4">
                <BarChart3 className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">الإيرادات و المصروفات</h3>
              <p className="text-blue-700 text-sm">تتبع إيراداتك ومصروفاتك بسهولة</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200 hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="bg-green-600 text-white rounded-lg p-4 inline-block mb-4">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">حالة الدفعات</h3>
              <p className="text-green-700 text-sm">راقب حالة جميع دفعاتك ومعاملاتك</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">فواتير المبيعات</h2>
          <div className="bg-white rounded-lg border border-border/60 p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">فواتير المبيعات</h3>
            <p className="text-muted-foreground text-sm mb-4">لم يتم إنشاء أي فواتير بعد</p>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 ml-2" />
              إنشاء فاتورة جديدة
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;