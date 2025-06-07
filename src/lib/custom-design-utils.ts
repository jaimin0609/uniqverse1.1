// Utility functions for handling custom designs
import { toast } from "sonner";

export interface CustomDesignData {
    elements: DesignElement[];
    canvas: {
        width: number;
        height: number;
        backgroundColor: string;
    };
    pricing: {
        additionalPrice: number;
        breakdown: Record<string, number>;
    };
}

export interface DesignElement {
    id: string;
    type: 'text' | 'image' | 'shape';
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    layer: number;
    locked: boolean;
    properties: Record<string, unknown>;
}

// Save a custom design to the server
export async function saveCustomDesign(
    productId: string,
    designData: CustomDesignData,
    previewUrl?: string
): Promise<string | null> {
    try {
        const response = await fetch('/api/custom-designs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                productId,
                designData: JSON.stringify(designData),
                previewUrl,
                pricing: designData.pricing
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save design');
        }

        const result = await response.json();
        toast.success('Design saved successfully!');
        return result.designId;
    } catch (error) {
        console.error('Error saving custom design:', error);
        toast.error('Failed to save design. Please try again.');
        return null;
    }
}

// Load a custom design from the server
export async function loadCustomDesign(designId: string): Promise<CustomDesignData | null> {
    try {
        const response = await fetch(`/api/custom-designs/${designId}`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to load design');
        }

        const result = await response.json();
        const designData = JSON.parse(result.design.designData);
        return designData;
    } catch (error) {
        console.error('Error loading custom design:', error);
        toast.error('Failed to load design. Please try again.');
        return null;
    }
}

// Get all custom designs for a user
export async function getUserCustomDesigns(productId?: string): Promise<any[]> {
    try {
        const url = productId
            ? `/api/custom-designs?productId=${productId}`
            : '/api/custom-designs';

        const response = await fetch(url);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to load designs');
        }

        const result = await response.json();
        return result.designs;
    } catch (error) {
        console.error('Error loading user designs:', error);
        toast.error('Failed to load designs. Please try again.');
        return [];
    }
}

// Update an existing custom design
export async function updateCustomDesign(
    designId: string,
    designData: CustomDesignData,
    previewUrl?: string
): Promise<boolean> {
    try {
        const response = await fetch(`/api/custom-designs/${designId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                designData: JSON.stringify(designData),
                previewUrl,
                pricing: designData.pricing
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update design');
        }

        toast.success('Design updated successfully!');
        return true;
    } catch (error) {
        console.error('Error updating custom design:', error);
        toast.error('Failed to update design. Please try again.');
        return false;
    }
}

// Delete a custom design
export async function deleteCustomDesign(designId: string): Promise<boolean> {
    try {
        const response = await fetch(`/api/custom-designs/${designId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete design');
        }

        toast.success('Design deleted successfully!');
        return true;
    } catch (error) {
        console.error('Error deleting custom design:', error);
        toast.error('Failed to delete design. Please try again.');
        return false;
    }
}

// Generate a preview URL from canvas data (placeholder function)
export function generatePreviewUrl(canvasRef: HTMLCanvasElement): string {
    try {
        return canvasRef.toDataURL('image/png', 0.8);
    } catch (error) {
        console.error('Error generating preview:', error);
        return '';
    }
}

// Calculate pricing based on design complexity
export function calculateDesignPricing(elements: DesignElement[]): {
    additionalPrice: number;
    breakdown: Record<string, number>;
} {
    const pricing = {
        additionalPrice: 0,
        breakdown: {} as Record<string, number>
    };

    // Base customization fee
    if (elements.length > 0) {
        pricing.breakdown['Base customization'] = 5.00;
        pricing.additionalPrice += 5.00;
    }

    // Per-element pricing
    elements.forEach((element, index) => {
        switch (element.type) {
            case 'text':
                const textPrice = 2.00;
                pricing.breakdown[`Text element ${index + 1}`] = textPrice;
                pricing.additionalPrice += textPrice;
                break;
            case 'image':
                const imagePrice = 3.00;
                pricing.breakdown[`Image element ${index + 1}`] = imagePrice;
                pricing.additionalPrice += imagePrice;
                break;
            case 'shape':
                const shapePrice = 1.50;
                pricing.breakdown[`Shape element ${index + 1}`] = shapePrice;
                pricing.additionalPrice += shapePrice;
                break;
        }
    });

    // Round to 2 decimal places
    pricing.additionalPrice = Math.round(pricing.additionalPrice * 100) / 100;

    return pricing;
}
