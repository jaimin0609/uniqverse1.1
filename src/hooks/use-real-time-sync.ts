'use client';

import { useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';

interface DesignChange {
    type: 'canvas-update' | 'object-added' | 'object-removed' | 'object-modified';
    data: any;
    timestamp: number;
    areaId?: string;
}

interface SyncOptions {
    throttleMs?: number;
    enableTextureSync?: boolean;
    enable3DUpdate?: boolean;
    debugMode?: boolean;
}

export function useRealTimeSync(options: SyncOptions = {}) {
    const {
        throttleMs = 100,
        enableTextureSync = true,
        enable3DUpdate = true,
        debugMode = false
    } = options;

    const lastUpdateRef = useRef<number>(0);
    const pendingUpdateRef = useRef<DesignChange | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Canvas-to-texture conversion utility
    const generateTextureFromCanvas = useCallback((fabricCanvas: any, area?: any) => {
        if (!fabricCanvas || !enableTextureSync) return null;

        try {
            // Create a temporary canvas for the specific area or full canvas
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');

            if (!tempCtx) return null;

            // Set canvas size based on area or use full canvas
            const width = area?.width || fabricCanvas.width;
            const height = area?.height || fabricCanvas.height;
            tempCanvas.width = width;
            tempCanvas.height = height;

            // Fill with white background
            tempCtx.fillStyle = '#ffffff';
            tempCtx.fillRect(0, 0, width, height);

            // Get the design data
            const canvasDataURL = fabricCanvas.toDataURL({
                format: 'png',
                quality: 1,
                left: area?.x || 0,
                top: area?.y || 0,
                width: width,
                height: height,
                multiplier: 2 // Higher resolution for better 3D texture quality
            });

            if (debugMode) {
                console.log('Generated texture from canvas:', {
                    size: `${width}x${height}`,
                    area: area,
                    dataURL: canvasDataURL.substring(0, 100) + '...'
                });
            }

            return canvasDataURL;
        } catch (error) {
            console.error('Failed to generate texture from canvas:', error);
            return null;
        }
    }, [enableTextureSync, debugMode]);

    // Create THREE.js texture from data URL
    const createThreeTexture = useCallback((dataURL: string) => {
        return new Promise<THREE.Texture>((resolve, reject) => {
            const loader = new THREE.TextureLoader();
            loader.load(
                dataURL,
                (texture) => {
                    // Configure texture for optimal 3D rendering
                    texture.wrapS = THREE.ClampToEdgeWrapping;
                    texture.wrapT = THREE.ClampToEdgeWrapping;
                    texture.minFilter = THREE.LinearFilter;
                    texture.magFilter = THREE.LinearFilter;
                    texture.flipY = false; // Fabric.js canvas needs this for proper orientation
                    texture.needsUpdate = true;

                    if (debugMode) {
                        console.log('Created THREE.js texture:', texture);
                    }

                    resolve(texture);
                },
                undefined,
                (error) => {
                    console.error('Failed to load texture:', error);
                    reject(error);
                }
            );
        });
    }, [debugMode]);

    // Throttled update function
    const throttledUpdate = useCallback((change: DesignChange, callback: (change: DesignChange) => void) => {
        const now = Date.now();
        pendingUpdateRef.current = change;

        if (now - lastUpdateRef.current < throttleMs) {
            // Clear existing timeout and set a new one
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                if (pendingUpdateRef.current) {
                    callback(pendingUpdateRef.current);
                    lastUpdateRef.current = Date.now();
                    pendingUpdateRef.current = null;
                }
            }, throttleMs);
        } else {
            // Execute immediately
            callback(change);
            lastUpdateRef.current = now;
        }
    }, [throttleMs]);

    // Main sync function
    const syncCanvasTo3D = useCallback(async (
        fabricCanvas: any,
        productMesh: THREE.Mesh | null,
        customizationAreas: any[] = [],
        onTextureUpdate?: (texture: THREE.Texture, areaId?: string) => void
    ) => {
        if (!fabricCanvas || !productMesh || !enable3DUpdate) return;

        try {
            if (customizationAreas.length > 0) {
                // Sync each customization area separately
                for (const area of customizationAreas) {
                    const textureDataURL = generateTextureFromCanvas(fabricCanvas, area);
                    if (textureDataURL) {
                        const texture = await createThreeTexture(textureDataURL);
                        onTextureUpdate?.(texture, area.id);
                    }
                }
            } else {
                // Sync entire canvas as single texture
                const textureDataURL = generateTextureFromCanvas(fabricCanvas);
                if (textureDataURL) {
                    const texture = await createThreeTexture(textureDataURL);

                    // Apply texture to product mesh
                    if (productMesh.material instanceof THREE.Material) {
                        if ('map' in productMesh.material) {
                            (productMesh.material as any).map = texture;
                            productMesh.material.needsUpdate = true;
                        }
                    }

                    onTextureUpdate?.(texture);
                }
            }

            if (debugMode) {
                console.log('Sync completed for', customizationAreas.length || 1, 'areas');
            }
        } catch (error) {
            console.error('Failed to sync canvas to 3D:', error);
        }
    }, [generateTextureFromCanvas, createThreeTexture, enable3DUpdate, debugMode]);

    // Setup canvas event listeners
    const setupCanvasListeners = useCallback((
        fabricCanvas: any,
        onDesignChange: (change: DesignChange) => void
    ) => {
        if (!fabricCanvas) return () => { };

        const handleCanvasChange = (eventType: string, eventData?: any) => {
            const change: DesignChange = {
                type: eventType as any,
                data: eventData,
                timestamp: Date.now()
            };

            throttledUpdate(change, onDesignChange);
        };

        // Fabric.js event listeners
        const events = {
            'object:added': (e: any) => handleCanvasChange('object-added', e.target),
            'object:removed': (e: any) => handleCanvasChange('object-removed', e.target),
            'object:modified': (e: any) => handleCanvasChange('object-modified', e.target),
            'path:created': (e: any) => handleCanvasChange('object-added', e.path),
            'after:render': () => handleCanvasChange('canvas-update', fabricCanvas.toJSON())
        };

        // Add event listeners
        Object.entries(events).forEach(([event, handler]) => {
            fabricCanvas.on(event, handler);
        });

        if (debugMode) {
            console.log('Canvas listeners setup complete');
        }

        // Cleanup function
        return () => {
            Object.entries(events).forEach(([event, handler]) => {
                fabricCanvas.off(event, handler);
            });

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [throttledUpdate, debugMode]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return {
        syncCanvasTo3D,
        setupCanvasListeners,
        generateTextureFromCanvas,
        createThreeTexture,
        throttledUpdate
    };
}

export default useRealTimeSync;
