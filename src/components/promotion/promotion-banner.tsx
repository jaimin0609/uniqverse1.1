"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, ChevronLeft, ChevronRight, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PromotionType } from "@/lib/prisma-types";

interface PromotionBannerProps {
    className?: string;
}

interface Promotion {
    id: string;
    title: string;
    description: string | null;
    type: PromotionType;
    imageUrl: string | null;
    videoUrl: string | null;
    linkUrl: string | null;
    position: number;
    startDate: string;
    endDate: string;
}

interface Coupon {
    id: string;
    code: string;
    description: string | null;
    discountType: "PERCENTAGE" | "FIXED_AMOUNT";
    discountValue: number;
    endDate: string;
    minimumPurchase: number | null;
    maximumDiscount: number | null;
}

interface BannerItem {
    id: string;
    title: string;
    description: string | null;
    type: "promotion" | "coupon";
    imageUrl?: string | null;
    linkUrl?: string | null;
    endDate: string;
    discountType?: "PERCENTAGE" | "FIXED_AMOUNT";
    discountValue?: number;
    minimumPurchase?: number | null;
    maximumDiscount?: number | null;
}

export function PromotionBanner({ className }: PromotionBannerProps) {
    const [bannerItems, setBannerItems] = useState<BannerItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
    const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Fetch both active promotions and banner coupons
        const fetchBannerContent = async () => {
            try {
                const [promotionsResponse, couponsResponse] = await Promise.all([
                    fetch("/api/promotions?active=true"),
                    fetch("/api/coupons/banner")
                ]);

                const items: BannerItem[] = [];

                // Add promotions
                if (promotionsResponse.ok) {
                    const promotions: Promotion[] = await promotionsResponse.json();
                    const promotionItems: BannerItem[] = promotions.map(promo => ({
                        id: promo.id,
                        title: promo.title,
                        description: promo.description,
                        type: "promotion" as const,
                        imageUrl: promo.imageUrl,
                        linkUrl: promo.linkUrl,
                        endDate: promo.endDate
                    }));
                    items.push(...promotionItems);
                }

                // Add banner coupons
                if (couponsResponse.ok) {
                    const coupons: Coupon[] = await couponsResponse.json();
                    const couponItems: BannerItem[] = coupons.map(coupon => ({
                        id: coupon.id,
                        title: coupon.code,
                        description: coupon.description || `${coupon.discountType === "PERCENTAGE" ? coupon.discountValue + "%" : "$" + coupon.discountValue} off${coupon.minimumPurchase ? ` on orders over $${coupon.minimumPurchase}` : ""}`,
                        type: "coupon" as const,
                        endDate: coupon.endDate,
                        discountType: coupon.discountType,
                        discountValue: coupon.discountValue,
                        minimumPurchase: coupon.minimumPurchase,
                        maximumDiscount: coupon.maximumDiscount
                    }));
                    items.push(...couponItems);
                }

                setBannerItems(items);
            } catch (error) {
                console.error("Error fetching banner content:", error);
            }
        };

        fetchBannerContent();
    }, []); useEffect(() => {
        if (bannerItems.length > 1) {
            // Set up auto rotation
            autoPlayRef.current = setInterval(() => {
                setCurrentIndex((prevIndex) => (prevIndex + 1) % bannerItems.length);
            }, 5000); // Change slide every 5 seconds
        } return () => {
            if (autoPlayRef.current) {
                clearInterval(autoPlayRef.current);
            }
            if (copyTimeoutRef.current) {
                clearTimeout(copyTimeoutRef.current);
            }
        };
    }, [bannerItems.length]);

    // If there are no banner items, don't render anything
    if (bannerItems.length === 0) {
        return null;
    }

    const handlePrevious = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? bannerItems.length - 1 : prevIndex - 1
        );
    };

    const handleNext = () => {
        setCurrentIndex((prevIndex) =>
            (prevIndex + 1) % bannerItems.length
        );
    };    // Helper function to check if string is a coupon code format
    const isCouponCode = (item: BannerItem) => {
        return item.type === "coupon";
    };    // Helper to copy code to clipboard
    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);

        // Clear any existing timeout
        if (copyTimeoutRef.current) {
            clearTimeout(copyTimeoutRef.current);
        }

        copyTimeoutRef.current = setTimeout(() => setCopiedCode(null), 2000); // Reset after 2 seconds
    };

    // Parse end date for countdown
    const getTimeRemaining = (endDateStr: string) => {
        const endDate = new Date(endDateStr);
        const now = new Date();
        const timeRemaining = endDate.getTime() - now.getTime();

        if (timeRemaining <= 0) return null;

        const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

        return { days, hours, minutes };
    };

    const currentItem = bannerItems[currentIndex];
    const timeRemaining = getTimeRemaining(currentItem.endDate);
    const showCountdown = timeRemaining !== null;
    const isCoupon = isCouponCode(currentItem); return (
        <div className={`w-full bg-gradient-to-r from-blue-50 to-purple-50 py-3 ${className}`}>
            <div className="container mx-auto px-4 relative">
                <div className="flex items-center justify-center">
                    {bannerItems.length > 1 && (
                        <button
                            onClick={handlePrevious}
                            className="absolute left-4 rounded-full p-1 bg-white/80 hover:bg-white shadow-sm z-10"
                            aria-label="Previous banner item"
                        >
                            <ChevronLeft size={20} />
                        </button>
                    )}

                    <div className="flex-1 flex items-center justify-center text-center px-10">
                        {currentItem.imageUrl && (
                            <div className="mr-3 hidden sm:block">
                                <Image
                                    src={currentItem.imageUrl}
                                    alt=""
                                    width={40}
                                    height={40}
                                    className="rounded-md object-cover"
                                />
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                            <div>
                                <span className="font-semibold text-sm sm:text-base">
                                    {currentItem.title}
                                </span>
                                {currentItem.description && (
                                    <span className="text-sm text-gray-600 ml-2">
                                        {currentItem.description}
                                    </span>
                                )}
                            </div>

                            {isCoupon && (
                                <div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1"
                                        onClick={() => copyToClipboard(currentItem.title)}
                                    >
                                        {copiedCode === currentItem.title ? (
                                            <>
                                                <Check size={14} className="text-green-500" />
                                                <span>Copied!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={14} />
                                                <span>Copy Code</span>
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}

                            {showCountdown && (
                                <div className="flex items-center gap-1 text-sm bg-white py-1 px-2 rounded-md">
                                    <Clock size={14} className="text-blue-500" />
                                    <span>
                                        {timeRemaining.days > 0 && `${timeRemaining.days}d `}
                                        {timeRemaining.hours}h {timeRemaining.minutes}m remaining
                                    </span>
                                </div>
                            )}

                            {currentItem.linkUrl && (
                                <Link
                                    href={currentItem.linkUrl}
                                    className="text-blue-600 hover:underline text-sm font-medium"
                                >
                                    Learn More
                                </Link>
                            )}
                        </div>
                    </div>

                    {bannerItems.length > 1 && (
                        <button
                            onClick={handleNext}
                            className="absolute right-4 rounded-full p-1 bg-white/80 hover:bg-white shadow-sm z-10"
                            aria-label="Next banner item"
                        >
                            <ChevronRight size={20} />
                        </button>
                    )}
                </div>

                {/* Dots for navigation */}
                {bannerItems.length > 1 && (
                    <div className="flex justify-center mt-2">
                        {bannerItems.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`h-1.5 rounded-full mx-1 ${index === currentIndex ? "w-4 bg-blue-500" : "w-1.5 bg-gray-300"
                                    }`}
                                aria-label={`Go to banner item ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
