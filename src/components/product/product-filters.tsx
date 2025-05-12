"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, Sliders, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Category {
    id: string;
    name: string;
    slug: string;
}

interface ProductFiltersProps {
    categories: Category[];
    selectedCategory?: string;
    minPrice?: string;
    maxPrice?: string;
}

export default function ProductFilters({
    categories,
    selectedCategory,
    minPrice,
    maxPrice,
}: ProductFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [priceRange, setPriceRange] = useState({
        min: minPrice || "",
        max: maxPrice || "",
    });

    const [showFiltersMobile, setShowFiltersMobile] = useState(false);
    const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
    const [showPriceDropdown, setShowPriceDropdown] = useState(false);

    // Handler for applying filters
    const applyFilters = () => {
        const current = new URLSearchParams(searchParams.toString());

        // Reset to first page when filters change
        current.set("page", "1");

        // Apply price filters
        if (priceRange.min) {
            current.set("minPrice", priceRange.min);
        } else {
            current.delete("minPrice");
        }

        if (priceRange.max) {
            current.set("maxPrice", priceRange.max);
        } else {
            current.delete("maxPrice");
        }

        // Update URL with new query parameters
        const search = current.toString();
        const query = search ? `?${search}` : "";
        router.push(`/shop${query}`);

        // Close mobile filters
        setShowFiltersMobile(false);
    };

    // Handler for selecting a category
    const selectCategory = (slug: string | null) => {
        const current = new URLSearchParams(searchParams.toString());

        // Reset to first page when category changes
        current.set("page", "1");

        if (slug) {
            current.set("category", slug);
        } else {
            current.delete("category");
        }

        // Update URL with new query parameters
        const search = current.toString();
        const query = search ? `?${search}` : "";
        router.push(`/shop${query}`);
    };

    // Handler for clearing all filters
    const clearAllFilters = () => {
        const current = new URLSearchParams(searchParams.toString());

        // Remove filter parameters but keep sort and pagination
        current.delete("category");
        current.delete("minPrice");
        current.delete("maxPrice");
        current.set("page", "1");

        // Update URL with new query parameters
        const search = current.toString();
        const query = search ? `?${search}` : "";
        router.push(`/shop${query}`);

        // Reset price range state
        setPriceRange({ min: "", max: "" });
    };

    const hasActiveFilters = selectedCategory || priceRange.min || priceRange.max;

    // Mobile toggle button
    const filtersMobileButton = (
        <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFiltersMobile(!showFiltersMobile)}
            className="flex items-center md:hidden mb-4"
        >
            <Sliders className="mr-2 h-4 w-4" />
            {showFiltersMobile ? "Hide Filters" : "Show Filters"}
        </Button>
    );

    const filtersContent = (
        <>
            <div className="space-y-6">
                {/* Category Filter */}
                <div>
                    <button
                        onClick={() => setShowCategoriesDropdown(!showCategoriesDropdown)}
                        className="flex justify-between items-center w-full font-medium mb-3"
                    >
                        <h3>Categories</h3>
                        {showCategoriesDropdown ? (
                            <ChevronUp className="h-4 w-4 text-gray-500" />
                        ) : (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                        )}
                    </button>

                    {showCategoriesDropdown && (
                        <ul className="space-y-2 text-sm">
                            <li>
                                <button
                                    onClick={() => selectCategory(null)}
                                    className={`hover:text-blue-600 ${!selectedCategory ? "font-medium text-blue-600" : "text-gray-700"}`}
                                >
                                    All Categories
                                </button>
                            </li>
                            {categories.map((category) => (
                                <li key={category.id}>
                                    <button
                                        onClick={() => selectCategory(category.slug)}
                                        className={`hover:text-blue-600 ${selectedCategory === category.slug
                                            ? "font-medium text-blue-600"
                                            : "text-gray-700"
                                            }`}
                                    >
                                        {category.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Price Filter */}
                <div>
                    <button
                        onClick={() => setShowPriceDropdown(!showPriceDropdown)}
                        className="flex justify-between items-center w-full font-medium mb-3"
                    >
                        <h3>Price</h3>
                        {showPriceDropdown ? (
                            <ChevronUp className="h-4 w-4 text-gray-500" />
                        ) : (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                        )}
                    </button>

                    {showPriceDropdown && (
                        <>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    value={priceRange.min}
                                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                                />
                                <span className="text-gray-500">to</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    value={priceRange.max}
                                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full mt-2"
                                onClick={applyFilters}
                            >
                                Apply
                            </Button>
                        </>
                    )}
                </div>

                {/* Clear All Filters */}
                {hasActiveFilters && (
                    <div className="pt-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearAllFilters}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center"
                        >
                            <X className="mr-1 h-4 w-4" />
                            Clear all filters
                        </Button>
                    </div>
                )}
            </div>
        </>
    );

    return (
        <div>
            {/* Mobile Filter Toggle */}
            {filtersMobileButton}

            {/* Desktop Filters (always visible) */}
            <div className="hidden md:block">
                <h2 className="text-lg font-medium mb-4">Filters</h2>
                {filtersContent}
            </div>

            {/* Mobile Filters (conditionally visible) */}
            {showFiltersMobile && (
                <div className="md:hidden bg-white p-4 rounded-lg border border-gray-200 mb-6">
                    <h2 className="text-lg font-medium mb-4">Filters</h2>
                    {filtersContent}
                </div>
            )}
        </div>
    );
}