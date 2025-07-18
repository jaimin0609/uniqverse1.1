# Test info

- Name: Payment Flow E2E >> should apply coupon codes
- Location: C:\Users\James\Desktop\uniqverse-v1\e2e\payment-flow.spec.ts:204:9

# Error details

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('a[href*="/products/"]').first()

    at C:\Users\James\Desktop\uniqverse-v1\e2e\payment-flow.spec.ts:210:28
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
  - heading "404" [level=1]
  - heading "This page could not be found." [level=2]
- contentinfo:
  - paragraph: © 2025 UniQVerse. All rights reserved.
- region "Notifications alt+T"
```

# Test source

```ts
  110 |
  111 |         // Wait for Stripe Elements
  112 |         await page.waitForSelector('[data-testid="stripe-card-element"], iframe[name*="card"]', { timeout: 10000 });
  113 |
  114 |         // Use Stripe test card that will be declined
  115 |         const cardFrame = page.frameLocator('iframe[name*="card"]').first();
  116 |
  117 |         if (await cardFrame.locator('input[name="cardnumber"]').isVisible()) {
  118 |             await cardFrame.locator('input[name="cardnumber"]').fill('4000000000000002'); // Declined card
  119 |             await cardFrame.locator('input[name="exp-date"]').fill('12/34');
  120 |             await cardFrame.locator('input[name="cvc"]').fill('123');
  121 |         }
  122 |
  123 |         // Attempt payment
  124 |         const payButton = page.locator('button').filter({ hasText: /pay|complete|place.*order/i });
  125 |         await payButton.click();
  126 |
  127 |         // Check for error message
  128 |         const errorMessage = page.locator('.error, .alert-error').filter({ hasText: /declined|failed|error/i });
  129 |         await expect(errorMessage).toBeVisible({ timeout: 10000 });
  130 |     });
  131 |
  132 |     test('should validate required payment fields', async ({ page }) => {
  133 |         // Navigate to checkout
  134 |         await page.goto('/products');
  135 |         await page.waitForLoadState('networkidle');
  136 |
  137 |         const firstProduct = page.locator('a[href*="/products/"]').first();
  138 |         await firstProduct.click();
  139 |
  140 |         const addToCartBtn = page.locator('button').filter({ hasText: /add.*cart/i });
  141 |         await addToCartBtn.click();
  142 |
  143 |         const cartButton = page.locator('button').filter({ hasText: /cart/i });
  144 |         await cartButton.click();
  145 |
  146 |         const checkoutBtn = page.locator('button, a').filter({ hasText: /checkout/i });
  147 |         await checkoutBtn.click();
  148 |
  149 |         // Try to proceed without filling required fields
  150 |         const continueBtn = page.locator('button').filter({ hasText: /continue|next/i });
  151 |         if (await continueBtn.isVisible()) {
  152 |             await continueBtn.click();
  153 |
  154 |             // Check for validation errors
  155 |             const errorMessages = page.locator('.error, .text-red-500').filter({ hasText: /required|invalid/i });
  156 |             if (await errorMessages.count() > 0) {
  157 |                 await expect(errorMessages.first()).toBeVisible();
  158 |             }
  159 |         }
  160 |     });
  161 |
  162 |     test('should calculate taxes and shipping correctly', async ({ page }) => {
  163 |         // Add product to cart
  164 |         await page.goto('/products');
  165 |         await page.waitForLoadState('networkidle');
  166 |
  167 |         const firstProduct = page.locator('a[href*="/products/"]').first();
  168 |         await firstProduct.click();
  169 |
  170 |         const addToCartBtn = page.locator('button').filter({ hasText: /add.*cart/i });
  171 |         await addToCartBtn.click();
  172 |
  173 |         const cartButton = page.locator('button').filter({ hasText: /cart/i });
  174 |         await cartButton.click();
  175 |
  176 |         const checkoutBtn = page.locator('button, a').filter({ hasText: /checkout/i });
  177 |         await checkoutBtn.click();
  178 |
  179 |         // Fill address to trigger tax/shipping calculation
  180 |         await page.fill('[name="address"]', '123 Test Street');
  181 |         await page.fill('[name="city"]', 'New York');
  182 |         await page.fill('[name="postalCode"]', '10001');
  183 |
  184 |         const countrySelect = page.locator('select[name="country"]');
  185 |         if (await countrySelect.isVisible()) {
  186 |             await countrySelect.selectOption('US');
  187 |         }
  188 |
  189 |         // Check for tax and shipping calculations
  190 |         const subtotal = page.locator('text=/subtotal/i').first();
  191 |         const tax = page.locator('text=/tax/i').first();
  192 |         const shipping = page.locator('text=/shipping/i').first();
  193 |         const total = page.locator('text=/total/i').last();
  194 |
  195 |         if (await subtotal.isVisible()) {
  196 |             await expect(subtotal).toBeVisible();
  197 |         }
  198 |
  199 |         if (await total.isVisible()) {
  200 |             await expect(total).toBeVisible();
  201 |         }
  202 |     });
  203 |
  204 |     test('should apply coupon codes', async ({ page }) => {
  205 |         // Add product to cart
  206 |         await page.goto('/products');
  207 |         await page.waitForLoadState('networkidle');
  208 |
  209 |         const firstProduct = page.locator('a[href*="/products/"]').first();
> 210 |         await firstProduct.click();
      |                            ^ Error: locator.click: Test timeout of 30000ms exceeded.
  211 |
  212 |         const addToCartBtn = page.locator('button').filter({ hasText: /add.*cart/i });
  213 |         await addToCartBtn.click();
  214 |
  215 |         const cartButton = page.locator('button').filter({ hasText: /cart/i });
  216 |         await cartButton.click();
  217 |
  218 |         // Look for coupon input in cart or checkout
  219 |         const couponInput = page.locator('input[name*="coupon"], input[placeholder*="coupon"]');
  220 |
  221 |         if (await couponInput.isVisible()) {
  222 |             await couponInput.fill('TEST10'); // Test coupon code
  223 |
  224 |             const applyCouponBtn = page.locator('button').filter({ hasText: /apply/i });
  225 |             if (await applyCouponBtn.isVisible()) {
  226 |                 await applyCouponBtn.click();
  227 |
  228 |                 // Check for discount applied
  229 |                 const discount = page.locator('text=/discount|saved/i');
  230 |                 if (await discount.isVisible()) {
  231 |                     await expect(discount).toBeVisible();
  232 |                 }
  233 |             }
  234 |         }
  235 |     });
  236 |
  237 |     test('should handle multiple payment methods', async ({ page }) => {
  238 |         // This test checks if the system supports multiple payment methods
  239 |         await page.goto('/products');
  240 |         await page.waitForLoadState('networkidle');
  241 |
  242 |         const firstProduct = page.locator('a[href*="/products/"]').first();
  243 |         await firstProduct.click();
  244 |
  245 |         const addToCartBtn = page.locator('button').filter({ hasText: /add.*cart/i });
  246 |         await addToCartBtn.click();
  247 |
  248 |         const cartButton = page.locator('button').filter({ hasText: /cart/i });
  249 |         await cartButton.click();
  250 |
  251 |         const checkoutBtn = page.locator('button, a').filter({ hasText: /checkout/i });
  252 |         await checkoutBtn.click();
  253 |
  254 |         // Look for payment method options
  255 |         const paymentMethods = page.locator('input[type="radio"][name*="payment"], select[name*="payment"]');
  256 |
  257 |         if (await paymentMethods.count() > 0) {
  258 |             // Test different payment methods if available
  259 |             const methodCount = await paymentMethods.count();
  260 |
  261 |             for (let i = 0; i < Math.min(methodCount, 3); i++) {
  262 |                 if (await paymentMethods.nth(i).isVisible()) {
  263 |                     await paymentMethods.nth(i).click();
  264 |                     await page.waitForTimeout(500); // Wait for UI to update
  265 |                 }
  266 |             }
  267 |         }
  268 |     });
  269 |
  270 |     test('should save payment information for logged-in users', async ({ page }) => {
  271 |         // Login first
  272 |         await page.goto('/auth/login');
  273 |         await page.fill('[name="email"]', 'test@example.com');
  274 |         await page.fill('[name="password"]', 'password123');
  275 |         await page.click('button[type="submit"]');
  276 |         await page.waitForURL('/');
  277 |
  278 |         // Add product and proceed to checkout
  279 |         await page.goto('/products');
  280 |         await page.waitForLoadState('networkidle');
  281 |
  282 |         const firstProduct = page.locator('a[href*="/products/"]').first();
  283 |         await firstProduct.click();
  284 |
  285 |         const addToCartBtn = page.locator('button').filter({ hasText: /add.*cart/i });
  286 |         await addToCartBtn.click();
  287 |
  288 |         const cartButton = page.locator('button').filter({ hasText: /cart/i });
  289 |         await cartButton.click();
  290 |
  291 |         const checkoutBtn = page.locator('button, a').filter({ hasText: /checkout/i });
  292 |         await checkoutBtn.click();
  293 |
  294 |         // Check if saved payment methods are available
  295 |         const savedPaymentMethods = page.locator('.saved-payment, .payment-method').filter({ hasText: /saved|ending.*in/i });
  296 |
  297 |         if (await savedPaymentMethods.count() > 0) {
  298 |             await expect(savedPaymentMethods.first()).toBeVisible();
  299 |         }
  300 |
  301 |         // Check for "Save payment method" checkbox
  302 |         const savePaymentCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /save.*payment/i });
  303 |
  304 |         if (await savePaymentCheckbox.isVisible()) {
  305 |             await savePaymentCheckbox.check();
  306 |         }
  307 |     });
  308 | });
  309 |
```