/**
 * UniQVerse Chatbot Training Script
 * Run this script to add specific training data for your e-commerce platform
 */

import { db } from "@/lib/db";

interface TrainingPattern {
    response: string;
    priority: number;
    triggers: string[];
    category?: string;
}

async function trainUniQVerseBot() {
    console.log("🤖 Starting UniQVerse-specific chatbot training...");

    // UniQVerse-specific training patterns
    const uniqversePatterns: TrainingPattern[] = [
        // Brand-specific patterns
        {
            response: "Welcome to UniQVerse! We're your destination for unique, high-quality products that stand out from the crowd. Our carefully curated collection features items you won't find anywhere else. How can I help you discover something amazing today?",
            priority: 1,
            triggers: ["uniqverse", "unique products", "what is uniqverse", "about uniqverse"],
            category: "brand"
        },

        // Product discovery
        {
            response: "🌟 I'd love to help you find something unique! UniQVerse specializes in:\n• **Artisan Crafts** - Handmade items from talented creators\n• **Tech Innovations** - Cutting-edge gadgets and accessories\n• **Lifestyle Products** - Items that enhance your daily routine\n• **Fashion Forward** - Trendy clothing and accessories\n\nWhat type of unique product are you looking for?",
            priority: 5,
            triggers: ["unique products", "what do you sell", "product categories", "browse products", "special items"],
            category: "products"
        },

        // Sustainability focus
        {
            response: "🌱 Sustainability is important to us at UniQVerse! Many of our products feature:\n• **Eco-friendly materials** and packaging\n• **Ethical manufacturing** processes\n• **Local artisan** support\n• **Renewable resources** when possible\n\nYou can filter products by 'Sustainable' in our shop to see our eco-conscious options!",
            priority: 5,
            triggers: ["sustainable", "eco-friendly", "environment", "green products", "ethical"],
            category: "sustainability"
        },

        // Gift recommendations
        {
            response: "🎁 UniQVerse is perfect for finding unique gifts! Popular gift categories:\n• **Personalized Items** - Custom engravings and designs\n• **Artisan Crafts** - One-of-a-kind handmade pieces\n• **Tech Gadgets** - Innovative and useful devices\n• **Home Decor** - Stylish pieces to enhance any space\n\nWho are you shopping for? I can suggest specific products!",
            priority: 4,
            triggers: ["gift ideas", "unique gifts", "present", "special gift", "gifting"],
            category: "gifts"
        },

        // Quality assurance
        {
            response: "✨ Quality is our top priority at UniQVerse! We ensure:\n• **Careful curation** - Every product is personally reviewed\n• **Quality testing** - Items meet our high standards\n• **Authentic materials** - Genuine, high-quality components\n• **Satisfaction guarantee** - 30-day return policy\n\nAll products come with detailed descriptions and customer reviews to help you choose!",
            priority: 4,
            triggers: ["quality", "authentic", "genuine", "standards", "quality control"],
            category: "quality"
        },

        // Customer service excellence
        {
            response: "🤝 Our customer service team is here for you:\n• **Fast Response** - Usually within 2-4 hours\n• **Expert Knowledge** - Product specialists available\n• **Personal Touch** - Real humans, not just bots\n• **Problem Solving** - We go the extra mile\n\nContact us at support@uniqverse.com or through the chat if you need human assistance!",
            priority: 4,
            triggers: ["customer service", "support team", "help desk", "contact support", "human help"],
            category: "support"
        },

        // Exclusive offerings
        {
            response: "🎯 UniQVerse exclusive features:\n• **Limited Edition** products you won't find elsewhere\n• **Early Access** to new arrivals for members\n• **Artisan Partnerships** - Direct from creators\n• **Custom Requests** - Special orders available\n\nJoin our newsletter for exclusive access to new products and special offers!",
            priority: 3,
            triggers: ["exclusive", "limited edition", "special", "unique to uniqverse", "only here"],
            category: "exclusives"
        },

        // Size and fit guidance
        {
            response: "📏 For sizing and fit, we provide:\n• **Detailed size charts** on each product page\n• **Customer photos** showing real fit\n• **Measurement guides** with helpful tips\n• **Easy exchanges** if the fit isn't perfect\n\nNeed help with a specific item? Share the product name and I'll help you find the right size!",
            priority: 4,
            triggers: ["size", "sizing", "fit", "measurements", "size chart", "what size"],
            category: "sizing"
        },

        // Care instructions
        {
            response: "🧼 Product care varies by item, but we provide:\n• **Care cards** included with delicate items\n• **Detailed instructions** on product pages\n• **Material-specific guidance** for different products\n• **Long-term maintenance** tips for durability\n\nWhich product do you need care instructions for?",
            priority: 3,
            triggers: ["care instructions", "how to clean", "maintenance", "care for", "washing"],
            category: "care"
        },

        // Artisan stories
        {
            response: "👨‍🎨 Many of our products come with amazing artisan stories! We feature:\n• **Creator profiles** - Meet the makers behind products\n• **Crafting process** - How items are made\n• **Cultural background** - Traditional techniques\n• **Personal touch** - The story behind each piece\n\nCheck product pages for 'Artisan Story' sections to learn more!",
            priority: 3,
            triggers: ["artisan", "maker", "creator", "handmade", "craft story", "who made this"],
            category: "artisans"
        },

        // Personalized greeting patterns
        {
            response: "Hi {USER_NAME}! 👋 Welcome back to UniQVerse! How can I help you today?",
            priority: 1,
            triggers: ["hello", "hi", "hey", "good morning", "good afternoon", "good evening"],
            category: "personalized_greeting"
        },

        // Order-specific patterns
        {
            response: "I'd be happy to help you check your order status! Could you please provide your order number? You can find it in your email confirmation or in your account under 'My Orders'.",
            priority: 5,
            triggers: ["my order", "order status", "where is my order", "track my order", "order tracking"],
            category: "order_inquiry"
        },

        // Account-specific patterns
        {
            response: "I can help you with your account information! What would you like to know about your account - recent orders, saved addresses, or something else?",
            priority: 4,
            triggers: ["my account", "account info", "my profile", "account details"],
            category: "account_inquiry"
        }
    ];

    try {
        // Add each pattern to the database
        for (const pattern of uniqversePatterns) {
            console.log(`Adding pattern: ${pattern.category || 'general'}`);

            // Create the pattern
            const createdPattern = await db.chatbotPattern.create({
                data: {
                    response: pattern.response,
                    priority: pattern.priority,
                    isActive: true
                }
            });

            // Add triggers for this pattern
            for (const trigger of pattern.triggers) {
                await db.chatbotTrigger.create({
                    data: {
                        phrase: trigger.toLowerCase(),
                        patternId: createdPattern.id
                    }
                });
            }
        }

        // Add website context for better understanding
        await db.websiteContext.create({
            data: {
                page: "/",
                title: "UniQVerse - Unique Products for Unique People",
                content: "UniQVerse is an e-commerce platform specializing in unique, high-quality products. We offer artisan crafts, tech innovations, lifestyle products, and fashion items that you won't find anywhere else.",
                keywords: ["unique", "ecommerce", "artisan", "tech", "lifestyle", "fashion"],
                category: "homepage",
                isActive: true
            }
        });

        await db.websiteContext.create({
            data: {
                page: "/shop",
                title: "Shop Unique Products - UniQVerse",
                content: "Browse our curated collection of unique products including artisan crafts, innovative tech gadgets, sustainable lifestyle items, and fashion-forward accessories.",
                keywords: ["shop", "products", "artisan", "tech", "sustainable", "fashion"],
                category: "catalog",
                isActive: true
            }
        });

        console.log("✅ UniQVerse chatbot training completed successfully!");
        console.log(`📊 Added ${uniqversePatterns.length} patterns with ${uniqversePatterns.reduce((acc, p) => acc + p.triggers.length, 0)} triggers`);

    } catch (error) {
        console.error("❌ Error during training:", error);
        throw error;
    }
}

// Advanced training: Add product-specific responses
async function trainProductCategories() {
    console.log("🏷️ Adding product category training...");

    const categoryPatterns = [
        {
            response: "📱 Our tech collection features innovative gadgets and accessories:\n• **Smart Home Devices** - Automate your space\n• **Unique Accessories** - Phone cases, stands, and more\n• **Productivity Tools** - Items to enhance your workflow\n• **Entertainment Gadgets** - Fun and functional devices\n\nBrowse our tech section to see the latest arrivals!",
            priority: 4,
            triggers: ["tech", "technology", "gadgets", "electronics", "smart devices"],
            category: "tech"
        },
        {
            response: "🏠 Transform your space with our home & lifestyle products:\n• **Decorative Pieces** - Art and sculptural items\n• **Functional Decor** - Beautiful and useful items\n• **Organization Solutions** - Stylish storage options\n• **Comfort Items** - Cozy additions to your home\n\nWhat room are you looking to enhance?",
            priority: 4,
            triggers: ["home decor", "lifestyle", "home", "decor", "interior", "room"],
            category: "home"
        },
        {
            response: "👗 Our fashion collection celebrates individual style:\n• **Statement Pieces** - Bold and unique items\n• **Artisan Jewelry** - Handcrafted accessories\n• **Sustainable Fashion** - Eco-conscious choices\n• **Limited Edition** - Exclusive designs\n\nWhat style are you looking for?",
            priority: 4,
            triggers: ["fashion", "clothing", "jewelry", "accessories", "style", "wear"],
            category: "fashion"
        }
    ];

    for (const pattern of categoryPatterns) {
        const createdPattern = await db.chatbotPattern.create({
            data: {
                response: pattern.response,
                priority: pattern.priority,
                isActive: true
            }
        });

        for (const trigger of pattern.triggers) {
            await db.chatbotTrigger.create({
                data: {
                    phrase: trigger.toLowerCase(),
                    patternId: createdPattern.id
                }
            });
        }
    }

    console.log("✅ Product category training completed!");
}

// Run the training
if (require.main === module) {
    trainUniQVerseBot()
        .then(() => trainProductCategories())
        .then(() => {
            console.log("🎉 All training completed!");
            process.exit(0);
        })
        .catch((error) => {
            console.error("💥 Training failed:", error);
            process.exit(1);
        });
}

export { trainUniQVerseBot };
export { trainProductCategories };
