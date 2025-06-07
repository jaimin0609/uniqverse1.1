'use client';

import IntegratedCustomizer from '@/components/product/integrated-customizer';

export default function CustomizerDemoPage() {
    // Demo data
    const customizationAreas = [
        {
            id: 'front-chest',
            name: 'Front Chest',
            x: 150,
            y: 100,
            width: 200,
            height: 150,
            price_modifier: 4.99
        },
        {
            id: 'back-full',
            name: 'Back Full Print',
            x: 50,
            y: 50,
            width: 300,
            height: 250,
            price_modifier: 9.99
        },
        {
            id: 'sleeve-left',
            name: 'Left Sleeve',
            x: 20,
            y: 120,
            width: 80,
            height: 100,
            price_modifier: 2.99
        }
    ];

    const handlePriceChange = (price: number) => {
        console.log('Price updated:', price);
    };

    const handleDesignChange = (design: any) => {
        console.log('Design updated:', design);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <IntegratedCustomizer
                productId="demo-tshirt-001"
                basePrice={29.99}
                customizationAreas={customizationAreas}
                productType="tshirt"
                onPriceChange={handlePriceChange}
                onDesignChange={handleDesignChange}
            />
        </div>
    );
}
