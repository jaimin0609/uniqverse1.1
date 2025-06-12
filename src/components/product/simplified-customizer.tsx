'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Download,
    Save,
    Share2,
    Eye,
    Palette,
    Image as ImageIcon,
    ShoppingCart,
    Type
} from 'lucide-react';
import { toast } from 'sonner';

import PrintfulDesignTool from './printful-design-tool';
import { printfulService, type PrintfulProduct, type DesignMockupRequest } from '@/services/integrations/printful-integration';

interface CustomizationArea {
    id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    price_modifier: number;
}

interface SimplifiedCustomizerProps {
    productId: string;
    productName: string;
    basePrice: number;
    productImageUrl: string;
    customizationAreas: CustomizationArea[];
    onPriceChange: (price: number) => void;
    onDesignChange: (design: any) => void;
}

export default function SimplifiedCustomizer({
    productId,
    productName,
    basePrice,
    productImageUrl,
    customizationAreas,
    onPriceChange,
    onDesignChange
}: SimplifiedCustomizerProps) {
    const [currentDesign, setCurrentDesign] = useState<string | null>(null);
    const [designPrice, setDesignPrice] = useState(basePrice);
    const [mockupUrl, setMockupUrl] = useState<string | null>(null);
    const [isGeneratingMockup, setIsGeneratingMockup] = useState(false);
    const [printfulProducts, setPrintfulProducts] = useState<PrintfulProduct[]>([]);
    const [selectedPrintfulProduct, setSelectedPrintfulProduct] = useState<PrintfulProduct | null>(null);
    const [activeView, setActiveView] = useState<'design' | 'mockup'>('design');

    // Use the first (main) customization area for the design tool
    const primaryPrintArea = customizationAreas[0] || {
        id: 'main',
        name: 'Main Print Area',
        x: 50,
        y: 50,
        width: 300,
        height: 400,
        price_modifier: 0
    };

    // Load Printful products on mount
    useEffect(() => {
        loadPrintfulProducts();
    }, []);

    const loadPrintfulProducts = async () => {
        try {
            const products = await printfulService.getStoreProducts();
            setPrintfulProducts(products);
        } catch (error) {
            console.error('Failed to load Printful products:', error);
        }
    };

    const handleDesignChange = (designData: string, previewUrl?: string) => {
        setCurrentDesign(designData);
        onDesignChange(designData);

        // Auto-generate mockup if we have a Printful product selected
        if (selectedPrintfulProduct && previewUrl) {
            generateMockup(previewUrl);
        }
    };

    const handlePriceChange = (additionalPrice: number) => {
        const newPrice = basePrice + additionalPrice;
        setDesignPrice(newPrice);
        onPriceChange(newPrice);
    };

    const generateMockup = async (designImageUrl: string) => {
        if (!selectedPrintfulProduct?.variants[0]) {
            toast.error('Please select a Printful product first');
            return;
        }

        setIsGeneratingMockup(true);

        try {
            const mockupRequest: DesignMockupRequest = {
                variant_id: selectedPrintfulProduct.variants[0].variant_id,
                format: 'png',
                files: [{
                    placement: 'front',
                    image_url: designImageUrl,
                    position: {
                        area_width: primaryPrintArea.width,
                        area_height: primaryPrintArea.height,
                        width: primaryPrintArea.width,
                        height: primaryPrintArea.height,
                        top: primaryPrintArea.y,
                        left: primaryPrintArea.x
                    }
                }]
            };

            const result = await printfulService.generateMockup(mockupRequest);
            if (result?.result?.placements?.[0]?.mockup_url) {
                setMockupUrl(result.result.placements[0].mockup_url);
                setActiveView('mockup');
                toast.success('Mockup generated successfully!');
            }
        } catch (error) {
            console.error('Failed to generate mockup:', error);
            toast.error('Failed to generate mockup');
        } finally {
            setIsGeneratingMockup(false);
        }
    };

    const saveDesign = () => {
        if (!currentDesign) {
            toast.error('No design to save');
            return;
        }

        // In a real app, this would save to your backend
        localStorage.setItem(`printful-design-${productId}`, currentDesign);
        toast.success('Design saved successfully!');
    };

    const exportDesign = () => {
        if (!currentDesign) {
            toast.error('No design to export');
            return;
        }

        const designBlob = new Blob([currentDesign], { type: 'application/json' });
        const url = URL.createObjectURL(designBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${productName}-design.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Design exported!');
    };

    const shareDesign = async () => {
        if (!mockupUrl) {
            toast.error('Generate a mockup first to share');
            return;
        }

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Check out my ${productName} design!`,
                    text: 'I created this amazing design using the Printful Design Tool',
                    url: window.location.href,
                });
                toast.success('Design shared!');
            } catch (error) {
                console.error('Share failed:', error);
            }
        } else {
            // Fallback: copy link to clipboard
            await navigator.clipboard.writeText(window.location.href);
            toast.success('Share link copied to clipboard!');
        }
    };

    const addToCart = () => {
        if (!currentDesign) {
            toast.error('Please create a design first');
            return;
        }

        // In a real app, this would add the customized product to cart
        toast.success('Custom product added to cart!');

        // Trigger any parent cart logic here
        onDesignChange({
            design: currentDesign,
            price: designPrice,
            mockup: mockupUrl,
            productId,
            timestamp: Date.now()
        });
    };

    return (
        <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Design Studio</h1>
                    <p className="text-gray-600">Create your perfect {productName} with our easy-to-use design tools</p>
                </div>
                <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                        ${designPrice.toFixed(2)}
                    </Badge>
                    <div className="flex gap-2">
                        <Button onClick={saveDesign} variant="outline" size="sm">
                            <Save className="h-4 w-4 mr-2" />
                            Save
                        </Button>
                        <Button onClick={exportDesign} variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                        <Button onClick={shareDesign} variant="outline" size="sm">
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                        </Button>
                        <Button onClick={addToCart} className="bg-blue-600 hover:bg-blue-700">
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Add to Cart
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Printful Products Sidebar */}
                <div className="xl:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5" />
                                Printful Products
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {printfulProducts.length === 0 ? (
                                    <p className="text-sm text-gray-500">Loading products...</p>
                                ) : (
                                    printfulProducts.map((product) => (
                                        <button
                                            key={product.id}
                                            onClick={() => setSelectedPrintfulProduct(product)}
                                            className={`w-full p-2 text-left border rounded-lg transition-colors ${selectedPrintfulProduct?.id === product.id
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="text-sm font-medium">{product.name}</div>
                                            <div className="text-xs text-gray-500">
                                                {product.variants.length} variant{product.variants.length !== 1 ? 's' : ''}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>

                            {selectedPrintfulProduct && (
                                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                                    <div className="text-sm font-medium text-green-800">
                                        Selected: {selectedPrintfulProduct.name}
                                    </div>
                                    <div className="text-xs text-green-600 mt-1">
                                        Mockup generation enabled
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Stats */}
                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle className="text-lg">Design Stats</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Base Price</span>
                                    <span className="text-sm font-medium">${basePrice.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Design Cost</span>
                                    <span className="text-sm font-medium">${(designPrice - basePrice).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between border-t pt-2">
                                    <span className="text-sm font-medium">Total</span>
                                    <span className="text-lg font-bold text-blue-600">${designPrice.toFixed(2)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Design Area */}
                <div className="xl:col-span-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Design Workspace</span>
                                <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'design' | 'mockup')}>
                                    <TabsList>
                                        <TabsTrigger value="design" className="flex items-center gap-2">
                                            <Palette className="h-4 w-4" />
                                            Design
                                        </TabsTrigger>
                                        <TabsTrigger value="mockup" className="flex items-center gap-2">
                                            <Eye className="h-4 w-4" />
                                            Mockup
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {activeView === 'design' ? (
                                <PrintfulDesignTool
                                    productId={productId}
                                    productName={productName}
                                    baseImageUrl={productImageUrl}
                                    printArea={primaryPrintArea}
                                    onDesignChange={handleDesignChange}
                                    onPriceChange={handlePriceChange}
                                />
                            ) : (
                                <div className="min-h-[600px] flex items-center justify-center">
                                    {isGeneratingMockup ? (
                                        <div className="text-center">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                            <p className="text-lg font-medium">Generating Mockup...</p>
                                            <p className="text-sm text-gray-600">Creating realistic product preview</p>
                                        </div>
                                    ) : mockupUrl ? (
                                        <div className="text-center space-y-4">
                                            <img
                                                src={mockupUrl}
                                                alt="Product Mockup"
                                                className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
                                            />
                                            <p className="text-sm text-gray-600">Realistic product mockup generated by Printful</p>
                                            <Button
                                                onClick={() => window.open(mockupUrl, '_blank')}
                                                variant="outline"
                                            >
                                                <Download className="h-4 w-4 mr-2" />
                                                Download Mockup
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="text-center space-y-4">
                                            <ImageIcon className="h-16 w-16 text-gray-400 mx-auto" />
                                            <div>
                                                <h3 className="text-lg font-medium text-gray-900">No Mockup Generated</h3>
                                                <p className="text-gray-600">Create a design and select a Printful product to generate a realistic mockup</p>
                                            </div>
                                            <Button
                                                onClick={() => setActiveView('design')}
                                                variant="outline"
                                            >
                                                <Palette className="h-4 w-4 mr-2" />
                                                Start Designing
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Features Info */}
            <Card>
                <CardHeader>
                    <CardTitle>✨ Printful-Style Design Features</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <Type className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                            <h3 className="font-medium text-blue-900">Professional Text Tools</h3>
                            <p className="text-sm text-blue-700 mt-1">
                                15+ fonts, sizing, spacing, and alignment tools
                            </p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <Palette className="h-8 w-8 text-green-600 mx-auto mb-2" />
                            <h3 className="font-medium text-green-900">Extensive Clipart Library</h3>
                            <p className="text-sm text-green-700 mt-1">
                                Searchable graphics and design elements
                            </p>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <ImageIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                            <h3 className="font-medium text-purple-900">Image Upload</h3>
                            <p className="text-sm text-purple-700 mt-1">
                                Support for PNG, JPEG, SVG up to 200MB
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
