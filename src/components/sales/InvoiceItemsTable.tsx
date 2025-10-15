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
    if (product) {
      onUpdateItem(itemId, "product_id", productId);
      onUpdateItem(itemId, "product_name", product.product_name);
      onUpdateItem(itemId, "unit_price", product.selling_price);
      onUpdateItem(itemId, "tax_rate", product.tax_rate);
    }
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
                        value={item.product_id}
                        onValueChange={(value) => handleProductSelect(item.id, value)}
                      >
                        <SelectTrigger className="text-right" dir="rtl">
                          <SelectValue placeholder="اختر منتج" />
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.product_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          onUpdateItem(item.id, "quantity", parseFloat(e.target.value) || 1)
                        }
                        className="text-center"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unit_price}
                        onChange={(e) =>
                          onUpdateItem(item.id, "unit_price", parseFloat(e.target.value) || 0)
                        }
                        className="text-right"
                        dir="rtl"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={item.tax_rate}
                        onChange={(e) =>
                          onUpdateItem(item.id, "tax_rate", parseFloat(e.target.value) || 0)
                        }
                        className="text-center"
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
