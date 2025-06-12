import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || ""
});

// AI Product Search and Recommendation API
export async function POST(req: NextRequest) {
    try {
        const { query, context, maxResults = 6 } = await req.json();

        if (!query) {
            return NextResponse.json({
                error: "Search query is required"
            }, { status: 400 });
        }

        // Analyze user intent and extract search criteria
        const searchCriteria = await analyzeSearchIntent(query, context);        // Search for products based on criteria
        const searchResult = await searchProducts(searchCriteria, maxResults);

        // Generate personalized recommendations
        const recommendations = await generateRecommendations(
            query,
            searchResult.products,
            searchCriteria
        );

        return NextResponse.json({
            success: true,
            intent: searchCriteria,
            products: searchResult.products,
            fallbackProducts: searchResult.fallbackProducts,
            fallbackMessage: searchResult.fallbackMessage,
            recommendations,
            searchQuery: query
        });

    } catch (error) {
        console.error("AI Product Search error:", error);
        return NextResponse.json({
            error: "Internal server error"
        }, { status: 500 });
    }
}

async function analyzeSearchIntent(query: string, context?: any) {
    try {
        if (!process.env.OPENAI_API_KEY) {
            // Fallback to enhanced keyword analysis with fuzzy search
            return analyzeSearchIntentBasic(query);
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: `You are a shopping assistant AI. Analyze user queries to extract search criteria for an e-commerce store.

Extract the following information from the user's message:
- recipient: who is this for? (self, wife, husband, kids, etc.)
- occasion: what's the occasion? (birthday, anniversary, christmas, etc.)
- category: what type of product? (clothing, electronics, accessories, etc.)
- gender: target gender (male, female, unisex)
- priceRange: budget indication (budget, mid-range, luxury, or specific amounts)
- style: style preferences (casual, formal, trendy, classic, etc.)
- keywords: relevant search terms

Return a JSON object with these fields. If information is not available, use null.`
                },
                {
                    role: "user",
                    content: query
                }
            ],
            max_tokens: 300,
            temperature: 0.3
        });

        const response = completion.choices[0]?.message?.content;
        if (response) {
            try {
                return JSON.parse(response);
            } catch (parseError) {
                console.error("Failed to parse AI response:", parseError);
                return analyzeSearchIntentBasic(query);
            }
        }

        return analyzeSearchIntentBasic(query);

    } catch (error) {
        console.error("AI intent analysis error:", error);
        return analyzeSearchIntentBasic(query);
    }
}

function analyzeSearchIntentBasic(query: string) {
    const lowerQuery = query.toLowerCase();

    // Enhanced fuzzy search patterns with synonyms and variations
    const criteria: any = {
        recipient: null,
        occasion: null,
        category: null,
        gender: null,
        priceRange: null,
        style: null,
        keywords: []
    };

    // Enhanced category patterns with fuzzy search
    const categoryPatterns = {
        'clothing': ['clothes', 'clothing', 'apparel', 'wear', 'outfit', 'dress', 'shirt', 'pants', 'top', 'bottom', 'garment', 'blazer', 'jacket', 'sweater', 'blouse', 'skirt', 'jeans', 'hoodie', 'coat'],
        'accessories': ['accessories', 'accessory', 'jewelry', 'jewellery', 'bag', 'bags', 'handbag', 'purse', 'wallet', 'belt', 'watch', 'necklace', 'earrings', 'bracelet', 'scarf', 'hat', 'sunglasses'],
        'shoes': ['shoes', 'shoe', 'footwear', 'sneakers', 'boots', 'sandals', 'heels', 'flats', 'loafers', 'pumps', 'slippers', 'athletic shoes'],
        'electronics': ['electronics', 'electronic', 'gadget', 'gadgets', 'tech', 'technology', 'device', 'phone', 'laptop', 'computer', 'tablet', 'headphones'],
        'home': ['home', 'house', 'household', 'decor', 'decoration', 'furniture', 'kitchen', 'bedroom', 'living room', 'bath', 'bathroom'],
        'beauty': ['beauty', 'makeup', 'cosmetics', 'skincare', 'fragrance', 'perfume', 'lipstick', 'foundation', 'mascara', 'nail polish'],
        'sports': ['sports', 'sport', 'fitness', 'gym', 'exercise', 'workout', 'athletic', 'running', 'yoga', 'swimming']
    };

    const genderPatterns = {
        'male': ['men', 'male', 'man', 'mens', 'masculine', 'guy', 'guys', 'him', 'his', 'husband', 'boyfriend', 'father', 'dad', 'brother', 'son', 'boy'],
        'female': ['women', 'female', 'woman', 'womens', 'feminine', 'lady', 'ladies', 'her', 'hers', 'wife', 'girlfriend', 'mother', 'mom', 'sister', 'daughter', 'girl'],
        'unisex': ['unisex', 'both', 'everyone', 'anyone', 'people', 'family', 'couple']
    };

    const occasionPatterns = {
        'formal': ['formal', 'business', 'office', 'work', 'professional', 'suit', 'dress up', 'elegant', 'sophisticated', 'corporate'],
        'casual': ['casual', 'everyday', 'comfortable', 'relaxed', 'informal', 'weekend', 'leisure', 'daily', 'regular'],
        'party': ['party', 'celebration', 'night out', 'club', 'bar', 'dancing', 'festive', 'fun', 'social'],
        'wedding': ['wedding', 'bride', 'groom', 'marriage', 'ceremony', 'reception', 'bridal', 'matrimony'],
        'gift': ['gift', 'present', 'birthday', 'anniversary', 'christmas', 'valentine', 'holiday', 'surprise', 'special occasion'],
        'summer': ['summer', 'beach', 'vacation', 'hot weather', 'sunny', 'tropical', 'warm', 'outdoors'],
        'winter': ['winter', 'cold', 'warm', 'cozy', 'snow', 'holiday', 'christmas', 'fall', 'autumn']
    };

    const pricePatterns = {
        'budget': ['cheap', 'affordable', 'budget', 'inexpensive', 'low cost', 'bargain', 'deal', 'under', 'economical', 'value'],
        'mid-range': ['reasonable', 'moderate', 'fair price', 'decent', 'good value', 'medium price', 'average cost'],
        'luxury': ['expensive', 'luxury', 'premium', 'high end', 'designer', 'exclusive', 'fancy', 'upscale', 'elite', 'top quality']
    };

    const stylePatterns = {
        'modern': ['modern', 'contemporary', 'current', 'trendy', 'fashionable', 'stylish', 'chic', 'up-to-date'],
        'classic': ['classic', 'traditional', 'timeless', 'vintage', 'retro', 'old school', 'conventional'],
        'minimalist': ['minimalist', 'simple', 'clean', 'basic', 'plain', 'understated', 'subtle'],
        'bohemian': ['bohemian', 'boho', 'hippie', 'free spirit', 'artistic', 'eclectic', 'ethnic'],
        'elegant': ['elegant', 'sophisticated', 'refined', 'classy', 'graceful', 'polished', 'luxurious']
    };

    // Recipient detection with enhanced patterns
    if (lowerQuery.includes('wife') || lowerQuery.includes('girlfriend') || lowerQuery.includes('spouse')) {
        criteria.recipient = 'wife';
        criteria.gender = 'female';
    } else if (lowerQuery.includes('husband') || lowerQuery.includes('boyfriend')) {
        criteria.recipient = 'husband';
        criteria.gender = 'male';
    } else if (lowerQuery.includes('mother') || lowerQuery.includes('mom') || lowerQuery.includes('mama')) {
        criteria.recipient = 'mother';
        criteria.gender = 'female';
    } else if (lowerQuery.includes('father') || lowerQuery.includes('dad') || lowerQuery.includes('papa')) {
        criteria.recipient = 'father';
        criteria.gender = 'male';
    }

    // Enhanced fuzzy matching for all patterns
    for (const [category, patterns] of Object.entries(categoryPatterns)) {
        if (patterns.some(pattern => lowerQuery.includes(pattern))) {
            criteria.category = category;
            break;
        }
    }

    for (const [gender, patterns] of Object.entries(genderPatterns)) {
        if (patterns.some(pattern => lowerQuery.includes(pattern))) {
            criteria.gender = gender;
            break;
        }
    }

    for (const [occasion, patterns] of Object.entries(occasionPatterns)) {
        if (patterns.some(pattern => lowerQuery.includes(pattern))) {
            criteria.occasion = occasion;
            break;
        }
    }

    for (const [priceRange, patterns] of Object.entries(pricePatterns)) {
        if (patterns.some(pattern => lowerQuery.includes(pattern))) {
            criteria.priceRange = priceRange;
            break;
        }
    }

    for (const [style, patterns] of Object.entries(stylePatterns)) {
        if (patterns.some(pattern => lowerQuery.includes(pattern))) {
            criteria.style = style;
            break;
        }
    }

    // Enhanced keyword extraction with better filtering
    const words = lowerQuery.split(/\s+/);
    const stopWords = ['want', 'need', 'looking', 'find', 'search', 'help', 'please', 'can', 'you', 'me', 'i', 'am', 'for', 'a', 'an', 'the', 'some', 'any', 'with', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'from'];
    const relevantWords = words.filter(word =>
        word.length > 2 && !stopWords.includes(word)
    );
    criteria.keywords = relevantWords;

    return criteria;
}

async function searchProducts(criteria: any, maxResults: number) {
    try {
        // Build database query based on search criteria
        const whereConditions: any = {
            isPublished: true,
            isDeleted: false
        };

        // Category filtering with fuzzy matching
        if (criteria.category) {
            const category = await db.category.findFirst({
                where: {
                    OR: [
                        { name: { contains: criteria.category, mode: 'insensitive' } },
                        { slug: { contains: criteria.category, mode: 'insensitive' } }
                    ]
                }
            });
            if (category) {
                whereConditions.categoryId = category.id;
            }
        }

        // Enhanced text search with multiple fields
        if (criteria.keywords && criteria.keywords.length > 0) {
            const searchTerms = criteria.keywords;
            whereConditions.OR = [];

            // Search each keyword in multiple fields
            searchTerms.forEach(term => {
                whereConditions.OR.push(
                    { name: { contains: term, mode: 'insensitive' } },
                    { description: { contains: term, mode: 'insensitive' } },
                    { tags: { contains: term, mode: 'insensitive' } }
                );
            });

            // Also search for combined terms
            const combinedTerms = searchTerms.join(' ');
            whereConditions.OR.push(
                { name: { contains: combinedTerms, mode: 'insensitive' } },
                { description: { contains: combinedTerms, mode: 'insensitive' } }
            );
        }

        // Gender-based filtering (if we have gender tags)
        if (criteria.gender && criteria.gender !== 'unisex') {
            if (!whereConditions.OR) whereConditions.OR = [];
            whereConditions.OR.push({
                tags: { contains: criteria.gender, mode: 'insensitive' }
            });
        }

        // Price range filtering
        if (criteria.priceRange) {
            if (criteria.priceRange === 'budget') {
                whereConditions.price = { lte: 30 };
            } else if (criteria.priceRange === 'mid-range') {
                whereConditions.price = { gte: 30, lte: 100 };
            } else if (criteria.priceRange === 'luxury') {
                whereConditions.price = { gte: 100 };
            }
        }

        let products = await db.product.findMany({
            where: whereConditions,
            include: {
                category: { select: { name: true, slug: true } },
                images: { take: 1, orderBy: { position: 'asc' } },
                reviews: {
                    select: { rating: true },
                    take: 10
                }
            },
            take: maxResults,
            orderBy: [
                { isFeatured: 'desc' },
                { createdAt: 'desc' }
            ]
        });        // If no products found, try fallback search with relaxed criteria
        let fallbackProducts: any[] | null = null;
        let fallbackMessage: string | null = null;

        if (products.length === 0) {
            console.log("No products found, trying fallback search...");
            const fallbackResult = await getFallbackProducts(criteria, maxResults);
            fallbackProducts = fallbackResult.products;
            fallbackMessage = fallbackResult.message;
        }

        // Calculate average ratings and format products
        const formattedProducts = products.map(product => {
            const avgRating = product.reviews.length > 0
                ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
                : 0;

            return {
                id: product.id,
                name: product.name,
                description: product.description,
                price: product.price,
                compareAtPrice: product.compareAtPrice,
                category: product.category?.name,
                image: product.images[0]?.url || '/placeholder-product.jpg',
                rating: Math.round(avgRating * 10) / 10,
                reviewCount: product.reviews.length,
                slug: product.slug,
                tags: product.tags ? product.tags.split(',') : []
            };
        });

        // Format fallback products if they exist
        const formattedFallbackProducts = fallbackProducts ? fallbackProducts.map(product => {
            const avgRating = product.reviews.length > 0
                ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
                : 0;

            return {
                id: product.id,
                name: product.name,
                description: product.description,
                price: product.price,
                compareAtPrice: product.compareAtPrice,
                category: product.category?.name,
                image: product.images[0]?.url || '/placeholder-product.jpg',
                rating: Math.round(avgRating * 10) / 10,
                reviewCount: product.reviews.length,
                slug: product.slug,
                tags: product.tags ? product.tags.split(',') : []
            };
        }) : null;

        return {
            products: formattedProducts,
            fallbackProducts: formattedFallbackProducts,
            fallbackMessage
        };
    } catch (error) {
        console.error("Product search error:", error);
        return {
            products: [],
            fallbackProducts: null,
            fallbackMessage: null
        };
    }
}

// New fallback function for when no products are found
async function getFallbackProducts(criteria: any, maxResults: number) {
    try {
        console.log("Executing fallback search with criteria:", criteria);

        // Try broader category search first
        let fallbackProducts: any[] = [];

        if (criteria.category) {
            // Get all categories and find similar ones
            const allCategories = await db.category.findMany();
            const similarCategories = allCategories.filter(cat =>
                cat.name.toLowerCase().includes(criteria.category.substring(0, 3)) ||
                criteria.category.includes(cat.name.toLowerCase().substring(0, 3))
            );

            if (similarCategories.length > 0) {
                fallbackProducts = await db.product.findMany({
                    where: {
                        isPublished: true,
                        isDeleted: false,
                        categoryId: { in: similarCategories.map(cat => cat.id) }
                    },
                    include: {
                        category: { select: { name: true, slug: true } },
                        images: { take: 1, orderBy: { position: 'asc' } },
                        reviews: { select: { rating: true }, take: 10 }
                    },
                    take: maxResults,
                    orderBy: [
                        { isFeatured: 'desc' },
                        { createdAt: 'desc' }
                    ]
                });
            }
        }

        // If still no products, try gender-based recommendations
        if (fallbackProducts.length === 0 && criteria.gender) {
            fallbackProducts = await db.product.findMany({
                where: {
                    isPublished: true,
                    isDeleted: false,
                    OR: [
                        { tags: { contains: criteria.gender, mode: 'insensitive' } },
                        { name: { contains: criteria.gender, mode: 'insensitive' } },
                        { description: { contains: criteria.gender, mode: 'insensitive' } }
                    ]
                },
                include: {
                    category: { select: { name: true, slug: true } },
                    images: { take: 1, orderBy: { position: 'asc' } },
                    reviews: { select: { rating: true }, take: 10 }
                },
                take: maxResults,
                orderBy: [
                    { isFeatured: 'desc' },
                    { createdAt: 'desc' }
                ]
            });
        }

        // If still no products, get featured/popular products
        if (fallbackProducts.length === 0) {
            console.log("No category/gender matches, getting featured products");
            fallbackProducts = await db.product.findMany({
                where: {
                    isPublished: true,
                    isDeleted: false,
                    isFeatured: true
                },
                include: {
                    category: { select: { name: true, slug: true } },
                    images: { take: 1, orderBy: { position: 'asc' } },
                    reviews: { select: { rating: true }, take: 10 }
                },
                take: maxResults,
                orderBy: [
                    { featuredOrder: 'asc' },
                    { createdAt: 'desc' }
                ]
            });
        }

        // Last resort: get any recent products
        if (fallbackProducts.length === 0) {
            console.log("No featured products, getting recent products");
            fallbackProducts = await db.product.findMany({
                where: {
                    isPublished: true,
                    isDeleted: false
                },
                include: {
                    category: { select: { name: true, slug: true } },
                    images: { take: 1, orderBy: { position: 'asc' } },
                    reviews: { select: { rating: true }, take: 10 }
                },
                take: maxResults,
                orderBy: {
                    createdAt: 'desc'
                }
            });
        } console.log(`Fallback search returned ${fallbackProducts.length} products`);

        // Generate appropriate fallback message based on what was found
        let message = "I couldn't find exact matches for your search, but here are some similar products you might like:";

        if (criteria.category && fallbackProducts.length > 0) {
            message = `I couldn't find products matching your exact search, but here are some ${criteria.category}-related items:`;
        } else if (criteria.gender && fallbackProducts.length > 0) {
            message = `I couldn't find products matching your exact search, but here are some ${criteria.gender} products:`;
        } else if (fallbackProducts.length > 0) {
            message = "I couldn't find exact matches, but here are some popular products you might like:";
        }

        return {
            products: fallbackProducts,
            message: message
        };

    } catch (error) {
        console.error("Fallback search error:", error);
        return {
            products: [],
            message: null
        };
    }
}

async function generateRecommendations(query: string, products: any[], criteria: any) {
    if (!process.env.OPENAI_API_KEY || products.length === 0) {
        return {
            message: `I found ${products.length} products that might work for you!`,
            suggestions: products.length > 0 ? [
                "Tell me more about the first product",
                "Show me similar items",
                "What's the return policy?"
            ] : [
                "Try a different search",
                "Browse all products",
                "Contact support for help"
            ]
        };
    }

    try {
        const productSummary = products.slice(0, 3).map(p =>
            `${p.name} - $${p.price} (${p.category})`
        ).join(', ');

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: `You are a helpful shopping assistant. Generate a friendly, personalized response about product recommendations. Be enthusiastic and helpful. Keep responses under 150 words.`
                },
                {
                    role: "user",
                    content: `The user asked: "${query}"
                    
Search criteria: ${JSON.stringify(criteria)}
Products found: ${productSummary}

Generate a helpful response explaining what you found and why these might be good choices.`
                }
            ],
            max_tokens: 200,
            temperature: 0.7
        });

        const aiMessage = completion.choices[0]?.message?.content ||
            `I found ${products.length} great options for you!`;

        return {
            message: aiMessage,
            suggestions: [
                "Tell me more about these products",
                "Show me different options",
                "What's the price range?",
                "Help me choose between them"
            ]
        };

    } catch (error) {
        console.error("Recommendation generation error:", error);
        return {
            message: `I found ${products.length} products that might be perfect for what you're looking for!`,
            suggestions: [
                "Tell me more about these products",
                "Show me different options",
                "Help me narrow down choices"
            ]
        };
    }
}
