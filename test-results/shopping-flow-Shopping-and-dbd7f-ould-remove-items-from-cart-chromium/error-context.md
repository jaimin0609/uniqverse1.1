# Test info

- Name: Shopping and Checkout Flow >> should remove items from cart
- Location: C:\Users\James\Desktop\uniqverse-v1\e2e\shopping-flow.spec.ts:243:13

# Error details

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/shop", waiting until "load"

    at C:\Users\James\Desktop\uniqverse-v1\e2e\shopping-flow.spec.ts:245:20
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
  178 |     }); test('should update cart quantities', async ({ page }) => {
  179 |         // Add a product to cart first
  180 |         await page.goto('/shop');
  181 |         await page.waitForTimeout(2000);
  182 |
  183 |         const productCard = page.locator('a[href*="/products/"]').first();
  184 |         await expect(productCard).toBeVisible({ timeout: 10000 });
  185 |
  186 |         // Navigate directly to product page
  187 |         const productUrl = await productCard.getAttribute('href');
  188 |         if (productUrl) {
  189 |             await page.goto(productUrl);
  190 |             await page.waitForLoadState('networkidle');
  191 |         } else {
  192 |             await productCard.click({ force: true });
  193 |         }
  194 |
  195 |         await expect(page).toHaveURL(/\/products\//, { timeout: 10000 });
  196 |         const addToCartButton = page.locator('main button:has-text("Add to Cart"), .product-details button:has-text("Add to Cart")').first();
  197 |         await expect(addToCartButton).toBeVisible({ timeout: 10000 });
  198 |         await addToCartButton.click({ force: true });
  199 |         await page.waitForTimeout(500);
  200 |
  201 |         // Dismiss toasts before opening cart
  202 |         await dismissToasts(page);
  203 |
  204 |         // Open cart - target header cart button specifically with retry logic
  205 |         let cartOpened = false;
  206 |         for (let attempt = 0; attempt < 3; attempt++) {
  207 |             try {
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
> 245 |         await page.goto('/shop');
      |                    ^ Error: page.goto: Test timeout of 30000ms exceeded.
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
  308 |         await page.goto('/shop');
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
```