import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Customer {
  id: string;
  customer_name: string;
  phone: string | null;
  email: string | null;
}

interface CustomerSelectorProps {
  customers: Customer[];
  selectedCustomerId: string;
  onSelectCustomer: (customerId: string, customer: Customer | null) => void;
}

export function CustomerSelector({
  customers,
  selectedCustomerId,
  onSelectCustomer,
}: CustomerSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-base font-semibold text-right block">
          اسم العميل <span className="text-red-500">*</span>
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between text-right"
              dir="rtl"
            >
              {selectedCustomer ? (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{selectedCustomer.customer_name}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">اختر العميل...</span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command dir="rtl">
              <CommandInput
                placeholder="ابحث عن عميل..."
                value={searchValue}
                onValueChange={setSearchValue}
                dir="rtl"
              />
              <CommandList>
                <CommandEmpty>لا يوجد عميل</CommandEmpty>
                <CommandGroup>
                  {customers.map((customer) => (
                    <CommandItem
                      key={customer.id}
                      value={customer.customer_name}
                      onSelect={() => {
                        onSelectCustomer(customer.id, customer);
                        setOpen(false);
                      }}
                      className="text-right"
                      dir="rtl"
                    >
                      <Check
                        className={cn(
                          "ml-2 h-4 w-4",
                          selectedCustomerId === customer.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span>{customer.customer_name}</span>
                        {customer.phone && (
                          <span className="text-xs text-muted-foreground">
                            {customer.phone}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {selectedCustomer && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm text-right block">رقم الجوال</Label>
            <Input
              value={selectedCustomer.phone || "-"}
              readOnly
              className="text-right bg-muted"
              dir="rtl"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-right block">البريد الإلكتروني</Label>
            <Input
              value={selectedCustomer.email || "-"}
              readOnly
              className="text-right bg-muted"
              dir="rtl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
