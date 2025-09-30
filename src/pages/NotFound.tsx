import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowRight } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="text-8xl font-bold text-primary mb-4">404</div>
        <h1 className="mb-4 text-3xl font-bold text-foreground">الصفحة غير موجودة</h1>
        <p className="mb-8 text-xl text-muted-foreground">عذراً، الصفحة التي تبحث عنها غير متوفرة</p>
        <Button onClick={() => window.location.href = "/"} className="gap-2">
          <Home className="h-4 w-4" />
          العودة للرئيسية
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
