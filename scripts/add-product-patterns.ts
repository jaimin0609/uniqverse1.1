/**
 * Enhanced Training Script for Product-Specific Queries
 * Adds patterns for clothing, fashion, and specific product requests
 */

import { db } from "@/lib/db";

interface ProductPattern {
    response: string;
    priority: number;
    triggers: string[];
    category: string;
}

export async function addProductSpecificPatterns() {
    console.log("🛍️ Adding product-specific patterns...");

    const productPatterns: ProductPattern[] = [
        // Fashion & Clothing
        {
            response: "👗 **Fashion Collection at UniQVerse:**\n\n• **Statement Dresses** - Unique designs from independent designers\n• **Artisan Jewelry** - Handcrafted necklaces, earrings, and bracelets\n• **Sustainable Fashion** - Eco-friendly clothing options\n• **Limited Edition Pieces** - Exclusive items you won't find elsewhere\n\nWhat style are you looking for? I can help you find the perfect piece! You can also [browse our fashion collection](/shop/fashion) to see all available items.",
            priority: 4,
            triggers: ["dress", "dresses", "clothing", "fashion", "outfit", "wear", "style", "clothes"],
            category: "fashion"
        },

        // Jewelry & Accessories
        {
            response: "💍 **Jewelry & Accessories:**\n\n• **Artisan Jewelry** - Unique handcrafted pieces\n• **Statement Necklaces** - Bold, eye-catching designs\n• **Elegant Earrings** - From subtle to dramatic\n• **Custom Pieces** - Personalized jewelry options\n• **Sustainable Materials** - Ethically sourced gems and metals\n\nLooking for something special? I can help you find the perfect accessory! [View our jewelry collection](/shop/jewelry)",
            priority: 4,
            triggers: ["jewelry", "necklace", "earrings", "bracelet", "ring", "accessories", "pendant"],
            category: "jewelry"
        },

        // Gift for Wife/Women
        {
            response: "💝 **Perfect Gifts for Your Wife:**\n\n• **Elegant Jewelry** - Artisan-crafted necklaces and earrings\n• **Luxurious Home Decor** - Beautiful pieces for your space\n• **Fashion Pieces** - Unique dresses and accessories\n• **Personalized Items** - Custom engravings with her name or initials\n• **Spa & Wellness** - Self-care and relaxation items\n\nWhat does she love most? Her hobbies and interests can help me suggest the perfect UniQVerse gift! [Shop gifts for her](/shop/gifts)",
            priority: 5,
            triggers: ["gift for wife", "wife gift", "gift for her", "present for wife", "wife present", "gift for my wife"],
            category: "gifts_wife"
        },

        // Home Decor
        {
            response: "🏠 **Home & Decor Collection:**\n\n• **Artisan Crafts** - Unique handmade decorative pieces\n• **Modern Art** - Contemporary wall art and sculptures\n• **Functional Decor** - Beautiful yet practical items\n• **Sustainable Home** - Eco-friendly home accessories\n• **Custom Pieces** - Personalized home decor\n\nWhat room are you decorating? I can help you find pieces that match your style! [Browse home decor](/shop/home)",
            priority: 4,
            triggers: ["home decor", "decoration", "art", "wall art", "sculpture", "vase", "candle", "home accessories"],
            category: "home_decor"
        },

        // Tech Gadgets
        {
            response: "📱 **Tech & Innovation:**\n\n• **Smart Home Devices** - Innovative automation tools\n• **Unique Gadgets** - Tech you won't find in big box stores\n• **Productivity Tools** - Items to enhance work and daily life\n• **Sustainable Tech** - Eco-friendly electronic accessories\n• **Custom Tech** - Personalized phone cases and accessories\n\nWhat kind of tech solution are you looking for? [Explore our tech collection](/shop/tech)",
            priority: 4,
            triggers: ["tech", "gadget", "technology", "smart", "device", "electronics", "phone case"],
            category: "tech"
        },

        // Personal Care & Beauty
        {
            response: "✨ **Beauty & Personal Care:**\n\n• **Natural Skincare** - Organic and sustainable beauty products\n• **Artisan Soaps** - Handcrafted with natural ingredients\n• **Wellness Items** - Self-care and relaxation products\n• **Eco-friendly Beauty** - Sustainable beauty tools and accessories\n• **Custom Beauty** - Personalized skincare sets\n\nLooking for natural, unique beauty products? [Shop beauty & wellness](/shop/beauty)",
            priority: 4,
            triggers: ["beauty", "skincare", "makeup", "cosmetics", "soap", "personal care", "wellness", "spa"],
            category: "beauty"
        },

        // Price Range Queries
        {
            response: "💰 **UniQVerse Price Ranges:**\n\n• **Budget-Friendly** ($10-50) - Small accessories and gifts\n• **Mid-Range** ($50-150) - Quality clothing and home decor\n• **Premium** ($150-300) - Artisan crafts and unique pieces\n• **Luxury** ($300+) - Exclusive and custom items\n\nWhat's your budget range? I can help you find amazing products within your price point! All orders over $50 get **free shipping**! 🚚",
            priority: 3,
            triggers: ["price", "cost", "budget", "expensive", "cheap", "affordable", "how much"],
            category: "pricing"
        }
    ];

    try {
        let addedCount = 0;

        for (const pattern of productPatterns) {
            console.log(`Adding pattern: ${pattern.category}`);

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

            addedCount++;
        }

        console.log(`✅ Successfully added ${addedCount} product-specific patterns!`);
        console.log(`📊 Total triggers added: ${productPatterns.reduce((sum, p) => sum + p.triggers.length, 0)}`);

        return { success: true, patternsAdded: addedCount };

    } catch (error) {
        console.error("❌ Error adding patterns:", error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    addProductSpecificPatterns()
        .then((result) => {
            console.log("🎉 Product patterns training completed successfully!");
            console.log(`Added ${result.patternsAdded} new patterns for better product assistance.`);
            process.exit(0);
        })
        .catch((error) => {
            console.error("💥 Training failed:", error);
            process.exit(1);
        });
}

export default addProductSpecificPatterns;
