"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Edit, Trash2, Calendar, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/utils/cn";
import Link from "next/link";

export default function ViewEventPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [event, setEvent] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`/api/events/${params.id}`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch event: ${response.status}`);
                }

                const data = await response.json();
                setEvent(data);
                setError(null);
            } catch (err) {
                console.error("Error fetching event:", err);
                setError("Failed to load event data. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchEvent();
    }, [params.id]);

    // Helper function to determine if an event is currently active
    const isCurrentlyActive = (event: any) => {
        if (!event) return false;
        const now = new Date();
        return (
            event.isActive &&
            new Date(event.startDate) <= now &&
            new Date(event.endDate) >= now
        );
    };

    // Helper function to get text position class
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

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-gray-600">Loading event data...</p>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <h2 className="text-lg font-semibold text-red-700 mb-2">Error</h2>
                    <p className="text-red-600 mb-4">{error || "Event not found"}</p>
                    <Button onClick={() => router.push("/admin/events")}>
                        Return to Events
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mb-2"
                        onClick={() => router.push("/admin/events")}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Events
                    </Button>
                    <h1 className="text-2xl font-bold">{event.title}</h1>
                </div>
                <div className="flex space-x-3">
                    <Button asChild variant="outline">
                        <Link href={`/admin/events/${params.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                    </Button>
                    <Button asChild variant="destructive">
                        <Link href={`/admin/events/${params.id}/delete`}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    {/* Event preview */}
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="relative h-96 w-full">
                            {event.backgroundColor && (
                                <div
                                    className="absolute inset-0"
                                    style={{ backgroundColor: event.backgroundColor, opacity: event.opacity / 100 }}
                                />
                            )}

                            {event.contentType === "image" && event.imageUrl ? (
                                <img
                                    src={event.imageUrl}
                                    alt={event.title}
                                    className="w-full h-full object-cover"
                                    style={{ opacity: event.opacity / 100 }}
                                />
                            ) : event.contentType === "video" && event.videoUrl ? (
                                <video
                                    src={event.videoUrl}
                                    className="w-full h-full object-cover"
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                    style={{ opacity: event.opacity / 100 }}
                                />
                            ) : (
                                <div
                                    className="w-full h-full flex items-center justify-center"
                                    style={{ backgroundColor: event.backgroundColor || "#f3f4f6" }}
                                >
                                    <Calendar className="h-12 w-12 text-gray-400" />
                                </div>
                            )}

                            {/* Text overlay */}
                            <div
                                className={cn(
                                    "absolute inset-0 flex p-8",
                                    getTextPositionClass(event.textPosition)
                                )}
                            >
                                {event.textOverlay && (
                                    <div
                                        className={cn(
                                            "max-w-3xl p-4 rounded",
                                            event.textSize,
                                            event.textShadow ? "text-shadow" : ""
                                        )}
                                        style={{ color: event.textColor }}
                                    >
                                        <h2 className={cn("font-bold mb-2", event.textSize)}>
                                            {event.title}
                                        </h2>
                                        {event.description && (
                                            <p className="mt-2">{event.description}</p>
                                        )}
                                        {event.linkUrl && (
                                            <Button
                                                className="mt-4"
                                                variant="secondary"
                                                asChild
                                            >
                                                <Link href={event.linkUrl}>Learn More</Link>
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Event details */}
                    <div className="mt-8 bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Event Details</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-medium text-gray-700 mb-2">Basic Information</h3>
                                <dl className="space-y-2">
                                    <div>
                                        <dt className="text-sm text-gray-500">Title</dt>
                                        <dd className="text-gray-900 mt-1">{event.title}</dd>
                                    </div>

                                    {event.description && (
                                        <div>
                                            <dt className="text-sm text-gray-500">Description</dt>
                                            <dd className="text-gray-900 mt-1">{event.description}</dd>
                                        </div>
                                    )}

                                    <div>
                                        <dt className="text-sm text-gray-500">Position Order</dt>
                                        <dd className="text-gray-900 mt-1">{event.position}</dd>
                                    </div>

                                    <div>
                                        <dt className="text-sm text-gray-500">Display Period</dt>
                                        <dd className="text-gray-900 mt-1">
                                            {format(new Date(event.startDate), "MMM d, yyyy")} to {format(new Date(event.endDate), "MMM d, yyyy")}
                                        </dd>
                                    </div>

                                    {event.linkUrl && (
                                        <div>
                                            <dt className="text-sm text-gray-500">Link URL</dt>
                                            <dd className="text-gray-900 mt-1 break-all">
                                                <a
                                                    href={event.linkUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    {event.linkUrl}
                                                </a>
                                            </dd>
                                        </div>
                                    )}
                                </dl>
                            </div>

                            <div>
                                <h3 className="font-medium text-gray-700 mb-2">Display Settings</h3>
                                <dl className="space-y-2">
                                    <div>
                                        <dt className="text-sm text-gray-500">Content Type</dt>
                                        <dd className="text-gray-900 mt-1 capitalize">{event.contentType}</dd>
                                    </div>

                                    {event.contentType === "image" && event.imageUrl && (
                                        <div>
                                            <dt className="text-sm text-gray-500">Image URL</dt>
                                            <dd className="text-gray-900 mt-1 break-all">
                                                <a
                                                    href={event.imageUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    {event.imageUrl}
                                                </a>
                                            </dd>
                                        </div>
                                    )}

                                    {event.contentType === "video" && event.videoUrl && (
                                        <div>
                                            <dt className="text-sm text-gray-500">Video URL</dt>
                                            <dd className="text-gray-900 mt-1 break-all">
                                                <a
                                                    href={event.videoUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    {event.videoUrl}
                                                </a>
                                            </dd>
                                        </div>
                                    )}

                                    <div>
                                        <dt className="text-sm text-gray-500">Content Opacity</dt>
                                        <dd className="text-gray-900 mt-1">{event.opacity}%</dd>
                                    </div>

                                    {event.backgroundColor && (
                                        <div>
                                            <dt className="text-sm text-gray-500">Background Color</dt>
                                            <dd className="text-gray-900 mt-1 flex items-center">
                                                <span className="mr-2">{event.backgroundColor}</span>
                                                <div
                                                    className="h-4 w-4 rounded-full border border-gray-300"
                                                    style={{ backgroundColor: event.backgroundColor }}
                                                />
                                            </dd>
                                        </div>
                                    )}

                                    {event.effectType && event.effectType !== "none" && (
                                        <div>
                                            <dt className="text-sm text-gray-500">Effect</dt>
                                            <dd className="text-gray-900 mt-1 capitalize">{event.effectType}</dd>
                                        </div>
                                    )}
                                </dl>

                                <h3 className="font-medium text-gray-700 mt-6 mb-2">Text Settings</h3>
                                <dl className="space-y-2">
                                    <div>
                                        <dt className="text-sm text-gray-500">Text Position</dt>
                                        <dd className="text-gray-900 mt-1 capitalize">{event.textPosition.replace('-', ' ')}</dd>
                                    </div>

                                    <div>
                                        <dt className="text-sm text-gray-500">Text Size</dt>
                                        <dd className="text-gray-900 mt-1">{event.textSize}</dd>
                                    </div>

                                    <div>
                                        <dt className="text-sm text-gray-500">Text Color</dt>
                                        <dd className="text-gray-900 mt-1 flex items-center">
                                            <span className="mr-2">{event.textColor}</span>
                                            <div
                                                className="h-4 w-4 rounded-full border border-gray-300"
                                                style={{ backgroundColor: event.textColor }}
                                            />
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className="text-sm text-gray-500">Text Shadow</dt>
                                        <dd className="text-gray-900 mt-1">{event.textShadow ? 'Enabled' : 'Disabled'}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
                        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Status</h2>

                        <div className="space-y-6">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-700 font-medium">Active Status</span>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${event.isActive
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {event.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-gray-700 font-medium">Current Display</span>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${isCurrentlyActive(event)
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {isCurrentlyActive(event) ? 'Visible' : 'Hidden'}
                                    </span>
                                </div>

                                {!isCurrentlyActive(event) && event.isActive && (
                                    <div className="mt-2 text-sm text-amber-600">
                                        {new Date() < new Date(event.startDate)
                                            ? `Will be visible starting ${format(new Date(event.startDate), "MMM d, yyyy")}`
                                            : `Was visible until ${format(new Date(event.endDate), "MMM d, yyyy")}`}
                                    </div>
                                )}
                            </div>

                            <div>
                                <h3 className="text-gray-700 font-medium mb-2">Created & Updated</h3>
                                <div className="text-sm text-gray-600">
                                    <div>Created: {format(new Date(event.createdAt), "MMM d, yyyy 'at' h:mm a")}</div>
                                    <div>Last Updated: {format(new Date(event.updatedAt), "MMM d, yyyy 'at' h:mm a")}</div>
                                </div>
                            </div>

                            <div className="pt-4 space-y-3">
                                <Button asChild className="w-full">
                                    <Link href={`/admin/events/${params.id}/edit`}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Event
                                    </Link>
                                </Button>

                                <Button asChild variant="destructive" className="w-full">
                                    <Link href={`/admin/events/${params.id}/delete`}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Event
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
