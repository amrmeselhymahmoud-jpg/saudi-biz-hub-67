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
  DollarSign
} from "lucide-react";
import { Link } from "react-router-dom";

const Invoices = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data for invoices
  const invoices = [
    { 
      id: "INV-001", 
      customer: "شركة الأمل التجارية", 
      amount: "15,000 ر.س", 
      status: "مدفوعة", 
      date: "2025-01-28",
      dueDate: "2025-02-28",
      items: 5
    },
    { 
      id: "INV-002", 
      customer: "مؤسسة النور", 
      amount: "8,500 ر.س", 
      status: "معلقة", 
      date: "2025-01-27",
      dueDate: "2025-02-27",
      items: 3
    },
    { 
      id: "INV-003", 
      customer: "شركة المستقبل", 
      amount: "22,000 ر.س", 
      status: "مدفوعة", 
      date: "2025-01-26",
      dueDate: "2025-02-26",
      items: 8
    },
    { 
      id: "INV-004", 
      customer: "مكتب الإبداع", 
      amount: "5,200 ر.س", 
      status: "مرفوضة", 
      date: "2025-01-25",
      dueDate: "2025-02-25",
      items: 2
    },
    { 
      id: "INV-005", 
      customer: "شركة التقنية الحديثة", 
      amount: "31,500 ر.س", 
      status: "معلقة", 
      date: "2025-01-24",
      dueDate: "2025-02-24",
      items: 12
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "مدفوعة": return "bg-green-100 text-green-800 border-green-200";
      case "معلقة": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "مرفوضة": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const stats = [
    {
      title: "إجمالي الفواتير",
      value: "156",
      change: "+12",
      icon: DollarSign,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "المبلغ الإجمالي",
      value: "892,500 ر.س",
      change: "+15.3%",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "الفواتير المعلقة",
      value: "23",
      change: "-5",
      icon: Calendar,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50"
    },
    {
      title: "العملاء النشطين",
      value: "89",
      change: "+8",
      icon: User,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  return (
    <div className="min-h-screen w-full bg-background" dir="rtl">
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
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">إدارة الفواتير</h1>
                <p className="text-sm text-muted-foreground font-medium">إنشاء ومتابعة جميع الفواتير</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 ml-2" />
                فاتورة جديدة
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
                      placeholder="البحث في الفواتير..."
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

          {/* Invoices Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">قائمة الفواتير</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/60">
                      <th className="text-right py-4 px-4 font-semibold text-muted-foreground">رقم الفاتورة</th>
                      <th className="text-right py-4 px-4 font-semibold text-muted-foreground">العميل</th>
                      <th className="text-right py-4 px-4 font-semibold text-muted-foreground">المبلغ</th>
                      <th className="text-right py-4 px-4 font-semibold text-muted-foreground">الحالة</th>
                      <th className="text-right py-4 px-4 font-semibold text-muted-foreground">تاريخ الإنشاء</th>
                      <th className="text-right py-4 px-4 font-semibold text-muted-foreground">تاريخ الاستحقاق</th>
                      <th className="text-right py-4 px-4 font-semibold text-muted-foreground">العناصر</th>
                      <th className="text-center py-4 px-4 font-semibold text-muted-foreground">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                        <td className="py-4 px-4">
                          <span className="font-mono text-sm font-semibold text-primary">{invoice.id}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-medium text-foreground">{invoice.customer}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-semibold text-foreground">{invoice.amount}</span>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={`${getStatusColor(invoice.status)} border`}>
                            {invoice.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-muted-foreground">{invoice.date}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-muted-foreground">{invoice.dueDate}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-muted-foreground">{invoice.items} عنصر</span>
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
    </div>
  );
};

export default Invoices;