import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import ProductList from "@/components/product/product-list";
import ProductFilters from "@/components/product/product-filters";
import ProductSort from "@/components/product/product-sort";
import { Loader2 } from "lucide-react";

// Default values for pagination and filtering
const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 12;

export interface ProductSearchParams {
    page?: string;
    perPage?: string;
    sort?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    search?: string;
    featured?: string;
    newArrivals?: string;
    sale?: string;
}

export default async function ShopPage({
    searchParams,
}: {
    searchParams: ProductSearchParams;
}) {    // Get all categories for filter sidebar
    const categories = await db.category.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true, parentId: true },
    });

    // Await searchParams before accessing its properties
    const searchParamsObject = await searchParams;

    // Extract search params safely after awaiting them
    const category = typeof searchParamsObject.category === 'string' ? searchParamsObject.category : '';
    const minPrice = typeof searchParamsObject.minPrice === 'string' ? searchParamsObject.minPrice : '';
    const maxPrice = typeof searchParamsObject.maxPrice === 'string' ? searchParamsObject.maxPrice : '';
    const sort = typeof searchParamsObject.sort === 'string' ? searchParamsObject.sort : '';
    const page = typeof searchParamsObject.page === 'string' ? searchParamsObject.page : '1';
    const perPage = typeof searchParamsObject.perPage === 'string' ? searchParamsObject.perPage : '12';
    const search = typeof searchParamsObject.search === 'string' ? searchParamsObject.search : '';
    const featured = typeof searchParamsObject.featured === 'string' ? searchParamsObject.featured : '';

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Shop Our Products</h1>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Filters Sidebar */}
                <div className="w-full md:w-64 flex-shrink-0">
                    <ProductFilters
                        categories={categories}
                        selectedCategory={category}
                        minPrice={minPrice}
                        maxPrice={maxPrice}
                    />
                </div>

                {/* Products */}
                <div className="flex-grow">
                    {/* Sorting and Results Count */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                        <ProductSort
                            sort={sort}
                            defaultSort="newest"
                        />

                        <Suspense fallback={
                            <div className="text-sm text-gray-500 flex items-center">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading...
                            </div>
                        }>
                            <ProductResults searchParams={{
                                category,
                                minPrice,
                                maxPrice,
                                sort,
                                search,
                                featured
                            }} />
                        </Suspense>
                    </div>

                    {/* Product Grid */}
                    <Suspense
                        fallback={
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {Array.from({ length: DEFAULT_PER_PAGE }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm"
                                    >
                                        <div className="h-64 bg-gray-100 animate-pulse" />
                                        <div className="p-4">
                                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4 animate-pulse"></div>
                                            <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        }
                    >
                        <ProductList searchParams={{
                            page,
                            perPage,
                            category,
                            minPrice,
                            maxPrice,
                            sort,
                            search,
                            featured
                        }} />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}

// Component to display result count
async function ProductResults({
    searchParams,
}: {
    searchParams: ProductSearchParams;
}) {
    // Await searchParams before using it
    const searchParamsObject = await searchParams;
    const { count } = await getProductCount(searchParamsObject);
    return (
        <div className="text-sm text-gray-500">
            Showing <span className="font-medium">{count}</span> products
        </div>
    );
}

// Helper function to get product count
async function getProductCount(searchParams: ProductSearchParams) {
    // Await searchParams before accessing its properties
    const searchParamsObject = await searchParams;

    const category = searchParamsObject.category;
    const minPrice = searchParamsObject.minPrice;
    const maxPrice = searchParamsObject.maxPrice;
    const search = searchParamsObject.search;
    const featured = searchParamsObject.featured;

    // Build where clause
    const where: any = {
        isPublished: true,
    };

    // Apply category filter
    if (category) {
        where.category = {
            slug: category,
        };
    }

    // Apply price filter
    if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price.gte = parseFloat(minPrice);
        if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    // Apply search filter
    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
        ];
    }

    // Apply featured filter
    if (featured === "true") {
        where.isFeatured = true;
    }

    // Get count
    const count = await db.product.count({ where });

    return { count };
}