import { FileDown, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

interface ExportButtonsProps {
  data: any[];
  filename: string;
  columns: { key: string; label: string }[];
  totalAmount?: number;
}

export function ExportButtons({ data, filename, columns, totalAmount }: ExportButtonsProps) {
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

  const hasArabicText = (text: string): boolean => {
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return arabicRegex.test(text);
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

  const exportToPDF = async () => {
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
        title: "جاري إنشاء PDF",
        description: "الرجاء الانتظار...",
      });

      // Create a temporary container for the content
      const container = document.createElement('div');
      container.style.cssText = `
        position: absolute;
        left: -9999px;
        width: 1000px;
        padding: 40px;
        background: white;
        font-family: 'Cairo', 'Segoe UI', 'Tahoma', Arial, sans-serif;
      `;

      // Build HTML content with proper RTL support
      const currentDate = new Date().toLocaleDateString("ar-SA");
      const currentTime = new Date().toLocaleTimeString("ar-SA");

      const hasArabicContent = columns.some(col => hasArabicText(col.label)) ||
                               data.some(row => columns.some(col => hasArabicText(String(getNestedValue(row, col.key) || ''))));

      container.innerHTML = `
        <div style="direction: ${hasArabicContent ? 'rtl' : 'ltr'}; text-align: ${hasArabicContent ? 'right' : 'left'};">
          <!-- Header Section -->
          <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #0D9488;">
            <h1 style="color: #0D9488; font-size: 32px; margin: 0 0 15px 0; font-weight: bold;">
              ${filename}
            </h1>
            ${filename !== 'Finzo Sales Report' ? '<h2 style="color: #0D9488; font-size: 24px; margin: 10px 0;">Finzo Sales Report</h2>' : ''}
            <div style="color: #666; font-size: 14px; margin-top: 15px; line-height: 1.8;">
              <div style="display: flex; justify-content: space-between; max-width: 800px; margin: 0 auto;">
                <div style="text-align: ${hasArabicContent ? 'right' : 'left'};">
                  <strong>التاريخ:</strong> ${currentDate}<br>
                  <strong>الوقت:</strong> ${currentTime}<br>
                  <strong>عدد السجلات:</strong> ${data.length}
                </div>
                ${totalAmount !== undefined ? `
                  <div style="text-align: left; background: #F0FDFA; padding: 15px; border-radius: 8px; border: 2px solid #0D9488;">
                    <strong style="color: #0D9488; font-size: 18px;">إجمالي المبيعات</strong><br>
                    <span style="font-size: 24px; font-weight: bold; color: #0D9488;">${totalAmount.toLocaleString()} SAR</span>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>

          <!-- Table Section -->
          <table style="
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            direction: ${hasArabicContent ? 'rtl' : 'ltr'};
          ">
            <thead>
              <tr style="background: #0D9488; color: white;">
                ${columns.map(col => `
                  <th style="
                    padding: 14px 12px;
                    text-align: ${hasArabicText(col.label) ? 'right' : 'center'};
                    font-weight: bold;
                    border: 1px solid #0A7B6F;
                    font-size: 14px;
                    white-space: nowrap;
                  ">${col.label}</th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map((row, index) => `
                <tr style="background: ${index % 2 === 0 ? 'white' : '#F8FAFC'};">
                  ${columns.map(col => {
                    const value = getNestedValue(row, col.key);
                    const formattedValue = formatValue(value);
                    const isArabic = hasArabicText(formattedValue);
                    const isNumber = !isNaN(Number(formattedValue)) && formattedValue !== '-';

                    return `
                      <td style="
                        padding: 12px;
                        text-align: ${isArabic ? 'right' : isNumber ? 'center' : 'left'};
                        border: 1px solid #E2E8F0;
                        font-size: 13px;
                        direction: ${isArabic ? 'rtl' : 'ltr'};
                        unicode-bidi: ${isArabic ? 'embed' : 'normal'};
                      ">${formattedValue}</td>
                    `;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Footer Section -->
          <div style="
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #E2E8F0;
            text-align: center;
            color: #666;
            font-size: 12px;
          ">
            <p style="margin: 5px 0; font-weight: bold; color: #0D9488; font-size: 14px;">
              ⭐ نظام فينزو المحاسبي - Finzo Accounting System
            </p>
            <p style="margin: 5px 0;">
              تم إنشاء هذا التقرير تلقائياً في ${currentDate} - ${currentTime}
            </p>
            <p style="margin: 5px 0;">
              © ${new Date().getFullYear()} - جميع الحقوق محفوظة - All Rights Reserved
            </p>
          </div>
        </div>
      `;

      document.body.appendChild(container);

      // Wait for fonts to load
      await document.fonts.ready;

      // Capture the content with html2canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      // Remove the temporary container
      document.body.removeChild(container);

      // Create PDF with the canvas
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
      const imgX = (pageWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      // Add page numbers if content spans multiple pages
      const totalPages = Math.ceil((imgHeight * ratio) / (pageHeight - 20));
      if (totalPages > 1) {
        for (let i = 1; i <= totalPages; i++) {
          if (i > 1) {
            pdf.addPage();
            const yOffset = -(i - 1) * (pageHeight - 20);
            pdf.addImage(imgData, 'PNG', imgX, imgY + yOffset, imgWidth * ratio, imgHeight * ratio);
          }
          pdf.setPage(i);
          pdf.setFontSize(8);
          pdf.setTextColor(102, 102, 102);
          pdf.text(
            `Page ${i} of ${totalPages}`,
            pageWidth / 2,
            pageHeight - 5,
            { align: 'center' }
          );
        }
      }

      // Save the PDF
      const fileName = `${filename.replace(/\s+/g, '-')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      toast({
        title: "تم التصدير بنجاح",
        description: `تم تصدير ${data.length} سجل إلى PDF`,
      });
    } catch (error) {
      console.error("PDF Export error:", error);
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
