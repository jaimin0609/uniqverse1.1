import { db } from "../src/lib/db";

async function addEssentialPatterns() {
    console.log("🔧 Adding essential missing patterns...\n");

    const essentialPatterns = [
        {
            intent: "shipping_info",
            category: "shipping",
            priority: 2,
            response: "🚚 **Shipping Information:**\n• **Free shipping** on orders over $75\n• **Standard shipping**: 3-7 business days ($5.99)\n• **Express shipping**: 1-3 business days ($12.99)\n• **Overnight shipping**: Next business day ($24.99)\n\nWe ship to all US states and internationally to select countries!",
            triggers: [
                "shipping", "delivery", "shipping cost", "shipping fee", "how much shipping",
                "delivery time", "shipping options", "free shipping", "express shipping",
                "overnight shipping", "international shipping", "shipping rates"
            ]
        },
        {
            intent: "return_policy",
            category: "returns",
            priority: 2,
            response: "🔄 **Return Policy:**\n• **30-day** return window from delivery\n• Items must be in **original condition**\n• **Free returns** for defective items\n• **Easy process**: Log in → Order History → Request Return\n• **Refund timeline**: 5-7 business days after we receive your item\n\nContact our support team if you need assistance with a return!",
            triggers: [
                "return", "returns", "return policy", "how to return", "return item",
                "refund", "exchange", "return process", "can i return", "return window"
            ]
        },
        {
            intent: "payment_methods",
            category: "payment",
            priority: 2,
            response: "💳 **Payment Methods We Accept:**\n• **Credit Cards**: Visa, Mastercard, American Express, Discover\n• **PayPal** and PayPal Credit\n• **Apple Pay** and Google Pay\n• **Buy Now, Pay Later** options available\n• **Gift Cards** and store credit\n\nAll payments are processed securely with 256-bit SSL encryption!",
            triggers: [
                "payment", "payment methods", "pay", "credit card", "paypal", "apple pay",
                "google pay", "payment options", "how to pay", "accepted cards", "visa", "mastercard"
            ]
        },
        {
            intent: "help_contact",
            category: "support",
            priority: 2,
            response: "📞 **Contact Our Support Team:**\n• **Email**: support@uniqverse.com\n• **Live Chat**: Available 9 AM - 6 PM EST\n• **Phone**: 1-800-UNIQ-VERSE (Mon-Fri 9 AM - 6 PM EST)\n• **Response Time**: Usually within 2-4 hours\n\nOur friendly team is here to help with any questions!",
            triggers: [
                "contact", "help", "support", "phone number", "email", "live chat",
                "customer service", "get help", "contact us", "support team"
            ]
        }
    ];

    try {
        for (const patternData of essentialPatterns) {
            // Check if pattern already exists
            const existing = await db.chatbotPattern.findFirst({
                where: { response: patternData.response }
            });

            if (existing) {
                console.log(`⏭️ Skipping ${patternData.intent} - already exists`);
                continue;
            }

            console.log(`➕ Adding pattern: ${patternData.intent}`);

            const pattern = await db.chatbotPattern.create({
                data: {
                    response: patternData.response,
                    priority: patternData.priority,
                    isActive: true
                }
            });

            // Add triggers
            for (const trigger of patternData.triggers) {
                await db.chatbotTrigger.create({
                    data: {
                        phrase: trigger,
                        patternId: pattern.id
                    }
                });
            }
        }

        console.log("\n✅ Essential patterns added successfully!");

        // Show final stats
        const totalPatterns = await db.chatbotPattern.count();
        console.log(`📊 Total patterns now: ${totalPatterns}`);

    } catch (error) {
        console.error("❌ Error adding patterns:", error);
    } finally {
        await db.$disconnect();
    }
}

addEssentialPatterns();
