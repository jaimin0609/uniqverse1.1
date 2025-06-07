'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    RotateCcw,
    ZoomIn,
    ZoomOut,
    Download,
    Palette,
    Sun,
    Camera,
    MousePointer,
    Move3D,
    Settings,
    Eye
} from 'lucide-react';

interface Product3DPreviewProps {
    designData?: any;
    productType?: 'tshirt' | 'mug' | 'hoodie' | 'poster';
    onScreenshot?: (dataUrl: string) => void;
    enableOrbitControls?: boolean;
    enablePhysics?: boolean;
    quality?: 'low' | 'medium' | 'high';
    onReady?: (preview3D: any) => void;
    syncEnabled?: boolean;
}

interface MouseState {
    isDown: boolean;
    lastX: number;
    lastY: number;
}

export default function Product3DPreview({
    designData,
    productType = 'tshirt',
    onScreenshot,
    enableOrbitControls = true,
    enablePhysics = false,
    quality = 'medium',
    onReady,
    syncEnabled = true
}: Product3DPreviewProps) {
    const mountRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const productMeshRef = useRef<THREE.Mesh | null>(null);
    const animationIdRef = useRef<number | null>(null);
    const mouseStateRef = useRef<MouseState>({ isDown: false, lastX: 0, lastY: 0 }); const [isLoading, setIsLoading] = useState(true);
    const [rotationSpeed, setRotationSpeed] = useState(1);
    const [lighting, setLighting] = useState(5);
    const [productColor, setProductColor] = useState('#ffffff');
    const [cameraDistance, setCameraDistance] = useState(5);
    const [autoRotate, setAutoRotate] = useState(true);
    const [renderQuality, setRenderQuality] = useState<'low' | 'medium' | 'high'>(quality);
    const [materialType, setMaterialType] = useState<'basic' | 'standard' | 'physical'>('standard');
    const [environmentMap, setEnvironmentMap] = useState<string>('studio'); const [showWireframe, setShowWireframe] = useState(false);

    // Enhanced material creation function
    const createEnhancedMaterial = useCallback((color: string) => {
        const hexColor = parseInt(color.replace('#', '0x'));

        switch (materialType) {
            case 'physical':
                return new THREE.MeshPhysicalMaterial({
                    color: hexColor,
                    metalness: productType === 'mug' ? 0.1 : 0.0,
                    roughness: productType === 'tshirt' || productType === 'hoodie' ? 0.8 : 0.4,
                    clearcoat: productType === 'mug' ? 0.1 : 0.0,
                    side: THREE.DoubleSide,
                    wireframe: showWireframe
                });

            case 'standard':
                return new THREE.MeshStandardMaterial({
                    color: hexColor,
                    metalness: productType === 'mug' ? 0.1 : 0.0,
                    roughness: productType === 'tshirt' || productType === 'hoodie' ? 0.9 : 0.5,
                    side: THREE.DoubleSide,
                    wireframe: showWireframe
                });

            case 'basic':
            default:
                return new THREE.MeshLambertMaterial({
                    color: hexColor,
                    side: THREE.DoubleSide,
                    wireframe: showWireframe
                });
        }
    }, [materialType, productType, showWireframe]);

    // Enhanced screenshot function with quality options
    const takeEnhancedScreenshot = useCallback((quality: 'low' | 'medium' | 'high' = 'medium') => {
        if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

        const originalPixelRatio = rendererRef.current.getPixelRatio();
        const qualityMultiplier = quality === 'high' ? 2 : quality === 'medium' ? 1.5 : 1;

        // Temporarily increase quality for screenshot
        rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio * qualityMultiplier, 3));
        rendererRef.current.render(sceneRef.current, cameraRef.current);

        const dataUrl = rendererRef.current.domElement.toDataURL('image/png');

        // Restore original quality
        rendererRef.current.setPixelRatio(originalPixelRatio);

        if (onScreenshot) {
            onScreenshot(dataUrl);
        }

        return dataUrl;
    }, [onScreenshot]);

    const downloadScreenshot = useCallback((quality: 'low' | 'medium' | 'high' = 'high') => {
        const dataUrl = takeEnhancedScreenshot(quality);
        if (dataUrl) {
            const link = document.createElement('a');
            link.download = `3d-preview-${productType}-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
        }
    }, [takeEnhancedScreenshot, productType]);

    // Enhanced lighting setup function
    const setupLighting = useCallback((scene: THREE.Scene) => {
        // Clear existing lights
        const lights = scene.children.filter(child => child instanceof THREE.Light);
        lights.forEach(light => scene.remove(light));

        switch (environmentMap) {
            case 'studio':
                // Studio lighting setup
                const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
                scene.add(ambientLight);

                const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
                keyLight.position.set(5, 5, 5);
                keyLight.castShadow = true;
                keyLight.shadow.mapSize.width = 2048;
                keyLight.shadow.mapSize.height = 2048;
                scene.add(keyLight);

                const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
                fillLight.position.set(-5, 3, 5);
                scene.add(fillLight);

                const rimLight = new THREE.DirectionalLight(0xffffff, 0.2);
                rimLight.position.set(0, -5, -5);
                scene.add(rimLight);
                break;

            case 'outdoor':
                // Outdoor lighting setup
                const skyLight = new THREE.AmbientLight(0x87CEEB, 0.6);
                scene.add(skyLight);

                const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
                sunLight.position.set(10, 10, 5);
                sunLight.castShadow = true;
                scene.add(sunLight);
                break;

            case 'dramatic':
                // Dramatic lighting setup
                const lowAmbient = new THREE.AmbientLight(0x404040, 0.2);
                scene.add(lowAmbient);

                const dramaticLight = new THREE.SpotLight(0xffffff, 1.0);
                dramaticLight.position.set(0, 10, 0);
                dramaticLight.angle = Math.PI / 6;
                dramaticLight.castShadow = true;
                scene.add(dramaticLight);
                break;

            default:
                // Default studio lighting
                const defaultAmbient = new THREE.AmbientLight(0x404040, 0.4);
                scene.add(defaultAmbient);

                const defaultDirectional = new THREE.DirectionalLight(0xffffff, 0.8);
                defaultDirectional.position.set(5, 5, 5);
                defaultDirectional.castShadow = true;
                scene.add(defaultDirectional);
        }
    }, [environmentMap]);

    // Mouse controls setup function
    const setupMouseControls = useCallback((canvas: HTMLCanvasElement) => {
        const handleMouseDown = (event: MouseEvent) => {
            mouseStateRef.current.isDown = true;
            mouseStateRef.current.lastX = event.clientX;
            mouseStateRef.current.lastY = event.clientY;
            setAutoRotate(false);
        };

        const handleMouseMove = (event: MouseEvent) => {
            if (!mouseStateRef.current.isDown || !productMeshRef.current) return;

            const deltaX = event.clientX - mouseStateRef.current.lastX;
            const deltaY = event.clientY - mouseStateRef.current.lastY;

            productMeshRef.current.rotation.y += deltaX * 0.01;
            productMeshRef.current.rotation.x += deltaY * 0.01;

            mouseStateRef.current.lastX = event.clientX;
            mouseStateRef.current.lastY = event.clientY;
        };

        const handleMouseUp = () => {
            mouseStateRef.current.isDown = false;
        };

        const handleWheel = (event: WheelEvent) => {
            event.preventDefault();
            if (!cameraRef.current) return;

            const delta = event.deltaY > 0 ? 1.1 : 0.9;
            cameraRef.current.position.multiplyScalar(delta);            // Update camera distance slider to reflect the change
            const newDistance = cameraRef.current.position.length();
            setCameraDistance(Math.max(2, Math.min(10, newDistance)));
        };

        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('wheel', handleWheel);

        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('wheel', handleWheel);
        };
    }, []);

    useEffect(() => {
        if (!mountRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);
        sceneRef.current = scene;

        // Camera setup
        const camera = new THREE.PerspectiveCamera(
            75,
            mountRef.current.clientWidth / mountRef.current.clientHeight,
            0.1,
            1000
        );
        camera.position.set(0, 0, 5);
        cameraRef.current = camera;        // Renderer setup with enhanced quality settings
        const getRendererConfig = () => {
            const baseConfig = {
                antialias: true,
                preserveDrawingBuffer: true,
                alpha: true,
                powerPreference: 'high-performance' as WebGLPowerPreference
            };

            switch (renderQuality) {
                case 'high':
                    return { ...baseConfig, antialias: true };
                case 'low':
                    return { ...baseConfig, antialias: false };
                default:
                    return baseConfig;
            }
        };

        const renderer = new THREE.WebGLRenderer(getRendererConfig());
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, renderQuality === 'high' ? 2 : 1));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
        mountRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Enhanced lighting setup
        setupLighting(scene);

        // Create product mesh based on type
        createProductMesh(productType, scene);

        // Setup mouse controls
        if (enableOrbitControls) {
            setupMouseControls(renderer.domElement);
        }

        // Animation loop
        const animate = () => {
            animationIdRef.current = requestAnimationFrame(animate); if (productMeshRef.current && autoRotate) {
                productMeshRef.current.rotation.y += 0.01 * rotationSpeed;
            }

            renderer.render(scene, camera);
        };

        animate();
        setIsLoading(false);        // Handle resize
        const handleResize = () => {
            if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;

            const width = mountRef.current.clientWidth;
            const height = mountRef.current.clientHeight;

            cameraRef.current.aspect = width / height;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(width, height);
        };

        window.addEventListener('resize', handleResize); return () => {
            if (animationIdRef.current !== null) {
                cancelAnimationFrame(animationIdRef.current);
            }
            window.removeEventListener('resize', handleResize);
            if (mountRef.current && rendererRef.current?.domElement) {
                mountRef.current.removeChild(rendererRef.current.domElement);
            }
            rendererRef.current?.dispose();
        };
    }, [productType, renderQuality, enableOrbitControls, setupLighting, setupMouseControls]);    // Update camera distance
    useEffect(() => {
        if (cameraRef.current) {
            cameraRef.current.position.z = cameraDistance;
        }
    }, [cameraDistance]);

    // Update lighting
    useEffect(() => {
        if (sceneRef.current) {
            const lights = sceneRef.current.children.filter(child =>
                child instanceof THREE.DirectionalLight || child instanceof THREE.PointLight
            ) as THREE.Light[]; lights.forEach(light => {
                light.intensity = lighting / 5;
            });
        }
    }, [lighting]);    // Update product color and material properties
    useEffect(() => {
        if (productMeshRef.current && productMeshRef.current.material) {
            const material = productMeshRef.current.material as THREE.Material;
            const hexColor = parseInt(productColor.replace('#', '0x'));

            if ('color' in material) {
                (material as any).color.setHex(hexColor);
            }
        }
    }, [productColor]);

    // Update material type
    useEffect(() => {
        if (productMeshRef.current && sceneRef.current) {
            const newMaterial = createEnhancedMaterial(productColor);

            // Preserve any existing texture
            const oldMaterial = productMeshRef.current.material;
            if (oldMaterial && 'map' in oldMaterial && (oldMaterial as any).map) {
                if ('map' in newMaterial) {
                    (newMaterial as any).map = (oldMaterial as any).map;
                }
            }

            productMeshRef.current.material = newMaterial;

            // Dispose old material
            if (oldMaterial && 'dispose' in oldMaterial) {
                (oldMaterial as any).dispose();
            }
        }
    }, [materialType, showWireframe, createEnhancedMaterial, productColor]);

    // Update environment lighting
    useEffect(() => {
        if (sceneRef.current) {
            setupLighting(sceneRef.current);
        }
    }, [environmentMap, setupLighting]);

    const createProductMesh = useCallback((type: string, scene: THREE.Scene) => {
        try {
            let geometry: THREE.BufferGeometry;

            switch (type) {
                case 'tshirt':
                    // Create a simplified T-shirt shape
                    geometry = createTShirtGeometry();
                    break;
                case 'mug':
                    geometry = new THREE.CylinderGeometry(1, 1, 2, 32);
                    break;
                case 'hoodie':
                    geometry = createHoodieGeometry();
                    break;
                case 'poster':
                    geometry = new THREE.PlaneGeometry(3, 4);
                    break;
                default:
                    geometry = new THREE.BoxGeometry(2, 2, 2);
            }            const material = createEnhancedMaterial(productColor);

            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            productMeshRef.current = mesh;
            scene.add(mesh);

            // Add design texture if available
            if (designData) {
                applyDesignTexture(mesh, designData);
            }
        } catch (error) {
            console.error('Error creating product mesh:', error);
            // Create a fallback box geometry
            const fallbackGeometry = new THREE.BoxGeometry(2, 2, 2);
            const fallbackMaterial = createEnhancedMaterial(productColor);
            const fallbackMesh = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
            productMeshRef.current = fallbackMesh;
            scene.add(fallbackMesh);
        }
    }, [productColor, createEnhancedMaterial, designData]);

    const createTShirtGeometry = (): THREE.BufferGeometry => {
        const shape = new THREE.Shape();

        // T-shirt outline (simplified)
        shape.moveTo(-1.5, 1);
        shape.lineTo(-1.5, 0.5);
        shape.lineTo(-2, 0.5);
        shape.lineTo(-2, -0.5);
        shape.lineTo(-1.5, -0.5);
        shape.lineTo(-1.5, -2);
        shape.lineTo(1.5, -2);
        shape.lineTo(1.5, -0.5);
        shape.lineTo(2, -0.5);
        shape.lineTo(2, 0.5);
        shape.lineTo(1.5, 0.5);
        shape.lineTo(1.5, 1);
        shape.lineTo(-1.5, 1);

        const geometry = new THREE.ExtrudeGeometry(shape, {
            depth: 0.1,
            bevelEnabled: false
        });

        return geometry;
    };

    const createHoodieGeometry = (): THREE.BufferGeometry => {
        const shape = new THREE.Shape();

        // Hoodie outline (simplified)
        shape.moveTo(-1.5, 1.5);
        shape.lineTo(-1.5, 0.5);
        shape.lineTo(-2.2, 0.5);
        shape.lineTo(-2.2, -0.5);
        shape.lineTo(-1.5, -0.5);
        shape.lineTo(-1.5, -2.5);
        shape.lineTo(1.5, -2.5);
        shape.lineTo(1.5, -0.5);
        shape.lineTo(2.2, -0.5);
        shape.lineTo(2.2, 0.5);
        shape.lineTo(1.5, 0.5);
        shape.lineTo(1.5, 1.5);
        shape.lineTo(0.5, 2);
        shape.lineTo(-0.5, 2);
        shape.lineTo(-1.5, 1.5);

        const geometry = new THREE.ExtrudeGeometry(shape, {
            depth: 0.15,
            bevelEnabled: false
        });

        return geometry;
    }; const applyDesignTexture = useCallback((mesh: THREE.Mesh, design: any) => {
        try {
            // Create a canvas to render the design
            const canvas = document.createElement('canvas');
            const resolution = renderQuality === 'high' ? 1024 : renderQuality === 'medium' ? 512 : 256;
            canvas.width = resolution;
            canvas.height = resolution;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                console.warn('Could not get canvas context for texture');
                return;
            }

            // Enhanced design rendering
            if (design && typeof design === 'object') {
                // If it's a Fabric.js canvas data
                if (design.objects && Array.isArray(design.objects)) {
                    // Fill background
                    ctx.fillStyle = design.background || '#ffffff';
                    ctx.fillRect(0, 0, resolution, resolution);

                    // Render each object (simplified version)
                    design.objects.forEach((obj: any) => {
                        if (obj.type === 'text' && obj.text) {
                            ctx.fillStyle = obj.fill || '#000000';
                            ctx.font = `${obj.fontSize || 20}px ${obj.fontFamily || 'Arial'}`;
                            ctx.fillText(obj.text, obj.left || 50, obj.top || 100);
                        } else if (obj.type === 'rect') {
                            ctx.fillStyle = obj.fill || '#000000';
                            ctx.fillRect(obj.left || 0, obj.top || 0, obj.width || 100, obj.height || 100);
                        }
                    });
                } else if (design.dataURL) {
                    // If it's a data URL
                    const img = new Image();
                    img.onload = () => {
                        ctx.clearRect(0, 0, resolution, resolution);
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, resolution, resolution);
                        ctx.drawImage(img, 0, 0, resolution, resolution);
                        updateMeshTexture(mesh, canvas);
                    };
                    img.src = design.dataURL;
                    return; // Early return since we'll update texture in onload
                } else {
                    // Default design rendering
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, resolution, resolution);
                    ctx.fillStyle = '#000000';
                    ctx.font = `${Math.floor(resolution / 16)}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.fillText('Custom Design', resolution / 2, resolution / 2);
                }
            } else {
                // Fallback design
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, resolution, resolution);
                ctx.fillStyle = '#000000';
                ctx.font = `${Math.floor(resolution / 16)}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillText('Custom Design', resolution / 2, resolution / 2);
            }

            updateMeshTexture(mesh, canvas);
        } catch (error) {
            console.error('Error applying design texture:', error);
        }
    }, [renderQuality]); const updateMeshTexture = (mesh: THREE.Mesh, canvas: HTMLCanvasElement) => {
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        // Apply texture to material
        const material = mesh.material;
        if (material && 'map' in material) {
            // Dispose old texture
            if ((material as any).map) {
                (material as any).map.dispose();
            }

            (material as any).map = texture;
            (material as any).needsUpdate = true;
        }
    }; const resetCamera = () => {
        if (cameraRef.current) {
            cameraRef.current.position.set(0, 0, 5);
            setCameraDistance(5);
        }
    }; const takeScreenshot = () => {
        if (rendererRef.current && onScreenshot) {
            const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
            onScreenshot(dataUrl);
        }
    };

    // Update texture from external source (for real-time sync)
    const updateTextureFromDataURL = useCallback((dataURL: string, areaId?: string) => {
        if (!productMeshRef.current) return;

        const img = new Image();
        img.onload = () => {
            // Create canvas from image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            updateMeshTexture(productMeshRef.current!, canvas);
        };
        img.src = dataURL;
    }, []);

    // Update texture from THREE.js texture (for real-time sync)
    const updateTextureFromThreeTexture = useCallback((texture: THREE.Texture, areaId?: string) => {
        if (!productMeshRef.current) return;

        const material = productMeshRef.current.material;
        if (material && 'map' in material) {
            // Dispose old texture
            if ((material as any).map) {
                (material as any).map.dispose();
            }

            (material as any).map = texture;
            (material as any).needsUpdate = true;
        }
    }, []);

    // Get current mesh for external access
    const getCurrentMesh = useCallback(() => {
        return productMeshRef.current;
    }, []);

    // Performance optimization: Update design texture when designData changes
    useEffect(() => {
        if (productMeshRef.current && designData) {
            applyDesignTexture(productMeshRef.current, designData);
        }
    }, [designData, applyDesignTexture]);

    // Performance optimization: Adjust render quality based on performance
    const optimizePerformance = useCallback(() => {
        if (!rendererRef.current) return;

        const canvas = rendererRef.current.domElement;
        const context = rendererRef.current.getContext();

        // Monitor performance and adjust quality if needed
        if (context && 'getParameter' in context) {
            const debugInfo = rendererRef.current.info;
            if (debugInfo.render.calls > 100) {
                console.log('High render calls detected, consider optimizing');
            }
        }
    }, []);    // Utility function to export 3D model data
    const exportModelData = useCallback(() => {
        if (!productMeshRef.current) return null;

        const modelData = {
            productType,
            color: productColor,
            materialType,
            environmentMap,
            position: productMeshRef.current.position.toArray(),
            rotation: productMeshRef.current.rotation.toArray(),
            scale: productMeshRef.current.scale.toArray(),
            timestamp: new Date().toISOString()
        };

        return modelData;
    }, [productType, productColor, materialType, environmentMap]);

    // Get 3D preview API object for external access
    const get3DPreviewAPI = useCallback(() => {
        return {
            mesh: productMeshRef.current,
            scene: sceneRef.current,
            camera: cameraRef.current,
            renderer: rendererRef.current,
            updateTextureFromDataURL,
            updateTextureFromThreeTexture,
            getCurrentMesh,
            takeScreenshot: takeEnhancedScreenshot,
            exportModelData,
            // Legacy method names for compatibility
            updateTexture: updateTextureFromThreeTexture,
            productMesh: productMeshRef.current
        };
    }, [updateTextureFromDataURL, updateTextureFromThreeTexture, getCurrentMesh, takeEnhancedScreenshot, exportModelData]);

    // Expose API to parent component
    useEffect(() => {
        if (onReady && !isLoading) {
            const api = get3DPreviewAPI();
            onReady(api);
        }
    }, [onReady, isLoading, get3DPreviewAPI]);

    return (
        <div className="w-full space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        3D Product Preview
                        <Badge variant="secondary">{productType.toUpperCase()}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative">
                        <div
                            ref={mountRef}
                            className="w-full h-[400px] border border-gray-200 rounded-lg bg-gray-50"
                        />
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="mt-2 text-sm text-gray-600">Loading 3D preview...</p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>            {/* Enhanced 3D Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Camera Controls */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center">
                            <Move3D className="h-4 w-4 mr-2" />
                            Camera Controls
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>                            <label className="text-sm font-medium">Zoom</label>
                            <Slider
                                value={[cameraDistance]}
                                onValueChange={(value) => setCameraDistance(value[0])}
                                min={2}
                                max={10}
                                step={0.1}
                                className="mt-2"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>Close</span>
                                <span>Far</span>
                            </div>
                        </div>
                        <div>                            <label className="text-sm font-medium">Rotation Speed</label>
                            <Slider
                                value={[rotationSpeed]}
                                onValueChange={(value) => setRotationSpeed(value[0])}
                                min={0}
                                max={3}
                                step={0.1}
                                className="mt-2"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>Slow</span>
                                <span>Fast</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Auto Rotate</label>
                            <Button
                                variant={autoRotate ? "default" : "outline"}
                                size="sm"
                                onClick={() => setAutoRotate(!autoRotate)}
                            >
                                {autoRotate ? "On" : "Off"}
                            </Button>
                        </div>
                        <Button onClick={resetCamera} variant="outline" className="w-full">
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reset Camera
                        </Button>
                    </CardContent>
                </Card>

                {/* Appearance Controls */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center">
                            <Palette className="h-4 w-4 mr-2" />
                            Appearance
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Product Color</label>
                            <div className="flex items-center gap-2 mt-2">
                                <input
                                    type="color"
                                    value={productColor}
                                    onChange={(e) => setProductColor(e.target.value)}
                                    className="w-8 h-8 border rounded cursor-pointer"
                                />
                                <span className="text-sm">{productColor}</span>
                            </div>
                        </div>
                        <div>                            <label className="text-sm font-medium">Lighting</label>
                            <Slider
                                value={[lighting]}
                                onValueChange={(value) => setLighting(value[0])}
                                min={1}
                                max={10}
                                step={0.5}
                                className="mt-2"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>Dim</span>
                                <span>Bright</span>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Environment</label>
                            <select
                                value={environmentMap}
                                onChange={(e) => setEnvironmentMap(e.target.value)}
                                className="w-full mt-2 p-2 border rounded text-sm"
                            >
                                <option value="studio">Studio</option>
                                <option value="outdoor">Outdoor</option>
                                <option value="dramatic">Dramatic</option>
                            </select>
                        </div>                        <div className="space-y-2">
                            <Button onClick={() => downloadScreenshot('high')} variant="outline" className="w-full">
                                <Camera className="h-4 w-4 mr-2" />
                                Download HD Screenshot
                            </Button>
                            <div className="grid grid-cols-2 gap-2">
                                <Button onClick={() => downloadScreenshot('medium')} variant="outline" size="sm">
                                    Medium
                                </Button>
                                <Button onClick={() => downloadScreenshot('low')} variant="outline" size="sm">
                                    Low
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Advanced Controls */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center">
                            <Settings className="h-4 w-4 mr-2" />
                            Advanced
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Material Type</label>
                            <select
                                value={materialType}
                                onChange={(e) => setMaterialType(e.target.value as 'basic' | 'standard' | 'physical')}
                                className="w-full mt-2 p-2 border rounded text-sm"
                            >
                                <option value="basic">Basic</option>
                                <option value="standard">Standard</option>
                                <option value="physical">Physical</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Render Quality</label>
                            <select
                                value={renderQuality}
                                onChange={(e) => setRenderQuality(e.target.value as 'low' | 'medium' | 'high')}
                                className="w-full mt-2 p-2 border rounded text-sm"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Wireframe</label>
                            <Button
                                variant={showWireframe ? "default" : "outline"}
                                size="sm"
                                onClick={() => setShowWireframe(!showWireframe)}
                            >
                                {showWireframe ? "On" : "Off"}
                            </Button>
                        </div>
                        {enableOrbitControls && (
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <MousePointer className="h-3 w-3" />
                                <span>Click & drag to rotate</span>
                            </div>
                        )}
                    </CardContent>                </Card>
            </div>

            {/* Product Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Product Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="font-medium">Type:</span>
                            <p className="text-gray-600">{productType}</p>
                        </div>
                        <div>
                            <span className="font-medium">Material:</span>
                            <p className="text-gray-600">
                                {productType === 'tshirt' || productType === 'hoodie' ? 'Cotton' :
                                    productType === 'mug' ? 'Ceramic' : 'Paper'}
                            </p>
                        </div>
                        <div>
                            <span className="font-medium">Color:</span>
                            <p className="text-gray-600">{productColor}</p>
                        </div>
                        <div>
                            <span className="font-medium">Rendering:</span>
                            <p className="text-gray-600">WebGL</p>
                        </div>
                    </div>                </CardContent>
            </Card>

            {/* Debug & Export Panel */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm flex items-center">
                        <Eye className="h-4 w-4 mr-2" />
                        Advanced Tools
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Button
                                onClick={() => {
                                    const data = exportModelData();
                                    if (data) {
                                        console.log('3D Model Data:', data);
                                        navigator.clipboard.writeText(JSON.stringify(data, null, 2))
                                            .then(() => alert('Model data copied to clipboard!'))
                                            .catch(() => console.log('Could not copy to clipboard'));
                                    }
                                }}
                                variant="outline"
                                className="w-full"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export Data
                            </Button>
                        </div>
                        <div>
                            <Button
                                onClick={optimizePerformance}
                                variant="outline"
                                className="w-full"
                            >
                                <Settings className="h-4 w-4 mr-2" />
                                Optimize
                            </Button>
                        </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-4 text-xs text-gray-500">
                        <div>
                            <span className="font-medium">Material:</span>
                            <p>{materialType}</p>
                        </div>
                        <div>
                            <span className="font-medium">Quality:</span>
                            <p>{renderQuality}</p>
                        </div>
                        <div>
                            <span className="font-medium">Controls:</span>
                            <p>{enableOrbitControls ? 'Interactive' : 'Auto'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
