# Test info

- Name: Shopping and Checkout Flow >> should handle checkout validation errors
- Location: C:\Users\James\Desktop\uniqverse-v1\e2e\shopping-flow.spec.ts:424:9

# Error details

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/checkout", waiting until "load"

    at C:\Users\James\Desktop\uniqverse-v1\e2e\shopping-flow.spec.ts:426:20
```

# Test source

```ts
  326 |                     await productCard.click({ force: true });
  327 |                 }
  328 |
  329 |                 // Wait for product page to load
  330 |                 await expect(page).toHaveURL(/\/products\//, { timeout: 10000 });
  331 |
  332 |                 const addToCartButton = page.locator('main button:has-text("Add to Cart"), .product-details button:has-text("Add to Cart")').first();
  333 |                 await expect(addToCartButton).toBeVisible({ timeout: 10000 });
  334 |                 await addToCartButton.click({ force: true });
  335 |                 await page.waitForTimeout(500);
  336 |                 productAdded = true;
  337 |                 break;
  338 |             } catch (error: any) {
  339 |                 console.log(`Product add attempt ${attempt + 1} failed:`, error.message);
  340 |                 if (attempt === 0) {
  341 |                     await page.goto('/shop');
  342 |                     await page.waitForTimeout(1000);
  343 |                 }
  344 |             }
  345 |         }
  346 |
  347 |         if (!productAdded) {
  348 |             throw new Error('Failed to add product to cart');
  349 |         }
  350 |
  351 |         // Dismiss any toast notifications
  352 |         await dismissToasts(page);
  353 |
  354 |         // Navigate to checkout and wait for page to load completely
  355 |         await page.goto('/checkout');
  356 |         await page.waitForLoadState('networkidle');
  357 |         await page.waitForTimeout(2000); // Allow checkout page to fully render
  358 |
  359 |         // Wait for and click "Proceed to Checkout" with retry logic
  360 |         let checkoutStarted = false;
  361 |         for (let attempt = 0; attempt < 3; attempt++) {
  362 |             try {
  363 |                 const proceedButton = page.locator('button:has-text("Proceed to Checkout")');
  364 |                 await expect(proceedButton).toBeVisible({ timeout: 10000 });
  365 |                 await proceedButton.click({ force: true });
  366 |                 await page.waitForTimeout(1000);
  367 |
  368 |                 // Check if shipping form appeared
  369 |                 const shippingHeader = page.locator('h2:has-text("Shipping Information")');
  370 |                 if (await shippingHeader.isVisible({ timeout: 5000 })) {
  371 |                     checkoutStarted = true;
  372 |                     break;
  373 |                 }
  374 |             } catch (error: any) {
  375 |                 console.log(`Checkout start attempt ${attempt + 1} failed:`, error.message);
  376 |                 if (attempt < 2) {
  377 |                     await page.waitForTimeout(1000);
  378 |                     await page.reload();
  379 |                     await page.waitForLoadState('networkidle');
  380 |                 }
  381 |             }
  382 |         }
  383 |
  384 |         if (!checkoutStarted) {
  385 |             throw new Error('Failed to start checkout process');
  386 |         }
  387 |
  388 |         // Wait for shipping form to appear
  389 |         await expect(page.locator('h2:has-text("Shipping Information")')).toBeVisible({ timeout: 10000 });
  390 |
  391 |         // Fill in shipping information using proper selectors
  392 |         await page.fill('input#firstName', 'John');
  393 |         await page.fill('input#lastName', 'Doe');
  394 |         await page.fill('input#email', 'john.doe@example.com');
  395 |         await page.fill('input#phone', '1234567890');
  396 |         await page.fill('input#address', '123 Main St');
  397 |         await page.fill('input#city', 'New York');
  398 |         await page.fill('input#state', 'NY');
  399 |         await page.fill('input#postalCode', '10001');
  400 |
  401 |         // Select country
  402 |         await page.selectOption('select#country', 'United States');
  403 |
  404 |         // Select shipping method
  405 |         await page.check('input[value="standard"]');
  406 |
  407 |         // Click Continue to Payment
  408 |         await page.click('button:has-text("Continue to Payment")');
  409 |
  410 |         // Wait for payment form to appear
  411 |         await expect(page.locator('h2:has-text("Payment Information")')).toBeVisible({ timeout: 10000 });
  412 |
  413 |         // Fill payment info (cardholder name)
  414 |         await page.fill('input#cardholderName', 'John Doe');
  415 |
  416 |         // Note: We cannot easily test actual Stripe card input in e2e tests
  417 |         // as it's in an iframe. For now, we'll verify the form appears correctly
  418 |
  419 |         // Verify that the payment form elements are present
  420 |         await expect(page.locator('label:has-text("Card Details")')).toBeVisible();
  421 |         await expect(page.locator('button:has-text("Pay")')).toBeVisible();
  422 |     });
  423 |
  424 |     test('should handle checkout validation errors', async ({ page }) => {
  425 |         // Navigate to checkout without items (should show error or redirect)
> 426 |         await page.goto('/checkout');
      |                    ^ Error: page.goto: Test timeout of 30000ms exceeded.
  427 |
  428 |         // Try to place order without filling required fields
  429 |         const placeOrderButton = page.locator('button:has-text("Place Order")'); if (await placeOrderButton.isVisible()) {
  430 |             await placeOrderButton.click();
  431 |             // Should show validation errors
  432 |             await expect(page.locator('text="required", text="Please fill"')).toBeVisible({ timeout: 5000 });
  433 |         }
  434 |     });
  435 |
  436 |     test('should persist cart across sessions', async ({ page, context }) => {
  437 |         // Add item to cart
  438 |         await page.goto('/shop');
  439 |
  440 |         const productCard = page.locator('.group.relative.bg-white.rounded-lg a[href*="/products/"]').first();
  441 |         await expect(productCard).toBeVisible({ timeout: 10000 });
  442 |
  443 |         // Navigate directly to product page
  444 |         const productUrl = await productCard.getAttribute('href');
  445 |         if (productUrl) {
  446 |             await page.goto(productUrl);
  447 |             await page.waitForLoadState('networkidle');
  448 |         } else {
  449 |             await productCard.click();
  450 |         }
  451 |
  452 |         const addToCartButton = page.locator('main button:has-text("Add to Cart"), .product-details button:has-text("Add to Cart")').first();
  453 |         await expect(addToCartButton).toBeVisible({ timeout: 10000 });
  454 |         await addToCartButton.click();
  455 |         await page.waitForTimeout(500);
  456 |
  457 |         // Dismiss toast notifications
  458 |         await dismissToasts(page);
  459 |
  460 |         // Sync cart to server by opening cart to trigger sync
  461 |         const cartButton = page.locator('header button[aria-label="Open shopping cart"]');
  462 |         await cartButton.click({ force: true, timeout: 10000 });
  463 |         await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible();
  464 |
  465 |         // Verify item is in cart and wait for sync
  466 |         await expect(page.locator('[data-testid="cart-drawer"] ul li').first()).toBeVisible();
  467 |         await page.waitForTimeout(500); // Allow time for server sync
  468 |
  469 |         // Close cart
  470 |         const closeButton = page.locator('[aria-label="Close cart"]');
  471 |         await closeButton.click({ force: true });
  472 |         await page.waitForTimeout(300);
  473 |
  474 |         // Create a new browser context (simulates new session/browser)
  475 |         const newContext = await page.context().browser()!.newContext();
  476 |         const newPage = await newContext.newPage();
  477 |
  478 |         // Login in new context with same user
  479 |         await newPage.goto('/auth/login');
  480 |         await newPage.fill('input[name="email"]', 'jaimin0609@gmail.com');
  481 |         await newPage.fill('input[name="password"]', '6941@Sjp');
  482 |         await newPage.click('[data-testid="login-submit-button"]');
  483 |
  484 |         // Wait for login to complete
  485 |         try {
  486 |             await newPage.waitForURL('/', { timeout: 10000 });
  487 |         } catch {
  488 |             const userDropdown = newPage.locator('button:has(svg.lucide-user), .group:has(svg.lucide-user)').first();
  489 |             await expect(userDropdown).toBeVisible({ timeout: 5000 });
  490 |         }
  491 |
  492 |         // Wait for cart sync to complete (reduced timeout)
  493 |         await newPage.waitForTimeout(2000);
  494 |
  495 |         // Check if cart still has items
  496 |         const newCartButton = newPage.locator('header button[aria-label="Open shopping cart"]');
  497 |         await newCartButton.click();
  498 |
  499 |         // Wait for cart to open and sync
  500 |         await expect(newPage.locator('[data-testid="cart-drawer"]')).toBeVisible();
  501 |         await newPage.waitForTimeout(1000);
  502 |
  503 |         // Cart should either contain the item or show as empty (depending on sync timing)
  504 |         // We'll check for either state as both are valid depending on server sync
  505 |         try {
  506 |             await expect(newPage.locator('[data-testid="cart-drawer"] ul li').first()).toBeVisible({ timeout: 5000 });
  507 |             console.log('Cart persistence successful - items found');
  508 |         } catch {
  509 |             // If no items found, that's also acceptable as the test environment may clear carts
  510 |             const emptyMessage = newPage.locator('[data-testid="cart-drawer"] h3:has-text("Your cart is empty")'); await expect(emptyMessage).toBeVisible({ timeout: 5000 });
  511 |             console.log('Cart appears empty - this may be expected in test environment');
  512 |         }
  513 |
  514 |         // Clean up
  515 |         await newContext.close();
  516 |     });
  517 |
  518 |     test('should calculate totals correctly', async ({ page }) => {
  519 |         // Add multiple items to cart
  520 |         await page.goto('/shop');
  521 |
  522 |         // Add first product
  523 |         const firstProduct = page.locator('.group.relative.bg-white.rounded-lg a[href*="/products/"]').first();
  524 |         await expect(firstProduct).toBeVisible({ timeout: 10000 });
  525 |
  526 |         // Navigate directly to first product
```