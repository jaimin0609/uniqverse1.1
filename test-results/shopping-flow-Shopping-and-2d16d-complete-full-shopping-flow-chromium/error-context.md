# Test info

- Name: Shopping and Checkout Flow >> should complete full shopping flow
- Location: C:\Users\James\Desktop\uniqverse-v1\e2e\shopping-flow.spec.ts:97:9

# Error details

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/shop", waiting until "load"

    at C:\Users\James\Desktop\uniqverse-v1\e2e\shopping-flow.spec.ts:99:20
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
  - text: Showing 2 products
- contentinfo:
  - paragraph: © 2025 UniQVerse. All rights reserved.
- region "Notifications alt+T"
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test.describe('Shopping and Checkout Flow', () => {
   4 |     test.beforeEach(async ({ page }) => {
   5 |         // Login before each test with correct credentials and path
   6 |         await page.goto('/auth/login', { timeout: 30000 });
   7 |         await page.waitForLoadState('networkidle', { timeout: 30000 });
   8 |
   9 |         // Use correct admin credentials from auth tests
   10 |         await page.fill('input[name="email"]', 'jaimin0609@gmail.com');
   11 |         await page.fill('input[name="password"]', '6941@Sjp');
   12 |
   13 |         // Wait for form to be ready
   14 |         await page.waitForTimeout(1000);
   15 |
   16 |         // Submit using correct test selector
   17 |         await page.click('[data-testid="login-submit-button"]');
   18 |
   19 |         // Wait for login to complete with flexible detection
   20 |         try {
   21 |             await page.waitForURL('/', { timeout: 20000 });
   22 |             console.log('Login successful for shopping test');
   23 |         } catch {
   24 |             // If redirect fails, check if we're at least logged in
   25 |             const userDropdown = page.locator('button:has(svg.lucide-user), .group:has(svg.lucide-user)').first();
   26 |             await expect(userDropdown).toBeVisible({ timeout: 10000 });
   27 |             console.log('Login verified through user dropdown');
   28 |         }        // Clear any existing cart items to ensure clean state - optimized for speed
   29 |         try {
   30 |             const cartButton = page.locator('header button[aria-label="Open shopping cart"]');
   31 |             if (await cartButton.isVisible({ timeout: 2000 })) {
   32 |                 await cartButton.click({ timeout: 5000 });
   33 |
   34 |                 // Wait for cart drawer to open with shorter timeout
   35 |                 const cartDrawer = page.locator('[data-testid="cart-drawer"]');
   36 |                 if (await cartDrawer.isVisible({ timeout: 3000 })) {
   37 |                     
   38 |                     // Quick check for items and clear if present
   39 |                     const cartItems = page.locator('[data-testid="cart-drawer"] ul li');
   40 |                     const itemCount = await cartItems.count();
   41 |
   42 |                     if (itemCount > 0) {
   43 |                         const clearButton = page.locator('button:has-text("Clear cart")');
   44 |                         if (await clearButton.isVisible({ timeout: 1000 })) {
   45 |                             await clearButton.click({ timeout: 3000 });
   46 |                             await page.waitForTimeout(300); // Reduced wait time
   47 |                         }
   48 |                     }                    // Close cart quickly
   49 |                     const closeButton = page.locator('[aria-label="Close cart"]');
   50 |                     if (await closeButton.isVisible({ timeout: 1000 })) {
   51 |                         await closeButton.click({ timeout: 3000 });
   52 |                         await page.waitForTimeout(200); // Reduced wait time
   53 |                     }
   54 |                 }
   55 |             }
   56 |         } catch (error: any) {
   57 |             console.log('Cart clearing skipped:', error.message);
   58 |         }
   59 |     });// Enhanced toast dismissal function
   60 |     const dismissToasts = async (page: any) => {
   61 |         try {
   62 |             // First try ESC key
   63 |             await page.keyboard.press('Escape');
   64 |             await page.waitForTimeout(300);
   65 |
   66 |             // Check if any toasts are still visible and try multiple dismissal methods
   67 |             const toasts = page.locator('[data-sonner-toast]');
   68 |             const toastCount = await toasts.count();
   69 |
   70 |             if (toastCount > 0) {
   71 |                 // Try clicking the X button if present
   72 |                 const closeButtons = page.locator('[data-sonner-toast] button[aria-label="Close toast"]');
   73 |                 const closeButtonCount = await closeButtons.count();
   74 |
   75 |                 for (let i = 0; i < closeButtonCount; i++) {
   76 |                     try {
   77 |                         await closeButtons.nth(i).click({ force: true, timeout: 1000 });
   78 |                         await page.waitForTimeout(100);
   79 |                     } catch (e) {
   80 |                         // Continue if click fails
   81 |                     }
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
>  99 |         await page.goto('/shop');
      |                    ^ Error: page.goto: Test timeout of 30000ms exceeded.
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
```