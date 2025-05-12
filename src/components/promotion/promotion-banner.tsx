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

export function PromotionBanner({ className }: PromotionBannerProps) {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Fetch active promotions from the API
        const fetchPromotions = async () => {
            try {
                const response = await fetch("/api/promotions?active=true");
                if (response.ok) {
                    const data = await response.json();
                    setPromotions(data);
                }
            } catch (error) {
                console.error("Error fetching promotions:", error);
            }
        };

        fetchPromotions();
    }, []);

    useEffect(() => {
        if (promotions.length > 1) {
            // Set up auto rotation
            autoPlayRef.current = setInterval(() => {
                setCurrentIndex((prevIndex) => (prevIndex + 1) % promotions.length);
            }, 5000); // Change slide every 5 seconds
        }

        return () => {
            if (autoPlayRef.current) {
                clearInterval(autoPlayRef.current);
            }
        };
    }, [promotions.length]);

    // If there are no promotions, don't render anything
    if (promotions.length === 0) {
        return null;
    }

    const handlePrevious = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? promotions.length - 1 : prevIndex - 1
        );
    };

    const handleNext = () => {
        setCurrentIndex((prevIndex) =>
            (prevIndex + 1) % promotions.length
        );
    };

    // Helper function to check if string is a coupon code format
    const isCouponCode = (text: string | null) => {
        if (!text) return false;
        // Assuming coupon codes are something like "SUMMER20", "SALE50", etc.
        return /^[A-Z0-9]{4,15}$/.test(text.trim());
    };

    // Helper to copy code to clipboard
    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000); // Reset after 2 seconds
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

    const currentPromotion = promotions[currentIndex];
    const timeRemaining = getTimeRemaining(currentPromotion.endDate);
    const showCountdown = timeRemaining !== null;
    const isCoupon = isCouponCode(currentPromotion.title);

    return (
        <div className={`w-full bg-gradient-to-r from-blue-50 to-purple-50 py-3 ${className}`}>
            <div className="container mx-auto px-4 relative">
                <div className="flex items-center justify-center">
                    {promotions.length > 1 && (
                        <button
                            onClick={handlePrevious}
                            className="absolute left-4 rounded-full p-1 bg-white/80 hover:bg-white shadow-sm z-10"
                            aria-label="Previous promotion"
                        >
                            <ChevronLeft size={20} />
                        </button>
                    )}

                    <div className="flex-1 flex items-center justify-center text-center px-10">
                        {currentPromotion.imageUrl && (
                            <div className="mr-3 hidden sm:block">
                                <Image
                                    src={currentPromotion.imageUrl}
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
                                    {currentPromotion.title}
                                </span>
                                {currentPromotion.description && (
                                    <span className="text-sm text-gray-600 ml-2">
                                        {currentPromotion.description}
                                    </span>
                                )}
                            </div>

                            {isCoupon && (
                                <div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1"
                                        onClick={() => copyToClipboard(currentPromotion.title)}
                                    >
                                        {copiedCode === currentPromotion.title ? (
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

                            {currentPromotion.linkUrl && (
                                <Link
                                    href={currentPromotion.linkUrl}
                                    className="text-blue-600 hover:underline text-sm font-medium"
                                >
                                    Learn More
                                </Link>
                            )}
                        </div>
                    </div>

                    {promotions.length > 1 && (
                        <button
                            onClick={handleNext}
                            className="absolute right-4 rounded-full p-1 bg-white/80 hover:bg-white shadow-sm z-10"
                            aria-label="Next promotion"
                        >
                            <ChevronRight size={20} />
                        </button>
                    )}
                </div>

                {/* Dots for navigation */}
                {promotions.length > 1 && (
                    <div className="flex justify-center mt-2">
                        {promotions.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`h-1.5 rounded-full mx-1 ${index === currentIndex ? "w-4 bg-blue-500" : "w-1.5 bg-gray-300"
                                    }`}
                                aria-label={`Go to promotion ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
