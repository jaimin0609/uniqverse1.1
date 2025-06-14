"use client";

import { useEffect, useState } from 'react';

interface ClientDateProps {
    date: string;
    className?: string;
    format?: 'short' | 'long' | 'relative';
}

export function ClientDate({ date, className, format = 'short' }: ClientDateProps) {
    const [formattedDate, setFormattedDate] = useState<string>('');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        const dateObj = new Date(date);

        if (format === 'short') {
            setFormattedDate(dateObj.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }));
        } else if (format === 'long') {
            setFormattedDate(dateObj.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }));
        } else if (format === 'relative') {
            const now = new Date();
            const diffInHours = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60));

            if (diffInHours < 1) {
                setFormattedDate('Just now');
            } else if (diffInHours < 24) {
                setFormattedDate(`${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`);
            } else {
                const diffInDays = Math.floor(diffInHours / 24);
                if (diffInDays < 30) {
                    setFormattedDate(`${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`);
                } else {
                    setFormattedDate(dateObj.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    }));
                }
            }
        }
    }, [date, format]);

    // Prevent hydration mismatch by showing a placeholder until client-side
    if (!isClient) {
        return <span className={className}>Loading...</span>;
    }

    return <span className={className}>{formattedDate}</span>;
}
