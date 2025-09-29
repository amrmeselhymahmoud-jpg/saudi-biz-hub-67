import { Package } from "lucide-react";

const ProductsCosts = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Package className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">المنتجات والتكاليف</h1>
      </div>
      <p className="text-muted-foreground">صفحة إدارة المنتجات والتكاليف</p>
    </div>
  );
};

export default ProductsCosts;
