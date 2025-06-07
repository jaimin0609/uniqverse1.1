'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import {
    Palette,
    Type,
    Image as ImageIcon,
    Layers,
    Filter,
    Sparkles,
    Download,
    Save,
    Star,
    Search,
    Grid,
    List,
    Crown,
    Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface DesignTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    thumbnail: string;
    isPremium: boolean;
    popularity: number;
    tags: string[];
    data: any;
}

interface DesignTool {
    id: string;
    name: string;
    icon: React.ComponentType<any>;
    category: string;
    description: string;
    isPremium: boolean;
}

interface AdvancedDesignToolsProps {
    onTemplateSelect: (template: DesignTemplate) => void;
    onToolSelect: (tool: DesignTool) => void;
    currentCanvas?: any;
}

const DESIGN_TEMPLATES: DesignTemplate[] = [
    {
        id: 'template-1',
        name: 'Vintage Badge',
        description: 'Classic vintage-style badge design',
        category: 'logos',
        thumbnail: '/api/placeholder/150/150',
        isPremium: false,
        popularity: 95,
        tags: ['vintage', 'badge', 'retro', 'logo'],
        data: {
            elements: [
                { type: 'circle', color: '#8B4513', size: 100 },
                { type: 'text', content: 'VINTAGE', font: 'serif', size: 16 }
            ]
        }
    },
    {
        id: 'template-2',
        name: 'Modern Gradient',
        description: 'Contemporary gradient background with text',
        category: 'backgrounds',
        thumbnail: '/api/placeholder/150/150',
        isPremium: true,
        popularity: 88,
        tags: ['modern', 'gradient', 'minimal', 'contemporary'],
        data: {
            elements: [
                { type: 'gradient', colors: ['#667eea', '#764ba2'] },
                { type: 'text', content: 'MODERN', font: 'sans-serif', size: 24 }
            ]
        }
    },
    {
        id: 'template-3',
        name: 'Nature Pattern',
        description: 'Organic leaf and branch patterns',
        category: 'patterns',
        thumbnail: '/api/placeholder/150/150',
        isPremium: false,
        popularity: 76,
        tags: ['nature', 'organic', 'leaves', 'botanical'],
        data: {
            elements: [
                { type: 'pattern', pattern: 'leaves', color: '#2d5016' }
            ]
        }
    },
    {
        id: 'template-4',
        name: 'Geometric Art',
        description: 'Abstract geometric shapes and patterns',
        category: 'abstract',
        thumbnail: '/api/placeholder/150/150',
        isPremium: true,
        popularity: 92,
        tags: ['geometric', 'abstract', 'shapes', 'modern'],
        data: {
            elements: [
                { type: 'polygon', sides: 6, color: '#ff6b6b' },
                { type: 'polygon', sides: 3, color: '#4ecdc4' }
            ]
        }
    },
    {
        id: 'template-5',
        name: 'Typography Focus',
        description: 'Bold typography with minimal design',
        category: 'typography',
        thumbnail: '/api/placeholder/150/150',
        isPremium: false,
        popularity: 83,
        tags: ['typography', 'bold', 'minimal', 'text'],
        data: {
            elements: [
                { type: 'text', content: 'BOLD', font: 'bold sans-serif', size: 48 }
            ]
        }
    },
    {
        id: 'template-6',
        name: 'Watercolor Splash',
        description: 'Artistic watercolor effects and textures',
        category: 'artistic',
        thumbnail: '/api/placeholder/150/150',
        isPremium: true,
        popularity: 79,
        tags: ['watercolor', 'artistic', 'paint', 'creative'],
        data: {
            elements: [
                { type: 'watercolor', color: '#ff6b6b', opacity: 0.7 }
            ]
        }
    }
];

const DESIGN_TOOLS: DesignTool[] = [
    {
        id: 'gradient-generator',
        name: 'Gradient Generator',
        icon: Palette,
        category: 'effects',
        description: 'Create beautiful gradients',
        isPremium: false
    },
    {
        id: 'pattern-maker',
        name: 'Pattern Maker',
        icon: Grid,
        category: 'patterns',
        description: 'Generate seamless patterns',
        isPremium: true
    },
    {
        id: 'text-effects',
        name: 'Text Effects',
        icon: Type,
        category: 'typography',
        description: 'Add stunning text effects',
        isPremium: false
    },
    {
        id: 'image-filters',
        name: 'Image Filters',
        icon: Filter,
        category: 'effects',
        description: 'Apply professional filters',
        isPremium: true
    },
    {
        id: 'ai-enhance',
        name: 'AI Enhance',
        icon: Sparkles,
        category: 'ai',
        description: 'AI-powered design enhancement',
        isPremium: true
    },
    {
        id: 'layer-effects',
        name: 'Layer Effects',
        icon: Layers,
        category: 'effects',
        description: 'Advanced layer blending',
        isPremium: true
    }
];

export default function AdvancedDesignTools({
    onTemplateSelect,
    onToolSelect,
    currentCanvas
}: AdvancedDesignToolsProps) {
    const [activeTab, setActiveTab] = useState('templates');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showPremiumOnly, setShowPremiumOnly] = useState(false);
    const [favoriteTemplates, setFavoriteTemplates] = useState<string[]>([]);

    // Filter templates based on search and category
    const filteredTemplates = DESIGN_TEMPLATES.filter(template => {
        const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
        const matchesPremium = !showPremiumOnly || template.isPremium;

        return matchesSearch && matchesCategory && matchesPremium;
    });

    // Filter tools based on search and category
    const filteredTools = DESIGN_TOOLS.filter(tool => {
        const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tool.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
        const matchesPremium = !showPremiumOnly || tool.isPremium;

        return matchesSearch && matchesCategory && matchesPremium;
    });

    const categories = ['all', ...Array.from(new Set([
        ...DESIGN_TEMPLATES.map(t => t.category),
        ...DESIGN_TOOLS.map(t => t.category)
    ]))];

    const toggleFavorite = (templateId: string) => {
        setFavoriteTemplates(prev =>
            prev.includes(templateId)
                ? prev.filter(id => id !== templateId)
                : [...prev, templateId]
        );
    };

    const handleTemplateSelect = (template: DesignTemplate) => {
        if (template.isPremium) {
            toast.info('This is a premium template. Upgrade to use it!');
            return;
        }
        onTemplateSelect(template);
        toast.success(`Applied template: ${template.name}`);
    };

    const handleToolSelect = (tool: DesignTool) => {
        if (tool.isPremium) {
            toast.info('This is a premium tool. Upgrade to access it!');
            return;
        }
        onToolSelect(tool);
        toast.success(`Activated tool: ${tool.name}`);
    };

    return (
        <div className="w-full space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5" />
                                Advanced Design Tools
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                Professional templates and tools for stunning designs
                            </p>
                        </div>
                        <Badge variant="secondary" className="flex items-center gap-1">
                            <Crown className="h-3 w-3" />
                            Pro Features
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Search and Filters */}
                    <div className="space-y-4 mb-6">
                        <div className="flex gap-4 items-center">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search templates and tools..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setViewMode('grid')}
                                >
                                    <Grid className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={viewMode === 'list' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setViewMode('list')}
                                >
                                    <List className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {categories.map(category => (
                                <Button
                                    key={category}
                                    variant={selectedCategory === category ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setSelectedCategory(category)}
                                >
                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                </Button>
                            ))}
                            <Button
                                variant={showPremiumOnly ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setShowPremiumOnly(!showPremiumOnly)}
                                className="ml-auto"
                            >
                                <Crown className="h-3 w-3 mr-1" />
                                Premium Only
                            </Button>
                        </div>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="templates">
                                Design Templates ({filteredTemplates.length})
                            </TabsTrigger>
                            <TabsTrigger value="tools">
                                Design Tools ({filteredTools.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="templates" className="mt-6">
                            {filteredTemplates.length === 0 ? (
                                <div className="text-center py-12">
                                    <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-medium mb-2">No templates found</h3>
                                    <p className="text-muted-foreground">
                                        Try adjusting your search or category filters
                                    </p>
                                </div>
                            ) : (
                                <div className={
                                    viewMode === 'grid'
                                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                                        : 'space-y-3'
                                }>
                                    {filteredTemplates.map(template => (
                                        <Card key={template.id} className="group hover:shadow-md transition-shadow">
                                            <CardContent className={viewMode === 'grid' ? 'p-4' : 'p-3'}>
                                                <div className={viewMode === 'grid' ? 'space-y-3' : 'flex gap-4 items-center'}>
                                                    {viewMode === 'grid' && (
                                                        <div className="relative">
                                                            <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                                                                <Sparkles className="h-8 w-8 text-gray-400" />
                                                            </div>
                                                            <div className="absolute top-2 right-2 flex gap-1">
                                                                {template.isPremium && (
                                                                    <Badge variant="default" className="text-xs">
                                                                        <Crown className="h-2 w-2 mr-1" />
                                                                        Pro
                                                                    </Badge>
                                                                )}
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => toggleFavorite(template.id)}
                                                                    className="h-6 w-6 p-0"
                                                                >
                                                                    <Star className={`h-3 w-3 ${favoriteTemplates.includes(template.id)
                                                                            ? 'text-yellow-500 fill-current'
                                                                            : 'text-gray-400'
                                                                        }`} />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className={viewMode === 'grid' ? '' : 'flex-1'}>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <h4 className="font-medium text-sm">{template.name}</h4>
                                                            {viewMode === 'list' && template.isPremium && (
                                                                <Badge variant="default" className="text-xs">
                                                                    <Crown className="h-2 w-2 mr-1" />
                                                                    Pro
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mb-2">
                                                            {template.description}
                                                        </p>
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex gap-1">
                                                                {template.tags.slice(0, 2).map(tag => (
                                                                    <Badge key={tag} variant="outline" className="text-xs">
                                                                        {tag}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-muted-foreground">
                                                                    {template.popularity}%
                                                                </span>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handleTemplateSelect(template)}
                                                                    className="h-7"
                                                                >
                                                                    Use
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="tools" className="mt-6">
                            {filteredTools.length === 0 ? (
                                <div className="text-center py-12">
                                    <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-medium mb-2">No tools found</h3>
                                    <p className="text-muted-foreground">
                                        Try adjusting your search or category filters
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filteredTools.map(tool => (
                                        <Card key={tool.id} className="group hover:shadow-md transition-shadow">
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-primary/10 rounded-lg">
                                                        <tool.icon className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <h4 className="font-medium text-sm">{tool.name}</h4>
                                                            {tool.isPremium && (
                                                                <Badge variant="default" className="text-xs">
                                                                    <Crown className="h-2 w-2 mr-1" />
                                                                    Pro
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mb-2">
                                                            {tool.description}
                                                        </p>
                                                        <div className="flex items-center justify-between">
                                                            <Badge variant="outline" className="text-xs">
                                                                {tool.category}
                                                            </Badge>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleToolSelect(tool)}
                                                                className="h-7"
                                                            >
                                                                <Zap className="h-3 w-3 mr-1" />
                                                                Use
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <Button variant="outline" size="sm" className="h-auto flex-col gap-1 py-3">
                            <Download className="h-4 w-4" />
                            <span className="text-xs">Export All</span>
                        </Button>
                        <Button variant="outline" size="sm" className="h-auto flex-col gap-1 py-3">
                            <Save className="h-4 w-4" />
                            <span className="text-xs">Save Template</span>
                        </Button>
                        <Button variant="outline" size="sm" className="h-auto flex-col gap-1 py-3">
                            <Sparkles className="h-4 w-4" />
                            <span className="text-xs">AI Suggest</span>
                        </Button>
                        <Button variant="outline" size="sm" className="h-auto flex-col gap-1 py-3">
                            <Star className="h-4 w-4" />
                            <span className="text-xs">Favorites</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
