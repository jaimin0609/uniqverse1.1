import { PrismaClient } from "@prisma/client";

// Function to create PrismaClient with optimized connection settings
function createPrismaClient() {
    try {
        const prisma = new PrismaClient({
            log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
            datasources: {
                db: {
                    url: process.env.DATABASE_URL,
                },
            },
        });

        return prisma;
    } catch (error) {
        console.error("Failed to initialize Prisma Client:", error);
        console.error("Please run 'npx prisma generate' to generate the Prisma Client.");
        throw new Error("Prisma Client not initialized. Run 'npx prisma generate' first.");
    }
}

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;