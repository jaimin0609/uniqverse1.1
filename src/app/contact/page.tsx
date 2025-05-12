import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Clock, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
    title: "Contact Us | Uniqverse",
    description: "Get in touch with our customer support team for help with orders, returns, or any other questions about Uniqverse products.",
};

export default function ContactPage() {
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Contact Us Header */}
            <div className="text-center mb-12">
                <div className="inline-block p-3 bg-blue-100 rounded-full mb-4">
                    <Mail className="h-8 w-8 text-blue-600" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">Contact Us</h1>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    Have a question or need assistance? Our customer support team is here to help you.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                {/* Contact Form */}
                <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <h2 className="text-2xl font-semibold mb-6">Send Us a Message</h2>
                    <form className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    id="firstName"
                                    name="firstName"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    id="lastName"
                                    name="lastName"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number (Optional)
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700 mb-1">
                                Order Number (If applicable)
                            </label>
                            <input
                                type="text"
                                id="orderNumber"
                                name="orderNumber"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g. ORD-123456"
                            />
                        </div>

                        <div>
                            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                                Subject
                            </label>
                            <select
                                id="subject"
                                name="subject"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            >
                                <option value="">Select a topic</option>
                                <option value="order">Order Status</option>
                                <option value="return">Return/Exchange</option>
                                <option value="product">Product Question</option>
                                <option value="account">Account Issue</option>
                                <option value="shipping">Shipping Question</option>
                                <option value="technical">Website Technical Issue</option>
                                <option value="feedback">Feedback/Suggestions</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                                Message
                            </label>
                            <textarea
                                id="message"
                                name="message"
                                rows={5}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                                placeholder="Please provide as much detail as possible..."
                            ></textarea>
                        </div>

                        <div>
                            <label className="inline-flex items-center">
                                <input
                                    type="checkbox"
                                    name="agree"
                                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-offset-0 focus:ring-blue-200 focus:ring-opacity-50"
                                    required
                                />
                                <span className="ml-2 text-sm text-gray-600">
                                    I agree to the <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link> and consent to being contacted regarding my inquiry.
                                </span>
                            </label>
                        </div>

                        <div>
                            <Button type="submit" className="w-full">
                                Submit Message
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Contact Information */}
                <div>
                    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
                        <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
                        <div className="space-y-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 text-blue-600">
                                        <Mail className="h-5 w-5" />
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-900">Email</p>
                                    <a href="mailto:support@uniqverse.com" className="text-sm text-blue-600 hover:underline">
                                        support@uniqverse.com
                                    </a>
                                </div>
                            </div>

                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 text-blue-600">
                                        <Phone className="h-5 w-5" />
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-900">Phone</p>
                                    <a href="tel:+18005551234" className="text-sm text-blue-600 hover:underline">
                                        1-800-555-1234
                                    </a>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Monday to Friday, 9AM - 6PM EST
                                    </p>
                                </div>
                            </div>

                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 text-blue-600">
                                        <MapPin className="h-5 w-5" />
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-900">Address</p>
                                    <p className="text-sm text-gray-600">
                                        Uniqverse Headquarters<br />
                                        123 Commerce Street<br />
                                        Suite 500<br />
                                        New York, NY 10001
                                    </p>
                                </div>
                            </div>

                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 text-blue-600">
                                        <Clock className="h-5 w-5" />
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-900">Business Hours</p>
                                    <p className="text-sm text-gray-600">
                                        Monday - Friday: 9:00 AM - 6:00 PM EST<br />
                                        Saturday: 10:00 AM - 4:00 PM EST<br />
                                        Sunday: Closed
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                        <h2 className="text-xl font-semibold mb-4">Chat Support</h2>
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 text-blue-600">
                                    <MessageSquare className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">
                                    Need immediate assistance? Chat with our support team during business hours.
                                </p>
                                <Button variant="outline" className="mt-3 w-full">
                                    Start Live Chat
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Help Section */}
            <div className="bg-gray-50 rounded-lg p-6 mb-12">
                <h2 className="text-2xl font-semibold mb-4 text-center">Quick Help Resources</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Link href="/help" className="block p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Help Center</h3>
                        <p className="text-gray-600">Find answers to frequently asked questions and common issues.</p>
                    </Link>

                    <Link href="/shipping" className="block p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Shipping Information</h3>
                        <p className="text-gray-600">Learn about shipping methods, timeframes, and costs.</p>
                    </Link>

                    <Link href="/returns" className="block p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Returns & Exchanges</h3>
                        <p className="text-gray-600">Understand our return policy and process for exchanges.</p>
                    </Link>
                </div>
            </div>

            {/* FAQ */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-12">
                <h2 className="text-2xl font-semibold mb-6 text-center">Common Questions</h2>
                <div className="space-y-4">
                    <details className="group border border-gray-200 rounded-lg">
                        <summary className="flex justify-between items-center p-4 cursor-pointer">
                            <h3 className="text-lg font-medium text-gray-900">How quickly will I receive a response?</h3>
                            <span className="text-blue-600 group-open:rotate-180 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </span>
                        </summary>
                        <div className="p-4 pt-0 border-t border-gray-200">
                            <p className="text-gray-600">
                                We aim to respond to all inquiries within 24 hours during business days. For urgent matters, please use our live chat feature or call our customer service line.
                            </p>
                        </div>
                    </details>

                    <details className="group border border-gray-200 rounded-lg">
                        <summary className="flex justify-between items-center p-4 cursor-pointer">
                            <h3 className="text-lg font-medium text-gray-900">What information should I include about my order?</h3>
                            <span className="text-blue-600 group-open:rotate-180 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </span>
                        </summary>
                        <div className="p-4 pt-0 border-t border-gray-200">
                            <p className="text-gray-600">
                                When contacting us about an order, please include your order number, the date of purchase, and specific details about your inquiry. This helps us assist you more efficiently.
                            </p>
                        </div>
                    </details>

                    <details className="group border border-gray-200 rounded-lg">
                        <summary className="flex justify-between items-center p-4 cursor-pointer">
                            <h3 className="text-lg font-medium text-gray-900">Can I track the status of my inquiry?</h3>
                            <span className="text-blue-600 group-open:rotate-180 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </span>
                        </summary>
                        <div className="p-4 pt-0 border-t border-gray-200">
                            <p className="text-gray-600">
                                Yes, when you submit a contact form, you will receive a confirmation email with a reference number. You can use this reference number to check the status of your inquiry by contacting our support team.
                            </p>
                        </div>
                    </details>
                </div>
            </div>
        </div>
    );
}