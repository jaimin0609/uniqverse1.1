import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShoppingBag, Star, Truck, Shield } from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { InfiniteProducts } from "@/components/product/infinite-products";
import { PromotionalFeature } from "@/components/promotion/promotional-feature";
import { EventShowcase } from "@/components/events/event-showcase";

// Fetch initial featured products for the homepage
async function getInitialFeaturedProducts() {
  const products = await db.product.findMany({
    take: 8, // Increased initial load to 8 products
    where: {
      isFeatured: true,
      isPublished: true,
    },
    include: {
      images: {
        where: {
          position: 0
        },
        take: 1
      },
      category: true,
    },
    orderBy: [
      { featuredOrder: 'asc' },
      { createdAt: 'desc' }
    ]
  });

  return products;
}

export default async function Home() {
  const featuredProducts = await getInitialFeaturedProducts();

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-blue-50 to-indigo-100 py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Discover <span className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">Unique</span> Products for Your Lifestyle
              </h1>
              <p className="text-xl text-gray-600">
                Custom-designed products that reflect your personality, delivered right to your door.
              </p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <Button size="lg" asChild>
                  <Link href="/shop">Start Shopping <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/categories">Browse Categories</Link>
                </Button>
              </div>
            </div>
            <div className="relative h-64 md:h-96">
              <Image
                src="/hero-image.jpg"
                alt="Featured products collection"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover rounded-xl shadow-xl"
                priority
              />
            </div>
          </div>
        </section>

        {/* Event Showcase Section */}
        <section className="py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <EventShowcase className="rounded-xl overflow-hidden shadow-lg" />
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose UniQVerse?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-lg">
                <div className="bg-blue-100 p-3 rounded-full mb-4">
                  <Star className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Quality Products</h3>
                <p className="text-gray-600">We partner with the best suppliers to ensure premium quality for all our products.</p>
              </div>

              <div className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-lg">
                <div className="bg-blue-100 p-3 rounded-full mb-4">
                  <Truck className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
                <p className="text-gray-600">Most orders ship within 24 hours and arrive at your doorstep in 3-5 business days.</p>
              </div>

              <div className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-lg">
                <div className="bg-blue-100 p-3 rounded-full mb-4">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Secure Shopping</h3>
                <p className="text-gray-600">Your payments and personal information are always protected with our secure checkout.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products Section with Infinite Scrolling */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">Featured Products</h2>
            </div>

            {featuredProducts.length > 0 ? (
              <InfiniteProducts initialProducts={featuredProducts} />
            ) : (
              // Show skeletons if no products are found initially
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((product) => (
                  <div key={product} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="relative h-64">
                      <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                    </div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4 animate-pulse" />
                      <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-16 bg-blue-600 text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Subscribe to our newsletter for exclusive deals, new product announcements, and more.
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-grow px-4 py-2 rounded-md border text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
                required
              />
              <Button variant="secondary" type="submit">
                Subscribe
              </Button>
            </form>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white text-lg font-bold mb-4">UniQVerse</h3>
              <p className="mb-4">Custom-designed products that reflect your unique personality.</p>
              <div className="flex space-x-4">
                {/* Social Media Icons would go here */}
              </div>
            </div>

            <div>
              <h3 className="text-white text-lg font-bold mb-4">Shop</h3>
              <ul className="space-y-2">
                <li><Link href="/shop" className="hover:text-white transition-colors">All Products</Link></li>
                <li><Link href="/shop/featured" className="hover:text-white transition-colors">Featured</Link></li>
                <li><Link href="/shop/new" className="hover:text-white transition-colors">New Arrivals</Link></li>
                <li><Link href="/shop/sale" className="hover:text-white transition-colors">Sale</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white text-lg font-bold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/shipping" className="hover:text-white transition-colors">Shipping Info</Link></li>
                <li><Link href="/returns" className="hover:text-white transition-colors">Returns & Exchanges</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white text-lg font-bold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/affiliates" className="hover:text-white transition-colors">Affiliate Program</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p>© {new Date().getFullYear()} UniQVerse. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
