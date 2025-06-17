"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function DeleteEventPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [event, setEvent] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

    useEffect(() => {
        const initializeParams = async () => {
            const resolved = await params;
            setResolvedParams(resolved);
        };
        initializeParams();
    }, [params]);

    useEffect(() => {
        if (!resolvedParams) return;

        const fetchEvent = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`/api/events/${resolvedParams.id}`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch event: ${response.status}`);
                } const data = await response.json();
                setEvent(data);
                setError(null);
            } catch (err) {
                console.error("Error fetching event:", err);
                setError("Failed to load event data. Please try again.");
                toast.error("Failed to load event data");
            } finally {
                setIsLoading(false);
            }
        };

        fetchEvent();
    }, [resolvedParams]);

    const handleDelete = async () => {
        if (!resolvedParams) return;

        setIsDeleting(true);

        try {
            const response = await fetch(`/api/events/${resolvedParams.id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error(`Failed to delete event: ${response.status}`);
            }

            toast.success("Event deleted successfully");
            router.push("/admin/events");
            router.refresh();
        } catch (error) {
            console.error("Error deleting event:", error);
            toast.error("Failed to delete event");
            setIsDeleting(false);
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
            <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
                <div className="text-center mb-6">
                    <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900">Delete Event</h1>
                    <p className="text-gray-600 mt-2">
                        Are you sure you want to delete this event? This action cannot be undone.
                    </p>
                </div>

                <div className="border rounded-lg overflow-hidden mb-6">
                    <div className="p-4 bg-gray-50 border-b">
                        <h2 className="font-semibold text-lg">{event.title}</h2>
                    </div>
                    <div className="p-4 space-y-3">
                        {event.description && (
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Description</p>
                                <p className="text-gray-700">{event.description}</p>
                            </div>
                        )}

                        <div>
                            <p className="text-sm text-gray-500 font-medium">Display Period</p>
                            <p className="text-gray-700">
                                {format(new Date(event.startDate), "MMM d, yyyy")} to {format(new Date(event.endDate), "MMM d, yyyy")}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500 font-medium">Content Type</p>
                            <p className="text-gray-700 capitalize">{event.contentType}</p>
                        </div>

                        {event.imageUrl && (
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Preview</p>
                                <div className="mt-2 h-40 relative rounded overflow-hidden border">
                                    <img
                                        src={event.imageUrl}
                                        alt={event.title}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <div className="px-2 py-1 rounded bg-gray-100 text-xs">
                                Position: {event.position}
                            </div>
                            <div className={`px-2 py-1 rounded text-xs ${event.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                                }`}>
                                {event.isActive ? 'Active' : 'Inactive'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-4 mt-8">
                    <Button
                        variant="outline"
                        onClick={() => router.push('/admin/events')}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            "Delete Event"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
