"use client";

import dynamic from "next/dynamic";

// Dynamically import ChatBot with SSR disabled to prevent hydration issues
const ChatBot = dynamic(() => import("./ChatBot"), {
    ssr: false,
});

const ChatBotTest = dynamic(() => import("./ChatBotTest"), {
    ssr: false,
});

export default function ChatBotWrapper() {
    console.log("ChatBotWrapper rendering...");
    return <ChatBot />;
}