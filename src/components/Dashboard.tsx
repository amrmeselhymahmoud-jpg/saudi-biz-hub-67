import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, ShoppingCart, Users, Package, FileText, CircleAlert as AlertCircle, DollarSign, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const recentInvoices = [
    { id: "INV-2025-004", customer: "مؤسسة الأفق", amount: 8900, status: "draft" },
    { id: "INV-2025-003", customer: "فاطمة عبدالله", amount: 3200, status: "unpaid" },
    { id: "INV-2025-002", customer: "شركة النور للتجارة", amount: 12500, status: "partially_paid" },
  ];

  const lowStockProducts = [
    { name: "طابعة Canon", quantity: 8, minLevel: 10 },
    { name: "ورق A4", quantity: 45, minLevel: 50 },
  ];

  return (
    <div className="p-8 space-y-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen" dir="rtl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">لوحة التحكم</h1>
        <p className="text-gray-600 mt-2 text-lg">نظرة عامة شاملة على أداء عملك</p>
      </div>
      
      {/* Main Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6 bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-r-4 border-r-blue-500">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-500 mb-2">إجمالي المبيعات</div>
              <div className="text-3xl font-bold text-gray-900">30,100 ر.س</div>
              <div className="flex items-center gap-1 mt-3 text-sm font-semibold text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span>+12.5% من الشهر الماضي</span>
              </div>
            </div>
            <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6 bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-r-4 border-r-cyan-500">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-500 mb-2">المشتريات</div>
              <div className="text-3xl font-bold text-gray-900">18,300 ر.س</div>
              <div className="flex items-center gap-1 mt-3 text-sm font-semibold text-red-600">
                <TrendingDown className="h-4 w-4" />
                <span>-3.2% من الشهر الماضي</span>
              </div>
            </div>
            <div className="h-16 w-16 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
              <ShoppingCart className="h-8 w-8 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-r-4 border-r-purple-500">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-500 mb-2">العملاء</div>
              <div className="text-3xl font-bold text-gray-900">127</div>
              <div className="flex items-center gap-1 mt-3 text-sm font-semibold text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span>+8 عميل جديد</span>
              </div>
            </div>
            <div className="h-16 w-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-r-4 border-r-orange-500">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-500 mb-2">المنتجات</div>
              <div className="text-3xl font-bold text-gray-900">45</div>
              <div className="flex items-center gap-1 mt-3 text-sm font-medium text-gray-500">
                <Package className="h-4 w-4" />
                <span>في 3 فئات</span>
              </div>
            </div>
            <div className="h-16 w-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Package className="h-8 w-8 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity and Alerts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Invoices */}
        <Card className="p-6 bg-white shadow-md hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              آخر الفواتير
            </h2>
            <Button variant="link" className="text-blue-600 hover:text-blue-700 font-semibold" asChild>
              <Link to="/sales-invoices">عرض الكل ←</Link>
            </Button>
          </div>
          <div className="space-y-4">
            {recentInvoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div>
                  <div className="font-bold text-gray-900">{invoice.id}</div>
                  <div className="text-sm text-gray-500 mt-1">{invoice.customer}</div>
                </div>
                <div className="text-left">
                  <div className="font-bold text-lg text-gray-900">{invoice.amount.toLocaleString()} ر.س</div>
                  <Badge variant={
                    invoice.status === "draft" ? "outline" :
                    invoice.status === "unpaid" ? "destructive" : "secondary"
                  } className="mt-2">
                    {invoice.status === "draft" ? "مسودة" :
                     invoice.status === "unpaid" ? "غير مدفوعة" : "مدفوعة جزئياً"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="p-6 bg-white shadow-md hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
              <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              تنبيهات المخزون
            </h2>
            <Button variant="link" className="text-blue-600 hover:text-blue-700 font-semibold" asChild>
              <Link to="/products-costs">عرض الكل ←</Link>
            </Button>
          </div>
          <div className="space-y-4">
            {lowStockProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border-r-4 border-r-red-500">
                <div>
                  <div className="font-bold text-gray-900">{product.name}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    الحد الأدنى: {product.minLevel}
                  </div>
                </div>
                <Badge variant="destructive" className="text-base px-4 py-2">
                  {product.quantity} متبقي
                </Badge>
              </div>
            ))}
            {lowStockProducts.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>لا توجد تنبيهات حالياً</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-8 bg-white shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">الإجراءات السريعة</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Button variant="outline" className="h-auto py-6 border-2 hover:border-blue-500 hover:bg-blue-50 transition-all" asChild>
            <Link to="/sales-invoices">
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <span className="font-semibold">فاتورة جديدة</span>
              </div>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-6 border-2 hover:border-purple-500 hover:bg-purple-50 transition-all" asChild>
            <Link to="/customers">
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <span className="font-semibold">إضافة عميل</span>
              </div>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-6 border-2 hover:border-orange-500 hover:bg-orange-50 transition-all" asChild>
            <Link to="/products-costs">
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-orange-600" />
                </div>
                <span className="font-semibold">إضافة منتج</span>
              </div>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-6 border-2 hover:border-green-500 hover:bg-green-50 transition-all" asChild>
            <Link to="/suppliers">
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-green-600" />
                </div>
                <span className="font-semibold">إضافة مورد</span>
              </div>
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;