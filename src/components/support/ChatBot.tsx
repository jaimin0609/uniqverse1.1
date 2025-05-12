"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, X, Send, Loader2, MinusCircle } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Link from "next/link";

// Message schema for type safety
const messageSchema = z.object({
    message: z.string().min(1, "Please enter a message"),
});

type Message = {
    role: "user" | "assistant" | "system";
    content: string;
};

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "system",
            content: "Welcome to UniQVerse support! How can I help you today?",
        },
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [minimized, setMinimized] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Simple utility function to convert markdown links to HTML
    function markdownToHtml(text: string): string {
        if (!text) return '';

        // First replace markdown links with HTML links
        let processedText = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, linkText, url) => {
            const isExternal = url.startsWith('http://') || url.startsWith('https://');
            const target = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
            return `<a href="${url}" class="text-blue-600 hover:underline"${target}>${linkText}</a>`;
        });

        // Then replace plain URLs with clickable links
        processedText = processedText.replace(/(https?:\/\/[^\s]+)/g, (url) => {
            return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${url}</a>`;
        });

        return processedText;
    }

    const form = useForm({
        resolver: zodResolver(messageSchema),
        defaultValues: {
            message: "",
        },
    });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    async function onSubmit(values: z.infer<typeof messageSchema>) {
        try {
            // Add user message to chat
            const userMessage = { role: "user" as const, content: values.message };
            setMessages((prev) => [...prev, userMessage]);

            // Clear form
            form.reset();

            // Set loading state
            setIsLoading(true);

            // Send message to API
            const response = await fetch("/api/support/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messages: [...messages, userMessage],
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to get response");
            }

            const data = await response.json();

            // Add assistant response to chat
            setMessages((prev) => [...prev, {
                role: "assistant",
                content: data.message
            }]);

        } catch (error) {
            console.error("Chat error:", error);
            toast.error("Sorry, there was an error processing your request. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <>
            {/* Chat Button */}
            <div className="fixed bottom-4 right-4 z-50">
                <Button
                    onClick={() => {
                        setIsOpen(!isOpen);
                        setMinimized(false);
                    }}
                    size="icon"
                    className="h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700"
                >
                    {isOpen ? (
                        <X className="h-6 w-6" />
                    ) : (
                        <MessageSquare className="h-6 w-6" />
                    )}
                </Button>
            </div>

            {/* Chat Widget */}
            {isOpen && (
                <div
                    className={`fixed right-4 bottom-20 z-50 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 transition-all duration-300 ease-in-out ${minimized ? "h-16" : "h-[500px]"
                        }`}
                >
                    {/* Chat Header */}
                    <div className="flex items-center justify-between bg-blue-600 text-white p-3 rounded-t-lg">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            <h3 className="font-medium">UniQVerse Support</h3>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setMinimized(!minimized)}
                                className="p-1 rounded-full hover:bg-blue-500 transition-colors"
                            >
                                <MinusCircle className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 rounded-full hover:bg-blue-500 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {!minimized && (
                        <>
                            {/* Chat Messages */}
                            <div className="flex-1 p-4 overflow-y-auto h-[380px]">
                                {messages.map((message, index) => (
                                    <div
                                        key={index}
                                        className={`mb-4 max-w-[80%] ${message.role === "user"
                                            ? "ml-auto bg-blue-100 rounded-tl-lg rounded-br-lg rounded-bl-lg"
                                            : message.role === "system"
                                                ? "bg-gray-100 rounded-tr-lg rounded-br-lg rounded-bl-lg"
                                                : "bg-gray-100 rounded-tr-lg rounded-br-lg rounded-bl-lg"
                                            } p-3`}
                                    >
                                        <div dangerouslySetInnerHTML={{ __html: markdownToHtml(message.content) }} />
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="mb-4 max-w-[80%] bg-gray-100 rounded-tr-lg rounded-br-lg rounded-bl-lg p-3 flex items-center">
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Typing...
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Chat Input */}
                            <div className="border-t p-3">
                                <Form {...form}>
                                    <form
                                        onSubmit={form.handleSubmit(onSubmit)}
                                        className="flex items-center gap-2"
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
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <Button
                                            type="submit"
                                            size="icon"
                                            disabled={isLoading}
                                            className="h-10 w-10"
                                        >
                                            {isLoading ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Send className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </form>
                                </Form>
                            </div>
                        </>
                    )}
                </div >
            )
            }
        </>
    );
}