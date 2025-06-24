import { db } from "../src/lib/db";

async function cleanupDuplicatePatterns() {
    console.log("🔧 Cleaning up duplicate patterns...\n");

    try {
        // Get all patterns with their triggers
        const allPatterns = await db.chatbotPattern.findMany({
            include: { triggers: true },
            orderBy: { createdAt: 'asc' } // Keep older ones
        });

        const seen = new Set<string>();
        const duplicatesToDelete: string[] = [];

        // Find duplicates based on response similarity and triggers
        for (const pattern of allPatterns) {
            const triggerPhrases = pattern.triggers.map(t => t.phrase).sort().join('|');
            const key = `${triggerPhrases}_${pattern.response.substring(0, 50)}`;

            if (seen.has(key)) {
                duplicatesToDelete.push(pattern.id);
                console.log(`📋 Marked duplicate for deletion: Pattern ID ${pattern.id}`);
            } else {
                seen.add(key);
            }
        }

        if (duplicatesToDelete.length > 0) {
            console.log(`\n🗑️ Deleting ${duplicatesToDelete.length} duplicate patterns...`);

            // Delete triggers first (foreign key constraint)
            await db.chatbotTrigger.deleteMany({
                where: {
                    patternId: { in: duplicatesToDelete }
                }
            });

            // Delete patterns
            await db.chatbotPattern.deleteMany({
                where: {
                    id: { in: duplicatesToDelete }
                }
            });

            console.log("✅ Duplicate patterns cleaned up!");
        } else {
            console.log("✅ No duplicates found!");
        }

        // Show final count
        const finalCount = await db.chatbotPattern.count();
        console.log(`\n📊 Final pattern count: ${finalCount}`);

    } catch (error) {
        console.error("❌ Error cleaning up patterns:", error);
    } finally {
        await db.$disconnect();
    }
}

cleanupDuplicatePatterns();
