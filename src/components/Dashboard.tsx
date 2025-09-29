import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Search, 
  User, 
  LogOut, 
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Users,
  Package,
  Calendar,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Menu,
  Home,
  BarChart3,
  Settings
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  // Mock data for dashboard
  const stats = [
    {
      title: "إجمالي المبيعات",
      value: "124,500 ر.س",
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "الفواتير المعلقة",
      value: "23",
      change: "-5.2%",
      trend: "down",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "العملاء النشطين",
      value: "145",
      change: "+8.1%",
      trend: "up",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "المنتجات المتاحة",
      value: "89",
      change: "+2.3%",
      trend: "up",
      icon: Package,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ];

  const recentInvoices = [
    { id: "INV-001", customer: "شركة الأمل التجارية", amount: "15,000 ر.س", status: "مدفوعة", date: "2025-01-28" },
    { id: "INV-002", customer: "مؤسسة النور", amount: "8,500 ر.س", status: "معلقة", date: "2025-01-27" },
    { id: "INV-003", customer: "شركة المستقبل", amount: "22,000 ر.س", status: "مدفوعة", date: "2025-01-26" },
    { id: "INV-004", customer: "مكتب الإبداع", amount: "5,200 ر.س", status: "مرفوضة", date: "2025-01-25" },
    { id: "INV-005", customer: "شركة التقنية الحديثة", amount: "31,500 ر.س", status: "معلقة", date: "2025-01-24" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "مدفوعة": return "bg-green-100 text-green-800";
      case "معلقة": return "bg-yellow-100 text-yellow-800";
      case "مرفوضة": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-white to-slate-50/80 border-b border-border/60 shadow-sm sticky top-0 z-50 backdrop-blur-sm">
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
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">لوحة التحكم</h1>
              <p className="text-sm text-muted-foreground font-medium">مرحباً بك في نظام قيود الذكي</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 rtl:space-x-reverse"
          >
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="البحث..."
                className="w-80 pr-10 bg-muted/50"
              />
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -left-1 h-5 w-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-semibold animate-pulse">
                3
              </span>
            </Button>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-foreground">{user?.email}</p>
                <p className="text-xs text-muted-foreground">مدير النظام</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">إجراءات سريعة</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-12 justify-start bg-primary hover:bg-primary/90">
              <Plus className="h-5 w-5 ml-2" />
              إنشاء فاتورة جديدة
            </Button>
            <Button variant="outline" className="h-12 justify-start">
              <Users className="h-5 w-5 ml-2" />
              إضافة عميل جديد
            </Button>
            <Button variant="outline" className="h-12 justify-start">
              <Package className="h-5 w-5 ml-2" />
              إضافة منتج جديد
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <div className="flex items-center mt-2">
                      {stat.trend === "up" ? (
                        <TrendingUp className="h-4 w-4 text-green-600 ml-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600 ml-1" />
                      )}
                      <span className={`text-sm ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Invoices */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">الفواتير الأخيرة</CardTitle>
                <Button variant="outline" size="sm">
                  عرض الكل
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentInvoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-foreground">{invoice.id}</p>
                          <Badge className={getStatusColor(invoice.status)}>
                            {invoice.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{invoice.customer}</p>
                        <p className="text-sm text-muted-foreground">{invoice.date}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-semibold text-foreground">{invoice.amount}</p>
                        <div className="flex items-center space-x-1 rtl:space-x-reverse mt-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Feed */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">آخر الأنشطة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 rtl:space-x-reverse">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm text-foreground">تم إنشاء فاتورة جديدة</p>
                      <p className="text-xs text-muted-foreground">منذ 5 دقائق</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 rtl:space-x-reverse">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm text-foreground">تم إضافة عميل جديد</p>
                      <p className="text-xs text-muted-foreground">منذ 15 دقيقة</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 rtl:space-x-reverse">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm text-foreground">تم تحديث المخزون</p>
                      <p className="text-xs text-muted-foreground">منذ 30 دقيقة</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 rtl:space-x-reverse">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm text-foreground">تم إنشاء تقرير شهري</p>
                      <p className="text-xs text-muted-foreground">منذ ساعة</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 rtl:space-x-reverse">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm text-foreground">تم رفض دفعة</p>
                      <p className="text-xs text-muted-foreground">منذ ساعتين</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;