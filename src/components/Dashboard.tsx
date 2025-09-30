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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">لوحة التحكم</h1>
        <p className="text-muted-foreground mt-2">نظرة عامة على أداء عملك</p>
      </div>
      
      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">إجمالي المبيعات</div>
              <div className="text-2xl font-bold mt-2">30,100 ر.س</div>
              <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span>+12.5%</span>
              </div>
            </div>
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">المشتريات</div>
              <div className="text-2xl font-bold mt-2">18,300 ر.س</div>
              <div className="flex items-center gap-1 mt-2 text-sm text-red-600">
                <TrendingDown className="h-4 w-4" />
                <span>-3.2%</span>
              </div>
            </div>
            <div className="h-12 w-12 bg-blue-500/10 rounded-full flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">العملاء</div>
              <div className="text-2xl font-bold mt-2">127</div>
              <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span>+8 جديد</span>
              </div>
            </div>
            <div className="h-12 w-12 bg-purple-500/10 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">المنتجات</div>
              <div className="text-2xl font-bold mt-2">45</div>
              <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                <Package className="h-4 w-4" />
                <span>3 فئات</span>
              </div>
            </div>
            <div className="h-12 w-12 bg-orange-500/10 rounded-full flex items-center justify-center">
              <Package className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity and Alerts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Invoices */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              آخر الفواتير
            </h2>
            <Button variant="link" asChild>
              <Link to="/sales-invoices">عرض الكل</Link>
            </Button>
          </div>
          <div className="space-y-4">
            {recentInvoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between pb-4 border-b last:border-0">
                <div>
                  <div className="font-medium">{invoice.id}</div>
                  <div className="text-sm text-muted-foreground">{invoice.customer}</div>
                </div>
                <div className="text-left">
                  <div className="font-semibold">{invoice.amount.toLocaleString()} ر.س</div>
                  <Badge variant={
                    invoice.status === "draft" ? "outline" :
                    invoice.status === "unpaid" ? "destructive" : "secondary"
                  } className="mt-1">
                    {invoice.status === "draft" ? "مسودة" :
                     invoice.status === "unpaid" ? "غير مدفوعة" : "مدفوعة جزئياً"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              تنبيهات المخزون
            </h2>
            <Button variant="link" asChild>
              <Link to="/products-costs">عرض الكل</Link>
            </Button>
          </div>
          <div className="space-y-4">
            {lowStockProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between pb-4 border-b last:border-0">
                <div>
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-muted-foreground">
                    الحد الأدنى: {product.minLevel}
                  </div>
                </div>
                <Badge variant="destructive">
                  {product.quantity} متبقي
                </Badge>
              </div>
            ))}
            {lowStockProducts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد تنبيهات حالياً
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">الإجراءات السريعة</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <Button variant="outline" className="h-auto py-4" asChild>
            <Link to="/sales-invoices">
              <div className="flex flex-col items-center gap-2">
                <FileText className="h-6 w-6" />
                <span>فاتورة جديدة</span>
              </div>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4" asChild>
            <Link to="/customers">
              <div className="flex flex-col items-center gap-2">
                <Users className="h-6 w-6" />
                <span>إضافة عميل</span>
              </div>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4" asChild>
            <Link to="/products-costs">
              <div className="flex flex-col items-center gap-2">
                <Package className="h-6 w-6" />
                <span>إضافة منتج</span>
              </div>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4" asChild>
            <Link to="/suppliers">
              <div className="flex flex-col items-center gap-2">
                <Building2 className="h-6 w-6" />
                <span>إضافة مورد</span>
              </div>
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;