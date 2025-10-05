import { useState, useEffect } from "react";
import { FileText, Plus, Eye, CreditCard as Edit, Trash2, Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { exportToCSV, exportToJSON } from "@/utils/exportImport";

interface SimpleInvoice {
  id: string;
  invoice_number: string;
  recipient_name: string;
  recipient_phone: string | null;
  invoice_date: string;
  description: string;
  amount: number;
  status: string;
  notes: string | null;
  created_at: string;
}

const SimpleInvoices = () => {
  const [invoices, setInvoices] = useState<SimpleInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<SimpleInvoice | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    recipient_name: "",
    recipient_phone: "",
    invoice_date: new Date().toISOString().split('T')[0],
    description: "",
    amount: "",
    notes: "",
  });

  const statusColors: Record<string, string> = {
    draft: "bg-gray-500",
    issued: "bg-blue-500",
    paid: "bg-green-500",
    cancelled: "bg-red-500",
  };

  const statusLabels: Record<string, string> = {
    draft: "مسودة",
    issued: "صادرة",
    paid: "مدفوعة",
    cancelled: "ملغية",
  };

  useEffect(() => {
    initializeDemoData();
    fetchInvoices();
  }, []);

  const initializeDemoData = () => {
    // Initialize demo simple invoices if not exists
    const storedInvoices = localStorage.getItem('demo_simple_invoices');
    if (!storedInvoices) {
      const demoInvoices = [
        {
          id: 'si_1',
          invoice_number: 'SI-100001',
          recipient_name: 'محمد أحمد',
          recipient_phone: '0501234567',
          invoice_date: new Date().toISOString().split('T')[0],
          description: 'فاتورة خدمة استشارية',
          amount: 500,
          status: 'issued',
          notes: null,
          created_at: new Date().toISOString(),
        },
        {
          id: 'si_2',
          invoice_number: 'SI-100002',
          recipient_name: 'فاطمة خالد',
          recipient_phone: '0559876543',
          invoice_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: 'فاتورة صيانة أجهزة كمبيوتر',
          amount: 750,
          status: 'paid',
          notes: 'تم الدفع نقداً',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'si_3',
          invoice_number: 'SI-100003',
          recipient_name: 'خالد عبدالله',
          recipient_phone: null,
          invoice_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: 'فاتورة تصميم موقع إلكتروني',
          amount: 3000,
          status: 'issued',
          notes: null,
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
      localStorage.setItem('demo_simple_invoices', JSON.stringify(demoInvoices));
    }
  };

  const fetchInvoices = async () => {
    try {
      // Demo mode: load from localStorage
      const storedInvoices = localStorage.getItem('demo_simple_invoices');
      if (storedInvoices) {
        setInvoices(JSON.parse(storedInvoices));
      } else {
        setInvoices([]);
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل الفواتير",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateInvoiceNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `SI-${timestamp}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.recipient_name || !formData.description || !formData.amount) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (amount <= 0) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال مبلغ صحيح",
        variant: "destructive",
      });
      return;
    }

    try {
      const invoiceData = {
        id: isEditing ? selectedInvoice?.id : 'si_' + Date.now(),
        invoice_number: isEditing ? selectedInvoice?.invoice_number : generateInvoiceNumber(),
        recipient_name: formData.recipient_name,
        recipient_phone: formData.recipient_phone || null,
        invoice_date: formData.invoice_date,
        description: formData.description,
        amount: amount,
        status: isEditing ? selectedInvoice?.status || "issued" : "issued",
        notes: formData.notes || null,
        created_at: isEditing ? selectedInvoice?.created_at : new Date().toISOString(),
      };

      // Demo mode: save to localStorage
      const storedInvoices = localStorage.getItem('demo_simple_invoices');
      let invoicesArray = storedInvoices ? JSON.parse(storedInvoices) : [];

      if (isEditing && selectedInvoice) {
        invoicesArray = invoicesArray.map((invoice: SimpleInvoice) =>
          invoice.id === selectedInvoice.id ? invoiceData : invoice
        );
      } else {
        invoicesArray.unshift(invoiceData);
      }

      localStorage.setItem('demo_simple_invoices', JSON.stringify(invoicesArray));

      toast({
        title: "تم بنجاح",
        description: isEditing ? "تم تحديث الفاتورة" : "تم إضافة فاتورة جديدة",
      });

      setDialogOpen(false);
      resetForm();
      fetchInvoices();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف الفاتورة؟")) return;

    try {
      // Demo mode: delete from localStorage
      const storedInvoices = localStorage.getItem('demo_simple_invoices');
      if (storedInvoices) {
        const invoicesArray = JSON.parse(storedInvoices);
        const updatedInvoices = invoicesArray.filter((invoice: SimpleInvoice) => invoice.id !== id);
        localStorage.setItem('demo_simple_invoices', JSON.stringify(updatedInvoices));
      }

      toast({
        title: "تم الحذف",
        description: "تم حذف الفاتورة بنجاح",
      });

      fetchInvoices();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (invoice: SimpleInvoice) => {
    setSelectedInvoice(invoice);
    setIsEditing(true);
    setFormData({
      recipient_name: invoice.recipient_name,
      recipient_phone: invoice.recipient_phone || "",
      invoice_date: invoice.invoice_date,
      description: invoice.description,
      amount: invoice.amount.toString(),
      notes: invoice.notes || "",
    });
    setDialogOpen(true);
  };

  const handleView = (invoice: SimpleInvoice) => {
    setSelectedInvoice(invoice);
    setViewDialogOpen(true);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      // Demo mode: update in localStorage
      const storedInvoices = localStorage.getItem('demo_simple_invoices');
      if (storedInvoices) {
        const invoicesArray = JSON.parse(storedInvoices);
        const updatedInvoices = invoicesArray.map((invoice: SimpleInvoice) => {
          if (invoice.id === id) {
            return { ...invoice, status: newStatus };
          }
          return invoice;
        });
        localStorage.setItem('demo_simple_invoices', JSON.stringify(updatedInvoices));
      }

      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة الفاتورة بنجاح",
      });

      fetchInvoices();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleExport = (format: 'csv' | 'json') => {
    if (filteredInvoices.length === 0) {
      toast({
        title: "تنبيه",
        description: "لا توجد بيانات للتصدير",
        variant: "destructive",
      });
      return;
    }

    const exportData = filteredInvoices.map(invoice => ({
      'رقم الفاتورة': invoice.invoice_number,
      'اسم المستلم': invoice.recipient_name,
      'رقم الهاتف': invoice.recipient_phone || '-',
      'تاريخ الفاتورة': format(new Date(invoice.invoice_date), "yyyy-MM-dd"),
      'الوصف': invoice.description,
      'المبلغ': invoice.amount,
      'الحالة': statusLabels[invoice.status],
      'الملاحظات': invoice.notes || '-'
    }));

    if (format === 'csv') {
      exportToCSV(exportData, 'simple_invoices');
    } else {
      exportToJSON(exportData, 'simple_invoices');
    }

    toast({
      title: "تم التصدير",
      description: `تم تصدير ${filteredInvoices.length} فاتورة بنجاح`,
    });
  };

  const resetForm = () => {
    setFormData({
      recipient_name: "",
      recipient_phone: "",
      invoice_date: new Date().toISOString().split('T')[0],
      description: "",
      amount: "",
      notes: "",
    });
    setIsEditing(false);
    setSelectedInvoice(null);
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.recipient_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handlePrint = (invoice: SimpleInvoice) => {
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>فاتورة - ${invoice.invoice_number}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            direction: rtl;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .invoice-title {
            font-size: 28px;
            font-weight: bold;
            color: #333;
          }
          .invoice-number {
            font-size: 18px;
            color: #666;
            margin-top: 10px;
          }
          .details {
            margin: 30px 0;
            background: #f9f9f9;
            padding: 20px;
            border-radius: 8px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin: 15px 0;
            padding: 10px 0;
            border-bottom: 1px solid #ddd;
          }
          .detail-label {
            font-weight: bold;
            color: #555;
          }
          .detail-value {
            color: #333;
          }
          .amount-box {
            background: #4CAF50;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px;
            margin: 30px 0;
            font-size: 24px;
            font-weight: bold;
          }
          .description-box {
            background: #fff;
            border: 1px solid #ddd;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            min-height: 100px;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            color: #888;
            font-size: 14px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="invoice-title">فاتورة بسيطة</div>
          <div class="invoice-number">${invoice.invoice_number}</div>
        </div>

        <div class="details">
          <div class="detail-row">
            <span class="detail-label">اسم المستلم:</span>
            <span class="detail-value">${invoice.recipient_name}</span>
          </div>
          ${invoice.recipient_phone ? `
          <div class="detail-row">
            <span class="detail-label">رقم الهاتف:</span>
            <span class="detail-value">${invoice.recipient_phone}</span>
          </div>
          ` : ''}
          <div class="detail-row">
            <span class="detail-label">تاريخ الفاتورة:</span>
            <span class="detail-value">${format(new Date(invoice.invoice_date), "yyyy-MM-dd")}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">الحالة:</span>
            <span class="detail-value">${statusLabels[invoice.status]}</span>
          </div>
        </div>

        <div>
          <div class="detail-label" style="margin-bottom: 10px;">الوصف:</div>
          <div class="description-box">${invoice.description}</div>
        </div>

        <div class="amount-box">
          المبلغ: ${invoice.amount.toFixed(2)} ر.س
        </div>

        ${invoice.notes ? `
        <div>
          <div class="detail-label" style="margin-bottom: 10px;">ملاحظات:</div>
          <div class="description-box">${invoice.notes}</div>
        </div>
        ` : ''}

        <div class="footer">
          <p>تم إنشاء هذه الفاتورة بتاريخ ${format(new Date(invoice.created_at), "yyyy-MM-dd")}</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 100);
          }
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">فواتير بسيطة</h1>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="ml-2 h-4 w-4" />
                تصدير
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                تصدير CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('json')}>
                تصدير JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="ml-2 h-4 w-4" />
            فاتورة جديدة
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="بحث برقم الفاتورة أو اسم المستلم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="تصفية حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="issued">صادرة</SelectItem>
                <SelectItem value="paid">مدفوعة</SelectItem>
                <SelectItem value="cancelled">ملغية</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد فواتير
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الفاتورة</TableHead>
                    <TableHead>اسم المستلم</TableHead>
                    <TableHead>رقم الهاتف</TableHead>
                    <TableHead>تاريخ الفاتورة</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.recipient_name}</TableCell>
                      <TableCell>{invoice.recipient_phone || "-"}</TableCell>
                      <TableCell>{format(new Date(invoice.invoice_date), "yyyy-MM-dd")}</TableCell>
                      <TableCell className="font-bold">{invoice.amount.toFixed(2)} ر.س</TableCell>
                      <TableCell>
                        <Select
                          value={invoice.status}
                          onValueChange={(value) => handleStatusChange(invoice.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <Badge className={statusColors[invoice.status]}>
                              {statusLabels[invoice.status]}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">مسودة</SelectItem>
                            <SelectItem value="issued">صادرة</SelectItem>
                            <SelectItem value="paid">مدفوعة</SelectItem>
                            <SelectItem value="cancelled">ملغية</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePrint(invoice)}
                            title="طباعة"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleView(invoice)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(invoice)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(invoice.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "تعديل فاتورة بسيطة" : "فاتورة بسيطة جديدة"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم المستلم *</Label>
                <Input
                  value={formData.recipient_name}
                  onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                  placeholder="أدخل اسم المستلم"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>رقم الهاتف</Label>
                <Input
                  value={formData.recipient_phone}
                  onChange={(e) => setFormData({ ...formData, recipient_phone: e.target.value })}
                  placeholder="05xxxxxxxx"
                />
              </div>

              <div className="space-y-2">
                <Label>تاريخ الفاتورة *</Label>
                <Input
                  type="date"
                  value={formData.invoice_date}
                  onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>المبلغ (ر.س) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>الوصف *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف الخدمة أو المنتج..."
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="أضف ملاحظات إضافية..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit">
                {isEditing ? "تحديث" : "إضافة"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تفاصيل الفاتورة</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <Label className="text-muted-foreground">رقم الفاتورة</Label>
                  <p className="font-bold text-lg">{selectedInvoice.invoice_number}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">الحالة</Label>
                  <div className="mt-1">
                    <Badge className={statusColors[selectedInvoice.status]}>
                      {statusLabels[selectedInvoice.status]}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">اسم المستلم</Label>
                  <p className="font-medium">{selectedInvoice.recipient_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">رقم الهاتف</Label>
                  <p className="font-medium">{selectedInvoice.recipient_phone || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">تاريخ الفاتورة</Label>
                  <p>{format(new Date(selectedInvoice.invoice_date), "yyyy-MM-dd")}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">المبلغ</Label>
                  <p className="font-bold text-xl text-primary">
                    {selectedInvoice.amount.toFixed(2)} ر.س
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">الوصف</Label>
                <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                  {selectedInvoice.description}
                </div>
              </div>

              {selectedInvoice.notes && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">ملاحظات</Label>
                  <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                    {selectedInvoice.notes}
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => handlePrint(selectedInvoice)}
                >
                  <Printer className="h-4 w-4 ml-2" />
                  طباعة الفاتورة
                </Button>
                <Button onClick={() => setViewDialogOpen(false)}>
                  إغلاق
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SimpleInvoices;
