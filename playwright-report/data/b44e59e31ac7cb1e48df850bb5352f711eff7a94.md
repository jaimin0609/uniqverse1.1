# Test info

- Name: Payment Flow E2E >> should handle payment failure gracefully
- Location: C:\Users\James\Desktop\uniqverse-v1\e2e\payment-flow.spec.ts:81:9

# Error details

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('a[href*="/products/"]').first()

    at C:\Users\James\Desktop\uniqverse-v1\e2e\payment-flow.spec.ts:87:28
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
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test.describe('Payment Flow E2E', () => {
   4 |     test.beforeEach(async ({ page }) => {
   5 |         // Start on homepage
   6 |         await page.goto('/');
   7 |         await page.waitForLoadState('networkidle');
   8 |     });
   9 |
   10 |     test('should complete full payment flow with Stripe test card', async ({ page }) => {
   11 |         // Add a product to cart
   12 |         await page.goto('/products');
   13 |         await page.waitForLoadState('networkidle');
   14 |
   15 |         // Find and click on first product
   16 |         const firstProduct = page.locator('a[href*="/products/"]').first();
   17 |         await firstProduct.click();
   18 |
   19 |         // Add to cart
   20 |         const addToCartBtn = page.locator('button').filter({ hasText: /add.*cart/i });
   21 |         await addToCartBtn.click();
   22 |
   23 |         // Open cart
   24 |         const cartButton = page.locator('button').filter({ hasText: /cart/i });
   25 |         await cartButton.click();
   26 |
   27 |         // Proceed to checkout
   28 |         const checkoutBtn = page.locator('button, a').filter({ hasText: /checkout/i });
   29 |         await checkoutBtn.click();
   30 |
   31 |         // Fill shipping information
   32 |         await page.fill('[name="email"]', 'test@example.com');
   33 |         await page.fill('[name="firstName"]', 'John');
   34 |         await page.fill('[name="lastName"]', 'Doe');
   35 |         await page.fill('[name="address"]', '123 Test Street');
   36 |         await page.fill('[name="city"]', 'Test City');
   37 |         await page.fill('[name="postalCode"]', '12345');
   38 |
   39 |         // Select country if dropdown exists
   40 |         const countrySelect = page.locator('select[name="country"]');
   41 |         if (await countrySelect.isVisible()) {
   42 |             await countrySelect.selectOption('US');
   43 |         }
   44 |
   45 |         // Continue to payment step
   46 |         const continueBtn = page.locator('button').filter({ hasText: /continue|next/i });
   47 |         if (await continueBtn.isVisible()) {
   48 |             await continueBtn.click();
   49 |         }
   50 |
   51 |         // Wait for Stripe Elements to load
   52 |         await page.waitForSelector('[data-testid="stripe-card-element"], iframe[name*="card"]', { timeout: 10000 });
   53 |
   54 |         // Fill credit card information using Stripe test card
   55 |         const cardFrame = page.frameLocator('iframe[name*="card"]').first();
   56 |
   57 |         if (await cardFrame.locator('input[name="cardnumber"]').isVisible()) {
   58 |             await cardFrame.locator('input[name="cardnumber"]').fill('4242424242424242');
   59 |             await cardFrame.locator('input[name="exp-date"]').fill('12/34');
   60 |             await cardFrame.locator('input[name="cvc"]').fill('123');
   61 |         }
   62 |
   63 |         // Complete payment
   64 |         const payButton = page.locator('button').filter({ hasText: /pay|complete|place.*order/i });
   65 |         await payButton.click();
   66 |
   67 |         // Wait for payment processing and redirect to success page
   68 |         await page.waitForLoadState('networkidle', { timeout: 30000 });
   69 |
   70 |         // Verify successful payment
   71 |         const successMessage = page.locator('h1, .success').filter({ hasText: /success|thank.*you|order.*confirmed/i });
   72 |         await expect(successMessage).toBeVisible({ timeout: 15000 });
   73 |
   74 |         // Check for order number or confirmation details
   75 |         const orderNumber = page.locator('text=/order.*#\d+|#\d+/i');
   76 |         if (await orderNumber.isVisible()) {
   77 |             await expect(orderNumber).toBeVisible();
   78 |         }
   79 |     });
   80 |
   81 |     test('should handle payment failure gracefully', async ({ page }) => {
   82 |         // Add product and proceed to checkout (similar setup)
   83 |         await page.goto('/products');
   84 |         await page.waitForLoadState('networkidle');
   85 |
   86 |         const firstProduct = page.locator('a[href*="/products/"]').first();
>  87 |         await firstProduct.click();
      |                            ^ Error: locator.click: Test timeout of 30000ms exceeded.
   88 |
   89 |         const addToCartBtn = page.locator('button').filter({ hasText: /add.*cart/i });
   90 |         await addToCartBtn.click();
   91 |
   92 |         const cartButton = page.locator('button').filter({ hasText: /cart/i });
   93 |         await cartButton.click();
   94 |
   95 |         const checkoutBtn = page.locator('button, a').filter({ hasText: /checkout/i });
   96 |         await checkoutBtn.click();
   97 |
   98 |         // Fill shipping info
   99 |         await page.fill('[name="email"]', 'test@example.com');
  100 |         await page.fill('[name="firstName"]', 'John');
  101 |         await page.fill('[name="lastName"]', 'Doe');
  102 |         await page.fill('[name="address"]', '123 Test Street');
  103 |         await page.fill('[name="city"]', 'Test City');
  104 |         await page.fill('[name="postalCode"]', '12345');
  105 |
  106 |         const continueBtn = page.locator('button').filter({ hasText: /continue|next/i });
  107 |         if (await continueBtn.isVisible()) {
  108 |             await continueBtn.click();
  109 |         }
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
```