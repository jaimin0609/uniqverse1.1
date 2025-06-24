"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useServerSyncedCart } from "@/hooks/use-server-synced-cart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Test component specifically for verifying cart item removal persistence
 */
export function CartRemovalTest() {
    const { addItem, items, removeItem, clearCart, syncCartWithServer, forceReloadFromServer } = useServerSyncedCart();
    const [isLoading, setIsLoading] = useState(false);
    const [testStatus, setTestStatus] = useState<string | null>(null);

    // Add a test product to the cart
    const handleAddTestItem = async () => {
        setIsLoading(true);
        try {
            const testItem = {
                id: `test-removal-${Date.now()}`,
                productId: "test-removal-product",
                slug: "test-removal-product",
                name: "Test Removal Product",
                price: 19.99,
                quantity: 1,
                image: "/images/placeholder-image.svg"
            };

            await addItem(testItem);
            setTestStatus("Test item added successfully!");
        } catch (error) {
            console.error("Error adding test item:", error);
            setTestStatus("Error adding test item");
        } finally {
            setIsLoading(false);
        }
    };

    // Remove the first item in the cart
    const handleRemoveFirstItem = async () => {
        if (items.length === 0) {
            setTestStatus("No items to remove");
            return;
        }

        setIsLoading(true);
        try {
            const firstItem = items[0];
            console.log("Removing item:", firstItem);

            await removeItem(firstItem.id, firstItem.variantId);
            setTestStatus(`Item "${firstItem.name}" removed successfully!`);
        } catch (error) {
            console.error("Error removing item:", error);
            setTestStatus("Error removing item");
        } finally {
            setIsLoading(false);
        }
    };

    // Force reload from server to test persistence
    const handleForceReload = async () => {
        setIsLoading(true);
        try {
            await forceReloadFromServer();
            setTestStatus("Cart reloaded from server!");
        } catch (error) {
            console.error("Error reloading cart:", error);
            setTestStatus("Error reloading cart from server");
        } finally {
            setIsLoading(false);
        }
    };

    // Clear the cart
    const handleClearCart = async () => {
        setIsLoading(true);
        try {
            await clearCart();
            setTestStatus("Cart cleared successfully!");
        } catch (error) {
            console.error("Error clearing cart:", error);
            setTestStatus("Error clearing cart");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Cart Removal Persistence Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Current Cart Status */}
                <div className="p-4 bg-gray-50 rounded">
                    <h3 className="text-lg font-medium mb-2">Current Cart Status</h3>
                    <p><strong>Items in Cart:</strong> {items.length}</p>
                    <p><strong>Cart ID:</strong> {localStorage.getItem('uniqverse-cart-id') || "No cart ID found"}</p>
                    {items.length > 0 && (
                        <div className="mt-2">
                            <strong>Items:</strong>
                            <ul className="mt-1 space-y-1">
                                {items.map((item, index) => (
                                    <li key={item.id} className="text-sm border-b pb-1">
                                        {index + 1}. {item.name} - ID: {item.id} - Qty: {item.quantity} - ${item.price.toFixed(2)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                    <Button onClick={handleAddTestItem} disabled={isLoading}>
                        {isLoading ? "Processing..." : "Add Test Item"}
                    </Button>

                    <Button
                        onClick={handleRemoveFirstItem}
                        variant="destructive"
                        disabled={isLoading || items.length === 0}
                    >
                        {isLoading ? "Removing..." : "Remove First Item"}
                    </Button>

                    <Button onClick={handleForceReload} variant="outline" disabled={isLoading}>
                        {isLoading ? "Loading..." : "Reload from Server"}
                    </Button>

                    <Button onClick={handleClearCart} variant="outline" disabled={isLoading}>
                        {isLoading ? "Clearing..." : "Clear All Items"}
                    </Button>
                </div>

                {/* Test Status */}
                {testStatus && (
                    <div className={`p-4 rounded ${testStatus.includes("Error") ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                        {testStatus}
                    </div>
                )}

                {/* Testing Instructions */}
                <div className="mt-6 p-4 bg-blue-50 rounded text-sm">
                    <h3 className="font-medium text-blue-800 mb-2">Testing Instructions for Cart Removal Bug:</h3>
                    <ol className="list-decimal list-inside space-y-2">
                        <li>Click "Add Test Item" to add an item to your cart</li>
                        <li>Click "Remove First Item" to remove the item</li>
                        <li>Verify the item is removed from the display above</li>
                        <li>Close the browser and reopen it (or refresh the page)</li>
                        <li>Return to this page and check if the item is still gone</li>
                        <li>You can also use "Reload from Server" to force a server sync without refreshing</li>
                    </ol>
                    <p className="mt-3 text-blue-700 font-medium">
                        <strong>Expected Result:</strong> After removing an item and refreshing/revisiting, the item should stay removed.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

export default CartRemovalTest;
