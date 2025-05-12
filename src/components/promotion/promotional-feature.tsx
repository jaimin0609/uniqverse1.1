"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PromotionType } from "@/lib/prisma-types";

interface PromotionalBannerProps {
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
}

export function PromotionalFeature({ className }: PromotionalBannerProps) {
    const [promotion, setPromotion] = useState<Promotion | null>(null);

    useEffect(() => {
        // Fetch featured promotion (position = 0)
        const fetchPromotion = async () => {
            try {
                const response = await fetch("/api/promotions?active=true&type=BANNER");
                if (response.ok) {
                    const data = await response.json();
                    // Get the first banner or the one with lowest position number
                    const featured = data
                        .filter((promo: Promotion) => promo.type === "BANNER" && (promo.imageUrl || promo.videoUrl))
                        .sort((a: Promotion, b: Promotion) => a.position - b.position)[0];

                    if (featured) {
                        setPromotion(featured);
                    }
                }
            } catch (error) {
                console.error("Error fetching promotional banner:", error);
            }
        };

        fetchPromotion();
    }, []);

    // If there is no promotional banner, don't render anything
    if (!promotion) {
        return null;
    }

    return (
        <div className={`w-full py-12 ${className}`}>
            <div className="container mx-auto px-4">
                <div className="rounded-xl overflow-hidden shadow-lg bg-white">
                    {promotion.videoUrl ? (
                        <div className="aspect-video w-full">
                            <video
                                className="w-full h-full object-cover"
                                autoPlay
                                muted
                                loop
                                playsInline
                                controls={false}
                            >
                                <source src={promotion.videoUrl} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    ) : promotion.imageUrl ? (
                        <div className="relative aspect-[21/9] w-full">
                            <Image
                                src={promotion.imageUrl}
                                alt={promotion.title}
                                fill
                                className="object-cover"
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent flex items-center">
                                <div className="p-8 max-w-md">
                                    <h2 className="text-white text-3xl md:text-4xl font-bold mb-4">
                                        {promotion.title}
                                    </h2>
                                    {promotion.description && (
                                        <p className="text-white text-lg mb-6">
                                            {promotion.description}
                                        </p>
                                    )}
                                    {promotion.linkUrl && (
                                        <Button asChild size="lg">
                                            <Link href={promotion.linkUrl}>
                                                Shop Now
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
