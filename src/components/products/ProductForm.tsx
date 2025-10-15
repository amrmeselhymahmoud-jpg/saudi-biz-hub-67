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

export interface ProductFormData {
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
}

interface ProductFormProps {
  formData: ProductFormData;
  onChange: (data: ProductFormData) => void;
}

export const ProductForm = ({ formData, onChange }: ProductFormProps) => {
  const handleChange = (field: keyof ProductFormData, value: string) => {
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
            type="text"
            value={formData.product_name}
            onChange={(e) => handleChange('product_name', e.target.value)}
            placeholder="مثال: لابتوب Dell XPS"
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
            <Select
              value={formData.category}
              onValueChange={(value) => handleChange('category', value)}
            >
              <SelectTrigger id="category" className="text-base text-right" dir="rtl">
                <SelectValue placeholder="اختر التصنيف" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="إلكترونيات">إلكترونيات</SelectItem>
                <SelectItem value="أجهزة كمبيوتر">أجهزة كمبيوتر</SelectItem>
                <SelectItem value="ملابس">ملابس</SelectItem>
                <SelectItem value="أثاث">أثاث</SelectItem>
                <SelectItem value="أدوات مكتبية">أدوات مكتبية</SelectItem>
                <SelectItem value="أغذية">أغذية</SelectItem>
                <SelectItem value="مواد بناء">مواد بناء</SelectItem>
                <SelectItem value="قطع غيار">قطع غيار</SelectItem>
                <SelectItem value="أخرى">أخرى</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit" className="text-base font-semibold text-right block">
              الوحدة <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.unit}
              onValueChange={(value) => handleChange('unit', value)}
            >
              <SelectTrigger id="unit" className="text-base text-right" dir="rtl">
                <SelectValue placeholder="اختر الوحدة" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="piece">قطعة</SelectItem>
                <SelectItem value="box">صندوق</SelectItem>
                <SelectItem value="carton">كرتون</SelectItem>
                <SelectItem value="kg">كيلوغرام</SelectItem>
                <SelectItem value="gram">جرام</SelectItem>
                <SelectItem value="liter">لتر</SelectItem>
                <SelectItem value="meter">متر</SelectItem>
                <SelectItem value="pack">باكو</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cost_price" className="text-base font-semibold text-right block">
              سعر التكلفة (ر.س) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cost_price"
              type="number"
              step="0.01"
              min="0"
              value={formData.cost_price}
              onChange={(e) => handleChange('cost_price', e.target.value)}
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
              type="number"
              step="0.01"
              min="0"
              value={formData.selling_price}
              onChange={(e) => handleChange('selling_price', e.target.value)}
              placeholder="0.00"
              className="text-base"
              autoComplete="off"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tax_rate" className="text-base font-semibold text-right block">
              نسبة الضريبة (%)
            </Label>
            <Input
              id="tax_rate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.tax_rate}
              onChange={(e) => handleChange('tax_rate', e.target.value)}
              placeholder="15"
              className="text-base"
              autoComplete="off"
            />
          </div>
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
                type="number"
                min="0"
                value={formData.current_stock}
                onChange={(e) => handleChange('current_stock', e.target.value)}
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
                type="number"
                min="0"
                value={formData.reorder_point}
                onChange={(e) => handleChange('reorder_point', e.target.value)}
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
                type="number"
                min="0"
                value={formData.min_stock_level}
                onChange={(e) => handleChange('min_stock_level', e.target.value)}
                placeholder="5"
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
                type="number"
                min="0"
                value={formData.max_stock_level}
                onChange={(e) => handleChange('max_stock_level', e.target.value)}
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
                الوصف / الملاحظات
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="أدخل وصف المنتج أو أي ملاحظات إضافية..."
                rows={4}
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
