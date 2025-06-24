import { db } from "../src/lib/db";

async function testDressQuery() {
    console.log("👗 Testing dress query pattern matching...\n");

    const query = "i am looking for something like dress";
    const lowerQuery = query.toLowerCase();

    try {
        console.log(`Query: "${query}"`);
        console.log(`Lowercase: "${lowerQuery}"`);

        // Check blacklist
        const blacklistWords = [
            "homework", "math", "school", "cooking", "recipe", "weather", "news",
            "politics", "sports", "movie", "book", "music", "restaurant",
            "directions", "map", "translate", "calculate", "define"
        ];

        const hasBlacklistedWord = blacklistWords.some(word =>
            lowerQuery.includes(word)
        );
        console.log(`Has blacklisted word: ${hasBlacklistedWord}`);

        // Check complex query indicators
        const complexQueryIndicators = [
            "looking for", "need something", "recommend", "suggestion", "help me find",
            "what do you have", "show me", "searching for", "in stock", "available",
            "who loves", "for my", "birthday gift", "anniversary", "special occasion"
        ];

        const isComplexQuery = complexQueryIndicators.some(indicator =>
            lowerQuery.includes(indicator)
        );
        console.log(`Is complex query: ${isComplexQuery}`);
        console.log(`Word count: ${lowerQuery.split(' ').length}`);
        console.log(`Should bypass patterns: ${isComplexQuery && lowerQuery.split(' ').length > 5}`);

        // Get dress patterns
        const dressPatterns = await db.chatbotPattern.findMany({
            include: { triggers: true },
            where: {
                AND: [
                    { isActive: true },
                    {
                        triggers: {
                            some: {
                                phrase: {
                                    contains: "dress"
                                }
                            }
                        }
                    }
                ]
            }
        });

        console.log(`\nFound ${dressPatterns.length} dress-related patterns:`);

        dressPatterns.forEach((pattern, index) => {
            console.log(`\n${index + 1}. Pattern ID: ${pattern.id}`);
            console.log(`   Triggers: ${pattern.triggers.map(t => t.phrase).join(', ')}`);

            const triggerPhrases = pattern.triggers.map(t => t.phrase.toLowerCase());
            const containsDress = triggerPhrases.find(phrase =>
                lowerQuery.includes(phrase) && phrase.length > 3
            );
            const wordBoundaryMatch = triggerPhrases.find(phrase => {
                const regex = new RegExp(`\\b${phrase}\\b`, 'i');
                return regex.test(lowerQuery);
            });

            console.log(`   Contains match: ${containsDress || 'none'}`);
            console.log(`   Word boundary match: ${wordBoundaryMatch || 'none'}`);
        });

    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        await db.$disconnect();
    }
}

testDressQuery();
