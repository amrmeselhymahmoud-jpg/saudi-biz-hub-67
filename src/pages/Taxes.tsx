import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Receipt,
  Plus,
  TrendingUp,
  TrendingDown,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Edit,
  Trash2,
  Calculator,
  AlertCircle,
  Download,
  Send
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TaxType {
  id: string;
  tax_name: string;
  tax_name_en: string;
  tax_code: string;
  tax_rate: number;
  is_active: boolean;
  applies_to: string;
  calculation_method: string;
  description: string;
}

interface TaxTransaction {
  id: string;
  tax_type_id: string;
  transaction_type: string;
  transaction_reference: string;
  transaction_date: string;
  base_amount: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  tax_name: string;
  tax_code: string;
}

interface TaxReturn {
  id: string;
  return_period: string;
  period_start: string;
  period_end: string;
  total_sales: number;
  total_purchases: number;
  output_tax: number;
  input_tax: number;
  net_tax: number;
  status: string;
  submission_date: string | null;
  payment_date: string | null;
}

const Taxes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [taxTypes, setTaxTypes] = useState<TaxType[]>([]);
  const [transactions, setTransactions] = useState<TaxTransaction[]>([]);
  const [taxReturns, setTaxReturns] = useState<TaxReturn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const [newTax, setNewTax] = useState({
    tax_name: '',
    tax_name_en: '',
    tax_code: '',
    tax_rate: '',
    applies_to: 'both',
    calculation_method: 'exclusive',
    description: ''
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadTaxTypes(),
        loadTransactions(),
        loadTaxReturns()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل بيانات الضرائب",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadTaxTypes = async () => {
    const { data, error } = await supabase
      .from('tax_types')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setTaxTypes(data || []);
  };

  const loadTransactions = async () => {
    const { data, error } = await supabase
      .from('tax_transactions')
      .select(`
        *,
        tax_types!tax_transactions_tax_type_id_fkey (
          tax_name,
          tax_code
        )
      `)
      .eq('user_id', user?.id)
      .order('transaction_date', { ascending: false })
      .limit(20);

    if (error) throw error;

    const formattedTransactions = (data || []).map(t => ({
      ...t,
      tax_name: t.tax_types?.tax_name || '',
      tax_code: t.tax_types?.tax_code || ''
    }));

    setTransactions(formattedTransactions);
  };

  const loadTaxReturns = async () => {
    const { data, error } = await supabase
      .from('tax_returns')
      .select('*')
      .eq('user_id', user?.id)
      .order('period_start', { ascending: false })
      .limit(10);

    if (error) throw error;
    setTaxReturns(data || []);
  };

  const handleAddTax = async () => {
    if (!newTax.tax_name || !newTax.tax_code || !newTax.tax_rate) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال جميع البيانات المطلوبة",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('tax_types')
        .insert({
          user_id: user?.id,
          tax_name: newTax.tax_name,
          tax_name_en: newTax.tax_name_en,
          tax_code: newTax.tax_code.toUpperCase(),
          tax_rate: parseFloat(newTax.tax_rate),
          applies_to: newTax.applies_to,
          calculation_method: newTax.calculation_method,
          description: newTax.description,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "تم الإضافة",
        description: "تم إضافة نوع الضريبة بنجاح"
      });

      setIsAddDialogOpen(false);
      setNewTax({
        tax_name: '',
        tax_name_en: '',
        tax_code: '',
        tax_rate: '',
        applies_to: 'both',
        calculation_method: 'exclusive',
        description: ''
      });
      await loadTaxTypes();
    } catch (error: any) {
      console.error('Error adding tax:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إضافة الضريبة",
        variant: "destructive"
      });
    }
  };

  const handleToggleActive = async (taxId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('tax_types')
        .update({ is_active: !currentStatus })
        .eq('id', taxId);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: `تم ${!currentStatus ? 'تفعيل' : 'إيقاف'} الضريبة`
      });

      await loadTaxTypes();
    } catch (error: any) {
      console.error('Error toggling status:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء تحديث الحالة",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTax = async (taxId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الضريبة؟')) return;

    try {
      const { error } = await supabase
        .from('tax_types')
        .delete()
        .eq('id', taxId);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف الضريبة بنجاح"
      });

      await loadTaxTypes();
    } catch (error: any) {
      console.error('Error deleting tax:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء حذف الضريبة",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
      pending: { label: 'معلق', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      paid: { label: 'مدفوع', className: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      submitted: { label: 'مقدم', className: 'bg-blue-100 text-blue-800', icon: Send },
      draft: { label: 'مسودة', className: 'bg-gray-100 text-gray-800', icon: FileText },
      overdue: { label: 'متأخر', className: 'bg-red-100 text-red-800', icon: AlertCircle },
      cancelled: { label: 'ملغي', className: 'bg-gray-100 text-gray-800', icon: XCircle }
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ar-SA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل بيانات الضرائب...</p>
        </div>
      </div>
    );
  }

  const totalOutputTax = transactions
    .filter(t => t.transaction_type === 'invoice')
    .reduce((sum, t) => sum + parseFloat(t.tax_amount.toString()), 0);

  const totalInputTax = transactions
    .filter(t => t.transaction_type === 'bill')
    .reduce((sum, t) => sum + parseFloat(t.tax_amount.toString()), 0);

  const netTaxPayable = totalOutputTax - totalInputTax;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Receipt className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">الضرائب</h1>
            <p className="text-sm text-muted-foreground">
              إدارة الضرائب والإقرارات الضريبية
            </p>
          </div>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة ضريبة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة نوع ضريبة جديد</DialogTitle>
              <DialogDescription>
                قم بإضافة نوع ضريبة جديد للنظام
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اسم الضريبة (عربي)</Label>
                  <Input
                    placeholder="ضريبة القيمة المضافة"
                    value={newTax.tax_name}
                    onChange={(e) => setNewTax({ ...newTax, tax_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>اسم الضريبة (إنجليزي)</Label>
                  <Input
                    placeholder="VAT"
                    value={newTax.tax_name_en}
                    onChange={(e) => setNewTax({ ...newTax, tax_name_en: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>رمز الضريبة</Label>
                  <Input
                    placeholder="VAT"
                    value={newTax.tax_code}
                    onChange={(e) => setNewTax({ ...newTax, tax_code: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>النسبة (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="15"
                    value={newTax.tax_rate}
                    onChange={(e) => setNewTax({ ...newTax, tax_rate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>ينطبق على</Label>
                <Select
                  value={newTax.applies_to}
                  onValueChange={(value) => setNewTax({ ...newTax, applies_to: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">المبيعات فقط</SelectItem>
                    <SelectItem value="purchases">المشتريات فقط</SelectItem>
                    <SelectItem value="both">المبيعات والمشتريات</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>طريقة الحساب</Label>
                <Select
                  value={newTax.calculation_method}
                  onValueChange={(value) => setNewTax({ ...newTax, calculation_method: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exclusive">مستثناة من السعر</SelectItem>
                    <SelectItem value="inclusive">مشمولة في السعر</SelectItem>
                    <SelectItem value="fixed">مبلغ ثابت</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>الوصف</Label>
                <Input
                  placeholder="وصف الضريبة"
                  value={newTax.description}
                  onChange={(e) => setNewTax({ ...newTax, description: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleAddTax}>إضافة</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ضريبة المبيعات</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalOutputTax)}</div>
            <p className="text-xs text-muted-foreground mt-1">ضريبة المخرجات</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ضريبة المشتريات</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInputTax)}</div>
            <p className="text-xs text-muted-foreground mt-1">ضريبة المدخلات</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">صافي الضريبة</CardTitle>
            <Calculator className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netTaxPayable >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(Math.abs(netTaxPayable))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {netTaxPayable >= 0 ? 'مستحق الدفع' : 'مستحق الاسترداد'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">أنواع الضرائب</CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taxTypes.filter(t => t.is_active).length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              من إجمالي {taxTypes.length} ضريبة
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="types" className="space-y-4">
        <TabsList>
          <TabsTrigger value="types">أنواع الضرائب</TabsTrigger>
          <TabsTrigger value="transactions">المعاملات الضريبية</TabsTrigger>
          <TabsTrigger value="returns">الإقرارات الضريبية</TabsTrigger>
        </TabsList>

        <TabsContent value="types" className="space-y-4">
          {taxTypes.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <Receipt className="h-16 w-16 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">لا توجد ضرائب مضافة</h3>
                    <p className="text-muted-foreground mb-4">
                      ابدأ بإضافة أنواع الضرائب المستخدمة في نشاطك التجاري
                    </p>
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      إضافة ضريبة جديدة
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>أنواع الضرائب المسجلة</CardTitle>
                <CardDescription>جميع أنواع الضرائب في النظام</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم الضريبة</TableHead>
                      <TableHead>الرمز</TableHead>
                      <TableHead>النسبة</TableHead>
                      <TableHead>ينطبق على</TableHead>
                      <TableHead>طريقة الحساب</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taxTypes.map((tax) => (
                      <TableRow key={tax.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{tax.tax_name}</div>
                            <div className="text-xs text-muted-foreground">{tax.tax_name_en}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{tax.tax_code}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{tax.tax_rate}%</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {tax.applies_to === 'sales' ? 'المبيعات' :
                             tax.applies_to === 'purchases' ? 'المشتريات' : 'كلاهما'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {tax.calculation_method === 'exclusive' ? 'مستثناة' :
                             tax.calculation_method === 'inclusive' ? 'مشمولة' : 'ثابت'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={tax.is_active}
                              onCheckedChange={() => handleToggleActive(tax.id, tax.is_active)}
                            />
                            {tax.is_active ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                نشط
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-800">
                                <XCircle className="h-3 w-3 mr-1" />
                                معطل
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteTax(tax.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>المعاملات الضريبية</CardTitle>
              <CardDescription>آخر 20 معاملة ضريبية</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد معاملات ضريبية حالياً
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>المرجع</TableHead>
                      <TableHead>الضريبة</TableHead>
                      <TableHead>المبلغ الأساسي</TableHead>
                      <TableHead>مبلغ الضريبة</TableHead>
                      <TableHead>الإجمالي</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {new Date(transaction.transaction_date).toLocaleDateString('ar-SA')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {transaction.transaction_type === 'invoice' ? 'فاتورة بيع' :
                             transaction.transaction_type === 'bill' ? 'فاتورة شراء' :
                             transaction.transaction_type === 'payment' ? 'دفعة' : 'إيصال'}
                          </Badge>
                        </TableCell>
                        <TableCell>{transaction.transaction_reference}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{transaction.tax_code}</Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(parseFloat(transaction.base_amount.toString()))}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(parseFloat(transaction.tax_amount.toString()))}
                        </TableCell>
                        <TableCell className="font-bold">
                          {formatCurrency(parseFloat(transaction.total_amount.toString()))}
                        </TableCell>
                        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="returns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الإقرارات الضريبية</CardTitle>
              <CardDescription>آخر 10 إقرارات ضريبية</CardDescription>
            </CardHeader>
            <CardContent>
              {taxReturns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد إقرارات ضريبية حالياً
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الفترة</TableHead>
                      <TableHead>من - إلى</TableHead>
                      <TableHead>المبيعات</TableHead>
                      <TableHead>المشتريات</TableHead>
                      <TableHead>ض. المخرجات</TableHead>
                      <TableHead>ض. المدخلات</TableHead>
                      <TableHead>صافي الضريبة</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taxReturns.map((taxReturn) => (
                      <TableRow key={taxReturn.id}>
                        <TableCell className="font-medium">{taxReturn.return_period}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{new Date(taxReturn.period_start).toLocaleDateString('ar-SA')}</div>
                            <div>{new Date(taxReturn.period_end).toLocaleDateString('ar-SA')}</div>
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(parseFloat(taxReturn.total_sales.toString()))}</TableCell>
                        <TableCell>{formatCurrency(parseFloat(taxReturn.total_purchases.toString()))}</TableCell>
                        <TableCell>{formatCurrency(parseFloat(taxReturn.output_tax.toString()))}</TableCell>
                        <TableCell>{formatCurrency(parseFloat(taxReturn.input_tax.toString()))}</TableCell>
                        <TableCell className={parseFloat(taxReturn.net_tax.toString()) >= 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
                          {formatCurrency(Math.abs(parseFloat(taxReturn.net_tax.toString())))}
                        </TableCell>
                        <TableCell>{getStatusBadge(taxReturn.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-blue-900 flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              نصائح ضريبية هامة
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>ضريبة القيمة المضافة:</strong> النسبة الأساسية في السعودية 15%
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>الإقرار الضريبي:</strong> يجب تقديمه شهرياً أو ربع سنوياً حسب حجم الأعمال
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>الربط مع فاتورة:</strong> تأكد من ربط النظام مع منصة فاتورة الإلكترونية
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>السجلات:</strong> احتفظ بجميع الفواتير والمستندات لمدة 6 سنوات على الأقل
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Taxes;
