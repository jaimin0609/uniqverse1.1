"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientPrice } from "@/components/ui/client-price";
import { WishlistButton } from "@/components/product/wishlist-button";
import { QuickAddToCart } from "@/components/product/quick-add-to-cart";

interface Product {
    id: string;
    name: string;
    slug: string;
    price: number;
    category?: { name: string } | null;
    images: { url: string }[];
}

interface PaginationInfo {
    page: number;
    limit: number;
    totalCount: number;
    hasMore: boolean;
}

interface InfiniteProductsProps {
    initialProducts: Product[];
    className?: string;
}

export function InfiniteProducts({ initialProducts, className = "" }: InfiniteProductsProps) {
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [loading, setLoading] = useState(false);
    const [initialized, setInitialized] = useState(false); const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1, // Start at page 1 since we already have the first page of data
        limit: 8,
        totalCount: initialProducts.length > 0 ? Math.max(initialProducts.length * 2, 20) : 0, // Estimate total count
        hasMore: initialProducts.length >= 8 // If we have a full initial page, assume there are more
    }); const [error, setError] = useState<string | null>(null);

    const fetchInProgress = useRef(false);
    const loaderRef = useRef<HTMLDivElement>(null);    // Initialize component on first render
    useEffect(() => {
        if (!initialized && initialProducts.length > 0) {
            // If we received initial products, update our state and set hasMore based on actual count
            setInitialized(true);
            setPagination(prev => ({
                ...prev,
                hasMore: initialProducts.length === prev.limit // Only hasMore if we got a full page
            }));
        }
    }, [initialized, initialProducts]);// Function to fetch more products
    const fetchMoreProducts = async () => {
        // Prevent multiple simultaneous fetches
        if (loading || !pagination.hasMore || fetchInProgress.current) return;

        fetchInProgress.current = true;
        setLoading(true);
        setError(null);

        try {
            const nextPage = pagination.page + 1;
            const response = await fetch(`/api/products/featured-products?page=${nextPage}&limit=${pagination.limit}`); if (!response.ok) {
                throw new Error("Failed to fetch products");
            }

            const data = await response.json();            // Only add products if we got new ones
            if (data.products && data.products.length > 0) {
                setProducts(prev => {
                    // Create a Set of existing product IDs to check for duplicates
                    const existingIds = new Set(prev.map(p => p.id));
                    // Filter out any products that already exist
                    const newProducts = data.products.filter((product: Product) => !existingIds.has(product.id));

                    // If no new products after filtering, we've reached the end
                    if (newProducts.length === 0) {
                        setPagination(prevPag => ({ ...prevPag, hasMore: false }));
                        return prev;
                    }

                    return [...prev, ...newProducts];
                });
                setPagination(data.pagination);
            } else {
                // No more products to fetch
                setPagination(prev => ({ ...prev, hasMore: false }));
            }
        } catch (error) {
            console.error("Error fetching more products:", error);
            setError("Failed to load more products. Please try again later.");
        } finally {
            setLoading(false);
            // Add a small delay before allowing another fetch
            setTimeout(() => {
                fetchInProgress.current = false;
            }, 500);
        }
    };    // Set up intersection observer for infinite scrolling with debounce
    useEffect(() => {
        let timeout: NodeJS.Timeout;
        let observer: IntersectionObserver;

        const observerCallback = (entries: IntersectionObserverEntry[]) => {
            const target = entries[0];
            // Clear any previous timeout to prevent rapid multiple calls
            if (timeout) clearTimeout(timeout);

            if (target.isIntersecting && pagination.hasMore && !loading && !fetchInProgress.current) {
                // Add a small delay to avoid multiple rapid fetches
                timeout = setTimeout(() => {
                    fetchMoreProducts();
                }, 300);
            }
        };

        observer = new IntersectionObserver(observerCallback, {
            threshold: 0.1,
            rootMargin: "200px" // Load a bit earlier before reaching the bottom
        });

        if (loaderRef.current) {
            observer.observe(loaderRef.current);
        }

        return () => {
            if (observer) {
                observer.disconnect();
            }
            if (timeout) {
                clearTimeout(timeout);
            }
        };
    }, [pagination.hasMore, loading]);

    return (<div className={className}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product, index) => (
                <div
                    key={`${product.id}-${index}`} // Use index to ensure unique keys even if IDs somehow duplicate
                    className="group relative bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                    <Link
                        href={`/products/${product.slug}`}
                        className="block"
                    >
                        <div className="relative h-64">
                            <Image
                                src={product.images[0]?.url || '/placeholder-product.jpg'}
                                alt={product.name}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />

                            {/* Action buttons */}
                            <div className="absolute top-2 right-2 flex flex-col gap-2">
                                <WishlistButton
                                    productId={product.id}
                                    productName={product.name}
                                    small
                                />
                            </div>

                            {/* Quick add to cart button */}
                            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">                                <QuickAddToCart
                                productId={product.id}
                                productSlug={product.slug} // Added slug for proper cart URLs
                                productName={product.name}
                                productPrice={Number(product.price)}
                                productImage={product.images[0]?.url || ''}
                                small
                            />
                            </div>
                        </div>
                    </Link>
                    <div className="p-4">
                        <Link href={`/products/${product.slug}`}>
                            <h3 className="font-medium text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{product.name}</h3>
                        </Link>
                        <p className="text-gray-500 text-sm mb-2">{product.category?.name || 'Uncategorized'}</p>
                        <p className="text-lg font-semibold"><ClientPrice amount={Number(product.price)} /></p>
                    </div>
                </div>
            ))}
        </div>            {/* Error message */}
        {error && (
            <div className="mt-8 text-center py-4 text-red-600">
                {error}
                <button
                    onClick={() => { setError(null); fetchMoreProducts(); }}
                    className="ml-2 underline hover:text-red-800"
                >
                    Try again
                </button>
            </div>
        )}

        {/* Loading indicator and loader reference */}
        <div ref={loaderRef} className="mt-8 flex justify-center">
            {loading && (
                <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                    <span>Loading more products...</span>
                </div>
            )}
        </div>

        {/* Show the "View All Products" button when we've loaded all featured products */}
        {(!pagination.hasMore && !loading && products.length > 0) && (
            <div className="mt-8 flex justify-center">
                <Button asChild className="px-8">
                    <Link href="/shop" className="flex items-center">
                        View All Products <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
        )}
    </div>
    );
}
