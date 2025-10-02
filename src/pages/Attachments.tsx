import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Paperclip,
  Plus,
  FileText,
  Image as ImageIcon,
  File,
  Download,
  Trash2,
  Eye,
  Upload,
  CheckCircle2,
  XCircle,
  Search,
  Filter
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Attachment {
  id: string;
  entity_type: string;
  entity_id: string | null;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  description: string;
  uploaded_by: string;
  is_public: boolean;
  created_at: string;
}

const Attachments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const [newAttachment, setNewAttachment] = useState({
    entity_type: 'invoice',
    entity_id: '',
    file_name: '',
    file_type: '',
    file_size: '0',
    description: '',
    is_public: false
  });

  const entityTypes = [
    { value: 'invoice', label: 'الفواتير', icon: FileText },
    { value: 'customer', label: 'العملاء', icon: FileText },
    { value: 'supplier', label: 'الموردين', icon: FileText },
    { value: 'product', label: 'المنتجات', icon: FileText },
    { value: 'order', label: 'الطلبات', icon: FileText },
    { value: 'quote', label: 'عروض الأسعار', icon: FileText },
    { value: 'other', label: 'أخرى', icon: File }
  ];

  const fileTypes = [
    { ext: 'pdf', label: 'PDF', color: 'bg-red-100 text-red-800' },
    { ext: 'doc', label: 'Word', color: 'bg-blue-100 text-blue-800' },
    { ext: 'docx', label: 'Word', color: 'bg-blue-100 text-blue-800' },
    { ext: 'xls', label: 'Excel', color: 'bg-green-100 text-green-800' },
    { ext: 'xlsx', label: 'Excel', color: 'bg-green-100 text-green-800' },
    { ext: 'jpg', label: 'صورة', color: 'bg-purple-100 text-purple-800' },
    { ext: 'jpeg', label: 'صورة', color: 'bg-purple-100 text-purple-800' },
    { ext: 'png', label: 'صورة', color: 'bg-purple-100 text-purple-800' },
    { ext: 'txt', label: 'نص', color: 'bg-gray-100 text-gray-800' }
  ];

  useEffect(() => {
    if (user) {
      loadAttachments();
    }
  }, [user]);

  const loadAttachments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('attachments')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAttachments(data || []);
    } catch (error) {
      console.error('Error loading attachments:', error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل المرفقات",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAttachment = async () => {
    if (!newAttachment.file_name) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال اسم الملف",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('attachments')
        .insert({
          user_id: user?.id,
          entity_type: newAttachment.entity_type,
          entity_id: newAttachment.entity_id || null,
          file_name: newAttachment.file_name,
          file_type: newAttachment.file_type,
          file_size: parseInt(newAttachment.file_size || '0'),
          file_url: '',
          description: newAttachment.description,
          uploaded_by: user?.email || '',
          is_public: newAttachment.is_public
        });

      if (error) throw error;

      toast({
        title: "تم الإضافة",
        description: "تم إضافة المرفق بنجاح"
      });

      setIsDialogOpen(false);
      setNewAttachment({
        entity_type: 'invoice',
        entity_id: '',
        file_name: '',
        file_type: '',
        file_size: '0',
        description: '',
        is_public: false
      });
      await loadAttachments();
    } catch (error: any) {
      console.error('Error adding attachment:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إضافة المرفق",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المرفق؟')) return;

    try {
      const { error } = await supabase
        .from('attachments')
        .delete()
        .eq('id', attachmentId);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف المرفق بنجاح"
      });

      await loadAttachments();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء حذف المرفق",
        variant: "destructive"
      });
    }
  };

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.includes('image') || ['jpg', 'jpeg', 'png', 'gif'].includes(type)) {
      return <ImageIcon className="h-8 w-8 text-purple-600" />;
    }
    if (type === 'pdf' || type.includes('pdf')) {
      return <FileText className="h-8 w-8 text-red-600" />;
    }
    return <File className="h-8 w-8 text-blue-600" />;
  };

  const getFileTypeBadge = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const typeConfig = fileTypes.find(ft => ft.ext === ext);
    return typeConfig ? (
      <Badge className={typeConfig.color}>
        {typeConfig.label}
      </Badge>
    ) : (
      <Badge variant="secondary">{ext.toUpperCase()}</Badge>
    );
  };

  const getEntityBadge = (entityType: string) => {
    const entity = entityTypes.find(e => e.value === entityType);
    const colors: Record<string, string> = {
      invoice: 'bg-blue-100 text-blue-800',
      customer: 'bg-green-100 text-green-800',
      supplier: 'bg-orange-100 text-orange-800',
      product: 'bg-purple-100 text-purple-800',
      order: 'bg-pink-100 text-pink-800',
      quote: 'bg-cyan-100 text-cyan-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return (
      <Badge className={colors[entityType] || 'bg-gray-100 text-gray-800'}>
        {entity?.label || entityType}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const filteredAttachments = attachments.filter(att => {
    const matchesSearch = att.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         att.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || att.entity_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const groupedAttachments = entityTypes.reduce((acc, entity) => {
    acc[entity.value] = filteredAttachments.filter(a => a.entity_type === entity.value);
    return acc;
  }, {} as Record<string, Attachment[]>);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل المرفقات...</p>
        </div>
      </div>
    );
  }

  const totalSize = attachments.reduce((sum, att) => sum + att.file_size, 0);
  const publicAttachments = attachments.filter(a => a.is_public).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Paperclip className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">إدارة المرفقات</h1>
            <p className="text-sm text-muted-foreground">
              إدارة وتنظيم جميع المرفقات والملفات
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المرفقات</CardTitle>
            <Paperclip className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attachments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">ملف</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">الحجم الكلي</CardTitle>
            <Upload className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(totalSize)}</div>
            <p className="text-xs text-muted-foreground mt-1">إجمالي الحجم</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">المرفقات العامة</CardTitle>
            <Eye className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publicAttachments}</div>
            <p className="text-xs text-muted-foreground mt-1">ملف عام</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">هذا الشهر</CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {attachments.filter(a => {
                const date = new Date(a.created_at);
                const now = new Date();
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
              }).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">ملف جديد</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث في المرفقات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 ml-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الأنواع</SelectItem>
            {entityTypes.map((entity) => (
              <SelectItem key={entity.value} value={entity.value}>
                {entity.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة مرفق
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة مرفق جديد</DialogTitle>
              <DialogDescription>
                قم بإضافة ملف جديد للنظام
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>نوع الكيان</Label>
                <Select
                  value={newAttachment.entity_type}
                  onValueChange={(value) => setNewAttachment({ ...newAttachment, entity_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {entityTypes.map((entity) => (
                      <SelectItem key={entity.value} value={entity.value}>
                        {entity.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>اسم الملف</Label>
                <Input
                  placeholder="مثال: فاتورة_2024.pdf"
                  value={newAttachment.file_name}
                  onChange={(e) => setNewAttachment({ ...newAttachment, file_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>نوع الملف</Label>
                  <Input
                    placeholder="pdf, docx, jpg"
                    value={newAttachment.file_type}
                    onChange={(e) => setNewAttachment({ ...newAttachment, file_type: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>حجم الملف (بايت)</Label>
                  <Input
                    type="number"
                    placeholder="1024000"
                    value={newAttachment.file_size}
                    onChange={(e) => setNewAttachment({ ...newAttachment, file_size: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>الوصف</Label>
                <Input
                  placeholder="وصف المرفق"
                  value={newAttachment.description}
                  onChange={(e) => setNewAttachment({ ...newAttachment, description: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={newAttachment.is_public}
                  onChange={(e) => setNewAttachment({ ...newAttachment, is_public: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_public">مرفق عام (يمكن للجميع الوصول إليه)</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleAddAttachment}>إضافة</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">جميع المرفقات ({filteredAttachments.length})</TabsTrigger>
          {entityTypes.map(entity => (
            <TabsTrigger key={entity.value} value={entity.value}>
              {entity.label} ({groupedAttachments[entity.value].length})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredAttachments.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <Paperclip className="h-16 w-16 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">لا توجد مرفقات</h3>
                    <p className="text-muted-foreground mb-4">
                      ابدأ بإضافة ملفاتك ومرفقاتك
                    </p>
                    <Button onClick={() => setIsDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      إضافة مرفق جديد
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>جميع المرفقات</CardTitle>
                <CardDescription>كل الملفات والمرفقات في النظام</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الملف</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>الكيان</TableHead>
                      <TableHead>الحجم</TableHead>
                      <TableHead>تاريخ الرفع</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttachments.map((attachment) => (
                      <TableRow key={attachment.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {getFileIcon(attachment.file_type)}
                            <div>
                              <div className="font-medium">{attachment.file_name}</div>
                              {attachment.description && (
                                <div className="text-xs text-muted-foreground">{attachment.description}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getFileTypeBadge(attachment.file_name)}</TableCell>
                        <TableCell>{getEntityBadge(attachment.entity_type)}</TableCell>
                        <TableCell>{formatFileSize(attachment.file_size)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(attachment.created_at)}
                        </TableCell>
                        <TableCell>
                          {attachment.is_public ? (
                            <Badge className="bg-green-100 text-green-800">
                              <Eye className="h-3 w-3 mr-1" />
                              عام
                            </Badge>
                          ) : (
                            <Badge variant="secondary">خاص</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" disabled>
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteAttachment(attachment.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {entityTypes.map(entity => (
          <TabsContent key={entity.value} value={entity.value} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>مرفقات {entity.label}</CardTitle>
                <CardDescription>الملفات المرتبطة بـ {entity.label}</CardDescription>
              </CardHeader>
              <CardContent>
                {groupedAttachments[entity.value].length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد مرفقات لـ {entity.label}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الملف</TableHead>
                        <TableHead>النوع</TableHead>
                        <TableHead>الحجم</TableHead>
                        <TableHead>تاريخ الرفع</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedAttachments[entity.value].map((attachment) => (
                        <TableRow key={attachment.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {getFileIcon(attachment.file_type)}
                              <div>
                                <div className="font-medium">{attachment.file_name}</div>
                                {attachment.description && (
                                  <div className="text-xs text-muted-foreground">{attachment.description}</div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getFileTypeBadge(attachment.file_name)}</TableCell>
                          <TableCell>{formatFileSize(attachment.file_size)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(attachment.created_at)}
                          </TableCell>
                          <TableCell>
                            {attachment.is_public ? (
                              <Badge className="bg-green-100 text-green-800">عام</Badge>
                            ) : (
                              <Badge variant="secondary">خاص</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" disabled>
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteAttachment(attachment.id)}
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
          </TabsContent>
        ))}
      </Tabs>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-blue-900 flex items-center gap-2">
              <Paperclip className="h-5 w-5" />
              نصائح لإدارة المرفقات
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>أسماء واضحة:</strong> استخدم أسماء ملفات وصفية وواضحة
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>التنظيم:</strong> ربط المرفقات بالكيانات المناسبة
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>الخصوصية:</strong> حدد المرفقات العامة بحذر
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>المراجعة:</strong> راجع وحذف المرفقات القديمة بانتظام
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Attachments;
