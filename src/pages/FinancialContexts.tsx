import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers, Plus, Download, Search, CreditCard as Edit, Trash2, Building2, DollarSign, Users, TrendingUp } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface FinancialContext {
  id: string;
  context_code: string;
  context_name: string;
  context_type: string;
  parent_id: string | null;
  description: string;
  is_active: boolean;
  manager_name: string;
  budget_allocated: number;
  phone: string;
  email: string;
  address: string;
  notes: string;
  created_at: string;
}

interface ContextStats {
  totalContexts: number;
  activeContexts: number;
  inactiveContexts: number;
  totalBudget: number;
  costCenters: number;
  branches: number;
  departments: number;
}

const FinancialContexts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contexts, setContexts] = useState<FinancialContext[]>([]);
  const [filteredContexts, setFilteredContexts] = useState<FinancialContext[]>([]);
  const [stats, setStats] = useState<ContextStats>({
    totalContexts: 0,
    activeContexts: 0,
    inactiveContexts: 0,
    totalBudget: 0,
    costCenters: 0,
    branches: 0,
    departments: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedContext, setSelectedContext] = useState<FinancialContext | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [newContext, setNewContext] = useState({
    context_code: '',
    context_name: '',
    context_type: 'cost_center',
    parent_id: null as string | null,
    description: '',
    is_active: true,
    manager_name: '',
    budget_allocated: 0,
    phone: '',
    email: '',
    address: '',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    filterContexts();
  }, [contexts, searchTerm, filterType, filterStatus]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadContexts(),
        loadStats()
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

  const loadContexts = async () => {
    const { data, error } = await supabase
      .from('financial_contexts')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setContexts(data || []);
  };

  const loadStats = async () => {
    const { data } = await supabase
      .from('financial_contexts')
      .select('*')
      .eq('user_id', user?.id);

    if (data) {
      setStats({
        totalContexts: data.length,
        activeContexts: data.filter(c => c.is_active).length,
        inactiveContexts: data.filter(c => !c.is_active).length,
        totalBudget: data.reduce((sum, c) => sum + Number(c.budget_allocated), 0),
        costCenters: data.filter(c => c.context_type === 'cost_center').length,
        branches: data.filter(c => c.context_type === 'branch').length,
        departments: data.filter(c => c.context_type === 'department').length
      });
    }
  };

  const filterContexts = () => {
    let filtered = [...contexts];

    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.context_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.context_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.manager_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter(c => c.context_type === filterType);
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(c =>
        filterStatus === "active" ? c.is_active : !c.is_active
      );
    }

    setFilteredContexts(filtered);
  };

  const handleAddContext = async () => {
    if (!newContext.context_code || !newContext.context_name) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى إدخال الرمز والاسم",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('financial_contexts')
        .insert([{
          user_id: user?.id,
          ...newContext
        }]);

      if (error) throw error;

      toast({
        title: "تم إضافة السياق المالي",
        description: "تم إضافة السياق المالي بنجاح"
      });

      setShowAddDialog(false);
      resetNewContext();
      loadData();
    } catch (error: any) {
      console.error('Error adding context:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إضافة السياق المالي",
        variant: "destructive"
      });
    }
  };

  const handleEditContext = async () => {
    if (!selectedContext) return;

    try {
      const { error } = await supabase
        .from('financial_contexts')
        .update({
          context_code: selectedContext.context_code,
          context_name: selectedContext.context_name,
          context_type: selectedContext.context_type,
          parent_id: selectedContext.parent_id,
          description: selectedContext.description,
          is_active: selectedContext.is_active,
          manager_name: selectedContext.manager_name,
          budget_allocated: selectedContext.budget_allocated,
          phone: selectedContext.phone,
          email: selectedContext.email,
          address: selectedContext.address,
          notes: selectedContext.notes
        })
        .eq('id', selectedContext.id);

      if (error) throw error;

      toast({
        title: "تم تحديث السياق المالي",
        description: "تم تحديث السياق المالي بنجاح"
      });

      setShowEditDialog(false);
      setSelectedContext(null);
      loadData();
    } catch (error: any) {
      console.error('Error updating context:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء تحديث السياق المالي",
        variant: "destructive"
      });
    }
  };

  const handleDeleteContext = async () => {
    if (!selectedContext) return;

    try {
      const { error } = await supabase
        .from('financial_contexts')
        .delete()
        .eq('id', selectedContext.id);

      if (error) throw error;

      toast({
        title: "تم حذف السياق المالي",
        description: "تم حذف السياق المالي بنجاح"
      });

      setShowDeleteDialog(false);
      setSelectedContext(null);
      loadData();
    } catch (error: any) {
      console.error('Error deleting context:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء حذف السياق المالي",
        variant: "destructive"
      });
    }
  };

  const resetNewContext = () => {
    setNewContext({
      context_code: '',
      context_name: '',
      context_type: 'cost_center',
      parent_id: null,
      description: '',
      is_active: true,
      manager_name: '',
      budget_allocated: 0,
      phone: '',
      email: '',
      address: '',
      notes: ''
    });
  };

  const getContextTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'cost_center': 'مركز تكلفة',
      'branch': 'فرع',
      'department': 'قسم',
      'project': 'مشروع',
      'custom': 'مخصص'
    };
    return types[type] || type;
  };

  const getContextTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'cost_center': 'bg-blue-100 text-blue-800',
      'branch': 'bg-green-100 text-green-800',
      'department': 'bg-purple-100 text-purple-800',
      'project': 'bg-orange-100 text-orange-800',
      'custom': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
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
          <div>
            <h1 className="text-3xl font-bold text-foreground">السياقات المالية</h1>
            <p className="text-sm text-muted-foreground">إدارة مراكز التكلفة والفروع والأقسام</p>
          </div>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة سياق مالي
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي السياقات</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContexts}</div>
            <div className="flex gap-2 mt-2 text-xs">
              <span className="text-green-600">نشط: {stats.activeContexts}</span>
              <span className="text-gray-600">معطل: {stats.inactiveContexts}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">مراكز التكلفة</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.costCenters}</div>
            <p className="text-xs text-muted-foreground mt-2">مركز تكلفة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">الفروع والأقسام</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">فروع</span>
                <span className="text-green-600 font-medium">{stats.branches}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">أقسام</span>
                <span className="text-purple-600 font-medium">{stats.departments}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الموازنة</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.totalBudget.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-2">ر.س</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <CardTitle>قائمة السياقات المالية</CardTitle>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:flex-initial md:w-64">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأنواع</SelectItem>
                  <SelectItem value="cost_center">مركز تكلفة</SelectItem>
                  <SelectItem value="branch">فرع</SelectItem>
                  <SelectItem value="department">قسم</SelectItem>
                  <SelectItem value="project">مشروع</SelectItem>
                  <SelectItem value="custom">مخصص</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">معطل</SelectItem>
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
          {filteredContexts.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد سياقات مالية</p>
              <Button onClick={() => setShowAddDialog(true)} className="mt-4">
                إضافة سياق مالي جديد
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الرمز</TableHead>
                  <TableHead>الاسم</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>المسؤول</TableHead>
                  <TableHead>الموازنة المخصصة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContexts.map((context) => (
                  <TableRow key={context.id}>
                    <TableCell className="font-medium">{context.context_code}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{context.context_name}</p>
                        {context.description && (
                          <p className="text-xs text-muted-foreground">{context.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getContextTypeColor(context.context_type)}>
                        {getContextTypeLabel(context.context_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>{context.manager_name || '-'}</TableCell>
                    <TableCell>
                      {Number(context.budget_allocated).toLocaleString()} ر.س
                    </TableCell>
                    <TableCell>
                      <Badge className={context.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {context.is_active ? 'نشط' : 'معطل'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedContext(context);
                            setShowEditDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedContext(context);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة سياق مالي جديد</DialogTitle>
            <DialogDescription>
              أدخل بيانات السياق المالي الجديد
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="context_code">الرمز *</Label>
                <Input
                  id="context_code"
                  value={newContext.context_code}
                  onChange={(e) => setNewContext({...newContext, context_code: e.target.value})}
                  placeholder="CC001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="context_type">النوع *</Label>
                <Select
                  value={newContext.context_type}
                  onValueChange={(value) => setNewContext({...newContext, context_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cost_center">مركز تكلفة</SelectItem>
                    <SelectItem value="branch">فرع</SelectItem>
                    <SelectItem value="department">قسم</SelectItem>
                    <SelectItem value="project">مشروع</SelectItem>
                    <SelectItem value="custom">مخصص</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="context_name">الاسم *</Label>
              <Input
                id="context_name"
                value={newContext.context_name}
                onChange={(e) => setNewContext({...newContext, context_name: e.target.value})}
                placeholder="مركز تكلفة المبيعات"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={newContext.description}
                onChange={(e) => setNewContext({...newContext, description: e.target.value})}
                placeholder="وصف مختصر للسياق المالي"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manager_name">اسم المسؤول</Label>
                <Input
                  id="manager_name"
                  value={newContext.manager_name}
                  onChange={(e) => setNewContext({...newContext, manager_name: e.target.value})}
                  placeholder="أحمد محمد"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget_allocated">الموازنة المخصصة</Label>
                <Input
                  id="budget_allocated"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newContext.budget_allocated}
                  onChange={(e) => setNewContext({...newContext, budget_allocated: Number(e.target.value)})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  value={newContext.phone}
                  onChange={(e) => setNewContext({...newContext, phone: e.target.value})}
                  placeholder="+966 XX XXX XXXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={newContext.email}
                  onChange={(e) => setNewContext({...newContext, email: e.target.value})}
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">العنوان</Label>
              <Input
                id="address"
                value={newContext.address}
                onChange={(e) => setNewContext({...newContext, address: e.target.value})}
                placeholder="الرياض، المملكة العربية السعودية"
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="is_active" className="text-base">نشط</Label>
                <p className="text-xs text-muted-foreground">تفعيل أو تعطيل السياق المالي</p>
              </div>
              <Switch
                id="is_active"
                checked={newContext.is_active}
                onCheckedChange={(checked) => setNewContext({...newContext, is_active: checked})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddContext}>
              حفظ السياق المالي
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل السياق المالي</DialogTitle>
            <DialogDescription>
              تحديث بيانات السياق المالي
            </DialogDescription>
          </DialogHeader>
          {selectedContext && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_context_code">الرمز *</Label>
                  <Input
                    id="edit_context_code"
                    value={selectedContext.context_code}
                    onChange={(e) => setSelectedContext({...selectedContext, context_code: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_context_type">النوع *</Label>
                  <Select
                    value={selectedContext.context_type}
                    onValueChange={(value) => setSelectedContext({...selectedContext, context_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cost_center">مركز تكلفة</SelectItem>
                      <SelectItem value="branch">فرع</SelectItem>
                      <SelectItem value="department">قسم</SelectItem>
                      <SelectItem value="project">مشروع</SelectItem>
                      <SelectItem value="custom">مخصص</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_context_name">الاسم *</Label>
                <Input
                  id="edit_context_name"
                  value={selectedContext.context_name}
                  onChange={(e) => setSelectedContext({...selectedContext, context_name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_description">الوصف</Label>
                <Textarea
                  id="edit_description"
                  value={selectedContext.description}
                  onChange={(e) => setSelectedContext({...selectedContext, description: e.target.value})}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_manager_name">اسم المسؤول</Label>
                  <Input
                    id="edit_manager_name"
                    value={selectedContext.manager_name}
                    onChange={(e) => setSelectedContext({...selectedContext, manager_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_budget_allocated">الموازنة المخصصة</Label>
                  <Input
                    id="edit_budget_allocated"
                    type="number"
                    min="0"
                    step="0.01"
                    value={selectedContext.budget_allocated}
                    onChange={(e) => setSelectedContext({...selectedContext, budget_allocated: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_phone">رقم الهاتف</Label>
                  <Input
                    id="edit_phone"
                    value={selectedContext.phone}
                    onChange={(e) => setSelectedContext({...selectedContext, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_email">البريد الإلكتروني</Label>
                  <Input
                    id="edit_email"
                    type="email"
                    value={selectedContext.email}
                    onChange={(e) => setSelectedContext({...selectedContext, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_address">العنوان</Label>
                <Input
                  id="edit_address"
                  value={selectedContext.address}
                  onChange={(e) => setSelectedContext({...selectedContext, address: e.target.value})}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="edit_is_active" className="text-base">نشط</Label>
                  <p className="text-xs text-muted-foreground">تفعيل أو تعطيل السياق المالي</p>
                </div>
                <Switch
                  id="edit_is_active"
                  checked={selectedContext.is_active}
                  onCheckedChange={(checked) => setSelectedContext({...selectedContext, is_active: checked})}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleEditContext}>
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف السياق المالي "{selectedContext?.context_name}" نهائياً.
              لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteContext}>
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FinancialContexts;
