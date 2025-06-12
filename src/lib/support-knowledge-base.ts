// Knowledge base for the rule-based chatbot
// This file contains information about products, policies, and common customer questions

export const knowledgeBase = {
    // Company information
    company: {
        name: "Uniqverse",
        description: "An e-commerce platform specializing in unique and high-quality products.",
        contactEmail: "support@uniqverse.com",
        contactPhone: "1-800-555-1234",
        businessHours: "Monday - Friday: 9:00 AM - 6:00 PM EST, Saturday: 10:00 AM - 4:00 PM EST",
        address: "123 Commerce Street, Suite 500, New York, NY 10001"
    },

    // Shipping information
    shipping: {
        methods: [
            {
                name: "Standard Shipping",
                description: "3-5 business days",
                cost: "Free for orders over $50, $4.99 for orders under $50",
            },
            {
                name: "Express Shipping",
                description: "2-3 business days",
                cost: "$9.99",
            },
            {
                name: "Next Day Delivery",
                description: "Next business day (order by 12 PM EST)",
                cost: "$19.99",
            }
        ],
        international: "Yes, 7-14 business days depending on location, costs vary",
        restrictions: "Some oversized items may only be eligible for Standard Shipping"
    },

    // Returns information
    returns: {
        policy: "30-day return policy for unused items in original packaging",
        process: "Initiate through your account or contact support",
        refunds: "Processed within 5-7 business days after receiving the returned item",
        exceptions: "Personalized or custom items cannot be returned unless defective"
    },

    // Payment information
    payment: {
        methods: ["Credit/Debit Cards", "PayPal", "Apple Pay", "Google Pay"],
        security: "All transactions are secured with industry-standard encryption",
        issues: "For payment issues, please contact our support team"
    },

    // Order information
    orders: {
        tracking: "Available through your account or via the link in your shipping confirmation email",
        cancellation: "Orders can be cancelled within 1 hour of placing if not yet processed",
        modification: "Cannot modify after placing, but you can cancel (if eligible) and reorder"
    },    // Products information
    products: {
        warranty: "Most products come with a standard 1-year manufacturer warranty",
        availability: "Product inventory is updated in real-time on our website"
    },

    // Account information
    account: {
        creation: "Click on 'Account' in the top navigation and select 'Register'",
        password: "Can be reset through the login page by clicking 'Forgot Password'",
        deletion: "Contact support to request account deletion"
    },    // Chat patterns and responses for the custom chatbot
    chatPatterns: [
        {
            patterns: ["hello", "hi", "hey", "greetings"],
            response: "Hello! Welcome to Uniqverse support. How can I help you today?"
        },
        {
            patterns: ["bye", "goodbye", "see you", "talk later"],
            response: "Thank you for chatting with us! Feel free to come back if you have more questions."
        },
        {
            patterns: ["thanks", "thank you", "thx"],
            response: "You're welcome! Is there anything else I can help you with?"
        },        // Product Search Patterns
        {
            patterns: ["gift", "gifts", "present", "gift for", "gift ideas"],
            response: "I'd love to help you find the perfect gift! What kind of gift are you looking for and who is it for? For example, you could say 'I want to find a gift for my wife' or 'I need a birthday present for my friend'."
        },
        {
            patterns: ["shopping", "buy", "purchase", "find products", "looking for", "product", "products", "best product", "best products"],
            response: "I can help you find products in our store! Tell me what you're looking for - you can mention the type of item, who it's for, or the occasion. You can also [browse our shop](/shop) to see all available products."
        },
        {
            patterns: ["men", "male", "him", "man", "boy", "boys", "for men", "men's"],
            response: "I can help you find great products for men! Are you looking for clothing, accessories, or something specific? Let me know what type of item you're interested in and I'll suggest some perfect options."
        },
        {
            patterns: ["women", "female", "her", "woman", "girl", "girls", "for women", "women's"],
            response: "I can help you find wonderful products for women! Are you looking for clothing, jewelry, accessories, or something else? Tell me more about what you have in mind!"
        },
        {
            patterns: ["recommend", "recommendation", "suggest", "what should I buy", "best", "top", "popular"],
            response: "I'd be happy to recommend products for you! Please tell me more about what you're looking for - for example, the type of item, your budget, or who it's for, and I'll find some great options."
        },
        {
            patterns: ["wife", "girlfriend", "mother", "mom", "her", "woman", "female"],
            response: "I can help you find something special for her! Are you looking for clothing, jewelry, accessories, or something else? Let me know the occasion or her interests, and I'll suggest some perfect options."
        },
        {
            patterns: ["husband", "boyfriend", "father", "dad", "him", "man", "male"],
            response: "Great! I can help you find something perfect for him. What type of item are you considering - clothing, accessories, or something else? Tell me about the occasion or his interests!"
        },
        {
            patterns: ["birthday", "anniversary", "christmas", "valentine", "holiday"],
            response: "Special occasions deserve special gifts! Tell me who you're shopping for and what type of gift you have in mind, and I'll help you find something perfect for the occasion."
        },
        // Regular Support Patterns
        {
            patterns: ["shipping", "deliver", "ship", "shipping time", "delivery time"],
            response: "We offer Standard Shipping (3-5 business days), Express Shipping (2-3 business days), and Next Day Delivery (next business day). Standard Shipping is free for orders over $50, otherwise $4.99. Express Shipping is $9.99 and Next Day Delivery is $19.99. We do ship internationally, which takes 7-14 business days depending on the location."
        },
        {
            patterns: ["return", "returns policy", "refund", "exchange"],
            response: "Our return policy allows you to return items within 30 days of delivery. Items must be unused, in their original packaging, and in the same condition you received them. Refunds are typically processed within 5-7 business days after we receive and inspect the returned item."
        },
        {
            patterns: ["payment", "pay", "payment method", "credit card"],
            response: "We accept major credit cards (Visa, MasterCard, American Express, Discover), PayPal, Apple Pay, and Google Pay. All transactions are secured with industry-standard encryption."
        },
        {
            patterns: ["track", "order status", "where is my order", "tracking"],
            response: "You can track your order by logging into your account and visiting the 'Orders' section. Alternatively, you can use the tracking number provided in your shipping confirmation email."
        },
        {
            patterns: ["cancel", "cancel order", "cancellation"],
            response: "Orders can be cancelled within 1 hour of placing if they haven't been processed yet. Please log into your account, go to your orders, and select the cancel option if it's available."
        },
        {
            patterns: ["account", "create account", "sign up", "register"],
            response: "To create an account, click on the 'Account' icon in the top navigation bar and select 'Register'. Follow the prompts to provide your email, create a password, and complete your profile information."
        },
        {
            patterns: ["password", "forgot password", "reset password"],
            response: "You can reset your password through the login page by clicking the 'Forgot Password' link. You'll receive an email with instructions to create a new password."
        },
        {
            patterns: ["contact", "email", "phone", "support"],
            response: "You can contact our support team via email at support@uniqverse.com or by phone at 1-800-555-1234. Our business hours are Monday - Friday: 9:00 AM - 6:00 PM EST, Saturday: 10:00 AM - 4:00 PM EST."
        },
        {
            patterns: ["international", "worldwide", "ship abroad", "global shipping"],
            response: "Yes, we ship to most countries worldwide. International shipping typically takes 7-14 business days depending on the destination. Shipping costs and delivery times vary by location."
        },
        {
            patterns: ["business hours", "hours", "when are you open", "operating hours"],
            response: "Our customer support team is available Monday - Friday: 9:00 AM - 6:00 PM EST, Saturday: 10:00 AM - 4:00 PM EST. We are closed on Sundays and major holidays."
        },
        {
            patterns: ["damaged", "broken", "defective", "wrong item", "wrong product"],
            response: "We're sorry to hear that. Please contact our support team at support@uniqverse.com within 48 hours of receiving your order. Include your order number and photos of the damaged/incorrect item, and we'll help resolve the issue promptly."
        }
    ],
    // Fallback response when no pattern matches
    fallbackResponses: [
        "I'm not sure I understand. Could you rephrase your question?",
        "I don't have information on that specific topic. Would you like to contact our support team?",
        "I'm still learning and don't have an answer for that question. For detailed assistance, please email support@uniqverse.com or call 1-800-555-1234.",
        "I don't have enough information about that. Can you provide more details or ask a different question?",
        "That's a bit outside my knowledge area. You might find the answer in our Help Center or by contacting our support team."
    ]
};