import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Save, Printer, X, Loader2, Calendar } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { CustomerSelector } from "@/components/sales/CustomerSelector";
import { InvoiceItemsTable, InvoiceItem } from "@/components/sales/InvoiceItemsTable";
import { InvoiceSummary } from "@/components/sales/InvoiceSummary";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Customer {
  id: string;
  customer_name: string;
  phone: string | null;
  email: string | null;
}

interface Product {
  id: string;
  product_name: string;
  selling_price: number;
  tax_rate: number;
}

export default function NewSalesInvoice() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [discount, setDiscount] = useState(0);

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, customer_name, phone, email")
        .order("customer_name");
      if (error) throw error;
      return data as Customer[];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, product_name, selling_price, tax_rate")
        .eq("status", "active")
        .order("product_name");
      if (error) throw error;
      return data as Product[];
    },
  });

  useEffect(() => {
    generateInvoiceNumber();
  }, []);

  useEffect(() => {
    if (items.length === 0) {
      addItem();
    }
  }, [items.length]);

  const generateInvoiceNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    setInvoiceNumber(`INV-${timestamp}-${random}`);
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      product_id: "",
      product_name: "",
      quantity: 1,
      unit_price: 0,
      tax_rate: 15,
      tax_amount: 0,
      total: 0,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (itemId: string) => {
    setItems(items.filter((item) => item.id !== itemId));
  };

  const updateItem = (itemId: string, field: keyof InvoiceItem, value: any) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };

          if (field === "quantity" || field === "unit_price" || field === "tax_rate") {
            const subtotal = updatedItem.quantity * updatedItem.unit_price;
            updatedItem.tax_amount = (subtotal * updatedItem.tax_rate) / 100;
            updatedItem.total = subtotal + updatedItem.tax_amount;
          }

          return updatedItem;
        }
        return item;
      })
    );
  };

  const calculateTotals = () => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );
    const taxAmount = items.reduce((sum, item) => sum + item.tax_amount, 0);
    const total = subtotal + taxAmount - discount;

    return { subtotal, taxAmount, total };
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  const saveInvoiceMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCustomerId) {
        throw new Error("الرجاء اختيار العميل");
      }

      const validItems = items.filter((item) => {
        return item.product_id &&
               item.product_id.trim() !== "" &&
               item.quantity > 0 &&
               item.unit_price > 0;
      });

      console.log("Valid items:", validItems);
      console.log("Total items:", items.length);

      if (validItems.length === 0) {
        throw new Error("الرجاء اختيار منتج واحد على الأقل مع تحديد الكمية والسعر");
      }

      const { data: invoice, error: invoiceError } = await supabase
        .from("sales_invoices")
        .insert({
          invoice_number: invoiceNumber,
          customer_id: selectedCustomerId,
          invoice_date: invoiceDate,
          due_date: dueDate,
          subtotal,
          tax_amount: taxAmount,
          discount,
          total_amount: total,
          payment_method: paymentMethod,
          status: "draft",
          notes,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      const itemsToInsert = validItems.map((item) => ({
        invoice_id: invoice.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        tax_amount: item.tax_amount,
        total: item.total,
      }));

      const { error: itemsError } = await supabase
        .from("sales_invoice_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales_invoices"] });
      toast({
        title: "تم بنجاح",
        description: "تم حفظ الفاتورة بنجاح",
      });
      navigate("/sales-invoices");
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء حفظ الفاتورة",
        variant: "destructive",
      });
    },
  });

  const handlePrint = async () => {
    const validItems = items.filter((item) =>
      item.product_id && item.product_id.trim() !== ""
    );

    if (!selectedCustomer || validItems.length === 0) {
      toast({
        title: "تنبيه",
        description: "الرجاء إضافة العميل واختيار منتج واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    try {
      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.text("Invoice / Fatura", 105, 20, { align: "center" });

      doc.setFontSize(12);
      doc.text(`Invoice Number: ${invoiceNumber}`, 20, 40);
      doc.text(`Date: ${invoiceDate}`, 20, 48);
      doc.text(`Customer: ${selectedCustomer.customer_name}`, 20, 56);

      const tableData = validItems.map((item) => [
        item.product_name,
        item.quantity.toString(),
        item.unit_price.toFixed(2),
        `${item.tax_rate}%`,
        item.tax_amount.toFixed(2),
        item.total.toFixed(2),
      ]);

      autoTable(doc, {
        startY: 70,
        head: [["Product", "Qty", "Price", "Tax %", "Tax Amount", "Total"]],
        body: tableData,
        styles: {
          halign: "center",
          fontSize: 10,
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: "bold",
        },
      });

      const finalY = (doc as any).lastAutoTable.finalY + 10;

      doc.setFontSize(12);
      doc.text(`Subtotal: ${subtotal.toFixed(2)} SAR`, 20, finalY);
      doc.text(`Tax Amount: ${taxAmount.toFixed(2)} SAR`, 20, finalY + 8);
      if (discount > 0) {
        doc.text(`Discount: ${discount.toFixed(2)} SAR`, 20, finalY + 16);
      }
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`Total: ${total.toFixed(2)} SAR`, 20, finalY + (discount > 0 ? 24 : 16));

      doc.save(`invoice-${invoiceNumber}.pdf`);

      toast({
        title: "تم بنجاح",
        description: "تم تصدير الفاتورة بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تصدير الفاتورة",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 md:h-8 md:w-8" />
            فاتورة مبيعات جديدة
          </h1>
          <p className="text-muted-foreground mt-1">
            إنشاء فاتورة مبيعات جديدة للعملاء
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/sales-invoices")}>
            <X className="ml-2 h-4 w-4" />
            إلغاء
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="ml-2 h-4 w-4" />
            طباعة
          </Button>
          <Button
            onClick={() => saveInvoiceMutation.mutate()}
            disabled={saveInvoiceMutation.isPending}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            {saveInvoiceMutation.isPending ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="ml-2 h-4 w-4" />
                حفظ الفاتورة
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>بيانات الفاتورة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-right block">
                    رقم الفاتورة <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={invoiceNumber}
                    readOnly
                    className="text-right bg-muted font-mono"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-right block">
                    تاريخ الفاتورة <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="text-right"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-right block">تاريخ الاستحقاق</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="text-right"
                    dir="rtl"
                  />
                </div>
              </div>

              <Separator />

              <CustomerSelector
                customers={customers}
                selectedCustomerId={selectedCustomerId}
                onSelectCustomer={(id, customer) => {
                  setSelectedCustomerId(id);
                  setSelectedCustomer(customer);
                }}
              />

              <Separator />

              <div className="space-y-2">
                <Label className="text-right block">طريقة الدفع</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="text-right" dir="rtl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="cash">نقداً</SelectItem>
                    <SelectItem value="transfer">تحويل بنكي</SelectItem>
                    <SelectItem value="card">بطاقة</SelectItem>
                    <SelectItem value="credit">آجل</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-right block">ملاحظات</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أدخل أي ملاحظات إضافية..."
                  rows={3}
                  className="text-right resize-none"
                  dir="rtl"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <InvoiceItemsTable
                items={items}
                products={products}
                onAddItem={addItem}
                onRemoveItem={removeItem}
                onUpdateItem={updateItem}
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <InvoiceSummary
            subtotal={subtotal}
            taxAmount={taxAmount}
            discount={discount}
            total={total}
            onDiscountChange={setDiscount}
          />
        </div>
      </div>
    </div>
  );
}
