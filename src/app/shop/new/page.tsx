import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Star, Filter, Clock, Bell } from "lucide-react";
import ProductList from "@/components/product/product-list";
import ProductFilters from "@/components/product/product-filters";
import ProductSort from "@/components/product/product-sort";
import type { ProductSearchParams } from "@/app/shop/page";

export const metadata: Metadata = {
    title: "New Arrivals | UniQVerse",
    description: "Stay ahead of the curve with our latest collection of new arrivals. Discover fresh styles, innovative products, and the newest trends first.",
};

// Mock categories data
const categories = [
    { id: "1", name: "Clothing", slug: "clothing" },
    { id: "2", name: "Accessories", slug: "accessories" },
    { id: "3", name: "Electronics", slug: "electronics" },
    { id: "4", name: "Home", slug: "home" },
    { id: "5", name: "Beauty", slug: "beauty" }
];

export default function NewProductsPage({
    searchParams,
}: {
    searchParams: ProductSearchParams;
}) {
    // Add parameters to filter for new products
    const newProductsSearchParams: ProductSearchParams = {
        ...searchParams,
        newArrivals: "true",
    };

    // Extract search params for ProductSort component
    const sort = typeof searchParams.sort === 'string' ? searchParams.sort : undefined;

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header Section */}
            <div className="text-center mb-12">
                <h1 className="text-3xl sm:text-4xl font-bold mb-4">New Arrivals</h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Stay ahead of the curve with our latest collection of new arrivals. Discover fresh styles, innovative products, and the newest trends first.
                </p>
            </div>

            {/* New Arrivals Banner */}
            <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 mb-12">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="relative px-6 py-16 sm:px-12 sm:py-24 text-center text-white">
                    <div className="flex items-center justify-center mb-4">
                        <Clock className="h-8 w-8 mr-2" />
                        <h2 className="text-xl sm:text-2xl font-bold">Just Dropped This Week</h2>
                    </div>
                    <p className="max-w-2xl mx-auto text-lg mb-6">
                        Be the first to shop our freshest styles and latest innovations. New products added daily.
                    </p>
                    <Button size="lg" variant="secondary" className="mt-4">
                        Set Notifications <Bell className="ml-2 h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Product Grid with Filters */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Filters - Desktop */}
                <div className="hidden lg:block">
                    <div className="sticky top-24">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filters
                        </h2>
                        <ProductFilters
                            categories={categories}
                            selectedCategory={typeof searchParams.category === 'string' ? searchParams.category : undefined}
                            minPrice={typeof searchParams.minPrice === 'string' ? searchParams.minPrice : undefined}
                            maxPrice={typeof searchParams.maxPrice === 'string' ? searchParams.maxPrice : undefined}
                        />
                    </div>
                </div>

                {/* Products */}
                <div className="lg:col-span-3">
                    {/* Mobile Filter and Sort */}
                    <div className="flex justify-between items-center mb-6 lg:mb-8">
                        <div className="lg:hidden">
                            <Button variant="outline" size="sm" className="flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                Filters
                            </Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Sort by:</span>
                            <ProductSort sort={sort} defaultSort="newest" />
                        </div>
                    </div>

                    {/* Product List */}
                    <ProductList searchParams={newProductsSearchParams} />
                </div>
            </div>
        </div>
    );
}