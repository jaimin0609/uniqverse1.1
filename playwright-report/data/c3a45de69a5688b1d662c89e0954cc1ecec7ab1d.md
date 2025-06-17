# Test info

- Name: Shopping and Checkout Flow >> should update cart quantities
- Location: C:\Users\James\Desktop\uniqverse-v1\e2e\shopping-flow.spec.ts:180:9

# Error details

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/shop", waiting until "load"

    at C:\Users\James\Desktop\uniqverse-v1\e2e\shopping-flow.spec.ts:182:20
```

# Test source

```ts
   82 |                 }
   83 |
   84 |                 // Click outside any remaining toasts
   85 |                 await page.click('body', { position: { x: 10, y: 10 }, force: true });
   86 |                 await page.waitForTimeout(300);
   87 |
   88 |                 // Final ESC attempt
   89 |                 await page.keyboard.press('Escape');
   90 |                 await page.waitForTimeout(200);
   91 |             }
   92 |         } catch (error) {
   93 |             // Ignore errors in toast dismissal
   94 |         }
   95 |     };
   96 |
   97 |     test('should complete full shopping flow', async ({ page }) => {
   98 |         // Navigate to shop
   99 |         await page.goto('/shop');
  100 |         await page.waitForLoadState('networkidle');        // Find and click on a product - using multiple selectors for better compatibility
  101 |         await page.waitForTimeout(2000); // Allow products to load
  102 |
  103 |         // Try different product card selectors for different browsers
  104 |         let productLink;
  105 |         try {
  106 |             // First try direct link approach
  107 |             productLink = page.locator('a[href*="/products/"]').first();
  108 |             await expect(productLink).toBeVisible({ timeout: 10000 });
  109 |         } catch {
  110 |             // Fallback selector - look for product cards more broadly
  111 |             productLink = page.locator('.group a[href*="/products/"], [data-testid*="product"] a').first();
  112 |             await expect(productLink).toBeVisible({ timeout: 5000 });
  113 |         }
  114 |
  115 |         // Get the href before clicking for verification
  116 |         const productUrl = await productLink.getAttribute('href');
  117 |         console.log('Clicking product:', productUrl);
  118 |
  119 |         // Navigate using href directly instead of clicking to avoid issues
  120 |         if (productUrl) {
  121 |             await page.goto(productUrl);
  122 |             await page.waitForLoadState('networkidle');
  123 |         } else {
  124 |             // Fallback to clicking if no href found
  125 |             await productLink.click({ force: true, timeout: 10000 });
  126 |         }
  127 |
  128 |         // Wait for product page to load
  129 |         await expect(page).toHaveURL(/\/products\//, { timeout: 10000 });
  130 |
  131 |         // Add product to cart - target only the main product page "Add to Cart" button
  132 |         await dismissToasts(page);
  133 |         const addToCartButton = page.locator('main button:has-text("Add to Cart"), .product-details button:has-text("Add to Cart")').first();
  134 |         await expect(addToCartButton).toBeVisible({ timeout: 10000 });
  135 |
  136 |         // Wait for any animations/loading to complete before clicking
  137 |         await page.waitForTimeout(500);
  138 |         await addToCartButton.click({ force: true });
  139 |
  140 |         // Wait for cart update
  141 |         await page.waitForTimeout(500);        // Dismiss toast notifications
  142 |         await dismissToasts(page);
  143 |
  144 |         // Open cart - using updated cart button selector for header specifically with retry logic
  145 |         const cartButton = page.locator('header button[aria-label="Open shopping cart"]');
  146 |         await expect(cartButton).toBeVisible({ timeout: 10000 });
  147 |
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
> 182 |         await page.goto('/shop');
      |                    ^ Error: page.goto: Test timeout of 30000ms exceeded.
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
  248 |         await page.goto('/shop');
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
```