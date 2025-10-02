import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserCog, Plus, Users as UsersIcon, Shield, Activity, CircleCheck as CheckCircle2, Circle as XCircle, CreditCard as Edit, Trash2, Mail, Phone, Building } from "lucide-react";
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

interface SystemUser {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

interface UserRole {
  id: string;
  role_name: string;
  role_code: string;
  description: string;
  permissions: string[];
  is_active: boolean;
}

interface ActivityLog {
  id: string;
  user_id: string;
  activity_type: string;
  description: string;
  ip_address: string;
  created_at: string;
  user_name: string;
}

const Users = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);

  const [newUser, setNewUser] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'user',
    department: ''
  });

  const [newRole, setNewRole] = useState({
    role_name: '',
    role_code: '',
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
        loadUsers(),
        loadRoles(),
        loadActivityLogs()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل بيانات المستخدمين",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('system_users')
      .select('*')
      .eq('owner_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setUsers(data || []);
  };

  const loadRoles = async () => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('owner_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setRoles(data || []);
  };

  const loadActivityLogs = async () => {
    const { data, error } = await supabase
      .from('user_activity_logs')
      .select(`
        *,
        system_users!user_activity_logs_user_id_fkey (
          full_name
        )
      `)
      .eq('owner_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    const formattedLogs = (data || []).map(log => ({
      ...log,
      user_name: log.system_users?.full_name || 'مستخدم محذوف'
    }));

    setActivityLogs(formattedLogs);
  };

  const handleAddUser = async () => {
    if (!newUser.full_name || !newUser.email) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال الاسم والبريد الإلكتروني",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('system_users')
        .insert({
          owner_id: user?.id,
          full_name: newUser.full_name,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          department: newUser.department,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "تم الإضافة",
        description: "تم إضافة المستخدم بنجاح"
      });

      setIsUserDialogOpen(false);
      setNewUser({
        full_name: '',
        email: '',
        phone: '',
        role: 'user',
        department: ''
      });
      await loadUsers();
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إضافة المستخدم",
        variant: "destructive"
      });
    }
  };

  const handleAddRole = async () => {
    if (!newRole.role_name || !newRole.role_code) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال اسم ورمز الدور",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          owner_id: user?.id,
          role_name: newRole.role_name,
          role_code: newRole.role_code.toUpperCase(),
          description: newRole.description,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "تم الإضافة",
        description: "تم إضافة الدور بنجاح"
      });

      setIsRoleDialogOpen(false);
      setNewRole({
        role_name: '',
        role_code: '',
        description: ''
      });
      await loadRoles();
    } catch (error: any) {
      console.error('Error adding role:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إضافة الدور",
        variant: "destructive"
      });
    }
  };

  const handleToggleUser = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('system_users')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: `تم ${!currentStatus ? 'تفعيل' : 'إيقاف'} المستخدم`
      });

      await loadUsers();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء تحديث الحالة",
        variant: "destructive"
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;

    try {
      const { error } = await supabase
        .from('system_users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف المستخدم بنجاح"
      });

      await loadUsers();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء حذف المستخدم",
        variant: "destructive"
      });
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { label: string; className: string }> = {
      admin: { label: 'مدير', className: 'bg-red-100 text-red-800' },
      manager: { label: 'مشرف', className: 'bg-blue-100 text-blue-800' },
      accountant: { label: 'محاسب', className: 'bg-green-100 text-green-800' },
      user: { label: 'مستخدم', className: 'bg-gray-100 text-gray-800' }
    };
    const config = roleConfig[role] || roleConfig.user;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getActivityIcon = (type: string) => {
    const icons: Record<string, any> = {
      login: Activity,
      create: Plus,
      update: Edit,
      delete: Trash2
    };
    const Icon = icons[type] || Activity;
    return <Icon className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل بيانات المستخدمين...</p>
        </div>
      </div>
    );
  }

  const activeUsers = users.filter(u => u.is_active).length;
  const activeRoles = roles.filter(r => r.is_active).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserCog className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">إدارة المستخدمين</h1>
            <p className="text-sm text-muted-foreground">
              إدارة المستخدمين والصلاحيات
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
            <UsersIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground mt-1">مسجلين في النظام</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">المستخدمون النشطون</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">من إجمالي {users.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">الأدوار النشطة</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRoles}</div>
            <p className="text-xs text-muted-foreground mt-1">دور وظيفي</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">النشاط اليومي</CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activityLogs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">عملية مسجلة</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">المستخدمون</TabsTrigger>
          <TabsTrigger value="roles">الأدوار</TabsTrigger>
          <TabsTrigger value="activity">سجل النشاط</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  إضافة مستخدم
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إضافة مستخدم جديد</DialogTitle>
                  <DialogDescription>
                    قم بإضافة مستخدم جديد للنظام
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>الاسم الكامل</Label>
                    <Input
                      placeholder="أحمد محمد"
                      value={newUser.full_name}
                      onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>البريد الإلكتروني</Label>
                      <Input
                        type="email"
                        placeholder="user@example.com"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>رقم الهاتف</Label>
                      <Input
                        placeholder="05xxxxxxxx"
                        value={newUser.phone}
                        onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>الدور الوظيفي</Label>
                      <Select
                        value={newUser.role}
                        onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">مدير</SelectItem>
                          <SelectItem value="manager">مشرف</SelectItem>
                          <SelectItem value="accountant">محاسب</SelectItem>
                          <SelectItem value="user">مستخدم</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>القسم</Label>
                      <Input
                        placeholder="المحاسبة"
                        value={newUser.department}
                        onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleAddUser}>إضافة</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {users.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <UsersIcon className="h-16 w-16 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">لا يوجد مستخدمون</h3>
                    <p className="text-muted-foreground mb-4">
                      ابدأ بإضافة المستخدمين للنظام
                    </p>
                    <Button onClick={() => setIsUserDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      إضافة مستخدم جديد
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>المستخدمون المسجلون</CardTitle>
                <CardDescription>جميع المستخدمين في النظام</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم</TableHead>
                      <TableHead>البريد الإلكتروني</TableHead>
                      <TableHead>الهاتف</TableHead>
                      <TableHead>الدور</TableHead>
                      <TableHead>القسم</TableHead>
                      <TableHead>آخر دخول</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((systemUser) => (
                      <TableRow key={systemUser.id}>
                        <TableCell>
                          <div className="font-medium">{systemUser.full_name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {systemUser.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {systemUser.phone || '-'}
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(systemUser.role)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Building className="h-3 w-3" />
                            {systemUser.department || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {systemUser.last_login ? (
                            <span className="text-sm">
                              {new Date(systemUser.last_login).toLocaleDateString('ar-SA')}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">لم يسجل دخول</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={systemUser.is_active}
                              onCheckedChange={() => handleToggleUser(systemUser.id, systemUser.is_active)}
                            />
                            {systemUser.is_active ? (
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
                            onClick={() => handleDeleteUser(systemUser.id)}
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

        <TabsContent value="roles" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  إضافة دور
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إضافة دور جديد</DialogTitle>
                  <DialogDescription>
                    قم بإضافة دور وظيفي جديد
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>اسم الدور</Label>
                    <Input
                      placeholder="مدير مبيعات"
                      value={newRole.role_name}
                      onChange={(e) => setNewRole({ ...newRole, role_name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>رمز الدور</Label>
                    <Input
                      placeholder="SALES_MGR"
                      value={newRole.role_code}
                      onChange={(e) => setNewRole({ ...newRole, role_code: e.target.value.toUpperCase() })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>الوصف</Label>
                    <Input
                      placeholder="وصف الدور الوظيفي"
                      value={newRole.description}
                      onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleAddRole}>إضافة</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>الأدوار الوظيفية</CardTitle>
              <CardDescription>جميع الأدوار في النظام</CardDescription>
            </CardHeader>
            <CardContent>
              {roles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد أدوار مضافة حالياً
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم الدور</TableHead>
                      <TableHead>الرمز</TableHead>
                      <TableHead>الوصف</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.role_name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{role.role_code}</Badge>
                        </TableCell>
                        <TableCell>{role.description || '-'}</TableCell>
                        <TableCell>
                          {role.is_active ? (
                            <Badge className="bg-green-100 text-green-800">نشط</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">معطل</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>سجل النشاط</CardTitle>
              <CardDescription>آخر 20 عملية</CardDescription>
            </CardHeader>
            <CardContent>
              {activityLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  لا يوجد نشاط مسجل حالياً
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ والوقت</TableHead>
                      <TableHead>المستخدم</TableHead>
                      <TableHead>نوع النشاط</TableHead>
                      <TableHead>الوصف</TableHead>
                      <TableHead>عنوان IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {new Date(log.created_at).toLocaleString('ar-SA')}
                        </TableCell>
                        <TableCell className="font-medium">{log.user_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getActivityIcon(log.activity_type)}
                            <span className="text-sm">{log.activity_type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{log.description}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {log.ip_address || '-'}
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
              <Shield className="h-5 w-5" />
              نصائح لإدارة المستخدمين
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>الأدوار:</strong> امنح كل مستخدم الصلاحيات المناسبة لوظيفته فقط
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>المراجعة الدورية:</strong> راجع صلاحيات المستخدمين بشكل دوري
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>سجل النشاط:</strong> راقب أنشطة المستخدمين لضمان الأمان
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>إيقاف الحسابات:</strong> قم بإيقاف حسابات الموظفين المغادرين فوراً
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;
