"use client";

import { MessageSquare } from "lucide-react";

export default function ChatBotTest() {
    console.log("ChatBotTest component is rendering!");

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <button
                className="bg-blue-600 text-white rounded-full p-4 shadow-xl hover:bg-blue-700 transition-colors"
                aria-label="Test chat button"
            >
                <MessageSquare className="h-6 w-6" />
            </button>
        </div>
    );
}
