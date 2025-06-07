import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
    Users, 
    DollarSign, 
    TrendingUp, 
    Gift, 
    CheckCircle, 
    Star,
    ArrowRight,
    Mail,
    Share2,
    Target
} from "lucide-react";

export const metadata: Metadata = {
    title: "Affiliate Program - UniQVerse",
    description: "Join the UniQVerse Affiliate Program and earn commissions by promoting our unique products to your audience.",
};

export default function AffiliatePage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Coming Soon Notice */}
            <div className="bg-yellow-50 border-b border-yellow-200">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center justify-center">
                        <div className="bg-yellow-100 rounded-full p-2 mr-3">
                            <Mail className="h-5 w-5 text-yellow-600" />
                        </div>
                        <p className="text-yellow-800 font-medium text-center">
                            🚧 Affiliate Program Coming Soon! We're currently building our affiliate system. 
                            <Link href="/contact" className="underline hover:no-underline ml-1">
                                Contact us
                            </Link> to be notified when it launches.
                        </p>
                    </div>
                </div>
            </div>

            {/* Hero Section */}
            <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700">
                <div className="container mx-auto px-4 py-16 lg:py-24">
                    <div className="max-w-4xl mx-auto text-center text-white">
                        <h1 className="text-4xl lg:text-6xl font-bold mb-6">
                            Join Our Affiliate Program
                        </h1>
                        <p className="text-xl lg:text-2xl mb-8 opacity-90">
                            Earn up to 15% commission promoting unique products your audience will love
                        </p>                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100" disabled>
                                <Mail className="h-5 w-5 mr-2" />
                                Coming Soon
                            </Button>
                            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                                Learn More
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Benefits Section */}
            <div className="container mx-auto px-4 py-16">
                <div className="text-center mb-12">
                    <h2 className="text-3xl lg:text-4xl font-bold mb-4">Why Partner With UniQVerse?</h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Join thousands of successful affiliates earning passive income with our premium products
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                    <div className="bg-white rounded-lg p-8 shadow-sm border hover:shadow-md transition-shadow">
                        <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                            <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="text-xl font-semibold mb-3">High Commissions</h3>
                        <p className="text-gray-600 mb-4">
                            Earn up to 15% commission on every sale with our tiered commission structure.
                        </p>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-center">
                                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                <span>5% for 1-10 sales/month</span>
                            </li>
                            <li className="flex items-center">
                                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                <span>10% for 11-25 sales/month</span>
                            </li>
                            <li className="flex items-center">
                                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                <span>15% for 25+ sales/month</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-white rounded-lg p-8 shadow-sm border hover:shadow-md transition-shadow">
                        <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                            <TrendingUp className="h-6 w-6 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-semibold mb-3">Real-Time Tracking</h3>
                        <p className="text-gray-600 mb-4">
                            Monitor your performance with our advanced affiliate dashboard and analytics.
                        </p>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-center">
                                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                <span>Live sales tracking</span>
                            </li>
                            <li className="flex items-center">
                                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                <span>Detailed analytics</span>
                            </li>
                            <li className="flex items-center">
                                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                <span>Performance insights</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-white rounded-lg p-8 shadow-sm border hover:shadow-md transition-shadow">
                        <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                            <Gift className="h-6 w-6 text-purple-600" />
                        </div>
                        <h3 className="text-xl font-semibold mb-3">Marketing Support</h3>
                        <p className="text-gray-600 mb-4">
                            Get access to professional marketing materials and dedicated support.
                        </p>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-center">
                                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                <span>High-quality banners</span>
                            </li>
                            <li className="flex items-center">
                                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                <span>Product images & videos</span>
                            </li>
                            <li className="flex items-center">
                                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                <span>Email templates</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* How It Works Section */}
            <div className="bg-white py-16">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl lg:text-4xl font-bold mb-4">How It Works</h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Start earning in just a few simple steps
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        <div className="text-center">
                            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="h-8 w-8 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-semibold mb-3">1. Apply & Get Approved</h3>
                            <p className="text-gray-600">
                                Submit your application and get approved within 24-48 hours. We welcome bloggers, influencers, and content creators of all sizes.
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Share2 className="h-8 w-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-semibold mb-3">2. Promote Our Products</h3>
                            <p className="text-gray-600">
                                Share your unique affiliate links on your blog, social media, email newsletters, or any platform where your audience engages.
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Target className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-semibold mb-3">3. Earn Commissions</h3>
                            <p className="text-gray-600">
                                Earn up to 15% commission on every sale made through your links. Payments are processed monthly via PayPal or bank transfer.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Requirements Section */}
            <div className="bg-gray-50 py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Affiliate Requirements</h2>
                            <p className="text-xl text-gray-600">
                                We're looking for quality partners who align with our brand values
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white rounded-lg p-8 shadow-sm">
                                <h3 className="text-xl font-semibold mb-4 text-green-600">✓ What We're Looking For</h3>
                                <ul className="space-y-3">
                                    <li className="flex items-start">
                                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                                        <span>Active website, blog, or social media presence</span>
                                    </li>
                                    <li className="flex items-start">
                                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                                        <span>Engaged audience interested in unique products</span>
                                    </li>
                                    <li className="flex items-start">
                                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                                        <span>Quality content that aligns with our brand</span>
                                    </li>
                                    <li className="flex items-start">
                                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                                        <span>Commitment to honest, authentic promotion</span>
                                    </li>
                                    <li className="flex items-start">
                                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                                        <span>Compliance with FTC disclosure guidelines</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-white rounded-lg p-8 shadow-sm">
                                <h3 className="text-xl font-semibold mb-4 text-red-600">✗ What We Don't Allow</h3>
                                <ul className="space-y-3">
                                    <li className="flex items-start">
                                        <span className="text-red-500 mr-3 mt-0.5">✗</span>
                                        <span>Spam or unsolicited email marketing</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-red-500 mr-3 mt-0.5">✗</span>
                                        <span>Paid search advertising on our brand terms</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-red-500 mr-3 mt-0.5">✗</span>
                                        <span>Adult, gambling, or illegal content</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-red-500 mr-3 mt-0.5">✗</span>
                                        <span>Trademark or copyright infringement</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-red-500 mr-3 mt-0.5">✗</span>
                                        <span>Self-purchasing or fraudulent activity</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Stories Section */}
            <div className="bg-white py-16">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl lg:text-4xl font-bold mb-4">Success Stories</h2>
                        <p className="text-xl text-gray-600">
                            Hear from our top-performing affiliates
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        <div className="bg-gray-50 rounded-lg p-8">
                            <div className="flex items-center mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                                ))}
                            </div>
                            <p className="text-gray-600 mb-4 italic">
                                "I've been promoting UniQVerse products for 6 months and consistently earn $2,000+ per month. The products are high-quality and my audience loves them!"
                            </p>
                            <div className="font-semibold">Sarah M.</div>
                            <div className="text-sm text-gray-500">Lifestyle Blogger</div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-8">
                            <div className="flex items-center mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                                ))}
                            </div>
                            <p className="text-gray-600 mb-4 italic">
                                "The affiliate support team is amazing! They provide great marketing materials and always respond quickly to questions. Highly recommend!"
                            </p>
                            <div className="font-semibold">Mike R.</div>
                            <div className="text-sm text-gray-500">YouTube Creator</div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-8">
                            <div className="flex items-center mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                                ))}
                            </div>
                            <p className="text-gray-600 mb-4 italic">
                                "As an Instagram influencer, I love how the products photograph beautifully. My followers are always asking where to buy them!"
                            </p>
                            <div className="font-semibold">Jessica L.</div>
                            <div className="text-sm text-gray-500">Instagram Influencer</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 py-16">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                        Ready to Start Earning?
                    </h2>
                    <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                        Join our affiliate program today and start earning commissions on every sale. Application takes less than 5 minutes!
                    </p>                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100" disabled>
                            <Mail className="h-5 w-5 mr-2" />
                            Coming Soon
                        </Button>
                        <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
                            <Link href="/contact">
                                Have Questions? Contact Us
                                <ArrowRight className="h-5 w-5 ml-2" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="bg-gray-50 py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
                        </div>

                        <div className="space-y-8">
                            <div className="bg-white rounded-lg p-6 shadow-sm">
                                <h3 className="text-lg font-semibold mb-2">How much can I earn?</h3>
                                <p className="text-gray-600">
                                    Your earnings depend on your promotional efforts and audience size. Our top affiliates earn $5,000+ per month, while new affiliates typically earn $200-500 in their first month.
                                </p>
                            </div>

                            <div className="bg-white rounded-lg p-6 shadow-sm">
                                <h3 className="text-lg font-semibold mb-2">When do I get paid?</h3>
                                <p className="text-gray-600">
                                    Commissions are paid monthly via PayPal or bank transfer. Payments are processed on the 15th of each month for the previous month's earnings, with a minimum payout of $50.
                                </p>
                            </div>

                            <div className="bg-white rounded-lg p-6 shadow-sm">
                                <h3 className="text-lg font-semibold mb-2">How long do cookies last?</h3>
                                <p className="text-gray-600">
                                    Our affiliate cookies last for 30 days, which means you'll earn commission on any purchase made within 30 days of someone clicking your affiliate link.
                                </p>
                            </div>

                            <div className="bg-white rounded-lg p-6 shadow-sm">
                                <h3 className="text-lg font-semibold mb-2">Can I promote on social media?</h3>
                                <p className="text-gray-600">
                                    Absolutely! Social media promotion is encouraged. We provide social media templates and guidelines to help you create engaging content that converts.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
