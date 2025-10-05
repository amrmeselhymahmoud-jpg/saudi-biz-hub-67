import { useState } from "react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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

interface AddPurchaseInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface InvoiceItem {
  id: string;
  product_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  total: number;
}

export function AddPurchaseInvoiceDialog({ open, onOpenChange }: AddPurchaseInvoiceDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    invoice_number: `PI-${Date.now()}`,
    supplier_id: "",
    invoice_date: new Date().toISOString().split("T")[0],
    due_date: "",
    discount_amount: "0",
    notes: "",
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: crypto.randomUUID(),
      product_name: "",
      description: "",
      quantity: 1,
      unit_price: 0,
      tax_rate: 15,
      total: 0,
    },
  ]);

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("id, supplier_name, supplier_code")
        .eq("status", "active")
        .order("supplier_name");

      if (error) throw error;
      return data;
    },
  });

  const calculateItemTotal = (item: InvoiceItem) => {
    const subtotal = item.quantity * item.unit_price;
    const taxAmount = subtotal * (item.tax_rate / 100);
    return subtotal + taxAmount;
  };

  const updateItemTotal = (index: number, updatedItem: Partial<InvoiceItem>) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updatedItem };
    newItems[index].total = calculateItemTotal(newItems[index]);
    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        product_name: "",
        description: "",
        quantity: 1,
        unit_price: 0,
        tax_rate: 15,
        total: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );
    const tax_amount = items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unit_price;
      return sum + itemSubtotal * (item.tax_rate / 100);
    }, 0);
    const discount_amount = parseFloat(formData.discount_amount) || 0;
    const total_amount = subtotal + tax_amount - discount_amount;

    return { subtotal, tax_amount, discount_amount, total_amount };
  };

  const createInvoiceMutation = useMutation({
    mutationFn: async () => {
      const totals = calculateTotals();

      const invoiceData: any = {
        invoice_number: formData.invoice_number,
        supplier_id: formData.supplier_id || null,
        invoice_date: formData.invoice_date,
        due_date: formData.due_date || null,
        notes: formData.notes || null,
        status: "pending",
        payment_status: "unpaid",
        paid_amount: 0,
        ...totals,
      };

      if (user?.id) {
        invoiceData.created_by = user.id;
      }

      const { data: invoice, error: invoiceError } = await supabase
        .from("purchase_invoices")
        .insert(invoiceData)
        .select()
        .single();

      if (invoiceError) {
        console.error("Error creating invoice:", invoiceError);
        throw invoiceError;
      }

      const itemsToInsert = items.map((item) => {
        const itemSubtotal = item.quantity * item.unit_price;
        const tax_amount = itemSubtotal * (item.tax_rate / 100);

        return {
          invoice_id: invoice.id,
          product_name: item.product_name,
          description: item.description || null,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate,
          tax_amount: tax_amount,
          discount_rate: 0,
          discount_amount: 0,
          total: item.total,
        };
      });

      const { error: itemsError } = await supabase
        .from("purchase_invoice_items")
        .insert(itemsToInsert);

      if (itemsError) {
        console.error("Error creating invoice items:", itemsError);
        throw itemsError;
      }

      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase_invoices"] });
      toast({
        title: "تم بنجاح",
        description: "تم إنشاء فاتورة المشتريات بنجاح",
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      console.error("Mutation error:", error);
      toast({
        title: "خطأ في إنشاء الفاتورة",
        description: error.message || "حدث خطأ أثناء إنشاء الفاتورة",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.supplier_id) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار المورد",
        variant: "destructive",
      });
      return;
    }

    if (items.some((item) => !item.product_name || item.quantity <= 0)) {
      toast({
        title: "خطأ",
        description: "يرجى إكمال بيانات جميع البنود",
        variant: "destructive",
      });
      return;
    }

    createInvoiceMutation.mutate();
  };

  const resetForm = () => {
    setFormData({
      invoice_number: `PI-${Date.now()}`,
      supplier_id: "",
      invoice_date: new Date().toISOString().split("T")[0],
      due_date: "",
      discount_amount: "0",
      notes: "",
    });
    setItems([
      {
        id: crypto.randomUUID(),
        product_name: "",
        description: "",
        quantity: 1,
        unit_price: 0,
        tax_rate: 15,
        total: 0,
      },
    ]);
  };

  const totals = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">فاتورة مشتريات جديدة</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_number">رقم الفاتورة *</Label>
              <Input
                id="invoice_number"
                value={formData.invoice_number}
                onChange={(e) =>
                  setFormData({ ...formData, invoice_number: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier_id">المورد *</Label>
              <Select
                value={formData.supplier_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, supplier_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المورد" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.supplier_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice_date">تاريخ الفاتورة *</Label>
              <Input
                id="invoice_date"
                type="date"
                value={formData.invoice_date}
                onChange={(e) =>
                  setFormData({ ...formData, invoice_date: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">تاريخ الاستحقاق</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) =>
                  setFormData({ ...formData, due_date: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount_amount">الخصم (ر.س)</Label>
              <Input
                id="discount_amount"
                type="number"
                step="0.01"
                value={formData.discount_amount}
                onChange={(e) =>
                  setFormData({ ...formData, discount_amount: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">بنود الفاتورة</Label>
              <Button type="button" onClick={addItem} size="sm" variant="outline">
                <Plus className="h-4 w-4 ml-2" />
                إضافة بند
              </Button>
            </div>

            {items.map((item, index) => (
              <Card key={item.id} className="p-4 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>اسم المنتج *</Label>
                      <Input
                        value={item.product_name}
                        onChange={(e) =>
                          updateItemTotal(index, { product_name: e.target.value })
                        }
                        placeholder="اسم المنتج"
                        required
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label>الوصف</Label>
                      <Input
                        value={item.description}
                        onChange={(e) =>
                          updateItemTotal(index, { description: e.target.value })
                        }
                        placeholder="وصف إضافي"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>الكمية</Label>
                      <Input
                        type="number"
                        min="1"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItemTotal(index, {
                            quantity: parseFloat(e.target.value) || 0,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>سعر الوحدة</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) =>
                          updateItemTotal(index, {
                            unit_price: parseFloat(e.target.value) || 0,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>نسبة الضريبة (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={item.tax_rate}
                        onChange={(e) =>
                          updateItemTotal(index, {
                            tax_rate: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>المجموع</Label>
                      <Input
                        type="text"
                        value={`${item.total.toFixed(2)} ر.س`}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  </div>

                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-4 bg-gradient-to-br from-gray-50 to-orange-50/30">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">المجموع الفرعي:</span>
                <span className="font-medium">{totals.subtotal.toFixed(2)} ر.س</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">الضريبة:</span>
                <span className="font-medium">{totals.tax_amount.toFixed(2)} ر.س</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">الخصم:</span>
                <span className="font-medium text-red-600">
                  -{totals.discount_amount.toFixed(2)} ر.س
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>المجموع الإجمالي:</span>
                <span className="text-orange-600">
                  {totals.total_amount.toFixed(2)} ر.س
                </span>
              </div>
            </div>
          </Card>

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="أي ملاحظات إضافية..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createInvoiceMutation.isPending}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={createInvoiceMutation.isPending}
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
            >
              {createInvoiceMutation.isPending && (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              )}
              حفظ الفاتورة
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
