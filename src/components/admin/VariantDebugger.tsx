import React from 'react';
import { AlertCircle } from 'lucide-react';

// Component to display variant data in a more structured way
export interface VariantDebuggerProps {
    variants: any[];
    variantTypes?: string | null;
}

export default function VariantDebugger({ variants, variantTypes }: VariantDebuggerProps) {
    if (!variants || variants.length === 0) {
        return (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
                <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>No variant data found for this product.</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Variant Structure</h3>

            {variantTypes && (
                <div className="mb-3">
                    <p className="text-xs font-medium text-gray-600">Variant Types Configuration:</p>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                        {typeof variantTypes === 'string' ? variantTypes : JSON.stringify(variantTypes, null, 2)}
                    </pre>
                </div>
            )}

            <p className="text-xs font-medium text-gray-600 mb-1">Variants ({variants.length}):</p>
            <div className="space-y-2">
                {variants.slice(0, 5).map((variant, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded p-2">
                        <p className="text-xs font-medium">{variant.name}</p>
                        {variant.type && (
                            <p className="text-xs text-gray-600">Type: <span className="font-mono">{variant.type}</span></p>
                        )}
                        {variant.options && (
                            <div className="mt-1">
                                <p className="text-xs text-gray-600">Options:</p>
                                <pre className="text-xs bg-gray-100 p-1 rounded overflow-auto max-h-20">
                                    {typeof variant.options === 'string'
                                        ? variant.options
                                        : JSON.stringify(variant.options, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                ))}

                {variants.length > 5 && (
                    <p className="text-xs text-gray-500 italic">
                        + {variants.length - 5} more variants not shown
                    </p>
                )}
            </div>
        </div>
    );
}
