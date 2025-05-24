import React from 'react';
import { render, screen } from '@testing-library/react';
import { Badge, badgeVariants } from '../badge'; // Adjust import path as necessary
import { cva } from 'class-variance-authority'; // Ensure cva is imported if used directly in tests, though typically not needed for component tests

describe('Badge component', () => {
    it('should render the badge with default variant and children', () => {
        render(<Badge>Default Badge</Badge>);
        const badgeElement = screen.getByText('Default Badge');
        expect(badgeElement).toBeInTheDocument();
        // Check for default variant classes (actual classes depend on your badgeVariants definition)
        // This is a basic check, you might need to adjust based on the exact default classes
        expect(badgeElement).toHaveClass('border-transparent', 'bg-primary', 'text-primary-foreground', 'hover:bg-primary/80');
    });

    it('should apply additional className to the badge', () => {
        render(<Badge className="custom-badge-class">Custom Class Badge</Badge>);
        const badgeElement = screen.getByText('Custom Class Badge');
        expect(badgeElement).toHaveClass('custom-badge-class');
    });

    // Test each variant
    // Note: You'll need to know the exact class names your cva function generates for each variant.
    // The class names used below are examples and should be verified against your badge.tsx implementation.

    it('should render with the "secondary" variant', () => {
        render(<Badge variant="secondary">Secondary Badge</Badge>);
        const badgeElement = screen.getByText('Secondary Badge');
        expect(badgeElement).toBeInTheDocument();
        expect(badgeElement).toHaveClass('border-transparent', 'bg-secondary', 'text-secondary-foreground', 'hover:bg-secondary/80');
    });

    it('should render with the "destructive" variant', () => {
        render(<Badge variant="destructive">Destructive Badge</Badge>);
        const badgeElement = screen.getByText('Destructive Badge');
        expect(badgeElement).toBeInTheDocument();
        expect(badgeElement).toHaveClass('border-transparent', 'bg-destructive', 'text-destructive-foreground', 'hover:bg-destructive/80');
    });

    it('should render with the "outline" variant', () => {
        render(<Badge variant="outline">Outline Badge</Badge>);
        const badgeElement = screen.getByText('Outline Badge');
        expect(badgeElement).toBeInTheDocument();
        expect(badgeElement).toHaveClass('text-foreground'); // Outline typically doesn't have a background class from this list
    });

    // Example for testing badgeVariants directly (if needed, though usually testing the component is sufficient)
    describe('badgeVariants function', () => {
        it('should return correct classes for default variant', () => {
            const expectedClasses = "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80";
            // Normalize spaces for comparison
            const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();
            expect(normalize(badgeVariants({ variant: "default" }))).toBe(normalize(expectedClasses));
        });

        it('should return correct classes for secondary variant', () => {
            const expectedClasses = "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80";
            const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();
            expect(normalize(badgeVariants({ variant: "secondary" }))).toBe(normalize(expectedClasses));
        });

        it('should return correct classes for destructive variant', () => {
            const expectedClasses = "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80";
            const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();
            expect(normalize(badgeVariants({ variant: "destructive" }))).toBe(normalize(expectedClasses));
        });

        it('should return correct classes for outline variant', () => {
            const expectedClasses = "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground";
            const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();
            expect(normalize(badgeVariants({ variant: "outline" }))).toBe(normalize(expectedClasses));
        });
    });
});
