import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Plus, Download, CircleCheck as CheckCircle, Clock, CircleAlert as AlertCircle, Circle } from "lucide-react";
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

interface Task {
  id: string;
  task_name: string;
  task_description: string | null;
  assigned_to: string | null;
  status: string;
  priority: string;
  start_date: string | null;
  due_date: string | null;
  completed_date: string | null;
  estimated_hours: number;
  actual_hours: number;
  progress_percentage: number;
  project_id: string | null;
  created_at: string;
}

interface Project {
  id: string;
  project_code: string;
  project_name: string;
}

interface TaskStats {
  totalTasks: number;
  newTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;
}

const Tasks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [stats, setStats] = useState<TaskStats>({
    totalTasks: 0,
    newTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    overdueTasks: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showViewTask, setShowViewTask] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [newTask, setNewTask] = useState({
    task_name: '',
    task_description: '',
    assigned_to: '',
    status: 'جديدة',
    priority: 'متوسط',
    start_date: '',
    due_date: '',
    estimated_hours: 0,
    project_id: ''
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, filterStatus, filterPriority]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadTasks(),
        loadStats(),
        loadProjects()
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

  const loadTasks = async () => {
    let query = supabase
      .from("project_tasks")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }

    if (filterPriority !== "all") {
      query = query.eq("priority", filterPriority);
    }

    const { data, error } = await query;

    if (error) throw error;
    setTasks(data || []);
  };

  const loadStats = async () => {
    const { data } = await supabase
      .from("project_tasks")
      .select("status, due_date")
      .eq("user_id", user?.id);

    if (data) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const overdue = data.filter(t => {
        if (!t.due_date || t.status === 'مكتملة') return false;
        const dueDate = new Date(t.due_date);
        return dueDate < today;
      }).length;

      setStats({
        totalTasks: data.length,
        newTasks: data.filter(t => t.status === 'جديدة').length,
        inProgressTasks: data.filter(t => t.status === 'قيد التنفيذ').length,
        completedTasks: data.filter(t => t.status === 'مكتملة').length,
        overdueTasks: overdue
      });
    }
  };

  const loadProjects = async () => {
    const { data } = await supabase
      .from('projects')
      .select('id, project_code, project_name')
      .eq('user_id', user?.id)
      .order('project_name');

    if (data) {
      setProjects(data);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.task_name) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى إدخال اسم المهمة",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('project_tasks')
        .insert([{
          user_id: user?.id,
          progress_percentage: 0,
          actual_hours: 0,
          ...newTask,
          project_id: newTask.project_id || null
        }]);

      if (error) throw error;

      toast({
        title: "تم إضافة المهمة",
        description: "تم إضافة المهمة بنجاح"
      });

      setShowAddTask(false);
      resetNewTask();
      loadData();
    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة المهمة",
        variant: "destructive"
      });
    }
  };

  const viewTask = (task: Task) => {
    setSelectedTask(task);
    setShowViewTask(true);
  };

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };

      if (newStatus === 'مكتملة') {
        updateData.completed_date = new Date().toISOString().split('T')[0];
        updateData.progress_percentage = 100;
      }

      const { error } = await supabase
        .from("project_tasks")
        .update(updateData)
        .eq("id", taskId);

      if (error) throw error;

      toast({
        title: "تم تحديث الحالة",
        description: "تم تحديث حالة المهمة بنجاح"
      });

      loadData();
      if (selectedTask?.id === taskId) {
        setShowViewTask(false);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الحالة",
        variant: "destructive"
      });
    }
  };

  const handleUpdateProgress = async (taskId: string, newProgress: number) => {
    try {
      const updateData: any = { progress_percentage: newProgress };

      if (newProgress === 100) {
        updateData.status = 'مكتملة';
        updateData.completed_date = new Date().toISOString().split('T')[0];
      } else if (newProgress > 0) {
        updateData.status = 'قيد التنفيذ';
      }

      const { error } = await supabase
        .from("project_tasks")
        .update(updateData)
        .eq("id", taskId);

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

  const resetNewTask = () => {
    setNewTask({
      task_name: '',
      task_description: '',
      assigned_to: '',
      status: 'جديدة',
      priority: 'متوسط',
      start_date: '',
      due_date: '',
      estimated_hours: 0,
      project_id: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "جديدة":
        return "bg-gray-100 text-gray-800";
      case "قيد التنفيذ":
        return "bg-blue-100 text-blue-800";
      case "مكتملة":
        return "bg-green-100 text-green-800";
      case "معلقة":
        return "bg-yellow-100 text-yellow-800";
      case "ملغاة":
        return "bg-red-100 text-red-800";
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "جديدة":
        return <Circle className="h-4 w-4" />;
      case "قيد التنفيذ":
        return <Clock className="h-4 w-4" />;
      case "مكتملة":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const isTaskOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'مكتملة') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    return due < today;
  };

  const getDaysUntilDue = (dueDate: string | null) => {
    if (!dueDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
          <ClipboardList className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">المهام</h1>
        </div>
        <Button onClick={() => setShowAddTask(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة مهمة
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المهام</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">مهمة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">مهام جديدة</CardTitle>
            <Circle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.newTasks}</div>
            <p className="text-xs text-muted-foreground">لم تبدأ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">قيد التنفيذ</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgressTasks}</div>
            <p className="text-xs text-muted-foreground">جارية</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">مكتملة</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedTasks}</div>
            <p className="text-xs text-muted-foreground">تم إنجازها</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">متأخرة</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdueTasks}</div>
            <p className="text-xs text-muted-foreground">تجاوزت الموعد</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>قائمة المهام</CardTitle>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="جديدة">جديدة</SelectItem>
                  <SelectItem value="قيد التنفيذ">قيد التنفيذ</SelectItem>
                  <SelectItem value="مكتملة">مكتملة</SelectItem>
                  <SelectItem value="معلقة">معلقة</SelectItem>
                  <SelectItem value="ملغاة">ملغاة</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأولويات</SelectItem>
                  <SelectItem value="عاجل">عاجل</SelectItem>
                  <SelectItem value="عالي">عالي</SelectItem>
                  <SelectItem value="متوسط">متوسط</SelectItem>
                  <SelectItem value="منخفض">منخفض</SelectItem>
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
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد مهام</p>
              <Button onClick={() => setShowAddTask(true)} className="mt-4">
                إضافة مهمة جديدة
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المهمة</TableHead>
                  <TableHead>المسؤول</TableHead>
                  <TableHead>الأولوية</TableHead>
                  <TableHead>الموعد النهائي</TableHead>
                  <TableHead>التقدم</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => {
                  const overdue = isTaskOverdue(task.due_date, task.status);
                  const daysLeft = getDaysUntilDue(task.due_date);

                  return (
                    <TableRow key={task.id} className={overdue ? 'bg-red-50' : ''}>
                      <TableCell className="max-w-[250px]">
                        <div className="space-y-1">
                          <p className="font-medium truncate">{task.task_name}</p>
                          {task.task_description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {task.task_description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{task.assigned_to || '-'}</TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p>{task.due_date ? new Date(task.due_date).toLocaleDateString('ar-SA') : '-'}</p>
                          {overdue && (
                            <Badge className="bg-red-100 text-red-800 text-xs">
                              متأخر {Math.abs(daysLeft || 0)} يوم
                            </Badge>
                          )}
                          {!overdue && daysLeft !== null && daysLeft <= 3 && daysLeft >= 0 && task.status !== 'مكتملة' && (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                              باقي {daysLeft} يوم
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 min-w-[100px]">
                          <Progress value={task.progress_percentage} className="h-2" />
                          <p className="text-xs text-muted-foreground">{task.progress_percentage}%</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(task.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(task.status)}
                            {task.status}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewTask(task)}
                          >
                            عرض
                          </Button>
                          {task.status !== 'مكتملة' && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(task.id, 'مكتملة')}
                            >
                              إكمال
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة مهمة جديدة</DialogTitle>
            <DialogDescription>
              أدخل بيانات المهمة
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="task_name">اسم المهمة *</Label>
              <Input
                id="task_name"
                value={newTask.task_name}
                onChange={(e) => setNewTask({...newTask, task_name: e.target.value})}
                placeholder="مراجعة التقرير المالي"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="task_description">الوصف</Label>
              <Textarea
                id="task_description"
                value={newTask.task_description}
                onChange={(e) => setNewTask({...newTask, task_description: e.target.value})}
                placeholder="وصف تفصيلي للمهمة"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="assigned_to">المسؤول</Label>
                <Input
                  id="assigned_to"
                  value={newTask.assigned_to}
                  onChange={(e) => setNewTask({...newTask, assigned_to: e.target.value})}
                  placeholder="اسم المسؤول"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="project_id">المشروع</Label>
                <Select
                  value={newTask.project_id}
                  onValueChange={(v) => setNewTask({...newTask, project_id: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر مشروع (اختياري)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">بدون مشروع</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.project_code} - {project.project_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="priority">الأولوية</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(v) => setNewTask({...newTask, priority: v})}
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
                <Label htmlFor="estimated_hours">الساعات المقدرة</Label>
                <Input
                  id="estimated_hours"
                  type="number"
                  min="0"
                  step="0.5"
                  value={newTask.estimated_hours}
                  onChange={(e) => setNewTask({...newTask, estimated_hours: Number(e.target.value)})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start_date">تاريخ البداية</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={newTask.start_date}
                  onChange={(e) => setNewTask({...newTask, start_date: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="due_date">الموعد النهائي</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTask(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddTask}>
              حفظ المهمة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showViewTask} onOpenChange={setShowViewTask}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل المهمة</DialogTitle>
            <DialogDescription>
              عرض وتحديث بيانات المهمة
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">اسم المهمة</p>
                <p className="font-medium text-lg">{selectedTask?.task_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الحالة</p>
                <Badge className={getStatusColor(selectedTask?.status || '')}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(selectedTask?.status || '')}
                    {selectedTask?.status}
                  </span>
                </Badge>
              </div>
            </div>

            {selectedTask?.task_description && (
              <div>
                <p className="text-sm text-muted-foreground">الوصف</p>
                <p className="mt-1">{selectedTask.task_description}</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">المسؤول</p>
                <p className="font-medium">{selectedTask?.assigned_to || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الأولوية</p>
                <Badge className={getPriorityColor(selectedTask?.priority || '')}>
                  {selectedTask?.priority}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الساعات المقدرة</p>
                <p className="font-medium">{selectedTask?.estimated_hours} ساعة</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">تاريخ البداية</p>
                <p className="font-medium">
                  {selectedTask?.start_date
                    ? new Date(selectedTask.start_date).toLocaleDateString('ar-SA')
                    : '-'
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الموعد النهائي</p>
                <p className="font-medium">
                  {selectedTask?.due_date
                    ? new Date(selectedTask.due_date).toLocaleDateString('ar-SA')
                    : '-'
                  }
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">نسبة الإنجاز</p>
              <div className="space-y-2">
                <Progress value={selectedTask?.progress_percentage || 0} className="h-3" />
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{selectedTask?.progress_percentage}%</p>
                  <div className="flex gap-2">
                    {[25, 50, 75, 100].map((val) => (
                      <Button
                        key={val}
                        size="sm"
                        variant="outline"
                        onClick={() => selectedTask && handleUpdateProgress(selectedTask.id, val)}
                      >
                        {val}%
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {selectedTask?.status !== 'مكتملة' && (
              <div className="flex gap-2 pt-4">
                <Button
                  className="flex-1"
                  onClick={() => selectedTask && handleUpdateStatus(selectedTask.id, 'قيد التنفيذ')}
                  disabled={selectedTask?.status === 'قيد التنفيذ'}
                >
                  بدء التنفيذ
                </Button>
                <Button
                  className="flex-1"
                  variant="default"
                  onClick={() => selectedTask && handleUpdateStatus(selectedTask.id, 'مكتملة')}
                >
                  إكمال المهمة
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tasks;
