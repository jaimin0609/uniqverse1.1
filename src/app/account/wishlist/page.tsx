'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ShoppingBag, Heart, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuickAddToCart } from '@/components/product/quick-add-to-cart';

interface WishlistItem {
    id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice: number | null;
    inventory: number;
    image: string;
    hasVariants: boolean;
    category: {
        name: string;
        slug: string;
    };
    addedAt: string;
}

export default function WishlistPage() {
    const { data: session, status } = useSession();
    const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchWishlist() {
            if (status === 'loading') return;

            if (status === 'unauthenticated') {
                setIsLoading(false);
                setError('Please sign in to view your wishlist');
                return;
            }

            try {
                const response = await fetch('/api/users/wishlist');
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to fetch wishlist');
                }

                setWishlistItems(data.wishlistItems || []);
            } catch (err) {
                console.error('Error fetching wishlist:', err);
                setError('Failed to load wishlist. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        }

        fetchWishlist();
    }, [status]);

    const removeFromWishlist = async (productId: string) => {
        try {
            const response = await fetch(`/api/users/wishlist?productId=${productId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                // Remove the item from the local state
                setWishlistItems(wishlistItems.filter(item => item.id !== productId));
            } else {
                throw new Error('Failed to remove from wishlist');
            }
        } catch (err) {
            console.error('Error removing from wishlist:', err);
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-600">Loading your wishlist...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
                        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Wishlist</h2>
                        <p className="text-gray-600 mb-4">{error}</p>
                        {status === 'unauthenticated' && (
                            <Button asChild>
                                <Link href="/auth/login">Sign In</Link>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (wishlistItems.length === 0) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    <Link href="/shop" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-8">
                        <ArrowLeft size={16} className="mr-2" />
                        Back to Shop
                    </Link>

                    <div className="text-center py-16 space-y-6">
                        <div className="bg-gray-100 h-24 w-24 rounded-full flex items-center justify-center mx-auto">
                            <Heart className="h-10 w-10 text-gray-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Your wishlist is empty</h1>
                        <p className="text-gray-600 max-w-md mx-auto">
                            Items you save to your wishlist will appear here. Start shopping and add items you love!
                        </p>
                        <Button size="lg" asChild className="mt-6">
                            <Link href="/shop">Discover Products</Link>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-6xl mx-auto">
                <Link href="/shop" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-8">
                    <ArrowLeft size={16} className="mr-2" />
                    Back to Shop
                </Link>

                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold">Your Wishlist</h1>
                    <p className="text-gray-600">{wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {wishlistItems.map((item) => (
                        <div key={item.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden group relative">
                            <div className="absolute top-2 right-2 z-10">
                                <button
                                    onClick={() => removeFromWishlist(item.id)}
                                    className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100 text-red-500"
                                    aria-label="Remove from wishlist"
                                >
                                    <Heart className="h-5 w-5 fill-current" />
                                </button>
                            </div>

                            <Link href={`/products/${item.slug}`} className="block">
                                <div className="aspect-square relative">
                                    <Image
                                        src={item.image || '/placeholder-product.jpg'}
                                        alt={item.name}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                        className="object-cover"
                                    />
                                </div>
                            </Link>

                            <div className="p-4">
                                <Link href={`/products/${item.slug}`} className="block mb-1">
                                    <h3 className="font-medium text-gray-900 hover:text-blue-600 transition-colors line-clamp-1">
                                        {item.name}
                                    </h3>
                                </Link>
                                <p className="text-sm text-gray-500 mb-2">{item.category.name}</p>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center">
                                            {item.compareAtPrice && (
                                                <span className="text-gray-500 line-through text-sm mr-2">
                                                    ${item.compareAtPrice.toFixed(2)}
                                                </span>
                                            )}
                                            <span className="font-semibold">${item.price.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <QuickAddToCart
                                        productId={item.id}
                                        productName={item.name}
                                        productPrice={item.price}
                                        productImage={item.image}
                                        small
                                    />
                                </div>

                                {item.hasVariants && (
                                    <Link href={`/products/${item.slug}`}>
                                        <Button
                                            variant="outline"
                                            className="w-full mt-3"
                                            size="sm"
                                        >
                                            View Options
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}