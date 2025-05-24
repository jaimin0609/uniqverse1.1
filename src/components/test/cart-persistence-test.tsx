"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useServerSyncedCart } from "@/hooks/use-server-synced-cart";

/**
 * Test component for verifying cart persistence functionality
 * This component can be used to add test items to the cart and check if they persist
 * across sessions and browsers.
 */
export function CartPersistenceTest() {
  const { addItem, items, clearCart, syncCartWithServer } = useServerSyncedCart();
  const [isLoading, setIsLoading] = useState(false);
  const [cartId, setCartId] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  // Add a test product to the cart
  const handleAddTestItem = async () => {
    setIsLoading(true);
    try {
      // Add a test item to the cart
      const testItem = {
        id: `test-${Date.now()}`,
        productId: "test-product",
        name: "Test Product",
        price: 9.99,
        quantity: 1,
        image: "/images/placeholder-image.svg"
      };

      await addItem(testItem);
      await syncCartWithServer();
      
      const id = localStorage.getItem('uniqverse-cart-id');
      setCartId(id);
      setTestStatus("Item added to cart successfully!");
    } catch (error) {
      console.error("Error adding test item:", error);
      setTestStatus("Error adding item to cart");
    } finally {
      setIsLoading(false);
    }
  };

  // Load cart information from the server
  const handleLoadCartInfo = async () => {
    setIsLoading(true);
    try {
      const id = localStorage.getItem('uniqverse-cart-id');
      setCartId(id);
      
      await syncCartWithServer();
      setTestStatus("Cart loaded successfully!");
    } catch (error) {
      console.error("Error loading cart:", error);
      setTestStatus("Error loading cart");
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
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Cart Persistence Test</h2>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded">
          <h3 className="text-lg font-medium mb-2">Current Cart Status</h3>
          <p><strong>Cart ID:</strong> {cartId || "No cart ID found"}</p>
          <p><strong>Items in Cart:</strong> {items.length}</p>
          {items.length > 0 && (
            <ul className="mt-2 space-y-2">
              {items.map(item => (
                <li key={item.id} className="border-b pb-2">
                  {item.name} - Qty: {item.quantity} - ${item.price.toFixed(2)}
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleAddTestItem} disabled={isLoading}>
            {isLoading ? "Processing..." : "Add Test Item"}
          </Button>
          
          <Button onClick={handleLoadCartInfo} variant="outline" disabled={isLoading}>
            {isLoading ? "Loading..." : "Load Cart Info"}
          </Button>
          
          <Button onClick={handleClearCart} variant="destructive" disabled={isLoading}>
            {isLoading ? "Clearing..." : "Clear Cart"}
          </Button>
        </div>
        
        {testStatus && (
          <div className={`p-4 rounded ${testStatus.includes("Error") ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
            {testStatus}
          </div>
        )}
        
        <div className="mt-6 p-4 bg-blue-50 rounded text-sm">
          <h3 className="font-medium text-blue-800 mb-2">Testing Instructions:</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>Add a test item to your cart</li>
            <li>Note the Cart ID displayed above</li>
            <li>Close the browser or open a new private/incognito window</li>
            <li>Return to this page and click "Load Cart Info"</li>
            <li>Verify that your test item is still in the cart</li>
            <li>If using a different browser, make sure to use the same account or be logged in</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default CartPersistenceTest;
