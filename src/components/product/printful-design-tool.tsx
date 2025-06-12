'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Type,
    Image as ImageIcon,
    Palette,
    Move,
    RotateCw,
    Copy,
    Trash2,
    Download,
    Upload,
    Search,
    Grid,
    ZoomIn,
    ZoomOut,
    AlignLeft,
    AlignCenter,
    AlignRight,
    FlipHorizontal,
    FlipVertical,
    Layers
} from 'lucide-react';
import { toast } from 'sonner';

// Sample clipart data - in a real app, this would come from an API
const SAMPLE_CLIPART = [
    { id: '1', name: 'Heart', category: 'love', url: '/api/placeholder/100/100', keywords: ['love', 'heart', 'valentine'] },
    { id: '2', name: 'Star', category: 'shapes', url: '/api/placeholder/100/100', keywords: ['star', 'space', 'shine'] },
    { id: '3', name: 'Coffee Cup', category: 'lifestyle', url: '/api/placeholder/100/100', keywords: ['coffee', 'drink', 'morning'] },
    { id: '4', name: 'Mountain', category: 'nature', url: '/api/placeholder/100/100', keywords: ['mountain', 'nature', 'adventure'] },
    { id: '5', name: 'Music Note', category: 'music', url: '/api/placeholder/100/100', keywords: ['music', 'note', 'sound'] },
    { id: '6', name: 'Flower', category: 'nature', url: '/api/placeholder/100/100', keywords: ['flower', 'nature', 'bloom'] },
];

const FONT_OPTIONS = [
    'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'Courier New',
    'Impact', 'Comic Sans MS', 'Trebuchet MS', 'Lucida Console', 'Palatino',
    'Garamond', 'Century Gothic', 'Futura', 'Optima'
];

interface DesignElement {
    id: string;
    type: 'text' | 'image' | 'clipart';
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    zIndex: number;
    // Text properties
    content?: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    color?: string;
    textAlign?: 'left' | 'center' | 'right';
    letterSpacing?: number;
    // Image properties
    imageUrl?: string;
    opacity?: number;
}

interface PrintfulDesignToolProps {
    productId: string;
    productName: string;
    baseImageUrl: string;
    printArea: { x: number; y: number; width: number; height: number };
    onDesignChange: (designData: string, previewUrl?: string) => void;
    onPriceChange?: (additionalPrice: number) => void;
}

export default function PrintfulDesignTool({
    productId,
    productName,
    baseImageUrl,
    printArea,
    onDesignChange,
    onPriceChange
}: PrintfulDesignToolProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Design state
    const [elements, setElements] = useState<DesignElement[]>([]);
    const [selectedElement, setSelectedElement] = useState<string | null>(null);
    const [canvasZoom, setCanvasZoom] = useState(1);
    const [showGrid, setShowGrid] = useState(true);
    
    // Tool states
    const [activeTab, setActiveTab] = useState('text');
    const [textInput, setTextInput] = useState('Your text here');
    const [selectedFont, setSelectedFont] = useState('Arial');
    const [fontSize, setFontSize] = useState([24]);
    const [textColor, setTextColor] = useState('#000000');
    const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
    const [letterSpacing, setLetterSpacing] = useState([0]);
    
    // Clipart search
    const [clipartSearch, setClipartSearch] = useState('');
    const [filteredClipart, setFilteredClipart] = useState(SAMPLE_CLIPART);
    
    // Canvas dimensions
    const CANVAS_WIDTH = 500;
    const CANVAS_HEIGHT = 600;

    // Filter clipart based on search
    useEffect(() => {
        if (!clipartSearch.trim()) {
            setFilteredClipart(SAMPLE_CLIPART);
        } else {
            const filtered = SAMPLE_CLIPART.filter(item =>
                item.keywords.some(keyword =>
                    keyword.toLowerCase().includes(clipartSearch.toLowerCase())
                ) || item.name.toLowerCase().includes(clipartSearch.toLowerCase())
            );
            setFilteredClipart(filtered);
        }
    }, [clipartSearch]);

    // Redraw canvas when elements change
    useEffect(() => {
        drawCanvas();
        exportDesign();
    }, [elements, canvasZoom, showGrid]);

    const drawCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw product background
        if (baseImageUrl) {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                drawPrintArea(ctx);
                drawElements(ctx);
            };
            img.src = baseImageUrl;
        } else {
            // Light gray background if no product image
            ctx.fillStyle = '#f5f5f5';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            drawPrintArea(ctx);
            drawElements(ctx);
        }
    };

    const drawPrintArea = (ctx: CanvasRenderingContext2D) => {
        if (!showGrid) return;

        // Draw print area boundary
        ctx.strokeStyle = '#3b82f6';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 2;
        ctx.strokeRect(printArea.x, printArea.y, printArea.width, printArea.height);
        
        // Reset line dash
        ctx.setLineDash([]);
    };

    const drawElements = (ctx: CanvasRenderingContext2D) => {
        elements
            .sort((a, b) => a.zIndex - b.zIndex)
            .forEach((element) => {
                ctx.save();
                
                // Apply transformations
                ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
                ctx.rotate((element.rotation * Math.PI) / 180);
                ctx.translate(-element.width / 2, -element.height / 2);

                if (element.type === 'text' && element.content) {
                    // Draw text
                    ctx.font = `${element.fontWeight || 'normal'} ${element.fontSize || 24}px ${element.fontFamily || 'Arial'}`;
                    ctx.fillStyle = element.color || '#000000';
                    ctx.textAlign = element.textAlign || 'center';
                    ctx.textBaseline = 'middle';
                    
                    if (element.letterSpacing) {
                        // Manual letter spacing
                        const chars = element.content.split('');
                        let x = 0;
                        chars.forEach(char => {
                            ctx.fillText(char, x, element.height / 2);
                            x += ctx.measureText(char).width + (element.letterSpacing || 0);
                        });
                    } else {
                        ctx.fillText(element.content, element.width / 2, element.height / 2);
                    }
                } else if ((element.type === 'image' || element.type === 'clipart') && element.imageUrl) {
                    // Draw image/clipart
                    const img = new Image();
                    img.onload = () => {
                        ctx.globalAlpha = element.opacity || 1;
                        ctx.drawImage(img, 0, 0, element.width, element.height);
                        ctx.globalAlpha = 1;
                    };
                    img.src = element.imageUrl;
                }

                // Draw selection border
                if (selectedElement === element.id) {
                    ctx.strokeStyle = '#3b82f6';
                    ctx.setLineDash([]);
                    ctx.lineWidth = 2;
                    ctx.strokeRect(-2, -2, element.width + 4, element.height + 4);
                }

                ctx.restore();
            });
    };

    const addTextElement = () => {
        if (!textInput.trim()) return;

        const newElement: DesignElement = {
            id: `text-${Date.now()}`,
            type: 'text',
            x: printArea.x + 20,
            y: printArea.y + 20,
            width: 200,
            height: 40,
            rotation: 0,
            zIndex: elements.length,
            content: textInput,
            fontSize: fontSize[0],
            fontFamily: selectedFont,
            color: textColor,
            textAlign: textAlign,
            letterSpacing: letterSpacing[0]
        };

        setElements(prev => [...prev, newElement]);
        setSelectedElement(newElement.id);
        toast.success('Text added to design');
    };

    const addClipartElement = (clipart: typeof SAMPLE_CLIPART[0]) => {
        const newElement: DesignElement = {
            id: `clipart-${Date.now()}`,
            type: 'clipart',
            x: printArea.x + 20,
            y: printArea.y + 20,
            width: 100,
            height: 100,
            rotation: 0,
            zIndex: elements.length,
            imageUrl: clipart.url,
            opacity: 1
        };

        setElements(prev => [...prev, newElement]);
        setSelectedElement(newElement.id);
        toast.success(`${clipart.name} added to design`);
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 200 * 1024 * 1024) { // 200MB limit like Printful
            toast.error('File size must be under 200MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const imageUrl = e.target?.result as string;
            
            const newElement: DesignElement = {
                id: `image-${Date.now()}`,
                type: 'image',
                x: printArea.x + 20,
                y: printArea.y + 20,
                width: 150,
                height: 150,
                rotation: 0,
                zIndex: elements.length,
                imageUrl: imageUrl,
                opacity: 1
            };

            setElements(prev => [...prev, newElement]);
            setSelectedElement(newElement.id);
            toast.success('Image uploaded successfully');
        };
        reader.readAsDataURL(file);
    };

    const updateElement = (id: string, updates: Partial<DesignElement>) => {
        setElements(prev => prev.map(el =>
            el.id === id ? { ...el, ...updates } : el
        ));
    };

    const deleteElement = (id: string) => {
        setElements(prev => prev.filter(el => el.id !== id));
        setSelectedElement(null);
        toast.success('Element deleted');
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
            toast.success('Element duplicated');
        }
    };

    const alignElement = (alignment: 'left' | 'center' | 'right') => {
        if (!selectedElement) return;
        
        const element = elements.find(el => el.id === selectedElement);
        if (!element) return;

        let newX = element.x;
        switch (alignment) {
            case 'left':
                newX = printArea.x;
                break;
            case 'center':
                newX = printArea.x + (printArea.width - element.width) / 2;
                break;
            case 'right':
                newX = printArea.x + printArea.width - element.width;
                break;
        }

        updateElement(selectedElement, { x: newX });
    };

    const flipElement = (direction: 'horizontal' | 'vertical') => {
        if (!selectedElement) return;
        
        const element = elements.find(el => el.id === selectedElement);
        if (!element) return;

        // For simplicity, we'll just rotate the element
        const newRotation = direction === 'horizontal' 
            ? element.rotation + 180 
            : element.rotation + 180;

        updateElement(selectedElement, { rotation: newRotation % 360 });
    };

    const exportDesign = () => {
        const designData = JSON.stringify({
            elements,
            productId,
            timestamp: Date.now()
        });

        // Generate preview URL
        const canvas = canvasRef.current;
        let previewUrl: string | undefined;
        try {
            previewUrl = canvas?.toDataURL('image/png');
        } catch (error) {
            console.warn('Cannot export preview:', error);
        }

        onDesignChange(designData, previewUrl);

        // Calculate pricing based on number of elements
        const additionalPrice = elements.length * 0.5; // $0.50 per element
        onPriceChange?.(additionalPrice);
    };

    const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
        const y = ((event.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;

        // Check if click is on an element
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
    };

    const selectedElementData = elements.find(el => el.id === selectedElement);

    return (
        <div className="w-full max-w-7xl mx-auto p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Design Your {productName}</h2>
                <p className="text-gray-600">Create professional designs with our easy-to-use tools</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Design Tools Panel */}
                <div className="lg:col-span-1 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Palette className="h-5 w-5" />
                                Design Tools
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="text">Text</TabsTrigger>
                                    <TabsTrigger value="clipart">Clipart</TabsTrigger>
                                    <TabsTrigger value="upload">Upload</TabsTrigger>
                                </TabsList>

                                <TabsContent value="text" className="space-y-4 mt-4">
                                    <div>
                                        <Label htmlFor="text-input">Text Content</Label>
                                        <Input
                                            id="text-input"
                                            value={textInput}
                                            onChange={(e) => setTextInput(e.target.value)}
                                            placeholder="Enter your text"
                                        />
                                    </div>

                                    <div>
                                        <Label>Font Family</Label>
                                        <Select value={selectedFont} onValueChange={setSelectedFont}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {FONT_OPTIONS.map(font => (
                                                    <SelectItem key={font} value={font}>{font}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label>Font Size: {fontSize[0]}px</Label>
                                        <Slider
                                            value={fontSize}
                                            onValueChange={setFontSize}
                                            min={8}
                                            max={72}
                                            step={1}
                                        />
                                    </div>

                                    <div>
                                        <Label>Text Color</Label>
                                        <div className="flex gap-2 mt-2">
                                            <Input
                                                type="color"
                                                value={textColor}
                                                onChange={(e) => setTextColor(e.target.value)}
                                                className="w-20 h-10"
                                            />
                                            <span className="flex items-center text-sm">{textColor}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Text Alignment</Label>
                                        <div className="flex gap-1 mt-2">
                                            <Button
                                                size="sm"
                                                variant={textAlign === 'left' ? 'default' : 'outline'}
                                                onClick={() => setTextAlign('left')}
                                            >
                                                <AlignLeft className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={textAlign === 'center' ? 'default' : 'outline'}
                                                onClick={() => setTextAlign('center')}
                                            >
                                                <AlignCenter className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={textAlign === 'right' ? 'default' : 'outline'}
                                                onClick={() => setTextAlign('right')}
                                            >
                                                <AlignRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Letter Spacing: {letterSpacing[0]}px</Label>
                                        <Slider
                                            value={letterSpacing}
                                            onValueChange={setLetterSpacing}
                                            min={-5}
                                            max={20}
                                            step={1}
                                        />
                                    </div>

                                    <Button onClick={addTextElement} className="w-full">
                                        <Type className="h-4 w-4 mr-2" />
                                        Add Text
                                    </Button>
                                </TabsContent>

                                <TabsContent value="clipart" className="space-y-4 mt-4">
                                    <div>
                                        <Label htmlFor="clipart-search">Search Clipart</Label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="clipart-search"
                                                value={clipartSearch}
                                                onChange={(e) => setClipartSearch(e.target.value)}
                                                placeholder="Search graphics..."
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>

                                    <div className="text-sm text-gray-600">
                                        {filteredClipart.length} graphics available
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                                        {filteredClipart.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => addClipartElement(item)}
                                                className="aspect-square border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors p-2"
                                                title={item.name}
                                            >
                                                <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center text-xs">
                                                    {item.name}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </TabsContent>

                                <TabsContent value="upload" className="space-y-4 mt-4">
                                    <div>
                                        <Label>Upload Your Image</Label>
                                        <p className="text-sm text-gray-600 mb-3">
                                            Supports PNG, JPEG, SVG up to 200MB
                                        </p>
                                        <Button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full"
                                            variant="outline"
                                        >
                                            <Upload className="h-4 w-4 mr-2" />
                                            Choose File
                                        </Button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                        />
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>

                    {/* Element Properties */}
                    {selectedElementData && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Edit Element</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
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

                                <div>
                                    <Label>Rotation: {selectedElementData.rotation}°</Label>
                                    <Slider
                                        value={[selectedElementData.rotation]}
                                        onValueChange={([value]) => updateElement(selectedElementData.id, { rotation: value })}
                                        min={-180}
                                        max={180}
                                        step={1}
                                    />
                                </div>

                                {selectedElementData.type === 'text' && (
                                    <div>
                                        <Label>Content</Label>
                                        <Input
                                            value={selectedElementData.content || ''}
                                            onChange={(e) => updateElement(selectedElementData.id, { content: e.target.value })}
                                        />
                                    </div>
                                )}

                                {(selectedElementData.type === 'image' || selectedElementData.type === 'clipart') && (
                                    <div>
                                        <Label>Opacity: {Math.round((selectedElementData.opacity || 1) * 100)}%</Label>
                                        <Slider
                                            value={[(selectedElementData.opacity || 1) * 100]}
                                            onValueChange={([value]) => updateElement(selectedElementData.id, { opacity: value / 100 })}
                                            min={0}
                                            max={100}
                                            step={1}
                                        />
                                    </div>
                                )}

                                <Separator />

                                <div className="flex gap-2">
                                    <Button size="sm" onClick={() => duplicateElement(selectedElementData.id)} variant="outline">
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" onClick={() => deleteElement(selectedElementData.id)} variant="destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Canvas Area */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                Design Canvas
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant={showGrid ? 'default' : 'outline'}
                                        onClick={() => setShowGrid(!showGrid)}
                                    >
                                        <Grid className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setCanvasZoom(Math.max(0.5, canvasZoom - 0.1))}
                                    >
                                        <ZoomOut className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setCanvasZoom(Math.min(2, canvasZoom + 0.1))}
                                    >
                                        <ZoomIn className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-white">
                                <canvas
                                    ref={canvasRef}
                                    width={CANVAS_WIDTH}
                                    height={CANVAS_HEIGHT}
                                    onClick={handleCanvasClick}
                                    className="w-full h-auto cursor-pointer"
                                    style={{ transform: `scale(${canvasZoom})`, transformOrigin: 'top left' }}
                                />
                            </div>

                            {selectedElement && (
                                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Element Selected</span>
                                        <div className="flex gap-1">
                                            <Button size="sm" variant="outline" onClick={() => alignElement('left')}>
                                                <AlignLeft className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => alignElement('center')}>
                                                <AlignCenter className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => alignElement('right')}>
                                                <AlignRight className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => flipElement('horizontal')}>
                                                <FlipHorizontal className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => flipElement('vertical')}>
                                                <FlipVertical className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 text-sm text-gray-600">
                                <p>• Blue dashed area shows the printable region</p>
                                <p>• Click elements to select and edit them</p>
                                <p>• {elements.length} design element{elements.length !== 1 ? 's' : ''} added</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Layers Panel */}
                    {elements.length > 0 && (
                        <Card className="mt-4">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Layers className="h-5 w-5" />
                                    Layers ({elements.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {elements
                                        .sort((a, b) => b.zIndex - a.zIndex)
                                        .map((element) => (
                                            <div
                                                key={element.id}
                                                className={`p-2 border rounded cursor-pointer transition-colors ${
                                                    selectedElement === element.id
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                                onClick={() => setSelectedElement(element.id)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        {element.type === 'text' && <Type className="h-4 w-4" />}
                                                        {element.type === 'image' && <ImageIcon className="h-4 w-4" />}
                                                        {element.type === 'clipart' && <Palette className="h-4 w-4" />}
                                                        <span className="text-sm font-medium">
                                                            {element.type === 'text' && element.content
                                                                ? `"${element.content.slice(0, 20)}${element.content.length > 20 ? '...' : ''}"`
                                                                : `${element.type.charAt(0).toUpperCase() + element.type.slice(1)}`}
                                                        </span>
                                                    </div>
                                                    <Badge variant="outline" className="text-xs">
                                                        {element.zIndex}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
