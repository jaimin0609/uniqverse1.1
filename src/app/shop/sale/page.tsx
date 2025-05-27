import { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Star, Filter, Sparkles, Percent, Tag, Clock } from "lucide-react";
import ProductList from "@/components/product/product-list";
import ProductFilters from "@/components/product/product-filters";
import ProductSort from "@/components/product/product-sort";
import type { ProductSearchParams } from "@/app/shop/page";
import DiscountLevelFilter from "@/components/product/discount-level-filter";

export const metadata: Metadata = {
    title: "Sale Items | UniQVerse",
    description: "Save big on our limited-time sale items. Discover great deals and discounts across our collection of quality products.",
};

export default async function SaleItemsPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {    // Fetch all categories for filter sidebar
    const categories = await db.category.findMany({
        orderBy: {
            name: 'asc'
        },
        select: { id: true, name: true, slug: true, parentId: true },
    });    // Add parameters to filter for sale items
    // Create a serializable copy of the search params
    const serializedSearchParams: Record<string, string | string[]> = {};

    // Only copy over the values that exist
    for (const [key, value] of Object.entries(searchParams)) {
        if (value !== undefined) {
            serializedSearchParams[key] = value;
        }
    }

    const saleSearchParams = {
        ...serializedSearchParams,
        sale: "true",
    };

    // Default sort option
    const defaultSort = "featured";

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header Section */}
            <div className="text-center mb-12">
                <div className="inline-block p-3 bg-red-100 rounded-full mb-4">
                    <Percent className="h-8 w-8 text-red-600" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">Sale Items</h1>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    Limited-time offers on select products. Save big on quality items across all categories.
                </p>
            </div>

            {/* Sale Banner */}
            <div className="relative rounded-lg overflow-hidden bg-gradient-to-r from-red-600 to-orange-500 mb-12">
                <div className="absolute inset-0 bg-black opacity-30"></div>
                <div className="relative z-10 px-6 py-16 sm:px-12 sm:py-24 lg:py-32 lg:px-16 text-center">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">End of Season Sale</h2>
                    <p className="text-lg text-white/90 max-w-2xl mx-auto mb-8">
                        Up to 50% off selected items. Limited stock available - shop now before they're gone!
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                        <Button size="lg" variant="secondary" className="bg-white text-red-600 hover:bg-gray-100">
                            Shop All Sale Items
                        </Button>
                        <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10" asChild>
                            <Link href="/shop">View All Products</Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Countdown Timer (static version for demo) */}
            <div className="bg-gray-50 rounded-lg p-6 mb-12 text-center">
                <h3 className="font-semibold text-lg mb-2">Limited Time Sale Ends In:</h3>
                <div className="flex justify-center items-center gap-4 my-4">
                    <div className="bg-white rounded-lg px-4 py-3 shadow-sm">
                        <div className="text-2xl font-bold">2</div>
                        <div className="text-xs text-gray-500">Days</div>
                    </div>
                    <div className="text-xl font-bold">:</div>
                    <div className="bg-white rounded-lg px-4 py-3 shadow-sm">
                        <div className="text-2xl font-bold">15</div>
                        <div className="text-xs text-gray-500">Hours</div>
                    </div>
                    <div className="text-xl font-bold">:</div>
                    <div className="bg-white rounded-lg px-4 py-3 shadow-sm">
                        <div className="text-2xl font-bold">43</div>
                        <div className="text-xs text-gray-500">Minutes</div>
                    </div>
                    <div className="text-xl font-bold">:</div>
                    <div className="bg-white rounded-lg px-4 py-3 shadow-sm">
                        <div className="text-2xl font-bold">22</div>
                        <div className="text-xs text-gray-500">Seconds</div>
                    </div>
                </div>
                <p className="text-sm text-gray-600">
                    Don't miss out! Shop our sale before time runs out.
                </p>
            </div>

            {/* Quick Discount Categories */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                <Link
                    href="/shop?sale=true&minDiscount=10&maxDiscount=20"
                    className="flex flex-col items-center justify-center py-6 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow"
                >
                    <span className="text-xl font-bold text-red-600">10-20% OFF</span>
                    <span className="text-sm text-gray-600 mt-1">Good Deals</span>
                </Link>
                <Link
                    href="/shop?sale=true&minDiscount=20&maxDiscount=30"
                    className="flex flex-col items-center justify-center py-6 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow"
                >
                    <span className="text-xl font-bold text-red-600">20-30% OFF</span>
                    <span className="text-sm text-gray-600 mt-1">Great Deals</span>
                </Link>
                <Link
                    href="/shop?sale=true&minDiscount=30&maxDiscount=40"
                    className="flex flex-col items-center justify-center py-6 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow"
                >
                    <span className="text-xl font-bold text-red-600">30-40% OFF</span>
                    <span className="text-sm text-gray-600 mt-1">Amazing Deals</span>
                </Link>
                <Link
                    href="/shop?sale=true&minDiscount=40"
                    className="flex flex-col items-center justify-center py-6 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow"
                >
                    <span className="text-xl font-bold text-red-600">40%+ OFF</span>
                    <span className="text-sm text-gray-600 mt-1">Best Deals</span>
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
                        <ProductFilters
                            categories={categories} selectedCategory={typeof serializedSearchParams.category === 'string' ? serializedSearchParams.category : undefined}
                            minPrice={typeof serializedSearchParams.minPrice === 'string' ? serializedSearchParams.minPrice : undefined}
                            maxPrice={typeof serializedSearchParams.maxPrice === 'string' ? serializedSearchParams.maxPrice : undefined}
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
                            <ProductSort sort={typeof serializedSearchParams.sort === 'string' ? serializedSearchParams.sort : undefined} defaultSort={defaultSort} />
                        </div>
                    </div>                    {/* Discount Level Filter */}
                    <DiscountLevelFilter />

                    {/* Product List */}
                    <ProductList searchParams={saleSearchParams} />
                </div>
            </div>

            {/* Sale Information */}
            <div className="mt-16 bg-gray-50 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-center mb-8">Sale Information</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <div className="inline-flex p-3 bg-red-100 rounded-full mb-4">
                            <Tag className="h-6 w-6 text-red-600" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Sale Terms</h3>
                        <p className="text-gray-600">
                            Sale prices are as marked. Discounts are applied automatically at checkout. Cannot be combined with other promotional offers.
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <div className="inline-flex p-3 bg-red-100 rounded-full mb-4">
                            <Clock className="h-6 w-6 text-red-600" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Limited Time</h3>
                        <p className="text-gray-600">
                            All sale prices are valid until the end of the sale period or while stocks last. Don't miss out on these limited-time offers.
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <div className="inline-flex p-3 bg-red-100 rounded-full mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                <line x1="1" y1="10" x2="23" y2="10"></line>
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Returns Policy</h3>
                        <p className="text-gray-600">
                            All sale items are eligible for return under our standard return policy. See our{" "}
                            <Link href="/returns" className="text-red-600 hover:underline">
                                returns page
                            </Link>{" "}
                            for more details.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}