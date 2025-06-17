# Test info

- Name: Authentication Flow >> should logout successfully
- Location: C:\Users\James\Desktop\uniqverse-v1\e2e\auth.spec.ts:291:13

# Error details

```
Error: locator.hover: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('button:has(svg.lucide-user), .group:has(svg.lucide-user)').first()
    - locator resolved to <button class="justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 rounded-md px-3 text-xs flex items-center">…</button>
  - attempting hover action
    2 × waiting for element to be visible and stable
      - element is visible and stable
      - scrolling into view if needed
      - done scrolling
      - <img loading="lazy" decoding="async" data-nimg="fill" alt="Green Sequined Sexy High Waist Fishtail Long Evening Dress" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw" class="object-cover group-hover:scale-105 transition-transform duration-300" src="/_next/image?url=https%3A%2F%2Fcf.cjdropshipping.com%2Fquick%2Fproduct%2Fb3a67d24-cb34-46e7-8799-f91109e4ce06.jpg&w=3840&q=75" srcset="/_next/image?url=https%3A%2F%2Fcf.cjdropshipping.com%2Fquick%2Fproduct%2Fb3a67d24-cb34-46e7-8799-f9110…/> from <main class="flex-grow">…</main> subtree intercepts pointer events
    - retrying hover action
    - waiting 20ms
    2 × waiting for element to be visible and stable
      - element is visible and stable
      - scrolling into view if needed
      - done scrolling
      - <img loading="lazy" decoding="async" data-nimg="fill" alt="Green Sequined Sexy High Waist Fishtail Long Evening Dress" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw" class="object-cover group-hover:scale-105 transition-transform duration-300" src="/_next/image?url=https%3A%2F%2Fcf.cjdropshipping.com%2Fquick%2Fproduct%2Fb3a67d24-cb34-46e7-8799-f91109e4ce06.jpg&w=3840&q=75" srcset="/_next/image?url=https%3A%2F%2Fcf.cjdropshipping.com%2Fquick%2Fproduct%2Fb3a67d24-cb34-46e7-8799-f9110…/> from <main class="flex-grow">…</main> subtree intercepts pointer events
    - retrying hover action
      - waiting 100ms
    42 × waiting for element to be visible and stable
       - element is visible and stable
       - scrolling into view if needed
       - done scrolling
       - <img loading="lazy" decoding="async" data-nimg="fill" alt="Green Sequined Sexy High Waist Fishtail Long Evening Dress" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw" class="object-cover group-hover:scale-105 transition-transform duration-300" src="/_next/image?url=https%3A%2F%2Fcf.cjdropshipping.com%2Fquick%2Fproduct%2Fb3a67d24-cb34-46e7-8799-f91109e4ce06.jpg&w=3840&q=75" srcset="/_next/image?url=https%3A%2F%2Fcf.cjdropshipping.com%2Fquick%2Fproduct%2Fb3a67d24-cb34-46e7-8799-f9110…/> from <main class="flex-grow">…</main> subtree intercepts pointer events
     - retrying hover action
       - waiting 500ms

    at C:\Users\James\Desktop\uniqverse-v1\e2e\auth.spec.ts:369:28
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
  - main:
    - heading "Discover Unique Products for Your Lifestyle" [level=1]
    - paragraph: Custom-designed products that reflect your personality, delivered right to your door.
    - link "Start Shopping":
      - /url: /shop
    - link "Browse Categories":
      - /url: /categories
    - img "Featured products collection"
    - text: Loading events...
    - heading "Why Choose UniQVerse?" [level=2]
    - heading "Quality Products" [level=3]
    - paragraph: We partner with the best suppliers to ensure premium quality for all our products.
    - heading "Fast Delivery" [level=3]
    - paragraph: Most orders ship within 24 hours and arrive at your doorstep in 3-5 business days.
    - heading "Secure Shopping" [level=3]
    - paragraph: Your payments and personal information are always protected with our secure checkout.
    - heading "Featured Products" [level=2]
    - link "Retro Creative Snake Chain Anklet Four-piece Set Add to wishlist Add to cart":
      - /url: /products/retro-creative-snake-chain-anklet-four-piece-set
      - img "Retro Creative Snake Chain Anklet Four-piece Set"
      - button "Add to wishlist"
      - button "Add to cart"
    - link "Retro Creative Snake Chain Anklet Four-piece Set":
      - /url: /products/retro-creative-snake-chain-anklet-four-piece-set
      - heading "Retro Creative Snake Chain Anklet Four-piece Set" [level=3]
    - paragraph: Body Jewelry
    - paragraph: ...
    - link "Bow Love Five Break Flower Pearl Resin Drill Nail Accessories Add to wishlist Add to cart":
      - /url: /products/bow-love-five-break-flower-pearl-resin-drill-nail-accessories
      - img "Bow Love Five Break Flower Pearl Resin Drill Nail Accessories"
      - button "Add to wishlist"
      - button "Add to cart"
    - link "Bow Love Five Break Flower Pearl Resin Drill Nail Accessories":
      - /url: /products/bow-love-five-break-flower-pearl-resin-drill-nail-accessories
      - heading "Bow Love Five Break Flower Pearl Resin Drill Nail Accessories" [level=3]
    - paragraph: Body Jewelry
    - paragraph: ...
    - link "Printed Double-layer Composite Blanket Household Add to wishlist Add to cart":
      - /url: /products/printed-double-layer-composite-blanket-household
      - img "Printed Double-layer Composite Blanket Household"
      - button "Add to wishlist"
      - button "Add to cart"
    - link "Printed Double-layer Composite Blanket Household":
      - /url: /products/printed-double-layer-composite-blanket-household
      - heading "Printed Double-layer Composite Blanket Household" [level=3]
    - paragraph: Bedding Sets
    - paragraph: ...
    - link "High-end Entry Lux Mink Fur Blanket Double-sided Add to wishlist Add to cart":
      - /url: /products/high-end-entry-lux-mink-fur-blanket-double-sided
      - img "High-end Entry Lux Mink Fur Blanket Double-sided"
      - button "Add to wishlist"
      - button "Add to cart"
    - link "High-end Entry Lux Mink Fur Blanket Double-sided":
      - /url: /products/high-end-entry-lux-mink-fur-blanket-double-sided
      - heading "High-end Entry Lux Mink Fur Blanket Double-sided" [level=3]
    - paragraph: Bedding Sets
    - paragraph: ...
    - link "High-end Solid Color Bed Sheet Bamboo Fiber Summer Mat Add to wishlist Add to cart":
      - /url: /products/high-end-solid-color-bed-sheet-bamboo-fiber-summer-mat
      - img "High-end Solid Color Bed Sheet Bamboo Fiber Summer Mat"
      - button "Add to wishlist"
      - button "Add to cart"
    - link "High-end Solid Color Bed Sheet Bamboo Fiber Summer Mat":
      - /url: /products/high-end-solid-color-bed-sheet-bamboo-fiber-summer-mat
      - heading "High-end Solid Color Bed Sheet Bamboo Fiber Summer Mat" [level=3]
    - paragraph: Bedding Sets
    - paragraph: ...
    - link "Ladies Style White Dress Satin Surface Was Thin And High French Temperament Dress Long Skirt Add to wishlist Add to cart":
      - /url: /products/ladies-style-white-dress-satin-surface-was-thin-and-high-french-temperament-dress-long-skirt
      - img "Ladies Style White Dress Satin Surface Was Thin And High French Temperament Dress Long Skirt"
      - button "Add to wishlist"
      - button "Add to cart"
    - link "Ladies Style White Dress Satin Surface Was Thin And High French Temperament Dress Long Skirt":
      - /url: /products/ladies-style-white-dress-satin-surface-was-thin-and-high-french-temperament-dress-long-skirt
      - heading "Ladies Style White Dress Satin Surface Was Thin And High French Temperament Dress Long Skirt" [level=3]
    - paragraph: Wedding & Events
    - paragraph: ...
    - link "Top Short Skirt Three-dimensional Flower Pettiskirt French Cross-border Dress Add to wishlist Add to cart":
      - /url: /products/top-short-skirt-three-dimensional-flower-pettiskirt-french-cross-border-dress
      - img "Top Short Skirt Three-dimensional Flower Pettiskirt French Cross-border Dress"
      - button "Add to wishlist"
      - button "Add to cart"
    - link "Top Short Skirt Three-dimensional Flower Pettiskirt French Cross-border Dress":
      - /url: /products/top-short-skirt-three-dimensional-flower-pettiskirt-french-cross-border-dress
      - heading "Top Short Skirt Three-dimensional Flower Pettiskirt French Cross-border Dress" [level=3]
    - paragraph: For Her
    - paragraph: ...
    - link "Green Sequined Sexy High Waist Fishtail Long Evening Dress Add to wishlist Add to cart":
      - /url: /products/green-sequined-sexy-high-waist-fishtail-long-evening-dress
      - img "Green Sequined Sexy High Waist Fishtail Long Evening Dress"
      - button "Add to wishlist"
      - button "Add to cart"
    - link "Green Sequined Sexy High Waist Fishtail Long Evening Dress":
      - /url: /products/green-sequined-sexy-high-waist-fishtail-long-evening-dress
      - heading "Green Sequined Sexy High Waist Fishtail Long Evening Dress" [level=3]
    - paragraph: Wedding & Events
    - paragraph: ...
    - heading "Stay Updated" [level=2]
    - paragraph: Subscribe to our newsletter for exclusive deals, new product announcements, and more.
    - textbox "Enter your email"
    - button "Subscribe" [disabled]
  - heading "UniQVerse" [level=3]
  - paragraph: Custom-designed products that reflect your unique personality.
  - heading "Shop" [level=3]
  - list:
    - listitem:
      - link "All Products":
        - /url: /shop
    - listitem:
      - link "Featured":
        - /url: /shop/featured
    - listitem:
      - link "New Arrivals":
        - /url: /shop/new
    - listitem:
      - link "Sale":
        - /url: /shop/sale
  - heading "Support" [level=3]
  - list:
    - listitem:
      - link "Help Center":
        - /url: /help
    - listitem:
      - link "Shipping Info":
        - /url: /shipping
    - listitem:
      - link "Returns & Exchanges":
        - /url: /returns
    - listitem:
      - link "Contact Us":
        - /url: /contact
  - heading "Stay Connected" [level=3]
  - paragraph: Subscribe to get special offers, free giveaways, and exclusive deals.
  - textbox "Enter your email"
  - button "Subscribe" [disabled]
  - heading "Company" [level=4]
  - list:
    - listitem:
      - link "About Us":
        - /url: /about
    - listitem:
      - link "Careers":
        - /url: /careers
    - listitem:
      - link "Blog":
        - /url: /blog
    - listitem:
      - link "Affiliate Program":
        - /url: /affiliates
  - heading "Legal" [level=4]
  - list:
    - listitem:
      - link "Privacy Policy":
        - /url: /privacy
    - listitem:
      - link "Terms of Service":
        - /url: /terms
    - listitem:
      - link "Return Policy":
        - /url: /returns
    - listitem:
      - link "Shipping Policy":
        - /url: /shipping
  - paragraph: © 2025 UniQVerse. All rights reserved.
  - text: Made with ❤️ for unique individuals
- contentinfo:
  - paragraph: © 2025 UniQVerse. All rights reserved.
- region "Notifications alt+T"
```

# Test source

```ts
  269 |         await page.click('[data-testid="login-submit-button"]');
  270 |
  271 |         // Wait for error state
  272 |         await page.waitForTimeout(3000);
  273 |
  274 |         // Should stay on login page
  275 |         await expect(page).toHaveURL(/\/auth\/login/);
  276 |
  277 |         // Check for error message (be flexible about the format)
  278 |         try {
  279 |             const errorToast = page.locator('[data-sonner-toast]').first();
  280 |             await expect(errorToast).toBeVisible({ timeout: 5000 });
  281 |         } catch {
  282 |             try {
  283 |                 const errorText = page.getByText(/invalid.*credentials/i).first();
  284 |                 await expect(errorText).toBeVisible({ timeout: 3000 });
  285 |             } catch {
  286 |                 // Check for any error indication
  287 |                 const anyError = page.locator('.error, [role="alert"], .text-red-500').first();
  288 |                 await expect(anyError).toBeVisible({ timeout: 2000 });
  289 |             }
  290 |         }
  291 |     }); test('should logout successfully', async ({ page }) => {
  292 |         // Login first using the same robust logic as the login test
  293 |         await page.goto('/auth/login', { timeout: 30000 });
  294 |         await page.waitForLoadState('networkidle', { timeout: 30000 });
  295 |
  296 |         const loginEmail = 'jaimin0609@gmail.com';
  297 |         const loginPassword = '6941@Sjp';        // Fill login form properly with validation
  298 |         await page.fill('input[name="email"]', loginEmail);
  299 |         await page.fill('input[name="password"]', loginPassword);
  300 |         await page.waitForTimeout(1000);
  301 |
  302 |         // Verify form fields are filled correctly - critical for WebKit
  303 |         const emailValue = await page.locator('input[name="email"]').inputValue();
  304 |         const passwordValue = await page.locator('input[name="password"]').inputValue();
  305 |         console.log('Login email field value:', emailValue);
  306 |         console.log('Password field filled:', passwordValue.length > 0 ? 'Yes' : 'No');
  307 |
  308 |         // If email field is empty (WebKit issue), try alternative filling method
  309 |         if (!emailValue || emailValue.trim() === '') {
  310 |             console.log('Email field empty, trying alternative filling method...');
  311 |             await page.locator('input[name="email"]').clear();
  312 |             await page.locator('input[name="email"]').type(loginEmail, { delay: 50 });
  313 |             await page.waitForTimeout(500);
  314 |
  315 |             const emailValueRetry = await page.locator('input[name="email"]').inputValue();
  316 |             console.log('Email field value after retry:', emailValueRetry);
  317 |         }
  318 |
  319 |         // Submit login
  320 |         const submitButton = page.locator('[data-testid="login-submit-button"]');
  321 |         await expect(submitButton).toBeVisible();
  322 |         await expect(submitButton).toBeEnabled();
  323 |         await submitButton.click({ timeout: 10000 });
  324 |
  325 |         console.log('Login submitted for logout test, waiting for completion...');
  326 |         await page.waitForTimeout(5000);
  327 |
  328 |         // Ensure login is successful with flexible detection
  329 |         let loginSuccess = false;
  330 |
  331 |         // Try waiting for redirect first
  332 |         try {
  333 |             await page.waitForURL('/', { timeout: 15000 });
  334 |             console.log('Successfully redirected to homepage');
  335 |             loginSuccess = true;
  336 |         } catch (redirectError) {
  337 |             console.log('Direct redirect failed, checking current state...');
  338 |
  339 |             const newUrl = page.url();
  340 |             console.log('Current URL after login submit:', newUrl);
  341 |
  342 |             // If we moved away from login page, it might be processing
  343 |             if (!newUrl.includes('/auth/login')) {
  344 |                 console.log('Moved away from login page - login may be processing');
  345 |                 await page.waitForTimeout(5000);
  346 |
  347 |                 try {
  348 |                     await page.waitForURL('/', { timeout: 10000 });
  349 |                     loginSuccess = true;
  350 |                 } catch {
  351 |                     console.log('No redirect to homepage detected');
  352 |                 }
  353 |             }
  354 |         }
  355 |
  356 |         // If still not successful, try navigating to home manually to verify login
  357 |         if (!loginSuccess) {
  358 |             console.log('Attempting manual navigation to verify login...');
  359 |             await page.goto('/', { timeout: 15000 });
  360 |         }        // Now ensure user dropdown is visible
  361 |         const userDropdown = page.locator('button:has(svg.lucide-user), .group:has(svg.lucide-user)').first();
  362 |         await expect(userDropdown).toBeVisible({ timeout: 10000 });
  363 |
  364 |         // WebKit debugging: Log what we found
  365 |         const dropdownText = await userDropdown.textContent();
  366 |         console.log('User dropdown text:', dropdownText);
  367 |
  368 |         // Try multiple interaction patterns for WebKit
> 369 |         await userDropdown.hover();
      |                            ^ Error: locator.hover: Test timeout of 60000ms exceeded.
  370 |         await page.waitForTimeout(500);
  371 |         await userDropdown.click();
  372 |
  373 |         // Wait longer for dropdown to appear in WebKit
  374 |         await page.waitForTimeout(2000);
  375 |
  376 |         // Extensive debugging for WebKit
  377 |         console.log('=== WEBKIT DROPDOWN DEBUG ===');
  378 |
  379 |         // Check all visible links
  380 |         const allLinks = await page.locator('a:visible').all();
  381 |         console.log(`Total visible links: ${allLinks.length}`);
  382 |
  383 |         for (let i = 0; i < Math.min(allLinks.length, 15); i++) {
  384 |             const text = await allLinks[i].textContent();
  385 |             const href = await allLinks[i].getAttribute('href');
  386 |             const testId = await allLinks[i].getAttribute('data-testid');
  387 |             console.log(`Link ${i}: text="${text}" href="${href}" testid="${testId}"`);
  388 |         }
  389 |
  390 |         // Check for dropdown containers
  391 |         const dropdownContainers = await page.locator('.absolute, .dropdown, [role="menu"]').all();
  392 |         console.log(`Dropdown containers found: ${dropdownContainers.length}`);
  393 |
  394 |         // Debug: Check what's visible after clicking dropdown
  395 |         const allLogoutOptions = await page.locator('a').filter({ hasText: /sign out|logout/i }).all();
  396 |         console.log(`Found ${allLogoutOptions.length} logout-related links`);        // Wait for dropdown menu to appear and find logout link with multiple fallbacks
  397 |         let logoutLink;
  398 |         let logoutFound = false;
  399 |
  400 |         // Special handling for WebKit/Safari browsers
  401 |         const browserName = await page.evaluate(() => navigator.userAgent);
  402 |         const isWebKit = browserName.includes('WebKit') && !browserName.includes('Chrome');
  403 |
  404 |         if (isWebKit) {
  405 |             console.log('=== WEBKIT SPECIAL HANDLING ===');
  406 |
  407 |             // For WebKit, try clicking the dropdown again to ensure it's open
  408 |             await userDropdown.click();
  409 |             await page.waitForTimeout(1000);
  410 |
  411 |             // Check if dropdown opened by looking for more elements
  412 |             const visibleLinksAfterSecondClick = await page.locator('a:visible').count();
  413 |             console.log(`Links visible after second click: ${visibleLinksAfterSecondClick}`);
  414 |
  415 |             // Try to force hover state
  416 |             await page.locator('.group:has(svg.lucide-user)').hover();
  417 |             await page.waitForTimeout(500);
  418 |
  419 |             // Check if any dropdown-like containers appeared
  420 |             const dropdownElements = await page.locator('.absolute, .dropdown, [class*="dropdown"], [class*="menu"]').all();
  421 |             console.log(`Dropdown-like elements found: ${dropdownElements.length}`);
  422 |
  423 |             for (let i = 0; i < dropdownElements.length; i++) {
  424 |                 const isVisible = await dropdownElements[i].isVisible();
  425 |                 const classes = await dropdownElements[i].getAttribute('class');
  426 |                 console.log(`Dropdown ${i}: visible=${isVisible}, classes=${classes}`);
  427 |             }
  428 |         }
  429 |
  430 |         // Try primary selectors first
  431 |         try {
  432 |             logoutLink = page.locator('[data-testid="logout-link"], [data-testid="mobile-logout-link"]').first();
  433 |             await expect(logoutLink).toBeVisible({ timeout: 3000 });
  434 |             logoutFound = true;
  435 |         } catch {
  436 |             // Try href-based selector
  437 |             try {
  438 |                 logoutLink = page.locator('a[href="/auth/logout"]').first();
  439 |                 await expect(logoutLink).toBeVisible({ timeout: 3000 });
  440 |                 logoutFound = true;
  441 |             } catch {
  442 |                 // Try text-based selector (broadest fallback)
  443 |                 try {
  444 |                     logoutLink = page.locator('a').filter({ hasText: /sign out|logout/i }).first();
  445 |                     await expect(logoutLink).toBeVisible({ timeout: 3000 });
  446 |                     logoutFound = true;
  447 |                 } catch {
  448 |                     // Final fallback - try any link in the dropdown area
  449 |                     logoutLink = page.locator('[role="menu"] a, .dropdown-menu a, .group a').filter({ hasText: /sign out|logout/i }).first();
  450 |                     await expect(logoutLink).toBeVisible({ timeout: 2000 });
  451 |                     logoutFound = true;
  452 |                 }
  453 |             }
  454 |         }
  455 |
  456 |         if (!logoutFound) {
  457 |             console.log('All logout link selectors failed, listing all visible links...');
  458 |             const allLinks = await page.locator('a:visible').all();
  459 |             for (let i = 0; i < Math.min(allLinks.length, 10); i++) {
  460 |                 const text = await allLinks[i].textContent();
  461 |                 const href = await allLinks[i].getAttribute('href');
  462 |                 console.log(`Link ${i}: text="${text}" href="${href}"`);
  463 |             }
  464 |             throw new Error('Could not find logout link with any selector');
  465 |         }        // Debug: log what we found
  466 |         const logoutLinkText = await logoutLink.textContent();
  467 |         console.log('Found logout link with text:', logoutLinkText);
  468 |
  469 |         // Get browser name to handle mobile/webkit differently
```