import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";

// Website content indexing service for AI chatbot
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({
                error: "Unauthorized"
            }, { status: 401 });
        }

        const { action, data } = await req.json();

        switch (action) {
            case 'index_content':
                return await indexWebsiteContent(data);
            case 'update_context':
                return await updateWebsiteContext(data);
            case 'get_contexts':
                return await getWebsiteContexts();
            default:
                return NextResponse.json({
                    error: "Invalid action"
                }, { status: 400 });
        }

    } catch (error) {
        console.error("Website context API error:", error);
        return NextResponse.json({
            error: "Internal server error"
        }, { status: 500 });
    }
}

async function indexWebsiteContent(data: any) {
    try {
        // Auto-index common e-commerce content
        const defaultContent = await generateDefaultWebsiteContent();

        for (const content of defaultContent) {
            // Check if record exists first
            const existingContext = await db.websiteContext.findFirst({
                where: { page: content.page }
            });

            if (existingContext) {
                await db.websiteContext.update({
                    where: { id: existingContext.id },
                    data: {
                        title: content.title,
                        content: content.content,
                        keywords: content.keywords,
                        category: content.category,
                        lastUpdated: new Date(),
                        isActive: true
                    }
                });
            } else {
                await db.websiteContext.create({
                    data: content
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: `Indexed ${defaultContent.length} pages`,
            count: defaultContent.length
        });

    } catch (error) {
        console.error("Content indexing error:", error);
        return NextResponse.json({
            error: "Failed to index content"
        }, { status: 500 });
    }
}

async function updateWebsiteContext(data: {
    page: string;
    title: string;
    content: string;
    category: string;
    keywords?: string[];
}) {
    try {
        const keywords = data.keywords || extractKeywords(data.content);

        // Check if record exists first
        const existingContext = await db.websiteContext.findFirst({
            where: { page: data.page }
        });

        let context;
        if (existingContext) {
            context = await db.websiteContext.update({
                where: { id: existingContext.id },
                data: {
                    title: data.title,
                    content: data.content,
                    keywords,
                    category: data.category,
                    lastUpdated: new Date()
                }
            });
        } else {
            context = await db.websiteContext.create({
                data: {
                    page: data.page,
                    title: data.title,
                    content: data.content,
                    keywords,
                    category: data.category,
                    lastUpdated: new Date(),
                    isActive: true
                }
            });
        }

        return NextResponse.json({
            success: true,
            context
        });

    } catch (error) {
        console.error("Context update error:", error);
        return NextResponse.json({
            error: "Failed to update context"
        }, { status: 500 });
    }
}

async function getWebsiteContexts() {
    try {
        const contexts = await db.websiteContext.findMany({
            where: { isActive: true },
            orderBy: [
                { category: 'asc' },
                { lastUpdated: 'desc' }
            ]
        });

        const grouped = contexts.reduce((acc, context) => {
            if (!acc[context.category]) {
                acc[context.category] = [];
            }
            acc[context.category].push(context);
            return acc;
        }, {} as Record<string, typeof contexts>);

        return NextResponse.json({
            success: true,
            contexts: grouped,
            total: contexts.length
        });

    } catch (error) {
        console.error("Get contexts error:", error);
        return NextResponse.json({
            error: "Failed to get contexts"
        }, { status: 500 });
    }
}

async function generateDefaultWebsiteContent() {
    return [
        {
            page: '/shipping',
            title: 'Shipping Information',
            content: `Uniqverse offers multiple shipping options: Standard Shipping (3-5 business days, free over $50), Express Shipping (2-3 business days, $9.99), and Next Day Delivery (next business day, $19.99). We ship internationally to most countries with delivery times of 7-14 business days. All orders are processed within 24 hours on business days. You can track your order through your account or using the tracking link in your shipping confirmation email.`,
            keywords: ['shipping', 'delivery', 'tracking', 'international', 'express', 'standard'],
            category: 'shipping'
        },
        {
            page: '/returns',
            title: 'Returns & Exchanges',
            content: `Our return policy allows returns within 30 days of delivery. Items must be unused, in original packaging, and in the same condition you received them. To initiate a return, log into your account and go to your orders, or contact our support team. Refunds are processed within 5-7 business days after we receive and inspect the returned item. Personalized or custom items cannot be returned unless defective. Return shipping costs are the customer's responsibility unless the item is defective.`,
            keywords: ['returns', 'refund', 'exchange', 'policy', 'defective', 'unused'],
            category: 'returns'
        },
        {
            page: '/payment',
            title: 'Payment Methods',
            content: `Uniqverse accepts all major credit cards (Visa, MasterCard, American Express, Discover), PayPal, Apple Pay, and Google Pay. All transactions are secured with industry-standard encryption and SSL certificates. We do not store your payment information on our servers. For payment issues or failed transactions, please contact our support team. We also accept gift cards and store credit.`,
            keywords: ['payment', 'credit card', 'paypal', 'apple pay', 'google pay', 'secure'],
            category: 'payment'
        },
        {
            page: '/account',
            title: 'Account Management',
            content: `Create an account to track orders, save favorites, and speed up checkout. To register, click 'Account' in the top navigation and select 'Register'. You can reset your password through the login page using 'Forgot Password'. Your account dashboard shows order history, shipping addresses, payment methods, and personal information. You can update your information anytime or contact support to delete your account.`,
            keywords: ['account', 'register', 'login', 'password', 'profile', 'dashboard'],
            category: 'account'
        },
        {
            page: '/products',
            title: 'Product Information',
            content: `Uniqverse specializes in unique and high-quality products across various categories. Product inventory is updated in real-time on our website. Most products come with a standard 1-year manufacturer warranty. Each product page includes detailed descriptions, specifications, customer reviews, and high-resolution images. You can filter and sort products by price, rating, brand, and other attributes. Out-of-stock items can be backordered with estimated restock dates.`,
            keywords: ['products', 'inventory', 'warranty', 'quality', 'unique', 'specifications'],
            category: 'products'
        },
        {
            page: '/contact',
            title: 'Contact Support',
            content: `Contact Uniqverse support via email at support@uniqverse.com or phone at 1-800-555-1234. Our business hours are Monday-Friday 9:00 AM - 6:00 PM EST, and Saturday 10:00 AM - 4:00 PM EST. We're closed on Sundays and major holidays. You can also submit a support ticket through your account dashboard or use our live chat during business hours. Our address is 123 Commerce Street, Suite 500, New York, NY 10001.`,
            keywords: ['contact', 'support', 'email', 'phone', 'hours', 'ticket'],
            category: 'support'
        },
        {
            page: '/orders',
            title: 'Order Management',
            content: `Track your orders through your account dashboard or using the tracking number from your shipping confirmation email. Orders can be cancelled within 1 hour of placing if they haven't been processed yet. You cannot modify orders after placement, but you can cancel (if eligible) and reorder. Order status updates include: Processing, Shipped, Out for Delivery, and Delivered. For order issues, contact support with your order number.`,
            keywords: ['orders', 'tracking', 'cancel', 'modify', 'status', 'processing'],
            category: 'orders'
        },
        {
            page: '/promotions',
            title: 'Promotions & Discounts',
            content: `Stay updated on Uniqverse promotions through our newsletter and social media. We offer seasonal sales, clearance events, and exclusive member discounts. Promo codes can be applied at checkout in the discount field. Some promotions have minimum purchase requirements or exclude certain items. Gift cards are available in various denominations and never expire. Student and military discounts are available with valid verification.`,
            keywords: ['promotions', 'discounts', 'sales', 'promo codes', 'gift cards', 'student'],
            category: 'promotions'
        },
        {
            page: '/security',
            title: 'Privacy & Security',
            content: `Uniqverse takes your privacy and security seriously. We use SSL encryption for all transactions and never store payment information. Our privacy policy outlines how we collect, use, and protect your data. You can review and update your privacy settings in your account dashboard. We comply with GDPR and other international privacy regulations. For security concerns, contact our security team immediately.`,
            keywords: ['privacy', 'security', 'ssl', 'encryption', 'gdpr', 'data protection'],
            category: 'security'
        },
        {
            page: '/about',
            title: 'About Uniqverse',
            content: `Uniqverse is an e-commerce platform dedicated to offering unique and high-quality products. Founded with the mission to provide exceptional customer service and curated product selection, we strive to make online shopping enjoyable and reliable. Our team is committed to innovation, sustainability, and customer satisfaction. We partner with trusted suppliers worldwide to bring you the best products at competitive prices.`,
            keywords: ['about', 'mission', 'quality', 'customer service', 'innovation', 'sustainability'],
            category: 'company'
        }
    ];
}

function extractKeywords(text: string): string[] {
    const cleanText = text.toLowerCase().replace(/[^\w\s]/g, '');
    const words = cleanText.split(/\s+/);

    const stopWords = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
        'be', 'been', 'being', 'in', 'on', 'at', 'to', 'for', 'with', 'about', 'by',
        'of', 'from', 'up', 'down', 'that', 'this', 'these', 'those', 'them', 'they',
        'their', 'i', 'me', 'my', 'mine', 'you', 'your', 'yours']);

    const wordFreq = new Map<string, number>();

    words.forEach(word => {
        if (word.length > 3 && !stopWords.has(word)) {
            wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
        }
    });

    return Array.from(wordFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word]) => word);
}

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({
                error: "Unauthorized"
            }, { status: 401 });
        }

        return await getWebsiteContexts();

    } catch (error) {
        console.error("Get website contexts error:", error);
        return NextResponse.json({
            error: "Internal server error"
        }, { status: 500 });
    }
}
