import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CircleHelp, Mail, ShoppingBag, Truck, RotateCcw, CreditCard, Shield, Headphones, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
    title: "Help Center | UniQVerse",
    description: "Get answers to frequently asked questions and find support for your UniQVerse shopping experience.",
};

// FAQ categories and questions
const faqCategories = [
    {
        title: "Orders & Shipping",
        icon: <ShoppingBag className="h-6 w-6" />,
        questions: [
            {
                question: "How do I track my order?",
                answer: "You can track your order by logging into your account and visiting the 'Orders' section. Alternatively, you can use the tracking number provided in your shipping confirmation email."
            },
            {
                question: "What are your shipping timeframes?",
                answer: "Most orders ship within 24 hours and typically arrive within 3-5 business days for domestic orders. International shipping may take 7-14 business days depending on the destination."
            },
            {
                question: "Do you ship internationally?",
                answer: "Yes, we ship to most countries worldwide. Shipping costs and delivery times vary by location."
            }
        ]
    },
    {
        title: "Returns & Refunds",
        icon: <RotateCcw className="h-6 w-6" />,
        questions: [
            {
                question: "What is your return policy?",
                answer: "We accept returns within 30 days of delivery. Items must be unused, in their original packaging, and in the same condition you received them."
            },
            {
                question: "How do I initiate a return?",
                answer: "To initiate a return, log into your account, go to your orders, select the order containing the item you wish to return, and follow the return instructions. You can also contact our support team for assistance."
            },
            {
                question: "When will I receive my refund?",
                answer: "Refunds are typically processed within 5-7 business days after we receive and inspect the returned item. The time it takes for the refund to appear in your account depends on your payment method and financial institution."
            }
        ]
    },
    {
        title: "Payment & Billing",
        icon: <CreditCard className="h-6 w-6" />,
        questions: [
            {
                question: "What payment methods do you accept?",
                answer: "We accept major credit cards (Visa, MasterCard, American Express, Discover), PayPal, and Apple Pay."
            },
            {
                question: "Is my payment information secure?",
                answer: "Yes, all payment information is encrypted and processed securely. We do not store your full credit card details on our servers."
            },
            {
                question: "Can I change my payment method after placing an order?",
                answer: "Unfortunately, you cannot change the payment method once an order has been placed. If needed, you can cancel the order (if it hasn't shipped) and place a new one with the preferred payment method."
            }
        ]
    },
    {
        title: "Account & Privacy",
        icon: <Shield className="h-6 w-6" />,
        questions: [
            {
                question: "How do I create an account?",
                answer: "To create an account, click on the 'Account' icon in the top navigation bar and select 'Register'. Follow the prompts to provide your email, create a password, and complete your profile information."
            },
            {
                question: "How is my personal information used?",
                answer: "We use your personal information only to process orders, improve your shopping experience, and communicate with you about your purchases. Please refer to our Privacy Policy for more details."
            },
            {
                question: "Can I delete my account?",
                answer: "Yes, you can request to delete your account by contacting our support team. Note that certain information may be retained for legal and business purposes."
            }
        ]
    }
];

export default function HelpCenterPage() {
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Help Center Header */}
            <div className="text-center mb-12">
                <div className="inline-block p-3 bg-blue-100 rounded-full mb-4">
                    <CircleHelp className="h-8 w-8 text-blue-600" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">How Can We Help You?</h1>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    Find answers to frequently asked questions, get support, and learn more about our products and services.
                </p>
            </div>

            {/* Search Box */}
            <div className="max-w-2xl mx-auto mb-12">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search for answers..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button className="absolute right-3 top-3 text-gray-500 hover:text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Support Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <Link href="/shipping" className="flex flex-col items-center p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow text-center">
                    <Truck className="h-10 w-10 text-blue-600 mb-3" />
                    <h3 className="text-lg font-semibold mb-2">Shipping Information</h3>
                    <p className="text-gray-600">Learn about shipping methods, timeframes, and costs.</p>
                </Link>

                <Link href="/returns" className="flex flex-col items-center p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow text-center">
                    <RotateCcw className="h-10 w-10 text-blue-600 mb-3" />
                    <h3 className="text-lg font-semibold mb-2">Returns & Exchanges</h3>
                    <p className="text-gray-600">Understand our return policy and process for exchanges.</p>
                </Link>

                <Link href="/support" className="flex flex-col items-center p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow text-center">
                    <Headphones className="h-10 w-10 text-blue-600 mb-3" />
                    <h3 className="text-lg font-semibold mb-2">Support Center</h3>
                    <p className="text-gray-600">Submit a support ticket or chat with our support team.</p>
                </Link>

                <Link href="/contact" className="flex flex-col items-center p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow text-center">
                    <Mail className="h-10 w-10 text-blue-600 mb-3" />
                    <h3 className="text-lg font-semibold mb-2">Contact Us</h3>
                    <p className="text-gray-600">Get in touch with our customer support team.</p>
                </Link>
            </div>

            {/* FAQ Sections */}
            <div className="space-y-8">
                <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>

                {faqCategories.map((category, index) => (
                    <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 p-2 rounded-full">
                                    {category.icon}
                                </div>
                                <h3 className="text-xl font-semibold">{category.title}</h3>
                            </div>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {category.questions.map((faq, faqIndex) => (
                                <details key={faqIndex} className="group">
                                    <summary className="flex justify-between items-center p-6 cursor-pointer">
                                        <h4 className="text-lg font-medium text-gray-900">{faq.question}</h4>
                                        <span className="text-blue-600 group-open:rotate-180 transition-transform">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </span>
                                    </summary>
                                    <div className="p-6 pt-0">
                                        <p className="text-gray-600">{faq.answer}</p>
                                    </div>
                                </details>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* AI Chat Support CTA */}
            <div className="mt-16 bg-blue-50 rounded-lg p-8 text-center">
                <div className="inline-block p-3 bg-blue-100 rounded-full mb-4">
                    <MessageSquare className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Need immediate assistance?</h3>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                    Use our AI chatbot for instant answers to common questions, or chat with our support team during business hours.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild>
                        <Link href="/support?tab=chat">Chat with Support</Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/support">Submit Support Ticket</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}