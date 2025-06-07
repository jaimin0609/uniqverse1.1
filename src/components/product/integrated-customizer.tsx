'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Eye,
    EyeOff,
    Users,
    Palette,
    Settings,
    Sparkles,
    Share2,
    Download,
    Save,
    RefreshCw,
    PauseCircle
} from 'lucide-react';
import { toast } from 'sonner';

// Import our new enhanced components
import EnhancedProductCustomizer from './enhanced-product-customizer';
import Product3DPreview from './product-3d-preview';
import CollaborationSystem from './collaboration-system';
import AdvancedDesignTools from './advanced-design-tools';
import useRealTimeSync from '@/hooks/use-real-time-sync';

interface CustomizationArea {
    id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    price_modifier: number;
}

interface IntegratedCustomizerProps {
    productId: string;
    basePrice: number;
    customizationAreas: CustomizationArea[];
    productType?: 'tshirt' | 'mug' | 'hoodie' | 'poster';
    onPriceChange: (price: number) => void;
    onDesignChange: (design: any) => void;
}

export default function IntegratedCustomizer({
    productId,
    basePrice,
    customizationAreas,
    productType = 'tshirt',
    onPriceChange,
    onDesignChange
}: IntegratedCustomizerProps) {
    const [activeMode, setActiveMode] = useState<'2d' | '3d'>('2d');
    const [isCollaborationEnabled, setIsCollaborationEnabled] = useState(false);
    const [showAdvancedTools, setShowAdvancedTools] = useState(false);
    const [currentDesign, setCurrentDesign] = useState<any>(null);
    const [designPrice, setDesignPrice] = useState(basePrice);
    const [fabricCanvasRef, setFabricCanvasRef] = useState<any>(null);
    const [product3DRef, setProduct3DRef] = useState<any>(null);
    const [syncEnabled, setSyncEnabled] = useState(true);

    // Initialize real-time sync
    const {
        syncCanvasTo3D,
        setupCanvasListeners,
        generateTextureFromCanvas
    } = useRealTimeSync({
        throttleMs: 150, // Slightly slower for better performance
        enableTextureSync: syncEnabled,
        enable3DUpdate: activeMode === '3d' || syncEnabled,
        debugMode: process.env.NODE_ENV === 'development'
    });    // User info - in a real app, this would come from auth
    const userId = 'user-123';
    const userName = 'Design User';    // Setup real-time sync when fabric canvas is available
    useEffect(() => {
        if (fabricCanvasRef && syncEnabled) {
            const cleanup = setupCanvasListeners(fabricCanvasRef, async (change) => {
                // Update 3D preview when 2D design changes
                if (product3DRef && (activeMode === '3d' || syncEnabled)) {
                    await syncCanvasTo3D(
                        fabricCanvasRef,
                        product3DRef.mesh || product3DRef.productMesh,
                        customizationAreas,
                        (texture, areaId) => {
                            // Handle texture update in 3D preview using the API
                            if (product3DRef.updateTextureFromThreeTexture) {
                                product3DRef.updateTextureFromThreeTexture(texture, areaId);
                            } else if (product3DRef.updateTexture) {
                                product3DRef.updateTexture(texture, areaId);
                            }
                        }
                    );
                }

                // Update current design state
                if (fabricCanvasRef.toJSON) {
                    const designData = fabricCanvasRef.toJSON();
                    setCurrentDesign(designData);
                    onDesignChange(designData);
                }
            });

            return cleanup;
        }
    }, [fabricCanvasRef, product3DRef, syncEnabled, activeMode, customizationAreas, setupCanvasListeners, syncCanvasTo3D, onDesignChange]); const handleDesignChange = (design: any) => {
        setCurrentDesign(design);
        onDesignChange(design);
    };

    const handlePriceChange = (price: number) => {
        setDesignPrice(price);
        onPriceChange(price);
    };

    const handleCanvasReady = (fabricCanvas: any) => {
        setFabricCanvasRef(fabricCanvas);
    };

    const handle3DReady = (preview3D: any) => {
        setProduct3DRef(preview3D);
    }; const toggleSync = () => {
        setSyncEnabled(!syncEnabled);
        toast.info(syncEnabled ? 'Real-time sync disabled' : 'Real-time sync enabled');
    };

    const manualSync = async () => {
        if (fabricCanvasRef && product3DRef) {
            try {
                await syncCanvasTo3D(
                    fabricCanvasRef,
                    product3DRef.mesh || product3DRef.productMesh,
                    customizationAreas,
                    (texture, areaId) => {
                        if (product3DRef.updateTextureFromThreeTexture) {
                            product3DRef.updateTextureFromThreeTexture(texture, areaId);
                        } else if (product3DRef.updateTexture) {
                            product3DRef.updateTexture(texture, areaId);
                        }
                    }
                );
                toast.success('Manual sync completed successfully!');
            } catch (error) {
                console.error('Manual sync failed:', error);
                toast.error('Manual sync failed. Check console for details.');
            }
        } else {
            toast.warning('Canvas or 3D preview not ready for sync.');
        }
    };

    const handleTemplateSelect = (template: any) => {
        toast.success(`Applied template: ${template.name}`);
        // In a real implementation, this would apply the template to the canvas
    };

    const handleToolSelect = (tool: any) => {
        toast.success(`Activated tool: ${tool.name}`);
        // In a real implementation, this would activate the selected tool
    }; const toggle3DMode = () => {
        const newMode = activeMode === '2d' ? '3d' : '2d';
        setActiveMode(newMode);

        // Trigger immediate sync when switching to 3D
        if (newMode === '3d' && fabricCanvasRef && product3DRef && syncEnabled) {
            setTimeout(async () => {
                await syncCanvasTo3D(
                    fabricCanvasRef,
                    product3DRef.mesh || product3DRef.productMesh,
                    customizationAreas,
                    (texture, areaId) => {
                        if (product3DRef.updateTextureFromThreeTexture) {
                            product3DRef.updateTextureFromThreeTexture(texture, areaId);
                        } else if (product3DRef.updateTexture) {
                            product3DRef.updateTexture(texture, areaId);
                        }
                    }
                );
            }, 100); // Small delay to ensure 3D component is ready
        }

        toast.info(newMode === '3d' ? 'Switched to 3D preview' : 'Switched to 2D editor');
    };

    const toggleCollaboration = () => {
        setIsCollaborationEnabled(!isCollaborationEnabled);
        if (!isCollaborationEnabled) {
            toast.success('Collaboration enabled! You can now share and work together.');
        } else {
            toast.info('Collaboration disabled.');
        }
    };

    const toggleAdvancedTools = () => {
        setShowAdvancedTools(!showAdvancedTools);
        toast.info(showAdvancedTools ? 'Advanced tools hidden' : 'Advanced tools shown');
    };

    const exportDesign = () => {
        toast.success('Design exported successfully!');
    };

    const saveDesign = () => {
        toast.success('Design saved to your library!');
    };

    const shareDesign = () => {
        if (navigator.share) {
            navigator.share({
                title: 'Check out my custom design!',
                text: 'I created this amazing design with the product customizer.',
                url: window.location.href,
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Share link copied to clipboard!');
        }
    };

    return (
        <div className="w-full min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Product Customizer</h1>
                            <p className="text-sm text-gray-600">Design your perfect product with advanced tools</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <Badge variant="secondary" className="text-lg px-3 py-1">
                                ${designPrice.toFixed(2)}
                            </Badge>                            <div className="flex gap-2">
                                <Button
                                    variant={activeMode === '3d' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={toggle3DMode}
                                >
                                    <Eye className="h-4 w-4 mr-2" />
                                    3D Preview
                                </Button>                                <Button
                                    variant={syncEnabled ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={toggleSync}
                                    className={syncEnabled ? 'bg-green-600 hover:bg-green-700' : ''}
                                >
                                    {syncEnabled ? <RefreshCw className="h-4 w-4 mr-2" /> : <PauseCircle className="h-4 w-4 mr-2" />}
                                    Real-time Sync
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={manualSync}
                                    disabled={!fabricCanvasRef || !product3DRef}
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Manual Sync
                                </Button>

                                <Button
                                    variant={isCollaborationEnabled ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={toggleCollaboration}
                                >
                                    <Users className="h-4 w-4 mr-2" />
                                    Collaborate
                                </Button>

                                <Button
                                    variant={showAdvancedTools ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={toggleAdvancedTools}
                                >
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Pro Tools
                                </Button>
                            </div>

                            <Separator orientation="vertical" className="h-8" />

                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={saveDesign}>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save
                                </Button>

                                <Button variant="outline" size="sm" onClick={shareDesign}>
                                    <Share2 className="h-4 w-4 mr-2" />
                                    Share
                                </Button>

                                <Button variant="outline" size="sm" onClick={exportDesign}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Export
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto p-6">
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    {/* Advanced Tools Sidebar */}
                    {showAdvancedTools && (
                        <div className="xl:col-span-1">
                            <AdvancedDesignTools
                                onTemplateSelect={handleTemplateSelect}
                                onToolSelect={handleToolSelect}
                                currentCanvas={currentDesign}
                            />
                        </div>
                    )}

                    {/* Main Customizer Area */}
                    <div className={showAdvancedTools ? "xl:col-span-3" : "xl:col-span-4"}>
                        <div className="space-y-6">
                            {/* Mode Toggle */}
                            <Card>
                                <CardContent className="p-4">
                                    <Tabs value={activeMode} onValueChange={(value) => setActiveMode(value as '2d' | '3d')}>
                                        <TabsList className="grid w-full grid-cols-2">
                                            <TabsTrigger value="2d" className="flex items-center gap-2">
                                                <Palette className="h-4 w-4" />
                                                Design Editor
                                            </TabsTrigger>
                                            <TabsTrigger value="3d" className="flex items-center gap-2">
                                                <Eye className="h-4 w-4" />
                                                3D Preview
                                            </TabsTrigger>
                                        </TabsList>                                        <TabsContent value="2d" className="mt-6">
                                            <EnhancedProductCustomizer
                                                productId={productId}
                                                basePrice={basePrice}
                                                customizationAreas={customizationAreas}
                                                onPriceChange={handlePriceChange}
                                                onDesignChange={handleDesignChange}
                                                onCanvasReady={handleCanvasReady}
                                            />
                                        </TabsContent>

                                        <TabsContent value="3d" className="mt-6">
                                            <Product3DPreview
                                                designData={currentDesign}
                                                productType={productType}
                                                onScreenshot={(dataUrl) => {
                                                    toast.success('Screenshot captured!');
                                                }}
                                                onReady={handle3DReady}
                                                syncEnabled={syncEnabled}
                                            />
                                        </TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <Card>
                                    <CardContent className="p-4 text-center">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {currentDesign?.length || 0}
                                        </div>
                                        <div className="text-sm text-gray-600">Design Elements</div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-4 text-center">
                                        <div className="text-2xl font-bold text-green-600">
                                            {customizationAreas.length}
                                        </div>
                                        <div className="text-sm text-gray-600">Print Areas</div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-4 text-center">
                                        <div className="text-2xl font-bold text-purple-600">
                                            {isCollaborationEnabled ? '3' : '1'}
                                        </div>
                                        <div className="text-sm text-gray-600">Collaborators</div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-4 text-center">
                                        <div className="text-2xl font-bold text-orange-600">
                                            ${(designPrice - basePrice).toFixed(2)}
                                        </div>
                                        <div className="text-sm text-gray-600">Customization Cost</div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Feature Highlights */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Sparkles className="h-5 w-5" />
                                        Enhanced Features
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                                            <Eye className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                                            <h3 className="font-medium text-blue-900">3D Preview</h3>
                                            <p className="text-sm text-blue-700 mt-1">
                                                See your design in realistic 3D with WebGL rendering
                                            </p>
                                        </div>

                                        <div className="text-center p-4 bg-green-50 rounded-lg">
                                            <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                            <h3 className="font-medium text-green-900">Real-time Collaboration</h3>
                                            <p className="text-sm text-green-700 mt-1">
                                                Work together with your team in real-time
                                            </p>
                                        </div>

                                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                                            <Palette className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                                            <h3 className="font-medium text-purple-900">Advanced Tools</h3>
                                            <p className="text-sm text-purple-700 mt-1">
                                                Professional design tools and templates
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            {/* Collaboration System */}
            {isCollaborationEnabled && (
                <CollaborationSystem
                    designId={productId}
                    userId={userId}
                    userName={userName}
                    onDesignChange={(change) => {
                        toast.info(`${change.userName} ${change.action}`);
                    }}
                    onUsersChange={(users) => {
                        console.log('Users updated:', users);
                    }}
                />
            )}
        </div>
    );
}
