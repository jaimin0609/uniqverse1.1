"use client";

import { useEffect } from "react";
import { toast } from "sonner";

// Toast handler component that listens for custom toast events
export default function ToastListener() {
    useEffect(() => {
        // Define the event handler
        const handleToastEvent = (event: Event) => {
            const customEvent = event as CustomEvent;
            const { title, description, variant = "default" } = customEvent.detail;

            // Show appropriate toast type based on variant
            if (variant === "success") {
                toast.success(title, {
                    description: description,
                });
            } else if (variant === "error") {
                toast.error(title, {
                    description: description,
                });
            } else {
                toast(title, {
                    description: description,
                });
            }
        };

        // Add event listener
        window.addEventListener('show-toast', handleToastEvent);

        // Clean up
        return () => {
            window.removeEventListener('show-toast', handleToastEvent);
        };
    }, []);

    // This component doesn't render anything
    return null;
}
