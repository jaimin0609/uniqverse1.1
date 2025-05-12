import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RotateCcw, Clock, CheckCircle, FileText, HelpCircle, ArrowRightLeft, AlertCircle, Truck } from "lucide-react";

export const metadata: Metadata = {
    title: "Returns & Exchanges | UniQVerse",
    description: "Learn about our return policy, exchange process, and how to initiate a return for your UniQVerse purchase.",
};

export default function ReturnsPage() {
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Returns Header */}
            <div className="text-center mb-12">
                <div className="inline-block p-3 bg-blue-100 rounded-full mb-4">
                    <RotateCcw className="h-8 w-8 text-blue-600" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">Returns & Exchanges</h1>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    We want you to be completely satisfied with your purchase. Learn about our hassle-free return and exchange policy.
                </p>
            </div>

            {/* Return Policy Overview */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-12">
                <h2 className="text-2xl font-semibold mb-6">Our Return Policy</h2>
                <div className="space-y-4 text-gray-600">
                    <p>
                        We offer a 30-day return policy for most items. If you're not completely satisfied with your purchase, you can return it within 30 days of delivery for a full refund of the product cost (excluding shipping fees).
                    </p>
                    <p>
                        To be eligible for a return, your item must be:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>In the same condition that you received it</li>
                        <li>Unused and unworn</li>
                        <li>In the original packaging with all tags attached</li>
                        <li>Accompanied by the original receipt or proof of purchase</li>
                    </ul>
                    <p className="font-medium text-blue-600">
                        Please note: We cannot accept returns of personalized items, sale items, or intimate wear for hygiene reasons unless they are defective.
                    </p>
                </div>
            </div>

            {/* Return Process Steps */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-12">
                <h2 className="text-2xl font-semibold mb-6">How to Return an Item</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-blue-100 p-3 rounded-full mb-4">
                            <RotateCcw className="h-6 w-6 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">Step 1: Initiate Return</h3>
                        <p className="text-gray-600">
                            Log into your account, go to your orders, select the item you want to return, and click "Start Return". Alternatively, contact our customer support.
                        </p>
                    </div>

                    <div className="flex flex-col items-center text-center">
                        <div className="bg-blue-100 p-3 rounded-full mb-4">
                            <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">Step 2: Print Return Label</h3>
                        <p className="text-gray-600">
                            Follow the instructions to print your return shipping label. Package the item securely in its original packaging if possible.
                        </p>
                    </div>

                    <div className="flex flex-col items-center text-center">
                        <div className="bg-blue-100 p-3 rounded-full mb-4">
                            <CheckCircle className="h-6 w-6 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">Step 3: Ship & Refund</h3>
                        <p className="text-gray-600">
                            Drop off your package at any authorized shipping location. Once we receive and inspect the item, we'll process your refund.
                        </p>
                    </div>
                </div>
            </div>

            {/* Refund Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-100 p-2 rounded-full">
                        <Clock className="h-6 w-6 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-semibold">Refund Processing</h2>
                </div>
                <div className="space-y-4 text-gray-600">
                    <p>
                        Once your return is received and inspected, we will send you an email to notify you that we have received your returned item. We will also notify you of the approval or rejection of your refund.
                    </p>
                    <p>
                        If approved, your refund will be processed and automatically applied to your original method of payment within 5-7 business days. Please note that depending on your payment provider, it may take an additional 2-10 business days for the refund to appear in your account.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-medium mb-2">For Credit Card Purchases</h3>
                            <p className="text-gray-600">
                                Refunds will be issued to the original credit card used for the purchase. Allow 5-7 business days for the credit to appear on your statement.
                            </p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-medium mb-2">For PayPal Purchases</h3>
                            <p className="text-gray-600">
                                Refunds will be processed to your PayPal account within 48 hours of our approval.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Exchanges */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-100 p-2 rounded-full">
                        <ArrowRightLeft className="h-6 w-6 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-semibold">Exchanges</h2>
                </div>
                <div className="space-y-4 text-gray-600">
                    <p>
                        We currently do not process direct exchanges. Instead, we recommend that you return the unwanted item for a refund and place a new order for the item you want. This ensures faster processing and availability of your preferred item.
                    </p>
                    <p>
                        For size or color exchanges of the same product:
                    </p>
                    <ol className="list-decimal pl-6 space-y-2">
                        <li>Initiate a return for the original item</li>
                        <li>Place a new order for the desired size/color</li>
                        <li>Include a note in the return form mentioning that you've already ordered a replacement</li>
                    </ol>
                    <p>
                        If the new item is priced differently from your original purchase, you'll be charged or refunded the difference accordingly.
                    </p>
                </div>
            </div>

            {/* Damaged or Defective Items */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-100 p-2 rounded-full">
                        <AlertCircle className="h-6 w-6 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-semibold">Damaged or Defective Items</h2>
                </div>
                <div className="space-y-4 text-gray-600">
                    <p>
                        If you receive a damaged or defective item, please contact us within 48 hours of delivery. We'll need:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Your order number</li>
                        <li>Description of the damage or defect</li>
                        <li>Photos showing the issue (if applicable)</li>
                    </ul>
                    <p>
                        We'll expedite your return and cover the return shipping costs for damaged or defective items. Depending on availability, we can offer:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>A replacement item shipped to you at no additional cost</li>
                        <li>A full refund including original shipping costs</li>
                        <li>Store credit with an additional 10% bonus for your inconvenience</li>
                    </ul>
                </div>
            </div>

            {/* Return Shipping */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-100 p-2 rounded-full">
                        <Truck className="h-6 w-6 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-semibold">Return Shipping</h2>
                </div>
                <div className="space-y-4 text-gray-600">
                    <p>
                        For standard returns, customers are responsible for return shipping costs. The shipping fee will be deducted from your refund amount.
                    </p>
                    <p>
                        We provide a prepaid return shipping label for your convenience. The cost of the return label ($5.99 for domestic returns) will be deducted from your refund amount.
                    </p>
                    <p>
                        Return shipping is FREE in the following cases:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Damaged or defective items</li>
                        <li>Incorrect items shipped</li>
                        <li>Orders over $150 (US customers only)</li>
                    </ul>
                    <p>
                        International customers should contact our customer support team for specific return instructions and shipping labels.
                    </p>
                </div>
            </div>

            {/* FAQs */}
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
                            <h3 className="text-lg font-medium text-gray-900">Can I return an item after 30 days?</h3>
                            <span className="text-blue-600 group-open:rotate-180 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </span>
                        </summary>
                        <div className="p-6 pt-0">
                            <p className="text-gray-600">
                                Returns after 30 days are evaluated on a case-by-case basis. Please contact our customer support team if you need to return an item after the standard return window has passed. In most cases, items returned after 30 days will be eligible for store credit rather than a full refund.
                            </p>
                        </div>
                    </details>

                    <details className="group">
                        <summary className="flex justify-between items-center p-6 cursor-pointer">
                            <h3 className="text-lg font-medium text-gray-900">How do I return a gift?</h3>
                            <span className="text-blue-600 group-open:rotate-180 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </span>
                        </summary>
                        <div className="p-6 pt-0">
                            <p className="text-gray-600">
                                If you received an item as a gift, you can return it for store credit or an exchange. You'll need the order number or gift receipt. If you don't have this information, contact our customer support team with details about the gift, and we'll do our best to locate the order.
                            </p>
                        </div>
                    </details>

                    <details className="group">
                        <summary className="flex justify-between items-center p-6 cursor-pointer">
                            <h3 className="text-lg font-medium text-gray-900">Can I return sale or clearance items?</h3>
                            <span className="text-blue-600 group-open:rotate-180 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </span>
                        </summary>
                        <div className="p-6 pt-0">
                            <p className="text-gray-600">
                                Items marked as "Final Sale" or "Clearance" cannot be returned unless they are defective. Regular sale items can be returned within 14 days of delivery (rather than our standard 30-day policy) and are eligible for store credit only, not refunds.
                            </p>
                        </div>
                    </details>

                    <details className="group">
                        <summary className="flex justify-between items-center p-6 cursor-pointer">
                            <h3 className="text-lg font-medium text-gray-900">Do I need the original packaging to return an item?</h3>
                            <span className="text-blue-600 group-open:rotate-180 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </span>
                        </summary>
                        <div className="p-6 pt-0">
                            <p className="text-gray-600">
                                While we strongly prefer returns to be in their original packaging with all tags attached, we understand this is not always possible. If you no longer have the original packaging, please package the item securely to prevent damage during transit. Note that items returned without original packaging may be subject to a restocking fee of up to 15% of the purchase price.
                            </p>
                        </div>
                    </details>
                </div>
            </div>

            {/* Contact CTA */}
            <div className="text-center">
                <h3 className="text-xl font-semibold mb-3">Need help with a return or exchange?</h3>
                <p className="text-gray-600 mb-6">Our customer service team is here to assist you with any questions or concerns.</p>
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