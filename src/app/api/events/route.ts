import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-utils";
import { cache } from "@/lib/redis";

// Helper function to get the current session
async function auth() {
    return await getServerSession(authOptions);
}

export async function POST(request: Request) {
    try {
        // Check authentication and authorization
        const session = await auth();
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get request body
        const body = await request.json();        // Create event
        const event = await db.event.create({
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

        // Invalidate events cache
        await cache.del("events:all");
        await cache.del("events:active");

        return NextResponse.json(event);
    } catch (error) {
        console.error("Error creating event:", error);
        return NextResponse.json(
            { error: "Failed to create event" },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id"); if (id) {
            // Get a specific event
            const cacheKey = `event:${id}`;
            const cachedEvent = await cache.get(cacheKey);
            if (cachedEvent) {
                return NextResponse.json(cachedEvent);
            }

            const event = await db.event.findUnique({ where: { id } });
            if (!event) {
                return NextResponse.json(
                    { error: "Event not found" },
                    { status: 404 }
                );
            }

            // Cache individual event for 30 minutes
            await cache.set(cacheKey, event, 1800);
            return NextResponse.json(event);
        } else {
            // Get all events or filtered events
            const activeOnly = searchParams.get("active") === "true";
            const cacheKey = activeOnly ? "events:active" : "events:all";

            const cachedEvents = await cache.get(cacheKey);
            if (cachedEvents) {
                return NextResponse.json(cachedEvents);
            }

            const now = new Date();

            const events = await db.event.findMany({
                where: {
                    ...(activeOnly ? {
                        isActive: true,
                        startDate: { lte: now },
                        endDate: { gte: now },
                    } : {}),
                },
                orderBy: [
                    { position: 'asc' },
                    { startDate: 'desc' },
                ],
            });

            // Cache events for 15 minutes
            await cache.set(cacheKey, events, 900);

            return NextResponse.json(events);
        }
    } catch (error) {
        console.error("Error fetching events:", error);
        return NextResponse.json(
            { error: "Failed to fetch events" },
            { status: 500 }
        );
    }
}
