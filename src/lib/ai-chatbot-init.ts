import { db } from "@/lib/db";

export async function initializeAIChatbot() {
    try {
        console.log("Initializing AI Chatbot with comprehensive data...");

        // Clear existing data first
        await db.chatbotTrigger.deleteMany({});
        await db.chatbotPattern.deleteMany({});
        await db.chatbotFallback.deleteMany({});
        await db.websiteContext.deleteMany({});

        // Initialize comprehensive chatbot patterns
        const patterns = [
            // Greeting patterns
            {
                response: "Hello! Welcome to UniQVerse! I'm here to help you with any questions about our products, orders, shipping, returns, and more. How can I assist you today?",
                priority: 1,
                triggers: ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "start", "begin"]
            },
            
            // Shipping patterns
            {
                response: "We offer multiple shipping options:\n• **Standard Shipping**: 3-5 business days (FREE on orders over $50)\n• **Express Shipping**: 2-3 business days ($9.99)\n• **Next Day Delivery**: Next business day ($19.99)\n\nWe also ship internationally to most countries (7-14 business days). You can track your order anytime through your account or using the tracking link in your shipping confirmation email.",
                priority: 5,
                triggers: ["shipping", "delivery", "ship", "deliver", "how long", "shipping cost", "shipping time", "international shipping"]
            },
            
            // Order tracking
            {
                response: "To track your order:\n1. **Log into your account** and go to 'My Orders'\n2. **Use the tracking link** in your shipping confirmation email\n3. **Contact us** with your order number if you need assistance\n\nAll orders are processed within 24 hours on business days. Would you like me to help you find your order status?",
                priority: 5,
                triggers: ["track order", "order status", "where is my order", "tracking", "track my package", "order tracking"]
            },
            
            // Returns and refunds
            {
                response: "Our return policy is customer-friendly:\n• **30-day return window** from delivery date\n• Items must be **unused and in original packaging**\n• **Free returns** for defective items\n• **5-7 business days** for refund processing\n\nTo start a return: Log into your account → My Orders → Select the item → Return. Need help with a specific return?",
                priority: 5,
                triggers: ["return", "refund", "exchange", "send back", "defective", "return policy", "money back"]
            },
            
            // Product questions
            {
                response: "I'd be happy to help with product questions! You can:\n• **Browse our catalog** with detailed descriptions and reviews\n• **Use filters** to find exactly what you need\n• **Check product pages** for specifications and availability\n• **Read customer reviews** for real experiences\n\nWhat specific product are you looking for?",
                priority: 4,
                triggers: ["product", "item", "size", "color", "availability", "stock", "find product", "search"]
            },
            
            // Account help
            {
                response: "For account assistance:\n• **Reset password**: Use 'Forgot Password' on the login page\n• **Update info**: Go to Account Settings\n• **Order history**: Check 'My Orders' section\n• **Addresses**: Manage in 'Address Book'\n\nNeed help with something specific in your account?",
                priority: 4,
                triggers: ["account", "login", "password", "register", "profile", "account settings", "forgot password"]
            },
            
            // Payment questions
            {
                response: "We accept secure payments via:\n• **Credit Cards**: Visa, MasterCard, American Express, Discover\n• **Digital Wallets**: PayPal, Apple Pay, Google Pay\n• **Gift Cards**: Available in various denominations\n\nAll transactions use **industry-standard encryption**. Having payment issues? I can help troubleshoot!",
                priority: 4,
                triggers: ["payment", "credit card", "paypal", "apple pay", "google pay", "payment methods", "pay", "billing"]
            },
            
            // Contact information
            {
                response: "You can reach our support team:\n• **Email**: support@uniqverse.com\n• **Phone**: 1-800-555-1234\n• **Hours**: Monday-Friday 9AM-6PM EST, Saturday 10AM-4PM EST\n• **Live Chat**: Right here with me!\n\nI'm available 24/7 to help with most questions. What can I assist you with?",
                priority: 3,
                triggers: ["contact", "support", "phone", "email", "help", "customer service", "call", "reach you"]
            },
            
            // Order issues
            {
                response: "I can help with order concerns:\n• **Modify orders**: Only within 1 hour of placing (if not processed)\n• **Cancel orders**: Contact us immediately with your order number\n• **Order problems**: I'll connect you with our team\n• **Payment issues**: Let's troubleshoot together\n\nWhat's your order number? I'll see how I can help!",
                priority: 5,
                triggers: ["order problem", "cancel order", "modify order", "order issue", "wrong order", "payment failed"]
            },
            
            // Promotions and discounts
            {
                response: "Great deals await! Here's how to save:\n• **Newsletter signup**: Get exclusive discounts\n• **Student discount**: Available with verification\n• **Seasonal sales**: Check our promotions page\n• **Promo codes**: Apply at checkout\n\nCurrently running promotions? Check our homepage for the latest deals!",
                priority: 3,
                triggers: ["discount", "promo", "sale", "coupon", "promotion", "deal", "save money", "student discount"]
            },
            
            // Technical issues
            {
                response: "Having technical difficulties? Let's fix that:\n• **Clear browser cache** and try again\n• **Check internet connection**\n• **Try a different browser** or device\n• **Disable ad blockers** temporarily\n\nIf the issue persists, I'll connect you with our technical support team. What specific problem are you experiencing?",
                priority: 4,
                triggers: ["error", "bug", "not working", "broken", "issue", "problem", "technical", "website down", "can't access"]
            },
            
            // Thanks and appreciation
            {
                response: "You're very welcome! I'm so glad I could help. 😊\n\nIs there anything else you'd like to know about UniQVerse? I'm here whenever you need assistance!",
                priority: 2,
                triggers: ["thank", "thanks", "appreciate", "helpful", "great", "awesome", "perfect"]
            },
            
            // Goodbye
            {
                response: "Thanks for choosing UniQVerse! Have a wonderful day and happy shopping! 🛍️\n\nRemember, I'm always here if you need help. Take care!",
                priority: 1,
                triggers: ["bye", "goodbye", "see you", "later", "done", "finished", "end chat"]
            }
        ];

        // Create patterns and triggers
        for (const patternData of patterns) {
            const pattern = await db.chatbotPattern.create({
                data: {
                    response: patternData.response,
                    priority: patternData.priority,
                    isActive: true
                }
            });

            // Create triggers for this pattern
            for (const trigger of patternData.triggers) {
                await db.chatbotTrigger.create({
                    data: {
                        phrase: trigger.toLowerCase(),
                        patternId: pattern.id
                    }
                });
            }
        }

        // Add fallback responses
        const fallbacks = [
            "I'm not quite sure about that specific question, but I'd love to help! Could you rephrase it or let me know more details?",
            "That's an interesting question! For the most accurate information, you might want to contact our support team at support@uniqverse.com or 1-800-555-1234.",
            "I want to make sure I give you the right information. Could you be more specific about what you're looking for?",
            "I'm here to help with questions about products, orders, shipping, returns, and more. What specifically can I assist you with?",
            "Let me connect you with our human support team who can provide detailed assistance. You can reach them at support@uniqverse.com or 1-800-555-1234."
        ];

        for (const fallbackResponse of fallbacks) {
            await db.chatbotFallback.create({
                data: {
                    response: fallbackResponse
                }
            });
        }

        // Initialize comprehensive website context
        const websiteContexts = [
            {
                page: "/",
                title: "UniQVerse Homepage",
                content: "UniQVerse is your premier destination for unique, high-quality products. We specialize in curated selections across multiple categories with exceptional customer service, fast shipping, and easy returns. Browse our featured products, seasonal sales, and exclusive collections.",
                keywords: ["homepage", "uniqverse", "shopping", "products", "quality", "unique", "featured"],
                category: "homepage"
            },
            {
                page: "/shipping",
                title: "Shipping & Delivery Information",
                content: "UniQVerse offers multiple shipping options to meet your needs. Standard Shipping takes 3-5 business days and is FREE on orders over $50. Express Shipping delivers in 2-3 business days for $9.99. Next Day Delivery arrives the next business day for $19.99. We ship internationally to most countries with delivery times of 7-14 business days. All orders are processed within 24 hours on business days Monday through Friday. Track your order through your account dashboard or use the tracking link in your shipping confirmation email.",
                keywords: ["shipping", "delivery", "tracking", "standard", "express", "international", "free", "fast"],
                category: "shipping"
            },
            {
                page: "/returns",
                title: "Returns & Exchange Policy",
                content: "Our customer-friendly return policy allows returns within 30 days of delivery. Items must be unused, in original packaging, and in the same condition you received them. To initiate a return, log into your account, go to your orders section, and select the return option, or contact our support team. Refunds are processed within 5-7 business days after we receive and inspect the returned item. Return shipping costs are the customer's responsibility unless the item is defective or damaged. Personalized or custom items cannot be returned unless defective.",
                keywords: ["returns", "refund", "exchange", "policy", "30 days", "unused", "packaging", "defective"],
                category: "returns"
            },
            {
                page: "/contact",
                title: "Contact & Customer Support",
                content: "Contact UniQVerse support for any assistance. Email us at support@uniqverse.com or call 1-800-555-1234. Our business hours are Monday-Friday 9:00 AM - 6:00 PM EST, and Saturday 10:00 AM - 4:00 PM EST. We're closed on Sundays and major holidays. You can also submit a support ticket through your account dashboard or use our 24/7 AI chat assistant. Our physical address is 123 Commerce Street, Suite 500, New York, NY 10001.",
                keywords: ["contact", "support", "email", "phone", "hours", "customer service", "help"],
                category: "support"
            },
            {
                page: "/account",
                title: "Account Management",
                content: "Manage your UniQVerse account easily. Create an account to track orders, save favorites, speed up checkout, and access exclusive member benefits. Register by clicking Account in the top navigation and selecting Register. Reset your password through the login page using Forgot Password. Your account dashboard shows order history, shipping addresses, payment methods, wishlist, and personal information. Update your information anytime or contact support to delete your account.",
                keywords: ["account", "register", "login", "password", "dashboard", "profile", "orders", "wishlist"],
                category: "account"
            },
            {
                page: "/payment",
                title: "Payment Methods & Security",
                content: "UniQVerse accepts all major credit cards including Visa, MasterCard, American Express, and Discover. We also accept PayPal, Apple Pay, and Google Pay for your convenience. All transactions are secured with industry-standard encryption and SSL certificates. We do not store your payment information on our servers for maximum security. Gift cards are available in various denominations and never expire. Student and military discounts are available with valid verification.",
                keywords: ["payment", "credit card", "paypal", "apple pay", "secure", "encryption", "gift cards"],
                category: "payment"
            }
        ];

        for (const context of websiteContexts) {
            await db.websiteContext.create({
                data: {
                    page: context.page,
                    title: context.title,
                    content: context.content,
                    keywords: context.keywords,
                    category: context.category,
                    lastUpdated: new Date(),
                    isActive: true
                }
            });
        }

        console.log(`✅ Successfully initialized AI Chatbot with:`);
        console.log(`   • ${patterns.length} response patterns`);
        console.log(`   • ${patterns.reduce((sum, p) => sum + p.triggers.length, 0)} trigger phrases`);
        console.log(`   • ${fallbacks.length} fallback responses`);
        console.log(`   • ${websiteContexts.length} website context entries`);

        return {
            success: true,
            patterns: patterns.length,
            triggers: patterns.reduce((sum, p) => sum + p.triggers.length, 0),
            fallbacks: fallbacks.length,
            contexts: websiteContexts.length
        };

    } catch (error) {
        console.error("Error initializing AI Chatbot:", error);
        throw error;
    }
}

export async function validateChatbotSetup() {
    try {
        const [patterns, triggers, fallbacks, contexts] = await Promise.all([
            db.chatbotPattern.count(),
            db.chatbotTrigger.count(),
            db.chatbotFallback.count(),
            db.websiteContext.count()
        ]);

        const isSetup = patterns > 0 && triggers > 0 && fallbacks > 0 && contexts > 0;

        return {
            isSetup,
            patterns,
            triggers,
            fallbacks,
            contexts
        };
    } catch (error) {
        console.error("Error validating chatbot setup:", error);
        return {
            isSetup: false,
            patterns: 0,
            triggers: 0,
            fallbacks: 0,
            contexts: 0
        };
    }
}
