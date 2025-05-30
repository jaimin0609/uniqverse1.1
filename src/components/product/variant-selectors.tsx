"use client";

import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { ClientPrice } from "@/components/ui/client-price";
import { parseVariantOptions } from "@/lib/variant-utils";

interface ProductVariant {
    id: string;
    name?: string | null;
    price: number;
    image?: string | null;
    options?: string | null;
    type?: string | null;
}

interface VariantSelectorsProps {
    variants: ProductVariant[];
    selectedVariantId: string | null;
    onVariantChange: (variantId: string) => void;
    className?: string;
}

interface VariantOption {
    type: string;
    value: string;
    variants: ProductVariant[];
}

interface VariantStructure {
    [type: string]: {
        [value: string]: ProductVariant[];
    };
}

export function VariantSelectors({
    variants,
    selectedVariantId,
    onVariantChange,
    className = ""
}: VariantSelectorsProps) {
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [variantStructure, setVariantStructure] = useState<VariantStructure>({});
    const [variantTypes, setVariantTypes] = useState<string[]>([]);

    // Parse variant structure on mount and when variants change
    useEffect(() => {
        if (!variants || variants.length === 0) {
            setVariantStructure({});
            setVariantTypes([]);
            setSelectedOptions({});
            return;
        }

        const structure: VariantStructure = {};
        const types = new Set<string>();

        // Parse each variant to extract its options
        variants.forEach(variant => {
            let options: Record<string, string> = {};

            // Parse options from the variant
            if (variant.options) {
                options = parseVariantOptions(variant.options, variant.type || "Option");
            } else if (variant.type && variant.name) {
                // Legacy format - just type and name
                options = { [variant.type]: variant.name };
            } else if (variant.name) {
                // Simplest case - just a name with no structure
                options = { "Option": variant.name };
            }

            // Add each option to our structure
            Object.entries(options).forEach(([type, value]) => {
                types.add(type);

                if (!structure[type]) {
                    structure[type] = {};
                }

                if (!structure[type][value]) {
                    structure[type][value] = [];
                }

                structure[type][value].push(variant);
            });
        });

        setVariantStructure(structure);
        setVariantTypes(Array.from(types));

        // Auto-select the first available option for each type if nothing is selected
        const newSelectedOptions: Record<string, string> = {};
        Array.from(types).forEach(type => {
            const firstValue = Object.keys(structure[type])[0];
            if (firstValue) {
                newSelectedOptions[type] = firstValue;
            }
        });        // Always update options when variants change to ensure consistent state
        setSelectedOptions(newSelectedOptions);
    }, [variants]);    // Update selected variant when options change
    useEffect(() => {
        if (Object.keys(selectedOptions).length === 0 || Object.keys(variantStructure).length === 0) {
            return;
        }

        // Find the variant that matches all selected options
        const matchingVariant = variants.find(variant => {
            let options: Record<string, string> = {};

            if (variant.options) {
                options = parseVariantOptions(variant.options, variant.type || "Option");
            } else if (variant.type && variant.name) {
                options = { [variant.type]: variant.name };
            } else if (variant.name) {
                options = { "Option": variant.name };
            }

            // Check if all selected options match this variant
            return Object.entries(selectedOptions).every(([type, value]) => {
                return options[type] === value;
            });
        });        // Always update when we find a matching variant
        if (matchingVariant) {
            // Directly call onVariantChange to update the selected variant
            onVariantChange(matchingVariant.id);
        } else {
            // Log a debug message if no matching variant was found
            console.debug("No matching variant found for options:", selectedOptions);
        }
    }, [selectedOptions, variants, onVariantChange, variantStructure]);    // Update selected options when the selectedVariantId changes from outside
    useEffect(() => {
        if (selectedVariantId && variants.length > 0) {
            // Find the variant that matches the selected ID
            const variant = variants.find(v => v.id === selectedVariantId);
            if (variant) {
                let options: Record<string, string> = {};

                // Parse options from the variant
                if (variant.options) {
                    options = parseVariantOptions(variant.options, variant.type || "Option");
                } else if (variant.type && variant.name) {
                    options = { [variant.type]: variant.name };
                } else if (variant.name) {
                    options = { "Option": variant.name };
                }

                // Update selected options if they're different
                if (Object.keys(options).length > 0) {
                    setSelectedOptions(options);
                }
            }
        }
    }, [selectedVariantId, variants]);    // Handle option selection
    const handleOptionChange = (type: string, value: string) => {
        console.log(`Changing option ${type} to ${value}`);
        setSelectedOptions(prev => {
            const newOptions = {
                ...prev,
                [type]: value
            };
            console.log("New selected options:", newOptions);
            return newOptions;
        });
    };// Get available options for a type based on current selections
    const getAvailableOptions = (targetType: string): string[] => {
        // If the structure doesn't include this type, return empty array
        if (!variantStructure[targetType]) {
            return [];
        }

        // If no options are selected yet, return all available options for this type
        if (Object.keys(selectedOptions).length === 0) {
            return Object.keys(variantStructure[targetType] || {});
        }

        // Get all variants that match the currently selected options (excluding the target type)
        const otherSelections = Object.entries(selectedOptions).filter(([type]) => type !== targetType);

        if (otherSelections.length === 0) {
            return Object.keys(variantStructure[targetType] || {});
        }

        const availableOptions = new Set<string>();

        // Find variants that match other selections and see what options are available for the target type
        variants.forEach(variant => {
            let options: Record<string, string> = {};

            if (variant.options) {
                options = parseVariantOptions(variant.options, variant.type || "Option");
            } else if (variant.type && variant.name) {
                options = { [variant.type]: variant.name };
            } else if (variant.name) {
                options = { "Option": variant.name };
            }

            // Check if this variant matches all other selections
            const matchesOtherSelections = otherSelections.every(([type, value]) => {
                return options[type] === value;
            });

            if (matchesOtherSelections && options[targetType]) {
                availableOptions.add(options[targetType]);
            }
        });

        const result = Array.from(availableOptions);

        // If we filtered out all options, return all available options as fallback
        if (result.length === 0) {
            return Object.keys(variantStructure[targetType] || {});
        }

        return result;
    };

    // Get the current variant for price display
    const getCurrentVariant = (): ProductVariant | null => {
        if (!selectedVariantId) return null;
        return variants.find(v => v.id === selectedVariantId) || null;
    };

    // Debug logging effect
    useEffect(() => {
        console.log("VariantSelectors rendered with:", {
            selectedVariantId,
            variantTypesCount: variantTypes.length,
            variantsCount: variants.length,
            selectedOptionsCount: Object.keys(selectedOptions).length
        });
    }, [selectedVariantId, variantTypes.length, variants.length, selectedOptions]);

    if (variants.length === 0 || variantTypes.length === 0) {
        return null;
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {variantTypes.map(type => {
                const availableOptions = getAvailableOptions(type);
                const selectedValue = selectedOptions[type];

                return (
                    <div key={type} className="space-y-2">
                        <label className="text-sm font-medium text-gray-900">
                            Select {type}:
                        </label>

                        {/* Color type gets color swatches, others get dropdown */}
                        {type.toLowerCase() === 'color' || type.toLowerCase() === 'colour' ? (
                            <div className="flex flex-wrap gap-2">
                                {availableOptions.map(option => (
                                    <button
                                        key={option}
                                        onClick={() => handleOptionChange(type, option)}
                                        className={`px-3 py-2 text-sm border rounded-md transition-colors ${selectedValue === option
                                            ? "border-blue-500 bg-blue-50 text-blue-700"
                                            : "border-gray-300 hover:border-gray-400 bg-white"
                                            }`}
                                        type="button"
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="relative">
                                <select
                                    value={selectedValue || ""}
                                    onChange={(e) => handleOptionChange(type, e.target.value)}
                                    className="w-full appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="" disabled>Select {type}</option>
                                    {availableOptions.map(option => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Show selected variant price if different from base price */}
            {getCurrentVariant() && (
                <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Selected variant:</span>
                        <span className="font-medium">
                            <ClientPrice amount={getCurrentVariant()!.price} />
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
