import { ReactNode } from "react";
import { EmptyTableMessage } from "./EmptyTableMessage";
import { Skeleton } from "./ui/skeleton";

interface SafeQueryWrapperProps {
  isLoading: boolean;
  error: Error | null;
  children: ReactNode;
  tableName: string;
  tableNameArabic: string;
  loadingComponent?: ReactNode;
}

export const SafeQueryWrapper = ({
  isLoading,
  error,
  children,
  tableName,
  tableNameArabic,
  loadingComponent
}: SafeQueryWrapperProps) => {
  if (error) {
    const errorMessage = error?.message || "";

    const isTableNotFound =
      errorMessage.includes("relation") && errorMessage.includes("does not exist") ||
      errorMessage.includes("table") && errorMessage.includes("not found") ||
      errorMessage.includes(`"${tableName}"`);

    if (isTableNotFound) {
      return (
        <EmptyTableMessage
          title={tableNameArabic}
          description={`هذه الميزة قيد التطوير. سيتم إضافة جدول ${tableNameArabic} قريباً.`}
        />
      );
    }

    return (
      <EmptyTableMessage
        title="حدث خطأ"
        description={errorMessage || "حدث خطأ أثناء تحميل البيانات"}
        showDatabaseIcon={false}
      />
    );
  }

  if (isLoading) {
    return loadingComponent || (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return <>{children}</>;
};
