import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Repeat,
  Plus,
  Download,
  Play,
  Pause,
  Eye,
  Calendar,
  DollarSign
} from "lucide-react";
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
import { Switch } from "@/components/ui/switch";

interface RecurringTransaction {
  id: string;
  transaction_code: string;
  transaction_name: string;
  transaction_type: string;
  category: string;
  party_name: string | null;
  amount: number;
  frequency: string;
  start_date: string;
  end_date: string | null;
  next_execution_date: string;
  last_execution_date: string | null;
  execution_count: number;
  status: string;
  auto_generate: boolean;
}

interface TransactionHistory {
  id: string;
  execution_date: string;
  amount: number;
  status: string;
  notes: string | null;
}

interface TransactionStats {
  totalTransactions: number;
  activeTransactions: number;
  pausedTransactions: number;
  totalMonthlyAmount: number;
  nextExecution: number;
}

const RecurringTransactions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<RecurringTransaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<RecurringTransaction | null>(null);
  const [history, setHistory] = useState<TransactionHistory[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [stats, setStats] = useState<TransactionStats>({
    totalTransactions: 0,
    activeTransactions: 0,
    pausedTransactions: 0,
    totalMonthlyAmount: 0,
    nextExecution: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showViewHistory, setShowViewHistory] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [newTransaction, setNewTransaction] = useState({
    transaction_name: '',
    transaction_type: 'مصروف',
    category: 'اشتراكات',
    account_id: '',
    party_name: '',
    party_type: 'عميل',
    amount: 0,
    frequency: 'شهري',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    next_execution_date: new Date().toISOString().split('T')[0],
    auto_generate: true,
    notify_before_days: 3,
    description: '',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, filterType, filterStatus]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadTransactions(),
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

  const loadTransactions = async () => {
    let query = supabase
      .from("recurring_transactions")
      .select("*")
      .eq("user_id", user?.id)
      .order("next_execution_date", { ascending: true });

    if (filterType !== "all") {
      query = query.eq("transaction_type", filterType);
    }

    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }

    const { data, error } = await query;

    if (error) throw error;
    setTransactions(data || []);
  };

  const loadStats = async () => {
    const { data } = await supabase
      .from("recurring_transactions")
      .select("status, amount, frequency, next_execution_date")
      .eq("user_id", user?.id);

    if (data) {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      const nextExecution = data.filter(t => {
        if (!t.next_execution_date) return false;
        const nextDate = new Date(t.next_execution_date);
        return nextDate >= today && nextDate <= nextWeek;
      }).length;

      const monthlyAmount = data
        .filter(t => t.status === 'نشط' && t.frequency === 'شهري')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      setStats({
        totalTransactions: data.length,
        activeTransactions: data.filter(t => t.status === 'نشط').length,
        pausedTransactions: data.filter(t => t.status === 'متوقف').length,
        totalMonthlyAmount: monthlyAmount,
        nextExecution
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

  const loadHistory = async (transactionId: string) => {
    const { data, error } = await supabase
      .from("recurring_transaction_history")
      .select("*")
      .eq("recurring_transaction_id", transactionId)
      .order("execution_date", { ascending: false });

    if (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل السجل",
        variant: "destructive"
      });
      return;
    }

    setHistory(data || []);
  };

  const handleAddTransaction = async () => {
    if (!newTransaction.transaction_name || !newTransaction.account_id) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى إدخال اسم المعاملة والحساب",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('recurring_transactions')
        .insert([{
          user_id: user?.id,
          transaction_code: '',
          ...newTransaction
        }]);

      if (error) throw error;

      toast({
        title: "تم إضافة المعاملة",
        description: "تم إضافة المعاملة المتكررة بنجاح"
      });

      setShowAddTransaction(false);
      resetNewTransaction();
      loadData();
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة المعاملة",
        variant: "destructive"
      });
    }
  };

  const viewHistory = async (transaction: RecurringTransaction) => {
    setSelectedTransaction(transaction);
    await loadHistory(transaction.id);
    setShowViewHistory(true);
  };

  const handlePause = async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from("recurring_transactions")
        .update({ status: "متوقف" })
        .eq("id", transactionId);

      if (error) throw error;

      toast({
        title: "تم إيقاف المعاملة",
        description: "تم إيقاف المعاملة المتكررة مؤقتاً"
      });

      loadData();
    } catch (error) {
      console.error("Error pausing transaction:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إيقاف المعاملة",
        variant: "destructive"
      });
    }
  };

  const handleResume = async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from("recurring_transactions")
        .update({ status: "نشط" })
        .eq("id", transactionId);

      if (error) throw error;

      toast({
        title: "تم استئناف المعاملة",
        description: "تم استئناف المعاملة المتكررة"
      });

      loadData();
    } catch (error) {
      console.error("Error resuming transaction:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء استئناف المعاملة",
        variant: "destructive"
      });
    }
  };

  const handleExecuteNow = async (transaction: RecurringTransaction) => {
    try {
      const { error } = await supabase
        .from('recurring_transaction_history')
        .insert([{
          user_id: user?.id,
          recurring_transaction_id: transaction.id,
          execution_date: new Date().toISOString().split('T')[0],
          amount: transaction.amount,
          status: 'مكتمل'
        }]);

      if (error) throw error;

      toast({
        title: "تم تنفيذ المعاملة",
        description: "تم تنفيذ المعاملة بنجاح"
      });

      loadData();
    } catch (error) {
      console.error("Error executing transaction:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تنفيذ المعاملة",
        variant: "destructive"
      });
    }
  };

  const resetNewTransaction = () => {
    setNewTransaction({
      transaction_name: '',
      transaction_type: 'مصروف',
      category: 'اشتراكات',
      account_id: '',
      party_name: '',
      party_type: 'عميل',
      amount: 0,
      frequency: 'شهري',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      next_execution_date: new Date().toISOString().split('T')[0],
      auto_generate: true,
      notify_before_days: 3,
      description: '',
      notes: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "نشط":
        return "bg-green-100 text-green-800";
      case "متوقف":
        return "bg-yellow-100 text-yellow-800";
      case "منتهي":
        return "bg-red-100 text-red-800";
      case "معلق":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'إيراد' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "اشتراكات":
        return "bg-blue-100 text-blue-800";
      case "رواتب":
        return "bg-purple-100 text-purple-800";
      case "إيجارات":
        return "bg-orange-100 text-orange-800";
      case "فواتير":
        return "bg-cyan-100 text-cyan-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    return frequency;
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
          <Repeat className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">المعاملات المتكررة</h1>
        </div>
        <Button onClick={() => setShowAddTransaction(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة معاملة متكررة
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المعاملات</CardTitle>
            <Repeat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">معاملة متكررة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">معاملات نشطة</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeTransactions}</div>
            <p className="text-xs text-muted-foreground">معاملة نشطة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">معاملات متوقفة</CardTitle>
            <Pause className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pausedTransactions}</div>
            <p className="text-xs text-muted-foreground">معاملة متوقفة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">التنفيذ القادم</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.nextExecution}</div>
            <p className="text-xs text-muted-foreground">خلال 7 أيام</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">المبلغ الشهري</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.totalMonthlyAmount.toLocaleString()} ر.س</div>
            <p className="text-xs text-muted-foreground">معاملات شهرية</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>قائمة المعاملات المتكررة</CardTitle>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأنواع</SelectItem>
                  <SelectItem value="إيراد">إيراد</SelectItem>
                  <SelectItem value="مصروف">مصروف</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="نشط">نشط</SelectItem>
                  <SelectItem value="متوقف">متوقف</SelectItem>
                  <SelectItem value="منتهي">منتهي</SelectItem>
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
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <Repeat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد معاملات متكررة</p>
              <Button onClick={() => setShowAddTransaction(true)} className="mt-4">
                إضافة معاملة متكررة
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الرمز</TableHead>
                  <TableHead>اسم المعاملة</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>التصنيف</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>التكرار</TableHead>
                  <TableHead>التنفيذ القادم</TableHead>
                  <TableHead>عدد التنفيذات</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.transaction_code}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{transaction.transaction_name}</TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(transaction.transaction_type)}>
                        {transaction.transaction_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(transaction.category)}>
                        {transaction.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{Number(transaction.amount).toLocaleString()} ر.س</TableCell>
                    <TableCell>{getFrequencyLabel(transaction.frequency)}</TableCell>
                    <TableCell>{new Date(transaction.next_execution_date).toLocaleDateString('ar-SA')}</TableCell>
                    <TableCell className="text-center">{transaction.execution_count}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewHistory(transaction)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {transaction.status === 'نشط' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePause(transaction.id)}
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        ) : transaction.status === 'متوقف' ? (
                          <Button
                            size="sm"
                            onClick={() => handleResume(transaction.id)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        ) : null}
                        {transaction.status === 'نشط' && (
                          <Button
                            size="sm"
                            onClick={() => handleExecuteNow(transaction)}
                          >
                            تنفيذ الآن
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddTransaction} onOpenChange={setShowAddTransaction}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة معاملة متكررة</DialogTitle>
            <DialogDescription>
              أدخل بيانات المعاملة المتكررة
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="transaction_name">اسم المعاملة *</Label>
                <Input
                  id="transaction_name"
                  value={newTransaction.transaction_name}
                  onChange={(e) => setNewTransaction({...newTransaction, transaction_name: e.target.value})}
                  placeholder="اشتراك Netflix"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="transaction_type">النوع *</Label>
                <Select
                  value={newTransaction.transaction_type}
                  onValueChange={(v) => setNewTransaction({...newTransaction, transaction_type: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="إيراد">إيراد</SelectItem>
                    <SelectItem value="مصروف">مصروف</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">التصنيف *</Label>
                <Select
                  value={newTransaction.category}
                  onValueChange={(v) => setNewTransaction({...newTransaction, category: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="اشتراكات">اشتراكات</SelectItem>
                    <SelectItem value="رواتب">رواتب</SelectItem>
                    <SelectItem value="إيجارات">إيجارات</SelectItem>
                    <SelectItem value="فواتير">فواتير</SelectItem>
                    <SelectItem value="صيانة">صيانة</SelectItem>
                    <SelectItem value="أخرى">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="account_id">الحساب *</Label>
                <Select
                  value={newTransaction.account_id}
                  onValueChange={(v) => setNewTransaction({...newTransaction, account_id: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر حساب" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_code} - {account.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">المبلغ *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({...newTransaction, amount: Number(e.target.value)})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="frequency">التكرار *</Label>
                <Select
                  value={newTransaction.frequency}
                  onValueChange={(v) => setNewTransaction({...newTransaction, frequency: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="يومي">يومي</SelectItem>
                    <SelectItem value="أسبوعي">أسبوعي</SelectItem>
                    <SelectItem value="شهري">شهري</SelectItem>
                    <SelectItem value="ربع سنوي">ربع سنوي</SelectItem>
                    <SelectItem value="نصف سنوي">نصف سنوي</SelectItem>
                    <SelectItem value="سنوي">سنوي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="start_date">تاريخ البداية *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={newTransaction.start_date}
                  onChange={(e) => setNewTransaction({...newTransaction, start_date: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="party_name">اسم الطرف</Label>
                <Input
                  id="party_name"
                  value={newTransaction.party_name}
                  onChange={(e) => setNewTransaction({...newTransaction, party_name: e.target.value})}
                  placeholder="اسم العميل أو المورد"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end_date">تاريخ النهاية</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={newTransaction.end_date}
                  onChange={(e) => setNewTransaction({...newTransaction, end_date: e.target.value})}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Switch
                id="auto_generate"
                checked={newTransaction.auto_generate}
                onCheckedChange={(checked) => setNewTransaction({...newTransaction, auto_generate: checked})}
              />
              <Label htmlFor="auto_generate">توليد تلقائي للمعاملات</Label>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={newTransaction.description}
                onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                placeholder="وصف المعاملة"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTransaction(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddTransaction}>
              حفظ المعاملة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showViewHistory} onOpenChange={setShowViewHistory}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>سجل المعاملة - {selectedTransaction?.transaction_code}</DialogTitle>
            <DialogDescription>
              عرض سجل تنفيذ المعاملة المتكررة
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">اسم المعاملة</p>
                <p className="font-medium">{selectedTransaction?.transaction_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">المبلغ</p>
                <p className="font-medium">{Number(selectedTransaction?.amount).toLocaleString()} ر.س</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">عدد التنفيذات</p>
                <p className="font-medium">{selectedTransaction?.execution_count}</p>
              </div>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا يوجد سجل تنفيذ لهذه المعاملة
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>تاريخ التنفيذ</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>ملاحظات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{new Date(item.execution_date).toLocaleDateString('ar-SA')}</TableCell>
                      <TableCell>{Number(item.amount).toLocaleString()} ر.س</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.notes || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecurringTransactions;
