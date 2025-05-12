import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Truck, Clock, Globe, HelpCircle, ShoppingBag, Package, Home, Ban, Search } from "lucide-react";

export const metadata: Metadata = {
    title: "Shipping Information | UniQVerse",
    description: "Learn about our shipping methods, delivery timeframes, and international shipping options.",
};

// Shipping rate data
const domesticShippingRates = [
    { method: "Standard Shipping", time: "3-5 business days", cost: "$4.99", threshold: "$50" },
    { method: "Express Shipping", time: "2 business days", cost: "$9.99", threshold: "N/A" },
    { method: "Next Day Delivery", time: "1 business day", cost: "$19.99", threshold: "N/A" },
];

const internationalShippingRates = [
    { region: "Canada", time: "5-7 business days", cost: "$9.99", threshold: "$75" },
    { region: "Europe", time: "7-10 business days", cost: "$14.99", threshold: "$100" },
    { region: "Asia Pacific", time: "10-14 business days", cost: "$19.99", threshold: "$150" },
    { region: "Rest of World", time: "14-21 business days", cost: "$24.99", threshold: "$200" },
];

export default function ShippingPage() {
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Shipping Information Header */}
            <div className="text-center mb-12">
                <div className="inline-block p-3 bg-blue-100 rounded-full mb-4">
                    <Truck className="h-8 w-8 text-blue-600" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">Shipping Information</h1>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    Everything you need to know about our shipping methods, delivery timeframes, and costs.
                </p>
            </div>

            {/* Shipping Process Overview */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-12">
                <h2 className="text-2xl font-semibold mb-6">Our Shipping Process</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-blue-100 p-3 rounded-full mb-4">
                            <ShoppingBag className="h-6 w-6 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">Order Placed</h3>
                        <p className="text-gray-600">Your order is confirmed and processed within our system.</p>
                    </div>

                    <div className="flex flex-col items-center text-center">
                        <div className="bg-blue-100 p-3 rounded-full mb-4">
                            <Package className="h-6 w-6 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">Order Processing</h3>
                        <p className="text-gray-600">We prepare your items and package them securely.</p>
                    </div>

                    <div className="flex flex-col items-center text-center">
                        <div className="bg-blue-100 p-3 rounded-full mb-4">
                            <Truck className="h-6 w-6 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">Order Shipped</h3>
                        <p className="text-gray-600">Your package is on the way with tracking information sent to you.</p>
                    </div>

                    <div className="flex flex-col items-center text-center">
                        <div className="bg-blue-100 p-3 rounded-full mb-4">
                            <Home className="h-6 w-6 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">Order Delivered</h3>
                        <p className="text-gray-600">Your package arrives at your doorstep ready to enjoy.</p>
                    </div>
                </div>
            </div>

            {/* Domestic Shipping Rates */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-12">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full">
                            <Truck className="h-6 w-6 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-semibold">Domestic Shipping</h2>
                    </div>
                    <p className="mt-2 text-gray-600">Shipping rates and estimated delivery times within the United States.</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shipping Method</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Free Shipping Threshold</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {domesticShippingRates.map((rate, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rate.method}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rate.time}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rate.cost}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {rate.threshold === "N/A" ? "Not Available" : `Free on orders over ${rate.threshold}`}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* International Shipping Rates */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-12">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full">
                            <Globe className="h-6 w-6 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-semibold">International Shipping</h2>
                    </div>
                    <p className="mt-2 text-gray-600">Shipping rates and estimated delivery times for international destinations.</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Free Shipping Threshold</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {internationalShippingRates.map((rate, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rate.region}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rate.time}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rate.cost}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {`Free on orders over ${rate.threshold}`}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Shipping Policies Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {/* Order Processing */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-blue-100 p-2 rounded-full">
                            <Clock className="h-6 w-6 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-semibold">Order Processing</h3>
                    </div>
                    <ul className="space-y-3 text-gray-600">
                        <li className="flex items-start">
                            <span className="text-blue-600 mr-2">•</span>
                            Orders are typically processed within 24 hours on business days.
                        </li>
                        <li className="flex items-start">
                            <span className="text-blue-600 mr-2">•</span>
                            Orders placed after 2:00 PM EST may not be processed until the next business day.
                        </li>
                        <li className="flex items-start">
                            <span className="text-blue-600 mr-2">•</span>
                            You will receive a shipping confirmation email with tracking information once your order ships.
                        </li>
                        <li className="flex items-start">
                            <span className="text-blue-600 mr-2">•</span>
                            Business days are Monday through Friday, excluding holidays.
                        </li>
                    </ul>
                </div>

                {/* Shipping Restrictions */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-blue-100 p-2 rounded-full">
                            <Ban className="h-6 w-6 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-semibold">Shipping Restrictions</h3>
                    </div>
                    <ul className="space-y-3 text-gray-600">
                        <li className="flex items-start">
                            <span className="text-blue-600 mr-2">•</span>
                            Some products may not be available for international shipping due to regulatory restrictions.
                        </li>
                        <li className="flex items-start">
                            <span className="text-blue-600 mr-2">•</span>
                            Additional customs fees, taxes, and duties may apply to international orders and are the responsibility of the recipient.
                        </li>
                        <li className="flex items-start">
                            <span className="text-blue-600 mr-2">•</span>
                            P.O. Box addresses may result in shipping delays and are not eligible for Next Day Delivery.
                        </li>
                        <li className="flex items-start">
                            <span className="text-blue-600 mr-2">•</span>
                            We currently do not ship to APO/FPO addresses or certain territories.
                        </li>
                    </ul>
                </div>
            </div>

            {/* Order Tracking Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-100 p-2 rounded-full">
                        <Search className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold">Order Tracking</h3>
                </div>
                <p className="text-gray-600 mb-6">
                    You can track your order status at any time by:
                </p>
                <ol className="space-y-4 text-gray-600 mb-6">
                    <li className="flex items-start">
                        <span className="font-bold text-blue-600 mr-2">1.</span>
                        <span>Logging into your account and visiting the <Link href="/account/orders" className="text-blue-600 hover:underline">Orders</Link> section.</span>
                    </li>
                    <li className="flex items-start">
                        <span className="font-bold text-blue-600 mr-2">2.</span>
                        <span>Using the tracking number provided in your shipping confirmation email on our carrier's website.</span>
                    </li>
                    <li className="flex items-start">
                        <span className="font-bold text-blue-600 mr-2">3.</span>
                        <span>Contacting our customer support team with your order number.</span>
                    </li>
                </ol>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">
                        <strong>Note:</strong> Tracking information may take up to 24 hours to update after your order has shipped.
                    </p>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-12">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full">
                            <HelpCircle className="h-6 w-6 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-semibold">Frequently Asked Questions</h2>
                    </div>
                </div>
                <div className="divide-y divide-gray-200">
                    <details className="group">
                        <summary className="flex justify-between items-center p-6 cursor-pointer">
                            <h3 className="text-lg font-medium text-gray-900">When will my order ship?</h3>
                            <span className="text-blue-600 group-open:rotate-180 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </span>
                        </summary>
                        <div className="p-6 pt-0">
                            <p className="text-gray-600">
                                Most orders are processed and shipped within 24 hours on business days. Orders placed on weekends or holidays will be processed the next business day.
                            </p>
                        </div>
                    </details>

                    <details className="group">
                        <summary className="flex justify-between items-center p-6 cursor-pointer">
                            <h3 className="text-lg font-medium text-gray-900">Can I change my shipping address after placing an order?</h3>
                            <span className="text-blue-600 group-open:rotate-180 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </span>
                        </summary>
                        <div className="p-6 pt-0">
                            <p className="text-gray-600">
                                You can request an address change if your order hasn't shipped yet. Please contact our customer support team immediately with your order number and the new shipping address. Once an order has shipped, we cannot change the delivery address.
                            </p>
                        </div>
                    </details>

                    <details className="group">
                        <summary className="flex justify-between items-center p-6 cursor-pointer">
                            <h3 className="text-lg font-medium text-gray-900">What do I do if my package is lost or damaged?</h3>
                            <span className="text-blue-600 group-open:rotate-180 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </span>
                        </summary>
                        <div className="p-6 pt-0">
                            <p className="text-gray-600">
                                If your package appears to be lost or arrives damaged, please contact our customer support team within 48 hours of the delivery date. Please provide your order number, photos of any damage (if applicable), and we will work with you to resolve the issue promptly.
                            </p>
                        </div>
                    </details>

                    <details className="group">
                        <summary className="flex justify-between items-center p-6 cursor-pointer">
                            <h3 className="text-lg font-medium text-gray-900">Do you offer expedited shipping for all products?</h3>
                            <span className="text-blue-600 group-open:rotate-180 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </span>
                        </summary>
                        <div className="p-6 pt-0">
                            <p className="text-gray-600">
                                Expedited shipping options (Express and Next Day Delivery) are available for most products. However, some oversized or special items may only be eligible for Standard Shipping. The available shipping methods will be displayed during checkout.
                            </p>
                        </div>
                    </details>
                </div>
            </div>

            {/* Help CTA */}
            <div className="text-center">
                <h3 className="text-xl font-semibold mb-3">Still have questions?</h3>
                <p className="text-gray-600 mb-6">Our support team is here to help with any other shipping concerns.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild>
                        <Link href="/contact">Contact Support</Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/help">Return to Help Center</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}