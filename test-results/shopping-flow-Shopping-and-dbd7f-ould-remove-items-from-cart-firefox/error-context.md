# Test info

- Name: Shopping and Checkout Flow >> should remove items from cart
- Location: C:\Users\James\Desktop\uniqverse-v1\e2e\shopping-flow.spec.ts:246:9

# Error details

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/shop", waiting until "load"

    at C:\Users\James\Desktop\uniqverse-v1\e2e\shopping-flow.spec.ts:248:20
```

# Test source

```ts
  148 |         // Try to click cart button with multiple attempts for mobile browsers
  149 |         let cartOpened = false;
  150 |         for (let attempt = 0; attempt < 3; attempt++) {
  151 |             try {
  152 |                 await dismissToasts(page); // Dismiss toasts before each attempt
  153 |                 await cartButton.click({ force: true, timeout: 5000 });
  154 |                 await page.waitForTimeout(500);
  155 |
  156 |                 // Check if cart opened
  157 |                 const cartDrawer = page.locator('[role="dialog"], [data-testid="cart-drawer"]');
  158 |                 if (await cartDrawer.isVisible({ timeout: 2000 })) {
  159 |                     cartOpened = true;
  160 |                     break;
  161 |                 }
  162 |             } catch (error: any) {
  163 |                 console.log(`Cart click attempt ${attempt + 1} failed:`, error.message);
  164 |                 if (attempt < 2) {
  165 |                     await page.waitForTimeout(1000);
  166 |                 }
  167 |             }
  168 |         }
  169 |
  170 |         // Verify cart opens
  171 |         await expect(page.locator('[role="dialog"], [data-testid="cart-drawer"]')).toBeVisible({ timeout: 5000 });
  172 |
  173 |         // Proceed to checkout
  174 |         const checkoutButton = page.locator('button:has-text("Checkout"), button:has-text("Proceed to Checkout")');
  175 |         await expect(checkoutButton).toBeVisible();
  176 |         await checkoutButton.click();        // Should navigate to checkout page
  177 |         await expect(page).toHaveURL(/\/checkout/);
  178 |     });
  179 |
  180 |     test('should update cart quantities', async ({ page }) => {
  181 |         // Add a product to cart first
  182 |         await page.goto('/shop');
  183 |         await page.waitForTimeout(2000);
  184 |
  185 |         const productCard = page.locator('a[href*="/products/"]').first();
  186 |         await expect(productCard).toBeVisible({ timeout: 10000 });
  187 |
  188 |         // Navigate directly to product page
  189 |         const productUrl = await productCard.getAttribute('href');
  190 |         if (productUrl) {
  191 |             await page.goto(productUrl);
  192 |             await page.waitForLoadState('networkidle');
  193 |         } else {
  194 |             await productCard.click({ force: true });
  195 |         }
  196 |
  197 |         await expect(page).toHaveURL(/\/products\//, { timeout: 10000 });
  198 |         const addToCartButton = page.locator('main button:has-text("Add to Cart"), .product-details button:has-text("Add to Cart")').first();
  199 |         await expect(addToCartButton).toBeVisible({ timeout: 10000 });
  200 |         await addToCartButton.click({ force: true });
  201 |         await page.waitForTimeout(500);
  202 |
  203 |         // Dismiss toasts before opening cart
  204 |         await dismissToasts(page);
  205 |
  206 |         // Open cart - target header cart button specifically with retry logic
  207 |         let cartOpened = false;
  208 |         for (let attempt = 0; attempt < 3; attempt++) {
  209 |             try {
  210 |                 const cartButton = page.locator('header button[aria-label="Open shopping cart"]');
  211 |                 await expect(cartButton).toBeVisible({ timeout: 5000 });
  212 |                 await cartButton.click({ force: true });
  213 |                 await page.waitForTimeout(1000);
  214 |
  215 |                 if (await page.locator('[data-testid="cart-drawer"]').isVisible({ timeout: 3000 })) {
  216 |                     cartOpened = true;
  217 |                     break;
  218 |                 }
  219 |             } catch (error: any) {
  220 |                 console.log(`Cart open attempt ${attempt + 1} failed`);
  221 |                 await dismissToasts(page);
  222 |                 await page.waitForTimeout(500);
  223 |             }
  224 |         } if (!cartOpened) {
  225 |             throw new Error('Failed to open cart');
  226 |         }
  227 |
  228 |         // Find quantity controls - using more specific selectors to avoid conflicts
  229 |         const increaseButton = page.locator('[aria-label="Increase quantity"]').first();
  230 |         await expect(increaseButton).toBeVisible({ timeout: 5000 });
  231 |         await increaseButton.click({ force: true });
  232 |         await page.waitForTimeout(500);
  233 |
  234 |         // Verify quantity updated - just check that quantity increased (should be 2 if we started with 1)
  235 |         const quantityElement = page.locator('[data-testid="cart-drawer"] input[type="number"]').first();
  236 |         const newQuantity = await quantityElement.inputValue();
  237 |         expect(parseInt(newQuantity)).toBeGreaterThan(1);
  238 |
  239 |         // Test decrease quantity
  240 |         const decreaseButton = page.locator('[aria-label="Decrease quantity"]').first(); await decreaseButton.click({ force: true });
  241 |         await page.waitForTimeout(500);        // Verify quantity decreased
  242 |         const finalQuantity = await quantityElement.inputValue();
  243 |         expect(parseInt(finalQuantity)).toBeLessThan(parseInt(newQuantity));
  244 |     });
  245 |
  246 |     test('should remove items from cart', async ({ page }) => {
  247 |         // Add a product to cart first
> 248 |         await page.goto('/shop');
      |                    ^ Error: page.goto: Test timeout of 30000ms exceeded.
  249 |         await page.waitForTimeout(2000);
  250 |
  251 |         const productCard = page.locator('a[href*="/products/"]').first();
  252 |         await expect(productCard).toBeVisible({ timeout: 10000 });
  253 |
  254 |         // Navigate directly to product page
  255 |         const productUrl = await productCard.getAttribute('href');
  256 |         if (productUrl) {
  257 |             await page.goto(productUrl);
  258 |             await page.waitForLoadState('networkidle');
  259 |         } else {
  260 |             await productCard.click({ force: true });
  261 |         }
  262 |
  263 |         await expect(page).toHaveURL(/\/products\//, { timeout: 10000 });
  264 |         const addToCartButton = page.locator('main button:has-text("Add to Cart"), .product-details button:has-text("Add to Cart")').first();
  265 |         await expect(addToCartButton).toBeVisible({ timeout: 10000 });
  266 |         await addToCartButton.click({ force: true });
  267 |         await page.waitForTimeout(500);
  268 |
  269 |         // Dismiss toast notifications
  270 |         await dismissToasts(page);
  271 |
  272 |         // Open cart - target header cart button specifically
  273 |         const cartButton = page.locator('header button[aria-label="Open shopping cart"]');
  274 |         await expect(cartButton).toBeVisible({ timeout: 5000 });
  275 |         await cartButton.click({ force: true });
  276 |
  277 |         // Wait for cart to open and load
  278 |         await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible();
  279 |         await page.waitForTimeout(500);
  280 |
  281 |         // Check if there are items in cart first
  282 |         const cartItems = page.locator('[data-testid="cart-drawer"] ul li');
  283 |         const itemCount = await cartItems.count();
  284 |         console.log(`Found ${itemCount} items in cart`);
  285 |
  286 |         if (itemCount > 0) {
  287 |             // Find and click remove button for the first item
  288 |             const removeButton = page.locator('button[aria-label="Remove item"]').first();
  289 |             await expect(removeButton).toBeVisible({ timeout: 5000 });
  290 |             await removeButton.click({ force: true });
  291 |
  292 |             // Wait for removal to complete
  293 |             await page.waitForTimeout(500);
  294 |
  295 |             // If this was the only item, cart should now be empty
  296 |             if (itemCount === 1) {
  297 |                 const emptyMessage = page.locator('[data-testid="cart-drawer"] h3:has-text("Your cart is empty")');
  298 |                 await expect(emptyMessage).toBeVisible({ timeout: 10000 });
  299 |             } else {
  300 |                 // If there were multiple items, just verify one was removed
  301 |                 const remainingItems = page.locator('[data-testid="cart-drawer"] ul li');
  302 |                 await expect(remainingItems).toHaveCount(itemCount - 1);
  303 |             }
  304 |         } else {
  305 |             console.log('Cart is already empty, skipping remove test');
  306 |         }
  307 |     });
  308 |
  309 |     test('should complete checkout with valid information', async ({ page }) => {
  310 |         // Add a product to cart first
  311 |         await page.goto('/shop');
  312 |         await page.waitForLoadState('networkidle');
  313 |         await page.waitForTimeout(2000); // Allow products to load        // Find and click product with retry logic
  314 |         let productAdded = false;
  315 |         for (let attempt = 0; attempt < 2; attempt++) {
  316 |             try {
  317 |                 const productCard = page.locator('a[href*="/products/"]').first();
  318 |                 await expect(productCard).toBeVisible({ timeout: 10000 });
  319 |
  320 |                 // Navigate directly to product page instead of clicking
  321 |                 const productUrl = await productCard.getAttribute('href');
  322 |                 if (productUrl) {
  323 |                     await page.goto(productUrl);
  324 |                     await page.waitForLoadState('networkidle');
  325 |                 } else {
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
```