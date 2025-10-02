import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers, Plus, Download, TrendingUp, TrendingDown, DollarSign, Eye, CircleCheck as CheckCircle, CircleAlert as AlertCircle } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

interface Budget {
  id: string;
  budget_code: string;
  budget_name: string;
  fiscal_year: number;
  start_date: string;
  end_date: string;
  budget_type: string;
  status: string;
  total_budget: number;
  total_actual: number;
  total_variance: number;
}

interface BudgetItem {
  id: string;
  budget_amount: number;
  actual_amount: number;
  variance_amount: number;
  variance_percentage: number;
  chart_of_accounts: {
    account_code: string;
    account_name: string;
    account_type: string;
  };
}

interface BudgetStats {
  totalBudgets: number;
  activeBudgets: number;
  totalBudgetAmount: number;
  totalActualAmount: number;
  averageUtilization: number;
}

const Budgets = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [stats, setStats] = useState<BudgetStats>({
    totalBudgets: 0,
    activeBudgets: 0,
    totalBudgetAmount: 0,
    totalActualAmount: 0,
    averageUtilization: 0
  });
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [showViewBudget, setShowViewBudget] = useState(false);
  const [showAddItems, setShowAddItems] = useState(false);
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [newBudget, setNewBudget] = useState({
    budget_name: '',
    fiscal_year: new Date().getFullYear(),
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    budget_type: 'سنوي',
    description: '',
    notes: ''
  });
  const [selectedAccounts, setSelectedAccounts] = useState<{[key: string]: number}>({});

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, filterYear, filterStatus]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadBudgets(),
        loadStats(),
        loadAccounts()
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل البيانات",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadBudgets = async () => {
    let query = supabase
      .from("budgets")
      .select("*")
      .eq("user_id", user?.id)
      .order("fiscal_year", { ascending: false });

    if (filterYear !== "all") {
      query = query.eq("fiscal_year", Number(filterYear));
    }

    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }

    const { data, error } = await query;

    if (error) throw error;
    setBudgets(data || []);
  };

  const loadStats = async () => {
    const { data } = await supabase
      .from("budgets")
      .select("status, total_budget, total_actual")
      .eq("user_id", user?.id);

    if (data) {
      const totalBudgetAmount = data.reduce((sum, b) => sum + Number(b.total_budget), 0);
      const totalActualAmount = data.reduce((sum, b) => sum + Number(b.total_actual), 0);

      setStats({
        totalBudgets: data.length,
        activeBudgets: data.filter(b => b.status === 'نشط').length,
        totalBudgetAmount,
        totalActualAmount,
        averageUtilization: totalBudgetAmount > 0 ? (totalActualAmount / totalBudgetAmount) * 100 : 0
      });
    }
  };

  const loadAccounts = async () => {
    const { data } = await supabase
      .from('chart_of_accounts')
      .select('id, account_code, account_name, account_type')
      .eq('user_id', user?.id)
      .eq('is_active', true)
      .order('account_code');

    if (data) {
      setAccounts(data);
    }
  };

  const loadBudgetItems = async (budgetId: string) => {
    const { data, error } = await supabase
      .from("budget_items")
      .select(`
        *,
        chart_of_accounts (
          account_code,
          account_name,
          account_type
        )
      `)
      .eq("budget_id", budgetId);

    if (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل بنود الموازنة",
        variant: "destructive"
      });
      return;
    }

    setBudgetItems(data || []);
  };

  const handleAddBudget = async () => {
    if (!newBudget.budget_name || !newBudget.end_date) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى إدخال جميع البيانات المطلوبة",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('budgets')
        .insert([{
          user_id: user?.id,
          budget_code: '',
          ...newBudget
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "تم إضافة الموازنة",
        description: "تم إضافة الموازنة بنجاح"
      });

      setShowAddBudget(false);
      setSelectedBudget(data);
      setShowAddItems(true);
      resetNewBudget();
      loadData();
    } catch (error) {
      console.error('Error adding budget:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة الموازنة",
        variant: "destructive"
      });
    }
  };

  const handleAddBudgetItems = async () => {
    if (Object.keys(selectedAccounts).length === 0) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى اختيار حساب واحد على الأقل",
        variant: "destructive"
      });
      return;
    }

    try {
      const items = Object.entries(selectedAccounts).map(([accountId, amount]) => ({
        user_id: user?.id,
        budget_id: selectedBudget?.id,
        account_id: accountId,
        budget_amount: amount
      }));

      const { error } = await supabase
        .from('budget_items')
        .insert(items);

      if (error) throw error;

      toast({
        title: "تم إضافة البنود",
        description: "تم إضافة بنود الموازنة بنجاح"
      });

      setShowAddItems(false);
      setSelectedAccounts({});
      loadData();
    } catch (error) {
      console.error('Error adding budget items:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة بنود الموازنة",
        variant: "destructive"
      });
    }
  };

  const viewBudget = async (budget: Budget) => {
    setSelectedBudget(budget);
    await loadBudgetItems(budget.id);
    setShowViewBudget(true);
  };

  const handleApprove = async (budgetId: string) => {
    try {
      const { error } = await supabase
        .from("budgets")
        .update({
          status: "معتمد",
          approved_date: new Date().toISOString().split('T')[0]
        })
        .eq("id", budgetId);

      if (error) throw error;

      toast({
        title: "تم اعتماد الموازنة",
        description: "تم اعتماد الموازنة بنجاح"
      });

      loadData();
    } catch (error) {
      console.error("Error approving budget:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء اعتماد الموازنة",
        variant: "destructive"
      });
    }
  };

  const handleActivate = async (budgetId: string) => {
    try {
      const { error } = await supabase
        .from("budgets")
        .update({ status: "نشط" })
        .eq("id", budgetId);

      if (error) throw error;

      toast({
        title: "تم تفعيل الموازنة",
        description: "تم تفعيل الموازنة بنجاح"
      });

      loadData();
    } catch (error) {
      console.error("Error activating budget:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تفعيل الموازنة",
        variant: "destructive"
      });
    }
  };

  const resetNewBudget = () => {
    setNewBudget({
      budget_name: '',
      fiscal_year: new Date().getFullYear(),
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      budget_type: 'سنوي',
      description: '',
      notes: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "نشط":
        return "bg-green-100 text-green-800";
      case "معتمد":
        return "bg-blue-100 text-blue-800";
      case "مسودة":
        return "bg-yellow-100 text-yellow-800";
      case "مغلق":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return "text-red-600";
    if (variance < 0) return "text-green-600";
    return "text-gray-600";
  };

  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 2; i++) {
      years.push(i);
    }
    return years;
  };

  const getUtilizationPercentage = (budget: number, actual: number) => {
    if (budget === 0) return 0;
    return (actual / budget) * 100;
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">الموازنات</h1>
        </div>
        <Button onClick={() => setShowAddBudget(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة موازنة
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الموازنات</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBudgets}</div>
            <p className="text-xs text-muted-foreground">موازنة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">الموازنات النشطة</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeBudgets}</div>
            <p className="text-xs text-muted-foreground">موازنة نشطة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الموازنة</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBudgetAmount.toLocaleString()} ر.س</div>
            <p className="text-xs text-muted-foreground">المبلغ المخطط</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">المصروف الفعلي</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalActualAmount.toLocaleString()} ر.س</div>
            <p className="text-xs text-muted-foreground">المبلغ المنفذ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">نسبة التنفيذ</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.averageUtilization.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">متوسط الاستخدام</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>قائمة الموازنات</CardTitle>
            <div className="flex gap-2">
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل السنوات</SelectItem>
                  {getAvailableYears().map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="مسودة">مسودة</SelectItem>
                  <SelectItem value="معتمد">معتمد</SelectItem>
                  <SelectItem value="نشط">نشط</SelectItem>
                  <SelectItem value="مغلق">مغلق</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                تصدير
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {budgets.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد موازنات مسجلة</p>
              <Button onClick={() => setShowAddBudget(true)} className="mt-4">
                إضافة موازنة جديدة
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الرمز</TableHead>
                  <TableHead>اسم الموازنة</TableHead>
                  <TableHead>السنة المالية</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الموازنة</TableHead>
                  <TableHead>الفعلي</TableHead>
                  <TableHead>الانحراف</TableHead>
                  <TableHead>نسبة التنفيذ</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgets.map((budget) => {
                  const utilizationPercent = getUtilizationPercentage(
                    Number(budget.total_budget),
                    Number(budget.total_actual)
                  );
                  return (
                    <TableRow key={budget.id}>
                      <TableCell className="font-medium">{budget.budget_code}</TableCell>
                      <TableCell>{budget.budget_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{budget.fiscal_year}</Badge>
                      </TableCell>
                      <TableCell>{budget.budget_type}</TableCell>
                      <TableCell>{Number(budget.total_budget).toLocaleString()} ر.س</TableCell>
                      <TableCell className="text-blue-600">{Number(budget.total_actual).toLocaleString()} ر.س</TableCell>
                      <TableCell className={getVarianceColor(Number(budget.total_variance))}>
                        {Number(budget.total_variance).toLocaleString()} ر.س
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Progress value={utilizationPercent} className="h-2" />
                          <p className="text-xs text-muted-foreground">{utilizationPercent.toFixed(1)}%</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(budget.status)}>
                          {budget.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewBudget(budget)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {budget.status === 'مسودة' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprove(budget.id)}
                            >
                              اعتماد
                            </Button>
                          )}
                          {budget.status === 'معتمد' && (
                            <Button
                              size="sm"
                              onClick={() => handleActivate(budget.id)}
                            >
                              تفعيل
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddBudget} onOpenChange={setShowAddBudget}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>إضافة موازنة جديدة</DialogTitle>
            <DialogDescription>
              أدخل بيانات الموازنة
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="budget_name">اسم الموازنة *</Label>
                <Input
                  id="budget_name"
                  value={newBudget.budget_name}
                  onChange={(e) => setNewBudget({...newBudget, budget_name: e.target.value})}
                  placeholder="موازنة 2025"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fiscal_year">السنة المالية *</Label>
                <Input
                  id="fiscal_year"
                  type="number"
                  value={newBudget.fiscal_year}
                  onChange={(e) => setNewBudget({...newBudget, fiscal_year: Number(e.target.value)})}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start_date">تاريخ البداية *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={newBudget.start_date}
                  onChange={(e) => setNewBudget({...newBudget, start_date: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end_date">تاريخ النهاية *</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={newBudget.end_date}
                  onChange={(e) => setNewBudget({...newBudget, end_date: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="budget_type">نوع الموازنة</Label>
                <Select
                  value={newBudget.budget_type}
                  onValueChange={(v) => setNewBudget({...newBudget, budget_type: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="سنوي">سنوي</SelectItem>
                    <SelectItem value="ربع سنوي">ربع سنوي</SelectItem>
                    <SelectItem value="شهري">شهري</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={newBudget.description}
                onChange={(e) => setNewBudget({...newBudget, description: e.target.value})}
                placeholder="وصف الموازنة"
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                value={newBudget.notes}
                onChange={(e) => setNewBudget({...newBudget, notes: e.target.value})}
                placeholder="ملاحظات إضافية"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddBudget(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddBudget}>
              إضافة وتحديد البنود
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddItems} onOpenChange={setShowAddItems}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة بنود الموازنة</DialogTitle>
            <DialogDescription>
              اختر الحسابات وحدد المبالغ المخططة
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{account.account_code} - {account.account_name}</p>
                  <p className="text-sm text-muted-foreground">{account.account_type}</p>
                </div>
                <Input
                  type="number"
                  placeholder="0"
                  className="w-32"
                  value={selectedAccounts[account.id] || ''}
                  onChange={(e) => setSelectedAccounts({
                    ...selectedAccounts,
                    [account.id]: Number(e.target.value)
                  })}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddItems(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddBudgetItems}>
              حفظ البنود
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showViewBudget} onOpenChange={setShowViewBudget}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل الموازنة - {selectedBudget?.budget_code}</DialogTitle>
            <DialogDescription>
              عرض تفاصيل بنود الموازنة
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">اسم الموازنة</p>
                <p className="font-medium">{selectedBudget?.budget_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">السنة المالية</p>
                <p className="font-medium">{selectedBudget?.fiscal_year}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">النوع</p>
                <p className="font-medium">{selectedBudget?.budget_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الحالة</p>
                <Badge className={getStatusColor(selectedBudget?.status || '')}>
                  {selectedBudget?.status}
                </Badge>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الحساب</TableHead>
                    <TableHead>الموازنة</TableHead>
                    <TableHead>الفعلي</TableHead>
                    <TableHead>الانحراف</TableHead>
                    <TableHead>نسبة الانحراف</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgetItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.chart_of_accounts.account_code} - {item.chart_of_accounts.account_name}
                      </TableCell>
                      <TableCell>{Number(item.budget_amount).toLocaleString()} ر.س</TableCell>
                      <TableCell className="text-blue-600">{Number(item.actual_amount).toLocaleString()} ر.س</TableCell>
                      <TableCell className={getVarianceColor(Number(item.variance_amount))}>
                        {Number(item.variance_amount).toLocaleString()} ر.س
                      </TableCell>
                      <TableCell className={getVarianceColor(Number(item.variance_percentage))}>
                        {Number(item.variance_percentage).toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-gray-50">
                    <TableCell>الإجمالي</TableCell>
                    <TableCell>{Number(selectedBudget?.total_budget).toLocaleString()} ر.س</TableCell>
                    <TableCell className="text-blue-600">{Number(selectedBudget?.total_actual).toLocaleString()} ر.س</TableCell>
                    <TableCell className={getVarianceColor(Number(selectedBudget?.total_variance))}>
                      {Number(selectedBudget?.total_variance).toLocaleString()} ر.س
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Budgets;
