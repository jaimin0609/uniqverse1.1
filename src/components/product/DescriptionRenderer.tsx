import React from 'react';
import DOMPurify from 'isomorphic-dompurify';
import parse from 'html-react-parser';

interface DescriptionRendererProps {
    html: string;
    className?: string;
}

export default function DescriptionRenderer({ html, className = '' }: DescriptionRendererProps) {
    // Only render if there's content
    if (!html) return null;

    // Sanitize the HTML to prevent XSS attacks
    const sanitizedHtml = DOMPurify.sanitize(html);

    return (
        <div
            className={`description-content ${className}`}
        >
            {parse(sanitizedHtml)}
        </div>
    );
}
