# STYVEX Design System & Storefront Architecture

This plan establishes the visual and UX foundation for the STYVEX storefront, conforming to the requirement of a premium, clean, mobile-first, and editorial-style design.

## User Review Required

- No database changes or migrations will be performed.
- All routing structures will be created as "stubs" to establish Information Architecture without building out complex functionality like checkout or payments.
- We will rely on Tailwind v4 CSS tokens and Radix/Shadcn primitives for UI consistency.

## Proposed Changes

### 1. Design Tokens & Global Styles

#### [MODIFY] [styles.css](file:///e:/styvex/src/styles.css)
- **Colors**: Refine the `oklch` color palette to be "premium editorial". Pure whites for backgrounds, deep charcoal/blacks for primary elements, and muted, sophisticated grays for borders and secondary text.
- **Typography**: Adjust base styles to ensure excellent whitespace and readability. We will leverage system sans-serif or the already configured fonts to keep it clean.
- **Radii**: Reduce rounded corners slightly to give a sharper, more editorial look.

### 2. Storefront Information Architecture (Routing)

To prepare the application structure, the following TanStack route files will be created as basic stubs. They will render a simple placeholder component wrapped in the main layout.

#### [NEW] [shop.tsx](file:///e:/styvex/src/routes/shop.tsx)
#### [NEW] [category.$slug.tsx](file:///e:/styvex/src/routes/category.$slug.tsx)
#### [NEW] [collection.$slug.tsx](file:///e:/styvex/src/routes/collection.$slug.tsx)
#### [NEW] [product.$slug.tsx](file:///e:/styvex/src/routes/product.$slug.tsx)
#### [NEW] [search.tsx](file:///e:/styvex/src/routes/search.tsx)
#### [NEW] [wishlist.tsx](file:///e:/styvex/src/routes/wishlist.tsx)
#### [NEW] [account.tsx](file:///e:/styvex/src/routes/account.tsx)
#### [NEW] [cart.tsx](file:///e:/styvex/src/routes/cart.tsx)
#### [NEW] [checkout.tsx](file:///e:/styvex/src/routes/checkout.tsx)

### 3. Core Storefront Components

#### [MODIFY] [site-header.tsx](file:///e:/styvex/src/components/site-header.tsx)
- Add a responsive, mobile-first navigation bar.
- Add desktop navigation links: Shop, Categories, New Arrivals, Trending.
- Add utility icons (using `lucide-react`): Search, User (Account), Heart (Wishlist), ShoppingBag (Cart).
- Wrap mobile links in a Shadcn `Sheet` (Drawer) component.

#### [MODIFY] [site-footer.tsx](file:///e:/styvex/src/components/site-footer.tsx)
- Restructure into a standard multi-column e-commerce footer.
- Add Newsletter signup section (UI only).
- Add links columns (Shop, Support, Company, Legal).

#### [MODIFY] [product-card.tsx](file:///e:/styvex/src/components/ui/product-card.tsx)
- **Props**: Add `compareAtPrice` (for sales), `secondaryImageUrl`, `badges` (e.g., 'New', 'Sale'), and `isWishlisted`.
- **Hover State**: Support swapping to `secondaryImageUrl` on hover if provided.
- **UI Details**: Add a subtle wishlist heart icon overlay in the top right.
- Ensure the types map cleanly to the Supabase `Database["public"]["Tables"]["products"]["Row"]` where appropriate.

### 4. Home Page Structure

#### [MODIFY] [index.tsx](file:///e:/styvex/src/routes/index.tsx)
- Establish semantic HTML structural sections (Hero, Featured Categories, New Arrivals, Trending, Featured Collection, Editorial/Lifestyle, Trust/Service).
- Render real data in the "New Arrivals" block using the existing Supabase query, but leave the other sections as empty state placeholders waiting for future backend implementation.

## Verification Plan

### Automated Checks
- Ensure `bun run build` and TanStack router generation completes without TypeScript errors.
- Ensure `eslint` passes.

### Manual Verification
- Visual inspection of the UI tokens, responsive header, and structural homepage sections to confirm they look "premium, modern, and editorial".
- Verification that no hard-coded fake products exist and no backend logic has been altered.
