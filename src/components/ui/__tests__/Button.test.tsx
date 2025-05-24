import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from '../button'; // Adjust path to your Button component

describe('Button Component', () => {
    it('renders with default props', () => {
        render(<Button>Click Me</Button>);
        const buttonElement = screen.getByRole('button', { name: /click me/i });
        expect(buttonElement).toBeInTheDocument();
        expect(buttonElement).not.toBeDisabled();
        expect(buttonElement).toHaveClass('bg-primary text-primary-foreground'); // Default variant
        expect(buttonElement).toHaveClass('h-10 px-4 py-2'); // Default size
    });

    it('renders with a custom className', () => {
        render(<Button className="custom-class">Custom Button</Button>);
        const buttonElement = screen.getByRole('button', { name: /custom button/i });
        expect(buttonElement).toHaveClass('custom-class');
    });

    it('calls onClick handler when clicked', () => {
        const handleClick = jest.fn();
        render(<Button onClick={handleClick}>Clickable</Button>);
        const buttonElement = screen.getByRole('button', { name: /clickable/i });
        fireEvent.click(buttonElement);
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('is disabled when disabled prop is true', () => {
        render(<Button disabled>Disabled Button</Button>);
        const buttonElement = screen.getByRole('button', { name: /disabled button/i });
        expect(buttonElement).toBeDisabled();
    });

    it('renders with destructive variant', () => {
        render(<Button variant="destructive">Delete</Button>);
        const buttonElement = screen.getByRole('button', { name: /delete/i });
        expect(buttonElement).toHaveClass('bg-destructive text-destructive-foreground');
    });

    it('renders with outline variant', () => {
        render(<Button variant="outline">Submit</Button>);
        const buttonElement = screen.getByRole('button', { name: /submit/i });
        expect(buttonElement).toHaveClass('border border-input bg-background');
    });

    it('renders with secondary variant', () => {
        render(<Button variant="secondary">Cancel</Button>);
        const buttonElement = screen.getByRole('button', { name: /cancel/i });
        expect(buttonElement).toHaveClass('bg-secondary text-secondary-foreground');
    });

    it('renders with ghost variant', () => {
        render(<Button variant="ghost">Ghost</Button>);
        const buttonElement = screen.getByRole('button', { name: /ghost/i });
        expect(buttonElement).toHaveClass('hover:bg-accent hover:text-accent-foreground');
    });

    it('renders with link variant', () => {
        render(<Button variant="link">Learn More</Button>);
        const buttonElement = screen.getByRole('button', { name: /learn more/i });
        expect(buttonElement).toHaveClass('text-primary underline-offset-4 hover:underline');
    });

    it('renders with sm size', () => {
        render(<Button size="sm">Small</Button>);
        const buttonElement = screen.getByRole('button', { name: /small/i });
        expect(buttonElement).toHaveClass('h-8 rounded-md px-3 text-xs');
    });

    it('renders with lg size', () => {
        render(<Button size="lg">Large</Button>);
        const buttonElement = screen.getByRole('button', { name: /large/i });
        expect(buttonElement).toHaveClass('h-12 rounded-md px-8');
    });

    it('renders with icon size', () => {
        render(<Button size="icon" aria-label="Icon Button"><svg /></Button>);
        const buttonElement = screen.getByRole('button', { name: /icon button/i });
        expect(buttonElement).toHaveClass('h-9 w-9');
    });

    it('renders as child when asChild prop is true', () => {
        render(<Button asChild><a href="/">Link Button</a></Button>);
        const linkElement = screen.getByRole('link', { name: /link button/i });
        expect(linkElement).toBeInTheDocument();
        expect(linkElement.tagName).toBe('A');
        expect(linkElement).toHaveClass('bg-primary text-primary-foreground'); // Default variant classes still apply
    });
});
