# Test info

- Name: Admin Order Management >> should view order details
- Location: C:\Users\James\Desktop\uniqverse-v1\e2e\admin-orders.spec.ts:100:9

# Error details

```
TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
=========================== logs ===========================
waiting for navigation to "/" until "load"
============================================================
    at C:\Users\James\Desktop\uniqverse-v1\e2e\admin-orders.spec.ts:12:20
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
  - link "Uniqverse":
    - /url: /
  - heading "Welcome back" [level=2]
  - paragraph:
    - text: Don't have an account?
    - link "Create an account":
      - /url: /auth/register
  - text: Email address
  - textbox "Email address"
  - text: Password
  - textbox "Password"
  - checkbox "Remember me"
  - text: Remember me
  - link "Forgot your password?":
    - /url: /auth/forgot-password
  - button "Sign in"
  - text: Or continue with
  - button "Sign in with Google":
    - img
    - text: Sign in with Google
  - heading "Shop Unique, Live Unique" [level=2]
  - paragraph: Discover custom-designed products that reflect your unique personality.
- contentinfo:
  - paragraph: © 2025 UniQVerse. All rights reserved.
- region "Notifications alt+T"
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test.describe('Admin Order Management', () => {
   4 |     test.beforeEach(async ({ page }) => {
   5 |         // Login as admin user
   6 |         await page.goto('/auth/login');
   7 |         await page.fill('[name="email"]', 'admin@uniqverse.com');
   8 |         await page.fill('[name="password"]', 'admin123');
   9 |         await page.click('button[type="submit"]');
   10 |
   11 |         // Wait for successful login and navigate to orders
>  12 |         await page.waitForURL('/', { timeout: 10000 });
      |                    ^ TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
   13 |         await page.goto('/admin/orders');
   14 |         await page.waitForLoadState('networkidle');
   15 |     });
   16 |
   17 |     test('should display orders page with filters and search', async ({ page }) => {
   18 |         // Check page elements
   19 |         await expect(page.locator('h1')).toContainText('Orders');
   20 |
   21 |         // Check search functionality
   22 |         const searchInput = page.locator('input[placeholder*="Search"]');
   23 |         if (await searchInput.isVisible()) {
   24 |             await expect(searchInput).toBeVisible();
   25 |         }
   26 |
   27 |         // Check orders table/list
   28 |         const ordersContainer = page.locator('table, .space-y-4');
   29 |         await expect(ordersContainer).toBeVisible();
   30 |
   31 |         // Check filter options
   32 |         const statusFilter = page.locator('select').filter({ hasText: /status/i }).first();
   33 |         if (await statusFilter.isVisible()) {
   34 |             await expect(statusFilter).toBeVisible();
   35 |         }
   36 |     });
   37 |
   38 |     test('should display order metrics', async ({ page }) => {
   39 |         // Check for order metrics cards
   40 |         const metricsCards = page.locator('.grid .bg-white, .grid .card');
   41 |
   42 |         if (await metricsCards.count() > 0) {
   43 |             await expect(metricsCards.first()).toBeVisible();
   44 |
   45 |             // Check for total orders metric
   46 |             const totalOrdersCard = page.locator('.card, .bg-white').filter({ hasText: /total.*orders/i });
   47 |             if (await totalOrdersCard.isVisible()) {
   48 |                 await expect(totalOrdersCard).toBeVisible();
   49 |             }
   50 |
   51 |             // Check for processing orders metric
   52 |             const processingCard = page.locator('.card, .bg-white').filter({ hasText: /processing/i });
   53 |             if (await processingCard.isVisible()) {
   54 |                 await expect(processingCard).toBeVisible();
   55 |             }
   56 |
   57 |             // Check for revenue metric
   58 |             const revenueCard = page.locator('.card, .bg-white').filter({ hasText: /revenue/i });
   59 |             if (await revenueCard.isVisible()) {
   60 |                 await expect(revenueCard).toBeVisible();
   61 |             }
   62 |         }
   63 |     });
   64 |
   65 |     test('should filter orders by status', async ({ page }) => {
   66 |         const statusFilter = page.locator('select').first();
   67 |
   68 |         if (await statusFilter.isVisible()) {
   69 |             // Test different status filters
   70 |             const options = await statusFilter.locator('option').allTextContents();
   71 |
   72 |             for (let i = 1; i < Math.min(options.length, 4); i++) {
   73 |                 await statusFilter.selectOption({ index: i });
   74 |                 await page.waitForLoadState('networkidle');
   75 |                 await page.waitForTimeout(500);
   76 |             }
   77 |
   78 |             // Reset to "All"
   79 |             await statusFilter.selectOption({ index: 0 });
   80 |             await page.waitForLoadState('networkidle');
   81 |         }
   82 |     });
   83 |
   84 |     test('should search orders', async ({ page }) => {
   85 |         const searchInput = page.locator('input[placeholder*="Search"]');
   86 |
   87 |         if (await searchInput.isVisible()) {
   88 |             // Search for order number or customer
   89 |             await searchInput.fill('test');
   90 |             await page.waitForTimeout(500); // Wait for debounced search
   91 |             await page.waitForLoadState('networkidle');
   92 |
   93 |             // Clear search
   94 |             await searchInput.clear();
   95 |             await page.waitForTimeout(500);
   96 |             await page.waitForLoadState('networkidle');
   97 |         }
   98 |     });
   99 |
  100 |     test('should view order details', async ({ page }) => {
  101 |         // Look for order detail links or buttons
  102 |         const orderLink = page.locator('a[href*="/admin/orders/"], button').filter({ hasText: /view|details|#/i }).first();
  103 |
  104 |         if (await orderLink.isVisible()) {
  105 |             await orderLink.click();
  106 |
  107 |             // Should be on order detail page
  108 |             await expect(page.locator('h1')).toContainText(/Order|#/);
  109 |
  110 |             // Check for order information sections
  111 |             const orderInfo = page.locator('.card, .bg-white').filter({ hasText: /order.*info|customer|items/i });
  112 |             if (await orderInfo.count() > 0) {
```