import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-utils";
import { db } from "@/lib/db";

interface ChatbotConfig {
    openai_model: string;
    response_temperature: number;
    max_response_tokens: number;
    confidence_threshold: number;
    product_search_limit: number;
    fuzzy_search_tolerance: number;
    enable_product_search: boolean;
    show_product_images: boolean;
    fallback_products: boolean;
    enable_smart_rating: boolean;
    track_user_interactions: boolean;
    enable_feedback_buttons: boolean;
    enable_learning: boolean;
    track_unmatched: boolean;
    chatbot_name: string;
    welcome_message: string;
    max_conversation_length: number;
    session_timeout_minutes: number;
    chatbot_color: string;
    chat_window_size: string;
    chatbot_position: string;
}

// GET - Retrieve chatbot configuration
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }        // Get settings from database or return defaults
        const settings = await (db.siteSettings as any).findMany({
            where: {
                key: {
                    startsWith: 'chatbot_'
                }
            }
        });

        // Convert settings array to object
        const config: Partial<ChatbotConfig> = {};
        settings.forEach(setting => {
            const key = setting.key.replace('chatbot_', '') as keyof ChatbotConfig;
            let value: any = setting.value;

            // Parse boolean and number values
            if (value === 'true') value = true;
            else if (value === 'false') value = false;
            else if (!isNaN(Number(value)) && value !== '') value = Number(value);

            config[key] = value;
        });

        // Set defaults for missing values
        const defaultConfig: ChatbotConfig = {
            openai_model: 'gpt-3.5-turbo',
            response_temperature: 0.7,
            max_response_tokens: 500,
            confidence_threshold: 0.75,
            product_search_limit: 6,
            fuzzy_search_tolerance: 0.6,
            enable_product_search: true,
            show_product_images: true,
            fallback_products: true,
            enable_smart_rating: true,
            track_user_interactions: true,
            enable_feedback_buttons: true,
            enable_learning: true,
            track_unmatched: true,
            chatbot_name: 'UniQVerse AI Support',
            welcome_message: 'Welcome to UniQVerse support! I\'m an AI assistant here to help you with any questions about our products, orders, shipping, returns, and more.',
            max_conversation_length: 50,
            session_timeout_minutes: 30,
            chatbot_color: 'blue',
            chat_window_size: 'medium',
            chatbot_position: 'bottom-right'
        };

        const finalConfig = { ...defaultConfig, ...config };

        return NextResponse.json({
            success: true,
            config: finalConfig
        });

    } catch (error) {
        console.error("Error fetching chatbot configuration:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch configuration" },
            { status: 500 }
        );
    }
}

// POST - Update chatbot configuration
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const config: ChatbotConfig = await req.json();

        // Validate configuration values
        if (config.response_temperature < 0 || config.response_temperature > 2) {
            return NextResponse.json(
                { success: false, error: "Temperature must be between 0 and 2" },
                { status: 400 }
            );
        }

        if (config.max_response_tokens < 50 || config.max_response_tokens > 1500) {
            return NextResponse.json(
                { success: false, error: "Max tokens must be between 50 and 1500" },
                { status: 400 }
            );
        }

        if (config.confidence_threshold < 0.1 || config.confidence_threshold > 1.0) {
            return NextResponse.json(
                { success: false, error: "Confidence threshold must be between 0.1 and 1.0" },
                { status: 400 }
            );
        }        // Save each setting to database
        for (const [key, value] of Object.entries(config)) {
            const settingKey = `chatbot_${key}`;            // Check if setting exists
            const existingSetting = await (db.siteSettings as any).findUnique({
                where: { key: settingKey }
            });

            if (existingSetting) {
                // Update existing setting
                await (db.siteSettings as any).update({
                    where: { key: settingKey },
                    data: { value: String(value) }
                });
            } else {
                // Create new setting
                await (db.siteSettings as any).create({
                    data: {
                        key: settingKey,
                        value: String(value)
                    }
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: "Chatbot configuration updated successfully"
        });

    } catch (error) {
        console.error("Error updating chatbot configuration:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update configuration" },
            { status: 500 }
        );
    }
}
