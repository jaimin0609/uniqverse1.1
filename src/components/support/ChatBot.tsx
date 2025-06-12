"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, X, Send, Loader2, MinusCircle, ThumbsUp, ThumbsDown, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useCurrency } from "@/contexts/currency-provider";

// Message schema for type safety
const messageSchema = z.object({
    message: z.string().min(1, "Please enter a message"),
});

type Message = {
    id?: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp?: Date;
    confidence?: number;
    patternMatched?: string;
    suggestions?: string[];
};

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [config, setConfig] = useState({
        chatbot_name: 'UniQVerse AI Support',
        welcome_message: 'Welcome to UniQVerse support! I\'m an AI assistant here to help you with any questions about our products, orders, shipping, returns, and more. How can I assist you today?',
        enable_feedback_buttons: true,
        chatbot_color: 'blue',
        chat_window_size: 'medium',
        chatbot_position: 'bottom-right'
    });
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [minimized, setMinimized] = useState(false);
    const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);
    const [lastResponseTime, setLastResponseTime] = useState<Date | null>(null);
    const [userInteractionData, setUserInteractionData] = useState<{
        messageId: string | null;
        startTime: Date | null;
        hasClickedLink: boolean;
    }>({ messageId: null, startTime: null, hasClickedLink: false });
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Get currency context for product suggestions
    const { currency } = useCurrency();

    const form = useForm({
        resolver: zodResolver(messageSchema),
        defaultValues: {
            message: "",
        },
    });

    // Load chatbot configuration on mount
    useEffect(() => {
        const loadConfig = async () => {
            try {
                const response = await fetch('/api/admin/chatbot-config');
                const data = await response.json();

                if (data.success) {
                    setConfig(data.config);
                    // Initialize messages with the configured welcome message
                    setMessages([{
                        role: "system",
                        content: data.config.welcome_message || 'Welcome to UniQVerse support! I\'m an AI assistant here to help you with any questions about our products, orders, shipping, returns, and more. How can I assist you today?',
                    }]);
                }
            } catch (error) {
                console.error('Failed to load chatbot config:', error);
                // Use default welcome message on error
                setMessages([{
                    role: "system",
                    content: 'Welcome to UniQVerse support! I\'m an AI assistant here to help you with any questions about our products, orders, shipping, returns, and more. How can I assist you today?',
                }]);
            }
        };

        loadConfig();
    }, []);

    // Smart rating function
    const submitSmartRating = useCallback(async (
        messageId: string,
        userAction: 'continued_chat' | 'ended_chat' | 'asked_followup' | 'clicked_link' | 'escalated' | 'repeated_question',
        followUpQuestion?: string
    ) => {
        if (!conversationId || !messageId) return;

        try {
            const timeSpent = userInteractionData.startTime
                ? (Date.now() - userInteractionData.startTime.getTime()) / 1000
                : undefined;

            await fetch("/api/ai-smart-rating", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    conversationId,
                    messageId,
                    userAction,
                    timeSpent,
                    followUpQuestion,
                    sessionData: {
                        hasClickedLink: userInteractionData.hasClickedLink,
                        sessionId
                    }
                }),
            });
        } catch (error) {
            console.error("Smart rating error:", error);
        }
    }, [conversationId, userInteractionData, sessionId]);

    // Track user interactions for smart rating
    useEffect(() => {
        if (lastResponseTime) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && lastMessage.role === 'assistant' && lastMessage.id) {
                setUserInteractionData(prev => ({
                    ...prev,
                    messageId: lastMessage.id || null,
                    startTime: new Date(),
                    hasClickedLink: false
                }));
            }
        }
    }, [lastResponseTime, messages]);    // Enhanced utility function to handle both markdown and HTML content
    function markdownToHtml(text: string): string {
        if (!text) return '';

        // Check if the text already contains HTML (specifically, product cards from AI search)
        const containsHTML = text.includes('<div') || text.includes('<img') || text.includes('<p style');

        if (containsHTML) {
            // If it contains HTML, just process markdown links and return
            let processedText = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, linkText, url) => {
                const isExternal = url.startsWith('http://') || url.startsWith('https://');
                const target = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
                return `<a href="${url}" class="text-blue-600 hover:underline"${target}>${linkText}</a>`;
            });
            return processedText;
        }

        // For non-HTML content, process markdown links and plain URLs
        let processedText = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, linkText, url) => {
            const isExternal = url.startsWith('http://') || url.startsWith('https://');
            const target = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
            return `<a href="${url}" class="text-blue-600 hover:underline"${target}>${linkText}</a>`;
        });

        // Then replace plain URLs with clickable links
        processedText = processedText.replace(/(https?:\/\/[^\s]+)/g, (url) => {
            return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${url}</a>`;
        });

        // Convert line breaks to <br> tags for better formatting
        processedText = processedText.replace(/\n/g, '<br>');

        return processedText;
    }

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    async function onSubmit(values: z.infer<typeof messageSchema>) {
        const messageContent = values.message;

        // Check if this is a follow-up question for smart rating
        const lastAssistantMessage = messages.slice().reverse().find(m => m.role === 'assistant');
        if (lastAssistantMessage && lastAssistantMessage.id && userInteractionData.messageId) {
            await submitSmartRating(lastAssistantMessage.id, 'asked_followup', messageContent);
        }

        await sendMessage(messageContent);
    }

    async function sendMessage(messageContent: string) {
        try {
            // Add user message to chat
            const userMessage: Message = {
                role: "user",
                content: messageContent,
                timestamp: new Date()
            };
            setMessages((prev) => [...prev, userMessage]);

            // Clear form
            form.reset();

            // Set loading state
            setIsLoading(true);            // Send message to enhanced AI API
            const response = await fetch("/api/ai-chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messages: [...messages, userMessage],
                    sessionId,
                    currency,
                    userContext: {
                        page: window.location.pathname,
                        referrer: document.referrer,
                        userAgent: navigator.userAgent
                    }
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            } const data = await response.json();

            // Add assistant response to chat with the actual message ID from the database
            const assistantMessage: Message = {
                id: data.messageId, // Use the actual database message ID
                role: "assistant",
                content: data.message,
                timestamp: new Date(),
                confidence: data.confidence,
                patternMatched: data.patternMatched,
                suggestions: data.suggestions
            };

            setMessages((prev) => [...prev, assistantMessage]);
            setConversationId(data.conversationId);
            setCurrentSuggestions(data.suggestions || []);
            setLastResponseTime(new Date());

        } catch (error) {
            console.error("Chat error:", error);
            toast.error("Sorry, there was an error processing your request. Please try again.");

            // Add error message
            setMessages((prev) => [...prev, {
                role: "assistant",
                content: "I'm sorry, I'm experiencing technical difficulties right now. Please try asking your question in a different way, or contact our support team directly at support@uniqverse.com or 1-800-555-1234.",
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    }

    async function provideFeedback(messageId: string | undefined, isHelpful: boolean) {
        try {
            if (!conversationId) return;

            await fetch("/api/ai-chat", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    conversationId,
                    messageId,
                    rating: isHelpful ? 5 : 1,
                    feedbackType: isHelpful ? 'helpful' : 'not_helpful'
                }),
            });

            // Also submit smart rating
            if (messageId) {
                await submitSmartRating(messageId, isHelpful ? 'continued_chat' : 'ended_chat');
            }

            toast.success(`Thank you for your feedback!`);
        } catch (error) {
            console.error("Feedback error:", error);
        }
    }

    function handleSuggestionClick(suggestion: string) {
        sendMessage(suggestion);
        setCurrentSuggestions([]);
    }

    function resetConversation() {
        setMessages([{
            role: "system",
            content: "Welcome to UniQVerse support! I'm an AI assistant here to help you with any questions about our products, orders, shipping, returns, and more. How can I assist you today?",
        }]);
        setConversationId(null);
        setCurrentSuggestions([]);
        setUserInteractionData({ messageId: null, startTime: null, hasClickedLink: false });
        toast.success("Conversation reset!");
    }

    // Handle chat window close
    const handleChatClose = useCallback(async () => {
        if (userInteractionData.messageId) {
            await submitSmartRating(userInteractionData.messageId, 'ended_chat');
        }
        setIsOpen(false);
    }, [userInteractionData.messageId, submitSmartRating]);

    return (
        <>
            {/* Chat Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110 z-50"
                    aria-label="Open chat support"
                >
                    <MessageSquare className="h-6 w-6" />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-80 h-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
                    {/* Chat Header */}
                    <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">                        <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        <div>
                            <h3 className="font-medium">{config.chatbot_name}</h3>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                <span className="text-xs opacity-90">Online</span>
                            </div>
                        </div>
                    </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={resetConversation}
                                className="p-1 rounded-full hover:bg-blue-500 transition-colors"
                                title="Reset conversation"
                            >
                                <RefreshCw className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setMinimized(!minimized)}
                                className="p-1 rounded-full hover:bg-blue-500 transition-colors"
                            >
                                <MinusCircle className="h-5 w-5" />
                            </button>
                            <button
                                onClick={handleChatClose}
                                className="p-1 rounded-full hover:bg-blue-500 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {!minimized && (
                        <>
                            {/* Chat Messages */}
                            <div className="flex-1 p-4 overflow-y-auto h-[320px] bg-gray-50">
                                {messages.map((message, index) => (
                                    <div key={index}>                                        <div
                                        className={`mb-4 ${message.role === "user"
                                            ? "ml-auto bg-blue-100 rounded-tl-lg rounded-br-lg rounded-bl-lg max-w-[85%]"
                                            : message.role === "system"
                                                ? "bg-white border border-gray-200 rounded-tr-lg rounded-br-lg rounded-bl-lg max-w-[95%]"
                                                : "bg-white border border-gray-200 rounded-tr-lg rounded-br-lg rounded-bl-lg max-w-[95%]"
                                            } p-3 shadow-sm`}
                                    >
                                        <div
                                            dangerouslySetInnerHTML={{ __html: markdownToHtml(message.content) }}
                                            className="prose prose-sm max-w-none [&_img]:max-w-none [&_img]:w-auto [&_img]:h-auto [&_div]:max-w-none"
                                            onClick={() => {
                                                // Track link clicks
                                                if (message.id && message.role === 'assistant') {
                                                    setUserInteractionData(prev => ({ ...prev, hasClickedLink: true }));
                                                    submitSmartRating(message.id!, 'clicked_link');
                                                }
                                            }}
                                        />

                                        {/* Confidence indicator for AI responses */}
                                        {message.role === "assistant" && message.confidence && (
                                            <div className="mt-2 text-xs text-gray-500">
                                                Confidence: {Math.round(message.confidence * 100)}%
                                            </div>
                                        )}
                                    </div>

                                        {/* Feedback buttons for assistant messages */}
                                        {message.role === "assistant" && index > 0 && (
                                            <div className="flex gap-2 mb-2 ml-2">
                                                <button
                                                    onClick={() => provideFeedback(message.id, true)}
                                                    className="text-green-600 hover:text-green-700 text-xs flex items-center gap-1"
                                                    title="This was helpful"
                                                >
                                                    <ThumbsUp className="h-3 w-3" />
                                                    Helpful
                                                </button>
                                                <button
                                                    onClick={() => provideFeedback(message.id, false)}
                                                    className="text-red-600 hover:text-red-700 text-xs flex items-center gap-1"
                                                    title="This wasn't helpful"
                                                >
                                                    <ThumbsDown className="h-3 w-3" />
                                                    Not helpful
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Loading indicator */}
                                {isLoading && (
                                    <div className="mb-4 max-w-[85%] bg-white border border-gray-200 rounded-tr-lg rounded-br-lg rounded-bl-lg p-3 flex items-center shadow-sm">
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        <span className="text-sm text-gray-600">AI is typing...</span>
                                    </div>
                                )}

                                {/* Suggestions */}
                                {currentSuggestions.length > 0 && !isLoading && (
                                    <div className="mb-4">
                                        <div className="text-xs text-gray-500 mb-2">Suggested questions:</div>
                                        <div className="flex flex-col gap-1">
                                            {currentSuggestions.map((suggestion, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleSuggestionClick(suggestion)}
                                                    className="text-left text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 p-2 rounded border border-blue-200 transition-colors"
                                                >
                                                    {suggestion}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Chat Input */}
                            <div className="border-t p-3 bg-white rounded-b-lg">
                                <Form {...form}>
                                    <form
                                        onSubmit={form.handleSubmit(onSubmit)}
                                        className="flex gap-2"
                                    >
                                        <FormField
                                            control={form.control}
                                            name="message"
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Type your message..."
                                                            {...field}
                                                            disabled={isLoading}
                                                            className="border-gray-300 focus:border-blue-500"
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <Button
                                            type="submit"
                                            disabled={isLoading}
                                            size="sm"
                                            className="px-3"
                                        >
                                            {isLoading ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Send className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </form>
                                </Form>

                                {/* Quick links */}
                                <div className="mt-2 text-xs text-gray-500 text-center">
                                    Need more help? {" "}
                                    <Link
                                        href="/support"
                                        className="text-blue-600 hover:underline"
                                        onClick={() => {
                                            if (userInteractionData.messageId) {
                                                submitSmartRating(userInteractionData.messageId, 'escalated');
                                            }
                                        }}
                                    >
                                        Submit a ticket
                                    </Link>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
}