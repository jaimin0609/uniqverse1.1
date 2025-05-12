import { NextResponse } from "next/server";
import { knowledgeBase } from "@/lib/support-knowledge-base";
import { db } from "@/lib/db";
import { generateResponse, seedChatbotPatternsIfEmpty } from "../chatbot/route";

// Define the ChatHistoryItem type for proper type checking
type ChatHistoryItem = {
    role: 'user' | 'assistant';
    content: string;
};

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json(
                { error: "Invalid request format" },
                { status: 400 }
            );
        }

        // Get the last user message
        const lastUserMessage = messages
            .filter((msg: any) => msg.role === "user")
            .pop();

        if (!lastUserMessage || !lastUserMessage.content) {
            return NextResponse.json(
                { error: "No valid user message found" },
                { status: 400 }
            );
        }

        // Try using the imported generateResponse function from chatbot route
        try {
            const response = await generateResponse(lastUserMessage.content);
            return NextResponse.json({ message: response });
        } catch (primaryError) {
            console.error("Error using primary generateResponse:", primaryError);

            // Fall back to local processing if the imported function fails
            try {
                // Check if chatbot models are available in Prisma client
                const hasChatbotModels = !!db.chatbotPattern &&
                    !!db.chatbotTrigger &&
                    !!db.chatbotFallback;

                if (!hasChatbotModels) {
                    console.warn("Chatbot models not available in Prisma client yet. Using knowledge base directly.");
                    // Process message using static knowledge base
                    const response = await processStaticMessage(lastUserMessage.content, messages);
                    return NextResponse.json({ message: response });
                }

                // First ensure we have patterns in the database
                await seedChatbotPatternsIfEmpty();

                // Process the message with our rule-based system
                const response = await processMessage(lastUserMessage.content, messages);

                // Return the response
                return NextResponse.json({ message: response });
            } catch (dbError) {
                console.error("Database error:", dbError);
                // Fallback to static processing if database access fails
                const response = await processStaticMessage(lastUserMessage.content, messages);
                return NextResponse.json({ message: response });
            }
        }
    } catch (error: any) {
        console.error("Chat API error:", error);

        // Final fallback - return a generic helpful message
        return NextResponse.json({
            message: "I'm having trouble processing your request right now. Please try asking your question in a different way, or try again later."
        });
    }
}

// Process messages using static knowledge base (no database)
async function processStaticMessage(message: string, allMessages: any[]): Promise<string> {
    // Safety check for null/undefined input
    if (!message) {
        return "Could you please provide more details about your question?";
    }

    // Convert message to lowercase for case-insensitive matching
    const lowerMessage = message.toLowerCase();

    // If the message is very short (less than 3 characters), ask for more details
    if (lowerMessage.trim().length < 3) {
        return "Could you please provide more details about your question? This will help me give you a better answer.";
    }

    try {
        // Check for conversation context (looking for follow-up questions)
        const isFollowUp = checkIfFollowUp(lowerMessage, allMessages);
        if (isFollowUp && isFollowUp.isFollowUp && isFollowUp.topic) {
            return getFollowUpResponse(isFollowUp.topic, lowerMessage);
        }

        // Break message into keywords for better matching
        const keywords = extractKeywords(lowerMessage);

        // Use the static knowledge base
        const patterns = knowledgeBase.chatPatterns || [];

        // Track matching scores for each pattern
        const patternScores: { pattern: any, score: number }[] = [];

        // Try to match the message against our patterns
        for (const pattern of patterns) {
            // Safety check for malformed patterns
            if (!pattern || !pattern.patterns || !Array.isArray(pattern.patterns)) {
                continue;
            }

            // Calculate match score
            let score = 0;

            // Extract trigger phrases from the pattern
            const triggerPhrases = pattern.patterns;

            // Check direct substring matches
            const directMatch = triggerPhrases.some(phrase =>
                phrase && lowerMessage.includes(phrase.toLowerCase())
            );

            if (directMatch) {
                score += 10; // High score for direct match
            }

            // Check keyword matches
            const patternKeywords = triggerPhrases.flatMap(phrase =>
                phrase ? extractKeywords(phrase) : []
            );

            for (const keyword of keywords) {
                if (patternKeywords.includes(keyword)) {
                    score += 2; // Add points for each keyword match
                }
            }

            if (score > 0 && pattern.response) {
                patternScores.push({ pattern, score });
            }
        }

        // Sort by score (highest first)
        patternScores.sort((a, b) => b.score - a.score);

        // If we have a good match, return it
        if (patternScores.length > 0 && patternScores[0].score >= 2) {
            return patternScores[0].pattern.response;
        }

        // If no pattern matches, return a random fallback response
        const fallbacks = knowledgeBase.fallbackResponses || [];
        if (fallbacks.length > 0) {
            const randomIndex = Math.floor(Math.random() * fallbacks.length);
            return fallbacks[randomIndex];
        } else {
            return "I'm sorry, I don't have an answer for that question. Please contact our support team for assistance.";
        }
    } catch (error) {
        console.error("Error in processStaticMessage:", error);
        return "I'm having trouble processing your question. Please try asking in a different way.";
    }
}

// Function to process messages and return responses based on patterns
async function processMessage(message: string, allMessages: any[]): Promise<string> {
    // Safety check for null/undefined input
    if (!message) {
        return "Could you please provide more details about your question?";
    }

    // Convert message to lowercase for case-insensitive matching
    const lowerMessage = message.toLowerCase();

    // If the message is very short (less than 3 characters), ask for more details
    if (lowerMessage.trim().length < 3) {
        return "Could you please provide more details about your question? This will help me give you a better answer.";
    }

    try {
        // Check for conversation context (looking for follow-up questions)
        const isFollowUp = checkIfFollowUp(lowerMessage, allMessages);
        if (isFollowUp && isFollowUp.isFollowUp && isFollowUp.topic) {
            return getFollowUpResponse(isFollowUp.topic, lowerMessage);
        }

        // Break message into keywords for better matching
        const keywords = extractKeywords(lowerMessage);

        // Fetch all patterns and triggers from the database
        const dbPatterns = await db.chatbotPattern.findMany({
            include: {
                triggers: true,
            },
            orderBy: {
                priority: 'asc',
            },
            where: {
                isActive: true,
            }
        });

        // Safety check for empty patterns
        if (!dbPatterns || dbPatterns.length === 0) {
            return processStaticMessage(message, allMessages);
        }

        // Fetch all fallback responses
        const dbFallbacks = await db.chatbotFallback.findMany();

        // Track matching scores for each pattern
        const patternScores: { pattern: any, score: number }[] = [];

        // Try to match the message against our patterns
        for (const pattern of dbPatterns) {
            // Safety check for pattern structure
            if (!pattern || !pattern.triggers) continue;

            // Calculate match score
            let score = 0;

            // Extract trigger phrases from the pattern
            const triggerPhrases = pattern.triggers.map(trigger => trigger?.phrase).filter(Boolean);

            // Skip if no valid trigger phrases
            if (triggerPhrases.length === 0) continue;

            // Check direct substring matches
            const directMatch = triggerPhrases.some(phrase =>
                phrase && lowerMessage.includes(phrase.toLowerCase())
            );

            if (directMatch) {
                score += 10; // High score for direct match
            }

            // Check keyword matches
            const patternKeywords = triggerPhrases.flatMap(phrase =>
                phrase ? extractKeywords(phrase) : []
            );

            for (const keyword of keywords) {
                if (patternKeywords.includes(keyword)) {
                    score += 2; // Add points for each keyword match
                }
            }

            if (score > 0 && pattern.response) {
                patternScores.push({ pattern, score });
            }
        }

        // Sort by score (highest first)
        patternScores.sort((a, b) => b.score - a.score);

        // If we have a good match, return it
        if (patternScores.length > 0 && patternScores[0].score >= 2) {
            return patternScores[0].pattern.response;
        }

        // If no pattern matches, return a random fallback response
        if (dbFallbacks && dbFallbacks.length > 0) {
            const validFallbacks = dbFallbacks.filter(f => f && f.response);
            if (validFallbacks.length > 0) {
                const randomIndex = Math.floor(Math.random() * validFallbacks.length);
                return validFallbacks[randomIndex].response;
            }
        }

        // Last resort fallback to static responses if database is empty or has invalid entries
        return processStaticMessage(message, allMessages);
    } catch (error) {
        console.error("Error in processMessage:", error);
        // If database processing fails, fall back to static processing
        return processStaticMessage(message, allMessages);
    }
}

// Helper function to extract keywords from text
function extractKeywords(text: string): string[] {
    // Handle null or undefined input
    if (!text) return [];

    try {
        // Remove punctuation and convert to lowercase
        const cleanText = text.toLowerCase().replace(/[^\w\s]/g, '');

        // Split into words
        const words = cleanText.split(/\s+/).filter(Boolean);

        // Filter out common stop words
        const stopWords = ['a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
            'be', 'been', 'being', 'in', 'on', 'at', 'to', 'for', 'with',
            'about', 'by', 'of', 'from', 'up', 'down', 'that', 'this', 'these',
            'those', 'them', 'they', 'their', 'i', 'me', 'my', 'mine', 'you',
            'your', 'yours', 'he', 'him', 'his', 'she', 'her', 'hers', 'it', 'its',
            'do', 'does', 'did', 'have', 'has', 'had', 'would', 'could', 'should'];

        return words.filter(word => word.length > 1 && !stopWords.includes(word));
    } catch (error) {
        console.error("Error in extractKeywords:", error);
        return [];
    }
}

// Check if the current message is a follow-up to the previous conversation
function checkIfFollowUp(message: string, history: any[]): { isFollowUp: boolean; topic: string | null } {
    try {
        if (!history || !Array.isArray(history) || history.length === 0) {
            return { isFollowUp: false, topic: null };
        }

        // Get the last few messages for context
        const recentHistory = history.slice(-3); // Consider last 3 messages for context

        if (!recentHistory || recentHistory.length === 0) {
            return { isFollowUp: false, topic: null };
        }

        // Common follow-up phrases and patterns
        const followUpIndicators = [
            'what about', 'how about', 'and', 'but', 'also', 'what if',
            'then', 'so', 'additionally', 'another question', 'one more',
            'tell me more', 'more info', 'follow up', 'related to that',
            'on that note', 'speaking of', 'regarding that', 'to that point',
            'with respect to', 'concerning that', 'in that case'
        ];

        // Check if message starts with or contains follow-up indicators
        const containsFollowUpPhrase = followUpIndicators.some(phrase =>
            message.toLowerCase().trim().startsWith(phrase) ||
            message.toLowerCase().includes(` ${phrase} `)
        );

        // Check for pronouns referring to previous context
        const hasContextualPronouns = /\b(it|this|that|these|those|they|them|their)\b/i.test(message.toLowerCase());

        // Check if message is too short to be a standalone question (likely a follow-up)
        const isShortQuery = message.split(' ').length < 4 && !message.includes('?');

        // Extract the topic from the last bot response
        let lastBotMessage = '';
        let topicFromHistory: string | null = null;

        for (let i = recentHistory.length - 1; i >= 0; i--) {
            if (recentHistory[i] &&
                typeof recentHistory[i] === 'object' &&
                recentHistory[i].role === 'assistant' &&
                typeof recentHistory[i].content === 'string') {
                lastBotMessage = recentHistory[i].content;
                break;
            }
        }

        // Ensure we have a valid last bot message
        if (!lastBotMessage) {
            return { isFollowUp: isShortQuery || containsFollowUpPhrase || hasContextualPronouns, topic: null };
        }

        // Search for topic indicators in the last bot message
        const topicKeywords: { [key: string]: string[] } = {
            'shipping': ['shipping', 'delivery', 'ship', 'tracking', 'package', 'courier'],
            'returns': ['return', 'refund', 'exchange', 'money back', 'send back'],
            'payment': ['payment', 'pay', 'credit card', 'debit', 'transaction', 'checkout', 'billing'],
            'orders': ['order', 'purchase', 'bought', 'tracking', 'confirmation', 'invoice'],
            'products': ['product', 'item', 'catalog', 'inventory', 'merchandise', 'good'],
            'account': ['account', 'profile', 'login', 'sign in', 'password', 'register', 'username']
        };

        // First check the last bot message for topic context
        for (const [topic, keywords] of Object.entries(topicKeywords)) {
            if (keywords.some(keyword => lastBotMessage.toLowerCase().includes(keyword))) {
                topicFromHistory = topic;
                break;
            }
        }

        // If no topic found in last bot message, check the user's current message
        if (!topicFromHistory) {
            for (const [topic, keywords] of Object.entries(topicKeywords)) {
                if (keywords.some(keyword => message.toLowerCase().includes(keyword))) {
                    topicFromHistory = topic;
                    break;
                }
            }
        }

        // Determine if this is a follow-up based on our checks
        const isFollowUp = containsFollowUpPhrase || hasContextualPronouns || isShortQuery;

        return {
            isFollowUp: isFollowUp,
            topic: topicFromHistory
        };
    } catch (error) {
        console.error("Error in checkIfFollowUp:", error);
        return { isFollowUp: false, topic: null };
    }
}

// Generate detailed follow-up responses based on identified topic
function getFollowUpResponse(topic: string | null, message: string): string {
    try {
        // Safety check - if no topic is provided, return a generic response
        if (!topic) {
            return "I notice you're asking a follow-up question. To help you better, could you please provide a bit more detail about what you'd like to know?";
        }

        // Safety check for knowledgeBase
        if (!knowledgeBase) {
            return "I'm sorry, I'm having trouble accessing our knowledge base. Please provide more details about your question so I can assist you better.";
        }

        const kb = knowledgeBase;

        // Prepare more detailed follow-up information based on topic
        switch (topic) {
            case 'shipping':
                if (!kb.shipping) {
                    return "I'm sorry, I don't have detailed shipping information available. Please contact our customer service for shipping details.";
                }

                if (message.toLowerCase().includes('international')) {
                    return `For international shipping: ${kb.shipping.international || 'Available for select countries'}. If you need specific details about shipping to your country, please provide your location.`;
                } else if (message.toLowerCase().includes('track') || message.toLowerCase().includes('where')) {
                    return `To track your shipment, please check your order confirmation email for a tracking number, or log into your account and view your order details. The tracking information typically becomes available within 24 hours after your order has shipped.`;
                } else if (message.toLowerCase().includes('cost') || message.toLowerCase().includes('price') || message.toLowerCase().includes('fee')) {
                    // Check if methods exist and have required properties
                    if (Array.isArray(kb.shipping.methods) && kb.shipping.methods.length >= 3 &&
                        kb.shipping.methods[0] && kb.shipping.methods[1] && kb.shipping.methods[2]) {
                        return `Our shipping costs are: 
                        - ${kb.shipping.methods[0].name || 'Standard'}: ${kb.shipping.methods[0].cost || 'Varies by location'}
                        - ${kb.shipping.methods[1].name || 'Express'}: ${kb.shipping.methods[1].cost || 'Varies by location'}
                        - ${kb.shipping.methods[2].name || 'Overnight'}: ${kb.shipping.methods[2].cost || 'Varies by location'}`;
                    } else {
                        return "Our shipping costs vary based on the delivery method and your location. Please check our shipping page for detailed information.";
                    }
                } else {
                    if (Array.isArray(kb.shipping.methods)) {
                        const methodDescriptions = kb.shipping.methods
                            .filter(m => m && m.name && m.description)
                            .map(m => `${m.name} (${m.description})`)
                            .join(', ');

                        return `Here's more information about our shipping: We offer ${methodDescriptions || 'various shipping options'}. ${kb.shipping.restrictions || 'Some restrictions may apply.'}`;
                    } else {
                        return "We offer various shipping options including standard, express, and overnight delivery. Please check our shipping page for more details.";
                    }
                }

            case 'returns':
                if (!kb.returns) {
                    return "I'm sorry, I don't have detailed return information available. Please contact our customer service for our return policy.";
                }

                if (message.toLowerCase().includes('how') || message.toLowerCase().includes('process')) {
                    return `To return an item: 1) Log into your account, 2) Go to your orders, 3) Select the order and item you want to return, 4) Follow the return instructions. You'll receive a return shipping label via email. ${kb.returns.process || 'Our customer service team can assist you with any questions about returns.'}`;
                } else if (message.toLowerCase().includes('refund')) {
                    return `About refunds: ${kb.returns.refunds || 'Refunds are typically processed within 7-14 business days'}. If you paid with a credit card, the refund will go back to the same card. For other payment methods, please allow additional processing time.`;
                } else if (message.toLowerCase().includes('exception') || message.toLowerCase().includes('custom')) {
                    return `Return exceptions: ${kb.returns.exceptions || 'Some items may not be eligible for returns, including personalized items and final sale merchandise'}. Additionally, clearance items may have different return conditions, which are specified on the product page.`;
                } else {
                    return `Our complete return policy: ${kb.returns.policy || 'We accept returns within 30 days of purchase for most items'}. Returns must be initiated within 30 days of delivery, and items should be in original condition with all tags attached and packaging intact.`;
                }

            case 'payment':
                if (!kb.payment) {
                    return "I'm sorry, I don't have detailed payment information available. Please contact our customer service for payment options.";
                }

                if (message.toLowerCase().includes('method') || message.toLowerCase().includes('accept')) {
                    return `We accept the following payment methods: ${Array.isArray(kb.payment.methods) ? kb.payment.methods.join(', ') : 'major credit cards and PayPal'}. All transactions are processed securely.`;
                } else if (message.toLowerCase().includes('secure') || message.toLowerCase().includes('safe')) {
                    return `Payment security: ${kb.payment.security || 'We use industry-standard encryption and security measures'}. We use industry-standard encryption and never store your complete credit card information on our servers.`;
                } else if (message.toLowerCase().includes('issue') || message.toLowerCase().includes('problem') || message.toLowerCase().includes('fail')) {
                    return `For payment issues: ${kb.payment.issues || 'Please verify your payment information and try again'}. Common problems include incorrect billing information or temporary holds by your bank. You can contact us at ${kb.company?.contactEmail || 'our support email'} for immediate assistance.`;
                } else {
                    return `About our payment options: We accept ${Array.isArray(kb.payment.methods) ? kb.payment.methods.join(', ') : 'various payment methods'}. If you're having trouble with your payment, please ensure your billing information is correct or try an alternative payment method.`;
                }

            case 'orders':
                if (!kb.orders) {
                    return "I'm sorry, I don't have detailed order information available. Please contact our customer service for order inquiries.";
                }

                if (message.toLowerCase().includes('cancel')) {
                    return `Order cancellation: ${kb.orders.cancellation || 'Orders can be cancelled before shipping'}. Please note that once an order enters the fulfillment process, we cannot cancel it, but you can return the items when they arrive.`;
                } else if (message.toLowerCase().includes('track')) {
                    return `To track your order: ${kb.orders.tracking || 'You can track your order through your account dashboard'}. You can find the tracking information in your order confirmation email or by logging into your account and viewing your order details.`;
                } else if (message.toLowerCase().includes('modify') || message.toLowerCase().includes('change')) {
                    return `To modify your order: ${kb.orders.modification || 'Please contact customer service as soon as possible'}. Please note that changes may only be possible if your order hasn't entered the fulfillment process yet.`;
                } else {
                    return `More about orders: You can view your complete order history in your account. All orders are processed within 24 hours during business days. If you have specific questions about an order, please provide your order number for detailed assistance.`;
                }

            case 'products':
                // Handle case where kb.products might not exist or is incomplete
                if (!kb || !(kb as any).products) {
                    return `I apologize, but I don't have detailed product information available right now. Please check our product pages on the website for specifications and features, or contact our support team for specific product details.`;
                }

                if (message.toLowerCase().includes('warranty') || message.toLowerCase().includes('guarantee')) {
                    return `Product warranty information: ${(kb as any).products.warranty || 'Available on product pages'}. For specific product warranty details, please check the product description page or documentation that came with your item.`;
                } else if (message.toLowerCase().includes('custom') || message.toLowerCase().includes('personalize')) {
                    return `About product customization: ${(kb as any).products.customization || 'Available for select products'}. To discuss specific customization options, please contact our customer service team directly.`;
                } else if (message.toLowerCase().includes('difference') || message.toLowerCase().includes('compare')) {
                    return `For product comparisons: Each product page has detailed specifications. If you're trying to compare specific products, I recommend viewing them side by side on our website or asking about the particular models you're interested in.`;
                } else if (message.toLowerCase().includes('availability') || message.toLowerCase().includes('stock') || message.toLowerCase().includes('in stock')) {
                    return `Product availability: Our website displays real-time inventory status. If a product is marked "In Stock," it's available for immediate shipping. For out-of-stock items, you can sign up for restock notifications on the product page.`;
                } else {
                    return `More about our products: All our products undergo rigorous quality testing. If you have questions about a specific product, please provide the product name or ID for detailed information.`;
                }

            case 'account':
                if (message.toLowerCase().includes('create') || message.toLowerCase().includes('sign up')) {
                    return `To create an account: Click the "Sign Up" button in the top right corner of our website, fill in your details, and verify your email address. Creating an account gives you access to order tracking, saved addresses, wishlists, and faster checkout.`;
                } else if (message.toLowerCase().includes('password') || message.toLowerCase().includes('reset')) {
                    return `To reset your password: Click "Forgot Password" on the login screen, enter your email address, and follow the instructions sent to your email. For security reasons, password reset links expire after 24 hours.`;
                } else if (message.toLowerCase().includes('update') || message.toLowerCase().includes('change') || message.toLowerCase().includes('edit')) {
                    return `To update your account information: Log in to your account, go to Account Settings, and you can edit your personal information, addresses, and communication preferences there.`;
                } else if (message.toLowerCase().includes('delete') || message.toLowerCase().includes('remove')) {
                    return `To delete your account: Log in, go to Account Settings, scroll to the bottom and click "Delete Account." Please note this action is irreversible and will remove all your data from our system.`;
                } else {
                    return `More about your account: Your account dashboard gives you access to your order history, saved addresses, payment methods, and personal settings. If you're having trouble accessing specific account features, please let me know.`;
                }

            default:
                return `I notice you're asking a follow-up question. To help you better, could you please provide a bit more detail about what specifically you'd like to know?`;
        }
    } catch (error) {
        console.error("Error in getFollowUpResponse:", error);
        return "I'm having trouble processing your follow-up question. Could you please provide more details so I can help you better?";
    }
}