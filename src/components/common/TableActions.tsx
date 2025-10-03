import { Download, Upload, CreditCard as Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TableActionsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  showEdit?: boolean;
  showDelete?: boolean;
}

export const TableActions = ({
  onEdit,
  onDelete,
  showEdit = true,
  showDelete = true
}: TableActionsProps) => {
  return (
    <div className="flex gap-2 justify-end">
      {showEdit && onEdit && (
        <Button
          size="sm"
          variant="outline"
          onClick={onEdit}
          className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all"
        >
          <Edit className="h-4 w-4" />
        </Button>
      )}
      {showDelete && onDelete && (
        <Button
          size="sm"
          variant="outline"
          onClick={onDelete}
          className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

interface PageHeaderActionsProps {
  onExport?: () => void;
  onImport?: () => void;
  showExport?: boolean;
  showImport?: boolean;
}

export const PageHeaderActions = ({
  onExport,
  onImport,
  showExport = true,
  showImport = true,
}: PageHeaderActionsProps) => {
  return (
    <div className="flex gap-2">
      {showImport && onImport && (
        <Button
          variant="outline"
          onClick={onImport}
          className="gap-2 hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-all"
        >
          <Upload className="h-4 w-4" />
          استيراد
        </Button>
      )}
      {showExport && onExport && (
        <Button
          variant="outline"
          onClick={onExport}
          className="gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all"
        >
          <Download className="h-4 w-4" />
          تصدير
        </Button>
      )}
    </div>
  );
};
