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

interface ProductFormData {
  product_name: string;
  description: string;
  category: string;
  unit: string;
  cost_price: string;
  selling_price: string;
  tax_rate: string;
  min_stock_level: string;
  max_stock_level: string;
  current_stock: string;
  reorder_point: string;
  shipping_cost: string;
  additional_costs: string;
  notes: string;
}

interface ProductFormProps {
  formData: ProductFormData;
  onChange: (data: ProductFormData) => void;
}

export const ProductForm = ({ formData, onChange }: ProductFormProps) => {
  const handleInputChange = (field: keyof ProductFormData, value: string) => {
    onChange({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="product_name" className="text-base font-semibold text-right block">
            اسم المنتج <span className="text-red-500">*</span>
          </Label>
          <Input
            id="product_name"
            name="product_name"
            type="text"
            value={formData.product_name}
            onChange={(e) => handleInputChange('product_name', e.target.value)}
            placeholder="مثال: كمبيوتر محمول Dell"
            className="text-base text-right"
            dir="rtl"
            autoComplete="off"
            autoFocus
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category" className="text-base font-semibold text-right block">
              التصنيف
            </Label>
            <Input
              id="category"
              name="category"
              type="text"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              placeholder="مثال: إلكترونيات"
              className="text-base text-right"
              dir="rtl"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit" className="text-base font-semibold text-right block">
              الوحدة <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.unit}
              onValueChange={(value) => handleInputChange('unit', value)}
            >
              <SelectTrigger id="unit" className="text-base text-right" dir="rtl">
                <SelectValue placeholder="اختر الوحدة" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="قطعة">قطعة</SelectItem>
                <SelectItem value="كيلو">كيلو</SelectItem>
                <SelectItem value="لتر">لتر</SelectItem>
                <SelectItem value="متر">متر</SelectItem>
                <SelectItem value="علبة">علبة</SelectItem>
                <SelectItem value="كرتون">كرتون</SelectItem>
                <SelectItem value="صندوق">صندوق</SelectItem>
                <SelectItem value="باكو">باكو</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cost_price" className="text-base font-semibold text-right block">
              سعر التكلفة (ر.س) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cost_price"
              name="cost_price"
              type="number"
              step="0.01"
              min="0"
              value={formData.cost_price}
              onChange={(e) => handleInputChange('cost_price', e.target.value)}
              placeholder="0.00"
              className="text-base"
              autoComplete="off"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="selling_price" className="text-base font-semibold text-right block">
              سعر البيع (ر.س) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="selling_price"
              name="selling_price"
              type="number"
              step="0.01"
              min="0"
              value={formData.selling_price}
              onChange={(e) => handleInputChange('selling_price', e.target.value)}
              placeholder="0.00"
              className="text-base"
              autoComplete="off"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tax_rate" className="text-base font-semibold text-right block">
            نسبة الضريبة (%)
          </Label>
          <Input
            id="tax_rate"
            name="tax_rate"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.tax_rate}
            onChange={(e) => handleInputChange('tax_rate', e.target.value)}
            placeholder="15"
            className="text-base"
          />
        </div>

        <div className="border-t pt-4 mt-4">
          <h3 className="text-lg font-semibold mb-4 text-right">إدارة المخزون</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="current_stock" className="text-base font-semibold text-right block">
                المخزون الحالي
              </Label>
              <Input
                id="current_stock"
                name="current_stock"
                type="number"
                min="0"
                value={formData.current_stock}
                onChange={(e) => handleInputChange('current_stock', e.target.value)}
                placeholder="0"
                className="text-base"
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorder_point" className="text-base font-semibold text-right block">
                نقطة إعادة الطلب
              </Label>
              <Input
                id="reorder_point"
                name="reorder_point"
                type="number"
                min="0"
                value={formData.reorder_point}
                onChange={(e) => handleInputChange('reorder_point', e.target.value)}
                placeholder="10"
                className="text-base"
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_stock_level" className="text-base font-semibold text-right block">
                الحد الأدنى للمخزون
              </Label>
              <Input
                id="min_stock_level"
                name="min_stock_level"
                type="number"
                min="0"
                value={formData.min_stock_level}
                onChange={(e) => handleInputChange('min_stock_level', e.target.value)}
                placeholder="0"
                className="text-base"
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_stock_level" className="text-base font-semibold text-right block">
                الحد الأقصى للمخزون
              </Label>
              <Input
                id="max_stock_level"
                name="max_stock_level"
                type="number"
                min="0"
                value={formData.max_stock_level}
                onChange={(e) => handleInputChange('max_stock_level', e.target.value)}
                placeholder="1000"
                className="text-base"
                autoComplete="off"
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-4 mt-4">
          <h3 className="text-lg font-semibold mb-4 text-right">معلومات إضافية</h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description" className="text-base font-semibold text-right block">
                الوصف
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="أدخل وصف تفصيلي للمنتج..."
                rows={3}
                className="text-base resize-none text-right"
                dir="rtl"
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-base font-semibold text-right block">
                ملاحظات
              </Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="أي ملاحظات إضافية..."
                rows={2}
                className="text-base resize-none text-right"
                dir="rtl"
                autoComplete="off"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
