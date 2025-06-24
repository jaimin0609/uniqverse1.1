"use client";

import CartRemovalTest from "@/components/test/cart-removal-test";

export default function TestCartRemovalPage() {
    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-6 text-center">Cart Removal Bug Testing</h1>
            <p className="mb-6 text-gray-600 text-center max-w-2xl mx-auto">
                This page allows you to test the cart item removal persistence fix.
                Use this to verify that removed items don't reappear when you revisit the website.
            </p>

            <CartRemovalTest />
        </div>
    );
}
