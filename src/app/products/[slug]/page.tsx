import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, Check, Info, Truck } from 'lucide-react';
import { AddToCart } from '@/components/product/add-to-cart';
import { WishlistButton } from '@/components/product/wishlist-button';
import { ProductImageGallery } from '@/components/product/product-image-gallery';
import { Metadata } from 'next';

// Define params type - using 'any' to bypass strict type checking
type Params = { params: any }

// Generate metadata for the page
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    // Making sure we have the slug value available
    const slug = await params.slug;
    const product = await getProduct(slug);

    if (!product) {
        return {
            title: 'Product Not Found',
        };
    }

    // Extract text description for metadata (strip HTML)
    const plainDescription = product.description
        ? product.description.replace(/<[^>]*>/g, '')
        : '';

    return {
        title: product.name,
        description: plainDescription.substring(0, 160) || `${product.name} - Shop now at UniQVerse`,
        openGraph: {
            title: product.name,
            description: plainDescription.substring(0, 160) || `${product.name} - Shop now at UniQVerse`,
            images: product.images[0]?.url ? [product.images[0].url] : [],
        },
    };
}

// Function to get product data from the database
async function getProduct(slug: string) {
    const product = await db.product.findUnique({
        where: {
            slug,
        },
        include: {
            images: {
                orderBy: {
                    position: 'asc',
                },
            },
            category: true,
            variants: true,
            reviews: {
                where: {
                    status: 'APPROVED',
                },
                include: {
                    user: {
                        select: {
                            name: true,
                            image: true,
                        },
                    },
                },
            },
        },
    });

    if (!product) return null;

    return product;
}

// Function to get related products
async function getRelatedProducts(productId: string, categoryId: string | null, limit: number = 10) {
    // Get products in the same category, excluding the current product
    const relatedProducts = await db.product.findMany({
        where: {
            id: { not: productId },
            ...(categoryId ? { categoryId } : {}),
            isPublished: true,
        },
        include: {
            images: {
                take: 1,
                orderBy: {
                    position: 'asc',
                },
            },
            category: {
                select: {
                    name: true,
                    slug: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: limit,
    });

    // If we didn't get enough products, fetch some recent products regardless of category
    if (relatedProducts.length < limit) {
        const additionalProducts = await db.product.findMany({
            where: {
                isPublished: true,
                // Exclude the current product and already found related products
                id: {
                    not: productId,
                    notIn: relatedProducts.map(p => p.id)
                },
            },
            include: {
                images: {
                    take: 1,
                    orderBy: {
                        position: 'asc',
                    },
                },
                category: {
                    select: {
                        name: true,
                        slug: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: limit - relatedProducts.length,
        });

        return [...relatedProducts, ...additionalProducts];
    }

    return relatedProducts;
}

// Product Detail Page Component
export default async function ProductPage({ params }: { params: { slug: string } }) {
    // Extract slug from params to avoid the syncing issue
    const slug = await params.slug;
    const product = await getProduct(slug);

    if (!product) {
        notFound();
    }

    // Calculate average rating
    const averageRating = product.reviews.length
        ? Math.round(product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length * 10) / 10
        : 0;    // Get main product image or placeholder
    const mainImage = product.images[0]?.url || '/placeholder-product.jpg';

    // Get related products - ensure we get 10 products
    const relatedProducts = await getRelatedProducts(product.id, product.categoryId, 10);

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Breadcrumb Navigation */}
            <nav className="flex mb-8 text-sm">
                <ol className="flex items-center space-x-2">
                    <li>
                        <Link href="/" className="text-gray-500 hover:text-gray-900">Home</Link>
                    </li>
                    <li className="text-gray-500">/</li>
                    <li>
                        <Link href="/shop" className="text-gray-500 hover:text-gray-900">Shop</Link>
                    </li>
                    {product.category && (
                        <>
                            <li className="text-gray-500">/</li>
                            <li>
                                <Link href={`/shop/categories/${product.category.slug}`} className="text-gray-500 hover:text-gray-900">
                                    {product.category.name}
                                </Link>
                            </li>
                        </>
                    )}
                    <li className="text-gray-500">/</li>
                    <li className="text-gray-900 font-medium">{product.name}</li>
                </ol>
            </nav>

            {/* Back Button */}
            <div className="mb-6">
                <Link href="/shop" className="inline-flex items-center text-blue-600 hover:text-blue-800">
                    <ArrowLeft size={16} className="mr-1" />
                    Back to Shop
                </Link>
            </div>

            {/* Product Info Section */}
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">                {/* Product Images */}
                <ProductImageGallery images={product.images} productName={product.name} />

                {/* Product Details */}
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
                        <div className="flex items-center space-x-4">
                            {/* Rating */}
                            <div className="flex items-center">
                                <div className="flex items-center mr-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            size={16}
                                            fill={star <= Math.round(averageRating) ? "currentColor" : "none"}
                                            className={star <= Math.round(averageRating) ? "text-yellow-400" : "text-gray-300"}
                                        />
                                    ))}
                                </div>
                                <span className="text-sm text-gray-600">
                                    {averageRating} ({product.reviews.length} reviews)
                                </span>
                            </div>

                            {/* Stock Status */}
                            {product.inventory > 0 ? (
                                <span className="inline-flex items-center text-sm text-green-600">
                                    <Check size={16} className="mr-1" /> In Stock
                                </span>
                            ) : (
                                <span className="inline-flex items-center text-sm text-red-600">
                                    <Info size={16} className="mr-1" /> Out of Stock
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Price */}
                    <div className="space-y-1">
                        <div className="flex items-center">
                            {product.compareAtPrice && (
                                <span className="text-lg text-gray-500 line-through mr-3">
                                    ${product.compareAtPrice.toFixed(2)}
                                </span>
                            )}
                            <span className="text-2xl font-bold text-gray-900">
                                ${product.price.toFixed(2)}
                            </span>
                            {product.compareAtPrice && (
                                <span className="ml-3 inline-block bg-red-100 text-red-700 text-xs px-2 py-1 rounded-md">
                                    {Math.round((1 - Number(product.price) / Number(product.compareAtPrice)) * 100)}% OFF
                                </span>
                            )}
                        </div>
                    </div>                    {/* Description */}
                    <div className="prose max-w-none">
                        {typeof product.description === 'string' ? (
                            <div className="text-gray-600" dangerouslySetInnerHTML={{ __html: product.description }} />
                        ) : (
                            <div className="text-gray-600">{product.description || ''}</div>
                        )}
                    </div>

                    {/* Add to Cart Component */}
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-grow">
                            <AddToCart
                                productId={product.id}
                                productName={product.name}
                                productPrice={Number(product.price)}
                                productImage={mainImage}
                                productStock={product.inventory}
                                variants={product.variants.map(variant => ({
                                    id: variant.id,
                                    name: variant.name,
                                    price: Number(variant.price)
                                }))}
                            />
                        </div>
                        <div className="flex items-center">
                            <WishlistButton
                                productId={product.id}
                                productName={product.name}
                            />
                            <span className="ml-2 text-sm text-gray-600">Add to wishlist</span>
                        </div>
                    </div>

                    {/* Shipping & Returns */}
                    <div className="border-t pt-6 mt-6 text-sm text-gray-600 grid gap-4 md:grid-cols-2">
                        <div className="flex space-x-3">
                            <Truck className="flex-shrink-0 h-5 w-5 text-blue-600" />
                            <div>
                                <p className="font-medium text-gray-900">Free Shipping</p>
                                <p>On orders over $50.00</p>
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <ArrowLeft className="flex-shrink-0 h-5 w-5 text-blue-600" />
                            <div>
                                <p className="font-medium text-gray-900">Easy Returns</p>
                                <p>30-day return policy</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Product Reviews */}
            <div className="mt-16 border-t pt-8">
                <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>

                {product.reviews.length === 0 ? (
                    <p className="text-gray-600">This product has no reviews yet. Be the first to leave a review!</p>
                ) : (
                    <div className="space-y-6">
                        {product.reviews.map((review) => (
                            <div key={review.id} className="border-b pb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center">
                                        {review.user?.image ? (
                                            <Image
                                                src={review.user.image}
                                                alt={review.user.name || 'Anonymous'}
                                                width={40}
                                                height={40}
                                                className="rounded-full mr-3"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 bg-blue-100 text-blue-600 flex items-center justify-center rounded-full mr-3">
                                                {(review.user?.name || 'A')[0].toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium">{review.user?.name || 'Anonymous'}</p>
                                            <div className="flex text-yellow-400">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star
                                                        key={star}
                                                        size={14}
                                                        fill={star <= review.rating ? "currentColor" : "none"}
                                                        className={star <= review.rating ? "text-yellow-400" : "text-gray-300"}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-sm text-gray-500">
                                        {new Date(review.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                {review.title && (
                                    <h4 className="font-medium mb-1">{review.title}</h4>
                                )}
                                <p className="text-gray-700">{review.content}</p>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-8">
                    <Button variant="outline" asChild>
                        <Link href={`/products/${slug}/review`}>Write a Review</Link>
                    </Button>
                </div>
            </div>            {/* Related Products Section */}
            <div className="mt-16 border-t pt-8">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold">You May Also Like</h2>
                </div>
                {/* Related products section */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {relatedProducts && relatedProducts.length > 0 ? (
                        relatedProducts.map((relatedProduct) => (
                            <div key={relatedProduct.id} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
                                <Link href={`/products/${relatedProduct.slug}`} className="block">
                                    <div className="aspect-square relative bg-gray-100">
                                        <Image
                                            src={relatedProduct.images[0]?.url || '/placeholder-product.jpg'}
                                            alt={relatedProduct.name}
                                            fill
                                            className="object-cover hover:scale-105 transition-transform"
                                            sizes="(max-width: 768px) 50vw, 25vw"
                                        />
                                    </div>
                                    <div className="p-4">
                                        {relatedProduct.category && (
                                            <span className="text-xs text-gray-500">{relatedProduct.category.name}</span>
                                        )}
                                        <h3 className="font-medium text-sm line-clamp-2 mt-1 mb-2">{relatedProduct.name}</h3>
                                        <div className="font-bold">
                                            ${Number(relatedProduct.price).toFixed(2)}
                                            {relatedProduct.compareAtPrice && (
                                                <span className="text-gray-500 line-through ml-2 text-sm">
                                                    ${Number(relatedProduct.compareAtPrice).toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))
                    ) : (
                        // Placeholder skeletons if no related products are found
                        [1, 2, 3, 4, 5].map((item) => (
                            <div key={item} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
                                <div className="h-48 bg-gray-200 animate-pulse" />
                                <div className="p-4">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
                                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4 animate-pulse" />
                                    <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
                                </div>
                            </div>
                        )))}
                </div>

                {/* View More link at bottom */}
                {relatedProducts && relatedProducts.length > 0 && (
                    <div className="flex justify-center mt-8">
                        <Link href="/shop" className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2 px-6 py-2 border border-blue-600 rounded-md transition-all hover:bg-blue-50">
                            View More Products
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}