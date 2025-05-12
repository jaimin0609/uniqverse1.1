import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes safely using clsx and tailwind-merge
 * @param inputs - The classes to merge
 * @returns A string of merged classes
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}