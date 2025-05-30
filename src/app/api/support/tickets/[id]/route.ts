import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { cache, cacheInvalidation } from "@/lib/redis";

// GET - Retrieve a specific ticket with all replies
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const ticketId = params.id;

        // Check if user is admin or the ticket owner
        const isAdmin = session.user.role === "ADMIN";
        const ticket = await db.supportTicket.findUnique({
            where: { id: ticketId },
            include: {
                replies: {
                    orderBy: { createdAt: "asc" },
                    include: { user: { select: { name: true, email: true, image: true, role: true } } }
                },
                user: { select: { name: true, email: true, image: true } },
                attachments: true
            }
        });

        if (!ticket) {
            return NextResponse.json(
                { error: "Ticket not found" },
                { status: 404 }
            );
        }

        // Only allow access if admin or ticket owner
        if (!isAdmin && ticket.userId !== session.user.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            );
        }

        return NextResponse.json({
            success: true,
            ticket
        });
    } catch (error) {
        console.error("Error fetching ticket:", error);
        return NextResponse.json(
            { error: "Failed to fetch ticket" },
            { status: 500 }
        );
    }
}

// PATCH - Update ticket status or priority
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const ticketId = params.id;
        const { status, priority } = await req.json();

        // Verify admin role for status updates
        if (status && session.user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Only admins can update ticket status" },
                { status: 403 }
            );
        }

        // Get the existing ticket
        const existingTicket = await db.supportTicket.findUnique({
            where: { id: ticketId }
        });

        if (!existingTicket) {
            return NextResponse.json(
                { error: "Ticket not found" },
                { status: 404 }
            );
        }

        // Only allow admin or ticket owner to update
        if (session.user.role !== "ADMIN" && existingTicket.userId !== session.user.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            );
        }

        // Update the ticket
        const updateData: any = {};
        if (status) updateData.status = status;
        if (priority) updateData.priority = priority;

        const updatedTicket = await db.supportTicket.update({
            where: { id: ticketId },
            data: updateData
        });

        // Invalidate admin tickets cache and user's tickets cache
        await cacheInvalidation.onAdminTicketsChange();
        await cache.del(`support:tickets:user:${existingTicket.userId}`);

        return NextResponse.json({
            success: true,
            ticket: updatedTicket
        });
    } catch (error) {
        console.error("Error updating ticket:", error);
        return NextResponse.json(
            { error: "Failed to update ticket" },
            { status: 500 }
        );
    }
}

// POST - Add a reply to a ticket
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const ticketId = params.id;
        const { content } = await req.json();

        if (!content || !content.trim()) {
            return NextResponse.json(
                { error: "Reply content is required" },
                { status: 400 }
            );
        }

        // Get the existing ticket
        const existingTicket = await db.supportTicket.findUnique({
            where: { id: ticketId }
        });

        if (!existingTicket) {
            return NextResponse.json(
                { error: "Ticket not found" },
                { status: 404 }
            );
        }

        // Only allow admin or ticket owner to reply
        if (session.user.role !== "ADMIN" && existingTicket.userId !== session.user.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            );
        }

        // Create the reply
        const reply = await db.ticketReply.create({
            data: {
                content,
                isAdminReply: session.user.role === "ADMIN",
                ticketId,
                userId: session.user.id
            }
        });

        // Update ticket status based on who replied
        let newStatus;
        if (session.user.role === "ADMIN") {
            newStatus = "AWAITING_CUSTOMER";
        } else if (existingTicket.status === "AWAITING_CUSTOMER") {
            newStatus = "IN_PROGRESS";
        }

        if (newStatus) {
            await db.supportTicket.update({
                where: { id: ticketId },
                data: { status: newStatus, updatedAt: new Date() }
            });
        }

        // Invalidate admin tickets cache and user's tickets cache
        await cacheInvalidation.onAdminTicketsChange();
        await cache.del(`support:tickets:user:${existingTicket.userId}`);

        return NextResponse.json({
            success: true,
            reply
        }, { status: 201 });
    } catch (error) {
        console.error("Error adding reply:", error);
        return NextResponse.json(
            { error: "Failed to add reply" },
            { status: 500 }
        );
    }
}