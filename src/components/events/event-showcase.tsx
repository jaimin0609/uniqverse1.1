"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";

interface EventShowcaseProps {
    className?: string;
}

interface Event {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    videoUrl: string | null;
    contentType: string;
    textOverlay: string | null;
    textPosition: string;
    textColor: string;
    textSize: string;
    textShadow: boolean;
    backgroundColor: string | null;
    opacity: number;
    effectType: string | null;
    linkUrl: string | null;
    startDate: string;
    endDate: string;
    position: number;
}

export function EventShowcase({ className }: EventShowcaseProps) {
    const [events, setEvents] = useState<Event[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
    const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

    // Get text position class based on the position value
    const getTextPositionClass = (position: string) => {
        switch (position) {
            case "top-left":
                return "items-start justify-start text-left";
            case "top-center":
                return "items-start justify-center text-center";
            case "top-right":
                return "items-start justify-end text-right";
            case "center-left":
                return "items-center justify-start text-left";
            case "center":
                return "items-center justify-center text-center";
            case "center-right":
                return "items-center justify-end text-right";
            case "bottom-left":
                return "items-end justify-start text-left";
            case "bottom-center":
                return "items-end justify-center text-center";
            case "bottom-right":
                return "items-end justify-end text-right";
            default:
                return "items-center justify-center text-center";
        }
    };

    useEffect(() => {
        const fetchEvents = async () => {
            setIsLoading(true);
            try {
                const response = await fetch("/api/events?active=true");
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();
                setEvents(data);
            } catch (err) {
                console.error("Error fetching events:", err);
                setError("Failed to load events");
            } finally {
                setIsLoading(false);
            }
        };

        fetchEvents();
    }, []);

    useEffect(() => {
        if (events.length > 1) {
            // Set up auto rotation
            autoPlayRef.current = setInterval(() => {
                setCurrentIndex((prevIndex) => (prevIndex + 1) % events.length);
            }, 7000); // Change slide every 7 seconds
        }

        return () => {
            if (autoPlayRef.current) {
                clearInterval(autoPlayRef.current);
            }
        };
    }, [events.length]);

    // If there are no events or still loading, show placeholder or nothing
    if (isLoading) {
        return (
            <div className={cn("h-96 bg-gray-100 animate-pulse rounded-lg", className)}>
                <div className="h-full flex items-center justify-center">
                    <span className="text-gray-400">Loading events...</span>
                </div>
            </div>
        );
    }

    if (error || events.length === 0) {
        return null; // Don't display anything if there's an error or no events
    }

    const currentEvent = events[currentIndex];

    const handlePrevious = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? events.length - 1 : prevIndex - 1
        );
    };

    const handleNext = () => {
        setCurrentIndex((prevIndex) =>
            (prevIndex + 1) % events.length
        );
    };

    // Apply animation effect class based on effectType
    const getEffectClass = (effectType: string | null) => {
        switch (effectType) {
            case "fade":
                return "transition-opacity duration-700";
            case "zoom":
                return "transition-transform duration-700 hover:scale-105";
            case "slide":
                return "transition-transform duration-700";
            default:
                return "";
        }
    };

    return (
        <div className={cn("relative overflow-hidden rounded-lg", className)}>
            {/* Event content container */}
            <div className="relative h-96 w-full">
                {/* Background color if set */}
                {currentEvent.backgroundColor && (
                    <div
                        className="absolute inset-0"
                        style={{ backgroundColor: currentEvent.backgroundColor }}
                    />
                )}

                {/* Content: Image or Video */}
                <div
                    className="absolute inset-0 w-full h-full"
                    style={{ opacity: currentEvent.opacity / 100 }}
                >
                    {currentEvent.contentType === "image" && currentEvent.imageUrl ? (
                        <Image
                            src={currentEvent.imageUrl}
                            alt={currentEvent.title || "Event"}
                            fill
                            sizes="100vw"
                            className={cn(
                                "object-cover",
                                getEffectClass(currentEvent.effectType)
                            )}
                            priority
                        />) : currentEvent.contentType === "video" && currentEvent.videoUrl ? (
                            <video
                                ref={(el) => {
                                    if (el) {
                                        videoRefs.current.set(currentEvent.id, el);
                                    }
                                }}
                                src={currentEvent.videoUrl}
                                className={cn(
                                    "w-full h-full object-cover",
                                    getEffectClass(currentEvent.effectType)
                                )}
                                autoPlay
                                muted
                                loop
                                playsInline
                            />
                        ) : (
                        <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600" />
                    )}
                </div>

                {/* Text overlay container */}
                <div
                    className={cn(
                        "absolute inset-0 flex p-8",
                        getTextPositionClass(currentEvent.textPosition)
                    )}
                >
                    {currentEvent.textOverlay && (
                        <div
                            className={cn(
                                "max-w-3xl p-4 rounded",
                                currentEvent.textSize,
                                currentEvent.textShadow ? "text-shadow" : ""
                            )}
                            style={{ color: currentEvent.textColor }}
                        >
                            <h2 className={cn("font-bold mb-2", currentEvent.textSize)}>
                                {currentEvent.title}
                            </h2>
                            {currentEvent.description && (
                                <p className="mt-2">{currentEvent.description}</p>
                            )}
                            {currentEvent.linkUrl && (
                                <Button
                                    className="mt-4"
                                    variant="secondary"
                                    asChild
                                >
                                    <Link href={currentEvent.linkUrl}>Learn More</Link>
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {/* Navigation controls */}
                {events.length > 1 && (
                    <>
                        <button
                            onClick={handlePrevious}
                            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full p-2 bg-black/30 hover:bg-black/50 text-white z-10 transition-colors"
                            aria-label="Previous event"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button
                            onClick={handleNext}
                            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-2 bg-black/30 hover:bg-black/50 text-white z-10 transition-colors"
                            aria-label="Next event"
                        >
                            <ChevronRight size={24} />
                        </button>

                        {/* Dots indicator */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                            {events.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentIndex(index)}
                                    className={`w-2.5 h-2.5 rounded-full transition-colors ${index === currentIndex ? "bg-white" : "bg-white/50"
                                        }`}
                                    aria-label={`Go to event ${index + 1}`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// Add this to your globals.css or define it here
const styles = `
  .text-shadow {
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }
`;
