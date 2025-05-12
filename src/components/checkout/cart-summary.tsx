"use client";

import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/utils/format";
import { Trash2 } from "lucide-react";
import { useCartStore } from "@/store/cart";

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
    variantId?: string;
    variantName?: string;
}

interface CartSummaryProps {
    items: CartItem[];
}

export default function CartSummary({ items }: CartSummaryProps) {
    const { updateItemQuantity, removeItem } = useCartStore();

    if (items.length === 0) {
        return (
            <div className="text-center py-10">
                <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
                <p className="text-gray-500 mb-6">Looks like you haven't added any products to your cart yet.</p>
                <Link
                    href="/shop"
                    className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                    Continue Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item) => (
                        <tr key={`${item.id}-${item.variantId || 'default'}`}>
                            {/* Product */}
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 h-16 w-16 relative">
                                        <Image
                                            src={item.image || "/placeholder-product.jpg"}
                                            alt={item.name}
                                            fill
                                            className="object-cover rounded"
                                            sizes="64px"
                                        />
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                        {item.variantName && (
                                            <div className="text-sm text-gray-500">
                                                Variant: {item.variantName}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </td>

                            {/* Price */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatCurrency(item.price)}
                            </td>

                            {/* Quantity */}
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center border rounded w-24">
                                    <button
                                        onClick={() => updateItemQuantity(item.id, item.quantity - 1, item.variantId)}
                                        className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                                        disabled={item.quantity <= 1}
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        readOnly
                                        className="w-full text-center border-0 focus:ring-0"
                                    />
                                    <button
                                        onClick={() => updateItemQuantity(item.id, item.quantity + 1, item.variantId)}
                                        className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                                    >
                                        +
                                    </button>
                                </div>
                            </td>

                            {/* Total */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {formatCurrency(item.price * item.quantity)}
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                    onClick={() => removeItem(item.id, item.variantId)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}