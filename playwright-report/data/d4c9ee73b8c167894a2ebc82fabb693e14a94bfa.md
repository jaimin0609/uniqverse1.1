# Test info

- Name: Admin Dashboard >> should handle admin authentication requirement
- Location: C:\Users\James\Desktop\uniqverse-v1\e2e\admin-dashboard.spec.ts:98:9

# Error details

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('[name="password"]')
    - locator resolved to <input id="password" type="password" name="password" autocomplete="current-password" class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"/>
    - fill("6941@Sjp")
  - attempting fill action
    - waiting for element to be visible, enabled and editable

    at C:\Users\James\Desktop\uniqverse-v1\e2e\admin-dashboard.spec.ts:8:20
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
  - textbox "Email address": jaimin0609@gmail.com
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
   3 | test.describe('Admin Dashboard', () => {
   4 |     test.beforeEach(async ({ page }) => {
   5 |         // Login as admin user first
   6 |         await page.goto('/auth/login');
   7 |         await page.fill('[name="email"]', 'jaimin0609@gmail.com');
>  8 |         await page.fill('[name="password"]', '6941@Sjp');
     |                    ^ Error: page.fill: Test timeout of 30000ms exceeded.
   9 |         await page.click('button[type="submit"]');
   10 |
   11 |         // Wait for successful login and redirect
   12 |         await page.waitForURL('/', { timeout: 10000 });
   13 |
   14 |         // Navigate to admin dashboard
   15 |         await page.goto('/admin');
   16 |         await page.waitForLoadState('networkidle');
   17 |     });
   18 |
   19 |     test('should display admin dashboard with key metrics', async ({ page }) => {
   20 |         // Check page title
   21 |         await expect(page).toHaveTitle(/Admin Dashboard/);
   22 |
   23 |         // Check main dashboard elements are visible
   24 |         await expect(page.locator('h1')).toContainText('Dashboard');
   25 |
   26 |         // Check metric cards are present
   27 |         await expect(page.locator('[data-testid="total-sales"]')).toBeVisible();
   28 |         await expect(page.locator('[data-testid="total-orders"]')).toBeVisible();
   29 |         await expect(page.locator('[data-testid="total-products"]')).toBeVisible();
   30 |         await expect(page.locator('[data-testid="total-users"]')).toBeVisible();
   31 |
   32 |         // Check that metric values are displayed (should be numbers)
   33 |         const salesMetric = page.locator('[data-testid="total-sales"] .text-2xl');
   34 |         await expect(salesMetric).toBeVisible();
   35 |
   36 |         const ordersMetric = page.locator('[data-testid="total-orders"] .text-2xl');
   37 |         await expect(ordersMetric).toBeVisible();
   38 |     });
   39 |
   40 |     test('should display recent orders section', async ({ page }) => {
   41 |         // Check recent orders section
   42 |         await expect(page.locator('h2').filter({ hasText: 'Recent Orders' })).toBeVisible();
   43 |
   44 |         // Check "View All Orders" link
   45 |         await expect(page.locator('a[href="/admin/orders"]')).toBeVisible();
   46 |
   47 |         // Check if orders are displayed or "No recent orders" message
   48 |         const ordersSection = page.locator('.space-y-3');
   49 |         await expect(ordersSection).toBeVisible();
   50 |     });
   51 |
   52 |     test('should display low stock alerts', async ({ page }) => {
   53 |         // Check low stock section
   54 |         await expect(page.locator('h2').filter({ hasText: 'Low Stock Alert' })).toBeVisible();
   55 |
   56 |         // Check "Manage Inventory" link
   57 |         await expect(page.locator('a[href="/admin/products"]')).toBeVisible();
   58 |     });
   59 |
   60 |     test('should navigate to different admin sections', async ({ page }) => {
   61 |         // Test navigation to products
   62 |         await page.click('a[href="/admin/products"]');
   63 |         await page.waitForURL('/admin/products');
   64 |         await expect(page).toHaveURL('/admin/products');
   65 |
   66 |         // Go back to dashboard
   67 |         await page.goto('/admin');
   68 |
   69 |         // Test navigation to orders
   70 |         await page.click('a[href="/admin/orders"]');
   71 |         await page.waitForURL('/admin/orders');
   72 |         await expect(page).toHaveURL('/admin/orders');
   73 |     });
   74 |
   75 |     test('should handle date range filtering', async ({ page }) => {
   76 |         // Look for date range selector if present
   77 |         const dateRangeSelector = page.locator('select').filter({ hasText: /7 days|30 days|90 days/ });
   78 |
   79 |         if (await dateRangeSelector.isVisible()) {
   80 |             // Test different date ranges
   81 |             await dateRangeSelector.selectOption('30');
   82 |             await page.waitForTimeout(1000); // Wait for metrics to update
   83 |
   84 |             await dateRangeSelector.selectOption('90');
   85 |             await page.waitForTimeout(1000);
   86 |         }
   87 |     });
   88 |
   89 |     test('should display growth rate indicators', async ({ page }) => {
   90 |         // Check for growth rate indicators if present
   91 |         const growthIndicators = page.locator('.text-green-600, .text-red-600, .text-gray-600');
   92 |
   93 |         if (await growthIndicators.count() > 0) {
   94 |             await expect(growthIndicators.first()).toBeVisible();
   95 |         }
   96 |     });
   97 |
   98 |     test('should handle admin authentication requirement', async ({ page }) => {
   99 |         // Test that non-admin users can't access admin dashboard
  100 |         // First logout
  101 |         await page.goto('/api/auth/signout');
  102 |         await page.click('button[type="submit"]'); // Confirm signout
  103 |
  104 |         // Try to access admin dashboard
  105 |         await page.goto('/admin');
  106 |
  107 |         // Should redirect to login or show unauthorized
  108 |         await expect(page).not.toHaveURL('/admin');
```