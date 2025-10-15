import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface InvoiceSummaryProps {
  subtotal: number;
  taxAmount: number;
  discount: number;
  total: number;
  onDiscountChange: (value: number) => void;
}

export function InvoiceSummary({
  subtotal,
  taxAmount,
  discount,
  total,
  onDiscountChange,
}: InvoiceSummaryProps) {
  return (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
      <CardHeader>
        <CardTitle className="text-right text-xl">ملخص الفاتورة</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4" dir="rtl">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">الإجمالي قبل الضريبة:</span>
          <span className="font-semibold text-lg">{subtotal.toFixed(2)} ر.س</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">قيمة الضريبة:</span>
          <span className="font-semibold text-lg text-blue-600">
            {taxAmount.toFixed(2)} ر.س
          </span>
        </div>

        <Separator />

        <div className="flex justify-between items-center">
          <span className="font-medium">المجموع الكلي:</span>
          <span className="font-bold text-xl text-green-600">
            {(subtotal + taxAmount).toFixed(2)} ر.س
          </span>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-right block">الخصم (ر.س)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={discount}
            onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            className="text-right text-lg"
            dir="rtl"
          />
        </div>

        {discount > 0 && (
          <>
            <Separator />
            <div className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
              <span className="font-bold text-lg">المبلغ المستحق:</span>
              <span className="font-bold text-2xl text-purple-600">
                {total.toFixed(2)} ر.س
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
