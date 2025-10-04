import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, ShoppingCart, Users, Package, FileText, CircleAlert as AlertCircle, DollarSign, Building2, ChartBar as BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const { data: customersCount = 0, isLoading: loadingCustomers } = useQuery({
    queryKey: ["customers-count"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;
      const { count } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("created_by", user.id);
      return count || 0;
    },
  });

  const { data: suppliersCount = 0, isLoading: loadingSuppliers } = useQuery({
    queryKey: ["suppliers-count"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;
      const { count } = await supabase
        .from("suppliers")
        .select("*", { count: "exact", head: true })
        .eq("created_by", user.id);
      return count || 0;
    },
  });

  const { data: productsCount = 0, isLoading: loadingProducts } = useQuery({
    queryKey: ["products-count"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;
      const { count } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("created_by", user.id);
      return count || 0;
    },
  });

  const { data: recentInvoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ["recent-invoices"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from("sales_invoices")
        .select("id, invoice_number, customer_name, total_amount, status")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false })
        .limit(3);
      return data || [];
    },
  });

  const { data: lowStockProducts = [], isLoading: loadingStock } = useQuery({
    queryKey: ["low-stock"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from("products")
        .select("product_name, stock_quantity")
        .eq("created_by", user.id)
        .lt("stock_quantity", 20)
        .limit(3);
      return data || [];
    },
  });

  return (
    <div className="w-full" dir="rtl">
      <div className="p-6 space-y-6 min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">لوحة التحكم</h1>
        <p className="text-gray-600 mt-2 text-lg">نظرة عامة شاملة على أداء عملك</p>
      </div>
      
      {/* Main Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6 bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-r-4 border-r-teal-500">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-500 mb-2">العملاء</div>
              {loadingCustomers ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <div className="text-3xl font-bold text-gray-900">{customersCount}</div>
              )}
              <div className="flex items-center gap-1 mt-3 text-sm font-medium text-gray-500">
                <Users className="h-4 w-4" />
                <span>إجمالي العملاء</span>
              </div>
            </div>
            <div className="h-16 w-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-r-4 border-r-green-500">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-500 mb-2">الموردين</div>
              {loadingSuppliers ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <div className="text-3xl font-bold text-gray-900">{suppliersCount}</div>
              )}
              <div className="flex items-center gap-1 mt-3 text-sm font-medium text-gray-500">
                <Building2 className="h-4 w-4" />
                <span>إجمالي الموردين</span>
              </div>
            </div>
            <div className="h-16 w-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-r-4 border-r-orange-500">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-500 mb-2">المنتجات</div>
              {loadingProducts ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <div className="text-3xl font-bold text-gray-900">{productsCount}</div>
              )}
              <div className="flex items-center gap-1 mt-3 text-sm font-medium text-gray-500">
                <Package className="h-4 w-4" />
                <span>في المخزون</span>
              </div>
            </div>
            <div className="h-16 w-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Package className="h-8 w-8 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-r-4 border-r-blue-500">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-500 mb-2">التقارير</div>
              <div className="text-lg font-bold text-gray-900 mt-2">عرض التقارير</div>
              <div className="flex items-center gap-1 mt-3 text-sm font-medium text-gray-500">
                <BarChart3 className="h-4 w-4" />
                <span>تحليل شامل</span>
              </div>
            </div>
            <Link to="/reports">
              <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-2xl transition-shadow cursor-pointer">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
            </Link>
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
            {loadingInvoices ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-lg">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ))
            ) : recentInvoices.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>لا توجد فواتير حالياً</p>
              </div>
            ) : (
              recentInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div>
                    <div className="font-bold text-gray-900">{invoice.invoice_number}</div>
                    <div className="text-sm text-gray-500 mt-1">{invoice.customer_name}</div>
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-lg text-gray-900">{invoice.total_amount?.toLocaleString()} ر.س</div>
                    <Badge variant={
                      invoice.status === "draft" ? "outline" :
                      invoice.status === "unpaid" ? "destructive" :
                      invoice.status === "paid" ? "default" : "secondary"
                    } className="mt-2">
                      {invoice.status === "draft" ? "مسودة" :
                       invoice.status === "unpaid" ? "غير مدفوعة" :
                       invoice.status === "paid" ? "مدفوعة" : "مدفوعة جزئياً"}
                    </Badge>
                  </div>
                </div>
              ))
            )}
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
            {loadingStock ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="p-4 bg-red-50 rounded-lg">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ))
            ) : lowStockProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>لا توجد تنبيهات حالياً</p>
              </div>
            ) : (
              lowStockProducts.map((product, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border-r-4 border-r-red-500">
                  <div>
                    <div className="font-bold text-gray-900">{product.product_name}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      مخزون منخفض
                    </div>
                  </div>
                  <Badge variant="destructive" className="text-base px-4 py-2">
                    {product.stock_quantity} متبقي
                  </Badge>
                </div>
              ))
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
          <Button variant="outline" className="h-auto py-6 border-2 hover:border-teal-500 hover:bg-teal-50 transition-all" asChild>
            <Link to="/customers">
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-teal-600" />
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
    </div>
  );
};

export default Dashboard;