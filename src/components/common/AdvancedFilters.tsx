import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterOption {
  key: string;
  label: string;
  type: "text" | "select" | "date" | "number";
  options?: { value: string; label: string }[];
}

interface AdvancedFiltersProps {
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
  filterOptions: FilterOption[];
}

export function AdvancedFilters({
  filters,
  onFiltersChange,
  filterOptions,
}: AdvancedFiltersProps) {
  const activeFiltersCount = Object.keys(filters).filter(
    (key) =>
      filters[key] !== "" &&
      filters[key] !== undefined &&
      filters[key] !== null &&
      filters[key] !== "all"
  ).length;

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: Record<string, any> = {};
    filterOptions.forEach((option) => {
      clearedFilters[option.key] = option.type === "select" ? "all" : "";
    });
    onFiltersChange(clearedFilters);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="default" className="gap-2 h-11">
          <Filter className="h-4 w-4" />
          تصفية متقدمة
          {activeFiltersCount > 0 && (
            <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-lg">تصفية متقدمة</h4>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs h-8"
              >
                <X className="h-3 w-3 ml-1" />
                مسح الكل
              </Button>
            )}
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filterOptions.map((option) => (
              <div key={option.key} className="space-y-2">
                <Label className="text-sm font-medium">{option.label}</Label>
                {option.type === "text" && (
                  <Input
                    placeholder={`ابحث عن ${option.label}...`}
                    value={filters[option.key] || ""}
                    onChange={(e) =>
                      handleFilterChange(option.key, e.target.value)
                    }
                    className="h-9"
                  />
                )}
                {option.type === "number" && (
                  <Input
                    type="number"
                    placeholder={`أدخل ${option.label}...`}
                    value={filters[option.key] || ""}
                    onChange={(e) =>
                      handleFilterChange(option.key, e.target.value)
                    }
                    className="h-9"
                  />
                )}
                {option.type === "date" && (
                  <Input
                    type="date"
                    value={filters[option.key] || ""}
                    onChange={(e) =>
                      handleFilterChange(option.key, e.target.value)
                    }
                    className="h-9"
                  />
                )}
                {option.type === "select" && option.options && (
                  <Select
                    value={filters[option.key] || "all"}
                    onValueChange={(value) =>
                      handleFilterChange(option.key, value === "all" ? "" : value)
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={`اختر ${option.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      {option.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
