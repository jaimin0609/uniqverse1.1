import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

// Function to create PrismaClient with Accelerate extension
function createPrismaClient() {
    try {
        const prisma = new PrismaClient({
            log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
        });

        // Add Accelerate extension for improved performance
        return prisma.$extends(withAccelerate());
    } catch (error) {
        console.error("Failed to initialize Prisma Client:", error);
        console.error("Please run 'npx prisma generate' to generate the Prisma Client.");
        throw new Error("Prisma Client not initialized. Run 'npx prisma generate' first.");
    }
}

const globalForPrisma = globalThis as unknown as {
    prisma: any;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;