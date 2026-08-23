# DQA Master Test Plan

**Sequence No:** EYUVTE01  
**Date:** August 23, 2026  
**Project:** eYuvashop  

---

## Part 1: File Change Report

**Database & Types**
- `[NEW]` supabase/migrations/24_store_priority_and_section_rules.sql
- `[NEW]` supabase/migrations/25_labels_and_user_events.sql
- `[MOD]` src/types/database.ts

**Admin Portal (/admin)**
- `[NEW]` src/app/admin/banners/page.tsx, src/app/admin/labels/page.tsx, src/app/admin/users/[id]/page.tsx
- `[MOD]` src/components/admin/AdminLayout.tsx, src/app/admin/home-sections/page.tsx, src/app/admin/merchants/page.tsx, src/app/admin/products/page.tsx, src/app/admin/users/page.tsx

**Merchant Portal (/merchant)**
- `[MOD]` src/components/merchant/MerchantLayout.tsx, src/app/merchant/products/new/page.tsx, src/app/merchant/products/[id]/edit/page.tsx

**Customer Storefront & Global UI**
- `[NEW]` src/hooks/useUserTracking.ts, src/components/ui/ScrollableRow.tsx
- `[MOD]` src/app/page.tsx, src/components/customer/ProductCard.tsx, src/app/account/AccountLayoutClient.tsx, src/app/product/[slug]/page.tsx, src/app/store/[slug]/page.tsx

---

## Part 2: TVPM (Direct Fixes & Features Verification)
*These test cases verify the direct functionality of the newly implemented features.*

| Test Case | Description & Steps | Expected Result | Result (Pass/Fail) |
| :--- | :--- | :--- | :---: |
| **TC-PM-1.1** | **Set Merchant Priority:** In Admin > Merchants, click "Update Priority" on a store. Enter `100` and save. | Success message appears. Priority saves correctly. | [ ] |
| **TC-PM-1.2** | **Priority Propagation:** Go to Admin > Products. Find a product from the store in TC-PM-1.1. Click "Inspect/Rank". | The "Search Priority" input automatically shows `100`. | [ ] |
| **TC-PM-1.3** | **Front-End Sorting:** Visit the Customer Home Page and Category pages. | Products from the priority `100` store render at the absolute top of the lists. | [ ] |
| **TC-PM-1.4** | **Store Header Phone:** Visit a store's public page (`/store/[slug]`). | The store's phone number appears below the store name in the header. | [ ] |
| **TC-PM-2.1** | **Link Category:** In Admin > Home Sections, edit a section and select a category from the "Linked Category" dropdown. Save. | Section updates successfully in the database. | [ ] |
| **TC-PM-2.2** | **Verify Automation:** Visit the Customer Home Page. | The linked section automatically displays products from that specific category. | [ ] |
| **TC-PM-2.3** | **Merchant Badge Visibility:** Log in as Merchant. Go to Add Product. Select the linked category. | A blue "⭐ Auto-Featured" badge immediately appears below the dropdown. | [ ] |
| **TC-PM-3.1** | **Create Label:** In Admin > Labels, click "Create Label". Enter "Bestseller" and pick a color. Save. | Label is saved and appears in the table. | [ ] |
| **TC-PM-3.2** | **Assign Label:** In Admin > Products, click "Inspect/Rank" on a product. Click the "Bestseller" label to assign it. Save. | Label assignment saves. A small colored badge appears under the Product ID. | [ ] |
| **TC-PM-3.3** | **Storefront Rendering:** Visit the Customer Home Page and find the product from TC-PM-3.2. | The colored label overlays perfectly on the top-left corner of the product image. | [ ] |
| **TC-PM-4.1** | **Track Activity:** Browse 3 different products and perform 1 search on the storefront. | System silently logs the activity without UI disruption. | [ ] |
| **TC-PM-4.2** | **Personalization Rows:** Return to the Customer Home Page. | "Recently Viewed" and "Recommended For You" rows appear based on activity. | [ ] |
| **TC-PM-4.3** | **Admin Timeline:** In Admin > Users, click the "Eye" icon on your user account. | The timeline displays the 3 product views and 1 search query accurately. | [ ] |
| **TC-PM-5.1** | **Double Header Fix:** Go to the `/account` section. | Only one top navigation Header appears. | [ ] |
| **TC-PM-5.2** | **Scrollable Grids:** Visit the Customer Home Page and hover over a product row. | Grids span full width. Left/right arrow buttons appear to scroll horizontally. | [ ] |
| **TC-PM-5.3** | **View Portal (Impersonation):** In Admin > Merchants, click "View Portal" on a merchant row. | A new tab opens, logging you into that specific merchant's dashboard context. | [ ] |

---

## Part 3: TVPRD (Affected Modules & Regression Verification)
*These test cases ensure that surrounding affected modules and existing features did not break during the update.*

| Test Case | Description & Steps | Expected Result | Result (Pass/Fail) |
| :--- | :--- | :--- | :---: |
| **TC-PRD-1.1** | **Manual Sorting Override:** Go to a category page and change the sort dropdown to "Price: Low to High". | The manual sort correctly overrides the new Priority-based sorting. | [ ] |
| **TC-PRD-1.2** | **Pagination Logic:** Check the bottom of the products page and click through pages 2 and 3. | Pagination works correctly without skipping or duplicating products. | [ ] |
| **TC-PRD-2.1** | **Empty Categories:** View a linked Home Section where the category has 0 published products. | The Home Page handles it gracefully (hides section or shows empty state) without breaking. | [ ] |
| **TC-PRD-3.1** | **Mobile UX & Labels:** View the storefront on a mobile device and physically swipe the new product grids. | Swiping works perfectly. Custom labels do not overlap the product title or break image bounds. | [ ] |
| **TC-PRD-3.2** | **Trending Badge Fallback:** Find a product marked "Trending" that does not have any custom labels applied. | The system safely falls back to displaying the default hardcoded Trending badge. | [ ] |
| **TC-PRD-4.1** | **Anonymous Tracking Safety:** Log out (or open Incognito) and browse 3 products, then go to the Home Page. | "Recently Viewed" works via cookies and NO authentication crashes/errors are thrown. | [ ] |
| **TC-PRD-5.1** | **Merchant Login Security:** Log in normally as a standard Merchant. Type `?impersonate_merchant_id=...` into the URL. | The system rejects the impersonation attempt and keeps the merchant in their own store context. | [ ] |
