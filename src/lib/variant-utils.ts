// Add this helper function to your codebase to make variant handling easier
// src/lib/variant-utils.ts

/**
 * Parse variant options from different formats
 * @param optionsJson - The JSON string containing options
 * @param defaultType - Default type to use if not specified
 * @returns Parsed options as a Record<string, string>
 */
export function parseVariantOptions(
    optionsJson: string | null | undefined,
    defaultType = "Option"
): Record<string, string> {
    if (!optionsJson) {
        return {};
    }

    try {
        const parsed = JSON.parse(optionsJson);
        if (typeof parsed === "object" && parsed !== null) {
            return parsed;
        }
    } catch (e) {
        console.warn("Failed to parse variant options:", e);
    }

    // Default fallback - treat it as a simple option
    return { [defaultType]: optionsJson };
}

/**
 * Extract variant structure from an array of variants
 * @param variants - Array of product variants
 * @returns Object containing variant types and their options
 */
export function extractVariantStructure(variants: any[]): {
    variantTypes: string[];
    variantOptions: Record<string, string[]>;
} {
    const variantsByType: Record<string, string[]> = {};
    const types: string[] = [];

    variants.forEach((variant) => {
        // Skip invalid variants
        if (!variant) return;

        // Try to parse options if it's a JSON string
        let options: Record<string, string> = {};
        if (typeof variant.options === "string") {
            options = parseVariantOptions(variant.options, variant.type || "Option");
        } else if (variant.options && typeof variant.options === "object") {
            options = variant.options;
        } else if (variant.type && variant.name) {
            // Legacy format - just type and name
            options = { [variant.type]: variant.name };
        } else if (variant.name) {
            // Simplest case - just a name with no structure
            options = { "Option": variant.name };
        }

        // Add each option to our structure
        Object.entries(options).forEach(([type, value]) => {
            if (!types.includes(type)) {
                types.push(type);
            }

            if (!variantsByType[type]) {
                variantsByType[type] = [];
            }

            if (typeof value === "string" && !variantsByType[type].includes(value)) {
                variantsByType[type].push(value);
            }
        });
    });

    return { variantTypes: types, variantOptions: variantsByType };
}
