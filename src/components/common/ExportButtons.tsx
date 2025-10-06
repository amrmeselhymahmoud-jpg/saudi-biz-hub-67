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
      console.error("Export error:", error);
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
              @page {
                size: A4;
                margin: 15mm;
              }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
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

        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.focus();
            printWindow.print();

            toast({
              title: "تم فتح نافذة الطباعة",
              description: "اختر 'حفظ كـ PDF' من خيارات الطابعة",
            });
          }, 500);
        };
      } else {
        toast({
          title: "تعذر فتح النافذة",
          description: "الرجاء السماح للنوافذ المنبثقة",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Export error:", error);
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
      console.error("Export error:", error);
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
