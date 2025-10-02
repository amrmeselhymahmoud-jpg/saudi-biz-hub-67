import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  CreditCard,
  Check,
  X,
  Calendar,
  Users,
  FileText,
  HardDrive,
  Crown,
  Zap,
  TrendingUp,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Subscription {
  id: string;
  plan_type: string;
  status: string;
  start_date: string;
  end_date: string | null;
  trial_end_date: string | null;
  auto_renew: boolean;
  max_users: number;
  max_invoices: number;
  storage_gb: number;
  features: Record<string, boolean>;
  created_at: string;
}

interface PaymentHistory {
  id: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_date: string;
  status: string;
  invoice_number: string | null;
  notes: string;
}

interface PlanDetails {
  name: string;
  nameEn: string;
  price: number;
  billingCycle: string;
  features: string[];
  limits: {
    users: number;
    invoices: number;
    storage: number;
  };
  featureFlags: Record<string, boolean>;
}

const SubscriptionSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const plans: Record<string, PlanDetails> = {
    free: {
      name: 'الباقة المجانية',
      nameEn: 'Free',
      price: 0,
      billingCycle: 'مجاني',
      features: [
        'مستخدم واحد',
        '100 فاتورة شهرياً',
        '5 جيجابايت تخزين',
        'الميزات الأساسية',
        'دعم عبر البريد',
      ],
      limits: { users: 1, invoices: 100, storage: 5 },
      featureFlags: {
        multi_currency: false,
        advanced_reports: false,
        api_access: false,
        priority_support: false,
        custom_branding: false,
        multi_branch: false,
        inventory_management: false,
        payroll: false,
        manufacturing: false,
        projects: false
      }
    },
    basic: {
      name: 'الباقة الأساسية',
      nameEn: 'Basic',
      price: 299,
      billingCycle: 'شهرياً',
      features: [
        '3 مستخدمين',
        '500 فاتورة شهرياً',
        '20 جيجابايت تخزين',
        'تقارير متقدمة',
        'عملات متعددة',
        'دعم ذو أولوية',
      ],
      limits: { users: 3, invoices: 500, storage: 20 },
      featureFlags: {
        multi_currency: true,
        advanced_reports: true,
        api_access: false,
        priority_support: true,
        custom_branding: false,
        multi_branch: false,
        inventory_management: true,
        payroll: false,
        manufacturing: false,
        projects: false
      }
    },
    professional: {
      name: 'الباقة الاحترافية',
      nameEn: 'Professional',
      price: 599,
      billingCycle: 'شهرياً',
      features: [
        '10 مستخدمين',
        'فواتير غير محدودة',
        '100 جيجابايت تخزين',
        'جميع ميزات الباقة الأساسية',
        'إدارة الرواتب',
        'إدارة المشاريع',
        'فروع متعددة',
        'واجهة برمجية API',
      ],
      limits: { users: 10, invoices: -1, storage: 100 },
      featureFlags: {
        multi_currency: true,
        advanced_reports: true,
        api_access: true,
        priority_support: true,
        custom_branding: true,
        multi_branch: true,
        inventory_management: true,
        payroll: true,
        manufacturing: false,
        projects: true
      }
    },
    enterprise: {
      name: 'باقة المؤسسات',
      nameEn: 'Enterprise',
      price: 1499,
      billingCycle: 'شهرياً',
      features: [
        'مستخدمين غير محدودين',
        'فواتير غير محدودة',
        'تخزين غير محدود',
        'جميع الميزات',
        'علامة تجارية مخصصة',
        'إدارة التصنيع',
        'دعم متخصص 24/7',
        'تدريب مخصص',
      ],
      limits: { users: -1, invoices: -1, storage: -1 },
      featureFlags: {
        multi_currency: true,
        advanced_reports: true,
        api_access: true,
        priority_support: true,
        custom_branding: true,
        multi_branch: true,
        inventory_management: true,
        payroll: true,
        manufacturing: true,
        projects: true
      }
    }
  };

  const featureLabels: Record<string, string> = {
    multi_currency: 'العملات المتعددة',
    advanced_reports: 'التقارير المتقدمة',
    api_access: 'واجهة برمجية API',
    priority_support: 'دعم ذو أولوية',
    custom_branding: 'علامة تجارية مخصصة',
    multi_branch: 'فروع متعددة',
    inventory_management: 'إدارة المخزون',
    payroll: 'إدارة الرواتب',
    manufacturing: 'إدارة التصنيع',
    projects: 'إدارة المشاريع'
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadSubscription(),
        loadPaymentHistory()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل بيانات الاشتراك",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubscription = async () => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user?.id)
      .maybeSingle();

    if (error) throw error;
    setSubscription(data);
  };

  const loadPaymentHistory = async () => {
    const { data, error } = await supabase
      .from('payment_history')
      .select('*')
      .eq('user_id', user?.id)
      .order('payment_date', { ascending: false })
      .limit(10);

    if (error) throw error;
    setPaymentHistory(data || []);
  };

  const handleToggleAutoRenew = async () => {
    if (!subscription) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ auto_renew: !subscription.auto_renew })
        .eq('id', subscription.id);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: `تم ${!subscription.auto_renew ? 'تفعيل' : 'إيقاف'} التجديد التلقائي`
      });

      await loadSubscription();
    } catch (error: any) {
      console.error('Error updating auto-renew:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء التحديث",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      active: { label: 'نشط', className: 'bg-green-100 text-green-800' },
      trial: { label: 'تجريبي', className: 'bg-blue-100 text-blue-800' },
      cancelled: { label: 'ملغي', className: 'bg-red-100 text-red-800' },
      expired: { label: 'منتهي', className: 'bg-gray-100 text-gray-800' }
    };
    const config = statusConfig[status] || statusConfig.expired;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      completed: { label: 'مكتمل', className: 'bg-green-100 text-green-800' },
      pending: { label: 'معلق', className: 'bg-yellow-100 text-yellow-800' },
      failed: { label: 'فشل', className: 'bg-red-100 text-red-800' },
      refunded: { label: 'مسترجع', className: 'bg-gray-100 text-gray-800' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getDaysRemaining = () => {
    if (!subscription) return 0;

    const targetDate = subscription.status === 'trial'
      ? subscription.trial_end_date
      : subscription.end_date;

    if (!targetDate) return 0;

    const days = Math.ceil(
      (new Date(targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(0, days);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل بيانات الاشتراك...</p>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">لا يوجد اشتراك نشط</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentPlan = plans[subscription.plan_type];
  const daysRemaining = getDaysRemaining();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CreditCard className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">إعدادات الاشتراك</h1>
            <p className="text-sm text-muted-foreground">إدارة اشتراكك والفواتير</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>الباقة الحالية</span>
              {getStatusBadge(subscription.status)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{currentPlan.name}</p>
                <p className="text-sm text-muted-foreground">{currentPlan.nameEn}</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-primary">
                  {currentPlan.price}
                </span>
                <span className="text-muted-foreground">ر.س / {currentPlan.billingCycle}</span>
              </div>
            </div>

            {subscription.status === 'trial' && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-800">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {daysRemaining} يوم متبقي في الفترة التجريبية
                  </span>
                </div>
              </div>
            )}

            {subscription.status === 'active' && subscription.end_date && (
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-800">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    ينتهي في {new Date(subscription.end_date).toLocaleDateString('ar-SA')}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              حدود الاستخدام
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">المستخدمين</span>
              <span className="font-medium">
                {subscription.max_users === -1 ? 'غير محدود' : subscription.max_users}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">الفواتير الشهرية</span>
              <span className="font-medium">
                {subscription.max_invoices === -1 ? 'غير محدود' : subscription.max_invoices}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">التخزين</span>
              <span className="font-medium">
                {subscription.storage_gb === -1 ? 'غير محدود' : `${subscription.storage_gb} جيجابايت`}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              إعدادات الفوترة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label className="text-base">التجديد التلقائي</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  تجديد الاشتراك تلقائياً
                </p>
              </div>
              <Switch
                checked={subscription.auto_renew}
                onCheckedChange={handleToggleAutoRenew}
                disabled={isSaving}
              />
            </div>

            <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg">
              تاريخ البدء: {new Date(subscription.start_date).toLocaleDateString('ar-SA')}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الميزات المتاحة</CardTitle>
          <CardDescription>الميزات المتضمنة في باقتك الحالية</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(featureLabels).map(([key, label]) => {
              const isEnabled = subscription.features?.[key] || false;
              return (
                <div
                  key={key}
                  className={`flex items-center gap-2 p-3 rounded-lg border ${
                    isEnabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  {isEnabled ? (
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <X className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  )}
                  <span className={`text-sm ${isEnabled ? 'text-green-800' : 'text-gray-600'}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-4">
        {Object.entries(plans).map(([planKey, plan]) => {
          const isCurrent = subscription.plan_type === planKey;
          return (
            <Card
              key={planKey}
              className={`relative ${isCurrent ? 'border-2 border-primary shadow-lg' : ''}`}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-white">الباقة الحالية</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">ر.س</span>
                </div>
                <p className="text-xs text-muted-foreground">{plan.billingCycle}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
                <Button
                  className="w-full mt-4"
                  variant={isCurrent ? 'outline' : 'default'}
                  disabled={isCurrent}
                >
                  {isCurrent ? 'الباقة الحالية' : 'ترقية الباقة'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {paymentHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              سجل المدفوعات
            </CardTitle>
            <CardDescription>آخر 10 معاملات</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>طريقة الدفع</TableHead>
                  <TableHead>رقم الفاتورة</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentHistory.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {new Date(payment.payment_date).toLocaleDateString('ar-SA')}
                    </TableCell>
                    <TableCell>
                      {payment.amount.toLocaleString()} {payment.currency}
                    </TableCell>
                    <TableCell>{payment.payment_method}</TableCell>
                    <TableCell>{payment.invoice_number || '-'}</TableCell>
                    <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-blue-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              هل تحتاج إلى ترقية؟
            </h3>
            <p className="text-sm text-blue-800">
              احصل على ميزات متقدمة أكثر مع الباقات الأعلى. جميع الباقات تشمل:
            </p>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-blue-600 mt-0.5" />
                <span>تحديثات مجانية مدى الحياة</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-blue-600 mt-0.5" />
                <span>نسخ احتياطي يومي تلقائي</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-blue-600 mt-0.5" />
                <span>دعم فني متخصص</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-blue-600 mt-0.5" />
                <span>ضمان استرجاع الأموال خلال 30 يوم</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionSettings;
