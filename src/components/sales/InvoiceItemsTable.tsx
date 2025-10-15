import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface InvoiceItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
}

interface Product {
  id: string;
  product_name: string;
  selling_price: number;
  tax_rate: number;
}

interface InvoiceItemsTableProps {
  items: InvoiceItem[];
  products: Product[];
  onAddItem: () => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateItem: (itemId: string, field: keyof InvoiceItem, value: any) => void;
}

export function InvoiceItemsTable({
  items,
  products,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
}: InvoiceItemsTableProps) {
  const handleProductSelect = (itemId: string, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const currentItem = items.find((i) => i.id === itemId);
    const quantity = currentItem?.quantity || 1;
    const taxRate = product.tax_rate || 15;

    onUpdateItem(itemId, "product_id", productId);
    onUpdateItem(itemId, "product_name", product.product_name);
    onUpdateItem(itemId, "unit_price", product.selling_price);
    onUpdateItem(itemId, "tax_rate", taxRate);

    const subtotal = quantity * product.selling_price;
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    onUpdateItem(itemId, "tax_amount", taxAmount);
    onUpdateItem(itemId, "total", total);

    console.log(`✅ Product selected: ${product.product_name}`);
    console.log(`📊 Values - Quantity: ${quantity}, Price: ${product.selling_price}, Tax: ${taxRate}%`);
    console.log(`💰 Calculated - Subtotal: ${subtotal.toFixed(2)}, Tax: ${taxAmount.toFixed(2)}, Total: ${total.toFixed(2)}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">تفاصيل المنتجات</h3>
        <Button onClick={onAddItem} size="sm" variant="outline">
          <Plus className="ml-2 h-4 w-4" />
          إضافة منتج
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right w-[30%]">المنتج</TableHead>
                <TableHead className="text-right w-[12%]">الكمية</TableHead>
                <TableHead className="text-right w-[15%]">السعر</TableHead>
                <TableHead className="text-right w-[12%]">الضريبة %</TableHead>
                <TableHead className="text-right w-[15%]">قيمة الضريبة</TableHead>
                <TableHead className="text-right w-[15%]">الإجمالي</TableHead>
                <TableHead className="text-center w-[8%]">إجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    لا توجد منتجات. اضغط "إضافة منتج" للبدء
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Select
                        value={item.product_id || undefined}
                        onValueChange={(value) => handleProductSelect(item.id, value)}
                      >
                        <SelectTrigger className="text-right" dir="rtl">
                          <SelectValue placeholder="اختر منتج" />
                        </SelectTrigger>
                        <SelectContent dir="rtl" className="max-h-[300px]">
                          {products.length === 0 ? (
                            <div className="p-2 text-center text-sm text-muted-foreground">
                              لا توجد منتجات نشطة
                            </div>
                          ) : (
                            products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.product_name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity || 1}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          onUpdateItem(item.id, "quantity", val > 0 ? val : 1);
                        }}
                        className="text-center w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unit_price || 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          onUpdateItem(item.id, "unit_price", val >= 0 ? val : 0);
                        }}
                        className="text-right w-24"
                        dir="rtl"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={item.tax_rate || 15}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          onUpdateItem(item.id, "tax_rate", val >= 0 && val <= 100 ? val : 15);
                        }}
                        className="text-center w-20"
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {item.tax_amount.toFixed(2)} ر.س
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {item.total.toFixed(2)} ر.س
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveItem(item.id)}
                        disabled={items.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
