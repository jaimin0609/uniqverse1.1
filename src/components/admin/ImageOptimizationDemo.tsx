"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, Image, Check, AlertCircle } from 'lucide-react';
import AdvancedImageOptimization from '@/components/ui/advanced-image-optimization';

interface OptimizedImageSet {
    original: {
        url: string;
        width: number;
        height: number;
        format: string;
        size: number;
    };
    variants: {
        thumbnail: any;
        small: any;
        medium: any;
        large: any;
        webp?: any;
        avif?: any;
    };
    placeholder: string;
}

export default function ImageOptimizationDemo() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [optimizing, setOptimizing] = useState(false);
    const [optimizedImages, setOptimizedImages] = useState<OptimizedImageSet | null>(null);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setOptimizedImages(null);
            setError(null);
        }
    };

    const handleOptimize = async () => {
        if (!selectedFile) return;

        setOptimizing(true); setProgress(0);
        setError(null);

        let progressInterval: NodeJS.Timeout | null = null;

        try {
            const formData = new FormData();
            formData.append('image', selectedFile);
            formData.append('quality', '85');
            formData.append('format', 'webp');

            // Simulate progress
            progressInterval = setInterval(() => {
                setProgress(prev => Math.min(prev + 10, 90));
            }, 200);

            const response = await fetch('/api/optimize-image', {
                method: 'POST',
                body: formData
            });

            if (progressInterval) {
                clearInterval(progressInterval);
                progressInterval = null;
            }
            setProgress(100);

            if (!response.ok) {
                throw new Error('Failed to optimize image');
            }

            const result = await response.json();
            setOptimizedImages(result.data);

        } catch (err) {
            if (progressInterval) {
                clearInterval(progressInterval);
                progressInterval = null;
            }
            setError(err instanceof Error ? err.message : 'Failed to optimize image');
        } finally {
            setOptimizing(false);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Image className="h-5 w-5" />
                        Image Optimization Demo
                    </CardTitle>
                    <CardDescription>
                        Test the advanced image optimization system with server-side and client-side components
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* File Upload */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="image-upload"
                        />
                        <label htmlFor="image-upload" className="cursor-pointer">
                            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-lg font-medium text-gray-700">
                                {selectedFile ? selectedFile.name : 'Select an image to optimize'}
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                                Supports JPEG, PNG, WebP formats
                            </p>
                        </label>
                    </div>

                    {/* File Info */}
                    {selectedFile && (
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <p className="font-medium">{selectedFile.name}</p>
                                <p className="text-sm text-gray-600">
                                    {formatFileSize(selectedFile.size)} • {selectedFile.type}
                                </p>
                            </div>
                            <Button
                                onClick={handleOptimize}
                                disabled={optimizing}
                                className="flex items-center gap-2"
                            >
                                {optimizing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Optimizing...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4" />
                                        Optimize
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    {/* Progress */}
                    {optimizing && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Processing image...</span>
                                <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                            <p className="text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Results */}
                    {optimizedImages && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Optimization Results</h3>

                            {/* Image Variants */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.entries(optimizedImages.variants).map(([variantName, variant]) => {
                                    if (!variant) return null;

                                    return (
                                        <Card key={variantName}>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm capitalize">{variantName}</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <AdvancedImageOptimization
                                                    src={variant.url}
                                                    alt={`${variantName} variant`}
                                                    width={200}
                                                    height={200}
                                                    className="w-full h-32 object-cover rounded"
                                                />
                                                <div className="mt-2 space-y-1 text-xs text-gray-600">
                                                    <p>{variant.width}×{variant.height}</p>
                                                    <p>{formatFileSize(variant.size)}</p>
                                                    <Badge variant="outline" className="text-xs">
                                                        {variant.format.toUpperCase()}
                                                    </Badge>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>

                            {/* Compression Stats */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm">Compression Summary</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-600">Original Size</p>
                                            <p className="font-semibold">{formatFileSize(optimizedImages.original.size)}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Optimized Size</p>
                                            <p className="font-semibold text-green-600">
                                                {formatFileSize(optimizedImages.variants.medium?.size || 0)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Compression</p>
                                            <p className="font-semibold text-blue-600">
                                                {Math.round(((optimizedImages.original.size - (optimizedImages.variants.medium?.size || 0)) / optimizedImages.original.size) * 100)}%
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Variants</p>
                                            <p className="font-semibold">{Object.keys(optimizedImages.variants).filter(k => optimizedImages.variants[k]).length}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
