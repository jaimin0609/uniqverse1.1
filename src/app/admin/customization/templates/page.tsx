"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Eye, Settings, Palette } from "lucide-react";
import { toast } from "sonner";

interface CustomizationTemplate {
    id: string;
    name: string;
    description: string;
    productType: string;
    canvas: {
        width: number;
        height: number;
    };
    printAreas: Array<{
        name: string;
        x: number;
        y: number;
        width: number;
        height: number;
    }>;
    allowedElements: string[];
    maxTextLength?: number;
    maxImageSize?: number;
    pricing?: {
        basePrice: number;
        textFee: number;
        imageFee: number;
        shapeFee: number;
    };
    createdAt: string;
    updatedAt: string;
}

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<CustomizationTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<CustomizationTemplate | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        productType: "",
        canvasWidth: 300,
        canvasHeight: 300,
        printAreaName: "Front",
        printAreaX: 50,
        printAreaY: 50,
        printAreaWidth: 200,
        printAreaHeight: 250,
        allowedElements: ["text", "image", "shape"],
        maxTextLength: 100,
        maxImageSize: 5,
        basePrice: 0,
        textFee: 2,
        imageFee: 5,
        shapeFee: 3
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            // Mock data for now - replace with actual API call
            const mockTemplates: CustomizationTemplate[] = [
                {
                    id: "1",
                    name: "T-Shirt Customization",
                    description: "Standard t-shirt customization template",
                    productType: "T-Shirt",
                    canvas: { width: 300, height: 300 },
                    printAreas: [{
                        name: "Front",
                        x: 50,
                        y: 50,
                        width: 200,
                        height: 250
                    }],
                    allowedElements: ["text", "image", "shape"],
                    maxTextLength: 100,
                    maxImageSize: 5,
                    pricing: {
                        basePrice: 0,
                        textFee: 2,
                        imageFee: 5,
                        shapeFee: 3
                    },
                    createdAt: "2025-05-30T10:00:00Z",
                    updatedAt: "2025-05-30T10:00:00Z"
                },
                {
                    id: "2",
                    name: "Hoodie Customization",
                    description: "Standard hoodie customization template",
                    productType: "Hoodie",
                    canvas: { width: 350, height: 400 },
                    printAreas: [{
                        name: "Front",
                        x: 75,
                        y: 100,
                        width: 200,
                        height: 200
                    }],
                    allowedElements: ["text", "image", "shape"],
                    maxTextLength: 80,
                    maxImageSize: 5,
                    pricing: {
                        basePrice: 0,
                        textFee: 3,
                        imageFee: 7,
                        shapeFee: 4
                    },
                    createdAt: "2025-05-30T11:00:00Z",
                    updatedAt: "2025-05-30T11:00:00Z"
                }
            ];
            setTemplates(mockTemplates);
        } catch (error) {
            console.error('Error fetching templates:', error);
            toast.error('Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTemplate = async () => {
        try {
            const newTemplate: CustomizationTemplate = {
                id: Math.random().toString(36).substr(2, 9),
                name: formData.name,
                description: formData.description,
                productType: formData.productType,
                canvas: {
                    width: formData.canvasWidth,
                    height: formData.canvasHeight
                },
                printAreas: [{
                    name: formData.printAreaName,
                    x: formData.printAreaX,
                    y: formData.printAreaY,
                    width: formData.printAreaWidth,
                    height: formData.printAreaHeight
                }],
                allowedElements: formData.allowedElements,
                maxTextLength: formData.maxTextLength,
                maxImageSize: formData.maxImageSize,
                pricing: {
                    basePrice: formData.basePrice,
                    textFee: formData.textFee,
                    imageFee: formData.imageFee,
                    shapeFee: formData.shapeFee
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            setTemplates(prev => [...prev, newTemplate]);
            setIsCreateDialogOpen(false);
            resetForm();
            toast.success('Template created successfully');
        } catch (error) {
            console.error('Error creating template:', error);
            toast.error('Failed to create template');
        }
    };

    const handleUpdateTemplate = async () => {
        if (!editingTemplate) return;

        try {
            const updatedTemplate: CustomizationTemplate = {
                ...editingTemplate,
                name: formData.name,
                description: formData.description,
                productType: formData.productType,
                canvas: {
                    width: formData.canvasWidth,
                    height: formData.canvasHeight
                },
                printAreas: [{
                    name: formData.printAreaName,
                    x: formData.printAreaX,
                    y: formData.printAreaY,
                    width: formData.printAreaWidth,
                    height: formData.printAreaHeight
                }],
                allowedElements: formData.allowedElements,
                maxTextLength: formData.maxTextLength,
                maxImageSize: formData.maxImageSize,
                pricing: {
                    basePrice: formData.basePrice,
                    textFee: formData.textFee,
                    imageFee: formData.imageFee,
                    shapeFee: formData.shapeFee
                },
                updatedAt: new Date().toISOString()
            };

            setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? updatedTemplate : t));
            setEditingTemplate(null);
            resetForm();
            toast.success('Template updated successfully');
        } catch (error) {
            console.error('Error updating template:', error);
            toast.error('Failed to update template');
        }
    };

    const handleDeleteTemplate = async (id: string) => {
        if (!confirm('Are you sure you want to delete this template?')) return;

        try {
            setTemplates(prev => prev.filter(t => t.id !== id));
            toast.success('Template deleted successfully');
        } catch (error) {
            console.error('Error deleting template:', error);
            toast.error('Failed to delete template');
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            productType: "",
            canvasWidth: 300,
            canvasHeight: 300,
            printAreaName: "Front",
            printAreaX: 50,
            printAreaY: 50,
            printAreaWidth: 200,
            printAreaHeight: 250,
            allowedElements: ["text", "image", "shape"],
            maxTextLength: 100,
            maxImageSize: 5,
            basePrice: 0,
            textFee: 2,
            imageFee: 5,
            shapeFee: 3
        });
    };

    const openEditDialog = (template: CustomizationTemplate) => {
        setEditingTemplate(template);
        setFormData({
            name: template.name,
            description: template.description,
            productType: template.productType,
            canvasWidth: template.canvas.width,
            canvasHeight: template.canvas.height,
            printAreaName: template.printAreas[0]?.name || "Front",
            printAreaX: template.printAreas[0]?.x || 50,
            printAreaY: template.printAreas[0]?.y || 50,
            printAreaWidth: template.printAreas[0]?.width || 200,
            printAreaHeight: template.printAreas[0]?.height || 250,
            allowedElements: template.allowedElements,
            maxTextLength: template.maxTextLength || 100,
            maxImageSize: template.maxImageSize || 5,
            basePrice: template.pricing?.basePrice || 0,
            textFee: template.pricing?.textFee || 2,
            imageFee: template.pricing?.imageFee || 5,
            shapeFee: template.pricing?.shapeFee || 3
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Customization Templates</h1>
                    <p className="text-gray-600">Manage templates for product customization</p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Template
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create Customization Template</DialogTitle>
                            <DialogDescription>
                                Create a new template for product customization
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-2 gap-6">
                            {/* Basic Information */}
                            <div className="space-y-4">
                                <h3 className="font-semibold">Basic Information</h3>
                                <div>
                                    <Label htmlFor="name">Template Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g., T-Shirt Customization"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Template description..."
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="productType">Product Type</Label>
                                    <Select value={formData.productType} onValueChange={(value) => setFormData(prev => ({ ...prev, productType: value }))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select product type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="T-Shirt">T-Shirt</SelectItem>
                                            <SelectItem value="Hoodie">Hoodie</SelectItem>
                                            <SelectItem value="Mug">Mug</SelectItem>
                                            <SelectItem value="Poster">Poster</SelectItem>
                                            <SelectItem value="Phone Case">Phone Case</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Canvas & Print Area */}
                            <div className="space-y-4">
                                <h3 className="font-semibold">Canvas & Print Area</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label htmlFor="canvasWidth">Canvas Width</Label>
                                        <Input
                                            id="canvasWidth"
                                            type="number"
                                            value={formData.canvasWidth}
                                            onChange={(e) => setFormData(prev => ({ ...prev, canvasWidth: parseInt(e.target.value) }))}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="canvasHeight">Canvas Height</Label>
                                        <Input
                                            id="canvasHeight"
                                            type="number"
                                            value={formData.canvasHeight}
                                            onChange={(e) => setFormData(prev => ({ ...prev, canvasHeight: parseInt(e.target.value) }))}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="printAreaName">Print Area Name</Label>
                                    <Input
                                        id="printAreaName"
                                        value={formData.printAreaName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, printAreaName: e.target.value }))}
                                        placeholder="e.g., Front"
                                    />
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    <div>
                                        <Label htmlFor="printAreaX">X</Label>
                                        <Input
                                            id="printAreaX"
                                            type="number"
                                            value={formData.printAreaX}
                                            onChange={(e) => setFormData(prev => ({ ...prev, printAreaX: parseInt(e.target.value) }))}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="printAreaY">Y</Label>
                                        <Input
                                            id="printAreaY"
                                            type="number"
                                            value={formData.printAreaY}
                                            onChange={(e) => setFormData(prev => ({ ...prev, printAreaY: parseInt(e.target.value) }))}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="printAreaWidth">Width</Label>
                                        <Input
                                            id="printAreaWidth"
                                            type="number"
                                            value={formData.printAreaWidth}
                                            onChange={(e) => setFormData(prev => ({ ...prev, printAreaWidth: parseInt(e.target.value) }))}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="printAreaHeight">Height</Label>
                                        <Input
                                            id="printAreaHeight"
                                            type="number"
                                            value={formData.printAreaHeight}
                                            onChange={(e) => setFormData(prev => ({ ...prev, printAreaHeight: parseInt(e.target.value) }))}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Constraints */}
                            <div className="space-y-4">
                                <h3 className="font-semibold">Constraints</h3>
                                <div>
                                    <Label htmlFor="maxTextLength">Max Text Length</Label>
                                    <Input
                                        id="maxTextLength"
                                        type="number"
                                        value={formData.maxTextLength}
                                        onChange={(e) => setFormData(prev => ({ ...prev, maxTextLength: parseInt(e.target.value) }))}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="maxImageSize">Max Image Size (MB)</Label>
                                    <Input
                                        id="maxImageSize"
                                        type="number"
                                        value={formData.maxImageSize}
                                        onChange={(e) => setFormData(prev => ({ ...prev, maxImageSize: parseInt(e.target.value) }))}
                                    />
                                </div>
                            </div>

                            {/* Pricing */}
                            <div className="space-y-4">
                                <h3 className="font-semibold">Pricing</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label htmlFor="basePrice">Base Price ($)</Label>
                                        <Input
                                            id="basePrice"
                                            type="number"
                                            step="0.01"
                                            value={formData.basePrice}
                                            onChange={(e) => setFormData(prev => ({ ...prev, basePrice: parseFloat(e.target.value) }))}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="textFee">Text Fee ($)</Label>
                                        <Input
                                            id="textFee"
                                            type="number"
                                            step="0.01"
                                            value={formData.textFee}
                                            onChange={(e) => setFormData(prev => ({ ...prev, textFee: parseFloat(e.target.value) }))}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="imageFee">Image Fee ($)</Label>
                                        <Input
                                            id="imageFee"
                                            type="number"
                                            step="0.01"
                                            value={formData.imageFee}
                                            onChange={(e) => setFormData(prev => ({ ...prev, imageFee: parseFloat(e.target.value) }))}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="shapeFee">Shape Fee ($)</Label>
                                        <Input
                                            id="shapeFee"
                                            type="number"
                                            step="0.01"
                                            value={formData.shapeFee}
                                            onChange={(e) => setFormData(prev => ({ ...prev, shapeFee: parseFloat(e.target.value) }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreateTemplate}>
                                Create Template
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Templates Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Templates ({templates.length})</CardTitle>
                    <CardDescription>Manage your customization templates</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Product Type</TableHead>
                                <TableHead>Canvas Size</TableHead>
                                <TableHead>Elements</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {templates.map((template) => (
                                <TableRow key={template.id}>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{template.name}</div>
                                            <div className="text-sm text-gray-500">{template.description}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{template.productType}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {template.canvas.width} × {template.canvas.height}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            {template.allowedElements.map((element) => (
                                                <Badge key={element} variant="outline" className="text-xs">
                                                    {element}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(template.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openEditDialog(template)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteTemplate(template.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Edit Template Dialog */}
            <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Template</DialogTitle>
                        <DialogDescription>
                            Update the customization template
                        </DialogDescription>
                    </DialogHeader>

                    {/* Same form content as create dialog - for brevity, using same structure */}
                    <div className="grid grid-cols-2 gap-6">
                        {/* Basic Information */}
                        <div className="space-y-4">
                            <h3 className="font-semibold">Basic Information</h3>
                            <div>
                                <Label htmlFor="edit-name">Template Name</Label>
                                <Input
                                    id="edit-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-description">Description</Label>
                                <Textarea
                                    id="edit-description"
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-productType">Product Type</Label>
                                <Select value={formData.productType} onValueChange={(value) => setFormData(prev => ({ ...prev, productType: value }))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="T-Shirt">T-Shirt</SelectItem>
                                        <SelectItem value="Hoodie">Hoodie</SelectItem>
                                        <SelectItem value="Mug">Mug</SelectItem>
                                        <SelectItem value="Poster">Poster</SelectItem>
                                        <SelectItem value="Phone Case">Phone Case</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Canvas & Print Area */}
                        <div className="space-y-4">
                            <h3 className="font-semibold">Canvas & Print Area</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label>Canvas Width</Label>
                                    <Input
                                        type="number"
                                        value={formData.canvasWidth}
                                        onChange={(e) => setFormData(prev => ({ ...prev, canvasWidth: parseInt(e.target.value) }))}
                                    />
                                </div>
                                <div>
                                    <Label>Canvas Height</Label>
                                    <Input
                                        type="number"
                                        value={formData.canvasHeight}
                                        onChange={(e) => setFormData(prev => ({ ...prev, canvasHeight: parseInt(e.target.value) }))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingTemplate(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateTemplate}>
                            Update Template
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
