import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileBox, Plus, Download, Eye, Calendar, CircleAlert as AlertCircle, CircleCheck as CheckCircle, Clock } from "lucide-react";
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

interface CommercialDocument {
  id: string;
  document_number: string;
  document_type: string;
  document_title: string;
  party_name: string;
  party_type: string;
  issue_date: string;
  expiry_date: string | null;
  document_value: number;
  status: string;
  renewal_type: string;
}

interface DocumentStats {
  totalDocuments: number;
  activeDocuments: number;
  expiringSoon: number;
  expiredDocuments: number;
  totalValue: number;
}

const CommercialDocuments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<CommercialDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<CommercialDocument | null>(null);
  const [stats, setStats] = useState<DocumentStats>({
    totalDocuments: 0,
    activeDocuments: 0,
    expiringSoon: 0,
    expiredDocuments: 0,
    totalValue: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDocument, setShowAddDocument] = useState(false);
  const [showViewDocument, setShowViewDocument] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [newDocument, setNewDocument] = useState({
    document_type: 'عقد',
    document_title: '',
    party_name: '',
    party_type: 'عميل',
    issue_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    start_date: '',
    end_date: '',
    document_value: 0,
    currency: 'ر.س',
    renewal_type: 'يدوي',
    reminder_days: 30,
    description: '',
    terms_conditions: '',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, filterType, filterStatus]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadDocuments(),
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

  const loadDocuments = async () => {
    let query = supabase
      .from("commercial_documents")
      .select("*")
      .eq("user_id", user?.id)
      .order("issue_date", { ascending: false });

    if (filterType !== "all") {
      query = query.eq("document_type", filterType);
    }

    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }

    const { data, error } = await query;

    if (error) throw error;
    setDocuments(data || []);
  };

  const loadStats = async () => {
    const { data } = await supabase
      .from("commercial_documents")
      .select("status, expiry_date, document_value")
      .eq("user_id", user?.id);

    if (data) {
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      const expiringSoon = data.filter(doc => {
        if (!doc.expiry_date) return false;
        const expiryDate = new Date(doc.expiry_date);
        return expiryDate > today && expiryDate <= thirtyDaysFromNow;
      }).length;

      setStats({
        totalDocuments: data.length,
        activeDocuments: data.filter(d => d.status === 'نشط').length,
        expiringSoon,
        expiredDocuments: data.filter(d => d.status === 'منتهي').length,
        totalValue: data.reduce((sum, d) => sum + Number(d.document_value), 0)
      });
    }
  };

  const handleAddDocument = async () => {
    if (!newDocument.document_title || !newDocument.party_name) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى إدخال عنوان المستند واسم الطرف",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('commercial_documents')
        .insert([{
          user_id: user?.id,
          document_number: '',
          ...newDocument
        }]);

      if (error) throw error;

      toast({
        title: "تم إضافة المستند",
        description: "تم إضافة المستند التجاري بنجاح"
      });

      setShowAddDocument(false);
      resetNewDocument();
      loadData();
    } catch (error) {
      console.error('Error adding document:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة المستند",
        variant: "destructive"
      });
    }
  };

  const viewDocument = async (document: CommercialDocument) => {
    setSelectedDocument(document);
    setShowViewDocument(true);
  };

  const handleRenew = async (documentId: string) => {
    try {
      const document = documents.find(d => d.id === documentId);
      if (!document) return;

      const currentExpiry = new Date(document.expiry_date || new Date());
      const newExpiry = new Date(currentExpiry);
      newExpiry.setFullYear(newExpiry.getFullYear() + 1);

      const { error: renewalError } = await supabase
        .from('document_renewals')
        .insert([{
          user_id: user?.id,
          document_id: documentId,
          renewal_date: new Date().toISOString().split('T')[0],
          new_expiry_date: newExpiry.toISOString().split('T')[0],
          renewal_amount: document.document_value,
          status: 'مكتمل'
        }]);

      if (renewalError) throw renewalError;

      const { error: updateError } = await supabase
        .from('commercial_documents')
        .update({
          expiry_date: newExpiry.toISOString().split('T')[0],
          status: 'نشط'
        })
        .eq('id', documentId);

      if (updateError) throw updateError;

      toast({
        title: "تم تجديد المستند",
        description: "تم تجديد المستند بنجاح"
      });

      loadData();
    } catch (error) {
      console.error("Error renewing document:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تجديد المستند",
        variant: "destructive"
      });
    }
  };

  const resetNewDocument = () => {
    setNewDocument({
      document_type: 'عقد',
      document_title: '',
      party_name: '',
      party_type: 'عميل',
      issue_date: new Date().toISOString().split('T')[0],
      expiry_date: '',
      start_date: '',
      end_date: '',
      document_value: 0,
      currency: 'ر.س',
      renewal_type: 'يدوي',
      reminder_days: 30,
      description: '',
      terms_conditions: '',
      notes: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "نشط":
        return "bg-green-100 text-green-800";
      case "منتهي":
        return "bg-red-100 text-red-800";
      case "معلق":
        return "bg-yellow-100 text-yellow-800";
      case "ملغي":
        return "bg-gray-100 text-gray-800";
      case "مسودة":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "عقد":
        return "bg-blue-100 text-blue-800";
      case "اتفاقية":
        return "bg-purple-100 text-purple-800";
      case "ترخيص":
        return "bg-green-100 text-green-800";
      case "شهادة":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDaysUntilExpiry = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryBadge = (expiryDate: string | null) => {
    const days = getDaysUntilExpiry(expiryDate);
    if (days === null) return null;

    if (days < 0) {
      return <Badge className="bg-red-100 text-red-800">منتهي</Badge>;
    } else if (days <= 30) {
      return <Badge className="bg-yellow-100 text-yellow-800">ينتهي خلال {days} يوم</Badge>;
    }
    return null;
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
          <FileBox className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">المستندات التجارية</h1>
        </div>
        <Button onClick={() => setShowAddDocument(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة مستند
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المستندات</CardTitle>
            <FileBox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
            <p className="text-xs text-muted-foreground">مستند</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">مستندات نشطة</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeDocuments}</div>
            <p className="text-xs text-muted-foreground">مستند نشط</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">تنتهي قريباً</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.expiringSoon}</div>
            <p className="text-xs text-muted-foreground">خلال 30 يوم</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">مستندات منتهية</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expiredDocuments}</div>
            <p className="text-xs text-muted-foreground">مستند منتهي</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">القيمة الإجمالية</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalValue.toLocaleString()} ر.س</div>
            <p className="text-xs text-muted-foreground">قيمة المستندات</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>قائمة المستندات التجارية</CardTitle>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأنواع</SelectItem>
                  <SelectItem value="عقد">عقد</SelectItem>
                  <SelectItem value="اتفاقية">اتفاقية</SelectItem>
                  <SelectItem value="ترخيص">ترخيص</SelectItem>
                  <SelectItem value="شهادة">شهادة</SelectItem>
                  <SelectItem value="وثيقة تأمين">وثيقة تأمين</SelectItem>
                  <SelectItem value="سند ملكية">سند ملكية</SelectItem>
                  <SelectItem value="عقد إيجار">عقد إيجار</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="نشط">نشط</SelectItem>
                  <SelectItem value="منتهي">منتهي</SelectItem>
                  <SelectItem value="معلق">معلق</SelectItem>
                  <SelectItem value="ملغي">ملغي</SelectItem>
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
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <FileBox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد مستندات تجارية</p>
              <Button onClick={() => setShowAddDocument(true)} className="mt-4">
                إضافة مستند جديد
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم المستند</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>العنوان</TableHead>
                  <TableHead>الطرف</TableHead>
                  <TableHead>تاريخ الإصدار</TableHead>
                  <TableHead>تاريخ الانتهاء</TableHead>
                  <TableHead>القيمة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell className="font-medium">{document.document_number}</TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(document.document_type)}>
                        {document.document_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{document.document_title}</TableCell>
                    <TableCell>{document.party_name}</TableCell>
                    <TableCell>{new Date(document.issue_date).toLocaleDateString('ar-SA')}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p>{document.expiry_date ? new Date(document.expiry_date).toLocaleDateString('ar-SA') : '-'}</p>
                        {getExpiryBadge(document.expiry_date)}
                      </div>
                    </TableCell>
                    <TableCell>{Number(document.document_value).toLocaleString()} ر.س</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(document.status)}>
                        {document.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewDocument(document)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {document.status === 'منتهي' && (
                          <Button
                            size="sm"
                            onClick={() => handleRenew(document.id)}
                          >
                            تجديد
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

      <Dialog open={showAddDocument} onOpenChange={setShowAddDocument}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة مستند تجاري</DialogTitle>
            <DialogDescription>
              أدخل بيانات المستند التجاري
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="document_type">نوع المستند *</Label>
                <Select
                  value={newDocument.document_type}
                  onValueChange={(v) => setNewDocument({...newDocument, document_type: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="عقد">عقد</SelectItem>
                    <SelectItem value="اتفاقية">اتفاقية</SelectItem>
                    <SelectItem value="ترخيص">ترخيص</SelectItem>
                    <SelectItem value="شهادة">شهادة</SelectItem>
                    <SelectItem value="وثيقة تأمين">وثيقة تأمين</SelectItem>
                    <SelectItem value="سند ملكية">سند ملكية</SelectItem>
                    <SelectItem value="عقد إيجار">عقد إيجار</SelectItem>
                    <SelectItem value="أخرى">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="document_title">عنوان المستند *</Label>
                <Input
                  id="document_title"
                  value={newDocument.document_title}
                  onChange={(e) => setNewDocument({...newDocument, document_title: e.target.value})}
                  placeholder="عقد تقديم خدمات"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="party_name">اسم الطرف *</Label>
                <Input
                  id="party_name"
                  value={newDocument.party_name}
                  onChange={(e) => setNewDocument({...newDocument, party_name: e.target.value})}
                  placeholder="اسم الشركة أو الشخص"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="party_type">نوع الطرف</Label>
                <Select
                  value={newDocument.party_type}
                  onValueChange={(v) => setNewDocument({...newDocument, party_type: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="عميل">عميل</SelectItem>
                    <SelectItem value="مورد">مورد</SelectItem>
                    <SelectItem value="شريك">شريك</SelectItem>
                    <SelectItem value="جهة حكومية">جهة حكومية</SelectItem>
                    <SelectItem value="أخرى">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="issue_date">تاريخ الإصدار *</Label>
                <Input
                  id="issue_date"
                  type="date"
                  value={newDocument.issue_date}
                  onChange={(e) => setNewDocument({...newDocument, issue_date: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expiry_date">تاريخ الانتهاء</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={newDocument.expiry_date}
                  onChange={(e) => setNewDocument({...newDocument, expiry_date: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="document_value">قيمة المستند</Label>
                <Input
                  id="document_value"
                  type="number"
                  value={newDocument.document_value}
                  onChange={(e) => setNewDocument({...newDocument, document_value: Number(e.target.value)})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="renewal_type">نوع التجديد</Label>
                <Select
                  value={newDocument.renewal_type}
                  onValueChange={(v) => setNewDocument({...newDocument, renewal_type: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="تلقائي">تلقائي</SelectItem>
                    <SelectItem value="يدوي">يدوي</SelectItem>
                    <SelectItem value="لا يتجدد">لا يتجدد</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={newDocument.description}
                onChange={(e) => setNewDocument({...newDocument, description: e.target.value})}
                placeholder="وصف المستند"
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="terms_conditions">الشروط والأحكام</Label>
              <Textarea
                id="terms_conditions"
                value={newDocument.terms_conditions}
                onChange={(e) => setNewDocument({...newDocument, terms_conditions: e.target.value})}
                placeholder="الشروط والأحكام"
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                value={newDocument.notes}
                onChange={(e) => setNewDocument({...newDocument, notes: e.target.value})}
                placeholder="ملاحظات إضافية"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDocument(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddDocument}>
              حفظ المستند
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showViewDocument} onOpenChange={setShowViewDocument}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل المستند - {selectedDocument?.document_number}</DialogTitle>
            <DialogDescription>
              عرض تفاصيل المستند التجاري
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">نوع المستند</p>
                <Badge className={getTypeColor(selectedDocument?.document_type || '')}>
                  {selectedDocument?.document_type}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الحالة</p>
                <Badge className={getStatusColor(selectedDocument?.status || '')}>
                  {selectedDocument?.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">عنوان المستند</p>
                <p className="font-medium">{selectedDocument?.document_title}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الطرف</p>
                <p className="font-medium">{selectedDocument?.party_name} ({selectedDocument?.party_type})</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">تاريخ الإصدار</p>
                <p className="font-medium">
                  {selectedDocument && new Date(selectedDocument.issue_date).toLocaleDateString('ar-SA')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">تاريخ الانتهاء</p>
                <p className="font-medium">
                  {selectedDocument?.expiry_date
                    ? new Date(selectedDocument.expiry_date).toLocaleDateString('ar-SA')
                    : '-'
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">قيمة المستند</p>
                <p className="font-medium">{Number(selectedDocument?.document_value).toLocaleString()} ر.س</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">نوع التجديد</p>
                <p className="font-medium">{selectedDocument?.renewal_type}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommercialDocuments;
