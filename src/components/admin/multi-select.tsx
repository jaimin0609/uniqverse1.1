"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";

export interface MultiSelectOption {
    value: string;
    label: string;
}

interface MultiSelectProps {
    options: MultiSelectOption[];
    selectedValues: string[];
    onChange: (values: string[]) => void;
    placeholder?: string;
    className?: string;
}

export function MultiSelect({
    options,
    selectedValues,
    onChange,
    placeholder = "Select options",
    className,
}: MultiSelectProps) {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);

    const selected = selectedValues || [];

    const toggleOption = (value: string) => {
        const newValues = selected.includes(value)
            ? selected.filter((v) => v !== value)
            : [...selected, value];

        onChange(newValues);
    };

    const removeOption = (value: string, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onChange(selected.filter((v) => v !== value));
    };

    const selectedLabels = options
        .filter((option) => selected.includes(option.value))
        .map((option) => option.label);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    ref={triggerRef}
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full min-h-10 h-auto justify-between", className)}
                >
                    <div className="flex flex-wrap gap-1 py-1">
                        {selectedLabels.length === 0 && (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                        {selectedLabels.map((label) => {
                            const option = options.find((o) => o.label === label);
                            if (!option) return null;
                            return (
                                <Badge
                                    key={option.value}
                                    variant="secondary"
                                    className="mr-1 mb-1"
                                >
                                    {label}
                                    <button
                                        className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                        onClick={(e) => removeOption(option.value, e)}
                                    >
                                        <X className="h-3 w-3 text-muted-foreground" />
                                        <span className="sr-only">Remove {label}</span>
                                    </button>
                                </Badge>
                            );
                        })}
                    </div>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="p-0 w-[--radix-popover-trigger-width]"
                align="start"
            >
                <Command>
                    <CommandInput placeholder="Search options..." />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    onSelect={() => toggleOption(option.value)}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selected.includes(option.value)
                                                ? "opacity-100"
                                                : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
