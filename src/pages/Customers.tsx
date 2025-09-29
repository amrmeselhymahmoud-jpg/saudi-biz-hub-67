import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Calendar,
  User,
  DollarSign,
  Phone,
  Mail,
  MapPin
} from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Link } from "react-router-dom";

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data for customers
  const customers = [
    { 
      id: "CUST-001", 
      name: "شركة الأمل التجارية", 
      email: "info@alamal.com",
      phone: "+966 50 123 4567",
      location: "الرياض",
      totalOrders: 15,
      totalSpent: "45,000 ر.س",
      status: "نشط",
      joinDate: "2024-01-15"
    },
    { 
      id: "CUST-002", 
      name: "مؤسسة النور", 
      email: "contact@alnoor.com",
      phone: "+966 55 987 6543",
      location: "جدة",
      totalOrders: 8,
      totalSpent: "22,500 ر.س",
      status: "نشط",
      joinDate: "2024-02-20"
    },
    { 
      id: "CUST-003", 
      name: "شركة المستقبل", 
      email: "hello@future.com",
      phone: "+966 56 456 7890",
      location: "الدمام",
      totalOrders: 22,
      totalSpent: "67,800 ر.س",
      status: "نشط",
      joinDate: "2023-11-10"
    },
    { 
      id: "CUST-004", 
      name: "مكتب الإبداع", 
      email: "info@creativity.com",
      phone: "+966 50 111 2233",
      location: "المدينة المنورة",
      totalOrders: 3,
      totalSpent: "8,900 ر.س",
      status: "غير نشط",
      joinDate: "2024-03-05"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "نشط": return "bg-green-100 text-green-800 border-green-200";
      case "غير نشط": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const stats = [
    {
      title: "إجمالي العملاء",
      value: "156",
      change: "+12",
      icon: User,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "العملاء النشطين",
      value: "134",
      change: "+8",
      icon: User,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "عملاء جدد هذا الشهر",
      value: "23",
      change: "+15",
      icon: User,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "متوسط قيمة العميل",
      value: "2,850 ر.س",
      change: "+5.2%",
      icon: DollarSign,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full bg-background" dir="rtl">
        <AppSidebar />
        <main className="mr-72 min-h-screen">
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
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">إدارة العملاء</h1>
                    <p className="text-sm text-muted-foreground font-medium">إدارة ومتابعة جميع العملاء</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 ml-2" />
                    عميل جديد
                  </Button>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="p-6">
              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                  <Card key={index} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                          <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                          <p className="text-sm text-muted-foreground mt-1">{stat.change} من الشهر الماضي</p>
                        </div>
                        <div className={`p-3 rounded-full ${stat.bgColor}`}>
                          <stat.icon className={`h-6 w-6 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Filters and Search */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center space-x-4 rtl:space-x-reverse w-full md:w-auto">
                      <div className="relative flex-1 md:w-80">
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="البحث في العملاء..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pr-10"
                          dir="rtl"
                        />
                      </div>
                      <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 ml-2" />
                        تصفية
                      </Button>
                    </div>
                    
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 ml-2" />
                        تصدير
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customers Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">قائمة العملاء</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border/60">
                          <th className="text-right py-4 px-4 font-semibold text-muted-foreground">رقم العميل</th>
                          <th className="text-right py-4 px-4 font-semibold text-muted-foreground">اسم العميل</th>
                          <th className="text-right py-4 px-4 font-semibold text-muted-foreground">البريد الإلكتروني</th>
                          <th className="text-right py-4 px-4 font-semibold text-muted-foreground">الهاتف</th>
                          <th className="text-right py-4 px-4 font-semibold text-muted-foreground">الموقع</th>
                          <th className="text-right py-4 px-4 font-semibold text-muted-foreground">إجمالي الطلبات</th>
                          <th className="text-right py-4 px-4 font-semibold text-muted-foreground">إجمالي المبلغ</th>
                          <th className="text-right py-4 px-4 font-semibold text-muted-foreground">الحالة</th>
                          <th className="text-center py-4 px-4 font-semibold text-muted-foreground">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customers.map((customer) => (
                          <tr key={customer.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                            <td className="py-4 px-4">
                              <span className="font-mono text-sm font-semibold text-primary">{customer.id}</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="font-medium text-foreground">{customer.name}</span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">{customer.email}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">{customer.phone}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">{customer.location}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-sm text-foreground">{customer.totalOrders}</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="font-semibold text-foreground">{customer.totalSpent}</span>
                            </td>
                            <td className="py-4 px-4">
                              <Badge className={`${getStatusColor(customer.status)} border`}>
                                {customer.status}
                              </Badge>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center justify-center space-x-1 rtl:space-x-reverse">
                                <Button variant="ghost" size="sm" className="hover:bg-blue-50 hover:text-blue-600">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="hover:bg-green-50 hover:text-green-600">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="hover:bg-red-50 hover:text-red-600">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="hover:bg-muted">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </main>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Customers;