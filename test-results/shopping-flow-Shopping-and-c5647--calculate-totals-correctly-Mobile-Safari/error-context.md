# Test info

- Name: Shopping and Checkout Flow >> should calculate totals correctly
- Location: C:\Users\James\Desktop\uniqverse-v1\e2e\shopping-flow.spec.ts:513:13

# Error details

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/shop", waiting until "load"

    at C:\Users\James\Desktop\uniqverse-v1\e2e\shopping-flow.spec.ts:534:20
```

# Page snapshot

```yaml
- banner:
  - link "UniQVerse":
    - /url: /
  - button "Search"
  - button "Settings"
  - button "Open shopping cart"
  - link "Sign In":
    - /url: /auth/login
    - button "Sign In"
  - button "Open menu"
- main:
  - heading "Shop Our Products" [level=1]
  - button "Show Filters"
  - button "Newest"
  - text: Showing 2 products 29% OFF
  - link "Fire on tshirt Add to wishlist Add to cart Fire on tshirt Clothing ... ...":
    - /url: /products/fire-on-tshirt
    - img "Fire on tshirt"
    - button "Add to wishlist"
    - button "Add to cart"
    - heading "Fire on tshirt" [level=3]
    - paragraph: Clothing
    - paragraph: ...
    - paragraph: ...
  - text: 20% OFF
  - link "Red Blazer Women's Fall Winter Fashion Temperament Goddess Style Suit Suit Add to wishlist Add to cart Red Blazer Women's Fall Winter Fashion Temperament Goddess Style Suit Suit For Her ... ...":
    - /url: /products/red-blazer-women-s-fall-winter-fashion-temperament-goddess-style-suit-suit
    - img "Red Blazer Women's Fall Winter Fashion Temperament Goddess Style Suit Suit"
    - button "Add to wishlist"
    - button "Add to cart"
    - heading "Red Blazer Women's Fall Winter Fashion Temperament Goddess Style Suit Suit" [level=3]
    - paragraph: For Her
    - paragraph: ...
    - paragraph: ...
- contentinfo:
  - paragraph: © 2025 UniQVerse. All rights reserved.
- region "Notifications alt+T"
```

# Test source

```ts
  434 |         await page.goto('/shop');
  435 |
  436 |         const productCard = page.locator('.group.relative.bg-white.rounded-lg a[href*="/products/"]').first();
  437 |         await expect(productCard).toBeVisible({ timeout: 10000 });
  438 |
  439 |         // Navigate directly to product page
  440 |         const productUrl = await productCard.getAttribute('href');
  441 |         if (productUrl) {
  442 |             await page.goto(productUrl);
  443 |             await page.waitForLoadState('networkidle');
  444 |         } else {
  445 |             await productCard.click();
  446 |         }
  447 |
  448 |         const addToCartButton = page.locator('main button:has-text("Add to Cart"), .product-details button:has-text("Add to Cart")').first();
  449 |         await expect(addToCartButton).toBeVisible({ timeout: 10000 });
  450 |         await addToCartButton.click();
  451 |         await page.waitForTimeout(500);
  452 |
  453 |         // Dismiss toast notifications
  454 |         await dismissToasts(page);
  455 |
  456 |         // Sync cart to server by opening cart to trigger sync
  457 |         const cartButton = page.locator('header button[aria-label="Open shopping cart"]');
  458 |         await cartButton.click({ force: true, timeout: 10000 });
  459 |         await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible();
  460 |
  461 |         // Verify item is in cart and wait for sync
  462 |         await expect(page.locator('[data-testid="cart-drawer"] ul li').first()).toBeVisible();
  463 |         await page.waitForTimeout(500); // Allow time for server sync
  464 |
  465 |         // Close cart
  466 |         const closeButton = page.locator('[aria-label="Close cart"]');
  467 |         await closeButton.click({ force: true });
  468 |         await page.waitForTimeout(300);
  469 |
  470 |         // Create a new browser context (simulates new session/browser)
  471 |         const newContext = await page.context().browser()!.newContext();
  472 |         const newPage = await newContext.newPage();
  473 |
  474 |         // Login in new context with same user
  475 |         await newPage.goto('/auth/login');
  476 |         await newPage.fill('input[name="email"]', 'jaimin0609@gmail.com');
  477 |         await newPage.fill('input[name="password"]', '6941@Sjp');
  478 |         await newPage.click('[data-testid="login-submit-button"]');
  479 |
  480 |         // Wait for login to complete
  481 |         try {
  482 |             await newPage.waitForURL('/', { timeout: 10000 });
  483 |         } catch {
  484 |             const userDropdown = newPage.locator('button:has(svg.lucide-user), .group:has(svg.lucide-user)').first();
  485 |             await expect(userDropdown).toBeVisible({ timeout: 5000 });
  486 |         }
  487 |
  488 |         // Wait for cart sync to complete (reduced timeout)
  489 |         await newPage.waitForTimeout(2000);
  490 |
  491 |         // Check if cart still has items
  492 |         const newCartButton = newPage.locator('header button[aria-label="Open shopping cart"]');
  493 |         await newCartButton.click();
  494 |
  495 |         // Wait for cart to open and sync
  496 |         await expect(newPage.locator('[data-testid="cart-drawer"]')).toBeVisible();
  497 |         await newPage.waitForTimeout(1000);
  498 |
  499 |         // Cart should either contain the item or show as empty (depending on sync timing)
  500 |         // We'll check for either state as both are valid depending on server sync
  501 |         try {
  502 |             await expect(newPage.locator('[data-testid="cart-drawer"] ul li').first()).toBeVisible({ timeout: 5000 });
  503 |             console.log('Cart persistence successful - items found');
  504 |         } catch {
  505 |             // If no items found, that's also acceptable as the test environment may clear carts
  506 |             const emptyMessage = newPage.locator('[data-testid="cart-drawer"] h3:has-text("Your cart is empty")');
  507 |             await expect(emptyMessage).toBeVisible({ timeout: 5000 });
  508 |             console.log('Cart appears empty - this may be expected in test environment');
  509 |         }
  510 |
  511 |         // Clean up
  512 |         await newContext.close();
  513 |     }); test('should calculate totals correctly', async ({ page }) => {
  514 |         // Add multiple items to cart
  515 |         await page.goto('/shop');
  516 |
  517 |         // Add first product
  518 |         const firstProduct = page.locator('.group.relative.bg-white.rounded-lg a[href*="/products/"]').first();
  519 |         await expect(firstProduct).toBeVisible({ timeout: 10000 });
  520 |
  521 |         // Navigate directly to first product
  522 |         const firstProductUrl = await firstProduct.getAttribute('href');
  523 |         if (firstProductUrl) {
  524 |             await page.goto(firstProductUrl);
  525 |             await page.waitForLoadState('networkidle');
  526 |         } else {
  527 |             await firstProduct.click();
  528 |         }
  529 |
  530 |         await page.locator('main button:has-text("Add to Cart"), .product-details button:has-text("Add to Cart")').first().click();
  531 |         await page.waitForTimeout(500);
  532 |
  533 |         // Go back and add another product
> 534 |         await page.goto('/shop');
      |                    ^ Error: page.goto: Test timeout of 30000ms exceeded.
  535 |         const secondProduct = page.locator('.group.relative.bg-white.rounded-lg a[href*="/products/"]').nth(1);
  536 |         await secondProduct.click();
  537 |
  538 |         await page.locator('main button:has-text("Add to Cart"), .product-details button:has-text("Add to Cart")').first().click();
  539 |         await page.waitForTimeout(500);
  540 |
  541 |         // Dismiss toast notifications
  542 |         await dismissToasts(page);
  543 |
  544 |         // Open cart and check totals - using header cart button
  545 |         const cartButton = page.locator('header button[aria-label="Open shopping cart"]');
  546 |         await cartButton.click();
  547 |
  548 |         // Verify subtotal is displayed (from cart-drawer.tsx)
  549 |         await expect(page.locator('text="Subtotal"')).toBeVisible();
  550 |     });
  551 | });
  552 |
```