import { useState, useEffect } from "react";
import { BookOpen, Plus, CreditCard as Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { EmptyTableMessage } from "@/components/EmptyTableMessage";

interface Account {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  balance: number;
  is_active: boolean;
}

const ChartOfAccounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    account_code: "",
    account_name: "",
    account_type: "asset",
    balance: "0",
    description: "",
  });

  const accountTypes: Record<string, string> = {
    asset: "أصول",
    liability: "التزامات",
    equity: "حقوق ملكية",
    revenue: "إيرادات",
    expense: "مصروفات",
  };

  const typeColors: Record<string, string> = {
    asset: "bg-blue-500",
    liability: "bg-red-500",
    equity: "bg-green-500",
    revenue: "bg-emerald-500",
    expense: "bg-orange-500",
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .order("account_code");

      if (error) throw error;
      setAccounts(data || []);
      setHasError(false);
    } catch (error: any) {
      console.error('Error loading accounts:', error);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.account_code || !formData.account_name) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    try {
      const accountData = {
        account_code: formData.account_code,
        account_name: formData.account_name,
        account_type: formData.account_type,
        balance: parseFloat(formData.balance),
        description: formData.description || null,
        user_id: (await supabase.auth.getUser()).data.user?.id,
      };

      let error;
      if (isEditing && selectedAccount) {
        const result = await supabase
          .from("chart_of_accounts")
          .update(accountData)
          .eq("id", selectedAccount.id);
        error = result.error;
      } else {
        const result = await supabase
          .from("chart_of_accounts")
          .insert([accountData]);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: isEditing ? "تم تحديث الحساب" : "تم إضافة حساب جديد",
      });

      setDialogOpen(false);
      resetForm();
      fetchAccounts();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف الحساب؟")) return;

    try {
      const { error } = await supabase
        .from("chart_of_accounts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف الحساب بنجاح",
      });

      fetchAccounts();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (account: Account) => {
    setSelectedAccount(account);
    setIsEditing(true);
    setFormData({
      account_code: account.account_code,
      account_name: account.account_name,
      account_type: account.account_type,
      balance: account.balance.toString(),
      description: "",
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      account_code: "",
      account_name: "",
      account_type: "asset",
      balance: "0",
      description: "",
    });
    setIsEditing(false);
    setSelectedAccount(null);
  };

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch = account.account_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.account_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || account.account_type === typeFilter;
    return matchesSearch && matchesType && account.is_active;
  });

  if (hasError) {
    return <EmptyTableMessage title="دليل الحسابات" description="هذه الميزة قيد التطوير. سيتم إضافة جدول شجرة الحسابات قريباً." />;
  }

  const totalAssets = accounts.filter(a => a.account_type === "asset").reduce((sum, a) => sum + a.balance, 0);
  const totalLiabilities = accounts.filter(a => a.account_type === "liability").reduce((sum, a) => sum + a.balance, 0);
  const totalEquity = accounts.filter(a => a.account_type === "equity").reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">شجرة الحسابات</h1>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="ml-2 h-4 w-4" />
          حساب جديد
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">الأصول</p>
            <p className="text-2xl font-bold text-blue-600">{totalAssets.toFixed(2)} ر.س</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">الالتزامات</p>
            <p className="text-2xl font-bold text-red-600">{totalLiabilities.toFixed(2)} ر.س</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">حقوق الملكية</p>
            <p className="text-2xl font-bold text-green-600">{totalEquity.toFixed(2)} ر.س</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-4">
            <Input
              placeholder="بحث برقم أو اسم الحساب..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="asset">أصول</SelectItem>
                <SelectItem value="liability">التزامات</SelectItem>
                <SelectItem value="equity">حقوق ملكية</SelectItem>
                <SelectItem value="revenue">إيرادات</SelectItem>
                <SelectItem value="expense">مصروفات</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : filteredAccounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">لا توجد حسابات</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الحساب</TableHead>
                  <TableHead>اسم الحساب</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الرصيد</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-mono font-medium">{account.account_code}</TableCell>
                    <TableCell className="font-medium">{account.account_name}</TableCell>
                    <TableCell>
                      <Badge className={typeColors[account.account_type]}>
                        {accountTypes[account.account_type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold">{account.balance.toFixed(2)} ر.س</TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(account)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(account.id)}>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? "تعديل الحساب" : "حساب جديد"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>رقم الحساب *</Label>
                <Input
                  value={formData.account_code}
                  onChange={(e) => setFormData({ ...formData, account_code: e.target.value })}
                  placeholder="1000"
                  required
                  disabled={isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label>اسم الحساب *</Label>
                <Input
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>النوع *</Label>
                <Select
                  value={formData.account_type}
                  onValueChange={(value) => setFormData({ ...formData, account_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asset">أصول</SelectItem>
                    <SelectItem value="liability">التزامات</SelectItem>
                    <SelectItem value="equity">حقوق ملكية</SelectItem>
                    <SelectItem value="revenue">إيرادات</SelectItem>
                    <SelectItem value="expense">مصروفات</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الرصيد الافتتاحي</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit">{isEditing ? "تحديث" : "إضافة"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChartOfAccounts;
