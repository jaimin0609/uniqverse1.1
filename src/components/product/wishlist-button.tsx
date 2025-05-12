"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Heart } from "lucide-react";
import { toast } from "sonner";

interface WishlistButtonProps {
    productId: string;
    productName: string;
    className?: string;
    small?: boolean;
}

export function WishlistButton({
    productId,
    productName,
    className = "",
    small = false
}: WishlistButtonProps) {
    const { data: session, status } = useSession();
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Check if the product is in the wishlist when the component mounts
    useEffect(() => {
        if (status === "authenticated") {
            checkWishlistStatus();
        }
    }, [status, productId]);

    // Check if the product is already in the wishlist
    const checkWishlistStatus = async () => {
        if (!session?.user) return;

        try {
            const response = await fetch('/api/users/wishlist');
            const data = await response.json();

            if (response.ok && data.wishlistItems) {
                const found = data.wishlistItems.some((item: any) => item.id === productId);
                setIsInWishlist(found);
            }
        } catch (error) {
            console.error("Error checking wishlist status:", error);
        }
    };

    // Handle adding/removing from wishlist
    const handleToggleWishlist = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // If not logged in, show a prompt to login
        if (status !== "authenticated") {
            toast.error("Please login to add items to your wishlist", {
                action: {
                    label: "Login",
                    onClick: () => window.location.href = "/auth/login"
                }
            });
            return;
        }

        setIsLoading(true);

        try {
            if (isInWishlist) {
                // Remove from wishlist
                const response = await fetch(`/api/users/wishlist?productId=${productId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    setIsInWishlist(false);
                    toast.success(`${productName} removed from wishlist`);
                } else {
                    toast.error("Failed to remove from wishlist");
                }
            } else {
                // Add to wishlist
                const response = await fetch('/api/users/wishlist', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ productId })
                });

                if (response.ok) {
                    setIsInWishlist(true);
                    toast.success(`${productName} added to wishlist`);
                } else {
                    toast.error("Failed to add to wishlist");
                }
            }
        } catch (error) {
            console.error("Error updating wishlist:", error);
            toast.error("An error occurred while updating your wishlist");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleToggleWishlist}
            disabled={isLoading}
            className={`flex items-center justify-center rounded-full bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${small ? 'p-1.5 md:p-2' : 'p-2.5 md:p-3'} ${isInWishlist ? 'text-red-500 hover:text-red-600' : ''} ${className}`}
            title={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
            aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
            <Heart
                className={`${small ? 'h-4 w-4' : 'h-5 w-5'} ${isInWishlist ? 'fill-current' : ''}`}
            />
        </button>
    );
}