/**
 * Format a number as a currency string
 * @param amount The amount to format
 * @param currency The currency code (defaults to USD)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number | string, currency = 'USD'): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numAmount);
}

/**
 * Format a date as a string
 * @param date The date to format
 * @param options Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(
    date: Date | string,
    options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }
): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', options).format(dateObj);
}

/**
 * Truncate a string to a specified length
 * @param str The string to truncate
 * @param length Maximum length before truncation
 * @returns Truncated string with ellipsis
 */
export function truncateString(str: string, length = 50): string {
    if (str.length <= length) return str;
    return `${str.substring(0, length).trim()}...`;
}

/**
 * Alias for truncateString to maintain API compatibility
 */
export const truncate = truncateString;

/**
 * Converts markdown-style links in a string to HTML anchor tags
 * Format: [link text](url)
 */
export function parseMarkdownLinks(text: string): string {
    if (!text) return '';

    // Find all markdown links using regex
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

    // Replace each markdown link with an HTML link
    return text.replace(linkRegex, (match, linkText, url) => {
        // For security, ensure URLs are properly formed
        const isExternal = url.startsWith('http://') || url.startsWith('https://');

        // For external links, add target="_blank" and rel attributes for security
        const externalAttrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';

        // Create the HTML link
        return `<a href="${url}" class="text-primary hover:underline"${externalAttrs}>${linkText}</a>`;
    });
}