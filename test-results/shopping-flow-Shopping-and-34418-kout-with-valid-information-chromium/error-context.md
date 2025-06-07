# Test info

- Name: Shopping and Checkout Flow >> should complete checkout with valid information
- Location: C:\Users\James\Desktop\uniqverse-v1\e2e\shopping-flow.spec.ts:306:9

# Error details

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/shop", waiting until "load"

    at C:\Users\James\Desktop\uniqverse-v1\e2e\shopping-flow.spec.ts:308:20
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
    - link "About":
      - /url: /about
    - link "Support":
      - /url: /support
    - link "Contact":
      - /url: /contact
  - button "Search"
  - button "Settings"
  - button "Open shopping cart"
  - button "Jaimin"
- main:
  - heading "Shop Our Products" [level=1]
  - heading "Filters" [level=2]
  - button "Categories":
    - heading "Categories" [level=3]
  - button "Price":
    - heading "Price" [level=3]
  - button "Newest"
  - text: Loading...
- contentinfo:
  - paragraph: © 2025 UniQVerse. All rights reserved.
- region "Notifications alt+T"
```

# Test source

```ts
  208 |                 const cartButton = page.locator('header button[aria-label="Open shopping cart"]');
  209 |                 await expect(cartButton).toBeVisible({ timeout: 5000 });
  210 |                 await cartButton.click({ force: true });
  211 |                 await page.waitForTimeout(1000);
  212 |
  213 |                 if (await page.locator('[data-testid="cart-drawer"]').isVisible({ timeout: 3000 })) {
  214 |                     cartOpened = true;
  215 |                     break;
  216 |                 }
  217 |             } catch (error: any) {
  218 |                 console.log(`Cart open attempt ${attempt + 1} failed`);
  219 |                 await dismissToasts(page);
  220 |                 await page.waitForTimeout(500);
  221 |             }
  222 |         } if (!cartOpened) {
  223 |             throw new Error('Failed to open cart');
  224 |         }
  225 |
  226 |         // Find quantity controls - using more specific selectors to avoid conflicts
  227 |         const increaseButton = page.locator('[aria-label="Increase quantity"]').first();
  228 |         await expect(increaseButton).toBeVisible({ timeout: 5000 });
  229 |         await increaseButton.click({ force: true });
  230 |         await page.waitForTimeout(500);
  231 |
  232 |         // Verify quantity updated - just check that quantity increased (should be 2 if we started with 1)
  233 |         const quantityElement = page.locator('[data-testid="cart-drawer"] input[type="number"]').first();
  234 |         const newQuantity = await quantityElement.inputValue();
  235 |         expect(parseInt(newQuantity)).toBeGreaterThan(1);
  236 |
  237 |         // Test decrease quantity
  238 |         const decreaseButton = page.locator('[aria-label="Decrease quantity"]').first();
  239 |         await decreaseButton.click({ force: true });
  240 |         await page.waitForTimeout(500);        // Verify quantity decreased
  241 |         const finalQuantity = await quantityElement.inputValue();
  242 |         expect(parseInt(finalQuantity)).toBeLessThan(parseInt(newQuantity));
  243 |     }); test('should remove items from cart', async ({ page }) => {
  244 |         // Add a product to cart first
  245 |         await page.goto('/shop');
  246 |         await page.waitForTimeout(2000);
  247 |
  248 |         const productCard = page.locator('a[href*="/products/"]').first();
  249 |         await expect(productCard).toBeVisible({ timeout: 10000 });
  250 |
  251 |         // Navigate directly to product page
  252 |         const productUrl = await productCard.getAttribute('href');
  253 |         if (productUrl) {
  254 |             await page.goto(productUrl);
  255 |             await page.waitForLoadState('networkidle');
  256 |         } else {
  257 |             await productCard.click({ force: true });
  258 |         }
  259 |
  260 |         await expect(page).toHaveURL(/\/products\//, { timeout: 10000 });
  261 |         const addToCartButton = page.locator('main button:has-text("Add to Cart"), .product-details button:has-text("Add to Cart")').first();
  262 |         await expect(addToCartButton).toBeVisible({ timeout: 10000 });
  263 |         await addToCartButton.click({ force: true });
  264 |         await page.waitForTimeout(500);
  265 |
  266 |         // Dismiss toast notifications
  267 |         await dismissToasts(page);
  268 |
  269 |         // Open cart - target header cart button specifically
  270 |         const cartButton = page.locator('header button[aria-label="Open shopping cart"]');
  271 |         await expect(cartButton).toBeVisible({ timeout: 5000 });
  272 |         await cartButton.click({ force: true });
  273 |
  274 |         // Wait for cart to open and load
  275 |         await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible();
  276 |         await page.waitForTimeout(500);
  277 |
  278 |         // Check if there are items in cart first
  279 |         const cartItems = page.locator('[data-testid="cart-drawer"] ul li');
  280 |         const itemCount = await cartItems.count();
  281 |         console.log(`Found ${itemCount} items in cart`);
  282 |
  283 |         if (itemCount > 0) {
  284 |             // Find and click remove button for the first item
  285 |             const removeButton = page.locator('button[aria-label="Remove item"]').first();
  286 |             await expect(removeButton).toBeVisible({ timeout: 5000 });
  287 |             await removeButton.click({ force: true });
  288 |
  289 |             // Wait for removal to complete
  290 |             await page.waitForTimeout(500);
  291 |
  292 |             // If this was the only item, cart should now be empty
  293 |             if (itemCount === 1) {
  294 |                 const emptyMessage = page.locator('[data-testid="cart-drawer"] h3:has-text("Your cart is empty")');
  295 |                 await expect(emptyMessage).toBeVisible({ timeout: 10000 });
  296 |             } else {
  297 |                 // If there were multiple items, just verify one was removed
  298 |                 const remainingItems = page.locator('[data-testid="cart-drawer"] ul li');
  299 |                 await expect(remainingItems).toHaveCount(itemCount - 1);
  300 |             }
  301 |         } else {
  302 |             console.log('Cart is already empty, skipping remove test');
  303 |         }
  304 |     });
  305 |
  306 |     test('should complete checkout with valid information', async ({ page }) => {
  307 |         // Add a product to cart first
> 308 |         await page.goto('/shop');
      |                    ^ Error: page.goto: Test timeout of 30000ms exceeded.
  309 |         await page.waitForLoadState('networkidle');
  310 |         await page.waitForTimeout(2000); // Allow products to load        // Find and click product with retry logic
  311 |         let productAdded = false;
  312 |         for (let attempt = 0; attempt < 2; attempt++) {
  313 |             try {
  314 |                 const productCard = page.locator('a[href*="/products/"]').first();
  315 |                 await expect(productCard).toBeVisible({ timeout: 10000 });
  316 |
  317 |                 // Navigate directly to product page instead of clicking
  318 |                 const productUrl = await productCard.getAttribute('href');
  319 |                 if (productUrl) {
  320 |                     await page.goto(productUrl);
  321 |                     await page.waitForLoadState('networkidle');
  322 |                 } else {
  323 |                     await productCard.click({ force: true });
  324 |                 }
  325 |
  326 |                 // Wait for product page to load
  327 |                 await expect(page).toHaveURL(/\/products\//, { timeout: 10000 });
  328 |
  329 |                 const addToCartButton = page.locator('main button:has-text("Add to Cart"), .product-details button:has-text("Add to Cart")').first();
  330 |                 await expect(addToCartButton).toBeVisible({ timeout: 10000 });
  331 |                 await addToCartButton.click({ force: true });
  332 |                 await page.waitForTimeout(500);
  333 |                 productAdded = true;
  334 |                 break;
  335 |             } catch (error: any) {
  336 |                 console.log(`Product add attempt ${attempt + 1} failed:`, error.message);
  337 |                 if (attempt === 0) {
  338 |                     await page.goto('/shop');
  339 |                     await page.waitForTimeout(1000);
  340 |                 }
  341 |             }
  342 |         }
  343 |
  344 |         if (!productAdded) {
  345 |             throw new Error('Failed to add product to cart');
  346 |         }
  347 |
  348 |         // Dismiss any toast notifications
  349 |         await dismissToasts(page);
  350 |
  351 |         // Navigate to checkout and wait for page to load completely
  352 |         await page.goto('/checkout');
  353 |         await page.waitForLoadState('networkidle');
  354 |         await page.waitForTimeout(2000); // Allow checkout page to fully render
  355 |
  356 |         // Wait for and click "Proceed to Checkout" with retry logic
  357 |         let checkoutStarted = false;
  358 |         for (let attempt = 0; attempt < 3; attempt++) {
  359 |             try {
  360 |                 const proceedButton = page.locator('button:has-text("Proceed to Checkout")');
  361 |                 await expect(proceedButton).toBeVisible({ timeout: 10000 });
  362 |                 await proceedButton.click({ force: true });
  363 |                 await page.waitForTimeout(1000);
  364 |
  365 |                 // Check if shipping form appeared
  366 |                 const shippingHeader = page.locator('h2:has-text("Shipping Information")');
  367 |                 if (await shippingHeader.isVisible({ timeout: 5000 })) {
  368 |                     checkoutStarted = true;
  369 |                     break;
  370 |                 }
  371 |             } catch (error: any) {
  372 |                 console.log(`Checkout start attempt ${attempt + 1} failed:`, error.message);
  373 |                 if (attempt < 2) {
  374 |                     await page.waitForTimeout(1000);
  375 |                     await page.reload();
  376 |                     await page.waitForLoadState('networkidle');
  377 |                 }
  378 |             }
  379 |         }
  380 |
  381 |         if (!checkoutStarted) {
  382 |             throw new Error('Failed to start checkout process');
  383 |         }
  384 |
  385 |         // Wait for shipping form to appear
  386 |         await expect(page.locator('h2:has-text("Shipping Information")')).toBeVisible({ timeout: 10000 });
  387 |
  388 |         // Fill in shipping information using proper selectors
  389 |         await page.fill('input#firstName', 'John');
  390 |         await page.fill('input#lastName', 'Doe');
  391 |         await page.fill('input#email', 'john.doe@example.com');
  392 |         await page.fill('input#phone', '1234567890');
  393 |         await page.fill('input#address', '123 Main St');
  394 |         await page.fill('input#city', 'New York');
  395 |         await page.fill('input#state', 'NY');
  396 |         await page.fill('input#postalCode', '10001');
  397 |
  398 |         // Select country
  399 |         await page.selectOption('select#country', 'United States');
  400 |
  401 |         // Select shipping method
  402 |         await page.check('input[value="standard"]');
  403 |
  404 |         // Click Continue to Payment
  405 |         await page.click('button:has-text("Continue to Payment")');
  406 |
  407 |         // Wait for payment form to appear
  408 |         await expect(page.locator('h2:has-text("Payment Information")')).toBeVisible({ timeout: 10000 });
```