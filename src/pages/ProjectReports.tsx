import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle
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
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProjectReport {
  id: string;
  project_code: string;
  project_name: string;
  client_name: string | null;
  status: string;
  start_date: string;
  end_date: string | null;
  budget: number;
  actual_cost: number;
  progress_percentage: number;
  total_tasks: number;
  completed_tasks: number;
  total_expenses: number;
  days_elapsed: number;
  days_remaining: number | null;
  budget_variance: number;
  budget_variance_percentage: number;
}

interface OverallStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  delayedProjects: number;
  totalBudget: number;
  totalActualCost: number;
  totalVariance: number;
  averageProgress: number;
  onBudgetProjects: number;
  overBudgetProjects: number;
}

const ProjectReports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<ProjectReport[]>([]);
  const [stats, setStats] = useState<OverallStats>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    delayedProjects: 0,
    totalBudget: 0,
    totalActualCost: 0,
    totalVariance: 0,
    averageProgress: 0,
    onBudgetProjects: 0,
    overBudgetProjects: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("budget_variance");

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, filterStatus, sortBy]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadProjectReports(),
        loadOverallStats()
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

  const loadProjectReports = async () => {
    let query = supabase
      .from("projects")
      .select("*")
      .eq("user_id", user?.id);

    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }

    const { data: projectsData, error: projectsError } = await query;

    if (projectsError) throw projectsError;

    if (!projectsData) {
      setReports([]);
      return;
    }

    const reportsWithDetails = await Promise.all(
      projectsData.map(async (project) => {
        const { data: tasksData } = await supabase
          .from("project_tasks")
          .select("id, status")
          .eq("project_id", project.id);

        const { data: expensesData } = await supabase
          .from("project_expenses")
          .select("amount")
          .eq("project_id", project.id);

        const today = new Date();
        const startDate = new Date(project.start_date);
        const daysElapsed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        let daysRemaining = null;
        if (project.end_date) {
          const endDate = new Date(project.end_date);
          daysRemaining = Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        }

        const totalTasks = tasksData?.length || 0;
        const completedTasks = tasksData?.filter(t => t.status === 'مكتملة').length || 0;
        const totalExpenses = expensesData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

        const budgetVariance = Number(project.actual_cost) - Number(project.budget);
        const budgetVariancePercentage = Number(project.budget) > 0
          ? (budgetVariance / Number(project.budget)) * 100
          : 0;

        return {
          ...project,
          total_tasks: totalTasks,
          completed_tasks: completedTasks,
          total_expenses: totalExpenses,
          days_elapsed: daysElapsed,
          days_remaining: daysRemaining,
          budget_variance: budgetVariance,
          budget_variance_percentage: budgetVariancePercentage
        } as ProjectReport;
      })
    );

    const sortedReports = [...reportsWithDetails].sort((a, b) => {
      switch (sortBy) {
        case "budget_variance":
          return Math.abs(b.budget_variance) - Math.abs(a.budget_variance);
        case "progress":
          return b.progress_percentage - a.progress_percentage;
        case "cost":
          return b.actual_cost - a.actual_cost;
        default:
          return 0;
      }
    });

    setReports(sortedReports);
  };

  const loadOverallStats = async () => {
    const { data: projectsData } = await supabase
      .from("projects")
      .select("status, budget, actual_cost, progress_percentage, end_date")
      .eq("user_id", user?.id);

    if (projectsData) {
      const today = new Date();
      const delayed = projectsData.filter(p => {
        if (!p.end_date || p.status === 'مكتمل') return false;
        const endDate = new Date(p.end_date);
        return endDate < today;
      }).length;

      const totalBudget = projectsData.reduce((sum, p) => sum + Number(p.budget), 0);
      const totalActualCost = projectsData.reduce((sum, p) => sum + Number(p.actual_cost), 0);
      const averageProgress = projectsData.length > 0
        ? projectsData.reduce((sum, p) => sum + p.progress_percentage, 0) / projectsData.length
        : 0;

      const onBudget = projectsData.filter(p => Number(p.actual_cost) <= Number(p.budget)).length;
      const overBudget = projectsData.filter(p => Number(p.actual_cost) > Number(p.budget)).length;

      setStats({
        totalProjects: projectsData.length,
        activeProjects: projectsData.filter(p => p.status === 'قيد التنفيذ').length,
        completedProjects: projectsData.filter(p => p.status === 'مكتمل').length,
        delayedProjects: delayed,
        totalBudget,
        totalActualCost,
        totalVariance: totalActualCost - totalBudget,
        averageProgress,
        onBudgetProjects: onBudget,
        overBudgetProjects: overBudget
      });
    }
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

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return "text-red-600";
    if (variance < 0) return "text-green-600";
    return "text-gray-600";
  };

  const getHealthStatus = (project: ProjectReport) => {
    if (project.status === 'مكتمل') return { label: 'مكتمل', color: 'bg-green-100 text-green-800', icon: CheckCircle };

    const isOverBudget = project.budget_variance > 0;
    const isDelayed = project.days_remaining !== null && project.days_remaining < 0;
    const isLowProgress = project.progress_percentage < 50 && project.days_elapsed > 30;

    if (isOverBudget && isDelayed) return { label: 'حرج', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
    if (isOverBudget || isDelayed || isLowProgress) return { label: 'تحذير', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
    return { label: 'جيد', color: 'bg-green-100 text-green-800', icon: CheckCircle };
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
          <BarChart3 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">تقارير المشاريع</h1>
        </div>
        <Button className="gap-2">
          <Download className="h-4 w-4" />
          تصدير التقرير
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="financial">التحليل المالي</TabsTrigger>
          <TabsTrigger value="performance">الأداء</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">إجمالي المشاريع</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProjects}</div>
                <div className="flex gap-2 mt-2 text-xs">
                  <span className="text-blue-600">نشط: {stats.activeProjects}</span>
                  <span className="text-green-600">مكتمل: {stats.completedProjects}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">متوسط التقدم</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageProgress.toFixed(1)}%</div>
                <Progress value={stats.averageProgress} className="h-2 mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">مشاريع متأخرة</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.delayedProjects}</div>
                <p className="text-xs text-muted-foreground mt-2">تجاوزت الموعد</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">الموازنة</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">ضمن الموازنة</span>
                    <span className="text-green-600 font-medium">{stats.onBudgetProjects}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">تجاوزت الموازنة</span>
                    <span className="text-red-600 font-medium">{stats.overBudgetProjects}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>تقارير المشاريع التفصيلية</CardTitle>
                <div className="flex gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل المشاريع</SelectItem>
                      <SelectItem value="قيد التنفيذ">قيد التنفيذ</SelectItem>
                      <SelectItem value="مكتمل">مكتمل</SelectItem>
                      <SelectItem value="متوقف">متوقف</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="budget_variance">الانحراف</SelectItem>
                      <SelectItem value="progress">التقدم</SelectItem>
                      <SelectItem value="cost">التكلفة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">لا توجد تقارير</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المشروع</TableHead>
                      <TableHead>الصحة</TableHead>
                      <TableHead>التقدم</TableHead>
                      <TableHead>المهام</TableHead>
                      <TableHead>الموازنة</TableHead>
                      <TableHead>التكلفة الفعلية</TableHead>
                      <TableHead>الانحراف</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => {
                      const health = getHealthStatus(report);
                      const HealthIcon = health.icon;
                      return (
                        <TableRow key={report.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium">{report.project_name}</p>
                              <p className="text-xs text-muted-foreground">{report.project_code}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={health.color}>
                              <span className="flex items-center gap-1">
                                <HealthIcon className="h-3 w-3" />
                                {health.label}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 min-w-[100px]">
                              <Progress value={report.progress_percentage} className="h-2" />
                              <p className="text-xs text-muted-foreground">{report.progress_percentage}%</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <span className="font-medium">{report.completed_tasks}</span>
                              <span className="text-muted-foreground"> / {report.total_tasks}</span>
                            </div>
                          </TableCell>
                          <TableCell>{Number(report.budget).toLocaleString()} ر.س</TableCell>
                          <TableCell className={getVarianceColor(report.budget_variance)}>
                            {Number(report.actual_cost).toLocaleString()} ر.س
                          </TableCell>
                          <TableCell>
                            <div className={`space-y-1 ${getVarianceColor(report.budget_variance)}`}>
                              <p className="font-medium">
                                {report.budget_variance > 0 ? '+' : ''}
                                {report.budget_variance.toLocaleString()} ر.س
                              </p>
                              <p className="text-xs">
                                ({report.budget_variance_percentage > 0 ? '+' : ''}
                                {report.budget_variance_percentage.toFixed(1)}%)
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(report.status)}>
                              {report.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الموازنة</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {stats.totalBudget.toLocaleString()} ر.س
                </div>
                <p className="text-xs text-muted-foreground mt-2">الموازنة المخططة</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">التكلفة الفعلية</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.totalActualCost.toLocaleString()} ر.س
                </div>
                <p className="text-xs text-muted-foreground mt-2">المنفق فعلياً</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">الانحراف الكلي</CardTitle>
                {stats.totalVariance > 0 ? (
                  <TrendingUp className="h-4 w-4 text-red-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-green-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getVarianceColor(stats.totalVariance)}`}>
                  {stats.totalVariance > 0 ? '+' : ''}
                  {stats.totalVariance.toLocaleString()} ر.س
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {((stats.totalVariance / stats.totalBudget) * 100).toFixed(1)}% من الموازنة
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>التحليل المالي بالتفصيل</CardTitle>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">لا توجد بيانات مالية</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المشروع</TableHead>
                      <TableHead>الموازنة المخططة</TableHead>
                      <TableHead>المصروفات</TableHead>
                      <TableHead>التكلفة الفعلية</TableHead>
                      <TableHead>المتبقي</TableHead>
                      <TableHead>نسبة الإنفاق</TableHead>
                      <TableHead>التقييم</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => {
                      const remaining = Number(report.budget) - Number(report.actual_cost);
                      const spendingRate = Number(report.budget) > 0
                        ? (Number(report.actual_cost) / Number(report.budget)) * 100
                        : 0;
                      return (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium">{report.project_name}</TableCell>
                          <TableCell>{Number(report.budget).toLocaleString()} ر.س</TableCell>
                          <TableCell>{report.total_expenses.toLocaleString()} ر.س</TableCell>
                          <TableCell>{Number(report.actual_cost).toLocaleString()} ر.س</TableCell>
                          <TableCell className={getVarianceColor(-remaining)}>
                            {remaining.toLocaleString()} ر.س
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Progress value={Math.min(spendingRate, 100)} className="h-2" />
                              <p className="text-xs">{spendingRate.toFixed(1)}%</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {spendingRate <= 100 ? (
                              <Badge className="bg-green-100 text-green-800">ممتاز</Badge>
                            ) : spendingRate <= 110 ? (
                              <Badge className="bg-yellow-100 text-yellow-800">مقبول</Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800">تجاوز</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">معدل الإنجاز</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.averageProgress.toFixed(1)}%
                </div>
                <Progress value={stats.averageProgress} className="h-2 mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">مشاريع في الموعد</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.totalProjects - stats.delayedProjects}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  من أصل {stats.totalProjects} مشروع
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">مشاريع متأخرة</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.delayedProjects}</div>
                <p className="text-xs text-muted-foreground mt-2">تجاوزت الموعد المحدد</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>أداء المشاريع</CardTitle>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">لا توجد بيانات أداء</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المشروع</TableHead>
                      <TableHead>التقدم</TableHead>
                      <TableHead>المدة المنقضية</TableHead>
                      <TableHead>المدة المتبقية</TableHead>
                      <TableHead>المهام المكتملة</TableHead>
                      <TableHead>كفاءة التنفيذ</TableHead>
                      <TableHead>التقييم</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => {
                      const taskCompletionRate = report.total_tasks > 0
                        ? (report.completed_tasks / report.total_tasks) * 100
                        : 0;
                      const efficiency = report.progress_percentage - taskCompletionRate;
                      return (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium">{report.project_name}</TableCell>
                          <TableCell>
                            <div className="space-y-1 min-w-[100px]">
                              <Progress value={report.progress_percentage} className="h-2" />
                              <p className="text-xs">{report.progress_percentage}%</p>
                            </div>
                          </TableCell>
                          <TableCell>{report.days_elapsed} يوم</TableCell>
                          <TableCell>
                            {report.days_remaining !== null ? (
                              <span className={report.days_remaining < 0 ? 'text-red-600' : ''}>
                                {report.days_remaining < 0 ? 'متأخر ' : ''}
                                {Math.abs(report.days_remaining)} يوم
                              </span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {report.completed_tasks} / {report.total_tasks}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Progress value={taskCompletionRate} className="h-2" />
                              <p className="text-xs">{taskCompletionRate.toFixed(0)}%</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {report.status === 'مكتمل' ? (
                              <Badge className="bg-green-100 text-green-800">مكتمل</Badge>
                            ) : report.progress_percentage >= 75 ? (
                              <Badge className="bg-green-100 text-green-800">ممتاز</Badge>
                            ) : report.progress_percentage >= 50 ? (
                              <Badge className="bg-blue-100 text-blue-800">جيد</Badge>
                            ) : report.progress_percentage >= 25 ? (
                              <Badge className="bg-yellow-100 text-yellow-800">مقبول</Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800">ضعيف</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectReports;
