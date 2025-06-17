# Test info

- Name: Admin Order Management >> should handle order notes
- Location: C:\Users\James\Desktop\uniqverse-v1\e2e\admin-orders.spec.ts:249:9

# Error details

```
Error: page.fill: Test ended.
Call log:
  - waiting for locator('[name="email"]')
    - locator resolved to <input id="email" type="email" name="email" autocomplete="email" class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"/>
    - fill("admin@uniqverse.com")
  - attempting fill action
    - waiting for element to be visible, enabled and editable

    at C:\Users\James\Desktop\uniqverse-v1\e2e\admin-orders.spec.ts:7:20
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test.describe('Admin Order Management', () => {
   4 |     test.beforeEach(async ({ page }) => {
   5 |         // Login as admin user
   6 |         await page.goto('/auth/login');
>  7 |         await page.fill('[name="email"]', 'admin@uniqverse.com');
     |                    ^ Error: page.fill: Test ended.
   8 |         await page.fill('[name="password"]', 'admin123');
   9 |         await page.click('button[type="submit"]');
   10 |
   11 |         // Wait for successful login and navigate to orders
   12 |         await page.waitForURL('/', { timeout: 10000 });
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
```