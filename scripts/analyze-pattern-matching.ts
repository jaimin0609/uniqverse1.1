import { db } from "../src/lib/db";

async function analyzePatternMatching() {
    console.log("🔍 Analyzing pattern matching for problematic queries...\n");

    const testQueries = [
        "Can you help me with my math homework?",
        "I'm looking for unique birthday gifts for my sister who loves sustainable products",
        "Do you have any eco-friendly tech gadgets in stock?",
        "What makes UniQVerse different from other e-commerce sites?"
    ];

    try {
        // Get all patterns with triggers
        const patterns = await db.chatbotPattern.findMany({
            include: { triggers: true },
            where: { isActive: true },
            orderBy: { priority: 'asc' }
        });

        for (const query of testQueries) {
            console.log(`\n📝 Query: "${query}"`);
            console.log("🎯 Pattern matches:");

            const lowerQuery = query.toLowerCase();
            const queryKeywords = extractKeywords(lowerQuery);

            for (const pattern of patterns) {
                let score = 0;
                const triggerPhrases = pattern.triggers.map(t => t.phrase.toLowerCase());

                // Check different matching types
                const exactPhrase = triggerPhrases.find(phrase => lowerQuery === phrase);
                const containsPhrase = triggerPhrases.find(phrase =>
                    lowerQuery.includes(phrase) && phrase.length > 3
                );
                const wordBoundaryMatch = triggerPhrases.find(phrase => {
                    const regex = new RegExp(`\\b${phrase}\\b`, 'i');
                    return regex.test(lowerQuery);
                });

                if (exactPhrase) score += 25;
                if (containsPhrase) score += 20;
                if (wordBoundaryMatch) score += 15;

                // Keyword analysis
                const patternKeywords = triggerPhrases.flatMap(phrase => extractKeywords(phrase));
                const keywordMatches = queryKeywords.filter(kw => patternKeywords.includes(kw));

                if (keywordMatches.length >= 2) {
                    score += keywordMatches.length * 3;
                } else if (keywordMatches.length === 1) {
                    const relevantSingleKeywords = ['shipping', 'return', 'payment', 'order', 'uniqverse'];
                    const matchedKeyword = keywordMatches[0];
                    if (relevantSingleKeywords.includes(matchedKeyword)) {
                        score += 8;
                    }
                }

                if (score > 0) {
                    console.log(`   - Pattern ID: ${pattern.id} (Priority: ${pattern.priority})`);
                    console.log(`     Score: ${score}, Confidence: ${Math.min(score / 25, 1).toFixed(2)}`);
                    console.log(`     Triggers: ${triggerPhrases.join(', ')}`);
                    console.log(`     Keyword matches: ${keywordMatches.join(', ')}`);

                    if (exactPhrase) console.log(`     ✓ Exact phrase match: "${exactPhrase}"`);
                    if (containsPhrase) console.log(`     ✓ Contains phrase: "${containsPhrase}"`);
                    if (wordBoundaryMatch) console.log(`     ✓ Word boundary match: "${wordBoundaryMatch}"`);
                }
            }
        }

    } catch (error) {
        console.error("❌ Error analyzing patterns:", error);
    } finally {
        await db.$disconnect();
    }
}

function extractKeywords(text: string): string[] {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'cant', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their'];

    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.includes(word));
}

analyzePatternMatching();
