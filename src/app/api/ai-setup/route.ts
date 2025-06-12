import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { initializeAIChatbot, validateChatbotSetup } from "@/lib/ai-chatbot-init";

// AI Setup API - Initialize and configure the enhanced AI chatbot system
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({
                error: "Unauthorized"
            }, { status: 401 });
        }

        console.log("🚀 Starting comprehensive AI Chatbot initialization...");

        // Initialize the comprehensive AI chatbot
        const result = await initializeAIChatbot();

        return NextResponse.json({
            success: true,
            message: `AI Chatbot initialized successfully with ${result.patterns} patterns, ${result.triggers} triggers, ${result.fallbacks} fallbacks, and ${result.contexts} context entries.`,
            data: result
        });

    } catch (error) {
        console.error("AI setup error:", error);
        return NextResponse.json({
            error: `Failed to initialize AI chatbot: ${error instanceof Error ? error.message : 'Unknown error'}`
        }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({
                error: "Unauthorized"
            }, { status: 401 });
        }

        // Validate current chatbot setup
        const validation = await validateChatbotSetup();

        return NextResponse.json({
            success: true,
            message: validation.isSetup
                ? "AI Chatbot is properly configured and ready"
                : "AI Chatbot needs initialization",
            ...validation
        });

    } catch (error) {
        console.error("AI setup validation error:", error);
        return NextResponse.json({
            error: `Failed to validate AI setup: ${error instanceof Error ? error.message : 'Unknown error'}`
        }, { status: 500 });
    }
}
