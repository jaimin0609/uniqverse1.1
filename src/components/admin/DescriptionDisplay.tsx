import React from 'react';
import { AlertCircle } from 'lucide-react';

interface DescriptionDisplayProps {
    description: string;
    showHtmlPreview?: boolean;
}

export default function DescriptionDisplay({
    description,
    showHtmlPreview = true
}: DescriptionDisplayProps) {
    const hasHtml = description?.includes('<');
    const descriptionLength = description?.length || 0;

    if (!description) {
        return (
            <div className="text-xs flex items-center gap-2 text-amber-600 p-2 bg-amber-50 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <span>No description available. If importing from CJ Dropshipping, check the API response.</span>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
                <span>Description length: {descriptionLength} characters</span>
                {hasHtml && <span className="text-blue-500">Contains HTML formatting</span>}
            </div>

            {showHtmlPreview && hasHtml && (
                <div className="border p-3 rounded-md bg-gray-50">
                    <p className="text-xs text-gray-700 mb-2 flex items-center gap-1">
                        <span>HTML Description Preview:</span>
                    </p>
                    <div
                        className="prose max-w-full text-sm overflow-auto max-h-96"
                        dangerouslySetInnerHTML={{ __html: description }}
                    />
                </div>
            )}
        </div>
    );
}
