import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShoppingBag, Star, Truck, Shield, Store, TrendingUp, Users } from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import { InfiniteProducts } from "@/components/product/infinite-products";
import { PromotionalFeature } from "@/components/promotion/promotional-feature";
import { EventShowcase } from "@/components/events/event-showcase";
import NewsletterForm from "@/components/newsletter/NewsletterForm";
import { Logo } from "@/components/ui/logo";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

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

// Fetch top-rated products based on reviews
async function getTopRatedProducts() {
  const products = await db.product.findMany({
    where: {
      isPublished: true,
      reviews: {
        some: {
          status: 'APPROVED'
        }
      }
    },
    include: {
      images: {
        where: {
          position: 0
        },
        take: 1
      },
      category: true,
      reviews: {
        where: {
          status: 'APPROVED'
        },
        select: {
          rating: true
        }
      }
    },
    take: 50 // Get more products to calculate averages
  });

  // Calculate average ratings and filter products with good ratings
  const productsWithRatings = products
    .map(product => {
      const totalRatings = product.reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = product.reviews.length > 0 ? totalRatings / product.reviews.length : 0;
      const reviewCount = product.reviews.length;

      return {
        ...product,
        averageRating,
        reviewCount
      };
    })
    .filter(product => product.averageRating >= 4.0 && product.reviewCount >= 2) // At least 4 stars and 2 reviews
    .sort((a, b) => {
      // Sort by average rating first, then by review count
      if (b.averageRating !== a.averageRating) {
        return b.averageRating - a.averageRating;
      }
      return b.reviewCount - a.reviewCount;
    })
    .slice(0, 8); // Take top 8 products

  return productsWithRatings;
}

export default async function Home() {
  const [featuredProducts, topRatedProducts] = await Promise.all([
    getInitialFeaturedProducts(),
    getTopRatedProducts()
  ]);

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        {/* Hero Section - Enhanced with modern styling */}
        <section className="relative bg-gradient-mesh overflow-hidden py-32">
          {/* Animated background elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-purple-50/60 to-pink-50/80"></div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-primary rounded-full opacity-20 animate-float"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-accent rounded-full opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>

          <div className="container-custom relative z-10">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="space-y-8 text-center md:text-left">
                <h1 className="text-responsive-xl font-bold tracking-tight text-gradient animate-fade-in">
                  Discover <span className="text-gradient-accent">Unique</span> Products for Your Lifestyle
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed animate-fade-in animate-delay-200 smooth-edges">
                  Custom-designed products that reflect your personality, delivered right to your door with unmatched quality and style.
                </p>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start animate-fade-in animate-delay-400">
                  <Button size="lg" variant="gradient" className="hover-shine group" asChild>
                    <Link href="/shop">
                      Start Shopping
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  <Button variant="glass" size="lg" className="hover-lift" asChild>
                    <Link href="/categories">Browse Categories</Link>
                  </Button>
                </div>

                {/* Social proof indicators */}
                <div className="flex flex-wrap items-center gap-6 justify-center md:justify-start animate-fade-in animate-delay-500">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="flex -space-x-2">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-semibold border-2 border-white">
                          {i}
                        </div>
                      ))}
                    </div>
                    <span>10k+ Happy Customers</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="ml-1">4.9/5 Rating</span>
                  </div>
                </div>
              </div>

              <div className="relative animate-fade-in animate-delay-300">
                <div className="relative h-80 md:h-[500px] group">
                  {/* Floating decorative elements */}
                  <div className="absolute -top-6 -left-6 w-24 h-24 bg-gradient-accent rounded-2xl opacity-20 rotate-12 animate-float"></div>
                  <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-primary rounded-full opacity-30 animate-float" style={{ animationDelay: '2s' }}></div>

                  <div className="relative h-full glass rounded-3xl overflow-hidden hover-lift group-hover:scale-[1.02] transition-all duration-500">
                    <Image
                      src="/hero-image.jpg"
                      alt="Featured products collection"
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Event Showcase Section - Enhanced */}
        <section className="py-12 relative overflow-hidden">
          <div className="container-custom">
            <div className="animate-slide-up">
              <EventShowcase className="rounded-2xl overflow-hidden shadow-2xl hover-lift glass border border-white/20" />
            </div>
          </div>
        </section>

        {/* Features Section - Modernized */}
        <section className="py-24 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-white"></div>
          <div className="container-custom relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-responsive-lg font-bold text-gradient mb-4 animate-fade-in">
                Why Choose UselfUnik?
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto animate-fade-in animate-delay-200">
                Express your unique style with our curated collection, personalized experience, and premium quality products.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Star,
                  title: "Quality Products",
                  description: "We partner with the best suppliers to ensure premium quality for all our products.",
                  color: "from-yellow-400 to-orange-500",
                  delay: "100"
                },
                {
                  icon: Truck,
                  title: "Fast Delivery",
                  description: "Most orders ship within 24 hours and arrive at your doorstep in 3-5 business days.",
                  color: "from-green-400 to-blue-500",
                  delay: "200"
                },
                {
                  icon: Shield,
                  title: "Secure Shopping",
                  description: "Your payments and personal information are always protected with our secure checkout.",
                  color: "from-purple-400 to-pink-500",
                  delay: "300"
                }
              ].map((feature, index) => (
                <div
                  key={index}
                  className={`group animate-fade-in animate-delay-${feature.delay}`}
                >
                  <div className="glass rounded-2xl p-8 text-center hover-lift interactive-glow transition-all duration-500 group-hover:scale-105 border border-white/30">
                    <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-r ${feature.color} p-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-4 text-gray-800 group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed smooth-edges">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 animate-fade-in animate-delay-500">
              {[
                { label: "Products Sold", value: "50K+" },
                { label: "Happy Customers", value: "10K+" },
                { label: "Countries", value: "25+" },
                { label: "Customer Rating", value: "4.9★" }
              ].map((stat, index) => (
                <div key={index} className="text-center group">
                  <div className="text-3xl font-bold text-gradient mb-1 group-hover:scale-110 transition-transform">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products Section - Enhanced with modern styling */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-mesh opacity-30"></div>
          <div className="container-custom relative z-10">
            <div className="flex justify-between items-center mb-12 animate-fade-in">
              <div>
                <h2 className="text-responsive-lg font-bold text-gradient mb-2">
                  Featured Products
                </h2>
                <p className="text-gray-600">Handpicked items that our customers love most</p>
              </div>
              <Button variant="glass" className="hover-lift hidden md:block" asChild>
                <Link href="/shop">
                  View All Products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {featuredProducts.length > 0 ? (
              <div className="animate-fade-in animate-delay-200">
                <InfiniteProducts initialProducts={featuredProducts} />
              </div>
            ) : (
              // Enhanced skeleton loading with modern styling
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-fade-in animate-delay-200">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                  <div key={item} className="glass rounded-2xl overflow-hidden border border-white/20 animate-pulse">
                    <div className="relative h-64">
                      <div className="absolute inset-0 loading-skeleton" />
                    </div>
                    <div className="p-6 space-y-3">
                      <div className="h-4 loading-skeleton rounded-lg w-3/4" />
                      <div className="h-4 loading-skeleton rounded-lg w-1/2" />
                      <div className="h-6 loading-skeleton rounded-lg w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* View All button for mobile */}
            <div className="text-center mt-12 md:hidden animate-fade-in animate-delay-300">
              <Button variant="gradient" size="lg" className="hover-shine" asChild>
                <Link href="/shop">
                  View All Products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Top Rated Products Section - Customer favorites based on reviews */}
        <section className="py-24 relative overflow-hidden bg-gradient-to-b from-white to-gray-50/50">
          <div className="container-custom relative z-10">
            <div className="flex justify-between items-center mb-12 animate-fade-in">
              <div>
                <h2 className="text-responsive-lg font-bold text-gradient mb-2">
                  ⭐ Top Rated Products
                </h2>
                <p className="text-gray-600">Customer favorites with 4+ star ratings and verified reviews</p>
              </div>
              <Button variant="outline" className="hover-lift hidden md:block" asChild>
                <Link href="/shop?sort=rating">
                  View All Rated Products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {topRatedProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-fade-in animate-delay-200">
                {topRatedProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="glass rounded-2xl overflow-hidden border border-white/20 hover-lift group"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="relative h-64 overflow-hidden">
                      <Link href={`/products/${product.slug}`}>
                        <Image
                          src={product.images[0]?.url || '/placeholder-product.jpg'}
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        {/* Rating badge */}
                        <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 shadow-lg">
                          <Star className="h-3 w-3 fill-current" />
                          {product.averageRating.toFixed(1)}
                        </div>
                        {/* Review count badge */}
                        <div className="absolute top-3 right-3 bg-black/20 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs">
                          {product.reviewCount} reviews
                        </div>
                      </Link>
                    </div>

                    <div className="p-6">
                      <div className="mb-2">
                        {product.category && (
                          <span className="text-xs text-gray-500 uppercase tracking-wide">
                            {product.category.name}
                          </span>
                        )}
                      </div>

                      <Link href={`/products/${product.slug}`}>
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {product.name}
                        </h3>
                      </Link>

                      {/* Star rating display */}
                      <div className="mb-3">
                        <StarRating
                          rating={product.averageRating}
                          reviewCount={product.reviewCount}
                          className="text-sm"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold text-gray-900">
                          ${Number(product.price).toFixed(2)}
                        </div>
                        <Button size="sm" variant="gradient" className="hover-shine" asChild>
                          <Link href={`/products/${product.slug}`}>
                            View Product
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 animate-fade-in animate-delay-200">
                <div className="glass rounded-2xl p-8 max-w-md mx-auto">
                  <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Rated Products Yet</h3>
                  <p className="text-gray-500">
                    Be the first to leave a review and help other customers discover great products!
                  </p>
                  <Button className="mt-4" asChild>
                    <Link href="/shop">
                      Browse Products
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {/* View All button for mobile */}
            <div className="text-center mt-12 md:hidden animate-fade-in animate-delay-300">
              <Button variant="gradient" size="lg" className="hover-shine" asChild>
                <Link href="/shop?sort=rating">
                  View All Rated Products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Newsletter Section - Modern glassmorphism design */}
        <section className="py-24 relative overflow-hidden">
          {/* Background with animated elements */}
          <div className="absolute inset-0 bg-gradient-primary"></div>
          <div className="absolute inset-0 bg-gradient-accent opacity-20"></div>
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full animate-float"></div>
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-white/5 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>

          <div className="container-custom relative z-10">
            <div className="max-w-4xl mx-auto text-center text-white">
              <div className="animate-fade-in">
                <h2 className="text-responsive-lg font-bold mb-6 text-shadow">
                  Stay Updated with UselfUnik
                </h2>
                <p className="text-xl mb-8 leading-relaxed opacity-95 smooth-edges">
                  Subscribe to our newsletter for exclusive deals, new product announcements,
                  early access to sales, and insider tips from our design team.
                </p>
              </div>

              {/* Enhanced newsletter form container */}
              <div className="animate-fade-in animate-delay-200">
                <div className="glass-intense rounded-2xl p-8 border border-white/30 hover-lift max-w-2xl mx-auto">
                  <NewsletterForm source="homepage" />
                </div>
              </div>

              {/* Additional benefits */}
              <div className="grid md:grid-cols-3 gap-6 mt-12 animate-fade-in animate-delay-400">
                {[
                  { icon: "🎁", title: "Exclusive Deals", desc: "Get early access to sales" },
                  { icon: "📦", title: "New Arrivals", desc: "Be first to see new products" },
                  { icon: "💡", title: "Style Tips", desc: "Insider design insights" }
                ].map((benefit, index) => (
                  <div key={index} className="text-center group">
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                      {benefit.icon}
                    </div>
                    <h3 className="font-semibold mb-1 text-shadow-sm">{benefit.title}</h3>
                    <p className="text-sm opacity-90">{benefit.desc}</p>
                  </div>
                ))}
              </div>

              {/* Trust indicators */}
              <div className="flex items-center justify-center gap-6 mt-8 text-sm opacity-80 animate-fade-in animate-delay-500">
                <span>✓ No spam, ever</span>
                <span>✓ Unsubscribe anytime</span>
                <span>✓ 10K+ subscribers</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <Logo size="lg" theme="mono-white" href="/" />
              <div className="text-white text-1xl font-bold mb-4">Be Uniquely You</div>
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
              <h3 className="text-white text-lg font-bold mb-4">Stay Connected</h3>
              <p className="mb-4">Subscribe to get special offers, free giveaways, and exclusive deals.</p>
              <NewsletterForm source="footer" />
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h4 className="text-white text-md font-semibold mb-3">Company</h4>
                <ul className="grid grid-cols-2 gap-2 text-sm">
                  <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                  <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                  <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                  <li><Link href="/affiliates" className="hover:text-white transition-colors">Affiliate Program</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white text-md font-semibold mb-3">Legal</h4>
                <ul className="grid grid-cols-2 gap-2 text-sm">
                  <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                  <li><Link href="/returns" className="hover:text-white transition-colors">Return Policy</Link></li>
                  <li><Link href="/shipping" className="hover:text-white transition-colors">Shipping Policy</Link></li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center">
              <p>© {new Date().getFullYear()} UselfUnik. All rights reserved.</p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <span className="text-sm">Made with ❤️ for unique individuals</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
