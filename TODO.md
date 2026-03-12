# TODO Progress: Arrange TrustBar to single line on homepage

## Plan Breakdown
1. [x] Create TODO.md with steps
2. [x] Edit app/page.js: Update TrustBar to single row grid with 4 columns
3. [x] Verify change doesn't break layout/icons/text (confirmed via diff: layout now single row grid, icons/text preserved)
4. [x] Test in browser (npm run dev)
## Follow-up: Add vertical separators

6. [x] Plan separators update
7. [x] Edit app/page.js to add short vertical borders between items (borderRight on first 3 items, height:20px centered)
8. [x] Verify styling (first 3 items have borderRight separator, height 20px centered, last item clean)
## Mobile Responsive Fix

10. [x] Plan mobile 2-lines with no end-border
11. [x] Update app/page.js TrustBar grid + className="trustbar-mobile"
12. [x] Add CSS media query to globals.css for mobile (repeat(2,1fr), remove border-right on even children via nth-child(2n))
13. [x] Verify responsive (@media max-767px: 2-col grid, desktop 4-col, no dangling border on line ends)

## Product Grid Desktop 4-per-line

14. [x] Plan ProductGrid desktop: fixed 4 columns perfect alignment
15. [x] Update app/globals.css .product-grid @media (min-width: 768px): repeat(4, 1fr)
16. [x] Verify 4 equal columns desktop, responsive mobile (grid repeat(4,1fr) desktop, 2-col mobile)

## Mobile ProductGrid Perfect 2-col

17. [x] Plan mobile 2 products/line perfect spacing
18. [x] Adjust app/globals.css mobile product-grid (gap:20px, padding:0 8px, min-height:380px cards)
19. [x] Verify perfect mobile styling

## Mobile BannerSlider: 2/3 height + swipe

20. [x] Plan mobile banner height 2/3 + touch swipe (360px ~2/3 of 540px)
21. [ ] Update components/BannerSlider.js (add touch swipe logic)
22. [x] Add app/globals.css mobile banner height (.banner-slider .banner-slide min-height 360px)
23. [ ] Verify swipe & height
