import React from 'react';
import { render, screen } from '@testing-library/react';
import { Alert, AlertTitle, AlertDescription } from '../alert'; // Adjust import path
import { Terminal } from 'lucide-react'; // Example icon

describe('Alert component', () => {
    it('should render default alert with title and description', () => {
        render(
            <Alert>
                <AlertTitle>Test Title</AlertTitle>
                <AlertDescription>Test description.</AlertDescription>
            </Alert>
        );
        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(screen.getByText('Test description.')).toBeInTheDocument();
        // Check for default variant classes (implementation detail, but useful for basic check)
        // This might be too brittle if styling changes often.
        const alertElement = screen.getByRole('alert');
        expect(alertElement).toHaveClass('bg-background');
        expect(alertElement).toHaveClass('text-foreground');
    });

    it('should render destructive alert with correct classes', () => {
        render(
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>This is a destructive alert.</AlertDescription>
            </Alert>
        );
        expect(screen.getByText('Error')).toBeInTheDocument();
        const alertElement = screen.getByRole('alert');
        expect(alertElement).toHaveClass('border-destructive/50');
        expect(alertElement).toHaveClass('text-destructive');
    });

    it('should render warning alert with correct classes', () => {
        render(
            <Alert variant="warning">
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>This is a warning alert.</AlertDescription>
            </Alert>
        );
        expect(screen.getByText('Warning')).toBeInTheDocument();
        const alertElement = screen.getByRole('alert');
        expect(alertElement).toHaveClass('border-yellow-500/50');
        expect(alertElement).toHaveClass('text-yellow-700');
        expect(alertElement).toHaveClass('bg-yellow-50');
    });

    it('should render success alert with correct classes', () => {
        render(
            <Alert variant="success">
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>This is a success alert.</AlertDescription>
            </Alert>
        );
        expect(screen.getByText('Success')).toBeInTheDocument();
        const alertElement = screen.getByRole('alert');
        expect(alertElement).toHaveClass('border-green-500/50');
        expect(alertElement).toHaveClass('text-green-700');
        expect(alertElement).toHaveClass('bg-green-50');
    });

    it('should render info alert with correct classes', () => {
        render(
            <Alert variant="info">
                <AlertTitle>Info</AlertTitle>
                <AlertDescription>This is an info alert.</AlertDescription>
            </Alert>
        );
        expect(screen.getByText('Info')).toBeInTheDocument();
        const alertElement = screen.getByRole('alert');
        expect(alertElement).toHaveClass('border-blue-500/50');
        expect(alertElement).toHaveClass('text-blue-700');
        expect(alertElement).toHaveClass('bg-blue-50');
    });

    it('should render with an icon', () => {
        render(
            <Alert>
                <Terminal className="h-4 w-4" />
                <AlertTitle>Heads up!</AlertTitle>
                <AlertDescription>
                    You can add components to your app using the cli.
                </AlertDescription>
            </Alert>
        );
        expect(screen.getByText('Heads up!')).toBeInTheDocument();
        // Check if the SVG for Terminal icon is rendered (lucide-react specific)
        // This assumes Terminal component renders an SVG element.
        const alertElement = screen.getByRole('alert');
        const svgElement = alertElement.querySelector('svg');
        expect(svgElement).toBeInTheDocument();
        expect(svgElement).toHaveClass('h-4'); // from the example
        expect(svgElement).toHaveClass('w-4'); // from the example
    });

    it('should apply additional className to Alert', () => {
        render(<Alert className="custom-class" />);
        expect(screen.getByRole('alert')).toHaveClass('custom-class');
    });

    it('should apply additional className to AlertTitle', () => {
        render(
            <Alert>
                <AlertTitle className="custom-title-class">Title</AlertTitle>
            </Alert>
        );
        expect(screen.getByText('Title')).toHaveClass('custom-title-class');
    });

    it('should apply additional className to AlertDescription', () => {
        render(
            <Alert>
                <AlertDescription className="custom-desc-class">Description</AlertDescription>
            </Alert>
        );
        expect(screen.getByText('Description')).toHaveClass('custom-desc-class');
    });

    it('AlertTitle should be a h5 element', () => {
        render(<Alert><AlertTitle>Title</AlertTitle></Alert>);
        const titleElement = screen.getByText('Title');
        expect(titleElement.tagName).toBe('H5');
    });

    it('AlertDescription should render its children', () => {
        render(<Alert><AlertDescription><p>Paragraph inside</p></AlertDescription></Alert>);
        expect(screen.getByText('Paragraph inside')).toBeInTheDocument();
    });
});
