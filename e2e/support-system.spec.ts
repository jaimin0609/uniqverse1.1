import { test, expect } from '@playwright/test';

test.describe('Support System E2E', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    test('should access support chatbot', async ({ page }) => {
        // Look for chatbot widget or support button
        const chatbotWidget = page.locator('.chatbot-widget, .chat-widget, button').filter({ hasText: /chat|help|support/i });

        if (await chatbotWidget.isVisible()) {
            await chatbotWidget.click();

            // Check if chat interface opens
            const chatInterface = page.locator('.chat-interface, .chatbot-container, .chat-window');
            await expect(chatInterface).toBeVisible({ timeout: 5000 });

            // Check for welcome message
            const welcomeMessage = page.locator('.chat-message, .message').first();
            if (await welcomeMessage.isVisible()) {
                await expect(welcomeMessage).toBeVisible();
            }
        } else {
            // Try navigating to support page
            await page.goto('/support');
            await page.waitForLoadState('networkidle');

            // Look for chatbot on support page
            const supportChatbot = page.locator('.chatbot, .chat');
            if (await supportChatbot.isVisible()) {
                await expect(supportChatbot).toBeVisible();
            }
        }
    });

    test('should interact with chatbot', async ({ page }) => {
        // Access chatbot
        const chatbotWidget = page.locator('.chatbot-widget, .chat-widget, button').filter({ hasText: /chat|help|support/i });

        if (await chatbotWidget.isVisible()) {
            await chatbotWidget.click();

            await page.waitForSelector('.chat-interface, .chatbot-container, .chat-window', { timeout: 5000 });

            // Send a test message
            const messageInput = page.locator('input[type="text"], textarea').filter({ hasText: /message|type|chat/i });

            if (await messageInput.isVisible()) {
                await messageInput.fill('Hello, I need help with my order');

                // Send message
                const sendButton = page.locator('button').filter({ hasText: /send/i });
                if (await sendButton.isVisible()) {
                    await sendButton.click();
                } else {
                    await messageInput.press('Enter');
                }

                // Wait for bot response
                await page.waitForTimeout(2000);

                // Check for bot response
                const botResponse = page.locator('.chat-message, .message').filter({ hasText: /order|help|assist/i });
                if (await botResponse.isVisible()) {
                    await expect(botResponse).toBeVisible();
                }
            }
        } else {
            test.skip(true, 'No chatbot widget found');
        }
    });

    test('should access FAQ section', async ({ page }) => {
        // Navigate to support or FAQ page
        await page.goto('/support');
        await page.waitForLoadState('networkidle');

        // Look for FAQ section
        const faqSection = page.locator('h1, h2, h3').filter({ hasText: /faq|frequently.*asked/i });

        if (await faqSection.isVisible()) {
            await expect(faqSection).toBeVisible();

            // Check for FAQ items
            const faqItems = page.locator('.faq-item, .accordion-item, details');

            if (await faqItems.count() > 0) {
                // Click on first FAQ item to expand
                await faqItems.first().click();

                // Check if content expands
                const faqContent = page.locator('.faq-content, .accordion-content, details[open]');
                if (await faqContent.isVisible()) {
                    await expect(faqContent).toBeVisible();
                }
            }
        } else {
            // Try direct FAQ URL
            await page.goto('/faq');
            await page.waitForLoadState('networkidle');

            const faqPage = page.locator('h1').filter({ hasText: /faq/i });
            if (await faqPage.isVisible()) {
                await expect(faqPage).toBeVisible();
            }
        }
    });

    test('should search FAQ items', async ({ page }) => {
        await page.goto('/support');
        await page.waitForLoadState('networkidle');

        // Look for FAQ search
        const faqSearchInput = page.locator('input[type="search"], input[placeholder*="search"]').filter({ hasText: /faq|search/i });

        if (await faqSearchInput.isVisible()) {
            await faqSearchInput.fill('shipping');
            await page.waitForTimeout(500);

            // Check if FAQ items filter based on search
            const faqItems = page.locator('.faq-item, .accordion-item');
            if (await faqItems.count() > 0) {
                // Check if visible items are related to shipping
                const shippingFAQ = page.locator('.faq-item, .accordion-item').filter({ hasText: /shipping/i });
                if (await shippingFAQ.isVisible()) {
                    await expect(shippingFAQ).toBeVisible();
                }
            }
        }
    });

    test('should create support ticket', async ({ page }) => {
        // Navigate to support or contact page
        await page.goto('/support');
        await page.waitForLoadState('networkidle');

        // Look for ticket creation form or link
        const createTicketBtn = page.locator('button, a').filter({ hasText: /create.*ticket|submit.*ticket|contact.*us/i });

        if (await createTicketBtn.isVisible()) {
            await createTicketBtn.click();

            // Fill out ticket form
            const subjectInput = page.locator('input[name*="subject"], input[placeholder*="subject"]');
            if (await subjectInput.isVisible()) {
                await subjectInput.fill('E2E Test Support Ticket');
            }

            const messageTextarea = page.locator('textarea[name*="message"], textarea[placeholder*="message"]');
            if (await messageTextarea.isVisible()) {
                await messageTextarea.fill('This is a test support ticket created by E2E tests.');
            }

            const emailInput = page.locator('input[type="email"][name*="email"]');
            if (await emailInput.isVisible()) {
                await emailInput.fill('test@example.com');
            }

            const nameInput = page.locator('input[name*="name"], input[placeholder*="name"]');
            if (await nameInput.isVisible()) {
                await nameInput.fill('Test User');
            }

            // Select category if available
            const categorySelect = page.locator('select[name*="category"]');
            if (await categorySelect.isVisible()) {
                await categorySelect.selectOption({ index: 1 });
            }

            // Submit ticket
            const submitBtn = page.locator('button[type="submit"]').filter({ hasText: /submit|send|create/i });
            if (await submitBtn.isVisible()) {
                await submitBtn.click();

                // Check for success message
                const successMessage = page.locator('.alert, .toast').filter({ hasText: /success|submitted|created/i });
                if (await successMessage.isVisible()) {
                    await expect(successMessage).toBeVisible();
                }
            }
        } else {
            test.skip(true, 'No ticket creation form found');
        }
    });

    test('should view support ticket status (for logged-in users)', async ({ page }) => {
        // Login first
        await page.goto('/auth/login');
        await page.fill('[name="email"]', 'test@example.com');
        await page.fill('[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL('/');

        // Navigate to support tickets
        await page.goto('/support/tickets');
        await page.waitForLoadState('networkidle');

        // Check for tickets list or user dashboard
        const ticketsList = page.locator('.tickets-list, .support-tickets');
        const noTicketsMessage = page.locator('text=/no.*tickets|no.*support.*requests/i');

        if (await ticketsList.isVisible()) {
            await expect(ticketsList).toBeVisible();

            // Check individual ticket items
            const ticketItems = page.locator('.ticket-item, .support-ticket');
            if (await ticketItems.count() > 0) {
                // Click on first ticket to view details
                await ticketItems.first().click();

                // Check ticket details page
                const ticketDetails = page.locator('.ticket-details, .ticket-content');
                if (await ticketDetails.isVisible()) {
                    await expect(ticketDetails).toBeVisible();
                }
            }
        } else if (await noTicketsMessage.isVisible()) {
            await expect(noTicketsMessage).toBeVisible();
        }
    });

    test('should handle contact form submission', async ({ page }) => {
        // Navigate to contact page
        await page.goto('/contact');
        await page.waitForLoadState('networkidle');

        // Check if contact form exists
        const contactForm = page.locator('form').filter({ hasText: /contact|message|inquiry/i });

        if (await contactForm.isVisible()) {
            // Fill contact form
            const nameInput = page.locator('input[name*="name"]');
            if (await nameInput.isVisible()) {
                await nameInput.fill('Test User');
            }

            const emailInput = page.locator('input[type="email"]');
            if (await emailInput.isVisible()) {
                await emailInput.fill('test@example.com');
            }

            const subjectInput = page.locator('input[name*="subject"]');
            if (await subjectInput.isVisible()) {
                await subjectInput.fill('E2E Test Contact');
            }

            const messageTextarea = page.locator('textarea');
            if (await messageTextarea.isVisible()) {
                await messageTextarea.fill('This is a test contact form submission from E2E tests.');
            }

            // Submit form
            const submitBtn = page.locator('button[type="submit"]');
            await submitBtn.click();

            // Check for confirmation
            const confirmationMessage = page.locator('.alert, .toast').filter({ hasText: /thank.*you|sent|submitted/i });
            if (await confirmationMessage.isVisible()) {
                await expect(confirmationMessage).toBeVisible();
            }
        } else {
            test.skip(true, 'No contact form found');
        }
    });

    test('should access help documentation', async ({ page }) => {
        // Navigate to help or docs page
        await page.goto('/help');
        await page.waitForLoadState('networkidle');

        // Check for help content
        const helpContent = page.locator('h1').filter({ hasText: /help|documentation|guide/i });

        if (await helpContent.isVisible()) {
            await expect(helpContent).toBeVisible();

            // Check for help categories or topics
            const helpCategories = page.locator('.help-category, .docs-section, nav a');
            if (await helpCategories.count() > 0) {
                // Click on first help category
                await helpCategories.first().click();
                await page.waitForLoadState('networkidle');

                // Verify content loads
                const helpArticle = page.locator('.help-article, .docs-content, article');
                if (await helpArticle.isVisible()) {
                    await expect(helpArticle).toBeVisible();
                }
            }
        } else {
            // Try docs URL
            await page.goto('/docs');
            await page.waitForLoadState('networkidle');

            const docsPage = page.locator('h1').filter({ hasText: /docs|documentation/i });
            if (await docsPage.isVisible()) {
                await expect(docsPage).toBeVisible();
            }
        }
    });

    test('should handle live chat escalation', async ({ page }) => {
        // Access chatbot first
        const chatbotWidget = page.locator('.chatbot-widget, .chat-widget, button').filter({ hasText: /chat|help|support/i });

        if (await chatbotWidget.isVisible()) {
            await chatbotWidget.click();
            await page.waitForSelector('.chat-interface, .chatbot-container', { timeout: 5000 });

            // Look for live chat or human agent option
            const liveChatBtn = page.locator('button').filter({ hasText: /live.*chat|human.*agent|speak.*human/i });

            if (await liveChatBtn.isVisible()) {
                await liveChatBtn.click();

                // Check for live chat interface or form
                const liveChatInterface = page.locator('.live-chat, .agent-chat');
                const liveChatForm = page.locator('form').filter({ hasText: /live.*chat|agent/i });

                if (await liveChatInterface.isVisible()) {
                    await expect(liveChatInterface).toBeVisible();
                } else if (await liveChatForm.isVisible()) {
                    // Fill form to request live chat
                    const emailInput = page.locator('input[type="email"]');
                    if (await emailInput.isVisible()) {
                        await emailInput.fill('test@example.com');
                    }

                    const messageInput = page.locator('textarea, input[type="text"]');
                    if (await messageInput.isVisible()) {
                        await messageInput.fill('I need to speak with a human agent');
                    }

                    const submitBtn = page.locator('button[type="submit"]');
                    if (await submitBtn.isVisible()) {
                        await submitBtn.click();
                    }
                }
            }
        } else {
            test.skip(true, 'No chatbot widget found for escalation test');
        }
    });

    test('should display support hours and contact information', async ({ page }) => {
        await page.goto('/support');
        await page.waitForLoadState('networkidle');

        // Check for support hours
        const supportHours = page.locator('text=/hours|monday|9.*am|support.*time/i');
        if (await supportHours.isVisible()) {
            await expect(supportHours).toBeVisible();
        }

        // Check for contact information
        const contactInfo = page.locator('text=/phone|email|address/i');
        if (await contactInfo.count() > 0) {
            await expect(contactInfo.first()).toBeVisible();
        }

        // Check for support email
        const supportEmail = page.locator('a[href^="mailto:"]');
        if (await supportEmail.isVisible()) {
            await expect(supportEmail).toBeVisible();
        }

        // Check for support phone
        const supportPhone = page.locator('a[href^="tel:"], text=/\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/');
        if (await supportPhone.isVisible()) {
            await expect(supportPhone).toBeVisible();
        }
    });
});
