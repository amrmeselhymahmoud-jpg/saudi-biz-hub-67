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

interface AddQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount_rate: number;
  total: number;
}

export function AddQuoteDialog({ open, onOpenChange }: AddQuoteDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    quote_number: `Q-${Date.now()}`,
    customer_id: "",
    quote_date: new Date().toISOString().split("T")[0],
    expiry_date: "",
    notes: "",
  });

  const [items, setItems] = useState<QuoteItem[]>([
    {
      id: crypto.randomUUID(),
      description: "",
      quantity: 1,
      unit_price: 0,
      tax_rate: 15,
      discount_rate: 0,
      total: 0,
    },
  ]);

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, customer_name, customer_code")
        .order("customer_name");

      if (error) throw error;
      return data;
    },
  });

  const calculateItemTotal = (item: QuoteItem) => {
    const subtotal = item.quantity * item.unit_price;
    const discountAmount = subtotal * (item.discount_rate / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (item.tax_rate / 100);
    return afterDiscount + taxAmount;
  };

  const updateItemTotal = (index: number, updatedItem: Partial<QuoteItem>) => {
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
        description: "",
        quantity: 1,
        unit_price: 0,
        tax_rate: 15,
        discount_rate: 0,
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
    const discount_amount = items.reduce(
      (sum, item) =>
        sum + item.quantity * item.unit_price * (item.discount_rate / 100),
      0
    );
    const afterDiscount = subtotal - discount_amount;
    const tax_amount = items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unit_price;
      const itemDiscount = itemSubtotal * (item.discount_rate / 100);
      const itemAfterDiscount = itemSubtotal - itemDiscount;
      return sum + itemAfterDiscount * (item.tax_rate / 100);
    }, 0);
    const total_amount = afterDiscount + tax_amount;

    return { subtotal, tax_amount, discount_amount, total_amount };
  };

  const createQuoteMutation = useMutation({
    mutationFn: async () => {
      const totals = calculateTotals();

      const quoteData: any = {
        quote_number: formData.quote_number,
        customer_id: formData.customer_id || null,
        quote_date: formData.quote_date,
        expiry_date: formData.expiry_date || null,
        notes: formData.notes || null,
        status: 'draft',
        ...totals,
      };

      if (user?.id) {
        quoteData.created_by = user.id;
      }

      const { data: quote, error: quoteError } = await supabase
        .from("quotes")
        .insert(quoteData)
        .select()
        .single();

      if (quoteError) {
        console.error("Error creating quote:", quoteError);
        throw quoteError;
      }

      const itemsToInsert = items.map((item) => ({
        quote_id: quote.id,
        product_id: null,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        discount_rate: item.discount_rate,
        discount: (item.quantity * item.unit_price * item.discount_rate) / 100,
        tax_amount: ((item.quantity * item.unit_price - (item.quantity * item.unit_price * item.discount_rate / 100)) * item.tax_rate) / 100,
        total: item.total,
      }));

      const { error: itemsError } = await supabase
        .from("quote_items")
        .insert(itemsToInsert);

      if (itemsError) {
        console.error("Error creating quote items:", itemsError);
        throw itemsError;
      }

      return quote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast({
        title: "تم بنجاح",
        description: "تم إنشاء عرض السعر بنجاح",
      });
      onOpenChange(false);
      setFormData({
        quote_number: `Q-${Date.now()}`,
        customer_id: "",
        quote_date: new Date().toISOString().split("T")[0],
        expiry_date: "",
        notes: "",
      });
      setItems([
        {
          id: crypto.randomUUID(),
          description: "",
          quantity: 1,
          unit_price: 0,
          tax_rate: 15,
          discount_rate: 0,
          total: 0,
        },
      ]);
    },
    onError: (error: Error) => {
      console.error("Mutation error:", error);
      toast({
        title: "خطأ في إنشاء عرض السعر",
        description: error.message || "حدث خطأ أثناء إنشاء عرض السعر",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.quote_number) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رقم عرض السعر",
        variant: "destructive",
      });
      return;
    }

    if (items.some((item) => !item.description)) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال وصف لجميع البنود",
        variant: "destructive",
      });
      return;
    }

    createQuoteMutation.mutate();
  };

  const totals = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">إنشاء عرض سعر جديد</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quote_number">رقم عرض السعر *</Label>
              <Input
                id="quote_number"
                value={formData.quote_number}
                onChange={(e) =>
                  setFormData({ ...formData, quote_number: e.target.value })
                }
                placeholder="Q-001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_id">العميل</Label>
              <Select
                value={formData.customer_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, customer_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر عميل" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.customer_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quote_date">تاريخ العرض *</Label>
              <Input
                id="quote_date"
                type="date"
                value={formData.quote_date}
                onChange={(e) =>
                  setFormData({ ...formData, quote_date: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry_date">تاريخ الانتهاء</Label>
              <Input
                id="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) =>
                  setFormData({ ...formData, expiry_date: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">بنود العرض</Label>
              <Button type="button" onClick={addItem} size="sm" variant="outline">
                <Plus className="h-4 w-4 ml-2" />
                إضافة بند
              </Button>
            </div>

            {items.map((item, index) => (
              <Card key={item.id} className="p-4 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-3 space-y-2">
                      <Label>الوصف *</Label>
                      <Input
                        value={item.description}
                        onChange={(e) =>
                          updateItemTotal(index, { description: e.target.value })
                        }
                        placeholder="وصف المنتج أو الخدمة"
                        required
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
                      <Label>نسبة الخصم (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={item.discount_rate}
                        onChange={(e) =>
                          updateItemTotal(index, {
                            discount_rate: parseFloat(e.target.value) || 0,
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

          <Card className="p-4 bg-gradient-to-br from-gray-50 to-blue-50/30">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">المجموع الفرعي:</span>
                <span className="font-medium">{totals.subtotal.toFixed(2)} ر.س</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">الخصم:</span>
                <span className="font-medium text-red-600">
                  -{totals.discount_amount.toFixed(2)} ر.س
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">الضريبة:</span>
                <span className="font-medium">{totals.tax_amount.toFixed(2)} ر.س</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>المجموع الإجمالي:</span>
                <span className="text-cyan-600">
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
              disabled={createQuoteMutation.isPending}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={createQuoteMutation.isPending}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
            >
              {createQuoteMutation.isPending && (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              )}
              حفظ عرض السعر
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
