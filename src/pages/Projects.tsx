import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Plus, Download, Eye, CircleCheck as CheckCircle, Clock, DollarSign, TrendingUp } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Project {
  id: string;
  project_code: string;
  project_name: string;
  client_name: string | null;
  project_type: string;
  status: string;
  priority: string;
  start_date: string;
  end_date: string | null;
  budget: number;
  actual_cost: number;
  progress_percentage: number;
  manager_name: string | null;
}

interface ProjectTask {
  id: string;
  task_name: string;
  status: string;
  assigned_to: string | null;
  due_date: string | null;
  progress_percentage: number;
}

interface ProjectExpense {
  id: string;
  expense_date: string;
  expense_type: string;
  description: string;
  amount: number;
}

interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalBudget: number;
  totalActualCost: number;
}

const Projects = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
  const [projectExpenses, setProjectExpenses] = useState<ProjectExpense[]>([]);
  const [stats, setStats] = useState<ProjectStats>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalBudget: 0,
    totalActualCost: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showViewProject, setShowViewProject] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [newProject, setNewProject] = useState({
    project_name: '',
    client_name: '',
    project_type: 'داخلي',
    priority: 'متوسط',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    estimated_end_date: '',
    budget: 0,
    manager_name: '',
    team_size: 1,
    description: '',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, filterStatus, filterType]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadProjects(),
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

  const loadProjects = async () => {
    let query = supabase
      .from("projects")
      .select("*")
      .eq("user_id", user?.id)
      .order("start_date", { ascending: false });

    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }

    if (filterType !== "all") {
      query = query.eq("project_type", filterType);
    }

    const { data, error } = await query;

    if (error) throw error;
    setProjects(data || []);
  };

  const loadStats = async () => {
    const { data } = await supabase
      .from("projects")
      .select("status, budget, actual_cost")
      .eq("user_id", user?.id);

    if (data) {
      setStats({
        totalProjects: data.length,
        activeProjects: data.filter(p => p.status === 'قيد التنفيذ').length,
        completedProjects: data.filter(p => p.status === 'مكتمل').length,
        totalBudget: data.reduce((sum, p) => sum + Number(p.budget), 0),
        totalActualCost: data.reduce((sum, p) => sum + Number(p.actual_cost), 0)
      });
    }
  };

  const loadProjectDetails = async (projectId: string) => {
    const [tasksResult, expensesResult] = await Promise.all([
      supabase
        .from("project_tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
      supabase
        .from("project_expenses")
        .select("*")
        .eq("project_id", projectId)
        .order("expense_date", { ascending: false })
    ]);

    if (tasksResult.data) setProjectTasks(tasksResult.data);
    if (expensesResult.data) setProjectExpenses(expensesResult.data);
  };

  const handleAddProject = async () => {
    if (!newProject.project_name) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى إدخال اسم المشروع",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .insert([{
          user_id: user?.id,
          project_code: '',
          status: 'قيد التنفيذ',
          progress_percentage: 0,
          actual_cost: 0,
          ...newProject
        }]);

      if (error) throw error;

      toast({
        title: "تم إضافة المشروع",
        description: "تم إضافة المشروع بنجاح"
      });

      setShowAddProject(false);
      resetNewProject();
      loadData();
    } catch (error) {
      console.error('Error adding project:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة المشروع",
        variant: "destructive"
      });
    }
  };

  const viewProject = async (project: Project) => {
    setSelectedProject(project);
    await loadProjectDetails(project.id);
    setShowViewProject(true);
  };

  const handleUpdateProgress = async (projectId: string, newProgress: number) => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({
          progress_percentage: newProgress,
          status: newProgress === 100 ? 'مكتمل' : 'قيد التنفيذ'
        })
        .eq("id", projectId);

      if (error) throw error;

      toast({
        title: "تم تحديث التقدم",
        description: "تم تحديث نسبة التقدم بنجاح"
      });

      loadData();
    } catch (error) {
      console.error("Error updating progress:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث التقدم",
        variant: "destructive"
      });
    }
  };

  const resetNewProject = () => {
    setNewProject({
      project_name: '',
      client_name: '',
      project_type: 'داخلي',
      priority: 'متوسط',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      estimated_end_date: '',
      budget: 0,
      manager_name: '',
      team_size: 1,
      description: '',
      notes: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "قيد التنفيذ":
        return "bg-blue-100 text-blue-800";
      case "مكتمل":
        return "bg-green-100 text-green-800";
      case "متوقف":
        return "bg-yellow-100 text-yellow-800";
      case "ملغي":
        return "bg-red-100 text-red-800";
      case "مخطط":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "عاجل":
        return "bg-red-100 text-red-800";
      case "عالي":
        return "bg-orange-100 text-orange-800";
      case "متوسط":
        return "bg-yellow-100 text-yellow-800";
      case "منخفض":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "خارجي":
        return "bg-blue-100 text-blue-800";
      case "داخلي":
        return "bg-purple-100 text-purple-800";
      case "تطوير":
        return "bg-green-100 text-green-800";
      case "استشاري":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getBudgetVariance = (budget: number, actualCost: number) => {
    const variance = actualCost - budget;
    const percentage = budget > 0 ? (variance / budget) * 100 : 0;
    return { variance, percentage };
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
          <Briefcase className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">المشاريع</h1>
        </div>
        <Button onClick={() => setShowAddProject(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة مشروع
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المشاريع</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">مشروع</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">مشاريع نشطة</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground">قيد التنفيذ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">مشاريع مكتملة</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedProjects}</div>
            <p className="text-xs text-muted-foreground">تم إنجازها</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">الموازنة الإجمالية</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.totalBudget.toLocaleString()} ر.س</div>
            <p className="text-xs text-muted-foreground">المخطط</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">التكلفة الفعلية</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.totalActualCost.toLocaleString()} ر.س</div>
            <p className="text-xs text-muted-foreground">المنفذ</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>قائمة المشاريع</CardTitle>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="مخطط">مخطط</SelectItem>
                  <SelectItem value="قيد التنفيذ">قيد التنفيذ</SelectItem>
                  <SelectItem value="متوقف">متوقف</SelectItem>
                  <SelectItem value="مكتمل">مكتمل</SelectItem>
                  <SelectItem value="ملغي">ملغي</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأنواع</SelectItem>
                  <SelectItem value="داخلي">داخلي</SelectItem>
                  <SelectItem value="خارجي">خارجي</SelectItem>
                  <SelectItem value="تطوير">تطوير</SelectItem>
                  <SelectItem value="استشاري">استشاري</SelectItem>
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
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد مشاريع</p>
              <Button onClick={() => setShowAddProject(true)} className="mt-4">
                إضافة مشروع جديد
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الرمز</TableHead>
                  <TableHead>اسم المشروع</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الأولوية</TableHead>
                  <TableHead>الموازنة</TableHead>
                  <TableHead>التكلفة</TableHead>
                  <TableHead>التقدم</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => {
                  const { variance, percentage } = getBudgetVariance(
                    Number(project.budget),
                    Number(project.actual_cost)
                  );
                  return (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.project_code}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{project.project_name}</TableCell>
                      <TableCell>{project.client_name || '-'}</TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(project.project_type)}>
                          {project.project_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(project.priority)}>
                          {project.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{Number(project.budget).toLocaleString()} ر.س</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className={variance > 0 ? 'text-red-600' : 'text-green-600'}>
                            {Number(project.actual_cost).toLocaleString()} ر.س
                          </p>
                          {variance !== 0 && (
                            <p className="text-xs text-muted-foreground">
                              {percentage > 0 ? '+' : ''}{percentage.toFixed(1)}%
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 min-w-[100px]">
                          <Progress value={project.progress_percentage} className="h-2" />
                          <p className="text-xs text-muted-foreground">{project.progress_percentage}%</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewProject(project)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddProject} onOpenChange={setShowAddProject}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة مشروع جديد</DialogTitle>
            <DialogDescription>
              أدخل بيانات المشروع
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="project_name">اسم المشروع *</Label>
                <Input
                  id="project_name"
                  value={newProject.project_name}
                  onChange={(e) => setNewProject({...newProject, project_name: e.target.value})}
                  placeholder="مشروع تطوير الموقع"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="client_name">اسم العميل</Label>
                <Input
                  id="client_name"
                  value={newProject.client_name}
                  onChange={(e) => setNewProject({...newProject, client_name: e.target.value})}
                  placeholder="اسم العميل"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="project_type">نوع المشروع</Label>
                <Select
                  value={newProject.project_type}
                  onValueChange={(v) => setNewProject({...newProject, project_type: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="داخلي">داخلي</SelectItem>
                    <SelectItem value="خارجي">خارجي</SelectItem>
                    <SelectItem value="تطوير">تطوير</SelectItem>
                    <SelectItem value="استشاري">استشاري</SelectItem>
                    <SelectItem value="صيانة">صيانة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority">الأولوية</Label>
                <Select
                  value={newProject.priority}
                  onValueChange={(v) => setNewProject({...newProject, priority: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="منخفض">منخفض</SelectItem>
                    <SelectItem value="متوسط">متوسط</SelectItem>
                    <SelectItem value="عالي">عالي</SelectItem>
                    <SelectItem value="عاجل">عاجل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="budget">الموازنة</Label>
                <Input
                  id="budget"
                  type="number"
                  value={newProject.budget}
                  onChange={(e) => setNewProject({...newProject, budget: Number(e.target.value)})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start_date">تاريخ البداية *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={newProject.start_date}
                  onChange={(e) => setNewProject({...newProject, start_date: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end_date">تاريخ النهاية</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={newProject.end_date}
                  onChange={(e) => setNewProject({...newProject, end_date: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="manager_name">مدير المشروع</Label>
                <Input
                  id="manager_name"
                  value={newProject.manager_name}
                  onChange={(e) => setNewProject({...newProject, manager_name: e.target.value})}
                  placeholder="اسم مدير المشروع"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="team_size">حجم الفريق</Label>
                <Input
                  id="team_size"
                  type="number"
                  min="1"
                  value={newProject.team_size}
                  onChange={(e) => setNewProject({...newProject, team_size: Number(e.target.value)})}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={newProject.description}
                onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                placeholder="وصف المشروع"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddProject(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddProject}>
              حفظ المشروع
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showViewProject} onOpenChange={setShowViewProject}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل المشروع - {selectedProject?.project_code}</DialogTitle>
            <DialogDescription>
              عرض تفاصيل وبيانات المشروع
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">اسم المشروع</p>
                <p className="font-medium">{selectedProject?.project_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">العميل</p>
                <p className="font-medium">{selectedProject?.client_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">النوع</p>
                <Badge className={getTypeColor(selectedProject?.project_type || '')}>
                  {selectedProject?.project_type}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الحالة</p>
                <Badge className={getStatusColor(selectedProject?.status || '')}>
                  {selectedProject?.status}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">الموازنة</p>
                <p className="font-medium text-lg">{Number(selectedProject?.budget).toLocaleString()} ر.س</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">التكلفة الفعلية</p>
                <p className="font-medium text-lg text-blue-600">
                  {Number(selectedProject?.actual_cost).toLocaleString()} ر.س
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الانحراف</p>
                <p className={`font-medium text-lg ${
                  Number(selectedProject?.actual_cost) > Number(selectedProject?.budget)
                    ? 'text-red-600'
                    : 'text-green-600'
                }`}>
                  {(Number(selectedProject?.actual_cost) - Number(selectedProject?.budget)).toLocaleString()} ر.س
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">نسبة التقدم</p>
              <div className="space-y-2">
                <Progress value={selectedProject?.progress_percentage || 0} className="h-3" />
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{selectedProject?.progress_percentage}%</p>
                  <div className="flex gap-2">
                    {[25, 50, 75, 100].map((val) => (
                      <Button
                        key={val}
                        size="sm"
                        variant="outline"
                        onClick={() => selectedProject && handleUpdateProgress(selectedProject.id, val)}
                      >
                        {val}%
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Tabs defaultValue="tasks" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="tasks">المهام ({projectTasks.length})</TabsTrigger>
                <TabsTrigger value="expenses">المصروفات ({projectExpenses.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="tasks" className="space-y-4">
                {projectTasks.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">لا توجد مهام</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>المهمة</TableHead>
                        <TableHead>المسؤول</TableHead>
                        <TableHead>التقدم</TableHead>
                        <TableHead>الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projectTasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell>{task.task_name}</TableCell>
                          <TableCell>{task.assigned_to || '-'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={task.progress_percentage} className="h-2 w-20" />
                              <span className="text-xs">{task.progress_percentage}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(task.status)}>
                              {task.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
              <TabsContent value="expenses" className="space-y-4">
                {projectExpenses.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">لا توجد مصروفات</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>النوع</TableHead>
                        <TableHead>الوصف</TableHead>
                        <TableHead>المبلغ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projectExpenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>{new Date(expense.expense_date).toLocaleDateString('ar-SA')}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{expense.expense_type}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{expense.description}</TableCell>
                          <TableCell className="font-medium">{Number(expense.amount).toLocaleString()} ر.س</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold bg-gray-50">
                        <TableCell colSpan={3}>الإجمالي</TableCell>
                        <TableCell>
                          {projectExpenses.reduce((sum, e) => sum + Number(e.amount), 0).toLocaleString()} ر.س
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Projects;
