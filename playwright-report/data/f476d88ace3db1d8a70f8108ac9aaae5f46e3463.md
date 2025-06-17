# Test info

- Name: Support System E2E >> should view support ticket status (for logged-in users)
- Location: C:\Users\James\Desktop\uniqverse-v1\e2e\support-system.spec.ts:188:9

# Error details

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation to "/" until "load"
============================================================
    at C:\Users\James\Desktop\uniqverse-v1\e2e\support-system.spec.ts:194:20
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
   94 |                 const faqContent = page.locator('.faq-content, .accordion-content, details[open]');
   95 |                 if (await faqContent.isVisible()) {
   96 |                     await expect(faqContent).toBeVisible();
   97 |                 }
   98 |             }
   99 |         } else {
  100 |             // Try direct FAQ URL
  101 |             await page.goto('/faq');
  102 |             await page.waitForLoadState('networkidle');
  103 |
  104 |             const faqPage = page.locator('h1').filter({ hasText: /faq/i });
  105 |             if (await faqPage.isVisible()) {
  106 |                 await expect(faqPage).toBeVisible();
  107 |             }
  108 |         }
  109 |     });
  110 |
  111 |     test('should search FAQ items', async ({ page }) => {
  112 |         await page.goto('/support');
  113 |         await page.waitForLoadState('networkidle');
  114 |
  115 |         // Look for FAQ search
  116 |         const faqSearchInput = page.locator('input[type="search"], input[placeholder*="search"]').filter({ hasText: /faq|search/i });
  117 |
  118 |         if (await faqSearchInput.isVisible()) {
  119 |             await faqSearchInput.fill('shipping');
  120 |             await page.waitForTimeout(500);
  121 |
  122 |             // Check if FAQ items filter based on search
  123 |             const faqItems = page.locator('.faq-item, .accordion-item');
  124 |             if (await faqItems.count() > 0) {
  125 |                 // Check if visible items are related to shipping
  126 |                 const shippingFAQ = page.locator('.faq-item, .accordion-item').filter({ hasText: /shipping/i });
  127 |                 if (await shippingFAQ.isVisible()) {
  128 |                     await expect(shippingFAQ).toBeVisible();
  129 |                 }
  130 |             }
  131 |         }
  132 |     });
  133 |
  134 |     test('should create support ticket', async ({ page }) => {
  135 |         // Navigate to support or contact page
  136 |         await page.goto('/support');
  137 |         await page.waitForLoadState('networkidle');
  138 |
  139 |         // Look for ticket creation form or link
  140 |         const createTicketBtn = page.locator('button, a').filter({ hasText: /create.*ticket|submit.*ticket|contact.*us/i });
  141 |
  142 |         if (await createTicketBtn.isVisible()) {
  143 |             await createTicketBtn.click();
  144 |
  145 |             // Fill out ticket form
  146 |             const subjectInput = page.locator('input[name*="subject"], input[placeholder*="subject"]');
  147 |             if (await subjectInput.isVisible()) {
  148 |                 await subjectInput.fill('E2E Test Support Ticket');
  149 |             }
  150 |
  151 |             const messageTextarea = page.locator('textarea[name*="message"], textarea[placeholder*="message"]');
  152 |             if (await messageTextarea.isVisible()) {
  153 |                 await messageTextarea.fill('This is a test support ticket created by E2E tests.');
  154 |             }
  155 |
  156 |             const emailInput = page.locator('input[type="email"][name*="email"]');
  157 |             if (await emailInput.isVisible()) {
  158 |                 await emailInput.fill('test@example.com');
  159 |             }
  160 |
  161 |             const nameInput = page.locator('input[name*="name"], input[placeholder*="name"]');
  162 |             if (await nameInput.isVisible()) {
  163 |                 await nameInput.fill('Test User');
  164 |             }
  165 |
  166 |             // Select category if available
  167 |             const categorySelect = page.locator('select[name*="category"]');
  168 |             if (await categorySelect.isVisible()) {
  169 |                 await categorySelect.selectOption({ index: 1 });
  170 |             }
  171 |
  172 |             // Submit ticket
  173 |             const submitBtn = page.locator('button[type="submit"]').filter({ hasText: /submit|send|create/i });
  174 |             if (await submitBtn.isVisible()) {
  175 |                 await submitBtn.click();
  176 |
  177 |                 // Check for success message
  178 |                 const successMessage = page.locator('.alert, .toast').filter({ hasText: /success|submitted|created/i });
  179 |                 if (await successMessage.isVisible()) {
  180 |                     await expect(successMessage).toBeVisible();
  181 |                 }
  182 |             }
  183 |         } else {
  184 |             test.skip(true, 'No ticket creation form found');
  185 |         }
  186 |     });
  187 |
  188 |     test('should view support ticket status (for logged-in users)', async ({ page }) => {
  189 |         // Login first
  190 |         await page.goto('/auth/login');
  191 |         await page.fill('[name="email"]', 'test@example.com');
  192 |         await page.fill('[name="password"]', 'password123');
  193 |         await page.click('button[type="submit"]');
> 194 |         await page.waitForURL('/');
      |                    ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
  195 |
  196 |         // Navigate to support tickets
  197 |         await page.goto('/support/tickets');
  198 |         await page.waitForLoadState('networkidle');
  199 |
  200 |         // Check for tickets list or user dashboard
  201 |         const ticketsList = page.locator('.tickets-list, .support-tickets');
  202 |         const noTicketsMessage = page.locator('text=/no.*tickets|no.*support.*requests/i');
  203 |
  204 |         if (await ticketsList.isVisible()) {
  205 |             await expect(ticketsList).toBeVisible();
  206 |
  207 |             // Check individual ticket items
  208 |             const ticketItems = page.locator('.ticket-item, .support-ticket');
  209 |             if (await ticketItems.count() > 0) {
  210 |                 // Click on first ticket to view details
  211 |                 await ticketItems.first().click();
  212 |
  213 |                 // Check ticket details page
  214 |                 const ticketDetails = page.locator('.ticket-details, .ticket-content');
  215 |                 if (await ticketDetails.isVisible()) {
  216 |                     await expect(ticketDetails).toBeVisible();
  217 |                 }
  218 |             }
  219 |         } else if (await noTicketsMessage.isVisible()) {
  220 |             await expect(noTicketsMessage).toBeVisible();
  221 |         }
  222 |     });
  223 |
  224 |     test('should handle contact form submission', async ({ page }) => {
  225 |         // Navigate to contact page
  226 |         await page.goto('/contact');
  227 |         await page.waitForLoadState('networkidle');
  228 |
  229 |         // Check if contact form exists
  230 |         const contactForm = page.locator('form').filter({ hasText: /contact|message|inquiry/i });
  231 |
  232 |         if (await contactForm.isVisible()) {
  233 |             // Fill contact form
  234 |             const nameInput = page.locator('input[name*="name"]');
  235 |             if (await nameInput.isVisible()) {
  236 |                 await nameInput.fill('Test User');
  237 |             }
  238 |
  239 |             const emailInput = page.locator('input[type="email"]');
  240 |             if (await emailInput.isVisible()) {
  241 |                 await emailInput.fill('test@example.com');
  242 |             }
  243 |
  244 |             const subjectInput = page.locator('input[name*="subject"]');
  245 |             if (await subjectInput.isVisible()) {
  246 |                 await subjectInput.fill('E2E Test Contact');
  247 |             }
  248 |
  249 |             const messageTextarea = page.locator('textarea');
  250 |             if (await messageTextarea.isVisible()) {
  251 |                 await messageTextarea.fill('This is a test contact form submission from E2E tests.');
  252 |             }
  253 |
  254 |             // Submit form
  255 |             const submitBtn = page.locator('button[type="submit"]');
  256 |             await submitBtn.click();
  257 |
  258 |             // Check for confirmation
  259 |             const confirmationMessage = page.locator('.alert, .toast').filter({ hasText: /thank.*you|sent|submitted/i });
  260 |             if (await confirmationMessage.isVisible()) {
  261 |                 await expect(confirmationMessage).toBeVisible();
  262 |             }
  263 |         } else {
  264 |             test.skip(true, 'No contact form found');
  265 |         }
  266 |     });
  267 |
  268 |     test('should access help documentation', async ({ page }) => {
  269 |         // Navigate to help or docs page
  270 |         await page.goto('/help');
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
```