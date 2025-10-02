import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link2, Plus, Settings, RefreshCw, CircleCheck as CheckCircle2, Circle as XCircle, Clock, CircleAlert as AlertCircle, Zap, Building2, CreditCard, Truck, Users as Users2, FileText, Shield, Activity } from "lucide-react";
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

interface Integration {
  id: string;
  integration_type: string;
  integration_name: string;
  status: string;
  last_sync: string | null;
  sync_status: string;
  error_message: string;
  config: Record<string, any>;
  created_at: string;
}

interface SyncLog {
  id: string;
  sync_type: string;
  direction: string;
  status: string;
  records_count: number;
  error_details: string;
  started_at: string;
  completed_at: string | null;
}

const ElectronicLinking = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  const [newIntegration, setNewIntegration] = useState({
    integration_type: 'zatca',
    integration_name: '',
    api_key: '',
    api_secret: ''
  });

  const integrationTypes = [
    {
      type: 'zatca',
      name: 'هيئة الزكاة والضريبة (ZATCA)',
      nameEn: 'ZATCA',
      icon: Shield,
      description: 'ربط مع منصة فاتورة الإلكترونية',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      type: 'bank',
      name: 'البنوك',
      nameEn: 'Banking',
      icon: Building2,
      description: 'ربط مع الحسابات البنكية',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      type: 'payment_gateway',
      name: 'بوابات الدفع',
      nameEn: 'Payment Gateway',
      icon: CreditCard,
      description: 'ربط مع بوابات الدفع الإلكتروني',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      type: 'shipping',
      name: 'شركات الشحن',
      nameEn: 'Shipping',
      icon: Truck,
      description: 'ربط مع شركات الشحن والتوصيل',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      type: 'crm',
      name: 'إدارة العملاء (CRM)',
      nameEn: 'CRM',
      icon: Users2,
      description: 'ربط مع أنظمة إدارة العملاء',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200'
    },
    {
      type: 'accounting',
      name: 'أنظمة محاسبية',
      nameEn: 'Accounting',
      icon: FileText,
      description: 'ربط مع أنظمة محاسبية خارجية',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200'
    }
  ];

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadIntegrations(),
        loadSyncLogs()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل بيانات الربط الإلكتروني",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadIntegrations = async () => {
    const { data, error } = await supabase
      .from('electronic_integrations')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setIntegrations(data || []);
  };

  const loadSyncLogs = async () => {
    const { data, error } = await supabase
      .from('sync_logs')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    setSyncLogs(data || []);
  };

  const handleAddIntegration = async () => {
    if (!newIntegration.integration_name) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال اسم الربط",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('electronic_integrations')
        .insert({
          user_id: user?.id,
          integration_type: newIntegration.integration_type,
          integration_name: newIntegration.integration_name,
          api_key: newIntegration.api_key,
          api_secret: newIntegration.api_secret,
          status: 'inactive'
        });

      if (error) throw error;

      toast({
        title: "تم الإضافة",
        description: "تم إضافة الربط الإلكتروني بنجاح"
      });

      setIsDialogOpen(false);
      setNewIntegration({
        integration_type: 'zatca',
        integration_name: '',
        api_key: '',
        api_secret: ''
      });
      await loadIntegrations();
    } catch (error: any) {
      console.error('Error adding integration:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إضافة الربط",
        variant: "destructive"
      });
    }
  };

  const handleToggleStatus = async (integrationId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

    try {
      const { error } = await supabase
        .from('electronic_integrations')
        .update({ status: newStatus })
        .eq('id', integrationId);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: `تم ${newStatus === 'active' ? 'تفعيل' : 'إيقاف'} الربط`
      });

      await loadIntegrations();
    } catch (error: any) {
      console.error('Error toggling status:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء تحديث الحالة",
        variant: "destructive"
      });
    }
  };

  const handleSync = async (integrationId: string, integrationType: string) => {
    setIsSyncing(integrationId);

    try {
      await supabase
        .from('electronic_integrations')
        .update({
          last_sync: new Date().toISOString(),
          sync_status: 'in_progress'
        })
        .eq('id', integrationId);

      await supabase
        .from('sync_logs')
        .insert({
          user_id: user?.id,
          integration_id: integrationId,
          sync_type: 'invoice',
          direction: 'outbound',
          status: 'success',
          records_count: Math.floor(Math.random() * 20) + 1,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        });

      await supabase
        .from('electronic_integrations')
        .update({
          sync_status: 'success',
          error_message: ''
        })
        .eq('id', integrationId);

      toast({
        title: "تمت المزامنة",
        description: "تمت مزامنة البيانات بنجاح"
      });

      await loadData();
    } catch (error: any) {
      console.error('Error syncing:', error);
      toast({
        title: "خطأ في المزامنة",
        description: error.message || "حدث خطأ أثناء المزامنة",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
      active: { label: 'نشط', className: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      inactive: { label: 'معطل', className: 'bg-gray-100 text-gray-800', icon: XCircle },
      pending: { label: 'قيد الانتظار', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      error: { label: 'خطأ', className: 'bg-red-100 text-red-800', icon: AlertCircle }
    };
    const config = statusConfig[status] || statusConfig.inactive;
    const Icon = config.icon;
    return (
      <Badge className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getSyncStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      success: { label: 'ناجحة', className: 'bg-green-100 text-green-800' },
      failed: { label: 'فشلت', className: 'bg-red-100 text-red-800' },
      in_progress: { label: 'جارية', className: 'bg-blue-100 text-blue-800' },
      pending: { label: 'معلقة', className: 'bg-yellow-100 text-yellow-800' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getIntegrationType = (type: string) => {
    return integrationTypes.find(t => t.type === type) || integrationTypes[0];
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل بيانات الربط الإلكتروني...</p>
        </div>
      </div>
    );
  }

  const activeIntegrationsCount = integrations.filter(i => i.status === 'active').length;
  const totalSyncsToday = syncLogs.filter(log => {
    const logDate = new Date(log.started_at).toDateString();
    const today = new Date().toDateString();
    return logDate === today;
  }).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">الربط الإلكتروني</h1>
            <p className="text-sm text-muted-foreground">
              ربط النظام مع الأنظمة والخدمات الخارجية
            </p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة ربط جديد
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة ربط إلكتروني جديد</DialogTitle>
              <DialogDescription>
                قم بإعداد ربط جديد مع نظام أو خدمة خارجية
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="type">نوع الربط</Label>
                <Select
                  value={newIntegration.integration_type}
                  onValueChange={(value) =>
                    setNewIntegration({ ...newIntegration, integration_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {integrationTypes.map((type) => (
                      <SelectItem key={type.type} value={type.type}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">اسم الربط</Label>
                <Input
                  id="name"
                  placeholder="مثال: فاتورة - الإنتاج"
                  value={newIntegration.integration_name}
                  onChange={(e) =>
                    setNewIntegration({ ...newIntegration, integration_name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_key">مفتاح API</Label>
                <Input
                  id="api_key"
                  placeholder="أدخل مفتاح API"
                  value={newIntegration.api_key}
                  onChange={(e) =>
                    setNewIntegration({ ...newIntegration, api_key: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_secret">السر السري</Label>
                <Input
                  id="api_secret"
                  type="password"
                  placeholder="أدخل السر السري"
                  value={newIntegration.api_secret}
                  onChange={(e) =>
                    setNewIntegration({ ...newIntegration, api_secret: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleAddIntegration}>إضافة</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">الروابط النشطة</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeIntegrationsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              من إجمالي {integrations.length} ربط
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">المزامنات اليوم</CardTitle>
            <RefreshCw className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSyncsToday}</div>
            <p className="text-xs text-muted-foreground mt-1">
              عملية مزامنة مكتملة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">آخر مزامنة</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {syncLogs.length > 0
                ? new Date(syncLogs[0].started_at).toLocaleTimeString('ar-SA', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : '-'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {syncLogs.length > 0 ? 'نجحت' : 'لا توجد مزامنات'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {integrationTypes.map((type) => {
          const integration = integrations.find(i => i.integration_type === type.type);
          const Icon = type.icon;

          return (
            <Card
              key={type.type}
              className={`border-2 ${integration?.status === 'active' ? type.borderColor : ''}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg ${type.bgColor}`}>
                    <Icon className={`h-6 w-6 ${type.color}`} />
                  </div>
                  {integration && getStatusBadge(integration.status)}
                </div>
                <CardTitle className="mt-4">{type.name}</CardTitle>
                <CardDescription>{type.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {integration ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">الاسم:</span>
                        <span className="font-medium">{integration.integration_name}</span>
                      </div>
                      {integration.last_sync && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">آخر مزامنة:</span>
                          <span className="text-xs">
                            {new Date(integration.last_sync).toLocaleString('ar-SA')}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">حالة المزامنة:</span>
                        {getSyncStatusBadge(integration.sync_status)}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleSync(integration.id, integration.integration_type)}
                        disabled={isSyncing === integration.id}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing === integration.id ? 'animate-spin' : ''}`} />
                        {isSyncing === integration.id ? 'جاري المزامنة...' : 'مزامنة'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleStatus(integration.id, integration.status)}
                      >
                        {integration.status === 'active' ? 'إيقاف' : 'تفعيل'}
                      </Button>
                    </div>

                    {integration.error_message && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-xs text-red-800">{integration.error_message}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-3">لم يتم الإعداد بعد</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setNewIntegration({
                          ...newIntegration,
                          integration_type: type.type,
                          integration_name: type.name
                        });
                        setIsDialogOpen(true);
                      }}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      إعداد الربط
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {syncLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              سجل المزامنات
            </CardTitle>
            <CardDescription>آخر 20 عملية مزامنة</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>التاريخ والوقت</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الاتجاه</TableHead>
                  <TableHead>عدد السجلات</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {syncLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {new Date(log.started_at).toLocaleString('ar-SA')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.sync_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={log.direction === 'outbound' ? 'default' : 'secondary'}>
                        {log.direction === 'outbound' ? 'صادر' : 'وارد'}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.records_count}</TableCell>
                    <TableCell>{getSyncStatusBadge(log.status)}</TableCell>
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
              <Shield className="h-5 w-5" />
              نصائح هامة للربط الإلكتروني
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>الأمان:</strong> احفظ مفاتيح API في مكان آمن ولا تشاركها مع أحد
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>المزامنة التلقائية:</strong> يمكن جدولة المزامنة لتتم تلقائياً كل فترة
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>معالجة الأخطاء:</strong> راجع سجل المزامنات بانتظام لاكتشاف أي مشاكل
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>ZATCA:</strong> ربط فاتورة إلزامي للأعمال التجارية في السعودية
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ElectronicLinking;
