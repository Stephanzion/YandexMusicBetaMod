"use client";

import * as React from "react";
import { CheckIcon, ChevronsUpDownIcon, SearchIcon } from "lucide-react";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

import { cn } from "@ui/lib/utils";
import { Button } from "@ui/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@ui/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@ui/components/ui/popover";

const comboboxVariants = cva(
  "flex w-full items-center justify-between whitespace-nowrap text-sm transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default: "border shadow-xs border-input bg-card hover:bg-background dark:hover:bg-input/30",
        ghost: "bg-card shadow-xs hover:bg-background dark:hover:bg-input/30",
        outline: "border bg-card shadow-xs border-input hover:bg-background dark:hover:bg-input/30",
      },
      size: {
        default: "h-9 rounded-md px-3",
        sm: "h-8 rounded-md px-2",
        lg: "h-10 rounded-md px-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface ComboboxProps extends React.ComponentProps<"div">, VariantProps<typeof comboboxVariants> {
  options: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  clearable?: boolean;
  searchable?: boolean;
  popoverClassName?: string;
  commandClassName?: string;
}

function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search options...",
  emptyMessage = "No options found.",
  disabled = false,
  clearable = false,
  searchable = true,
  variant,
  size,
  className,
  popoverClassName,
  commandClassName,
  ...props
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState(value || "");

  // Use controlled value if provided, otherwise use internal state
  const currentValue = value !== undefined ? value : internalValue;

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      const finalValue = currentValue === newValue ? (clearable ? "" : newValue) : newValue;

      if (value === undefined) {
        setInternalValue(finalValue);
      }

      onValueChange?.(finalValue);
      setOpen(false);
    },
    [currentValue, clearable, onValueChange, value],
  );

  const selectedOption = React.useMemo(
    () => options.find((option) => option.value === currentValue),
    [options, currentValue],
  );

  const displayValue = selectedOption?.label || placeholder;

  return (
    <div {...props}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label={selectedOption ? `Selected: ${selectedOption.label}` : placeholder}
            disabled={disabled}
            className={cn(
              comboboxVariants({ variant, size }),
              "font-normal",
              !currentValue && "text-muted-foreground",
              className,
            )}
          >
            <span className="truncate">{displayValue}</span>
            <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className={cn("w-[var(--radix-popover-trigger-width)] p-0", popoverClassName)} align="start">
          <Command className={cn("max-h-96", commandClassName)}>
            {searchable && (
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <CommandInput placeholder={searchPlaceholder} className="pl-10" />
              </div>
            )}
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    onSelect={() => handleValueChange(option.value)}
                    className={cn("cursor-pointer", option.disabled && "cursor-not-allowed opacity-50")}
                  >
                    <CheckIcon
                      className={cn("mr-2 h-4 w-4", currentValue === option.value ? "opacity-100" : "opacity-0")}
                    />
                    <span className="truncate">{option.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Additional convenient hook for managing combobox state
function useCombobox({
  defaultValue = "",
  onChange,
}: {
  defaultValue?: string;
  onChange?: (value: string) => void;
} = {}) {
  const [value, setValue] = React.useState(defaultValue);

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      setValue(newValue);
      onChange?.(newValue);
    },
    [onChange],
  );

  return {
    value,
    onValueChange: handleValueChange,
    setValue,
  };
}

export { Combobox, useCombobox, comboboxVariants };
export type { ComboboxProps };
