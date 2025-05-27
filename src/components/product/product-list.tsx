import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { formatCurrency } from "@/utils/format";
import { PaginationComponent } from "@/components/ui/pagination";
import { QuickAddToCart } from "@/components/product/quick-add-to-cart";
import { WishlistButton } from "@/components/product/wishlist-button";
import { ClientPrice } from "@/components/ui/client-price";
import { StarRating } from "@/components/ui/star-rating";
import type { ProductSearchParams } from "@/app/shop/page";

// Default values for pagination
const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 12;

export default async function ProductList({
    searchParams,
    basePath,
}: {
    searchParams: Record<string, string | string[] | undefined>;
    basePath?: string;
}) {
    // Determine the appropriate basePath based on search params if not explicitly provided
    let determinedBasePath = basePath || "/shop";

    if (!basePath) {
        if (searchParams.newArrivals === "true") {
            determinedBasePath = "/shop/new";
        } else if (searchParams.featured === "true") {
            determinedBasePath = "/shop/featured";
        } else if (searchParams.sale === "true") {
            determinedBasePath = "/shop/sale";
        }
    }

    const { products, totalPages, currentPage } = await getProducts(searchParams);

    if (products.length === 0) {
        return (
            <div className="text-center py-12">
                <h3 className="text-xl font-medium mb-2">No products found</h3>
                <p className="text-gray-500">Try adjusting your filters to find what you're looking for.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Product Grid - Adjusted to 5 columns on XL screens, 4 on large, 3 on medium, 2 on small */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {products.map((product) => (
                    <div key={product.id} className="group relative bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        {/* Discount Badge - Moved to top left and styled like in the screenshot */}
                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                            <div className="absolute top-2 left-2 z-10">
                                <span className="text-xs font-medium px-2 py-1 bg-red-600 text-white rounded-sm">
                                    {Math.round((1 - product.price / product.compareAtPrice) * 100)}% OFF
                                </span>
                            </div>
                        )}

                        <Link
                            href={`/products/${product.slug}`}
                            className="block"
                        >
                            <div className="aspect-square relative overflow-hidden bg-gray-100">
                                {product.images[0]?.url ? (
                                    <Image
                                        src={product.images[0].url}
                                        alt={product.name}
                                        fill
                                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400">
                                        No image
                                    </div>
                                )}

                                {/* Action buttons */}
                                <div className="absolute top-2 right-2 flex flex-col gap-2">
                                    <WishlistButton
                                        productId={product.id}
                                        productName={product.name}
                                        small
                                    />
                                </div>

                                {/* Quick add to cart button */}
                                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <QuickAddToCart
                                        productId={product.id}
                                        productName={product.name}
                                        productPrice={product.price}
                                        productImage={product.images[0]?.url || ''}
                                        small
                                    />
                                </div>
                            </div>
                            <div className="p-3">
                                <h3 className="text-sm font-medium text-gray-900 line-clamp-1 group-hover:text-blue-600">
                                    {product.name}
                                </h3>
                                <p className="mt-1 text-xs text-gray-500 line-clamp-1">
                                    {product.category.name}
                                </p>

                                {/* Star Rating - Display only if product has reviews */}
                                {product._count?.reviews > 0 && product.avgRating && (
                                    <div className="mt-1">
                                        <StarRating
                                            rating={product.avgRating}
                                            reviewCount={product._count.reviews}
                                            className="text-sm"
                                        />
                                    </div>
                                )}

                                {/* Price Display - Modified to show discount properly */}
                                <div className="mt-2 flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-gray-900">
                                            <ClientPrice amount={product.price} />
                                        </p>

                                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                                            <p className="text-sm text-gray-500 line-through">
                                                <ClientPrice amount={product.compareAtPrice} />
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>            {/* Pagination */}
            {totalPages > 1 && (
                <PaginationComponent
                    totalPages={totalPages}
                    currentPage={currentPage}
                    searchParams={Object.fromEntries(
                        Object.entries(searchParams || {})
                            .filter(([_, value]) => value !== undefined)
                            .map(([key, value]) => [
                                key,
                                Array.isArray(value) ? value[0] : value
                            ])
                            .filter(([_, value]) => value !== undefined)
                    ) as Record<string, string | string[]>}
                    basePath={determinedBasePath}
                />
            )}
        </div>
    );
}

// Helper function to get products based on search params
async function getProducts(searchParams: Record<string, string | string[] | undefined>) {
    // Extract string parameters with appropriate type checking
    const extractStringParam = (key: string): string | undefined => {
        const value = searchParams[key];
        return typeof value === 'string' ? value : undefined;
    };

    // Get pagination params with defaults
    const page = extractStringParam('page') || DEFAULT_PAGE.toString();
    const perPage = extractStringParam('perPage') || DEFAULT_PER_PAGE.toString();
    const category = extractStringParam('category');
    const featured = extractStringParam('featured');
    const newArrivals = extractStringParam('newArrivals');
    const sale = extractStringParam('sale');
    const minPrice = extractStringParam('minPrice');
    const maxPrice = extractStringParam('maxPrice');
    const search = extractStringParam('search');
    const sort = extractStringParam('sort');
    const minDiscount = extractStringParam('minDiscount');
    const maxDiscount = extractStringParam('maxDiscount');

    // Parse pagination params
    const currentPage = parseInt(page) || DEFAULT_PAGE;
    const productsPerPage = parseInt(perPage) || DEFAULT_PER_PAGE;
    const skip = (currentPage - 1) * productsPerPage;

    // Build where clause
    const where: any = {
        isPublished: true,
    };    // Apply category filter
    if (category) {
        // First, get the selected category and its subcategories
        const selectedCategory = await db.category.findUnique({
            where: { slug: category },
            include: {
                children: {
                    select: { id: true }
                }
            }
        });

        if (selectedCategory) {
            if (selectedCategory.children.length > 0) {
                // If the category has subcategories, include products from all subcategories
                where.OR = [
                    // Include products directly in this category
                    { categoryId: selectedCategory.id },
                    // Include products in any subcategory
                    { category: { parentId: selectedCategory.id } }
                ];
            } else {
                // If no subcategories, just filter by the specific category
                where.category = { slug: category };
            }
        } else {
            // Fallback to direct category match if category not found
            where.category = { slug: category };
        }
    }

    // Apply featured filter
    if (featured === "true") {
        where.isFeatured = true;
    }

    // Apply newArrivals filter
    if (newArrivals === "true") {
        // Filter for products created in the last 30 days
        where.createdAt = {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        };
    }

    // Apply sale filter
    if (sale === "true") {
        where.compareAtPrice = {
            not: null,
            gt: 0
        };
        // Product is on sale when compareAtPrice > price
        where.price = {
            lt: { compareAtPrice: true }
        };
    }

    // Apply price filter
    if (minPrice || maxPrice) {
        where.price = where.price || {};
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

    // Determine sort order
    let orderBy: any = { createdAt: "desc" };

    if (sort === "price-asc") {
        orderBy = { price: "asc" };
    } else if (sort === "price-desc") {
        orderBy = { price: "desc" };
    } else if (sort === "name-asc") {
        orderBy = { name: "asc" };
    } else if (sort === "name-desc") {
        orderBy = { name: "desc" };
    } else if (sort === "oldest") {
        orderBy = { createdAt: "asc" };
    }

    // Special case for featured products - order by featuredOrder if available
    if (featured === "true" && !sort) {
        orderBy = [
            { featuredOrder: "asc" },
            { createdAt: "desc" }
        ];
    }

    // Get products with review data
    const products = await db.product.findMany({
        where,
        orderBy,
        skip,
        take: productsPerPage,
        select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            compareAtPrice: true,
            images: {
                where: { position: 0 },
                take: 1,
            },
            category: {
                select: {
                    name: true,
                },
            },
            // Add review data
            _count: {
                select: {
                    reviews: {
                        where: {
                            status: 'APPROVED' // Only count approved reviews
                        }
                    }
                }
            },
            // Calculate average rating using aggregation
            reviews: {
                where: {
                    status: 'APPROVED' // Only include approved reviews
                },
                select: {
                    rating: true,
                },
            }
        },
    });

    // Calculate average rating for each product
    const productsWithAvgRating = products.map(product => {
        let avgRating: number | null = null;
        if (product.reviews.length > 0) {
            const sum = product.reviews.reduce((total, review) => total + review.rating, 0);
            avgRating = sum / product.reviews.length;
        }
        // Remove the full reviews array as we only need the count and average
        const { reviews, ...rest } = product;
        return { ...rest, avgRating };
    });

    // Apply discount percentage filtering in memory if needed
    let filteredProducts = productsWithAvgRating;

    // Check if we should filter by discount percentage
    const shouldFilterByDiscount = sale === "true" && (minDiscount || maxDiscount);

    if (shouldFilterByDiscount) {
        filteredProducts = productsWithAvgRating.filter(product => {
            // Skip products without valid compareAtPrice
            if (!product.compareAtPrice || product.compareAtPrice <= product.price) {
                return false; // Not on sale
            }

            // Calculate discount percentage
            const discountPercentage = Math.round((1 - product.price / product.compareAtPrice) * 100);

            // Apply minimum discount filter if present
            if (minDiscount && discountPercentage < parseFloat(minDiscount)) {
                return false;
            }

            // Apply maximum discount filter if present
            if (maxDiscount && discountPercentage > parseFloat(maxDiscount)) {
                return false;
            }

            return true;
        });
    }

    // Get total count for either all matching products or the filtered subset
    const totalCount = shouldFilterByDiscount
        ? filteredProducts.length
        : await db.product.count({ where });

    const totalPages = Math.ceil(totalCount / productsPerPage);

    // If we're doing in-memory filtering for discounts, we need to handle pagination manually
    if (shouldFilterByDiscount) {
        // Apply pagination to the filtered results
        const start = (currentPage - 1) * productsPerPage;
        const end = start + productsPerPage;
        filteredProducts = filteredProducts.slice(start, end);
    }

    return {
        products: filteredProducts,
        totalPages,
        currentPage,
    };
}