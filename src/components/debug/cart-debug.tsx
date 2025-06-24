"use client";

import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cart';
import { useServerSyncedCart } from '@/hooks/use-server-synced-cart';

export function CartDebug() {
    const [isVisible, setIsVisible] = useState(false);
    const [serverCart, setServerCart] = useState<any>(null);
    const [lastSync, setLastSync] = useState<string>('Never');
    const { items: localItems } = useCartStore();
    const { syncCartWithServer, forceReloadFromServer } = useServerSyncedCart();

    // Fetch server cart for comparison
    const fetchServerCart = async () => {
        try {
            const cartId = localStorage.getItem('uniqverse-cart-id');
            const url = cartId ? `/api/cart?cartId=${cartId}&_t=${Date.now()}` : `/api/cart?_t=${Date.now()}`;

            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setServerCart(data);
            }
        } catch (error) {
            console.error('Error fetching server cart:', error);
        }
    };

    const handleSync = async () => {
        try {
            await syncCartWithServer();
            setLastSync(new Date().toLocaleTimeString());
            await fetchServerCart();
        } catch (error) {
            console.error('Sync failed:', error);
        }
    };

    const handleForceReload = async () => {
        try {
            await forceReloadFromServer();
            setLastSync(new Date().toLocaleTimeString() + ' (force reload)');
            await fetchServerCart();
        } catch (error) {
            console.error('Force reload failed:', error);
        }
    };

    useEffect(() => {
        if (isVisible) {
            fetchServerCart();
        }
    }, [isVisible]);

    // Only show in development
    if (process.env.NODE_ENV !== 'development') {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <button
                onClick={() => setIsVisible(!isVisible)}
                className="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm shadow-lg hover:bg-gray-700"
            >
                🛒 Debug Cart
            </button>

            {isVisible && (
                <div className="absolute bottom-12 right-0 bg-white border shadow-xl rounded-lg p-4 w-96 max-h-96 overflow-y-auto">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold">Cart Debug</h3>
                        <button
                            onClick={() => setIsVisible(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="space-y-3 text-sm">
                        <div>
                            <strong>Local Cart ({localItems.length} items):</strong>
                            <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                                {JSON.stringify(localItems.map(item => ({
                                    id: item.id,
                                    productId: item.productId,
                                    variantId: item.variantId,
                                    name: item.name,
                                    quantity: item.quantity
                                })), null, 2)}
                            </pre>
                        </div>

                        <div>
                            <strong>Server Cart ({serverCart?.items?.length || 0} items):</strong>
                            <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                                {JSON.stringify(serverCart?.items?.map((item: any) => ({
                                    id: item.id,
                                    productId: item.productId,
                                    variantId: item.variantId,
                                    name: item.name,
                                    quantity: item.quantity
                                })) || [], null, 2)}
                            </pre>
                        </div>

                        <div>
                            <strong>Cart ID:</strong> {localStorage.getItem('uniqverse-cart-id') || 'None'}
                        </div>

                        <div>
                            <strong>Last Sync:</strong> {lastSync}
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleSync}
                                className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                            >
                                Sync to Server
                            </button>
                            <button
                                onClick={handleForceReload}
                                className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                            >
                                Reload from Server
                            </button>
                            <button
                                onClick={fetchServerCart}
                                className="bg-purple-500 text-white px-2 py-1 rounded text-xs hover:bg-purple-600"
                            >
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
