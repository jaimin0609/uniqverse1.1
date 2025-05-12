import React from 'react';
import { Check, ChevronsUpDown, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/utils/cn";
import { useCurrency, Currency } from "@/contexts/currency-provider";

// Define currency details (value and label) locally for display purposes
// This can be kept separate from the availableCurrencies list from the context,
// which dictates what *can* be selected.
const currencyDetailsList = [
    { value: "USD" as Currency, label: "US Dollar (USD)" },
    { value: "EUR" as Currency, label: "Euro (EUR)" },
    { value: "GBP" as Currency, label: "British Pound (GBP)" },
    { value: "AUD" as Currency, label: "Australian Dollar (AUD)" },
    { value: "CAD" as Currency, label: "Canadian Dollar (CAD)" },
    { value: "JPY" as Currency, label: "Japanese Yen (JPY)" },
];

export function CurrencySelector() {
    // Destructure setCurrency (the actual function name from context) and availableCurrencies
    const { currency, setCurrency, isLoading, availableCurrencies } = useCurrency();
    const [open, setOpen] = React.useState(false);

    // Find the current currency label for display if needed, or just use the code.
    // The button in the screenshot shows the code (e.g., "USD").
    // const currentCurrencyLabel = currencyDetailsList.find(c => c.value === currency)?.label || currency;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="min-w-[110px] h-8 px-2 flex justify-between items-center"
                    // Disable if loading or if there are no alternative currencies to select
                    disabled={isLoading || availableCurrencies.length <= 1}
                >
                    <Globe className="mr-1 h-4 w-4" />
                    {/* Display the current currency code directly */}
                    <span className="text-sm">{currency}</span>
                    <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    <CommandInput placeholder="Search currency..." className="h-9" />
                    <CommandEmpty>No currency found.</CommandEmpty>
                    <CommandGroup>
                        {/* Map over availableCurrencies from the context */}
                        {availableCurrencies.map((currencyCode) => {
                            const details = currencyDetailsList.find(d => d.value === currencyCode);
                            return (
                                <CommandItem
                                    key={currencyCode}
                                    value={currencyCode} // The value passed to onSelect
                                    onSelect={(currentValue) => {
                                        // Call the setCurrency function from the context
                                        setCurrency(currentValue as Currency);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            currency === currencyCode ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {/* Display the label if found, otherwise the code */}
                                    {details?.label || currencyCode}
                                </CommandItem>
                            );
                        })}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
}