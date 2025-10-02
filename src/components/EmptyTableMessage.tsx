import { AlertCircle, Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface EmptyTableMessageProps {
  title: string;
  description?: string;
  showDatabaseIcon?: boolean;
}

export const EmptyTableMessage = ({
  title,
  description = "هذه الميزة قيد التطوير حالياً",
  showDatabaseIcon = true
}: EmptyTableMessageProps) => {
  return (
    <div className="p-8">
      <Card className="border-2 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          {showDatabaseIcon ? (
            <Database className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
          ) : (
            <AlertCircle className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
          )}

          <h3 className="text-xl font-semibold text-foreground mb-2">
            {title}
          </h3>

          <p className="text-muted-foreground max-w-md">
            {description}
          </p>

          <Alert className="mt-6 max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>معلومة</AlertTitle>
            <AlertDescription>
              جاري العمل على إضافة هذه الميزة. سيتم تفعيلها قريباً.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};
