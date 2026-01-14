import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Users, Award, Sparkles, Heart, ShieldCheck, BadgeCheck, Globe } from "lucide-react";

export const metadata: Metadata = {
    title: "About Us | Uniqverse",
    description: "Learn about the Uniqverse story, our mission, values, and the team behind our unique products.",
};

export default function AboutPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-grow">
                {/* Hero Section */}
                <section className="bg-gradient-to-r from-purple-100 to-blue-100 py-20">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <div className="inline-block p-3 bg-white rounded-full mb-6">
                            <Users className="h-8 w-8 text-blue-600" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">About Uniqverse</h1>
                        <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
                            We're on a mission to bring unique, high-quality products to our customers that reflect their individual personalities and style.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Button asChild>
                                <Link href="/shop">Explore Our Products</Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href="/contact">Contact Us</Link>
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Our Story Section */}
                <section className="py-16 bg-white">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div className="relative h-80 md:h-96 rounded-xl overflow-hidden">
                                <Image
                                    src="/about-story.jpg"
                                    alt="The Uniqverse story"
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold mb-6">Our Story</h2>
                                <div className="space-y-4 text-gray-600">
                                    <p>
                                        Uniqverse was founded in 2023 with a simple idea: everyone deserves products that are as unique as they are. What started as a small operation in a garage has grown into a thriving e-commerce platform connecting customers with one-of-a-kind items from around the world.
                                    </p>
                                    <p>
                                        Our journey began when our founder, Alex Chen, struggled to find unique gifts that truly represented the personalities of friends and family. Realizing this was a common problem, Alex set out to create a curated marketplace where quality, uniqueness, and customer satisfaction were paramount.
                                    </p>
                                    <p>
                                        Today, Uniqverse partners with over 100 suppliers and artisans globally, bringing their exceptional products to customers who value individuality and quality craftsmanship.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Our Mission & Values */}
                <section className="py-16 bg-gray-50">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <div className="inline-block p-3 bg-blue-100 rounded-full mb-4">
                                <Sparkles className="h-6 w-6 text-blue-600" />
                            </div>
                            <h2 className="text-3xl font-bold mb-4">Our Mission & Values</h2>
                            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                                At Uniqverse, we're guided by our commitment to uniqueness, quality, and customer satisfaction.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                                <div className="bg-blue-100 p-3 inline-flex rounded-full mb-4">
                                    <Heart className="h-6 w-6 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-semibold mb-3">Customer First</h3>
                                <p className="text-gray-600">
                                    We believe in putting our customers' needs and satisfaction above everything else. Every decision we make is centered around enhancing your shopping experience.
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                                <div className="bg-blue-100 p-3 inline-flex rounded-full mb-4">
                                    <Award className="h-6 w-6 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-semibold mb-3">Quality Excellence</h3>
                                <p className="text-gray-600">
                                    We rigorously test and verify every product in our collection to ensure it meets our high standards for quality, durability, and value.
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                                <div className="bg-blue-100 p-3 inline-flex rounded-full mb-4">
                                    <Sparkles className="h-6 w-6 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-semibold mb-3">Uniqueness</h3>
                                <p className="text-gray-600">
                                    We celebrate individuality by curating products that stand out. Our items help you express your personality and make a statement.
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                                <div className="bg-blue-100 p-3 inline-flex rounded-full mb-4">
                                    <ShieldCheck className="h-6 w-6 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-semibold mb-3">Integrity</h3>
                                <p className="text-gray-600">
                                    We operate with transparency and honesty in all our business practices, from product descriptions to pricing and policies.
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                                <div className="bg-blue-100 p-3 inline-flex rounded-full mb-4">
                                    <BadgeCheck className="h-6 w-6 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-semibold mb-3">Reliability</h3>
                                <p className="text-gray-600">
                                    We strive to be dependable in every aspect of our business, from accurate product information to on-time shipping and responsive customer support.
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                                <div className="bg-blue-100 p-3 inline-flex rounded-full mb-4">
                                    <Globe className="h-6 w-6 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-semibold mb-3">Global Perspective</h3>
                                <p className="text-gray-600">
                                    We source products from around the world, celebrating diverse cultures and craftsmanship while maintaining ethical sourcing standards.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Meet Our Team */}
                <section className="py-16 bg-white">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <div className="inline-block p-3 bg-blue-100 rounded-full mb-4">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <h2 className="text-3xl font-bold mb-4">Meet Our Team</h2>
                            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                                The passionate individuals behind Uniqverse who work tirelessly to bring unique products to your doorstep.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
                                <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden">
                                    <Image
                                        src="https://ui-avatars.com/api/?name=Jaimin+Prajapati&background=6366f1&color=fff&size=128&bold=true"
                                        alt="Jaimin Prajapati"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <h3 className="text-xl font-semibold">Jaimin Prajapati</h3>
                                <p className="text-blue-600 mb-3">Founder & CEO</p>
                                <p className="text-gray-600 text-sm">
                                    Passionate about unique products and exceptional customer experiences.
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
                                <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden">
                                    <Image
                                        src="https://ui-avatars.com/api/?name=Sarah+Johnson&background=6366f1&color=fff&size=128&bold=true"
                                        alt="Sarah Johnson"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <h3 className="text-xl font-semibold">Sarah Johnson</h3>
                                <p className="text-blue-600 mb-3">Head of Product Curation</p>
                                <p className="text-gray-600 text-sm">
                                    Travels the world to discover unique items that meet our quality standards.
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
                                <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden">
                                    <Image
                                        src="https://ui-avatars.com/api/?name=Mike+Rodriguez&background=6366f1&color=fff&size=128&bold=true"
                                        alt="Mike Rodriguez"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <h3 className="text-xl font-semibold">Mike Rodriguez</h3>
                                <p className="text-blue-600 mb-3">Customer Experience Director</p>
                                <p className="text-gray-600 text-sm">
                                    Ensures every customer interaction exceeds expectations.
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
                                <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden">
                                    <Image
                                        src="https://ui-avatars.com/api/?name=Lisa+Patel&background=6366f1&color=fff&size=128&bold=true"
                                        alt="Lisa Patel"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <h3 className="text-xl font-semibold">Lisa Patel</h3>
                                <p className="text-blue-600 mb-3">Operations Manager</p>
                                <p className="text-gray-600 text-sm">
                                    Oversees logistics to ensure smooth delivery from suppliers to customers.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Our Achievements */}
                <section className="py-16 bg-blue-600 text-white">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <div className="inline-block p-3 bg-white rounded-full mb-4">
                                <Award className="h-6 w-6 text-blue-600" />
                            </div>
                            <h2 className="text-3xl font-bold mb-4">Our Achievements</h2>
                            <p className="text-lg opacity-90 max-w-3xl mx-auto">
                                We're proud of the milestones we've reached and the recognition we've received.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                            <div>
                                <div className="text-4xl font-bold mb-2">100+</div>
                                <p className="opacity-90">Global Suppliers</p>
                            </div>
                            <div>
                                <div className="text-4xl font-bold mb-2">50k+</div>
                                <p className="opacity-90">Happy Customers</p>
                            </div>
                    <div>
                        <div className="text-4xl font-bold mb-2">5k+</div>
                        <p className="opacity-90">Unique Products</p>
                    </div>
                    <div>
                        <div className="text-4xl font-bold mb-2">98%</div>
                        <p className="opacity-90">Satisfaction Rate</p>
                    </div>
                </div>
            </div>
            </section>

            {/* Join Our Team CTA */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold mb-4">Join Our Growing Team</h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                        We're always looking for passionate individuals who share our values and vision. Explore current opportunities and become part of the Uniqverse family.
                    </p>
                    <Button size="lg" asChild>
                        <Link href="/careers">View Open Positions</Link>
                    </Button>
                    </div>
                </section>
                </main>
            </div>
    );
}