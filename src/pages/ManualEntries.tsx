import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { File as FileEdit, Plus, Download, CircleCheck as CheckCircle, Clock, Circle as XCircle, Eye } from "lucide-react";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddManualEntryDialog } from "@/components/accounting/AddManualEntryDialog";

interface JournalEntry {
  id: string;
  entry_number: string;
  entry_date: string;
  entry_type: string;
  description: string;
  total_debit: number;
  total_credit: number;
  status: string;
  reference_number: string | null;
}

interface EntryLine {
  id: string;
  line_number: number;
  description: string;
  debit_amount: number;
  credit_amount: number;
  chart_of_accounts: {
    account_code: string;
    account_name: string;
  };
}

interface EntryStats {
  totalEntries: number;
  draftEntries: number;
  approvedEntries: number;
  postedEntries: number;
}

const ManualEntries = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [entryLines, setEntryLines] = useState<EntryLine[]>([]);
  const [stats, setStats] = useState<EntryStats>({
    totalEntries: 0,
    draftEntries: 0,
    approvedEntries: 0,
    postedEntries: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [showViewEntry, setShowViewEntry] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, filterStatus, filterType]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadEntries(),
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

  const loadEntries = async () => {
    let query = supabase
      .from("manual_journal_entries")
      .select("*")
      .eq("user_id", user?.id)
      .order("entry_date", { ascending: false });

    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }

    if (filterType !== "all") {
      query = query.eq("entry_type", filterType);
    }

    const { data, error } = await query;

    if (error) throw error;
    setEntries(data || []);
  };

  const loadStats = async () => {
    const { data } = await supabase
      .from("manual_journal_entries")
      .select("status")
      .eq("user_id", user?.id);

    if (data) {
      setStats({
        totalEntries: data.length,
        draftEntries: data.filter(e => e.status === 'مسودة').length,
        approvedEntries: data.filter(e => e.status === 'معتمد').length,
        postedEntries: data.filter(e => e.status === 'مرحل').length
      });
    }
  };

  const loadEntryLines = async (entryId: string) => {
    const { data, error } = await supabase
      .from("journal_entry_lines")
      .select(`
        *,
        chart_of_accounts (
          account_code,
          account_name
        )
      `)
      .eq("entry_id", entryId)
      .order("line_number");

    if (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل تفاصيل القيد",
        variant: "destructive"
      });
      return;
    }

    setEntryLines(data || []);
  };

  const viewEntry = async (entry: JournalEntry) => {
    setSelectedEntry(entry);
    await loadEntryLines(entry.id);
    setShowViewEntry(true);
  };

  const handleApprove = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from("manual_journal_entries")
        .update({ status: "معتمد" })
        .eq("id", entryId);

      if (error) throw error;

      toast({
        title: "تم اعتماد القيد",
        description: "تم اعتماد القيد بنجاح"
      });

      loadData();
    } catch (error) {
      console.error("Error approving entry:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء اعتماد القيد",
        variant: "destructive"
      });
    }
  };

  const handlePost = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from("manual_journal_entries")
        .update({
          status: "مرحل",
          posted_date: new Date().toISOString().split('T')[0]
        })
        .eq("id", entryId);

      if (error) throw error;

      toast({
        title: "تم ترحيل القيد",
        description: "تم ترحيل القيد بنجاح"
      });

      loadData();
    } catch (error) {
      console.error("Error posting entry:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء ترحيل القيد",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "مرحل":
        return "bg-green-100 text-green-800";
      case "معتمد":
        return "bg-blue-100 text-blue-800";
      case "مسودة":
        return "bg-yellow-100 text-yellow-800";
      case "ملغي":
        return "bg-red-100 text-red-800";
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
          <FileEdit className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">قيود محاسبية يدوية</h1>
        </div>
        <Button onClick={() => setShowAddEntry(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة قيد
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي القيود</CardTitle>
            <FileEdit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEntries}</div>
            <p className="text-xs text-muted-foreground">قيد محاسبي</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">مسودات</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.draftEntries}</div>
            <p className="text-xs text-muted-foreground">قيد مسودة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">معتمدة</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.approvedEntries}</div>
            <p className="text-xs text-muted-foreground">قيد معتمد</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">مرحلة</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.postedEntries}</div>
            <p className="text-xs text-muted-foreground">قيد مرحل</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>قائمة القيود المحاسبية</CardTitle>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأنواع</SelectItem>
                  <SelectItem value="يدوي">يدوي</SelectItem>
                  <SelectItem value="افتتاحي">افتتاحي</SelectItem>
                  <SelectItem value="تسوية">تسوية</SelectItem>
                  <SelectItem value="إقفال">إقفال</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="مسودة">مسودة</SelectItem>
                  <SelectItem value="معتمد">معتمد</SelectItem>
                  <SelectItem value="مرحل">مرحل</SelectItem>
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
          {entries.length === 0 ? (
            <div className="text-center py-12">
              <FileEdit className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد قيود مسجلة</p>
              <Button onClick={() => setShowAddEntry(true)} className="mt-4">
                إضافة قيد جديد
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم القيد</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>المدين</TableHead>
                  <TableHead>الدائن</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.entry_number}</TableCell>
                    <TableCell>{new Date(entry.entry_date).toLocaleDateString('ar-SA')}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{entry.entry_type}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">{entry.description}</TableCell>
                    <TableCell>{Number(entry.total_debit).toLocaleString()} ر.س</TableCell>
                    <TableCell>{Number(entry.total_credit).toLocaleString()} ر.س</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(entry.status)}>
                        {entry.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewEntry(entry)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {entry.status === 'مسودة' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(entry.id)}
                          >
                            اعتماد
                          </Button>
                        )}
                        {entry.status === 'معتمد' && (
                          <Button
                            size="sm"
                            onClick={() => handlePost(entry.id)}
                          >
                            ترحيل
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddManualEntryDialog
        open={showAddEntry}
        onOpenChange={setShowAddEntry}
        onSuccess={loadData}
      />

      <Dialog open={showViewEntry} onOpenChange={setShowViewEntry}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>تفاصيل القيد - {selectedEntry?.entry_number}</DialogTitle>
            <DialogDescription>
              عرض تفاصيل القيد المحاسبي
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">التاريخ</p>
                <p className="font-medium">{selectedEntry && new Date(selectedEntry.entry_date).toLocaleDateString('ar-SA')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">النوع</p>
                <p className="font-medium">{selectedEntry?.entry_type}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">الوصف</p>
                <p className="font-medium">{selectedEntry?.description}</p>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الحساب</TableHead>
                    <TableHead>البيان</TableHead>
                    <TableHead>مدين</TableHead>
                    <TableHead>دائن</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entryLines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>
                        {line.chart_of_accounts.account_code} - {line.chart_of_accounts.account_name}
                      </TableCell>
                      <TableCell>{line.description}</TableCell>
                      <TableCell>{Number(line.debit_amount).toLocaleString()} ر.س</TableCell>
                      <TableCell>{Number(line.credit_amount).toLocaleString()} ر.س</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-gray-50">
                    <TableCell colSpan={2}>الإجمالي</TableCell>
                    <TableCell>{Number(selectedEntry?.total_debit).toLocaleString()} ر.س</TableCell>
                    <TableCell>{Number(selectedEntry?.total_credit).toLocaleString()} ر.س</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManualEntries;
