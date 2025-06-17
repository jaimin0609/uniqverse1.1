import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-utils";
import { cache } from "@/lib/redis";

// Helper function to get the current session
async function auth() {
    return await getServerSession(authOptions);
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Await params before accessing
        const resolvedParams = await params;
        const { id } = resolvedParams;

        // Try to get event from cache first
        const cacheKey = `event:${id}`;
        const cachedEvent = await cache.get(cacheKey);
        if (cachedEvent) {
            return NextResponse.json(cachedEvent);
        }

        const event = await db.event.findUnique({
            where: { id },
        });

        if (!event) {
            return NextResponse.json(
                { error: "Event not found" },
                { status: 404 }
            );
        }

        // Cache the event for 30 minutes (1800 seconds)
        await cache.set(cacheKey, event, 1800);

        return NextResponse.json(event);
    } catch (error) {
        console.error("Error fetching event:", error);
        return NextResponse.json(
            { error: "Failed to fetch event" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Await params before accessing
        const resolvedParams = await params;
        const { id } = resolvedParams;

        // Check authentication and authorization
        const session = await auth();
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }        // Check if the event exists
        const existingEvent = await db.event.findUnique({
            where: { id },
        });

        if (!existingEvent) {
            return NextResponse.json(
                { error: "Event not found" },
                { status: 404 }
            );
        }

        // Get request body
        const body = await request.json();        // Update event
        const updatedEvent = await db.event.update({
            where: { id },
            data: {
                title: body.title,
                description: body.description || null,
                imageUrl: body.imageUrl || null,
                videoUrl: body.videoUrl || null,
                contentType: body.contentType,
                textOverlay: body.textOverlay || null,
                textPosition: body.textPosition,
                textColor: body.textColor,
                textSize: body.textSize,
                textShadow: body.textShadow,
                backgroundColor: body.backgroundColor || null,
                opacity: body.opacity,
                effectType: body.effectType !== "none" ? body.effectType : null,
                linkUrl: body.linkUrl || null,
                startDate: new Date(body.startDate),
                endDate: new Date(body.endDate),
                isActive: body.isActive,
                position: body.position,
            },
        });

        // Invalidate event caches
        await cache.del(`event:${id}`);
        await cache.del("events:all");
        await cache.del("events:active");

        return NextResponse.json(updatedEvent);
    } catch (error) {
        console.error("Error updating event:", error);
        return NextResponse.json(
            { error: "Failed to update event" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Await params before accessing
        const resolvedParams = await params;
        const { id } = resolvedParams;

        // Check authentication and authorization
        const session = await auth();
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Check if the event exists
        const existingEvent = await db.event.findUnique({
            where: { id },
        });

        if (!existingEvent) {
            return NextResponse.json(
                { error: "Event not found" },
                { status: 404 }
            );
        }        // Delete the event
        await db.event.delete({
            where: { id },
        });

        // Invalidate event caches
        await cache.del(`event:${id}`);
        await cache.del("events:all");
        await cache.del("events:active");

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting event:", error);
        return NextResponse.json(
            { error: "Failed to delete event" },
            { status: 500 }
        );
    }
}
