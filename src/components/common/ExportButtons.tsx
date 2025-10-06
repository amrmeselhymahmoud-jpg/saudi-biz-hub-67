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
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // Add custom font for Arabic support (using default for now)
      doc.setFont("helvetica");
      doc.setLanguage("ar");

      // Add title
      doc.setFontSize(20);
      doc.setTextColor(13, 148, 136); // Teal color
      const title = filename || "Finzo Sales Report";
      doc.text(title, doc.internal.pageSize.getWidth() / 2, 15, { align: "center" });

      // Add date and metadata
      doc.setFontSize(10);
      doc.setTextColor(102, 102, 102);
      const currentDate = new Date().toLocaleDateString("ar-SA");
      const currentTime = new Date().toLocaleTimeString("ar-SA");
      doc.text(`Date: ${currentDate}`, 15, 25);
      doc.text(`Time: ${currentTime}`, 15, 30);
      doc.text(`Records: ${data.length}`, 15, 35);

      // Add total amount if provided
      if (totalAmount !== undefined) {
        doc.setFontSize(12);
        doc.setTextColor(13, 148, 136);
        doc.text(`Total Sales: ${totalAmount.toLocaleString()} SAR`, doc.internal.pageSize.getWidth() - 15, 30, { align: "right" });
      }

      // Prepare table data
      const headers = columns.map(col => col.label);
      const tableData = data.map(row =>
        columns.map(col => {
          const value = getNestedValue(row, col.key);
          return formatValue(value);
        })
      );

      // Add table using autoTable
      autoTable(doc, {
        startY: 45,
        head: [headers],
        body: tableData,
        styles: {
          font: "helvetica",
          fontSize: 9,
          cellPadding: 3,
          overflow: "linebreak",
          halign: "left",
        },
        headStyles: {
          fillColor: [13, 148, 136], // Teal
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252], // Light gray
        },
        margin: { top: 45, left: 10, right: 10 },
        theme: "grid",
        tableLineColor: [226, 232, 240],
        tableLineWidth: 0.1,
      });

      // Add footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(102, 102, 102);
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(
          `Finzo Accounting System - Page ${i} of ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      }

      // Save the PDF
      const fileName = `${filename.replace(/\s+/g, '-')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

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
