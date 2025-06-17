# Test info

- Name: Support System E2E >> should display support hours and contact information
- Location: C:\Users\James\Desktop\uniqverse-v1\e2e\support-system.spec.ts:347:9

# Error details

```
Error: locator.isVisible: Unsupported token "{" while parsing css selector "a[href^="tel:"], text=/+?d{1,3}[-.s]?(?d{3})?[-.s]?d{3}[-.s]?d{4}/". Did you mean to CSS.escape it?
Call log:
    - checking visibility of a[href^="tel:"], text=/+?d{1,3}[-.s]?(?d{3})?[-.s]?d{3}[-.s]?d{4}/

    at C:\Users\James\Desktop\uniqverse-v1\e2e\support-system.spec.ts:371:32
```

# Page snapshot

```yaml
- banner:
  - link "UniQVerse":
    - /url: /
  - navigation:
    - link "Home":
      - /url: /
    - link "Shop":
      - /url: /shop
    - button "Categories"
    - link "All Categories":
      - /url: /categories
    - link "Shop Featured":
      - /url: /shop/featured
    - link "New Arrivals":
      - /url: /shop/new
    - link "About":
      - /url: /about
    - link "Careers":
      - /url: /careers
    - link "Support":
      - /url: /support
    - link "Contact":
      - /url: /contact
  - button "Search"
  - text: Search /
  - button "Settings"
  - button "Open shopping cart"
  - link "Sign In":
    - /url: /auth/login
    - button "Sign In"
  - button "Open menu"
- main:
  - link "Uniqverse":
    - /url: /
  - heading "Welcome back" [level=2]
  - paragraph:
    - text: Don't have an account?
    - link "Create an account":
      - /url: /auth/register
  - text: Email address
  - textbox "Email address"
  - text: Password
  - textbox "Password"
  - checkbox "Remember me"
  - text: Remember me
  - link "Forgot your password?":
    - /url: /auth/forgot-password
  - button "Sign in"
  - text: Or continue with
  - button "Sign in with Google":
    - img
    - text: Sign in with Google
  - heading "Shop Unique, Live Unique" [level=2]
  - paragraph: Discover custom-designed products that reflect your unique personality.
- contentinfo:
  - paragraph: © 2025 UniQVerse. All rights reserved.
- region "Notifications alt+T"
```

# Test source

```ts
  271 |         await page.waitForLoadState('networkidle');
  272 |
  273 |         // Check for help content
  274 |         const helpContent = page.locator('h1').filter({ hasText: /help|documentation|guide/i });
  275 |
  276 |         if (await helpContent.isVisible()) {
  277 |             await expect(helpContent).toBeVisible();
  278 |
  279 |             // Check for help categories or topics
  280 |             const helpCategories = page.locator('.help-category, .docs-section, nav a');
  281 |             if (await helpCategories.count() > 0) {
  282 |                 // Click on first help category
  283 |                 await helpCategories.first().click();
  284 |                 await page.waitForLoadState('networkidle');
  285 |
  286 |                 // Verify content loads
  287 |                 const helpArticle = page.locator('.help-article, .docs-content, article');
  288 |                 if (await helpArticle.isVisible()) {
  289 |                     await expect(helpArticle).toBeVisible();
  290 |                 }
  291 |             }
  292 |         } else {
  293 |             // Try docs URL
  294 |             await page.goto('/docs');
  295 |             await page.waitForLoadState('networkidle');
  296 |
  297 |             const docsPage = page.locator('h1').filter({ hasText: /docs|documentation/i });
  298 |             if (await docsPage.isVisible()) {
  299 |                 await expect(docsPage).toBeVisible();
  300 |             }
  301 |         }
  302 |     });
  303 |
  304 |     test('should handle live chat escalation', async ({ page }) => {
  305 |         // Access chatbot first
  306 |         const chatbotWidget = page.locator('.chatbot-widget, .chat-widget, button').filter({ hasText: /chat|help|support/i });
  307 |
  308 |         if (await chatbotWidget.isVisible()) {
  309 |             await chatbotWidget.click();
  310 |             await page.waitForSelector('.chat-interface, .chatbot-container', { timeout: 5000 });
  311 |
  312 |             // Look for live chat or human agent option
  313 |             const liveChatBtn = page.locator('button').filter({ hasText: /live.*chat|human.*agent|speak.*human/i });
  314 |
  315 |             if (await liveChatBtn.isVisible()) {
  316 |                 await liveChatBtn.click();
  317 |
  318 |                 // Check for live chat interface or form
  319 |                 const liveChatInterface = page.locator('.live-chat, .agent-chat');
  320 |                 const liveChatForm = page.locator('form').filter({ hasText: /live.*chat|agent/i });
  321 |
  322 |                 if (await liveChatInterface.isVisible()) {
  323 |                     await expect(liveChatInterface).toBeVisible();
  324 |                 } else if (await liveChatForm.isVisible()) {
  325 |                     // Fill form to request live chat
  326 |                     const emailInput = page.locator('input[type="email"]');
  327 |                     if (await emailInput.isVisible()) {
  328 |                         await emailInput.fill('test@example.com');
  329 |                     }
  330 |
  331 |                     const messageInput = page.locator('textarea, input[type="text"]');
  332 |                     if (await messageInput.isVisible()) {
  333 |                         await messageInput.fill('I need to speak with a human agent');
  334 |                     }
  335 |
  336 |                     const submitBtn = page.locator('button[type="submit"]');
  337 |                     if (await submitBtn.isVisible()) {
  338 |                         await submitBtn.click();
  339 |                     }
  340 |                 }
  341 |             }
  342 |         } else {
  343 |             test.skip(true, 'No chatbot widget found for escalation test');
  344 |         }
  345 |     });
  346 |
  347 |     test('should display support hours and contact information', async ({ page }) => {
  348 |         await page.goto('/support');
  349 |         await page.waitForLoadState('networkidle');
  350 |
  351 |         // Check for support hours
  352 |         const supportHours = page.locator('text=/hours|monday|9.*am|support.*time/i');
  353 |         if (await supportHours.isVisible()) {
  354 |             await expect(supportHours).toBeVisible();
  355 |         }
  356 |
  357 |         // Check for contact information
  358 |         const contactInfo = page.locator('text=/phone|email|address/i');
  359 |         if (await contactInfo.count() > 0) {
  360 |             await expect(contactInfo.first()).toBeVisible();
  361 |         }
  362 |
  363 |         // Check for support email
  364 |         const supportEmail = page.locator('a[href^="mailto:"]');
  365 |         if (await supportEmail.isVisible()) {
  366 |             await expect(supportEmail).toBeVisible();
  367 |         }
  368 |
  369 |         // Check for support phone
  370 |         const supportPhone = page.locator('a[href^="tel:"], text=/\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/');
> 371 |         if (await supportPhone.isVisible()) {
      |                                ^ Error: locator.isVisible: Unsupported token "{" while parsing css selector "a[href^="tel:"], text=/+?d{1,3}[-.s]?(?d{3})?[-.s]?d{3}[-.s]?d{4}/". Did you mean to CSS.escape it?
  372 |             await expect(supportPhone).toBeVisible();
  373 |         }
  374 |     });
  375 | });
  376 |
```