import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  HandCoins,
  Plus,
  Calendar,
  Percent,
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  Star,
  Receipt
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PaymentTerm {
  id: string;
  term_name: string;
  term_code: string;
  days_until_due: number;
  discount_percentage: number;
  discount_days: number;
  description: string;
  is_active: boolean;
  is_default: boolean;
}

interface PaymentSchedule {
  id: string;
  payment_term_id: string;
  schedule_name: string;
  number_of_installments: number;
  installment_percentage: number;
  days_between_installments: number;
  description: string;
  is_active: boolean;
  term_name?: string;
}

const PaymentTerms = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [terms, setTerms] = useState<PaymentTerm[]>([]);
  const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTermDialogOpen, setIsTermDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);

  const [newTerm, setNewTerm] = useState({
    term_name: '',
    term_code: '',
    days_until_due: '',
    discount_percentage: '',
    discount_days: '',
    description: ''
  });

  const [newSchedule, setNewSchedule] = useState({
    payment_term_id: '',
    schedule_name: '',
    number_of_installments: '',
    installment_percentage: '',
    days_between_installments: '',
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
        loadTerms(),
        loadSchedules()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل بيانات شروط الدفع",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadTerms = async () => {
    const { data, error } = await supabase
      .from('payment_terms')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setTerms(data || []);
  };

  const loadSchedules = async () => {
    const { data, error } = await supabase
      .from('payment_schedules')
      .select(`
        *,
        payment_terms!payment_schedules_payment_term_id_fkey (
          term_name
        )
      `)
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedSchedules = (data || []).map(schedule => ({
      ...schedule,
      term_name: schedule.payment_terms?.term_name || 'غير محدد'
    }));

    setSchedules(formattedSchedules);
  };

  const handleAddTerm = async () => {
    if (!newTerm.term_name || !newTerm.term_code) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال اسم ورمز الشرط",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('payment_terms')
        .insert({
          user_id: user?.id,
          term_name: newTerm.term_name,
          term_code: newTerm.term_code.toUpperCase(),
          days_until_due: parseInt(newTerm.days_until_due || '0'),
          discount_percentage: parseFloat(newTerm.discount_percentage || '0'),
          discount_days: parseInt(newTerm.discount_days || '0'),
          description: newTerm.description,
          is_active: true,
          is_default: false
        });

      if (error) throw error;

      toast({
        title: "تم الإضافة",
        description: "تم إضافة شرط الدفع بنجاح"
      });

      setIsTermDialogOpen(false);
      setNewTerm({
        term_name: '',
        term_code: '',
        days_until_due: '',
        discount_percentage: '',
        discount_days: '',
        description: ''
      });
      await loadTerms();
    } catch (error: any) {
      console.error('Error adding term:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إضافة شرط الدفع",
        variant: "destructive"
      });
    }
  };

  const handleAddSchedule = async () => {
    if (!newSchedule.schedule_name || !newSchedule.payment_term_id) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال اسم الجدول وشرط الدفع",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('payment_schedules')
        .insert({
          user_id: user?.id,
          payment_term_id: newSchedule.payment_term_id,
          schedule_name: newSchedule.schedule_name,
          number_of_installments: parseInt(newSchedule.number_of_installments || '1'),
          installment_percentage: parseFloat(newSchedule.installment_percentage || '100'),
          days_between_installments: parseInt(newSchedule.days_between_installments || '30'),
          description: newSchedule.description,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "تم الإضافة",
        description: "تم إضافة جدول الدفع بنجاح"
      });

      setIsScheduleDialogOpen(false);
      setNewSchedule({
        payment_term_id: '',
        schedule_name: '',
        number_of_installments: '',
        installment_percentage: '',
        days_between_installments: '',
        description: ''
      });
      await loadSchedules();
    } catch (error: any) {
      console.error('Error adding schedule:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إضافة جدول الدفع",
        variant: "destructive"
      });
    }
  };

  const handleToggleTerm = async (termId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('payment_terms')
        .update({ is_active: !currentStatus })
        .eq('id', termId);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: `تم ${!currentStatus ? 'تفعيل' : 'إيقاف'} شرط الدفع`
      });

      await loadTerms();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء تحديث الحالة",
        variant: "destructive"
      });
    }
  };

  const handleSetDefault = async (termId: string) => {
    try {
      await supabase
        .from('payment_terms')
        .update({ is_default: false })
        .eq('user_id', user?.id);

      const { error } = await supabase
        .from('payment_terms')
        .update({ is_default: true })
        .eq('id', termId);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: "تم تعيين شرط الدفع كافتراضي"
      });

      await loadTerms();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء التحديث",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTerm = async (termId: string) => {
    if (!confirm('هل أنت متأكد من حذف شرط الدفع؟')) return;

    try {
      const { error } = await supabase
        .from('payment_terms')
        .delete()
        .eq('id', termId);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف شرط الدفع بنجاح"
      });

      await loadTerms();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء حذف شرط الدفع",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('هل أنت متأكد من حذف جدول الدفع؟')) return;

    try {
      const { error } = await supabase
        .from('payment_schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف جدول الدفع بنجاح"
      });

      await loadSchedules();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء حذف جدول الدفع",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل شروط الدفع...</p>
        </div>
      </div>
    );
  }

  const activeTerms = terms.filter(t => t.is_active).length;
  const defaultTerm = terms.find(t => t.is_default);
  const activeSchedules = schedules.filter(s => s.is_active).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HandCoins className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">إدارة شروط الدفع</h1>
            <p className="text-sm text-muted-foreground">
              إدارة شروط وجداول الدفع
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الشروط</CardTitle>
            <Receipt className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{terms.length}</div>
            <p className="text-xs text-muted-foreground mt-1">شرط دفع</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">الشروط النشطة</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTerms}</div>
            <p className="text-xs text-muted-foreground mt-1">من إجمالي {terms.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">الشرط الافتراضي</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">{defaultTerm?.term_name || 'غير محدد'}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {defaultTerm?.days_until_due || 0} يوم
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">جداول الدفع</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSchedules}</div>
            <p className="text-xs text-muted-foreground mt-1">جدول نشط</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="terms" className="space-y-4">
        <TabsList>
          <TabsTrigger value="terms">شروط الدفع</TabsTrigger>
          <TabsTrigger value="schedules">جداول الدفع</TabsTrigger>
        </TabsList>

        <TabsContent value="terms" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isTermDialogOpen} onOpenChange={setIsTermDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  إضافة شرط دفع
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إضافة شرط دفع جديد</DialogTitle>
                  <DialogDescription>
                    قم بإضافة شرط دفع جديد للنظام
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>اسم الشرط</Label>
                      <Input
                        placeholder="الدفع خلال 30 يوم"
                        value={newTerm.term_name}
                        onChange={(e) => setNewTerm({ ...newTerm, term_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>رمز الشرط</Label>
                      <Input
                        placeholder="NET30"
                        value={newTerm.term_code}
                        onChange={(e) => setNewTerm({ ...newTerm, term_code: e.target.value.toUpperCase() })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>أيام الاستحقاق</Label>
                      <Input
                        type="number"
                        placeholder="30"
                        value={newTerm.days_until_due}
                        onChange={(e) => setNewTerm({ ...newTerm, days_until_due: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>نسبة الخصم %</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="2.00"
                        value={newTerm.discount_percentage}
                        onChange={(e) => setNewTerm({ ...newTerm, discount_percentage: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>أيام الخصم</Label>
                      <Input
                        type="number"
                        placeholder="10"
                        value={newTerm.discount_days}
                        onChange={(e) => setNewTerm({ ...newTerm, discount_days: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>الوصف</Label>
                    <Input
                      placeholder="وصف شرط الدفع"
                      value={newTerm.description}
                      onChange={(e) => setNewTerm({ ...newTerm, description: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsTermDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleAddTerm}>إضافة</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {terms.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <HandCoins className="h-16 w-16 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">لا توجد شروط دفع</h3>
                    <p className="text-muted-foreground mb-4">
                      ابدأ بإضافة شروط الدفع للنظام
                    </p>
                    <Button onClick={() => setIsTermDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      إضافة شرط دفع جديد
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>شروط الدفع المسجلة</CardTitle>
                <CardDescription>جميع شروط الدفع في النظام</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم الشرط</TableHead>
                      <TableHead>الرمز</TableHead>
                      <TableHead>أيام الاستحقاق</TableHead>
                      <TableHead>الخصم</TableHead>
                      <TableHead>افتراضي</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {terms.map((term) => (
                      <TableRow key={term.id}>
                        <TableCell>
                          <div className="font-medium">{term.term_name}</div>
                          {term.description && (
                            <div className="text-xs text-muted-foreground">{term.description}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{term.term_code}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {term.days_until_due} يوم
                          </div>
                        </TableCell>
                        <TableCell>
                          {term.discount_percentage > 0 ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-green-600">
                                <Percent className="h-3 w-3" />
                                {term.discount_percentage}%
                              </div>
                              <div className="text-xs text-muted-foreground">
                                خلال {term.discount_days} يوم
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {term.is_default ? (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Star className="h-3 w-3 mr-1" />
                              افتراضي
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSetDefault(term.id)}
                            >
                              تعيين
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={term.is_active}
                              onCheckedChange={() => handleToggleTerm(term.id, term.is_active)}
                            />
                            {term.is_active ? (
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
                            onClick={() => handleDeleteTerm(term.id)}
                            disabled={term.is_default}
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

        <TabsContent value="schedules" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  إضافة جدول دفع
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إضافة جدول دفع جديد</DialogTitle>
                  <DialogDescription>
                    قم بإضافة جدول دفع بالتقسيط
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>اسم الجدول</Label>
                    <Input
                      placeholder="تقسيط على 3 أشهر"
                      value={newSchedule.schedule_name}
                      onChange={(e) => setNewSchedule({ ...newSchedule, schedule_name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>شرط الدفع المرتبط</Label>
                    <select
                      className="w-full px-3 py-2 border rounded-md"
                      value={newSchedule.payment_term_id}
                      onChange={(e) => setNewSchedule({ ...newSchedule, payment_term_id: e.target.value })}
                    >
                      <option value="">اختر شرط الدفع</option>
                      {terms.map((term) => (
                        <option key={term.id} value={term.id}>
                          {term.term_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>عدد الأقساط</Label>
                      <Input
                        type="number"
                        placeholder="3"
                        value={newSchedule.number_of_installments}
                        onChange={(e) => setNewSchedule({ ...newSchedule, number_of_installments: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>نسبة القسط %</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="33.33"
                        value={newSchedule.installment_percentage}
                        onChange={(e) => setNewSchedule({ ...newSchedule, installment_percentage: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>الأيام بين الأقساط</Label>
                      <Input
                        type="number"
                        placeholder="30"
                        value={newSchedule.days_between_installments}
                        onChange={(e) => setNewSchedule({ ...newSchedule, days_between_installments: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>الوصف</Label>
                    <Input
                      placeholder="وصف جدول الدفع"
                      value={newSchedule.description}
                      onChange={(e) => setNewSchedule({ ...newSchedule, description: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleAddSchedule}>إضافة</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>جداول الدفع</CardTitle>
              <CardDescription>جداول الدفع بالتقسيط</CardDescription>
            </CardHeader>
            <CardContent>
              {schedules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد جداول دفع مضافة حالياً
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم الجدول</TableHead>
                      <TableHead>شرط الدفع</TableHead>
                      <TableHead>عدد الأقساط</TableHead>
                      <TableHead>نسبة القسط</TableHead>
                      <TableHead>الأيام بين الأقساط</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedules.map((schedule) => (
                      <TableRow key={schedule.id}>
                        <TableCell>
                          <div className="font-medium">{schedule.schedule_name}</div>
                          {schedule.description && (
                            <div className="text-xs text-muted-foreground">{schedule.description}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{schedule.term_name}</Badge>
                        </TableCell>
                        <TableCell>{schedule.number_of_installments} قسط</TableCell>
                        <TableCell>{schedule.installment_percentage}%</TableCell>
                        <TableCell>{schedule.days_between_installments} يوم</TableCell>
                        <TableCell>
                          {schedule.is_active ? (
                            <Badge className="bg-green-100 text-green-800">نشط</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">معطل</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteSchedule(schedule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
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
              <HandCoins className="h-5 w-5" />
              نصائح لإدارة شروط الدفع
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>الشرط الافتراضي:</strong> حدد شرط دفع افتراضي لاستخدامه في جميع الفواتير
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>الخصومات:</strong> استخدم خصومات الدفع المبكر لتحفيز العملاء
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>التقسيط:</strong> أنشئ جداول دفع للمبالغ الكبيرة لتسهيل السداد
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>الوضوح:</strong> اكتب وصفاً واضحاً لكل شرط دفع لتجنب الخلافات
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentTerms;
