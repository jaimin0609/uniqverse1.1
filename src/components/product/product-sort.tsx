"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ProductSortProps {
    sort?: string;
    defaultSort: string;
}

const sortOptions = [
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
    { value: "price-asc", label: "Price: Low to High" },
    { value: "price-desc", label: "Price: High to Low" },
    { value: "name-asc", label: "Name: A to Z" },
    { value: "name-desc", label: "Name: Z to A" },
];

export default function ProductSort({ sort, defaultSort }: ProductSortProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isOpen, setIsOpen] = useState(false);

    // Get the current sort option or use the default
    const currentSort = sort || defaultSort;

    // Get the label for the current sort option
    const currentSortLabel = sortOptions.find((option) => option.value === currentSort)?.label || "Sort by";

    // Handler for changing sort order
    const handleSortChange = (value: string) => {
        const current = new URLSearchParams(searchParams.toString());

        // Set the sort parameter
        current.set("sort", value);

        // Reset to first page when sort changes
        current.set("page", "1");

        // Update URL with new query parameters
        const search = current.toString();
        const query = search ? `?${search}` : "";
        router.push(`/shop${query}`);

        // Close dropdown after selection
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block text-left">
            <div>
                <button
                    type="button"
                    className="inline-flex justify-between items-center w-48 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none"
                    id="sort-menu-button"
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {currentSortLabel}
                    {isOpen ? (
                        <ChevronUp className="h-4 w-4 ml-2" />
                    ) : (
                        <ChevronDown className="h-4 w-4 ml-2" />
                    )}
                </button>
            </div>

            {isOpen && (
                <div
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none z-10"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="sort-menu-button"
                >
                    <div className="py-1" role="none">
                        {sortOptions.map((option) => (
                            <button
                                key={option.value}
                                className={`text-left w-full px-4 py-2 text-sm ${currentSort === option.value
                                        ? "bg-gray-100 text-gray-900 font-medium"
                                        : "text-gray-700 hover:bg-gray-50"
                                    }`}
                                role="menuitem"
                                onClick={() => handleSortChange(option.value)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}