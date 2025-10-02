import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
import { Loader as Loader2, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Customer {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  selling_price: number;
  tax_rate: number;
}

interface InvoiceItem {
  product_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount_rate: number;
  total: number;
}

interface AddSalesInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSalesInvoiceDialog({ open, onOpenChange }: AddSalesInvoiceDialogProps) {
  const [customerId, setCustomerId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers = [] } = useQuery({
    queryKey: ["customers-list"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("customers")
        .select("id, name")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data as Customer[];
    },
    enabled: open,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products-list"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("products")
        .select("id, name, selling_price, tax_rate")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data as Product[];
    },
    enabled: open,
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (invoiceData: {
      invoice_number: string;
      customer_id: string | null;
      invoice_date: string;
      due_date: string | null;
      subtotal: number;
      tax_amount: number;
      discount_amount: number;
      total_amount: number;
      notes: string | null;
      items: InvoiceItem[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("يجب تسجيل الدخول أولاً");

      const { data: invoice, error: invoiceError } = await supabase
        .from("sales_invoices")
        .insert({
          user_id: user.id,
          invoice_number: invoiceData.invoice_number,
          customer_id: invoiceData.customer_id || null,
          invoice_date: invoiceData.invoice_date,
          due_date: invoiceData.due_date || null,
          status: "draft",
          subtotal: invoiceData.subtotal,
          tax_amount: invoiceData.tax_amount,
          discount_amount: invoiceData.discount_amount,
          total_amount: invoiceData.total_amount,
          paid_amount: 0,
          notes: invoiceData.notes || null,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      if (invoiceData.items.length > 0) {
        const itemsToInsert = invoiceData.items.map((item) => ({
          invoice_id: invoice.id,
          product_id: item.product_id || null,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate,
          discount_rate: item.discount_rate,
          total: item.total,
        }));

        const { error: itemsError } = await supabase
          .from("sales_invoice_items")
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-invoices"] });
      toast({
        title: "تم بنجاح",
        description: "تم إنشاء الفاتورة بنجاح",
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `INV-${year}${month}-${random}`;
  };

  const addProduct = () => {
    if (!selectedProductId) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار منتج",
        variant: "destructive",
      });
      return;
    }

    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    const newItem: InvoiceItem = {
      product_id: product.id,
      description: product.name,
      quantity: 1,
      unit_price: product.selling_price,
      tax_rate: product.tax_rate,
      discount_rate: 0,
      total: product.selling_price,
    };

    setItems([...items, newItem]);
    setSelectedProductId("");
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    const item = newItems[index];
    const subtotal = item.quantity * item.unit_price;
    const discountAmount = subtotal * (item.discount_rate / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (item.tax_rate / 100);
    item.total = afterDiscount + taxAmount;

    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => {
      return sum + item.quantity * item.unit_price;
    }, 0);

    const discountAmount = items.reduce((sum, item) => {
      return sum + item.quantity * item.unit_price * (item.discount_rate / 100);
    }, 0);

    const taxAmount = items.reduce((sum, item) => {
      const afterDiscount =
        item.quantity * item.unit_price * (1 - item.discount_rate / 100);
      return sum + afterDiscount * (item.tax_rate / 100);
    }, 0);

    const total = subtotal - discountAmount + taxAmount;

    return { subtotal, discountAmount, taxAmount, total };
  };

  const handleSubmit = () => {
    if (items.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى إضافة منتج واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    const { subtotal, discountAmount, taxAmount, total } = calculateTotals();

    createInvoiceMutation.mutate({
      invoice_number: generateInvoiceNumber(),
      customer_id: customerId || null,
      invoice_date: invoiceDate,
      due_date: dueDate || null,
      subtotal,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      total_amount: total,
      notes: notes || null,
      items,
    });
  };

  const handleClose = () => {
    setCustomerId("");
    setInvoiceDate(new Date().toISOString().split("T")[0]);
    setDueDate("");
    setNotes("");
    setItems([]);
    setSelectedProductId("");
    onOpenChange(false);
  };

  const { subtotal, discountAmount, taxAmount, total } = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إنشاء فاتورة مبيعات جديدة</DialogTitle>
          <DialogDescription>
            أضف تفاصيل الفاتورة والمنتجات المباعة
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer">العميل</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger id="customer">
                  <SelectValue placeholder="اختر عميل (اختياري)" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice-date">تاريخ الفاتورة</Label>
              <Input
                id="invoice-date"
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due-date">تاريخ الاستحقاق (اختياري)</Label>
              <Input
                id="due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <Label>المنتجات</Label>
            <div className="flex gap-2">
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="اختر منتج لإضافته" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - {product.selling_price.toLocaleString()} ر.س
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={addProduct}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {items.length > 0 && (
              <Card className="p-4">
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-4">
                        <Label className="text-xs">المنتج</Label>
                        <Input
                          value={item.description}
                          onChange={(e) =>
                            updateItem(index, "description", e.target.value)
                          }
                          placeholder="اسم المنتج"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">الكمية</Label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(index, "quantity", parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">السعر</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) =>
                            updateItem(index, "unit_price", parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                      <div className="col-span-1">
                        <Label className="text-xs">خصم%</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={item.discount_rate}
                          onChange={(e) =>
                            updateItem(index, "discount_rate", parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">المجموع</Label>
                        <Input
                          value={item.total.toLocaleString()}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">المجموع الفرعي:</span>
              <span className="font-medium">{subtotal.toLocaleString()} ر.س</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">الخصم:</span>
              <span className="font-medium text-green-600">
                -{discountAmount.toLocaleString()} ر.س
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">الضريبة:</span>
              <span className="font-medium">{taxAmount.toLocaleString()} ر.س</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg">
              <span className="font-bold">المجموع الإجمالي:</span>
              <span className="font-bold">{total.toLocaleString()} ر.س</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات (اختياري)</Label>
            <Textarea
              id="notes"
              placeholder="أضف ملاحظات على الفاتورة..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={createInvoiceMutation.isPending}>
            {createInvoiceMutation.isPending && (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            )}
            إنشاء الفاتورة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
