"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
    MessageSquare,
    X,
    Send,
    Loader2,
    Minimize2,
    Maximize2,
    ThumbsUp,
    ThumbsDown,
    RefreshCw,
    Bot,
    User,
    Sparkles,
    HelpCircle,
    ExternalLink,
    Zap
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useCurrency } from "@/contexts/currency-provider";
import styles from "./ChatBot.module.css";

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
    const [isMinimized, setIsMinimized] = useState(false);
    const [config, setConfig] = useState({
        chatbot_name: 'UniQVerse AI Support',
        welcome_message: 'Hello! 👋 Welcome to UniQVerse support! I\'m your AI assistant here to help you with any questions about our products, orders, shipping, returns, and more. How can I assist you today?',
        enable_feedback_buttons: true,
        chatbot_color: 'blue',
        chat_window_size: 'medium',
        chatbot_position: 'bottom-right'
    });
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);
    const [lastResponseTime, setLastResponseTime] = useState<Date | null>(null);
    const [userInteractionData, setUserInteractionData] = useState<{
        messageId: string | null;
        startTime: Date | null;
        hasClickedLink: boolean;
    }>({ messageId: null, startTime: null, hasClickedLink: false });
    const [unreadCount, setUnreadCount] = useState(0);
    const [showQuickActions, setShowQuickActions] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Get currency context for product suggestions
    const { currency } = useCurrency();

    const form = useForm({
        resolver: zodResolver(messageSchema),
        defaultValues: {
            message: "",
        },
    });    // Load chatbot configuration on mount
    useEffect(() => {
        const loadConfig = async () => {
            try {
                const response = await fetch('/api/admin/chatbot-config');
                const data = await response.json();

                if (data.success) {
                    setConfig(data.config);
                    // Initialize messages with the configured welcome message
                    setMessages([{
                        role: "assistant",
                        content: data.config.welcome_message || 'Hello! 👋 Welcome to UniQVerse support! I\'m your AI assistant here to help you with any questions about our products, orders, shipping, returns, and more. How can I assist you today?',
                        timestamp: new Date(),
                    }]);
                }
            } catch (error) {
                console.error('Failed to load chatbot config:', error);
                // Use default welcome message on error
                setMessages([{
                    role: "assistant",
                    content: 'Hello! 👋 Welcome to UniQVerse support! I\'m your AI assistant here to help you with any questions about our products, orders, shipping, returns, and more. How can I assist you today?',
                    timestamp: new Date(),
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
    }, [lastResponseTime, messages]);    // Simulate typing effect for better UX
    const simulateTyping = useCallback(() => {
        setIsTyping(true);
        const typingDuration = Math.random() * 1000 + 1500; // 1.5-2.5 seconds
        setTimeout(() => {
            setIsTyping(false);
        }, typingDuration);
    }, []);

    // Enhanced utility function to handle both markdown and HTML content
    function markdownToHtml(text: string): string {
        if (!text) return '';

        // Check if the text already contains HTML (specifically, product cards from AI search)
        const containsHTML = text.includes('<div') || text.includes('<img') || text.includes('<p style');

        if (containsHTML) {
            // If it contains HTML, just process markdown links and return
            let processedText = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, linkText, url) => {
                const isExternal = url.startsWith('http://') || url.startsWith('https://');
                const target = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
                return `<a href="${url}" class="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200 font-medium"${target}>${linkText}${isExternal ? '<svg class="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path><path d="M5 5a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2v-2a1 1 0 10-2 0v2H5V7h2a1 1 0 000-2H5z"></path></svg>' : ''}</a>`;
            });
            return processedText;
        }

        // For non-HTML content, process markdown links and plain URLs
        let processedText = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, linkText, url) => {
            const isExternal = url.startsWith('http://') || url.startsWith('https://');
            const target = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
            return `<a href="${url}" class="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200 font-medium"${target}>${linkText}${isExternal ? '<svg class="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path><path d="M5 5a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2v-2a1 1 0 10-2 0v2H5V7h2a1 1 0 000-2H5z"></path></svg>' : ''}</a>`;
        });

        // Then replace plain URLs with clickable links
        processedText = processedText.replace(/(https?:\/\/[^\s]+)/g, (url) => {
            return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200 font-medium">${url}<svg class="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path><path d="M5 5a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2v-2a1 1 0 10-2 0v2H5V7h2a1 1 0 000-2H5z"></path></svg></a>`;
        });

        // Convert line breaks to <br> tags for better formatting
        processedText = processedText.replace(/\n/g, '<br>');

        // Format bold text
        processedText = processedText.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');

        // Format bullet points
        processedText = processedText.replace(/^• (.+)/gm, '<span class="flex items-start gap-2 my-1"><span class="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span><span>$1</span></span>');

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
    } async function sendMessage(messageContent: string) {
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

            // Set loading state and simulate typing
            setIsLoading(true);
            simulateTyping();

            // Hide quick actions after first user message
            setShowQuickActions(false);

            // Send message to enhanced AI API
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
            }

            const data = await response.json();

            // Wait for typing animation to complete
            await new Promise(resolve => setTimeout(resolve, 1000));

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

            // Update unread count if chat is minimized
            if (isMinimized) {
                setUnreadCount(prev => prev + 1);
            }

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
            setIsTyping(false);
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
    } function resetConversation() {
        setMessages([{
            role: "assistant",
            content: "Hello! 👋 Welcome to UniQVerse support! I'm your AI assistant here to help you with any questions about our products, orders, shipping, returns, and more. How can I assist you today?",
            timestamp: new Date(),
        }]);
        setConversationId(null);
        setCurrentSuggestions([]);
        setUserInteractionData({ messageId: null, startTime: null, hasClickedLink: false });
        setShowQuickActions(true);
        toast.success("Conversation reset!");
    }

    // Handle chat window open
    const handleChatOpen = useCallback(() => {
        setIsOpen(true);
        setUnreadCount(0);
        if (isMinimized) {
            setIsMinimized(false);
        }
    }, [isMinimized]);

    // Handle chat window minimize/maximize
    const handleToggleMinimize = useCallback(() => {
        setIsMinimized(!isMinimized);
        if (!isMinimized) {
            setUnreadCount(0);
        }
    }, [isMinimized]);

    // Handle chat window close
    const handleChatClose = useCallback(async () => {
        if (userInteractionData.messageId) {
            await submitSmartRating(userInteractionData.messageId, 'ended_chat');
        }
        setIsOpen(false);
        setIsMinimized(false);
        setUnreadCount(0);
    }, [userInteractionData.messageId, submitSmartRating]);

    // Quick action buttons data
    const quickActions = [
        { label: "Track my order", icon: "📦" },
        { label: "Shipping info", icon: "🚚" },
        { label: "Return policy", icon: "↩️" },
        { label: "Contact support", icon: "📞" }]; return (
            <div className="chatbot-container" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999999 }}>
                {/* Modern Floating Chat Button */}
                {!isOpen && (
                    <div
                        className={`fixed bottom-6 right-6 ${styles.floatingButton}`}
                        style={{
                            zIndex: 999999,
                            position: 'fixed',
                            bottom: '24px',
                            right: '24px',
                            pointerEvents: 'auto'
                        }}
                    >
                        <button
                            onClick={handleChatOpen}
                            className={`group relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full p-4 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 transform ${styles.subtleGlow}`}
                            aria-label="Open AI chat support"
                        >
                            {/* Notification badge */}
                            {unreadCount > 0 && (
                                <div className={`absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-semibold ${styles.notificationPulse}`}>
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </div>
                            )}

                            {/* Sparkle animation */}
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>                        <MessageSquare className="h-6 w-6 relative z-10" />

                            {/* Pulse ring effect */}
                            <div className="absolute inset-0 rounded-full bg-blue-600 opacity-30 animate-ping"></div>
                        </button>

                        {/* Enhanced Tooltip */}
                        <div className="absolute bottom-full right-0 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                            <div className={`px-4 py-2 bg-gray-900 text-white text-sm rounded-xl shadow-lg ${styles.glassmorphism}`}>
                                <div className="flex items-center gap-2">
                                    <Zap className="h-3 w-3" />
                                    <span className="font-medium">Chat with AI Support</span>
                                </div>
                                <div className="text-xs text-gray-300 mt-1">Instant answers • 24/7 available</div>
                                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-6 border-transparent border-t-gray-900"></div>
                            </div>
                        </div>
                    </div>
                )}            {/* Modern Chat Window */}
                {isOpen && (
                    <div
                        className={`bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col transition-all duration-300 ${styles.chatWindowSlideIn} ${styles.subtleGlow} ${isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
                            } ${styles.chatWindow}`}
                        style={{
                            position: 'fixed',
                            bottom: '24px',
                            right: '24px',
                            zIndex: 999999,
                            maxHeight: 'calc(100vh - 48px)',
                            pointerEvents: 'auto'
                        }}
                    >
                        {/* Enhanced Chat Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                        <Bot className="h-6 w-6" />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                                        <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">{config.chatbot_name}</h3>
                                    <div className="flex items-center gap-2 text-sm opacity-90">
                                        <Sparkles className="h-3 w-3" />
                                        <span>AI-Powered • Online</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={resetConversation}
                                    className={`p-2 rounded-full hover:bg-white/20 transition-colors group ${styles.bounceOnHover}`}
                                    title="Reset conversation"
                                >
                                    <RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-300" />
                                </button>
                                <button
                                    onClick={handleToggleMinimize}
                                    className={`p-2 rounded-full hover:bg-white/20 transition-colors ${styles.bounceOnHover}`}
                                    title={isMinimized ? "Maximize" : "Minimize"}
                                >
                                    {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                                </button>
                                <button
                                    onClick={handleChatClose}
                                    className={`p-2 rounded-full hover:bg-white/20 transition-colors group ${styles.bounceOnHover}`}
                                    title="Close chat"
                                >
                                    <X className="h-4 w-4 group-hover:rotate-90 transition-transform duration-200" />
                                </button>
                            </div>
                        </div>

                        {!isMinimized && (
                            <>
                                {/* Enhanced Chat Messages */}
                                <div className={`flex-1 p-4 overflow-y-auto bg-gradient-to-b from-gray-50 to-white ${styles.modernScrollbar}`}>
                                    {messages.map((message, index) => (
                                        <div key={index} className={`mb-6 ${styles.fadeInUp}`}>
                                            <div className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                                                {/* Enhanced Avatar */}
                                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.role === "user"
                                                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                                                    : "bg-gradient-to-r from-green-400 to-blue-500 text-white"
                                                    } ${styles.subtleGlow}`}>
                                                    {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                                </div>

                                                {/* Enhanced Message Bubble */}
                                                <div className={`flex-1 max-w-[85%] ${message.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                                                    <div className={`p-4 rounded-2xl shadow-sm ${styles.interactiveHover} ${message.role === "user"
                                                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white ml-auto rounded-br-md"
                                                        : "bg-white border border-gray-200 text-gray-800 mr-auto rounded-bl-md"
                                                        }`}>
                                                        <div
                                                            dangerouslySetInnerHTML={{ __html: markdownToHtml(message.content) }}
                                                            className={`prose prose-sm max-w-none ${message.role === "user"
                                                                ? "text-white [&_a]:text-blue-100 [&_a:hover]:text-white [&_strong]:text-white"
                                                                : "text-gray-800 [&_a]:text-blue-600 [&_a:hover]:text-blue-800"
                                                                }`}
                                                            onClick={() => {
                                                                // Track link clicks
                                                                if (message.id && message.role === 'assistant') {
                                                                    setUserInteractionData(prev => ({ ...prev, hasClickedLink: true }));
                                                                    submitSmartRating(message.id!, 'clicked_link');
                                                                }
                                                            }}
                                                        />

                                                        {/* Enhanced Confidence indicator for AI responses */}
                                                        {message.role === "assistant" && message.confidence && (
                                                            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-full px-3 py-1">
                                                                <div className={`w-2 h-2 rounded-full ${message.confidence > 0.8 ? 'bg-green-400' :
                                                                    message.confidence > 0.6 ? 'bg-yellow-400' : 'bg-red-400'
                                                                    }`}></div>
                                                                <span>Confidence: {Math.round(message.confidence * 100)}%</span>
                                                                <Sparkles className="h-3 w-3 text-blue-500" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Enhanced Timestamp */}
                                                    <div className={`text-xs text-gray-500 mt-2 px-2 ${message.role === "user" ? "text-right" : "text-left"
                                                        }`}>
                                                        {message.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>

                                                    {/* Enhanced Feedback buttons for assistant messages */}
                                                    {message.role === "assistant" && index > 0 && config.enable_feedback_buttons && (
                                                        <div className="flex gap-2 mt-3 ml-2">
                                                            <button
                                                                onClick={() => provideFeedback(message.id, true)}
                                                                className={`flex items-center gap-1 px-3 py-1.5 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full transition-all group ${styles.bounceOnHover} ${styles.interactiveHover}`}
                                                                title="This was helpful"
                                                            >
                                                                <ThumbsUp className="h-3 w-3 group-hover:scale-110 transition-transform" />
                                                                Helpful
                                                            </button>
                                                            <button
                                                                onClick={() => provideFeedback(message.id, false)}
                                                                className={`flex items-center gap-1 px-3 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-all group ${styles.bounceOnHover} ${styles.interactiveHover}`}
                                                                title="This wasn't helpful"
                                                            >
                                                                <ThumbsDown className="h-3 w-3 group-hover:scale-110 transition-transform" />
                                                                Not helpful
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Enhanced Typing indicator */}
                                    {(isLoading || isTyping) && (
                                        <div className={`mb-6 ${styles.fadeInUp}`}>
                                            <div className="flex gap-3">
                                                <div className={`w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-blue-500 text-white flex items-center justify-center ${styles.subtleGlow}`}>
                                                    <Bot className="h-4 w-4" />
                                                </div>
                                                <div className={`bg-white border border-gray-200 rounded-2xl rounded-bl-md p-4 mr-auto ${styles.glassmorphism}`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={styles.typingDots}>
                                                            <div className={styles.typingDot}></div>
                                                            <div className={styles.typingDot}></div>
                                                            <div className={styles.typingDot}></div>
                                                        </div>
                                                        <span className="text-sm text-gray-600 font-medium">AI is thinking...</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Enhanced Quick Actions */}
                                    {showQuickActions && messages.length === 1 && !isLoading && (
                                        <div className={`mb-4 ${styles.fadeInUp}`}>
                                            <div className="text-sm text-gray-600 mb-3 text-center font-medium">Quick actions to get started:</div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {quickActions.map((action, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handleSuggestionClick(action.label)}
                                                        className={`flex items-center gap-2 p-3 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl transition-all duration-200 text-left group ${styles.interactiveHover}`}
                                                    >
                                                        <span className="text-lg">{action.icon}</span>
                                                        <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">{action.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Enhanced Suggestions */}
                                    {currentSuggestions.length > 0 && !isLoading && (
                                        <div className={`mb-4 ${styles.fadeInUp}`}>
                                            <div className="text-sm text-gray-600 mb-3 flex items-center gap-2 font-medium">
                                                <HelpCircle className="h-4 w-4" />
                                                You might also be interested in:
                                            </div>
                                            <div className="space-y-2">
                                                {currentSuggestions.map((suggestion, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handleSuggestionClick(suggestion)}
                                                        className={`w-full text-left p-3 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border border-blue-200 hover:border-blue-300 rounded-xl transition-all duration-200 text-sm font-medium text-blue-700 group ${styles.interactiveHover}`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span>{suggestion}</span>
                                                            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Enhanced Chat Input */}
                                <div className="border-t border-gray-200 p-4 bg-white rounded-b-2xl">
                                    <Form {...form}>
                                        <form
                                            onSubmit={form.handleSubmit(onSubmit)}
                                            className="flex gap-3"
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
                                                                className={`border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white transition-all duration-200 ${styles.focusRing}`}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                            <Button
                                                type="submit"
                                                disabled={isLoading}
                                                className={`px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 group ${styles.bounceOnHover}`}
                                            >
                                                {isLoading ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Send className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                                                )}
                                            </Button>
                                        </form>
                                    </Form>

                                    {/* Enhanced footer links */}
                                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                                        <div className="flex items-center gap-4">
                                            <Link
                                                href="/support"
                                                className={`hover:text-blue-600 transition-colors flex items-center gap-1 ${styles.interactiveHover}`}
                                                onClick={() => {
                                                    if (userInteractionData.messageId) {
                                                        submitSmartRating(userInteractionData.messageId, 'escalated');
                                                    }
                                                }}
                                            >
                                                <HelpCircle className="h-3 w-3" />
                                                Support Center
                                            </Link>
                                            <Link
                                                href="/contact"
                                                className={`hover:text-blue-600 transition-colors ${styles.interactiveHover}`}
                                            >
                                                Contact Us
                                            </Link>
                                        </div>
                                        <div className={`flex items-center gap-1 text-gray-400 ${styles.gradientText}`}>
                                            <Sparkles className="h-3 w-3" />
                                            <span>Powered by AI</span>                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        );
}