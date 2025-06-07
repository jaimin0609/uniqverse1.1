'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { ColorPicker } from '@/components/ui/color-picker';
import {
    Type,
    Image as ImageIcon,
    Square,
    Circle,
    RotateCw,
    Move,
    Trash2,
    Download,
    Upload,
    Plus,
    Minus,
    Copy,
    Layers,
    Save,
    FolderOpen
} from 'lucide-react';
import {
    saveCustomDesign,
    loadCustomDesign,
    calculateDesignPricing,
    generatePreviewUrl,
    type CustomDesignData,
    getUserCustomDesigns
} from '@/lib/custom-design-utils';

interface PrintArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface DesignElement {
    id: string;
    type: 'text' | 'image' | 'shape';
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    content?: string; // For text elements
    imageUrl?: string; // For image elements
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    shapeType?: 'rectangle' | 'circle'; // For shape elements
    opacity?: number;
    zIndex?: number;
}

interface CustomizationTemplate {
    name: string;
    printAreas: PrintArea[];
    defaultElements?: DesignElement[];
    restrictions?: {
        maxElements?: number;
        allowedTypes?: string[];
        maxFileSize?: number;
    };
}

interface ProductCustomizerProps {
    productId: string;
    productName: string;
    baseImageUrl: string;
    customizationTemplate?: string | null;
    printArea?: string | null;
    onDesignChange: (designData: string, previewUrl?: string) => void;
    onPriceChange?: (additionalPrice: number) => void;
}

export function ProductCustomizer({
    productId,
    productName,
    baseImageUrl,
    customizationTemplate,
    printArea,
    onDesignChange,
    onPriceChange
}: ProductCustomizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null); const [elements, setElements] = useState<DesignElement[]>([]);
    const [selectedElement, setSelectedElement] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [savedDesigns, setSavedDesigns] = useState<any[]>([]);
    const [currentDesignId, setCurrentDesignId] = useState<string | null>(null);    // Parse templates and print areas
    const template: CustomizationTemplate | null = useMemo(() =>
        customizationTemplate ? JSON.parse(customizationTemplate) : null,
        [customizationTemplate]
    );// Parse print area - handle both single object and array formats
    const printAreas: PrintArea[] = useMemo(() => {
        if (!printArea) return [{ x: 50, y: 50, width: 200, height: 200 }]; // Default print area

        try {
            const parsed = JSON.parse(printArea);
            // If it's already an array, return it
            if (Array.isArray(parsed)) return parsed;
            // If it's a single object, wrap it in an array
            if (parsed && typeof parsed === 'object') return [parsed];
            // Fallback
            return [{ x: 50, y: 50, width: 200, height: 200 }];
        } catch (error) {
            console.error('Error parsing print area:', error);
            return [{ x: 50, y: 50, width: 200, height: 200 }];
        }
    }, [printArea]);

    // Text customization state
    const [textInput, setTextInput] = useState('');
    const [fontSize, setFontSize] = useState(24);
    const [fontFamily, setFontFamily] = useState('Arial');
    const [textColor, setTextColor] = useState('#000000');    // Load base product image and render canvas
    const renderCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);        // Load and draw base product image
        const baseImage = new Image();
        baseImage.crossOrigin = 'anonymous'; // Allow cross-origin access
        baseImage.onload = () => {
            // Draw base product image
            ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

            // Draw print area outlines
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            printAreas.forEach(area => {
                ctx.strokeRect(area.x, area.y, area.width, area.height);
            });

            // Draw design elements
            elements.forEach(element => {
                ctx.save();

                // Apply transformations
                ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
                ctx.rotate((element.rotation * Math.PI) / 180);
                ctx.globalAlpha = element.opacity || 1;

                if (element.type === 'text' && element.content) {
                    ctx.font = `${element.fontWeight || 'normal'} ${element.fontSize || 24}px ${element.fontFamily || 'Arial'}`;
                    ctx.fillStyle = element.color || '#000000';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(element.content, 0, 0);
                } else if (element.type === 'image' && element.imageUrl) {
                    const img = new Image();
                    img.onload = () => {
                        ctx.drawImage(img, -element.width / 2, -element.height / 2, element.width, element.height);
                    };
                    img.src = element.imageUrl;
                } else if (element.type === 'shape') {
                    ctx.fillStyle = element.backgroundColor || '#3b82f6';
                    if (element.shapeType === 'circle') {
                        ctx.beginPath();
                        ctx.arc(0, 0, Math.min(element.width, element.height) / 2, 0, 2 * Math.PI);
                        ctx.fill();
                    } else {
                        ctx.fillRect(-element.width / 2, -element.height / 2, element.width, element.height);
                    }
                }

                // Draw selection outline
                if (selectedElement === element.id) {
                    ctx.strokeStyle = '#ef4444';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([]);
                    ctx.strokeRect(-element.width / 2, -element.height / 2, element.width, element.height);
                }

                ctx.restore();
            });
        };
        baseImage.src = baseImageUrl;
    }, [baseImageUrl, elements, selectedElement, printAreas]); useEffect(() => {
        renderCanvas();
    }, [renderCanvas]);

    // Load saved designs on mount
    useEffect(() => {
        const loadSavedDesigns = async () => {
            try {
                const designs = await getUserCustomDesigns(productId);
                setSavedDesigns(designs);
            } catch (error) {
                console.error('Error loading saved designs:', error);
            }
        };
        loadSavedDesigns();
    }, [productId]);    // Calculate additional pricing based on design complexity
    useEffect(() => {
        // Convert elements to match utility function interface
        const elementsForPricing = elements.map(el => ({
            ...el,
            layer: el.zIndex || 0,
            locked: false,
            properties: {
                content: el.content,
                imageUrl: el.imageUrl,
                fontSize: el.fontSize,
                fontFamily: el.fontFamily,
                fontWeight: el.fontWeight,
                color: el.color,
                backgroundColor: el.backgroundColor,
                shapeType: el.shapeType,
                opacity: el.opacity
            }
        }));
        const pricing = calculateDesignPricing(elementsForPricing);
        onPriceChange?.(pricing.additionalPrice);
    }, [elements, onPriceChange]);

    // Export design data    // Generate design data and preview when elements change
    useEffect(() => {
        const designData = JSON.stringify({
            elements,
            template: template?.name || 'default',
            timestamp: Date.now()
        });

        // Generate preview URL (handle canvas taint issues)
        const canvas = canvasRef.current;
        let previewUrl: string | undefined;

        try {
            previewUrl = canvas?.toDataURL('image/png');
        } catch (error) {
            console.warn('Canvas tainted, cannot export preview:', error);
            // Use a placeholder or the base image as fallback
            previewUrl = baseImageUrl;
        }

        onDesignChange(designData, previewUrl);
    }, [elements, template, onDesignChange, baseImageUrl]);

    const addTextElement = () => {
        if (!textInput.trim()) return;

        const newElement: DesignElement = {
            id: `text-${Date.now()}`,
            type: 'text',
            x: printAreas[0].x + 10,
            y: printAreas[0].y + 10,
            width: 100,
            height: 30,
            rotation: 0,
            content: textInput,
            fontSize,
            fontFamily,
            color: textColor,
            opacity: 1,
            zIndex: elements.length
        };

        setElements(prev => [...prev, newElement]);
        setTextInput('');
        setSelectedElement(newElement.id);
    };

    const addImageElement = async (file: File) => {
        if (!file.type.startsWith('image/')) return;

        setIsLoading(true);
        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageUrl = e.target?.result as string;
                const newElement: DesignElement = {
                    id: `image-${Date.now()}`,
                    type: 'image',
                    x: printAreas[0].x + 10,
                    y: printAreas[0].y + 10,
                    width: 100,
                    height: 100,
                    rotation: 0,
                    imageUrl,
                    opacity: 1,
                    zIndex: elements.length
                };

                setElements(prev => [...prev, newElement]);
                setSelectedElement(newElement.id);
            };
            reader.readAsDataURL(file);
        } finally {
            setIsLoading(false);
        }
    };

    const addShapeElement = (shapeType: 'rectangle' | 'circle') => {
        const newElement: DesignElement = {
            id: `shape-${Date.now()}`,
            type: 'shape',
            x: printAreas[0].x + 10,
            y: printAreas[0].y + 10,
            width: 80,
            height: 80,
            rotation: 0,
            shapeType,
            backgroundColor: '#3b82f6',
            opacity: 1,
            zIndex: elements.length
        };

        setElements(prev => [...prev, newElement]);
        setSelectedElement(newElement.id);
    };

    const updateElement = (id: string, updates: Partial<DesignElement>) => {
        setElements(prev => prev.map(el =>
            el.id === id ? { ...el, ...updates } : el
        ));
    };

    const deleteElement = (id: string) => {
        setElements(prev => prev.filter(el => el.id !== id));
        setSelectedElement(null);
    };

    const duplicateElement = (id: string) => {
        const element = elements.find(el => el.id === id);
        if (element) {
            const newElement = {
                ...element,
                id: `${element.type}-${Date.now()}`,
                x: element.x + 20,
                y: element.y + 20,
                zIndex: elements.length
            };
            setElements(prev => [...prev, newElement]);
            setSelectedElement(newElement.id);
        }
    };

    const selectedElementData = elements.find(el => el.id === selectedElement);

    // Save design function
    const handleSaveDesign = async () => {
        try {
            setIsLoading(true);
            const canvas = canvasRef.current;
            if (!canvas) return; const previewUrl = generatePreviewUrl(canvas);

            // Convert elements to match utility function interface
            const elementsForPricing = elements.map(el => ({
                ...el,
                layer: el.zIndex || 0,
                locked: false,
                properties: {
                    content: el.content,
                    imageUrl: el.imageUrl,
                    fontSize: el.fontSize,
                    fontFamily: el.fontFamily,
                    fontWeight: el.fontWeight,
                    color: el.color,
                    backgroundColor: el.backgroundColor,
                    shapeType: el.shapeType,
                    opacity: el.opacity
                }
            }));
            const pricing = calculateDesignPricing(elementsForPricing);

            const designData: CustomDesignData = {
                elements: elementsForPricing,
                canvas: {
                    width: 400,
                    height: 400,
                    backgroundColor: '#ffffff'
                },
                pricing
            };

            const savedId = await saveCustomDesign(productId, designData, previewUrl);
            if (savedId) {
                setCurrentDesignId(savedId);
                // Reload saved designs list
                const designs = await getUserCustomDesigns(productId);
                setSavedDesigns(designs);
            }
        } catch (error) {
            console.error('Error saving design:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Load design function
    const handleLoadDesign = async (designId: string) => {
        try {
            setIsLoading(true);
            const designData = await loadCustomDesign(designId);
            if (designData) {
                const loadedElements = designData.elements.map(el => ({
                    id: el.id,
                    type: el.type as 'text' | 'image' | 'shape',
                    x: el.x,
                    y: el.y,
                    width: el.width,
                    height: el.height,
                    rotation: el.rotation,
                    zIndex: el.layer,
                    content: el.properties?.content as string | undefined,
                    imageUrl: el.properties?.imageUrl as string | undefined,
                    fontSize: el.properties?.fontSize as number | undefined,
                    fontFamily: el.properties?.fontFamily as string | undefined,
                    fontWeight: el.properties?.fontWeight as string | undefined,
                    color: el.properties?.color as string | undefined,
                    backgroundColor: el.properties?.backgroundColor as string | undefined,
                    shapeType: el.properties?.shapeType as 'rectangle' | 'circle' | undefined,
                    opacity: el.properties?.opacity as number | undefined
                }));

                setElements(loadedElements);
                setSelectedElement(null);
                setCurrentDesignId(designId);
            }
        } catch (error) {
            console.error('Error loading design:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Customize Your {productName}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Canvas Area */}
                        <div className="space-y-4">
                            <div className="relative border border-gray-200 rounded-lg overflow-hidden">
                                <canvas
                                    ref={canvasRef}
                                    width={400}
                                    height={400}
                                    className="w-full h-auto cursor-pointer"
                                    onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const x = ((e.clientX - rect.left) / rect.width) * 400;
                                        const y = ((e.clientY - rect.top) / rect.height) * 400;                                        // Check if click is on an element
                                        let clickedElement: string | null = null;
                                        for (let i = elements.length - 1; i >= 0; i--) {
                                            const el = elements[i];
                                            if (x >= el.x && x <= el.x + el.width &&
                                                y >= el.y && y <= el.y + el.height) {
                                                clickedElement = el.id;
                                                break;
                                            }
                                        }
                                        setSelectedElement(clickedElement);
                                    }}
                                />
                                {isLoading && (
                                    <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                )}
                            </div>                            <div className="text-sm text-gray-600">
                                <p>Blue dashed lines indicate printable areas</p>
                                <p>Click elements to select and modify them</p>
                            </div>

                            {/* Save/Load Design Controls */}
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleSaveDesign}
                                    disabled={isLoading || elements.length === 0}
                                    className="flex-1"
                                    variant="outline"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Design
                                </Button>
                                {savedDesigns.length > 0 && (
                                    <div className="flex-1">
                                        <select
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    handleLoadDesign(e.target.value);
                                                }
                                            }}
                                            value=""
                                        >
                                            <option value="">Load Saved Design...</option>
                                            {savedDesigns.map(design => (
                                                <option key={design.id} value={design.id}>
                                                    {design.product.name} - {new Date(design.updatedAt).toLocaleDateString()}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tools and Controls */}
                        <div className="space-y-4">
                            <Tabs defaultValue="add" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="add">Add Elements</TabsTrigger>
                                    <TabsTrigger value="edit">Edit Selected</TabsTrigger>
                                    <TabsTrigger value="layers">Layers</TabsTrigger>
                                </TabsList>

                                <TabsContent value="add" className="space-y-4">
                                    {/* Add Text */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm flex items-center gap-2">
                                                <Type className="h-4 w-4" />
                                                Add Text
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div>
                                                <Label htmlFor="text-input">Text</Label>
                                                <Input
                                                    id="text-input"
                                                    value={textInput}
                                                    onChange={(e) => setTextInput(e.target.value)}
                                                    placeholder="Enter your text"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <Label htmlFor="font-size">Size</Label>
                                                    <Input
                                                        id="font-size"
                                                        type="number"
                                                        value={fontSize}
                                                        onChange={(e) => setFontSize(Number(e.target.value))}
                                                        min={8}
                                                        max={72}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="text-color">Color</Label>
                                                    <Input
                                                        id="text-color"
                                                        type="color"
                                                        value={textColor}
                                                        onChange={(e) => setTextColor(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <Button onClick={addTextElement} className="w-full">
                                                Add Text
                                            </Button>
                                        </CardContent>
                                    </Card>

                                    {/* Add Image */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm flex items-center gap-2">
                                                <ImageIcon className="h-4 w-4" />
                                                Add Image
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) addImageElement(file);
                                                }}
                                                className="hidden"
                                            />
                                            <Button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="w-full"
                                                variant="outline"
                                            >
                                                <Upload className="h-4 w-4 mr-2" />
                                                Upload Image
                                            </Button>
                                        </CardContent>
                                    </Card>

                                    {/* Add Shapes */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm flex items-center gap-2">
                                                <Square className="h-4 w-4" />
                                                Add Shapes
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            <Button
                                                onClick={() => addShapeElement('rectangle')}
                                                className="w-full"
                                                variant="outline"
                                            >
                                                <Square className="h-4 w-4 mr-2" />
                                                Rectangle
                                            </Button>
                                            <Button
                                                onClick={() => addShapeElement('circle')}
                                                className="w-full"
                                                variant="outline"
                                            >
                                                <Circle className="h-4 w-4 mr-2" />
                                                Circle
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="edit" className="space-y-4">
                                    {selectedElementData ? (
                                        <Card>
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-sm">
                                                    Edit {selectedElementData.type} Element
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                {/* Position controls */}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <Label>X Position</Label>
                                                        <Input
                                                            type="number"
                                                            value={selectedElementData.x}
                                                            onChange={(e) => updateElement(selectedElementData.id, { x: Number(e.target.value) })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Y Position</Label>
                                                        <Input
                                                            type="number"
                                                            value={selectedElementData.y}
                                                            onChange={(e) => updateElement(selectedElementData.id, { y: Number(e.target.value) })}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Size controls */}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <Label>Width</Label>
                                                        <Input
                                                            type="number"
                                                            value={selectedElementData.width}
                                                            onChange={(e) => updateElement(selectedElementData.id, { width: Number(e.target.value) })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Height</Label>
                                                        <Input
                                                            type="number"
                                                            value={selectedElementData.height}
                                                            onChange={(e) => updateElement(selectedElementData.id, { height: Number(e.target.value) })}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Rotation */}
                                                <div>
                                                    <Label>Rotation (degrees)</Label>
                                                    <Slider
                                                        value={[selectedElementData.rotation]}
                                                        onValueChange={([value]) => updateElement(selectedElementData.id, { rotation: value })}
                                                        min={-180}
                                                        max={180}
                                                        step={1}
                                                        className="mt-2"
                                                    />
                                                </div>

                                                {/* Opacity */}
                                                <div>
                                                    <Label>Opacity</Label>
                                                    <Slider
                                                        value={[(selectedElementData.opacity || 1) * 100]}
                                                        onValueChange={([value]) => updateElement(selectedElementData.id, { opacity: value / 100 })}
                                                        min={0}
                                                        max={100}
                                                        step={1}
                                                        className="mt-2"
                                                    />
                                                </div>

                                                {/* Text-specific controls */}
                                                {selectedElementData.type === 'text' && (
                                                    <>
                                                        <div>
                                                            <Label>Text Content</Label>
                                                            <Textarea
                                                                value={selectedElementData.content || ''}
                                                                onChange={(e) => updateElement(selectedElementData.id, { content: e.target.value })}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label>Font Size</Label>
                                                            <Input
                                                                type="number"
                                                                value={selectedElementData.fontSize || 24}
                                                                onChange={(e) => updateElement(selectedElementData.id, { fontSize: Number(e.target.value) })}
                                                                min={8}
                                                                max={72}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label>Color</Label>
                                                            <Input
                                                                type="color"
                                                                value={selectedElementData.color || '#000000'}
                                                                onChange={(e) => updateElement(selectedElementData.id, { color: e.target.value })}
                                                            />
                                                        </div>
                                                    </>
                                                )}

                                                {/* Shape-specific controls */}
                                                {selectedElementData.type === 'shape' && (
                                                    <div>
                                                        <Label>Background Color</Label>
                                                        <Input
                                                            type="color"
                                                            value={selectedElementData.backgroundColor || '#3b82f6'}
                                                            onChange={(e) => updateElement(selectedElementData.id, { backgroundColor: e.target.value })}
                                                        />
                                                    </div>
                                                )}

                                                {/* Action buttons */}
                                                <div className="flex gap-2">
                                                    <Button
                                                        onClick={() => duplicateElement(selectedElementData.id)}
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        <Copy className="h-4 w-4 mr-1" />
                                                        Duplicate
                                                    </Button>
                                                    <Button
                                                        onClick={() => deleteElement(selectedElementData.id)}
                                                        variant="destructive"
                                                        size="sm"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-1" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <Card>
                                            <CardContent className="py-8 text-center text-gray-500">
                                                Select an element to edit its properties
                                            </CardContent>
                                        </Card>
                                    )}
                                </TabsContent>

                                <TabsContent value="layers" className="space-y-4">
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm flex items-center gap-2">
                                                <Layers className="h-4 w-4" />
                                                Layer Management
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {elements.length === 0 ? (
                                                <p className="text-center text-gray-500 py-4">No elements added yet</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {elements
                                                        .sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0))
                                                        .map((element) => (
                                                            <div
                                                                key={element.id}
                                                                className={`p-2 border rounded cursor-pointer transition-colors ${selectedElement === element.id
                                                                    ? 'border-blue-500 bg-blue-50'
                                                                    : 'border-gray-200 hover:border-gray-300'
                                                                    }`}
                                                                onClick={() => setSelectedElement(element.id)}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-sm font-medium">
                                                                        {element.type === 'text' && element.content
                                                                            ? `Text: ${element.content.slice(0, 20)}...`
                                                                            : `${element.type.charAt(0).toUpperCase() + element.type.slice(1)} Element`}
                                                                    </span>
                                                                    <div className="flex gap-1">
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                updateElement(element.id, { zIndex: (element.zIndex || 0) + 1 });
                                                                            }}
                                                                        >
                                                                            <Plus className="h-3 w-3" />
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                updateElement(element.id, { zIndex: Math.max(0, (element.zIndex || 0) - 1) });
                                                                            }}
                                                                        >
                                                                            <Minus className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
