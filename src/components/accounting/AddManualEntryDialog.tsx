import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Account {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
}

interface EntryLine {
  account_id: string;
  account_name: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
}

interface AddManualEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddManualEntryDialog({ open, onOpenChange, onSuccess }: AddManualEntryDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entry, setEntry] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    entry_type: 'يدوي',
    reference_number: '',
    description: '',
    fiscal_year: new Date().getFullYear(),
    notes: ''
  });
  const [lines, setLines] = useState<EntryLine[]>([
    { account_id: '', account_name: '', description: '', debit_amount: 0, credit_amount: 0 }
  ]);

  useEffect(() => {
    if (open && user) {
      loadAccounts();
    }
  }, [open, user]);

  const loadAccounts = async () => {
    const { data } = await supabase
      .from('chart_of_accounts')
      .select('id, account_code, account_name, account_type')
      .eq('user_id', user?.id)
      .eq('is_active', true)
      .order('account_code');

    if (data) {
      setAccounts(data);
    }
  };

  const addLine = () => {
    setLines([...lines, { account_id: '', account_name: '', description: '', debit_amount: 0, credit_amount: 0 }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, field: keyof EntryLine, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };

    if (field === 'account_id') {
      const account = accounts.find(a => a.id === value);
      if (account) {
        newLines[index].account_name = account.account_name;
      }
    }

    setLines(newLines);
  };

  const getTotalDebit = () => lines.reduce((sum, line) => sum + Number(line.debit_amount), 0);
  const getTotalCredit = () => lines.reduce((sum, line) => sum + Number(line.credit_amount), 0);
  const getDifference = () => getTotalDebit() - getTotalCredit();

  const handleSave = async () => {
    if (!entry.description) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى إدخال وصف القيد",
        variant: "destructive"
      });
      return;
    }

    const totalDebit = getTotalDebit();
    const totalCredit = getTotalCredit();

    if (totalDebit !== totalCredit) {
      toast({
        title: "خطأ في التوازن",
        description: "يجب أن يكون إجمالي المدين مساوياً لإجمالي الدائن",
        variant: "destructive"
      });
      return;
    }

    if (lines.some(line => !line.account_id)) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى اختيار حساب لكل سطر",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: entryData, error: entryError } = await supabase
        .from('manual_journal_entries')
        .insert([{
          user_id: user?.id,
          entry_number: '',
          ...entry,
          total_debit: totalDebit,
          total_credit: totalCredit
        }])
        .select()
        .single();

      if (entryError) throw entryError;

      const entryLines = lines.map((line, index) => ({
        user_id: user?.id,
        entry_id: entryData.id,
        line_number: index + 1,
        account_id: line.account_id,
        description: line.description,
        debit_amount: line.debit_amount,
        credit_amount: line.credit_amount
      }));

      const { error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(entryLines);

      if (linesError) throw linesError;

      toast({
        title: "تم إضافة القيد",
        description: "تم إضافة القيد المحاسبي بنجاح"
      });

      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding entry:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة القيد",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setEntry({
      entry_date: new Date().toISOString().split('T')[0],
      entry_type: 'يدوي',
      reference_number: '',
      description: '',
      fiscal_year: new Date().getFullYear(),
      notes: ''
    });
    setLines([{ account_id: '', account_name: '', description: '', debit_amount: 0, credit_amount: 0 }]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إضافة قيد محاسبي يدوي</DialogTitle>
          <DialogDescription>
            أدخل بيانات القيد المحاسبي
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="entry_date">تاريخ القيد *</Label>
              <Input
                id="entry_date"
                type="date"
                value={entry.entry_date}
                onChange={(e) => setEntry({...entry, entry_date: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="entry_type">نوع القيد</Label>
              <Select
                value={entry.entry_type}
                onValueChange={(v) => setEntry({...entry, entry_type: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="يدوي">يدوي</SelectItem>
                  <SelectItem value="افتتاحي">افتتاحي</SelectItem>
                  <SelectItem value="تسوية">تسوية</SelectItem>
                  <SelectItem value="إقفال">إقفال</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reference">رقم المرجع</Label>
              <Input
                id="reference"
                value={entry.reference_number}
                onChange={(e) => setEntry({...entry, reference_number: e.target.value})}
                placeholder="اختياري"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">وصف القيد *</Label>
            <Textarea
              id="description"
              value={entry.description}
              onChange={(e) => setEntry({...entry, description: e.target.value})}
              placeholder="أدخل وصف القيد"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>بنود القيد</Label>
              <Button onClick={addLine} size="sm" variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                إضافة سطر
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">الحساب</TableHead>
                    <TableHead>البيان</TableHead>
                    <TableHead className="w-[120px]">مدين</TableHead>
                    <TableHead className="w-[120px]">دائن</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Select
                          value={line.account_id}
                          onValueChange={(v) => updateLine(index, 'account_id', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر حساب" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.account_code} - {account.account_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={line.description}
                          onChange={(e) => updateLine(index, 'description', e.target.value)}
                          placeholder="البيان"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={line.debit_amount}
                          onChange={(e) => updateLine(index, 'debit_amount', Number(e.target.value))}
                          placeholder="0"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={line.credit_amount}
                          onChange={(e) => updateLine(index, 'credit_amount', Number(e.target.value))}
                          placeholder="0"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeLine(index)}
                          disabled={lines.length === 1}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">إجمالي المدين</p>
                <p className="text-lg font-bold">{getTotalDebit().toLocaleString()} ر.س</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">إجمالي الدائن</p>
                <p className="text-lg font-bold">{getTotalCredit().toLocaleString()} ر.س</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">الفرق</p>
                <p className={`text-lg font-bold ${getDifference() === 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {getDifference().toLocaleString()} ر.س
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              value={entry.notes}
              onChange={(e) => setEntry({...entry, notes: e.target.value})}
              placeholder="ملاحظات إضافية"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSave} disabled={getDifference() !== 0}>
            حفظ القيد
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
