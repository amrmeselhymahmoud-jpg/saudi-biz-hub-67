import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Wallet,
  Plus,
  Download,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  FileText
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Employee {
  id: string;
  employee_code: string;
  full_name: string;
  department: string;
  position: string;
  basic_salary: number;
  status: string;
}

interface PayrollRecord {
  id: string;
  employee_id: string;
  month: number;
  year: number;
  basic_salary: number;
  total_allowances: number;
  total_deductions: number;
  net_salary: number;
  status: string;
  payment_date: string | null;
  employees: Employee;
}

interface PayrollStats {
  totalEmployees: number;
  totalPayroll: number;
  paidRecords: number;
  pendingRecords: number;
}

const Payroll = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [stats, setStats] = useState<PayrollStats>({
    totalEmployees: 0,
    totalPayroll: 0,
    paidRecords: 0,
    pendingRecords: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showGeneratePayroll, setShowGeneratePayroll] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    full_name: "",
    department: "",
    position: "",
    basic_salary: 0,
    email: "",
    phone: "",
    employment_type: "دوام كامل"
  });

  const months = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];

  const departments = [
    "المحاسبة", "المبيعات", "التسويق", "الموارد البشرية",
    "تقنية المعلومات", "العمليات", "خدمة العملاء"
  ];

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, selectedMonth, selectedYear]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadEmployees(),
        loadPayrollRecords(),
        loadStats()
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل بيانات الرواتب",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmployees = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("user_id", user?.id)
      .eq("status", "نشط")
      .order("created_at", { ascending: false });

    if (error) throw error;
    setEmployees(data || []);
  };

  const loadPayrollRecords = async () => {
    const { data, error } = await supabase
      .from("payroll_records")
      .select(`
        *,
        employees (
          id,
          employee_code,
          full_name,
          department,
          position,
          basic_salary,
          status
        )
      `)
      .eq("user_id", user?.id)
      .eq("month", selectedMonth)
      .eq("year", selectedYear)
      .order("created_at", { ascending: false });

    if (error) throw error;
    setPayrollRecords(data || []);
  };

  const loadStats = async () => {
    const { data: employeesData } = await supabase
      .from("employees")
      .select("id")
      .eq("user_id", user?.id)
      .eq("status", "نشط");

    const { data: payrollData } = await supabase
      .from("payroll_records")
      .select("net_salary, status")
      .eq("user_id", user?.id)
      .eq("month", selectedMonth)
      .eq("year", selectedYear);

    const totalPayroll = payrollData?.reduce((sum, record) => sum + Number(record.net_salary), 0) || 0;
    const paidRecords = payrollData?.filter(r => r.status === "مدفوع").length || 0;
    const pendingRecords = payrollData?.filter(r => r.status !== "مدفوع").length || 0;

    setStats({
      totalEmployees: employeesData?.length || 0,
      totalPayroll,
      paidRecords,
      pendingRecords
    });
  };

  const handleAddEmployee = async () => {
    if (!newEmployee.full_name || !newEmployee.department || !newEmployee.position) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى إدخال جميع البيانات المطلوبة",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("employees")
        .insert([{
          user_id: user?.id,
          employee_code: "",
          ...newEmployee
        }]);

      if (error) throw error;

      toast({
        title: "تم إضافة الموظف",
        description: "تم إضافة الموظف بنجاح"
      });

      setShowAddEmployee(false);
      setNewEmployee({
        full_name: "",
        department: "",
        position: "",
        basic_salary: 0,
        email: "",
        phone: "",
        employment_type: "دوام كامل"
      });
      loadData();
    } catch (error) {
      console.error("Error adding employee:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة الموظف",
        variant: "destructive"
      });
    }
  };

  const handleGeneratePayroll = async () => {
    try {
      const recordsToGenerate = employees.map(emp => ({
        user_id: user?.id,
        employee_id: emp.id,
        month: selectedMonth,
        year: selectedYear,
        basic_salary: emp.basic_salary,
        total_allowances: 0,
        total_deductions: 0,
        net_salary: emp.basic_salary,
        working_days: 30,
        absent_days: 0,
        overtime_hours: 0,
        overtime_amount: 0,
        status: "مسودة"
      }));

      const { error } = await supabase
        .from("payroll_records")
        .upsert(recordsToGenerate, {
          onConflict: "employee_id,month,year",
          ignoreDuplicates: false
        });

      if (error) throw error;

      toast({
        title: "تم إنشاء كشف الرواتب",
        description: `تم إنشاء كشف رواتب لـ ${employees.length} موظف`
      });

      setShowGeneratePayroll(false);
      loadData();
    } catch (error) {
      console.error("Error generating payroll:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء كشف الرواتب",
        variant: "destructive"
      });
    }
  };

  const handleApprovePayroll = async (recordId: string) => {
    try {
      const { error } = await supabase
        .from("payroll_records")
        .update({ status: "معتمد" })
        .eq("id", recordId);

      if (error) throw error;

      toast({
        title: "تم اعتماد الراتب",
        description: "تم اعتماد الراتب بنجاح"
      });

      loadData();
    } catch (error) {
      console.error("Error approving payroll:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء اعتماد الراتب",
        variant: "destructive"
      });
    }
  };

  const handleMarkAsPaid = async (recordId: string) => {
    try {
      const { error } = await supabase
        .from("payroll_records")
        .update({
          status: "مدفوع",
          payment_date: new Date().toISOString().split('T')[0]
        })
        .eq("id", recordId);

      if (error) throw error;

      toast({
        title: "تم تحديث حالة الدفع",
        description: "تم تسجيل الراتب كمدفوع"
      });

      loadData();
    } catch (error) {
      console.error("Error marking as paid:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث حالة الدفع",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "مدفوع":
        return "bg-green-100 text-green-800";
      case "معتمد":
        return "bg-blue-100 text-blue-800";
      case "مسودة":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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
          <Wallet className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">إدارة الرواتب</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddEmployee(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            إضافة موظف
          </Button>
          <Button onClick={() => setShowGeneratePayroll(true)} variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            إنشاء كشف رواتب
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الموظفين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">موظف نشط</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الرواتب</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPayroll.toLocaleString()} ر.س</div>
            <p className="text-xs text-muted-foreground">للشهر الحالي</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">الرواتب المدفوعة</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.paidRecords}</div>
            <p className="text-xs text-muted-foreground">راتب مدفوع</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">قيد الانتظار</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRecords}</div>
            <p className="text-xs text-muted-foreground">راتب معلق</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>كشف الرواتب</CardTitle>
            <div className="flex gap-2">
              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(Number(v))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={index} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
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
          <Tabs defaultValue="payroll" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="payroll">كشف الرواتب</TabsTrigger>
              <TabsTrigger value="employees">الموظفين</TabsTrigger>
            </TabsList>

            <TabsContent value="payroll" className="mt-4">
              {payrollRecords.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">لا توجد سجلات رواتب لهذا الشهر</p>
                  <Button onClick={() => setShowGeneratePayroll(true)} className="mt-4">
                    إنشاء كشف رواتب
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>كود الموظف</TableHead>
                      <TableHead>اسم الموظف</TableHead>
                      <TableHead>القسم</TableHead>
                      <TableHead>الراتب الأساسي</TableHead>
                      <TableHead>البدلات</TableHead>
                      <TableHead>الخصومات</TableHead>
                      <TableHead>صافي الراتب</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.employees.employee_code}</TableCell>
                        <TableCell className="font-medium">{record.employees.full_name}</TableCell>
                        <TableCell>{record.employees.department}</TableCell>
                        <TableCell>{Number(record.basic_salary).toLocaleString()} ر.س</TableCell>
                        <TableCell>{Number(record.total_allowances).toLocaleString()} ر.س</TableCell>
                        <TableCell>{Number(record.total_deductions).toLocaleString()} ر.س</TableCell>
                        <TableCell className="font-bold">{Number(record.net_salary).toLocaleString()} ر.س</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(record.status)}>
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {record.status === "مسودة" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApprovePayroll(record.id)}
                              >
                                اعتماد
                              </Button>
                            )}
                            {record.status === "معتمد" && (
                              <Button
                                size="sm"
                                onClick={() => handleMarkAsPaid(record.id)}
                              >
                                تسجيل كمدفوع
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="employees" className="mt-4">
              {employees.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">لا يوجد موظفين مسجلين</p>
                  <Button onClick={() => setShowAddEmployee(true)} className="mt-4">
                    إضافة موظف جديد
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>كود الموظف</TableHead>
                      <TableHead>الاسم</TableHead>
                      <TableHead>القسم</TableHead>
                      <TableHead>المسمى الوظيفي</TableHead>
                      <TableHead>الراتب الأساسي</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>{employee.employee_code}</TableCell>
                        <TableCell className="font-medium">{employee.full_name}</TableCell>
                        <TableCell>{employee.department}</TableCell>
                        <TableCell>{employee.position}</TableCell>
                        <TableCell>{Number(employee.basic_salary).toLocaleString()} ر.س</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(employee.status)}>
                            {employee.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={showAddEmployee} onOpenChange={setShowAddEmployee}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>إضافة موظف جديد</DialogTitle>
            <DialogDescription>
              أدخل بيانات الموظف الجديد
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="full_name">الاسم الكامل *</Label>
              <Input
                id="full_name"
                value={newEmployee.full_name}
                onChange={(e) => setNewEmployee({...newEmployee, full_name: e.target.value})}
                placeholder="أدخل الاسم الكامل"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="department">القسم *</Label>
                <Select
                  value={newEmployee.department}
                  onValueChange={(v) => setNewEmployee({...newEmployee, department: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر القسم" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="position">المسمى الوظيفي *</Label>
                <Input
                  id="position"
                  value={newEmployee.position}
                  onChange={(e) => setNewEmployee({...newEmployee, position: e.target.value})}
                  placeholder="أدخل المسمى"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                  placeholder="email@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">رقم الجوال</Label>
                <Input
                  id="phone"
                  value={newEmployee.phone}
                  onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
                  placeholder="05xxxxxxxx"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="employment_type">نوع العمل</Label>
                <Select
                  value={newEmployee.employment_type}
                  onValueChange={(v) => setNewEmployee({...newEmployee, employment_type: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="دوام كامل">دوام كامل</SelectItem>
                    <SelectItem value="دوام جزئي">دوام جزئي</SelectItem>
                    <SelectItem value="عقد مؤقت">عقد مؤقت</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="basic_salary">الراتب الأساسي *</Label>
                <Input
                  id="basic_salary"
                  type="number"
                  value={newEmployee.basic_salary}
                  onChange={(e) => setNewEmployee({...newEmployee, basic_salary: Number(e.target.value)})}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddEmployee(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddEmployee}>
              إضافة الموظف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showGeneratePayroll} onOpenChange={setShowGeneratePayroll}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إنشاء كشف رواتب</DialogTitle>
            <DialogDescription>
              سيتم إنشاء كشف رواتب لشهر {months[selectedMonth - 1]} {selectedYear}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              عدد الموظفين: <span className="font-bold">{employees.length}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              هل تريد المتابعة؟
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGeneratePayroll(false)}>
              إلغاء
            </Button>
            <Button onClick={handleGeneratePayroll}>
              إنشاء الكشف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Payroll;
