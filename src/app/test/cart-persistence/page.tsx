"use client";

import CartPersistenceTest from "@/components/test/cart-persistence-test";

export default function TestCartPersistencePage() {
    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-6">Cart Persistence Testing</h1>
            <p className="mb-6 text-gray-600">
                This page allows you to test the cart persistence functionality to verify that it works
                across different sessions and browsers. The cart contents should be saved to the database
                and retrieved when the user returns to the site.
            </p>

            <CartPersistenceTest />
        </div>
    );
}
