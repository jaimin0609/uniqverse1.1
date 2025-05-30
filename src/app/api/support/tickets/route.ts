import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { z } from "zod";
import { cache, cacheInvalidation } from "@/lib/redis";

// Schema for ticket creation
const createTicketSchema = z.object({
    subject: z.string().min(5).max(100),
    description: z.string().min(20),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
});

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }        // Check cache for user tickets
        const cacheKey = `support:tickets:user:${session.user.id}`;
        const cached = await cache.get(cacheKey);
        if (cached) {
            return NextResponse.json(cached);
        }

        // Fetch user's tickets
        const tickets = await db.supportTicket.findMany({
            where: {
                userId: session.user.id,
            },
            orderBy: {
                updatedAt: 'desc',
            },
            include: {
                replies: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 1,
                },
            },
        });

        const result = { tickets };

        // Cache user tickets for 2 minutes (support tickets are dynamic)
        await cache.set(cacheKey, result, 120);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error fetching tickets:", error);
        return NextResponse.json(
            { error: "Failed to fetch tickets" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();

        // Validate request body
        const validationResult = createTicketSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.errors[0].message },
                { status: 400 }
            );
        }

        const { subject, description, priority } = validationResult.data;

        // Create ticket
        const ticket = await db.supportTicket.create({
            data: {
                subject,
                description,
                priority,
                status: 'OPEN',
                userId: session.user.id,
            },
        });

        // Invalidate admin tickets cache and user's tickets cache
        await cacheInvalidation.onAdminTicketsChange();
        await cache.del(`support:tickets:user:${session.user.id}`);

        return NextResponse.json({
            message: "Ticket created successfully",
            ticket
        }, { status: 201 });
    } catch (error) {
        console.error("Error creating ticket:", error);
        return NextResponse.json(
            { error: "Failed to create ticket" },
            { status: 500 }
        );
    }
}