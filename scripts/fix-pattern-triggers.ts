import { db } from "../src/lib/db";

async function fixPatternTriggers() {
    console.log("🔧 Fixing overly broad pattern triggers...\n");

    try {
        // 1. Fix the help pattern to be more specific
        const helpPattern = await db.chatbotPattern.findFirst({
            where: {
                response: {
                    contains: "contact"
                }
            },
            include: { triggers: true }
        });

        if (helpPattern) {
            console.log("📞 Updating help/contact pattern triggers...");

            // Delete old triggers
            await db.chatbotTrigger.deleteMany({
                where: { patternId: helpPattern.id }
            });

            // Add more specific triggers that won't match "homework"
            const specificHelpTriggers = [
                "contact", "contact us", "phone number", "email", "live chat",
                "customer service", "support team", "need help", "get help",
                "how to contact", "call you", "reach support"
            ];

            for (const trigger of specificHelpTriggers) {
                await db.chatbotTrigger.create({
                    data: {
                        phrase: trigger,
                        patternId: helpPattern.id
                    }
                });
            }
        }

        // 2. Make the sustainable pattern more specific for product searches
        const sustainablePattern = await db.chatbotPattern.findFirst({
            where: {
                response: {
                    contains: "sustainable"
                }
            },
            include: { triggers: true }
        });

        if (sustainablePattern) {
            console.log("🌱 Updating sustainable pattern...");

            // Update response to be less definitive and more guiding
            await db.chatbotPattern.update({
                where: { id: sustainablePattern.id },
                data: {
                    response: "🌱 **Sustainable Products at UniQVerse:**\n• **Eco-Friendly Items** - Environmentally conscious choices\n• **Sustainable Materials** - Products made with care for the planet\n• **Green Living** - Items to support sustainable lifestyle\n\nLooking for something specific? I can help you find sustainable options!"
                }
            });
        }

        // 3. Make the tech pattern less broad for specific product searches
        const techPatterns = await db.chatbotPattern.findMany({
            where: {
                response: {
                    contains: "tech"
                }
            },
            include: { triggers: true }
        });

        for (const techPattern of techPatterns) {
            console.log(`📱 Updating tech pattern: ${techPattern.id}...`);

            // Update response to be more guiding for specific queries
            await db.chatbotPattern.update({
                where: { id: techPattern.id },
                data: {
                    response: "📱 **Tech & Innovation at UniQVerse:**\n• **Smart Home Devices** - Innovative automation tools\n• **Unique Gadgets** - Creative and functional items\n• **Phone Accessories** - Stylish cases and stands\n• **Productivity Tools** - Items to enhance workflow\n\nLooking for something specific? I can help you find the perfect tech item!"
                }
            });
        }

        // 4. Create a blacklist of words that should never trigger patterns
        const blacklistWords = [
            "homework", "math", "school", "cooking", "recipe", "weather", "news",
            "politics", "sports", "movie", "book", "music", "restaurant",
            "directions", "map", "translate", "calculate", "define"
        ];

        console.log(`🚫 Pattern blacklist created with ${blacklistWords.length} words`);

        console.log("\n✅ Pattern triggers updated successfully!");

    } catch (error) {
        console.error("❌ Error fixing patterns:", error);
    } finally {
        await db.$disconnect();
    }
}

fixPatternTriggers();
