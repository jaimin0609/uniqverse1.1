# Test info

- Name: Homepage and Navigation >> should open and close cart drawer
- Location: C:\Users\James\Desktop\uniqverse-v1\e2e\homepage.spec.ts:66:13

# Error details

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('header button[aria-label="Open shopping cart"]')
    - locator resolved to <button aria-label="Open shopping cart" class="jsx-d40326d9fc5a8254 relative p-2 text-gray-700 hover:text-blue-600 focus:outline-none">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <img loading="lazy" decoding="async" data-nimg="fill" alt="Green Sequined Sexy High Waist Fishtail Long Evening Dress" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw" class="object-cover group-hover:scale-105 transition-transform duration-300" src="/_next/image?url=https%3A%2F%2Fcf.cjdropshipping.com%2Fquick%2Fproduct%2Fb3a67d24-cb34-46e7-8799-f91109e4ce06.jpg&w=3840&q=75" srcset="/_next/image?url=https%3A%2F%2Fcf.cjdropshipping.com%2Fquick%2Fproduct%2Fb3a67d24-cb34-46e7-8799-f9110…/> from <main class="flex-grow">…</main> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <img loading="lazy" decoding="async" data-nimg="fill" alt="Green Sequined Sexy High Waist Fishtail Long Evening Dress" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw" class="object-cover group-hover:scale-105 transition-transform duration-300" src="/_next/image?url=https%3A%2F%2Fcf.cjdropshipping.com%2Fquick%2Fproduct%2Fb3a67d24-cb34-46e7-8799-f91109e4ce06.jpg&w=3840&q=75" srcset="/_next/image?url=https%3A%2F%2Fcf.cjdropshipping.com%2Fquick%2Fproduct%2Fb3a67d24-cb34-46e7-8799-f9110…/> from <main class="flex-grow">…</main> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    41 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <img loading="lazy" decoding="async" data-nimg="fill" alt="Green Sequined Sexy High Waist Fishtail Long Evening Dress" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw" class="object-cover group-hover:scale-105 transition-transform duration-300" src="/_next/image?url=https%3A%2F%2Fcf.cjdropshipping.com%2Fquick%2Fproduct%2Fb3a67d24-cb34-46e7-8799-f91109e4ce06.jpg&w=3840&q=75" srcset="/_next/image?url=https%3A%2F%2Fcf.cjdropshipping.com%2Fquick%2Fproduct%2Fb3a67d24-cb34-46e7-8799-f9110…/> from <main class="flex-grow">…</main> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed

    at C:\Users\James\Desktop\uniqverse-v1\e2e\homepage.spec.ts:70:26
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
  - main:
    - heading "Discover Unique Products for Your Lifestyle" [level=1]
    - paragraph: Custom-designed products that reflect your personality, delivered right to your door.
    - link "Start Shopping":
      - /url: /shop
    - link "Browse Categories":
      - /url: /categories
    - img "Featured products collection"
    - text: Loading events...
    - heading "Why Choose UniQVerse?" [level=2]
    - heading "Quality Products" [level=3]
    - paragraph: We partner with the best suppliers to ensure premium quality for all our products.
    - heading "Fast Delivery" [level=3]
    - paragraph: Most orders ship within 24 hours and arrive at your doorstep in 3-5 business days.
    - heading "Secure Shopping" [level=3]
    - paragraph: Your payments and personal information are always protected with our secure checkout.
    - heading "Featured Products" [level=2]
    - link "Retro Creative Snake Chain Anklet Four-piece Set Add to wishlist Add to cart":
      - /url: /products/retro-creative-snake-chain-anklet-four-piece-set
      - img "Retro Creative Snake Chain Anklet Four-piece Set"
      - button "Add to wishlist"
      - button "Add to cart"
    - link "Retro Creative Snake Chain Anklet Four-piece Set":
      - /url: /products/retro-creative-snake-chain-anklet-four-piece-set
      - heading "Retro Creative Snake Chain Anklet Four-piece Set" [level=3]
    - paragraph: Body Jewelry
    - paragraph: ...
    - link "Bow Love Five Break Flower Pearl Resin Drill Nail Accessories Add to wishlist Add to cart":
      - /url: /products/bow-love-five-break-flower-pearl-resin-drill-nail-accessories
      - img "Bow Love Five Break Flower Pearl Resin Drill Nail Accessories"
      - button "Add to wishlist"
      - button "Add to cart"
    - link "Bow Love Five Break Flower Pearl Resin Drill Nail Accessories":
      - /url: /products/bow-love-five-break-flower-pearl-resin-drill-nail-accessories
      - heading "Bow Love Five Break Flower Pearl Resin Drill Nail Accessories" [level=3]
    - paragraph: Body Jewelry
    - paragraph: ...
    - link "Printed Double-layer Composite Blanket Household Add to wishlist Add to cart":
      - /url: /products/printed-double-layer-composite-blanket-household
      - img "Printed Double-layer Composite Blanket Household"
      - button "Add to wishlist"
      - button "Add to cart"
    - link "Printed Double-layer Composite Blanket Household":
      - /url: /products/printed-double-layer-composite-blanket-household
      - heading "Printed Double-layer Composite Blanket Household" [level=3]
    - paragraph: Bedding Sets
    - paragraph: ...
    - link "High-end Entry Lux Mink Fur Blanket Double-sided Add to wishlist Add to cart":
      - /url: /products/high-end-entry-lux-mink-fur-blanket-double-sided
      - img "High-end Entry Lux Mink Fur Blanket Double-sided"
      - button "Add to wishlist"
      - button "Add to cart"
    - link "High-end Entry Lux Mink Fur Blanket Double-sided":
      - /url: /products/high-end-entry-lux-mink-fur-blanket-double-sided
      - heading "High-end Entry Lux Mink Fur Blanket Double-sided" [level=3]
    - paragraph: Bedding Sets
    - paragraph: ...
    - link "High-end Solid Color Bed Sheet Bamboo Fiber Summer Mat Add to wishlist Add to cart":
      - /url: /products/high-end-solid-color-bed-sheet-bamboo-fiber-summer-mat
      - img "High-end Solid Color Bed Sheet Bamboo Fiber Summer Mat"
      - button "Add to wishlist"
      - button "Add to cart"
    - link "High-end Solid Color Bed Sheet Bamboo Fiber Summer Mat":
      - /url: /products/high-end-solid-color-bed-sheet-bamboo-fiber-summer-mat
      - heading "High-end Solid Color Bed Sheet Bamboo Fiber Summer Mat" [level=3]
    - paragraph: Bedding Sets
    - paragraph: ...
    - link "Ladies Style White Dress Satin Surface Was Thin And High French Temperament Dress Long Skirt Add to wishlist Add to cart":
      - /url: /products/ladies-style-white-dress-satin-surface-was-thin-and-high-french-temperament-dress-long-skirt
      - img "Ladies Style White Dress Satin Surface Was Thin And High French Temperament Dress Long Skirt"
      - button "Add to wishlist"
      - button "Add to cart"
    - link "Ladies Style White Dress Satin Surface Was Thin And High French Temperament Dress Long Skirt":
      - /url: /products/ladies-style-white-dress-satin-surface-was-thin-and-high-french-temperament-dress-long-skirt
      - heading "Ladies Style White Dress Satin Surface Was Thin And High French Temperament Dress Long Skirt" [level=3]
    - paragraph: Wedding & Events
    - paragraph: ...
    - link "Top Short Skirt Three-dimensional Flower Pettiskirt French Cross-border Dress Add to wishlist Add to cart":
      - /url: /products/top-short-skirt-three-dimensional-flower-pettiskirt-french-cross-border-dress
      - img "Top Short Skirt Three-dimensional Flower Pettiskirt French Cross-border Dress"
      - button "Add to wishlist"
      - button "Add to cart"
    - link "Top Short Skirt Three-dimensional Flower Pettiskirt French Cross-border Dress":
      - /url: /products/top-short-skirt-three-dimensional-flower-pettiskirt-french-cross-border-dress
      - heading "Top Short Skirt Three-dimensional Flower Pettiskirt French Cross-border Dress" [level=3]
    - paragraph: For Her
    - paragraph: ...
    - link "Green Sequined Sexy High Waist Fishtail Long Evening Dress Add to wishlist Add to cart":
      - /url: /products/green-sequined-sexy-high-waist-fishtail-long-evening-dress
      - img "Green Sequined Sexy High Waist Fishtail Long Evening Dress"
      - button "Add to wishlist"
      - button "Add to cart"
    - link "Green Sequined Sexy High Waist Fishtail Long Evening Dress":
      - /url: /products/green-sequined-sexy-high-waist-fishtail-long-evening-dress
      - heading "Green Sequined Sexy High Waist Fishtail Long Evening Dress" [level=3]
    - paragraph: Wedding & Events
    - paragraph: ...
    - heading "Stay Updated" [level=2]
    - paragraph: Subscribe to our newsletter for exclusive deals, new product announcements, and more.
    - textbox "Enter your email"
    - button "Subscribe" [disabled]
  - heading "UniQVerse" [level=3]
  - paragraph: Custom-designed products that reflect your unique personality.
  - heading "Shop" [level=3]
  - list:
    - listitem:
      - link "All Products":
        - /url: /shop
    - listitem:
      - link "Featured":
        - /url: /shop/featured
    - listitem:
      - link "New Arrivals":
        - /url: /shop/new
    - listitem:
      - link "Sale":
        - /url: /shop/sale
  - heading "Support" [level=3]
  - list:
    - listitem:
      - link "Help Center":
        - /url: /help
    - listitem:
      - link "Shipping Info":
        - /url: /shipping
    - listitem:
      - link "Returns & Exchanges":
        - /url: /returns
    - listitem:
      - link "Contact Us":
        - /url: /contact
  - heading "Stay Connected" [level=3]
  - paragraph: Subscribe to get special offers, free giveaways, and exclusive deals.
  - textbox "Enter your email"
  - button "Subscribe" [disabled]
  - heading "Company" [level=4]
  - list:
    - listitem:
      - link "About Us":
        - /url: /about
    - listitem:
      - link "Careers":
        - /url: /careers
    - listitem:
      - link "Blog":
        - /url: /blog
    - listitem:
      - link "Affiliate Program":
        - /url: /affiliates
  - heading "Legal" [level=4]
  - list:
    - listitem:
      - link "Privacy Policy":
        - /url: /privacy
    - listitem:
      - link "Terms of Service":
        - /url: /terms
    - listitem:
      - link "Return Policy":
        - /url: /returns
    - listitem:
      - link "Shipping Policy":
        - /url: /shipping
  - paragraph: © 2025 UniQVerse. All rights reserved.
  - text: Made with ❤️ for unique individuals
- contentinfo:
  - paragraph: © 2025 UniQVerse. All rights reserved.
- region "Notifications alt+T"
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test.describe('Homepage and Navigation', () => {
   4 |     test('should load homepage successfully', async ({ page }) => {
   5 |         await page.goto('/');
   6 |
   7 |         // Check if the page title contains "UniQVerse"
   8 |         await expect(page).toHaveTitle(/UniQVerse/);        // Check for main navigation elements (account for mobile hidden nav)
   9 |         const nav = page.locator('nav');
   10 |         if (await page.viewportSize() && page.viewportSize()!.width < 768) {
   11 |             // On mobile, nav might be hidden - check for mobile menu instead
   12 |             await expect(page.locator('button:has(svg[class*="lucide-menu"])')).toBeVisible();
   13 |         } else {
   14 |             await expect(nav).toBeVisible();
   15 |         }
   16 |
   17 |         // Check for hero section
   18 |         await expect(page.locator('h1')).toBeVisible();
   19 |
   20 |         // Check for featured products section
   21 |         await expect(page.getByText(/featured/i)).toBeVisible();
   22 |     }); test('should navigate to shop page', async ({ page }) => {
   23 |         await page.goto('/');
   24 |
   25 |         // Handle mobile navigation - open mobile menu first if needed
   26 |         const viewport = page.viewportSize();
   27 |         if (viewport && viewport.width < 768) {
   28 |             const mobileMenuButton = page.locator('button:has(svg[class*="lucide-menu"])');
   29 |             if (await mobileMenuButton.isVisible()) {
   30 |                 await mobileMenuButton.click();
   31 |                 await page.waitForTimeout(500);
   32 |             }
   33 |         }
   34 |
   35 |         // Click on shop link in navigation - more specific selector
   36 |         const shopLink = page.locator('nav a[href="/shop"], a[href="/shop"]').first();
   37 |         await expect(shopLink).toBeVisible();
   38 |         await shopLink.click();
   39 |
   40 |         // Verify we're on the shop page
   41 |         await expect(page).toHaveURL(/\/shop/);
   42 |
   43 |         // Check for product listings or shop content
   44 |         await expect(page.locator('h1')).toBeVisible();
   45 |     }); test('should search for products', async ({ page }) => {
   46 |         await page.goto('/');
   47 |
   48 |         // Click on search button to open search overlay - using svg with lucide class naming
   49 |         const searchButton = page.locator('button:has(svg[class*="lucide-search"])');
   50 |         await expect(searchButton).toBeVisible();
   51 |         await searchButton.click();
   52 |
   53 |         // Look for search input in the overlay - more specific selectors
   54 |         const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[aria-label*="search" i]');
   55 |         await expect(searchInput).toBeVisible();
   56 |
   57 |         // Search for a product
   58 |         await searchInput.fill('test');
   59 |         await searchInput.press('Enter');
   60 |
   61 |         // Wait for search results or navigation
   62 |         await page.waitForLoadState('networkidle');
   63 |
   64 |         // Verify we're on a search results page or have results
   65 |         await expect(page).toHaveURL(/search|shop/);
   66 |     }); test('should open and close cart drawer', async ({ page }) => {
   67 |         await page.goto('/');        // Click on cart button (ShoppingCart icon) - using more specific header selector
   68 |         const cartButton = page.locator('header button[aria-label="Open shopping cart"]');
   69 |         await expect(cartButton).toBeVisible();
>  70 |         await cartButton.click();
      |                          ^ Error: locator.click: Test timeout of 30000ms exceeded.
   71 |
   72 |         // Verify cart drawer/modal opens - check for common cart drawer patterns
   73 |         await expect(page.locator('[role="dialog"], .cart-drawer, [data-testid="cart-drawer"]')).toBeVisible();
   74 |
   75 |         // Close cart drawer by clicking outside or escape
   76 |         await page.keyboard.press('Escape');
   77 |
   78 |         // Verify cart drawer closes
   79 |         await expect(page.locator('[role="dialog"], .cart-drawer, [data-testid="cart-drawer"]')).not.toBeVisible();
   80 |     });
   81 |
   82 |     test('should navigate to different categories', async ({ page }) => {
   83 |         await page.goto('/');        // Check if categories navigation exists - target visible navigation
   84 |         const categoriesNav = page.locator('nav:visible, [data-testid="categories"]:visible');
   85 |
   86 |         // For mobile, we might need to open the mobile menu first
   87 |         const mobileMenuButton = page.locator('button:has(svg.lucide-menu)');
   88 |         if (await mobileMenuButton.isVisible()) {
   89 |             await mobileMenuButton.click();
   90 |             await page.waitForTimeout(500); // Wait for menu to open
   91 |         }
   92 |
   93 |         await expect(categoriesNav).toBeVisible();
   94 |
   95 |         // Try to click on a category if available
   96 |         const categoryLink = page.locator('a[href*="/category"], a[href*="/shop"]').first();
   97 |         if (await categoryLink.isVisible()) {
   98 |             await categoryLink.click();
   99 |
  100 |             // Verify navigation worked
  101 |             await expect(page).toHaveURL(/\/shop|\/category/);
  102 |         }
  103 |     }); test('should have responsive navigation on mobile', async ({ page }) => {
  104 |         // Set mobile viewport
  105 |         await page.setViewportSize({ width: 375, height: 667 });
  106 |         await page.goto('/');
  107 |
  108 |         // Check for mobile navigation trigger (hamburger menu) - using more specific selector
  109 |         const mobileMenuTrigger = page.locator('button:has(svg[class*="lucide-menu"]), button[aria-label*="menu" i]');
  110 |         await expect(mobileMenuTrigger).toBeVisible();
  111 |
  112 |         await mobileMenuTrigger.click();
  113 |
  114 |         // Verify mobile menu opens (navigation links should be visible)
  115 |         // Wait for menu animation
  116 |         await page.waitForTimeout(500);
  117 |
  118 |         // Check for navigation links or menu content
  119 |         const menuContent = page.locator('nav a[href="/shop"], a[href="/about"], [role="navigation"]');
  120 |         await expect(menuContent.first()).toBeVisible();
  121 |     });
  122 | });
  123 |
```