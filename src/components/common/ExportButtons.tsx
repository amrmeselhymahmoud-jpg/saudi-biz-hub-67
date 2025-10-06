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

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "object") {
      if (value instanceof Date) return value.toLocaleDateString("ar-SA");
      return JSON.stringify(value);
    }
    return String(value);
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
            const stringValue = formatValue(value);
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
      toast({
        title: "جاري التحضير للتصدير",
        description: "يرجى الانتظار...",
      });

      const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${filename}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Arial', 'Helvetica', sans-serif;
              direction: rtl;
              padding: 20px;
              background: white;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #0d9488;
              padding-bottom: 20px;
            }
            h1 {
              color: #0d9488;
              font-size: 28px;
              margin-bottom: 15px;
              font-weight: bold;
            }
            .meta {
              color: #666;
              font-size: 14px;
              line-height: 1.6;
            }
            .meta p {
              margin: 5px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              font-size: 13px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            th {
              background-color: #0d9488;
              color: white;
              padding: 12px 8px;
              text-align: right;
              font-weight: bold;
              border: 1px solid #0a7b6f;
              white-space: nowrap;
            }
            td {
              padding: 10px 8px;
              text-align: right;
              border: 1px solid #e2e8f0;
              background-color: white;
            }
            tr:nth-child(even) td {
              background-color: #f8fafc;
            }
            tr:hover td {
              background-color: #f0fdfa;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e2e8f0;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
            .footer p {
              margin: 5px 0;
            }
            .logo {
              font-weight: bold;
              color: #0d9488;
            }

            @media print {
              body {
                padding: 10mm;
              }
              h1 {
                font-size: 22px;
              }
              table {
                font-size: 11px;
              }
              th, td {
                padding: 8px 6px;
              }
              @page {
                size: A4 landscape;
                margin: 10mm;
              }
              table {
                page-break-inside: auto;
              }
              tr {
                page-break-inside: avoid;
                page-break-after: auto;
              }
              thead {
                display: table-header-group;
              }
              tfoot {
                display: table-footer-group;
              }
              .no-print {
                display: none;
              }
            }

            @media screen {
              .print-button {
                position: fixed;
                top: 20px;
                left: 20px;
                background: #0d9488;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                z-index: 1000;
              }
              .print-button:hover {
                background: #0a7b6f;
              }
            }
          </style>
        </head>
        <body>
          <button class="print-button no-print" onclick="window.print()">
            طباعة / حفظ PDF
          </button>

          <div class="header">
            <h1>${filename}</h1>
            <div class="meta">
              <p><strong>تاريخ التصدير:</strong> ${new Date().toLocaleDateString("ar-SA")}</p>
              <p><strong>عدد السجلات:</strong> ${data.length}</p>
              <p><strong>الوقت:</strong> ${new Date().toLocaleTimeString("ar-SA")}</p>
            </div>
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
                      const formattedValue = formatValue(value);
                      return `<td>${formattedValue}</td>`;
                    })
                    .join("")}
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <div class="footer">
            <p class="logo">⭐ نظام فينزو المحاسبي</p>
            <p>تم إنشاء هذا التقرير تلقائياً من نظام فينزو لإدارة الحسابات</p>
            <p>&copy; ${new Date().getFullYear()} - جميع الحقوق محفوظة</p>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
        </html>
      `;

      setTimeout(() => {
        const printWindow = window.open("", "_blank", "width=1200,height=800");

        if (printWindow) {
          printWindow.document.open();
          printWindow.document.write(htmlContent);
          printWindow.document.close();

          printWindow.focus();

          setTimeout(() => {
            toast({
              title: "تم فتح نافذة الطباعة",
              description: "اختر 'حفظ كـ PDF' من خيارات الطابعة",
            });
          }, 1000);
        } else {
          toast({
            title: "تعذر فتح النافذة",
            description: "الرجاء السماح للنوافذ المنبثقة في المتصفح",
            variant: "destructive",
          });
        }
      }, 300);
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير البيانات إلى PDF",
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
