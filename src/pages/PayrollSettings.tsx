import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Wallet,
  Plus,
  Settings,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  Shield
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

interface PayrollSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_type: string;
  category: string;
  description: string;
  is_active: boolean;
}

interface AllowanceType {
  id: string;
  allowance_name: string;
  allowance_code: string;
  calculation_type: string;
  default_amount: number;
  is_taxable: boolean;
  is_subject_to_gosi: boolean;
  is_active: boolean;
  description: string;
}

interface DeductionType {
  id: string;
  deduction_name: string;
  deduction_code: string;
  calculation_type: string;
  default_amount: number;
  is_mandatory: boolean;
  is_active: boolean;
  description: string;
}

const PayrollSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<PayrollSetting[]>([]);
  const [allowances, setAllowances] = useState<AllowanceType[]>([]);
  const [deductions, setDeductions] = useState<DeductionType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAllowanceDialogOpen, setIsAllowanceDialogOpen] = useState(false);
  const [isDeductionDialogOpen, setIsDeductionDialogOpen] = useState(false);

  const [newAllowance, setNewAllowance] = useState({
    allowance_name: '',
    allowance_code: '',
    calculation_type: 'fixed',
    default_amount: '',
    is_taxable: false,
    is_subject_to_gosi: false,
    description: ''
  });

  const [newDeduction, setNewDeduction] = useState({
    deduction_name: '',
    deduction_code: '',
    calculation_type: 'fixed',
    default_amount: '',
    is_mandatory: false,
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
        loadSettings(),
        loadAllowances(),
        loadDeductions()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل بيانات الرواتب",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSettings = async () => {
    const { data, error } = await supabase
      .from('payroll_settings')
      .select('*')
      .eq('user_id', user?.id)
      .order('category');

    if (error) throw error;
    setSettings(data || []);
  };

  const loadAllowances = async () => {
    const { data, error } = await supabase
      .from('allowance_types')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setAllowances(data || []);
  };

  const loadDeductions = async () => {
    const { data, error } = await supabase
      .from('deduction_types')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setDeductions(data || []);
  };

  const handleAddAllowance = async () => {
    if (!newAllowance.allowance_name || !newAllowance.allowance_code) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال اسم ورمز البدل",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('allowance_types')
        .insert({
          user_id: user?.id,
          allowance_name: newAllowance.allowance_name,
          allowance_code: newAllowance.allowance_code.toUpperCase(),
          calculation_type: newAllowance.calculation_type,
          default_amount: parseFloat(newAllowance.default_amount || '0'),
          is_taxable: newAllowance.is_taxable,
          is_subject_to_gosi: newAllowance.is_subject_to_gosi,
          description: newAllowance.description,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "تم الإضافة",
        description: "تم إضافة البدل بنجاح"
      });

      setIsAllowanceDialogOpen(false);
      setNewAllowance({
        allowance_name: '',
        allowance_code: '',
        calculation_type: 'fixed',
        default_amount: '',
        is_taxable: false,
        is_subject_to_gosi: false,
        description: ''
      });
      await loadAllowances();
    } catch (error: any) {
      console.error('Error adding allowance:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إضافة البدل",
        variant: "destructive"
      });
    }
  };

  const handleAddDeduction = async () => {
    if (!newDeduction.deduction_name || !newDeduction.deduction_code) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال اسم ورمز الاستقطاع",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('deduction_types')
        .insert({
          user_id: user?.id,
          deduction_name: newDeduction.deduction_name,
          deduction_code: newDeduction.deduction_code.toUpperCase(),
          calculation_type: newDeduction.calculation_type,
          default_amount: parseFloat(newDeduction.default_amount || '0'),
          is_mandatory: newDeduction.is_mandatory,
          description: newDeduction.description,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "تم الإضافة",
        description: "تم إضافة الاستقطاع بنجاح"
      });

      setIsDeductionDialogOpen(false);
      setNewDeduction({
        deduction_name: '',
        deduction_code: '',
        calculation_type: 'fixed',
        default_amount: '',
        is_mandatory: false,
        description: ''
      });
      await loadDeductions();
    } catch (error: any) {
      console.error('Error adding deduction:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إضافة الاستقطاع",
        variant: "destructive"
      });
    }
  };

  const handleToggleAllowance = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('allowance_types')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: `تم ${!currentStatus ? 'تفعيل' : 'إيقاف'} البدل`
      });

      await loadAllowances();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء تحديث الحالة",
        variant: "destructive"
      });
    }
  };

  const handleToggleDeduction = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('deduction_types')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: `تم ${!currentStatus ? 'تفعيل' : 'إيقاف'} الاستقطاع`
      });

      await loadDeductions();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء تحديث الحالة",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAllowance = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا البدل؟')) return;

    try {
      const { error } = await supabase
        .from('allowance_types')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف البدل بنجاح"
      });

      await loadAllowances();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء حذف البدل",
        variant: "destructive"
      });
    }
  };

  const handleDeleteDeduction = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الاستقطاع؟')) return;

    try {
      const { error } = await supabase
        .from('deduction_types')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف الاستقطاع بنجاح"
      });

      await loadDeductions();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء حذف الاستقطاع",
        variant: "destructive"
      });
    }
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
          <p className="text-muted-foreground">جاري تحميل إعدادات الرواتب...</p>
        </div>
      </div>
    );
  }

  const activeAllowances = allowances.filter(a => a.is_active).length;
  const activeDeductions = deductions.filter(d => d.is_active).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wallet className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">إعدادات الرواتب</h1>
            <p className="text-sm text-muted-foreground">
              إدارة البدلات والاستقطاعات وإعدادات الرواتب
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">البدلات النشطة</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAllowances}</div>
            <p className="text-xs text-muted-foreground mt-1">
              من إجمالي {allowances.length} بدل
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">الاستقطاعات النشطة</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDeductions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              من إجمالي {deductions.length} استقطاع
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إعدادات عامة</CardTitle>
            <Settings className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{settings.filter(s => s.is_active).length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              إعداد نشط
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="allowances" className="space-y-4">
        <TabsList>
          <TabsTrigger value="allowances">البدلات</TabsTrigger>
          <TabsTrigger value="deductions">الاستقطاعات</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات العامة</TabsTrigger>
        </TabsList>

        <TabsContent value="allowances" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isAllowanceDialogOpen} onOpenChange={setIsAllowanceDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  إضافة بدل
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إضافة بدل جديد</DialogTitle>
                  <DialogDescription>
                    قم بإضافة نوع بدل جديد لنظام الرواتب
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>اسم البدل</Label>
                      <Input
                        placeholder="بدل سكن"
                        value={newAllowance.allowance_name}
                        onChange={(e) => setNewAllowance({ ...newAllowance, allowance_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>رمز البدل</Label>
                      <Input
                        placeholder="HOU"
                        value={newAllowance.allowance_code}
                        onChange={(e) => setNewAllowance({ ...newAllowance, allowance_code: e.target.value.toUpperCase() })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>طريقة الحساب</Label>
                      <Select
                        value={newAllowance.calculation_type}
                        onValueChange={(value) => setNewAllowance({ ...newAllowance, calculation_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">مبلغ ثابت</SelectItem>
                          <SelectItem value="percentage">نسبة مئوية</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>المبلغ الافتراضي</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newAllowance.default_amount}
                        onChange={(e) => setNewAllowance({ ...newAllowance, default_amount: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>الوصف</Label>
                    <Input
                      placeholder="وصف البدل"
                      value={newAllowance.description}
                      onChange={(e) => setNewAllowance({ ...newAllowance, description: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newAllowance.is_taxable}
                        onCheckedChange={(checked) => setNewAllowance({ ...newAllowance, is_taxable: checked })}
                      />
                      <Label>خاضع للضريبة</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newAllowance.is_subject_to_gosi}
                        onCheckedChange={(checked) => setNewAllowance({ ...newAllowance, is_subject_to_gosi: checked })}
                      />
                      <Label>خاضع للتأمينات الاجتماعية</Label>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAllowanceDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleAddAllowance}>إضافة</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {allowances.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">لا توجد بدلات مضافة</h3>
                    <p className="text-muted-foreground mb-4">
                      ابدأ بإضافة أنواع البدلات المستخدمة في نظام الرواتب
                    </p>
                    <Button onClick={() => setIsAllowanceDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      إضافة بدل جديد
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>البدلات المسجلة</CardTitle>
                <CardDescription>جميع أنواع البدلات في النظام</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم البدل</TableHead>
                      <TableHead>الرمز</TableHead>
                      <TableHead>طريقة الحساب</TableHead>
                      <TableHead>المبلغ الافتراضي</TableHead>
                      <TableHead>خاضع للضريبة</TableHead>
                      <TableHead>خاضع للتأمينات</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allowances.map((allowance) => (
                      <TableRow key={allowance.id}>
                        <TableCell>
                          <div className="font-medium">{allowance.allowance_name}</div>
                          {allowance.description && (
                            <div className="text-xs text-muted-foreground">{allowance.description}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{allowance.allowance_code}</Badge>
                        </TableCell>
                        <TableCell>
                          {allowance.calculation_type === 'fixed' ? 'مبلغ ثابت' : 'نسبة مئوية'}
                        </TableCell>
                        <TableCell>
                          {allowance.calculation_type === 'fixed'
                            ? `${formatCurrency(parseFloat(allowance.default_amount.toString()))} ر.س`
                            : `${allowance.default_amount}%`}
                        </TableCell>
                        <TableCell>
                          {allowance.is_taxable ? (
                            <Badge className="bg-orange-100 text-orange-800">نعم</Badge>
                          ) : (
                            <Badge variant="outline">لا</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {allowance.is_subject_to_gosi ? (
                            <Badge className="bg-blue-100 text-blue-800">نعم</Badge>
                          ) : (
                            <Badge variant="outline">لا</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={allowance.is_active}
                              onCheckedChange={() => handleToggleAllowance(allowance.id, allowance.is_active)}
                            />
                            {allowance.is_active ? (
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
                            onClick={() => handleDeleteAllowance(allowance.id)}
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

        <TabsContent value="deductions" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isDeductionDialogOpen} onOpenChange={setIsDeductionDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  إضافة استقطاع
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إضافة استقطاع جديد</DialogTitle>
                  <DialogDescription>
                    قم بإضافة نوع استقطاع جديد لنظام الرواتب
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>اسم الاستقطاع</Label>
                      <Input
                        placeholder="التأمينات الاجتماعية"
                        value={newDeduction.deduction_name}
                        onChange={(e) => setNewDeduction({ ...newDeduction, deduction_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>رمز الاستقطاع</Label>
                      <Input
                        placeholder="GOSI"
                        value={newDeduction.deduction_code}
                        onChange={(e) => setNewDeduction({ ...newDeduction, deduction_code: e.target.value.toUpperCase() })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>طريقة الحساب</Label>
                      <Select
                        value={newDeduction.calculation_type}
                        onValueChange={(value) => setNewDeduction({ ...newDeduction, calculation_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">مبلغ ثابت</SelectItem>
                          <SelectItem value="percentage">نسبة مئوية</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>المبلغ الافتراضي</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newDeduction.default_amount}
                        onChange={(e) => setNewDeduction({ ...newDeduction, default_amount: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>الوصف</Label>
                    <Input
                      placeholder="وصف الاستقطاع"
                      value={newDeduction.description}
                      onChange={(e) => setNewDeduction({ ...newDeduction, description: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newDeduction.is_mandatory}
                      onCheckedChange={(checked) => setNewDeduction({ ...newDeduction, is_mandatory: checked })}
                    />
                    <Label>استقطاع إلزامي</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDeductionDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleAddDeduction}>إضافة</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {deductions.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <TrendingDown className="h-16 w-16 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">لا توجد استقطاعات مضافة</h3>
                    <p className="text-muted-foreground mb-4">
                      ابدأ بإضافة أنواع الاستقطاعات المستخدمة في نظام الرواتب
                    </p>
                    <Button onClick={() => setIsDeductionDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      إضافة استقطاع جديد
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>الاستقطاعات المسجلة</CardTitle>
                <CardDescription>جميع أنواع الاستقطاعات في النظام</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم الاستقطاع</TableHead>
                      <TableHead>الرمز</TableHead>
                      <TableHead>طريقة الحساب</TableHead>
                      <TableHead>المبلغ الافتراضي</TableHead>
                      <TableHead>إلزامي</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deductions.map((deduction) => (
                      <TableRow key={deduction.id}>
                        <TableCell>
                          <div className="font-medium">{deduction.deduction_name}</div>
                          {deduction.description && (
                            <div className="text-xs text-muted-foreground">{deduction.description}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{deduction.deduction_code}</Badge>
                        </TableCell>
                        <TableCell>
                          {deduction.calculation_type === 'fixed' ? 'مبلغ ثابت' : 'نسبة مئوية'}
                        </TableCell>
                        <TableCell>
                          {deduction.calculation_type === 'fixed'
                            ? `${formatCurrency(parseFloat(deduction.default_amount.toString()))} ر.س`
                            : `${deduction.default_amount}%`}
                        </TableCell>
                        <TableCell>
                          {deduction.is_mandatory ? (
                            <Badge className="bg-red-100 text-red-800">
                              <Shield className="h-3 w-3 mr-1" />
                              نعم
                            </Badge>
                          ) : (
                            <Badge variant="outline">لا</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={deduction.is_active}
                              onCheckedChange={() => handleToggleDeduction(deduction.id, deduction.is_active)}
                            />
                            {deduction.is_active ? (
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
                            onClick={() => handleDeleteDeduction(deduction.id)}
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

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الإعدادات العامة</CardTitle>
              <CardDescription>إعدادات نظام الرواتب العامة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                سيتم إضافة الإعدادات العامة قريباً
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-blue-900 flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              نصائح لإدارة الرواتب
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>البدلات:</strong> حدد البدلات الخاضعة للضريبة والتأمينات الاجتماعية بدقة
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>الاستقطاعات الإلزامية:</strong> التأمينات الاجتماعية إلزامية لجميع الموظفين السعوديين
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>نسبة التأمينات:</strong> 9.75% على الموظف و 12.75% على صاحب العمل من الراتب الأساسي
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>المرونة:</strong> يمكنك إنشاء بدلات واستقطاعات مخصصة حسب احتياجات شركتك
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayrollSettings;
