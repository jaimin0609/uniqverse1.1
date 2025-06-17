# Test info

- Name: Admin Product Management >> should delete a product
- Location: C:\Users\James\Desktop\uniqverse-v1\e2e\admin-products.spec.ts:139:9

# Error details

```
TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
=========================== logs ===========================
waiting for navigation to "/" until "load"
============================================================
    at C:\Users\James\Desktop\uniqverse-v1\e2e\admin-products.spec.ts:12:20
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
   3 | test.describe('Admin Product Management', () => {
   4 |     test.beforeEach(async ({ page }) => {
   5 |         // Login as admin user
   6 |         await page.goto('/auth/login');
   7 |         await page.fill('[name="email"]', 'admin@uniqverse.com');
   8 |         await page.fill('[name="password"]', 'admin123');
   9 |         await page.click('button[type="submit"]');
   10 |
   11 |         // Wait for successful login and navigate to products
>  12 |         await page.waitForURL('/', { timeout: 10000 });
      |                    ^ TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
   13 |         await page.goto('/admin/products');
   14 |         await page.waitForLoadState('networkidle');
   15 |     });
   16 |
   17 |     test('should display products page with search and filters', async ({ page }) => {
   18 |         // Check page elements
   19 |         await expect(page.locator('h1')).toContainText('Products');
   20 |
   21 |         // Check search functionality
   22 |         const searchInput = page.locator('input[placeholder*="Search"]');
   23 |         await expect(searchInput).toBeVisible();
   24 |
   25 |         // Check "Add Product" button
   26 |         await expect(page.locator('a[href="/admin/products/new"]')).toBeVisible();
   27 |
   28 |         // Check products table/grid
   29 |         const productsContainer = page.locator('table, .grid');
   30 |         await expect(productsContainer).toBeVisible();
   31 |     });
   32 |
   33 |     test('should search products', async ({ page }) => {
   34 |         const searchInput = page.locator('input[placeholder*="Search"]');
   35 |
   36 |         // Perform search
   37 |         await searchInput.fill('test');
   38 |         await page.waitForTimeout(500); // Wait for debounced search
   39 |
   40 |         // Check that search was performed (URL should contain search param or results should filter)
   41 |         await page.waitForLoadState('networkidle');
   42 |
   43 |         // Clear search
   44 |         await searchInput.clear();
   45 |         await page.waitForTimeout(500);
   46 |     });
   47 |
   48 |     test('should filter products by category', async ({ page }) => {
   49 |         // Look for category filter
   50 |         const categoryFilter = page.locator('select').first();
   51 |
   52 |         if (await categoryFilter.isVisible()) {
   53 |             // Get available options
   54 |             const options = await categoryFilter.locator('option').count();
   55 |
   56 |             if (options > 1) {
   57 |                 // Select first non-default option
   58 |                 await categoryFilter.selectOption({ index: 1 });
   59 |                 await page.waitForLoadState('networkidle');
   60 |             }
   61 |         }
   62 |     });
   63 |
   64 |     test('should navigate to add new product', async ({ page }) => {
   65 |         await page.click('a[href="/admin/products/new"]');
   66 |         await page.waitForURL('/admin/products/new');
   67 |
   68 |         // Check new product form is displayed
   69 |         await expect(page.locator('h1')).toContainText('Add Product');
   70 |         await expect(page.locator('form')).toBeVisible();
   71 |     });
   72 |
   73 |     test('should create a new product', async ({ page }) => {
   74 |         // Navigate to new product page
   75 |         await page.click('a[href="/admin/products/new"]');
   76 |         await page.waitForURL('/admin/products/new');
   77 |
   78 |         // Fill out product form
   79 |         await page.fill('[name="name"]', 'Test E2E Product');
   80 |         await page.fill('[name="description"]', 'This is a test product created by E2E tests');
   81 |         await page.fill('[name="price"]', '29.99');
   82 |         await page.fill('[name="inventory"]', '50');
   83 |
   84 |         // Select category if available
   85 |         const categorySelect = page.locator('select[name="categoryId"]');
   86 |         if (await categorySelect.isVisible()) {
   87 |             const options = await categorySelect.locator('option').count();
   88 |             if (options > 1) {
   89 |                 await categorySelect.selectOption({ index: 1 });
   90 |             }
   91 |         }
   92 |
   93 |         // Add image URL if there's an image input
   94 |         const imageInput = page.locator('input[type="url"]').first();
   95 |         if (await imageInput.isVisible()) {
   96 |             await imageInput.fill('https://via.placeholder.com/400x400');
   97 |         }
   98 |
   99 |         // Submit form
  100 |         await page.click('button[type="submit"]');
  101 |
  102 |         // Should redirect to products list or show success
  103 |         await page.waitForLoadState('networkidle');
  104 |
  105 |         // Check for success message or redirect
  106 |         const successMessage = page.locator('.toast, .alert').filter({ hasText: /success|created/i });
  107 |         if (await successMessage.isVisible()) {
  108 |             await expect(successMessage).toBeVisible();
  109 |         }
  110 |     });
  111 |
  112 |     test('should edit an existing product', async ({ page }) => {
```