import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChartBar as BarChart3, Download, TrendingUp, DollarSign, Package, ShoppingCart, Users, FileText, Calendar, Printer } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SalesReportData {
  totalInvoices: number;
  totalRevenue: number;
  paidAmount: number;
  unpaidAmount: number;
  topCustomers: Array<{
    customer_name: string;
    total_spent: number;
    invoices_count: number;
  }>;
  salesByMonth: Array<{
    month: string;
    total: number;
  }>;
}

interface InventoryReportData {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  topProducts: Array<{
    product_name: string;
    current_stock: number;
    value: number;
  }>;
}

const Reports = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ["sales-report", dateFrom, dateTo],
    queryFn: async () => {
      if (!session?.user?.id) throw new Error("يجب تسجيل الدخول");

      const { data: invoices, error } = await supabase
        .from("sales_invoices")
        .select(`
          *,
          customers (customer_name)
        `)
        .eq("created_by", session.user.id)
        .gte("invoice_date", dateFrom)
        .lte("invoice_date", dateTo);

      if (error) throw error;

      const totalInvoices = invoices.length;
      const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
      const paidAmount = invoices.reduce((sum, inv) => sum + inv.paid_amount, 0);
      const unpaidAmount = totalRevenue - paidAmount;

      const customerStats = invoices.reduce((acc: any, inv) => {
        const customerName = inv.customers?.customer_name || 'غير محدد';
        if (!acc[customerName]) {
          acc[customerName] = { total_spent: 0, invoices_count: 0 };
        }
        acc[customerName].total_spent += inv.total_amount;
        acc[customerName].invoices_count += 1;
        return acc;
      }, {});

      const topCustomers = Object.entries(customerStats)
        .map(([customer_name, data]: [string, any]) => ({
          customer_name,
          total_spent: data.total_spent,
          invoices_count: data.invoices_count,
        }))
        .sort((a, b) => b.total_spent - a.total_spent)
        .slice(0, 5);

      const salesByMonth = invoices.reduce((acc: any, inv) => {
        const month = new Date(inv.invoice_date).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' });
        if (!acc[month]) {
          acc[month] = 0;
        }
        acc[month] += inv.total_amount;
        return acc;
      }, {});

      return {
        totalInvoices,
        totalRevenue,
        paidAmount,
        unpaidAmount,
        topCustomers,
        salesByMonth: Object.entries(salesByMonth).map(([month, total]) => ({ month, total: total as number })),
      } as SalesReportData;
    },
    enabled: !!session?.user?.id,
  });

  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: ["inventory-report"],
    queryFn: async () => {
      if (!session?.user?.id) throw new Error("يجب تسجيل الدخول");

      const { data: products, error } = await supabase
        .from("products")
        .select("*")
        .eq("created_by", session.user.id);

      if (error) throw error;

      const totalProducts = products.length;
      const totalValue = products.reduce((sum, p) => sum + (p.current_stock * p.cost_price), 0);
      const lowStockCount = products.filter(p => p.current_stock <= p.reorder_point).length;
      const outOfStockCount = products.filter(p => p.current_stock === 0).length;

      const topProducts = products
        .map(p => ({
          product_name: p.product_name,
          current_stock: p.current_stock,
          value: p.current_stock * p.cost_price,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      return {
        totalProducts,
        totalValue,
        lowStockCount,
        outOfStockCount,
        topProducts,
      } as InventoryReportData;
    },
    enabled: !!session?.user?.id,
  });

  const { data: customersCount } = useQuery({
    queryKey: ["customers-count"],
    queryFn: async () => {
      if (!session?.user?.id) throw new Error("يجب تسجيل الدخول");

      const { count, error } = await supabase
        .from("customers")
        .select("*", { count: 'exact', head: true })
        .eq("created_by", session.user.id)
        .eq("status", "active");

      if (error) throw error;
      return count || 0;
    },
    enabled: !!session?.user?.id,
  });

  const handlePrintReport = (reportType: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let content = '';

    if (reportType === 'sales' && salesData) {
      content = `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>تقرير المبيعات</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 40px; direction: rtl; }
            .header { text-align: center; margin-bottom: 40px; }
            .header h1 { color: #059669; font-size: 32px; margin-bottom: 10px; }
            .period { color: #6b7280; margin-bottom: 20px; }
            .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 40px; }
            .stat-card { border: 2px solid #e5e7eb; padding: 20px; border-radius: 8px; }
            .stat-label { color: #6b7280; font-size: 14px; margin-bottom: 8px; }
            .stat-value { color: #059669; font-size: 28px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin: 30px 0; }
            th { background: #059669; color: white; padding: 12px; text-align: right; }
            td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
            .footer { margin-top: 50px; text-align: center; color: #6b7280; font-size: 14px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>تقرير المبيعات</h1>
            <div class="period">من ${new Date(dateFrom).toLocaleDateString('ar-SA')} إلى ${new Date(dateTo).toLocaleDateString('ar-SA')}</div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">إجمالي الفواتير</div>
              <div class="stat-value">${salesData.totalInvoices}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">إجمالي الإيرادات</div>
              <div class="stat-value">${salesData.totalRevenue.toFixed(2)} ر.س</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">المبلغ المدفوع</div>
              <div class="stat-value">${salesData.paidAmount.toFixed(2)} ر.س</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">المبلغ المتبقي</div>
              <div class="stat-value">${salesData.unpaidAmount.toFixed(2)} ر.س</div>
            </div>
          </div>

          <h2 style="margin: 30px 0 20px; color: #374151;">أفضل 5 عملاء</h2>
          <table>
            <thead>
              <tr>
                <th>اسم العميل</th>
                <th>إجمالي المشتريات</th>
                <th>عدد الفواتير</th>
              </tr>
            </thead>
            <tbody>
              ${salesData.topCustomers.map(c => `
                <tr>
                  <td>${c.customer_name}</td>
                  <td>${c.total_spent.toFixed(2)} ر.س</td>
                  <td>${c.invoices_count}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>تم الطباعة في: ${new Date().toLocaleString('ar-SA')}</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
        </html>
      `;
    } else if (reportType === 'inventory' && inventoryData) {
      content = `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>تقرير المخزون</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 40px; direction: rtl; }
            .header { text-align: center; margin-bottom: 40px; }
            .header h1 { color: #7c3aed; font-size: 32px; margin-bottom: 10px; }
            .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 40px; }
            .stat-card { border: 2px solid #e5e7eb; padding: 20px; border-radius: 8px; }
            .stat-label { color: #6b7280; font-size: 14px; margin-bottom: 8px; }
            .stat-value { color: #7c3aed; font-size: 28px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin: 30px 0; }
            th { background: #7c3aed; color: white; padding: 12px; text-align: right; }
            td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
            .footer { margin-top: 50px; text-align: center; color: #6b7280; font-size: 14px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>تقرير المخزون</h1>
            <div>${new Date().toLocaleDateString('ar-SA')}</div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">إجمالي المنتجات</div>
              <div class="stat-value">${inventoryData.totalProducts}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">قيمة المخزون</div>
              <div class="stat-value">${inventoryData.totalValue.toFixed(2)} ر.س</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">مخزون منخفض</div>
              <div class="stat-value">${inventoryData.lowStockCount}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">نفذ من المخزون</div>
              <div class="stat-value">${inventoryData.outOfStockCount}</div>
            </div>
          </div>

          <h2 style="margin: 30px 0 20px; color: #374151;">أعلى 10 منتجات من حيث القيمة</h2>
          <table>
            <thead>
              <tr>
                <th>اسم المنتج</th>
                <th>الكمية الحالية</th>
                <th>القيمة</th>
              </tr>
            </thead>
            <tbody>
              ${inventoryData.topProducts.map(p => `
                <tr>
                  <td>${p.product_name}</td>
                  <td>${p.current_stock}</td>
                  <td>${p.value.toFixed(2)} ر.س</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>تم الطباعة في: ${new Date().toLocaleString('ar-SA')}</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
        </html>
      `;
    }

    printWindow.document.write(content);
    printWindow.document.close();
  };

  const handleExportCSV = (reportType: string) => {
    let csvContent = '';
    let filename = '';

    if (reportType === 'sales' && salesData) {
      csvContent = [
        'اسم العميل,إجمالي المشتريات,عدد الفواتير',
        ...salesData.topCustomers.map(c => `${c.customer_name},${c.total_spent},${c.invoices_count}`)
      ].join('\n');
      filename = `sales_report_${dateFrom}_${dateTo}.csv`;
    } else if (reportType === 'inventory' && inventoryData) {
      csvContent = [
        'اسم المنتج,الكمية,القيمة',
        ...inventoryData.topProducts.map(p => `${p.product_name},${p.current_stock},${p.value}`)
      ].join('\n');
      filename = `inventory_report_${new Date().toISOString().split('T')[0]}.csv`;
    }

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/20 to-purple-50/30">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">التقارير والإحصائيات</h1>
              <p className="text-gray-600 mt-1">تقارير شاملة عن المبيعات والمخزون والعملاء</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="sales" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="sales">المبيعات</TabsTrigger>
            <TabsTrigger value="inventory">المخزون</TabsTrigger>
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">تقرير المبيعات</h2>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handlePrintReport('sales')}>
                    <Printer className="h-4 w-4 ml-2" />
                    طباعة
                  </Button>
                  <Button variant="outline" onClick={() => handleExportCSV('sales')}>
                    <Download className="h-4 w-4 ml-2" />
                    تصدير CSV
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <Label>من تاريخ</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div>
                  <Label>إلى تاريخ</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>

              {salesLoading ? (
                <div className="text-center py-8">جاري التحميل...</div>
              ) : salesData ? (
                <>
                  <div className="grid gap-6 md:grid-cols-4 mb-6">
                    <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm opacity-90">إجمالي الفواتير</div>
                          <div className="text-3xl font-bold mt-2">{salesData.totalInvoices}</div>
                        </div>
                        <FileText className="h-10 w-10 opacity-80" />
                      </div>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm opacity-90">إجمالي الإيرادات</div>
                          <div className="text-2xl font-bold mt-2">{salesData.totalRevenue.toFixed(0)}</div>
                          <div className="text-xs opacity-80">ريال سعودي</div>
                        </div>
                        <DollarSign className="h-10 w-10 opacity-80" />
                      </div>
                    </Card>

                    <Card className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm opacity-90">المدفوع</div>
                          <div className="text-2xl font-bold mt-2">{salesData.paidAmount.toFixed(0)}</div>
                          <div className="text-xs opacity-80">ريال سعودي</div>
                        </div>
                        <TrendingUp className="h-10 w-10 opacity-80" />
                      </div>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm opacity-90">المتبقي</div>
                          <div className="text-2xl font-bold mt-2">{salesData.unpaidAmount.toFixed(0)}</div>
                          <div className="text-xs opacity-80">ريال سعودي</div>
                        </div>
                        <Calendar className="h-10 w-10 opacity-80" />
                      </div>
                    </Card>
                  </div>

                  <Card className="p-6">
                    <h3 className="text-xl font-bold mb-4">أفضل 5 عملاء</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">اسم العميل</TableHead>
                          <TableHead className="text-right">إجمالي المشتريات</TableHead>
                          <TableHead className="text-right">عدد الفواتير</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salesData.topCustomers.map((customer, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{customer.customer_name}</TableCell>
                            <TableCell>{customer.total_spent.toFixed(2)} ر.س</TableCell>
                            <TableCell>
                              <Badge>{customer.invoices_count}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">لا توجد بيانات</div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">تقرير المخزون</h2>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handlePrintReport('inventory')}>
                    <Printer className="h-4 w-4 ml-2" />
                    طباعة
                  </Button>
                  <Button variant="outline" onClick={() => handleExportCSV('inventory')}>
                    <Download className="h-4 w-4 ml-2" />
                    تصدير CSV
                  </Button>
                </div>
              </div>

              {inventoryLoading ? (
                <div className="text-center py-8">جاري التحميل...</div>
              ) : inventoryData ? (
                <>
                  <div className="grid gap-6 md:grid-cols-4 mb-6">
                    <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm opacity-90">إجمالي المنتجات</div>
                          <div className="text-3xl font-bold mt-2">{inventoryData.totalProducts}</div>
                        </div>
                        <Package className="h-10 w-10 opacity-80" />
                      </div>
                    </Card>

                    <Card className="bg-gradient-to-br from-indigo-500 to-blue-500 text-white p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm opacity-90">قيمة المخزون</div>
                          <div className="text-2xl font-bold mt-2">{inventoryData.totalValue.toFixed(0)}</div>
                          <div className="text-xs opacity-80">ريال سعودي</div>
                        </div>
                        <DollarSign className="h-10 w-10 opacity-80" />
                      </div>
                    </Card>

                    <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm opacity-90">مخزون منخفض</div>
                          <div className="text-3xl font-bold mt-2">{inventoryData.lowStockCount}</div>
                        </div>
                        <ShoppingCart className="h-10 w-10 opacity-80" />
                      </div>
                    </Card>

                    <Card className="bg-gradient-to-br from-red-500 to-pink-500 text-white p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm opacity-90">نفذ من المخزون</div>
                          <div className="text-3xl font-bold mt-2">{inventoryData.outOfStockCount}</div>
                        </div>
                        <Package className="h-10 w-10 opacity-80" />
                      </div>
                    </Card>
                  </div>

                  <Card className="p-6">
                    <h3 className="text-xl font-bold mb-4">أعلى 10 منتجات من حيث القيمة</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">اسم المنتج</TableHead>
                          <TableHead className="text-right">الكمية الحالية</TableHead>
                          <TableHead className="text-right">القيمة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inventoryData.topProducts.map((product, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{product.product_name}</TableCell>
                            <TableCell>
                              <Badge>{product.current_stock}</Badge>
                            </TableCell>
                            <TableCell>{product.value.toFixed(2)} ر.س</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">لا توجد بيانات</div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="bg-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-500">إجمالي العملاء</div>
                    <div className="text-4xl font-bold text-gray-900 mt-2">{customersCount || 0}</div>
                  </div>
                  <div className="h-16 w-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
              </Card>

              <Card className="bg-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-500">إجمالي الفواتير</div>
                    <div className="text-4xl font-bold text-green-600 mt-2">{salesData?.totalInvoices || 0}</div>
                  </div>
                  <div className="h-16 w-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center">
                    <FileText className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              </Card>

              <Card className="bg-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-500">المنتجات</div>
                    <div className="text-4xl font-bold text-purple-600 mt-2">{inventoryData?.totalProducts || 0}</div>
                  </div>
                  <div className="h-16 w-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center">
                    <Package className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">ملخص الأداء</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">معدل التحصيل</span>
                    <span className="font-bold">
                      {salesData ? ((salesData.paidAmount / salesData.totalRevenue) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${salesData ? ((salesData.paidAmount / salesData.totalRevenue) * 100) : 0}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">نسبة المخزون المتوفر</span>
                    <span className="font-bold">
                      {inventoryData ? (((inventoryData.totalProducts - inventoryData.outOfStockCount) / inventoryData.totalProducts) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${inventoryData ? (((inventoryData.totalProducts - inventoryData.outOfStockCount) / inventoryData.totalProducts) * 100) : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Reports;
