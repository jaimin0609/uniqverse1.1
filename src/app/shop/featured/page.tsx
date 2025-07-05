import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Star, Filter, Sparkles } from "lucide-react";
import ProductList from "@/components/product/product-list";
import ProductFilters from "@/components/product/product-filters";
import ProductSort from "@/components/product/product-sort";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: "Featured Products | UniQVerse",
    description: "Discover our handpicked selection of featured products. Premium quality, exceptional value, and customer favorites all in one place.",
};

import { db } from "@/lib/db";

export default async function FeaturedProductsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    // Resolve the searchParams promise
    const resolvedSearchParams = await searchParams;

    // Fetch all categories for filter sidebar
    const categories = await db.category.findMany({
        orderBy: {
            name: 'asc'
        },
        select: { id: true, name: true, slug: true, parentId: true },
    });    // Add parameters to filter for featured products
    // Create a serializable copy of the search params
    const serializedSearchParams: Record<string, string | string[]> = {};    // Only copy over the values that exist
    for (const [key, value] of Object.entries(resolvedSearchParams)) {
        if (value !== undefined) {
            serializedSearchParams[key] = value;
        }
    }

    // Add the featured parameter
    const featuredSearchParams = {
        ...serializedSearchParams,
        featured: "true",
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header Section */}
            <div className="text-center mb-12">
                <div className="inline-block p-3 bg-purple-100 rounded-full mb-4">
                    <Star className="h-8 w-8 text-purple-600" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">Featured Products</h1>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    Our handpicked selection of premium products, bestsellers, and customer favorites
                    all in one place. Discover what makes these items special.
                </p>
            </div>

            {/* Featured Collections Banner */}
            <div className="relative rounded-lg overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-500 mb-12">
                <div className="absolute inset-0 bg-black opacity-30"></div>
                <div className="relative z-10 px-6 py-16 sm:px-12 sm:py-24 lg:py-32 lg:px-16 text-center">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Discover Our Collections</h2>
                    <p className="text-lg text-white/90 max-w-2xl mx-auto mb-8">
                        Each featured item has been carefully selected for its quality, design, and value.
                        Explore our collections and find your new favorites.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                        <Button size="lg" variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100">
                            Shop All Featured
                        </Button>
                        <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10" asChild>
                            <Link href="/shop">View All Products</Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Featured Categories */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                <Link
                    href="/shop?category=premium"
                    className="flex flex-col items-center justify-center py-6 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow"
                >
                    <div className="rounded-full bg-purple-100 p-3 mb-3">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                    </div>
                    <span className="font-medium">Premium</span>
                </Link>
                <Link
                    href="/shop?tag=bestseller"
                    className="flex flex-col items-center justify-center py-6 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow"
                >
                    <div className="rounded-full bg-purple-100 p-3 mb-3">
                        <Star className="h-5 w-5 text-purple-600" />
                    </div>
                    <span className="font-medium">Bestsellers</span>
                </Link>
                <Link
                    href="/shop/new"
                    className="flex flex-col items-center justify-center py-6 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow"
                >
                    <div className="rounded-full bg-purple-100 p-3 mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
                        </svg>
                    </div>
                    <span className="font-medium">New Arrivals</span>
                </Link>
                <Link
                    href="/shop?rating=5"
                    className="flex flex-col items-center justify-center py-6 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow"
                >
                    <div className="rounded-full bg-purple-100 p-3 mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                    </div>
                    <span className="font-medium">Top Rated</span>
                </Link>
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
                        <ProductFilters categories={categories} />
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
                            <ProductSort defaultSort="newest" />
                        </div>
                    </div>

                    {/* Collection Filter */}
                    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                        <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Collections:</span>
                        <div className="flex space-x-2">
                            <Button variant="outline" size="sm" className="bg-purple-50 text-purple-600 whitespace-nowrap">
                                All Featured
                            </Button>
                            <Button variant="outline" size="sm" className="whitespace-nowrap">
                                Premium
                            </Button>
                            <Button variant="outline" size="sm" className="whitespace-nowrap">
                                Bestsellers
                            </Button>
                            <Button variant="outline" size="sm" className="whitespace-nowrap">
                                Top Rated
                            </Button>
                        </div>
                    </div>

                    {/* Product List */}
                    <ProductList searchParams={featuredSearchParams} />
                </div>
            </div>

            {/* Why Featured Section */}
            <div className="mt-16 bg-gray-50 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-center mb-8">Why Shop Featured Products</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <div className="inline-flex p-3 bg-purple-100 rounded-full mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Quality Assured</h3>
                        <p className="text-gray-600">
                            Every featured product has undergone rigorous quality checks to ensure it meets our high standards. We stand behind each item.
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <div className="inline-flex p-3 bg-purple-100 rounded-full mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Customer Favorites</h3>
                        <p className="text-gray-600">
                            These products have earned their featured status through positive customer feedback, reviews, and consistent popularity.
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <div className="inline-flex p-3 bg-purple-100 rounded-full mb-4">
                            <Star className="h-6 w-6 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Exceptional Value</h3>
                        <p className="text-gray-600">
                            Featured products represent the best balance of quality, features, and price. Discover items that offer exceptional value.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}