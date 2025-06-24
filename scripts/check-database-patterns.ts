import { db } from "../src/lib/db";

async function checkDatabasePatterns() {
    console.log("🔍 Checking current chatbot patterns in database...\n");

    try {
        // Count total patterns
        const totalPatterns = await db.chatbotPattern.count();
        const activePatterns = await db.chatbotPattern.count({
            where: { isActive: true }
        });

        console.log(`📊 Pattern Statistics:`);
        console.log(`   Total patterns: ${totalPatterns}`);
        console.log(`   Active patterns: ${activePatterns}`);
        console.log(`   Inactive patterns: ${totalPatterns - activePatterns}\n`);

        // Get all active patterns with their triggers
        const patterns = await db.chatbotPattern.findMany({
            where: { isActive: true },
            include: { triggers: true },
            orderBy: { priority: 'asc' }
        });

        if (patterns.length === 0) {
            console.log("❌ No active patterns found! Database needs to be seeded.");
            return;
        }

        console.log("🎯 Active Patterns:");
        patterns.forEach((pattern, index) => {
            console.log(`\n${index + 1}. ID: ${pattern.id}`);
            console.log(`   Priority: ${pattern.priority}`);
            console.log(`   Triggers: ${pattern.triggers.map(t => `"${t.phrase}"`).join(', ')}`);
            console.log(`   Response: ${pattern.response.substring(0, 100)}...`);
        });

        // Check for priority distribution
        const priorities = await db.chatbotPattern.groupBy({
            by: ['priority'],
            where: { isActive: true },
            _count: { priority: true }
        });

        console.log("\n📂 Priority breakdown:");
        priorities.forEach(priority => {
            console.log(`   Priority ${priority.priority}: ${priority._count?.priority || 0} patterns`);
        });

    } catch (error) {
        console.error("❌ Error checking database patterns:", error);
    } finally {
        await db.$disconnect();
    }
}

checkDatabasePatterns();
