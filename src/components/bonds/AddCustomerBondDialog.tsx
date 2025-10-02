import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

interface AddCustomerBondDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface BondFormData {
  bond_number: string;
  customer_id: string;
  bond_type: 'receipt' | 'payment';
  bond_date: string;
  amount: string;
  payment_method: 'cash' | 'bank_transfer' | 'check' | 'card';
  reference_number?: string;
  bank_name?: string;
  notes?: string;
  status: 'draft' | 'posted';
}

export function AddCustomerBondDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddCustomerBondDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { session } = useAuth();

  const { data: customers = [] } = useQuery({
    queryKey: ['customers-for-bonds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, customer_code, customer_name')
        .eq('status', 'active')
        .order('customer_name');

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const form = useForm<BondFormData>({
    defaultValues: {
      bond_number: `CB-${Date.now()}`,
      bond_date: new Date().toISOString().split('T')[0],
      bond_type: 'receipt',
      payment_method: 'cash',
      status: 'draft',
      amount: '',
    },
  });

  const watchPaymentMethod = form.watch('payment_method');

  const onSubmit = async (data: BondFormData) => {
    if (!session?.user?.id) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('customer_bonds').insert({
        bond_number: data.bond_number,
        customer_id: data.customer_id,
        bond_type: data.bond_type,
        bond_date: data.bond_date,
        amount: parseFloat(data.amount),
        payment_method: data.payment_method,
        reference_number: data.reference_number || null,
        bank_name: data.bank_name || null,
        notes: data.notes || null,
        status: data.status,
        created_by: session.user.id,
      });

      if (error) throw error;

      toast.success('تم إضافة السند بنجاح');
      form.reset();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء إضافة السند');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إضافة سند جديد</DialogTitle>
          <DialogDescription>
            أدخل بيانات سند القبض أو الصرف
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bond_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم السند</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="CB-001" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bond_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>التاريخ</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>العميل</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر العميل" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.customer_name} ({customer.customer_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bond_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع السند</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع السند" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="receipt">سند قبض</SelectItem>
                        <SelectItem value="payment">سند صرف</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المبلغ</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...field}
                        placeholder="0.00"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>طريقة الدفع</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر طريقة الدفع" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">نقدي</SelectItem>
                        <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                        <SelectItem value="check">شيك</SelectItem>
                        <SelectItem value="card">بطاقة</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(watchPaymentMethod === 'check' || watchPaymentMethod === 'bank_transfer') && (
                <>
                  <FormField
                    control={form.control}
                    name="reference_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {watchPaymentMethod === 'check' ? 'رقم الشيك' : 'رقم المرجع'}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="رقم المرجع" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bank_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم البنك</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="اسم البنك" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الحالة</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الحالة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">مسودة</SelectItem>
                        <SelectItem value="posted">مرحل</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="ملاحظات إضافية..."
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
