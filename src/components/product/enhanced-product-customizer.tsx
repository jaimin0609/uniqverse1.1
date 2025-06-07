'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
    Download,
    Upload,
    Save,
    Undo,
    Redo,
    Type,
    Image as ImageIcon,
    Square,
    Circle,
    Triangle,
    Palette,
    Move,
    RotateCcw,
    Trash2,
    Eye,
    Users,
    Share2
} from 'lucide-react';
import { toast } from 'sonner';

interface CustomizationArea {
    id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    price_modifier: number;
}

interface ProductCustomizerProps {
    productId: string;
    basePrice: number;
    customizationAreas: CustomizationArea[];
    onPriceChange: (price: number) => void;
    onDesignChange: (design: any) => void;
    onCanvasReady?: (fabricCanvas: any) => void;
}

interface DesignObject {
    id: string;
    type: 'text' | 'image' | 'shape';
    data: any;
    areaId: string;
}

interface CollaborationUser {
    id: string;
    name: string;
    color: string;
    cursor?: { x: number; y: number };
}

export default function EnhancedProductCustomizer({
    productId,
    basePrice,
    customizationAreas,
    onPriceChange,
    onDesignChange,
    onCanvasReady
}: ProductCustomizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<any>(null);
    const [selectedArea, setSelectedArea] = useState<CustomizationArea | null>(null);
    const [designObjects, setDesignObjects] = useState<DesignObject[]>([]);
    const [currentPrice, setCurrentPrice] = useState(basePrice);
    const [selectedTool, setSelectedTool] = useState<string>('select');
    const [textInput, setTextInput] = useState('');
    const [selectedColor, setSelectedColor] = useState('#000000');
    const [fontSize, setFontSize] = useState([20]);
    const [history, setHistory] = useState<any[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [isCollaborationEnabled, setIsCollaborationEnabled] = useState(false);
    const [collaborators, setCollaborators] = useState<CollaborationUser[]>([]);
    const [is3DPreviewMode, setIs3DPreviewMode] = useState(false);
    const [fabricLoaded, setFabricLoaded] = useState(false);
    const [fabric, setFabric] = useState<any>(null);    // Load Fabric.js dynamically
    useEffect(() => {
        const loadFabric = async () => {
            try {
                const fabricModule = await import('fabric');
                // Handle both old and new fabric module structures
                const fabricInstance = (fabricModule as any).fabric || fabricModule.default || fabricModule;
                setFabric(fabricInstance);
                setFabricLoaded(true);
            } catch (error) {
                console.error('Failed to load Fabric.js:', error);
                toast.error('Failed to load design editor');
            }
        };

        if (!fabricLoaded) {
            loadFabric();
        }
    }, [fabricLoaded]);

    // Initialize Fabric.js canvas
    useEffect(() => {
        if (canvasRef.current && !fabricCanvasRef.current && fabric && fabricLoaded) {
            const canvas = new fabric.Canvas(canvasRef.current, {
                width: 600,
                height: 400,
                backgroundColor: '#ffffff',
                selection: true,
            });

            fabricCanvasRef.current = canvas;

            // Expose canvas to parent component for real-time sync
            if (onCanvasReady) {
                onCanvasReady(canvas);
            }

            // Add customization areas as guidelines
            customizationAreas.forEach(area => {
                const rect = new fabric.Rect({
                    left: area.x,
                    top: area.y,
                    width: area.width,
                    height: area.height,
                    fill: 'transparent',
                    stroke: '#ddd',
                    strokeWidth: 2,
                    strokeDashArray: [5, 5],
                    selectable: false,
                    evented: false,
                    name: `area-${area.id}`,
                });
                canvas.add(rect);

                // Add area label
                const label = new fabric.Text(area.name, {
                    left: area.x + 5,
                    top: area.y + 5,
                    fontSize: 12,
                    fill: '#666',
                    selectable: false,
                    evented: false,
                });
                canvas.add(label);
            });

            // Event listeners
            canvas.on('object:added', saveState);
            canvas.on('object:removed', saveState);
            canvas.on('object:modified', saveState);
            canvas.on('selection:created', handleSelection);
            canvas.on('selection:updated', handleSelection);
            canvas.on('selection:cleared', () => setSelectedArea(null));

            // Initial state save
            saveState(); return () => {
                canvas.dispose();
            };
        }
    }, [customizationAreas, fabric, fabricLoaded, onCanvasReady]);

    const saveState = useCallback(() => {
        if (!fabricCanvasRef.current) return;

        const state = JSON.stringify(fabricCanvasRef.current.toJSON());
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(state);
            return newHistory.slice(-50); // Keep last 50 states
        });
        setHistoryIndex(prev => prev + 1);

        // Update design objects and price
        updateDesignObjects();
    }, [historyIndex]);

    const handleSelection = useCallback((e: any) => {
        const activeObject = e.target || e.selected?.[0];
        if (activeObject && activeObject.name?.startsWith('area-')) {
            const areaId = activeObject.name.split('-')[1];
            const area = customizationAreas.find(a => a.id === areaId);
            setSelectedArea(area || null);
        }
    }, [customizationAreas]);

    const updateDesignObjects = useCallback(() => {
        if (!fabricCanvasRef.current) return;

        const objects = fabricCanvasRef.current.getObjects().filter(obj =>
            !obj.name?.startsWith('area-') && obj.type !== 'text' ||
            (obj.type === 'text' && obj.text !== '')
        );

        const newDesignObjects: DesignObject[] = objects.map((obj, index) => {
            const areaId = findObjectArea(obj);
            return {
                id: `obj-${index}`,
                type: obj.type === 'textbox' || obj.type === 'text' ? 'text' :
                    obj.type === 'image' ? 'image' : 'shape',
                data: obj.toObject(),
                areaId: areaId || ''
            };
        });

        setDesignObjects(newDesignObjects);

        // Calculate new price
        const additionalCost = newDesignObjects.reduce((total, obj) => {
            const area = customizationAreas.find(a => a.id === obj.areaId);
            return total + (area ? area.price_modifier : 0);
        }, 0);

        const newPrice = basePrice + additionalCost;
        setCurrentPrice(newPrice);
        onPriceChange(newPrice);
        onDesignChange(newDesignObjects);
    }, [basePrice, customizationAreas, onPriceChange, onDesignChange]); const findObjectArea = (obj: any): string | null => {
        if (!obj || !obj.getBoundingRect) return null;

        const objBounds = obj.getBoundingRect();

        for (const area of customizationAreas) {
            if (objBounds.left >= area.x &&
                objBounds.top >= area.y &&
                objBounds.left + objBounds.width <= area.x + area.width &&
                objBounds.top + objBounds.height <= area.y + area.height) {
                return area.id;
            }
        }
        return null;
    };

    const addText = () => {
        if (!fabricCanvasRef.current || !textInput.trim() || !fabric) return;

        const text = new fabric.Textbox(textInput, {
            left: 50,
            top: 50,
            fontSize: fontSize[0],
            fill: selectedColor,
            fontFamily: 'Arial',
            width: 200,
        });

        fabricCanvasRef.current.add(text);
        fabricCanvasRef.current.setActiveObject(text);
        setTextInput('');
    };

    const addShape = (shapeType: string) => {
        if (!fabricCanvasRef.current || !fabric) return;

        let shape: any;

        switch (shapeType) {
            case 'rectangle':
                shape = new fabric.Rect({
                    left: 100,
                    top: 100,
                    width: 100,
                    height: 80,
                    fill: selectedColor,
                });
                break;
            case 'circle':
                shape = new fabric.Circle({
                    left: 100,
                    top: 100,
                    radius: 50,
                    fill: selectedColor,
                });
                break;
            case 'triangle':
                shape = new fabric.Triangle({
                    left: 100,
                    top: 100,
                    width: 100,
                    height: 100,
                    fill: selectedColor,
                });
                break;
            default:
                return;
        }

        fabricCanvasRef.current.add(shape);
        fabricCanvasRef.current.setActiveObject(shape);
    }; const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !fabricCanvasRef.current || !fabric) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const imgData = e.target?.result as string;
            fabric.Image.fromURL(imgData, (img: any) => {
                img.scaleToWidth(150);
                img.scaleToHeight(150);
                img.set({ left: 50, top: 50 });
                fabricCanvasRef.current?.add(img);
                fabricCanvasRef.current?.setActiveObject(img);
            });
        };
        reader.readAsDataURL(file);
    };

    const deleteSelected = () => {
        if (!fabricCanvasRef.current) return;

        const activeObjects = fabricCanvasRef.current.getActiveObjects();
        activeObjects.forEach(obj => {
            fabricCanvasRef.current?.remove(obj);
        });
        fabricCanvasRef.current.discardActiveObject();
    };

    const undo = () => {
        if (historyIndex > 0 && fabricCanvasRef.current) {
            setHistoryIndex(prev => prev - 1);
            fabricCanvasRef.current.loadFromJSON(history[historyIndex - 1], () => {
                fabricCanvasRef.current?.renderAll();
            });
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1 && fabricCanvasRef.current) {
            setHistoryIndex(prev => prev + 1);
            fabricCanvasRef.current.loadFromJSON(history[historyIndex + 1], () => {
                fabricCanvasRef.current?.renderAll();
            });
        }
    };

    const saveDesign = async () => {
        if (!fabricCanvasRef.current) return;

        try {
            const designData = {
                version: '2.0',
                canvas: fabricCanvasRef.current.toJSON(),
                objects: designObjects,
                price: currentPrice,
                timestamp: new Date().toISOString(),
            };

            // In a real app, this would save to a backend
            localStorage.setItem(`design-${productId}`, JSON.stringify(designData));
            toast.success('Design saved successfully!');
        } catch (error) {
            toast.error('Failed to save design');
        }
    };

    const loadDesign = () => {
        try {
            const savedDesign = localStorage.getItem(`design-${productId}`);
            if (savedDesign && fabricCanvasRef.current) {
                const designData = JSON.parse(savedDesign);
                fabricCanvasRef.current.loadFromJSON(designData.canvas, () => {
                    fabricCanvasRef.current?.renderAll();
                    setCurrentPrice(designData.price);
                    setDesignObjects(designData.objects);
                });
                toast.success('Design loaded successfully!');
            } else {
                toast.error('No saved design found');
            }
        } catch (error) {
            toast.error('Failed to load design');
        }
    };

    const exportDesign = () => {
        if (!fabricCanvasRef.current) return;

        const dataURL = fabricCanvasRef.current.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: 2,
        });

        const link = document.createElement('a');
        link.download = `design-${productId}.png`;
        link.href = dataURL;
        link.click();
    };

    const toggleCollaboration = () => {
        setIsCollaborationEnabled(!isCollaborationEnabled);
        if (!isCollaborationEnabled) {
            // Initialize collaboration
            setCollaborators([
                { id: '1', name: 'John Doe', color: '#ff6b6b' },
                { id: '2', name: 'Jane Smith', color: '#4ecdc4' },
            ]);
            toast.success('Collaboration enabled! Sharing design with team.');
        } else {
            setCollaborators([]);
            toast.info('Collaboration disabled.');
        }
    };

    const toggle3DPreview = () => {
        setIs3DPreviewMode(!is3DPreviewMode);
        toast.info(is3DPreviewMode ? 'Switched to 2D view' : 'Switched to 3D preview');
    };

    return (
        <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Enhanced Product Customizer</h2>
                    <p className="text-muted-foreground">Design your custom product with advanced tools</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                        Price: ${currentPrice.toFixed(2)}
                    </Badge>
                    {isCollaborationEnabled && (
                        <Badge variant="outline" className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {collaborators.length} collaborators
                        </Badge>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Tools Panel */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                Tools
                                <div className="flex gap-1">
                                    <Button
                                        variant={is3DPreviewMode ? "default" : "outline"}
                                        size="sm"
                                        onClick={toggle3DPreview}
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant={isCollaborationEnabled ? "default" : "outline"}
                                        size="sm"
                                        onClick={toggleCollaboration}
                                    >
                                        <Share2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={undo}
                                    disabled={historyIndex <= 0}
                                >
                                    <Undo className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={redo}
                                    disabled={historyIndex >= history.length - 1}
                                >
                                    <Redo className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={deleteSelected}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>

                            <Separator />

                            <Tabs defaultValue="text" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="text">Text</TabsTrigger>
                                    <TabsTrigger value="shapes">Shapes</TabsTrigger>
                                    <TabsTrigger value="images">Images</TabsTrigger>
                                </TabsList>

                                <TabsContent value="text" className="space-y-3">
                                    <div>
                                        <Label htmlFor="text-input">Text</Label>
                                        <Input
                                            id="text-input"
                                            value={textInput}
                                            onChange={(e) => setTextInput(e.target.value)}
                                            placeholder="Enter text..."
                                        />
                                    </div>
                                    <div>
                                        <Label>Font Size</Label>
                                        <Slider
                                            value={fontSize}
                                            onValueChange={setFontSize}
                                            max={72}
                                            min={8}
                                            step={1}
                                            className="mt-2"
                                        />
                                        <span className="text-sm text-muted-foreground">{fontSize[0]}px</span>
                                    </div>
                                    <Button onClick={addText} className="w-full">
                                        <Type className="h-4 w-4 mr-2" />
                                        Add Text
                                    </Button>
                                </TabsContent>

                                <TabsContent value="shapes" className="space-y-3">
                                    <div className="grid grid-cols-3 gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => addShape('rectangle')}
                                        >
                                            <Square className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => addShape('circle')}
                                        >
                                            <Circle className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => addShape('triangle')}
                                        >
                                            <Triangle className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TabsContent>

                                <TabsContent value="images" className="space-y-3">
                                    <div>
                                        <Label htmlFor="image-upload">Upload Image</Label>
                                        <Input
                                            id="image-upload"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                        />
                                    </div>
                                </TabsContent>
                            </Tabs>

                            <Separator />

                            {/* Color Picker */}
                            <div>
                                <Label htmlFor="color-picker">Color</Label>
                                <div className="flex items-center gap-2 mt-2">
                                    <Input
                                        id="color-picker"
                                        type="color"
                                        value={selectedColor}
                                        onChange={(e) => setSelectedColor(e.target.value)}
                                        className="w-12 h-8 p-1 border rounded"
                                    />
                                    <span className="text-sm">{selectedColor}</span>
                                </div>
                            </div>

                            <Separator />

                            {/* File Operations */}
                            <div className="space-y-2">
                                <Button onClick={saveDesign} variant="outline" className="w-full">
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Design
                                </Button>
                                <Button onClick={loadDesign} variant="outline" className="w-full">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Load Design
                                </Button>
                                <Button onClick={exportDesign} variant="outline" className="w-full">
                                    <Download className="h-4 w-4 mr-2" />
                                    Export PNG
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Collaboration Panel */}
                    {isCollaborationEnabled && (
                        <Card className="mt-4">
                            <CardHeader>
                                <CardTitle className="text-sm">Collaborators</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {collaborators.map(user => (
                                        <div key={user.id} className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: user.color }}
                                            />
                                            <span className="text-sm">{user.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Canvas Area */}
                <div className="lg:col-span-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                Design Canvas
                                {selectedArea && (
                                    <Badge variant="outline" className="ml-2">
                                        Area: {selectedArea.name} (+${selectedArea.price_modifier})
                                    </Badge>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {is3DPreviewMode ? (
                                <div className="w-full h-[400px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="text-4xl mb-2">🎯</div>
                                        <p className="text-lg font-medium">3D Preview Mode</p>
                                        <p className="text-sm text-muted-foreground">
                                            Three.js integration will render your design in 3D here
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative">
                                    <canvas
                                        ref={canvasRef}
                                        className="border border-gray-200 rounded-lg shadow-sm"
                                    />
                                    {isCollaborationEnabled && (
                                        <div className="absolute top-2 right-2">
                                            <Badge variant="secondary" className="flex items-center gap-1">
                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                                Live
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Design Objects List */}
                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle>Design Objects ({designObjects.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {designObjects.length === 0 ? (
                                <p className="text-muted-foreground text-center py-4">
                                    No design objects yet. Add text, shapes, or images to get started.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {designObjects.map((obj, index) => (
                                        <div key={obj.id} className="flex items-center justify-between p-2 border rounded">
                                            <div className="flex items-center gap-2">
                                                {obj.type === 'text' && <Type className="h-4 w-4" />}
                                                {obj.type === 'image' && <ImageIcon className="h-4 w-4" />}
                                                {obj.type === 'shape' && <Square className="h-4 w-4" />}
                                                <span className="text-sm">
                                                    {obj.type} {index + 1}
                                                </span>
                                                {obj.areaId && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {customizationAreas.find(a => a.id === obj.areaId)?.name}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
