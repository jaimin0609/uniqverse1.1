"use client";

import React from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { marked } from 'marked';
import { BlogImage } from './blog-image';
import { ErrorBoundary } from './error-boundary';

interface BlogContentProps {
    content: string;
    className?: string;
    isMarkdown?: boolean;
}

export function BlogContent({ content, className = '', isMarkdown = false }: BlogContentProps) {    // Process content - convert markdown to HTML if needed
    const htmlContent = React.useMemo(() => {
        if (isMarkdown) {
            return marked(content);
        }
        return content.replace(/\\n/g, '<br/>');
    }, [content, isMarkdown]);

    // Sanitize the HTML to prevent XSS attacks
    const sanitizedContent = DOMPurify.sanitize(htmlContent as string);

    // Process the content to replace img tags with our custom BlogImage component
    const processedContent = React.useMemo(() => {
        // Create a temporary DOM element to parse the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = sanitizedContent;

        // Find all img tags and replace them with placeholders that we'll render as BlogImage
        const imgTags = tempDiv.querySelectorAll('img');
        imgTags.forEach((img, index) => {
            const src = img.getAttribute('src');
            const alt = img.getAttribute('alt') || 'Blog image';
            const className = img.getAttribute('class') || '';

            // Replace img tag with a placeholder that we can identify later
            img.outerHTML = `<div data-blog-image="${index}" 
                            data-src="${src}" 
                            data-alt="${alt}" 
                            data-class="${className}"></div>`;
        });

        return tempDiv.innerHTML;
    }, [sanitizedContent]);

    // Render the content in parts, replacing image placeholders with BlogImage
    const renderContent = () => {
        const parts = processedContent.split(/<div data-blog-image="[0-9]+"[^>]+><\/div>/);
        const imagePlaceholders = processedContent.match(/<div data-blog-image="[0-9]+"[^>]+><\/div>/g) || [];

        return parts.map((part, index) => {
            const output: React.ReactNode[] = [];

            // Add the HTML part
            if (part) {
                output.push(
                    <div key={`part-${index}`} dangerouslySetInnerHTML={{ __html: part }} />
                );
            }

            // Add the image if there is one for this part
            if (imagePlaceholders[index]) {
                const placeholder = imagePlaceholders[index];
                const src = placeholder.match(/data-src="([^"]+)"/)?.[1] || '';
                const alt = placeholder.match(/data-alt="([^"]+)"/)?.[1] || 'Blog image';
                const imgClass = placeholder.match(/data-class="([^"]+)"/)?.[1] || '';

                output.push(
                    <div key={`img-${index}`} className="my-4">
                        <BlogImage
                            src={src}
                            alt={alt}
                            width={0}
                            height={0}
                            sizes="100vw"
                            className={`w-full h-auto ${imgClass}`}
                            style={{ maxWidth: '100%' }}
                        />
                    </div>
                );
            }

            return output;
        }).flat();
    }; return (
        <ErrorBoundary fallback={
            <div className="p-4 border rounded bg-amber-50 text-amber-700">
                <p>There was an issue rendering this content. Please try refreshing the page.</p>
            </div>
        }>
            <div className={`prose prose-lg max-w-none ${className}`}>
                {renderContent()}
            </div>
        </ErrorBoundary>
    );
}
