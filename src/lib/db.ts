import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

// Function to create PrismaClient with error handling
function createPrismaClient() {
    try {
        return new PrismaClient({
            log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
        });
    } catch (error) {
        console.error("Failed to initialize Prisma Client:", error);
        console.error("Please run 'npx prisma generate' to generate the Prisma Client.");
        throw new Error("Prisma Client not initialized. Run 'npx prisma generate' first.");
    }
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;