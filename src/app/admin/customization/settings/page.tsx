"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Settings, Save, Upload, FileImage, Type, Shapes, DollarSign, Shield } from "lucide-react";
import { toast } from "sonner";

interface CustomizationSettings {
    general: {
        enabled: boolean;
        maxDesignsPerUser: number;
        autoSaveInterval: number;
        previewQuality: 'low' | 'medium' | 'high';
    };
    canvas: {
        maxWidth: number;
        maxHeight: number;
        backgroundColor: string;
        gridEnabled: boolean;
        snapToGrid: boolean;
        gridSize: number;
    };
    text: {
        enabled: boolean;
        maxLength: number;
        minFontSize: number;
        maxFontSize: number;
        allowedFonts: string[];
        allowedColors: string[];
        defaultFont: string;
        defaultColor: string;
    };
    images: {
        enabled: boolean;
        maxFileSize: number; // MB
        allowedFormats: string[];
        maxWidth: number;
        maxHeight: number;
        allowUpload: boolean;
        requireModeration: boolean;
    };
    shapes: {
        enabled: boolean;
        allowedShapes: string[];
        maxShapes: number;
        allowedColors: string[];
    };
    pricing: {
        baseCustomizationFee: number;
        textElementFee: number;
        imageElementFee: number;
        shapeElementFee: number;
        complexityMultiplier: number;
        freeElementsLimit: number;
    };
    restrictions: {
        profanityFilter: boolean;
        copyrightCheck: boolean;
        manualReview: boolean;
        blockedWords: string[];
        allowedDomains: string[];
    };
}

export default function CustomizationSettingsPage() {
    const [settings, setSettings] = useState<CustomizationSettings>({
        general: {
            enabled: true,
            maxDesignsPerUser: 10,
            autoSaveInterval: 30,
            previewQuality: 'medium'
        },
        canvas: {
            maxWidth: 500,
            maxHeight: 500,
            backgroundColor: '#ffffff',
            gridEnabled: true,
            snapToGrid: false,
            gridSize: 10
        },
        text: {
            enabled: true,
            maxLength: 100,
            minFontSize: 8,
            maxFontSize: 72,
            allowedFonts: ['Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Courier New'],
            allowedColors: ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'],
            defaultFont: 'Arial',
            defaultColor: '#000000'
        },
        images: {
            enabled: true,
            maxFileSize: 5,
            allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'svg'],
            maxWidth: 1000,
            maxHeight: 1000,
            allowUpload: true,
            requireModeration: false
        },
        shapes: {
            enabled: true,
            allowedShapes: ['circle', 'rectangle', 'triangle', 'star', 'heart'],
            maxShapes: 5,
            allowedColors: ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']
        },
        pricing: {
            baseCustomizationFee: 0,
            textElementFee: 2,
            imageElementFee: 5,
            shapeElementFee: 3,
            complexityMultiplier: 1.5,
            freeElementsLimit: 2
        },
        restrictions: {
            profanityFilter: true,
            copyrightCheck: true,
            manualReview: false,
            blockedWords: ['spam', 'inappropriate'],
            allowedDomains: ['example.com', 'trusted-images.com']
        }
    });

    const [loading, setLoading] = useState(false);
    const [newFont, setNewFont] = useState("");
    const [newColor, setNewColor] = useState("#000000");
    const [newBlockedWord, setNewBlockedWord] = useState("");
    const [newDomain, setNewDomain] = useState("");

    const handleSaveSettings = async () => {
        setLoading(true);
        try {
            // In a real implementation, this would save to your API
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
            toast.success('Settings saved successfully');
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setLoading(false);
        }
    };

    const updateSettings = (section: keyof CustomizationSettings, field: string, value: any) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const addToArray = (section: keyof CustomizationSettings, field: string, value: string) => {
        if (!value.trim()) return;

        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: [...(prev[section] as any)[field], value.trim()]
            }
        }));
    };

    const removeFromArray = (section: keyof CustomizationSettings, field: string, index: number) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: (prev[section] as any)[field].filter((_: any, i: number) => i !== index)
            }
        }));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Customization Settings</h1>
                    <p className="text-gray-600">Configure global customization rules and pricing</p>
                </div>
                <Button onClick={handleSaveSettings} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Settings'}
                </Button>
            </div>

            {/* General Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        General Settings
                    </CardTitle>
                    <CardDescription>
                        Basic configuration for the customization system
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="enabled">Enable Customization</Label>
                            <p className="text-sm text-gray-500">Allow customers to customize products</p>
                        </div>
                        <Switch
                            id="enabled"
                            checked={settings.general.enabled}
                            onCheckedChange={(checked) => updateSettings('general', 'enabled', checked)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="maxDesigns">Max Designs per User</Label>
                            <Input
                                id="maxDesigns"
                                type="number"
                                value={settings.general.maxDesignsPerUser}
                                onChange={(e) => updateSettings('general', 'maxDesignsPerUser', parseInt(e.target.value))}
                            />
                        </div>
                        <div>
                            <Label htmlFor="autoSave">Auto-save Interval (seconds)</Label>
                            <Input
                                id="autoSave"
                                type="number"
                                value={settings.general.autoSaveInterval}
                                onChange={(e) => updateSettings('general', 'autoSaveInterval', parseInt(e.target.value))}
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="previewQuality">Preview Quality</Label>
                        <Select
                            value={settings.general.previewQuality}
                            onValueChange={(value) => updateSettings('general', 'previewQuality', value)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Low (Faster)</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High (Better Quality)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Canvas Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Canvas Settings</CardTitle>
                    <CardDescription>Configure the design canvas properties</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="maxCanvasWidth">Max Canvas Width (px)</Label>
                            <Input
                                id="maxCanvasWidth"
                                type="number"
                                value={settings.canvas.maxWidth}
                                onChange={(e) => updateSettings('canvas', 'maxWidth', parseInt(e.target.value))}
                            />
                        </div>
                        <div>
                            <Label htmlFor="maxCanvasHeight">Max Canvas Height (px)</Label>
                            <Input
                                id="maxCanvasHeight"
                                type="number"
                                value={settings.canvas.maxHeight}
                                onChange={(e) => updateSettings('canvas', 'maxHeight', parseInt(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="backgroundColor">Background Color</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="backgroundColor"
                                    type="color"
                                    value={settings.canvas.backgroundColor}
                                    onChange={(e) => updateSettings('canvas', 'backgroundColor', e.target.value)}
                                    className="w-20"
                                />
                                <Input
                                    type="text"
                                    value={settings.canvas.backgroundColor}
                                    onChange={(e) => updateSettings('canvas', 'backgroundColor', e.target.value)}
                                    className="flex-1"
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="gridSize">Grid Size (px)</Label>
                            <Input
                                id="gridSize"
                                type="number"
                                value={settings.canvas.gridSize}
                                onChange={(e) => updateSettings('canvas', 'gridSize', parseInt(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Grid Enabled</Label>
                            <p className="text-sm text-gray-500">Show grid lines on canvas</p>
                        </div>
                        <Switch
                            checked={settings.canvas.gridEnabled}
                            onCheckedChange={(checked) => updateSettings('canvas', 'gridEnabled', checked)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Snap to Grid</Label>
                            <p className="text-sm text-gray-500">Automatically align elements to grid</p>
                        </div>
                        <Switch
                            checked={settings.canvas.snapToGrid}
                            onCheckedChange={(checked) => updateSettings('canvas', 'snapToGrid', checked)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Text Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Type className="h-5 w-5" />
                        Text Settings
                    </CardTitle>
                    <CardDescription>Configure text customization options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Text Elements</Label>
                            <p className="text-sm text-gray-500">Allow customers to add text</p>
                        </div>
                        <Switch
                            checked={settings.text.enabled}
                            onCheckedChange={(checked) => updateSettings('text', 'enabled', checked)}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="maxTextLength">Max Text Length</Label>
                            <Input
                                id="maxTextLength"
                                type="number"
                                value={settings.text.maxLength}
                                onChange={(e) => updateSettings('text', 'maxLength', parseInt(e.target.value))}
                            />
                        </div>
                        <div>
                            <Label htmlFor="minFontSize">Min Font Size</Label>
                            <Input
                                id="minFontSize"
                                type="number"
                                value={settings.text.minFontSize}
                                onChange={(e) => updateSettings('text', 'minFontSize', parseInt(e.target.value))}
                            />
                        </div>
                        <div>
                            <Label htmlFor="maxFontSize">Max Font Size</Label>
                            <Input
                                id="maxFontSize"
                                type="number"
                                value={settings.text.maxFontSize}
                                onChange={(e) => updateSettings('text', 'maxFontSize', parseInt(e.target.value))}
                            />
                        </div>
                    </div>

                    <div>
                        <Label>Allowed Fonts</Label>
                        <div className="flex gap-2 mb-2">
                            <Input
                                placeholder="Add font name..."
                                value={newFont}
                                onChange={(e) => setNewFont(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        addToArray('text', 'allowedFonts', newFont);
                                        setNewFont("");
                                    }
                                }}
                            />
                            <Button
                                onClick={() => {
                                    addToArray('text', 'allowedFonts', newFont);
                                    setNewFont("");
                                }}
                                variant="outline"
                            >
                                Add
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {settings.text.allowedFonts.map((font, index) => (
                                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                    {font}
                                    <button
                                        onClick={() => removeFromArray('text', 'allowedFonts', index)}
                                        className="ml-1 text-red-500 hover:text-red-700"
                                    >
                                        ×
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div>
                        <Label>Allowed Colors</Label>
                        <div className="flex gap-2 mb-2">
                            <Input
                                type="color"
                                value={newColor}
                                onChange={(e) => setNewColor(e.target.value)}
                                className="w-20"
                            />
                            <Input
                                placeholder="#000000"
                                value={newColor}
                                onChange={(e) => setNewColor(e.target.value)}
                            />
                            <Button
                                onClick={() => {
                                    addToArray('text', 'allowedColors', newColor);
                                    setNewColor("#000000");
                                }}
                                variant="outline"
                            >
                                Add
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {settings.text.allowedColors.map((color, index) => (
                                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                    <div
                                        className="w-3 h-3 rounded-full border"
                                        style={{ backgroundColor: color }}
                                    />
                                    {color}
                                    <button
                                        onClick={() => removeFromArray('text', 'allowedColors', index)}
                                        className="ml-1 text-red-500 hover:text-red-700"
                                    >
                                        ×
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Image Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileImage className="h-5 w-5" />
                        Image Settings
                    </CardTitle>
                    <CardDescription>Configure image upload and usage options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Image Elements</Label>
                            <p className="text-sm text-gray-500">Allow customers to add images</p>
                        </div>
                        <Switch
                            checked={settings.images.enabled}
                            onCheckedChange={(checked) => updateSettings('images', 'enabled', checked)}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                            <Input
                                id="maxFileSize"
                                type="number"
                                value={settings.images.maxFileSize}
                                onChange={(e) => updateSettings('images', 'maxFileSize', parseInt(e.target.value))}
                            />
                        </div>
                        <div>
                            <Label htmlFor="maxImageWidth">Max Width (px)</Label>
                            <Input
                                id="maxImageWidth"
                                type="number"
                                value={settings.images.maxWidth}
                                onChange={(e) => updateSettings('images', 'maxWidth', parseInt(e.target.value))}
                            />
                        </div>
                        <div>
                            <Label htmlFor="maxImageHeight">Max Height (px)</Label>
                            <Input
                                id="maxImageHeight"
                                type="number"
                                value={settings.images.maxHeight}
                                onChange={(e) => updateSettings('images', 'maxHeight', parseInt(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Allow Upload</Label>
                                <p className="text-sm text-gray-500">Let customers upload their own images</p>
                            </div>
                            <Switch
                                checked={settings.images.allowUpload}
                                onCheckedChange={(checked) => updateSettings('images', 'allowUpload', checked)}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Require Moderation</Label>
                                <p className="text-sm text-gray-500">Review uploaded images before use</p>
                            </div>
                            <Switch
                                checked={settings.images.requireModeration}
                                onCheckedChange={(checked) => updateSettings('images', 'requireModeration', checked)}
                            />
                        </div>
                    </div>

                    <div>
                        <Label>Allowed Formats</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {settings.images.allowedFormats.map((format, index) => (
                                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                    {format.toUpperCase()}
                                    <button
                                        onClick={() => removeFromArray('images', 'allowedFormats', index)}
                                        className="ml-1 text-red-500 hover:text-red-700"
                                    >
                                        ×
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Pricing Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Pricing Settings
                    </CardTitle>
                    <CardDescription>Set fees for customization features</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="baseCustomizationFee">Base Customization Fee ($)</Label>
                            <Input
                                id="baseCustomizationFee"
                                type="number"
                                step="0.01"
                                value={settings.pricing.baseCustomizationFee}
                                onChange={(e) => updateSettings('pricing', 'baseCustomizationFee', parseFloat(e.target.value))}
                            />
                        </div>
                        <div>
                            <Label htmlFor="freeElementsLimit">Free Elements Limit</Label>
                            <Input
                                id="freeElementsLimit"
                                type="number"
                                value={settings.pricing.freeElementsLimit}
                                onChange={(e) => updateSettings('pricing', 'freeElementsLimit', parseInt(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="textElementFee">Text Element Fee ($)</Label>
                            <Input
                                id="textElementFee"
                                type="number"
                                step="0.01"
                                value={settings.pricing.textElementFee}
                                onChange={(e) => updateSettings('pricing', 'textElementFee', parseFloat(e.target.value))}
                            />
                        </div>
                        <div>
                            <Label htmlFor="imageElementFee">Image Element Fee ($)</Label>
                            <Input
                                id="imageElementFee"
                                type="number"
                                step="0.01"
                                value={settings.pricing.imageElementFee}
                                onChange={(e) => updateSettings('pricing', 'imageElementFee', parseFloat(e.target.value))}
                            />
                        </div>
                        <div>
                            <Label htmlFor="shapeElementFee">Shape Element Fee ($)</Label>
                            <Input
                                id="shapeElementFee"
                                type="number"
                                step="0.01"
                                value={settings.pricing.shapeElementFee}
                                onChange={(e) => updateSettings('pricing', 'shapeElementFee', parseFloat(e.target.value))}
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="complexityMultiplier">Complexity Multiplier</Label>
                        <Input
                            id="complexityMultiplier"
                            type="number"
                            step="0.1"
                            value={settings.pricing.complexityMultiplier}
                            onChange={(e) => updateSettings('pricing', 'complexityMultiplier', parseFloat(e.target.value))}
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            Multiplier applied to total fee based on design complexity
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Restrictions Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Content Restrictions
                    </CardTitle>
                    <CardDescription>Configure content filtering and restrictions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Profanity Filter</Label>
                                <p className="text-sm text-gray-500">Automatically filter inappropriate text</p>
                            </div>
                            <Switch
                                checked={settings.restrictions.profanityFilter}
                                onCheckedChange={(checked) => updateSettings('restrictions', 'profanityFilter', checked)}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Copyright Check</Label>
                                <p className="text-sm text-gray-500">Check images for potential copyright issues</p>
                            </div>
                            <Switch
                                checked={settings.restrictions.copyrightCheck}
                                onCheckedChange={(checked) => updateSettings('restrictions', 'copyrightCheck', checked)}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Manual Review</Label>
                                <p className="text-sm text-gray-500">Require manual approval for all designs</p>
                            </div>
                            <Switch
                                checked={settings.restrictions.manualReview}
                                onCheckedChange={(checked) => updateSettings('restrictions', 'manualReview', checked)}
                            />
                        </div>
                    </div>

                    <div>
                        <Label>Blocked Words</Label>
                        <div className="flex gap-2 mb-2">
                            <Input
                                placeholder="Add blocked word..."
                                value={newBlockedWord}
                                onChange={(e) => setNewBlockedWord(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        addToArray('restrictions', 'blockedWords', newBlockedWord);
                                        setNewBlockedWord("");
                                    }
                                }}
                            />
                            <Button
                                onClick={() => {
                                    addToArray('restrictions', 'blockedWords', newBlockedWord);
                                    setNewBlockedWord("");
                                }}
                                variant="outline"
                            >
                                Add
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {settings.restrictions.blockedWords.map((word, index) => (
                                <Badge key={index} variant="destructive" className="flex items-center gap-1">
                                    {word}
                                    <button
                                        onClick={() => removeFromArray('restrictions', 'blockedWords', index)}
                                        className="ml-1 text-white hover:text-gray-200"
                                    >
                                        ×
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div>
                        <Label>Allowed Image Domains</Label>
                        <div className="flex gap-2 mb-2">
                            <Input
                                placeholder="Add domain..."
                                value={newDomain}
                                onChange={(e) => setNewDomain(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        addToArray('restrictions', 'allowedDomains', newDomain);
                                        setNewDomain("");
                                    }
                                }}
                            />
                            <Button
                                onClick={() => {
                                    addToArray('restrictions', 'allowedDomains', newDomain);
                                    setNewDomain("");
                                }}
                                variant="outline"
                            >
                                Add
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {settings.restrictions.allowedDomains.map((domain, index) => (
                                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                    {domain}
                                    <button
                                        onClick={() => removeFromArray('restrictions', 'allowedDomains', index)}
                                        className="ml-1 text-red-500 hover:text-red-700"
                                    >
                                        ×
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
