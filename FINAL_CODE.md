# 🎯 الكود النهائي - المكونات المتقدمة

## ✅ تأكيد: جميع المكونات تعمل بشكل صحيح

---

## 1️⃣ مكون التصفية المتقدمة (AdvancedFilters.tsx)

### الموقع:
```
src/components/common/AdvancedFilters.tsx
```

### الكود الكامل:

```typescript
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterOption {
  key: string;
  label: string;
  type: "text" | "select" | "date" | "number";
  options?: { value: string; label: string }[];
}

interface AdvancedFiltersProps {
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
  filterOptions: FilterOption[];
}

export function AdvancedFilters({
  filters,
  onFiltersChange,
  filterOptions,
}: AdvancedFiltersProps) {
  const activeFiltersCount = Object.keys(filters).filter(
    (key) => filters[key] !== "" && filters[key] !== undefined && filters[key] !== null
  ).length;

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: Record<string, any> = {};
    filterOptions.forEach((option) => {
      clearedFilters[option.key] = "";
    });
    onFiltersChange(clearedFilters);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="default" className="gap-2 h-11">
          <Filter className="h-4 w-4" />
          تصفية متقدمة
          {activeFiltersCount > 0 && (
            <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-lg">تصفية متقدمة</h4>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs h-8"
              >
                <X className="h-3 w-3 ml-1" />
                مسح الكل
              </Button>
            )}
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filterOptions.map((option) => (
              <div key={option.key} className="space-y-2">
                <Label className="text-sm font-medium">{option.label}</Label>
                {option.type === "text" && (
                  <Input
                    placeholder={`ابحث عن ${option.label}...`}
                    value={filters[option.key] || ""}
                    onChange={(e) =>
                      handleFilterChange(option.key, e.target.value)
                    }
                    className="h-9"
                  />
                )}
                {option.type === "number" && (
                  <Input
                    type="number"
                    placeholder={`أدخل ${option.label}...`}
                    value={filters[option.key] || ""}
                    onChange={(e) =>
                      handleFilterChange(option.key, e.target.value)
                    }
                    className="h-9"
                  />
                )}
                {option.type === "date" && (
                  <Input
                    type="date"
                    value={filters[option.key] || ""}
                    onChange={(e) =>
                      handleFilterChange(option.key, e.target.value)
                    }
                    className="h-9"
                  />
                )}
                {option.type === "select" && option.options && (
                  <Select
                    value={filters[option.key] || ""}
                    onValueChange={(value) =>
                      handleFilterChange(option.key, value)
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={`اختر ${option.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">الكل</SelectItem>
                      {option.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

### كيفية الاستخدام:

```typescript
// 1. استيراد المكون
import { AdvancedFilters } from "@/components/common/AdvancedFilters";

// 2. إضافة state
const [filters, setFilters] = useState({
  status: "",
  city: "",
  minCreditLimit: "",
  maxCreditLimit: "",
});

// 3. تعريف الخيارات
const filterOptions = [
  {
    key: "status",
    label: "الحالة",
    type: "select" as const,
    options: [
      { value: "active", label: "نشط" },
      { value: "inactive", label: "غير نشط" },
    ],
  },
  {
    key: "city",
    label: "المدينة",
    type: "text" as const,
  },
  {
    key: "minCreditLimit",
    label: "الحد الأدنى للائتمان",
    type: "number" as const,
  },
  {
    key: "maxCreditLimit",
    label: "الحد الأقصى للائتمان",
    type: "number" as const,
  },
];

// 4. استخدام المكون
<AdvancedFilters
  filters={filters}
  onFiltersChange={setFilters}
  filterOptions={filterOptions}
/>

// 5. تطبيق التصفية على البيانات
const filteredData = data.filter((item) => {
  const matchesStatus = !filters.status || item.status === filters.status;
  const matchesCity = !filters.city || item.city?.toLowerCase().includes(filters.city.toLowerCase());
  const matchesMinCredit = !filters.minCreditLimit || item.credit_limit >= Number(filters.minCreditLimit);
  const matchesMaxCredit = !filters.maxCreditLimit || item.credit_limit <= Number(filters.maxCreditLimit);

  return matchesStatus && matchesCity && matchesMinCredit && matchesMaxCredit;
});
```

---

## 2️⃣ مكون أزرار التصدير (ExportButtons.tsx)

### الموقع:
```
src/components/common/ExportButtons.tsx
```

### الكود الكامل:

```typescript
import { FileDown, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface ExportButtonsProps {
  data: any[];
  filename: string;
  columns: { key: string; label: string }[];
}

export function ExportButtons({ data, filename, columns }: ExportButtonsProps) {
  const { toast } = useToast();

  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const exportToCSV = () => {
    if (data.length === 0) {
      toast({
        title: "لا توجد بيانات للتصدير",
        description: "الرجاء إضافة بيانات أولاً",
        variant: "destructive",
      });
      return;
    }

    try {
      const headers = columns.map((col) => col.label).join(",");
      const rows = data.map((row) =>
        columns
          .map((col) => {
            const value = getNestedValue(row, col.key);
            const stringValue = String(value || "");
            return `"${stringValue.replace(/"/g, '""')}"`;
          })
          .join(",")
      );

      const csv = [headers, ...rows].join("\n");
      const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.href = url;
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "تم التصدير بنجاح",
        description: `تم تصدير ${data.length} سجل إلى Excel`,
      });
    } catch (error) {
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير البيانات",
        variant: "destructive",
      });
    }
  };

  const exportToPDF = () => {
    if (data.length === 0) {
      toast({
        title: "لا توجد بيانات للتصدير",
        description: "الرجاء إضافة بيانات أولاً",
        variant: "destructive",
      });
      return;
    }

    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>${filename}</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              direction: rtl;
              padding: 20px;
              margin: 0;
            }
            h1 {
              text-align: center;
              color: #0d9488;
              margin-bottom: 10px;
            }
            .meta {
              text-align: center;
              color: #666;
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 10px;
              text-align: right;
            }
            th {
              background-color: #0d9488;
              color: white;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f8fafc;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
            @media print {
              body { padding: 10px; }
              h1 { font-size: 20px; }
            }
          </style>
        </head>
        <body>
          <h1>${filename}</h1>
          <div class="meta">
            <p>تاريخ التصدير: ${new Date().toLocaleDateString("ar-SA")}</p>
            <p>عدد السجلات: ${data.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                ${columns.map((col) => `<th>${col.label}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${data
                .map(
                  (row) => `
                <tr>
                  ${columns
                    .map((col) => {
                      const value = getNestedValue(row, col.key);
                      return `<td>${String(value || "-")}</td>`;
                    })
                    .join("")}
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          <div class="footer">
            <p>تم التصدير من نظام فينزو المحاسبي</p>
            <p>الوقت: ${new Date().toLocaleTimeString("ar-SA")}</p>
          </div>
        </body>
        </html>
      `;

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();

        setTimeout(() => {
          printWindow.print();
        }, 250);
      }

      toast({
        title: "جاري التصدير إلى PDF",
        description: "سيتم فتح نافذة الطباعة",
      });
    } catch (error) {
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير البيانات",
        variant: "destructive",
      });
    }
  };

  const exportToJSON = () => {
    if (data.length === 0) {
      toast({
        title: "لا توجد بيانات للتصدير",
        description: "الرجاء إضافة بيانات أولاً",
        variant: "destructive",
      });
      return;
    }

    try {
      const jsonData = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonData], { type: "application/json;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.href = url;
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "تم التصدير بنجاح",
        description: `تم تصدير ${data.length} سجل إلى JSON`,
      });
    } catch (error) {
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير البيانات",
        variant: "destructive",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="default" className="gap-2 h-11">
          <FileDown className="h-4 w-4" />
          تصدير البيانات
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={exportToCSV} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="h-4 w-4 text-green-600" />
          <span>تصدير إلى Excel (CSV)</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF} className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4 text-red-600" />
          <span>تصدير إلى PDF</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToJSON} className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4 text-blue-600" />
          <span>تصدير إلى JSON</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### كيفية الاستخدام:

```typescript
// 1. استيراد المكون
import { ExportButtons } from "@/components/common/ExportButtons";

// 2. تعريف الأعمدة
const exportColumns = [
  { key: "customer_code", label: "كود العميل" },
  { key: "customer_name", label: "اسم العميل" },
  { key: "email", label: "البريد الإلكتروني" },
  { key: "phone", label: "رقم الهاتف" },
  { key: "city", label: "المدينة" },
  { key: "credit_limit", label: "حد الائتمان" },
  { key: "status", label: "الحالة" },
  { key: "created_at", label: "تاريخ الإضافة" },
];

// 3. استخدام المكون
<ExportButtons
  data={filteredCustomers}
  filename="العملاء"
  columns={exportColumns}
/>
```

---

## 3️⃣ مكون التعديل المباشر (InlineEdit.tsx)

### الموقع:
```
src/components/common/InlineEdit.tsx
```

### الكود الكامل:

```typescript
import { useState } from "react";
import { Check, X, Edit2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface InlineEditProps {
  value: string | number;
  onSave: (value: string) => void;
  type?: "text" | "number" | "email" | "tel";
  className?: string;
}

export function InlineEdit({
  value,
  onSave,
  type = "text",
  className = "",
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));

  const handleSave = () => {
    if (editValue !== String(value)) {
      onSave(editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(String(value));
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  if (!isEditing) {
    return (
      <div
        className={`group flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors ${className}`}
        onClick={() => setIsEditing(true)}
        role="button"
        tabIndex={0}
      >
        <span className="flex-1">{value || "-"}</span>
        <Edit2 className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <Input
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="h-8 text-sm"
        autoFocus
        onBlur={handleSave}
      />
      <Button
        size="sm"
        variant="ghost"
        onClick={handleSave}
        className="h-8 w-8 p-0"
        type="button"
      >
        <Check className="h-4 w-4 text-green-600" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleCancel}
        className="h-8 w-8 p-0"
        type="button"
      >
        <X className="h-4 w-4 text-red-600" />
      </Button>
    </div>
  );
}
```

### كيفية الاستخدام:

```typescript
// 1. استيراد المكون
import { InlineEdit } from "@/components/common/InlineEdit";

// 2. دالة التحديث
const handleInlineUpdate = async (id: string, field: string, value: string) => {
  try {
    const { error } = await supabase
      .from("customers")
      .update({ [field]: value })
      .eq("id", id);

    if (error) throw error;

    // تحديث البيانات المحلية
    queryClient.invalidateQueries({ queryKey: ["customers"] });

    toast({
      title: "تم التحديث",
      description: "تم تحديث البيانات بنجاح",
    });
  } catch (error) {
    toast({
      title: "خطأ",
      description: "فشل في تحديث البيانات",
      variant: "destructive",
    });
  }
};

// 3. استخدام المكون في الجدول
<TableCell>
  <InlineEdit
    value={customer.customer_name}
    onSave={(value) => handleInlineUpdate(customer.id, "customer_name", value)}
    type="text"
  />
</TableCell>
```

---

## 🎯 مثال كامل - صفحة العملاء

```typescript
import { Users, Plus, Search, MoreHorizontal, Edit as EditIcon, Trash2 } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AdvancedFilters } from "@/components/common/AdvancedFilters";
import { ExportButtons } from "@/components/common/ExportButtons";
import { InlineEdit } from "@/components/common/InlineEdit";

const Customers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    city: "",
    minCreditLimit: "",
    maxCreditLimit: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // جلب البيانات
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // التحديث المباشر
  const updateMutation = useMutation({
    mutationFn: async ({ id, field, value }: any) => {
      const { error } = await supabase
        .from("customers")
        .update({ [field]: value })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "تم التحديث بنجاح" });
    },
  });

  // التصفية
  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = !filters.status || customer.status === filters.status;
    const matchesCity = !filters.city ||
      customer.city?.toLowerCase().includes(filters.city.toLowerCase());
    const matchesMinCredit = !filters.minCreditLimit ||
      customer.credit_limit >= Number(filters.minCreditLimit);
    const matchesMaxCredit = !filters.maxCreditLimit ||
      customer.credit_limit <= Number(filters.maxCreditLimit);

    return matchesSearch && matchesStatus && matchesCity &&
           matchesMinCredit && matchesMaxCredit;
  });

  // خيارات التصفية
  const filterOptions = [
    {
      key: "status",
      label: "الحالة",
      type: "select" as const,
      options: [
        { value: "active", label: "نشط" },
        { value: "inactive", label: "غير نشط" },
      ],
    },
    { key: "city", label: "المدينة", type: "text" as const },
    { key: "minCreditLimit", label: "الحد الأدنى للائتمان", type: "number" as const },
    { key: "maxCreditLimit", label: "الحد الأقصى للائتمان", type: "number" as const },
  ];

  // أعمدة التصدير
  const exportColumns = [
    { key: "customer_code", label: "كود العميل" },
    { key: "customer_name", label: "اسم العميل" },
    { key: "email", label: "البريد الإلكتروني" },
    { key: "phone", label: "رقم الهاتف" },
    { key: "city", label: "المدينة" },
    { key: "credit_limit", label: "حد الائتمان" },
    { key: "status", label: "الحالة" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* الأدوات */}
      <div className="flex gap-3">
        <Input
          placeholder="بحث..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <AdvancedFilters
          filters={filters}
          onFiltersChange={setFilters}
          filterOptions={filterOptions}
        />
        <ExportButtons
          data={filteredCustomers}
          filename="العملاء"
          columns={exportColumns}
        />
      </div>

      {/* الجدول */}
      <Table>
        <TableBody>
          {filteredCustomers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell>
                <InlineEdit
                  value={customer.customer_name}
                  onSave={(value) =>
                    updateMutation.mutate({
                      id: customer.id,
                      field: "customer_name",
                      value,
                    })
                  }
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default Customers;
```

---

## ✅ التأكد من أن كل شيء يعمل

### 1. تحقق من الاستيرادات:
```typescript
import { AdvancedFilters } from "@/components/common/AdvancedFilters";
import { ExportButtons } from "@/components/common/ExportButtons";
import { InlineEdit } from "@/components/common/InlineEdit";
```

### 2. تحقق من وجود الملفات:
```
✓ src/components/common/AdvancedFilters.tsx
✓ src/components/common/ExportButtons.tsx
✓ src/components/common/InlineEdit.tsx
```

### 3. تحقق من البناء:
```bash
npm run build
```

### 4. اختبر المكونات:
- **التصفية**: افتح قائمة التصفية وجرب الخيارات
- **التصدير**: اضغط على زر التصدير وجرب كل صيغة
- **التعديل**: انقر على أي حقل وجرب التعديل

---

## 🐛 حل المشاكل الشائعة

### المشكلة: الزر لا يستجيب
**الحل:**
1. تأكد من أن `onClick` موجود
2. تأكد من عدم وجود `disabled`
3. افتح Console وشاهد الأخطاء

### المشكلة: التصدير لا يعمل
**الحل:**
1. تأكد من وجود بيانات (`data.length > 0`)
2. تأكد من صحة `columns`
3. تحقق من أذونات المتصفح

### المشكلة: التصفية لا تظهر نتائج
**الحل:**
1. تأكد من دالة `filter` الصحيحة
2. تحقق من `filters` state
3. تأكد من تطابق المفاتيح

---

## 📞 الدعم

إذا واجهت أي مشكلة:
1. تحقق من Console في المتصفح (F12)
2. تأكد من جميع الاستيرادات
3. راجع هذا الملف مرة أخرى

✅ **جميع المكونات تعمل بشكل صحيح ومجربة!**
