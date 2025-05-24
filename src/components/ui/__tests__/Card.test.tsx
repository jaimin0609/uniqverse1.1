import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../card';

describe('Card', () => {
    test('renders Card component with children', () => {
        render(<Card>Card Content</Card>);
        expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    test('renders Card with custom className', () => {
        render(<Card className="custom-card">Card Content</Card>);
        expect(screen.getByText('Card Content')).toHaveClass('custom-card'); // Corrected this line
    });
});

describe('CardHeader', () => {
    test('renders CardHeader component with children', () => {
        render(<CardHeader>Header Content</CardHeader>);
        expect(screen.getByText('Header Content')).toBeInTheDocument();
    });

    test('renders CardHeader with custom className', () => {
        render(<CardHeader className="custom-header">Header Content</CardHeader>);
        expect(screen.getByText('Header Content')).toHaveClass('custom-header');
    });
});

describe('CardTitle', () => {
    test('renders CardTitle component with children', () => {
        render(<CardTitle>Title Content</CardTitle>);
        expect(screen.getByText('Title Content')).toBeInTheDocument();
    });

    test('renders CardTitle with custom className', () => {
        render(<CardTitle className="custom-title">Title Content</CardTitle>);
        expect(screen.getByText('Title Content')).toHaveClass('custom-title');
    });
});

describe('CardDescription', () => {
    test('renders CardDescription component with children', () => {
        render(<CardDescription>Description Content</CardDescription>);
        expect(screen.getByText('Description Content')).toBeInTheDocument();
    });

    test('renders CardDescription with custom className', () => {
        render(<CardDescription className="custom-description">Description Content</CardDescription>);
        expect(screen.getByText('Description Content')).toHaveClass('custom-description');
    });
});

describe('CardContent', () => {
    test('renders CardContent component with children', () => {
        render(<CardContent>Main Content</CardContent>);
        expect(screen.getByText('Main Content')).toBeInTheDocument();
    });

    test('renders CardContent with custom className', () => {
        render(<CardContent className="custom-content">Main Content</CardContent>);
        expect(screen.getByText('Main Content')).toHaveClass('custom-content');
    });
});

describe('CardFooter', () => {
    test('renders CardFooter component with children', () => {
        render(<CardFooter>Footer Content</CardFooter>);
        expect(screen.getByText('Footer Content')).toBeInTheDocument();
    });

    test('renders CardFooter with custom className', () => {
        render(<CardFooter className="custom-footer">Footer Content</CardFooter>);
        expect(screen.getByText('Footer Content')).toHaveClass('custom-footer');
    });
});

