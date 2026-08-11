# Graph Report - starlord-web  (2026-07-14)

## Corpus Check
- 106 files · ~62,627 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 503 nodes · 755 edges · 58 communities (37 shown, 21 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `317141b4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- createServiceClient
- useCart
- dependencies
- server.js
- page.js
- Header.js
- compilerOptions
- AccountClient.js
- page.js
- route.js
- page.js
- route.js
- page.js
- dump-schema.mjs
- route.js
- route.js
- middleware.js
- route.js
- page.js
- page.js
- middleware.js
- route.js
- layout.js
- route.js
- route.js
- CategoryStrip.js
- page.js
- route.js
- route.js
- page.js
- TabButton.js
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs
- StarlordGroup Web - Complete Developer Onboarding Guide
- IremboPay Pre-Production Testing Checklist
- StarlordGroup Web - starlordgroup.rw(live site)
- route.js
- route.js
- route.js
- route.js
- route.js
- route.js
- route.js
- route.js
- route.js
- route.js
- route.js
- CLAUDE.md
- route.js

## God Nodes (most connected - your core abstractions)
1. `createServiceClient()` - 96 edges
2. `createServerSupabaseClient()` - 30 edges
3. `compilerOptions` - 16 edges
4. `useCart()` - 13 edges
5. `StarlordGroup Web - starlordgroup.rw(live site)` - 11 edges
6. `IremboPay Pre-Production Testing Checklist` - 10 edges
7. `AdminPage()` - 9 edges
8. `StarlordGroup Web - Complete Developer Onboarding Guide` - 9 edges
9. `formatRWF()` - 7 edges
10. `apiMutate()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `createServiceClient()`  [EXTRACTED]
  app/api/admin/banners/route.js → lib/supabase/server.js
- `GET()` --calls--> `createServiceClient()`  [EXTRACTED]
  app/api/reviews/route.js → lib/supabase/server.js
- `generateMetadata()` --calls--> `createServiceClient()`  [EXTRACTED]
  app/products/[id]/page.js → lib/supabase/server.js
- `AccountPage()` --calls--> `createServiceClient()`  [EXTRACTED]
  app/account/page.js → lib/supabase/server.js
- `printShippingLabel()` --references--> `qrcode`  [EXTRACTED]
  app/admin/AdminHelpers.js → package.json

## Import Cycles
- None detected.

## Communities (58 total, 21 thin omitted)

### Community 0 - "createServiceClient"
Cohesion: 0.13
Nodes (13): GET(), getAdminUser(), POST(), GET(), GET(), GET(), GET(), GET() (+5 more)

### Community 1 - "useCart"
Cohesion: 0.08
Nodes (28): CartPage(), formatRWF(), formatRWF(), metadata, OnSalePage(), formatRWF(), generateMetadata(), ProductPage() (+20 more)

### Community 2 - "dependencies"
Cohesion: 0.06
Nodes (34): browserslist, dependencies, @aws-sdk/client-s3, jose, next, qrcode, react, react-dom (+26 more)

### Community 3 - "server.js"
Cohesion: 0.10
Nodes (21): AccountPage(), DELETE(), getUser(), PATCH(), POST(), POST(), POST(), POST() (+13 more)

### Community 4 - "page.js"
Cohesion: 0.19
Nodes (25): adminLogin(), apiFetch(), apiMutate(), BarChart(), CategoryModal(), downloadCSV(), formatDate(), formatRWF() (+17 more)

### Community 5 - "Header.js"
Cohesion: 0.11
Nodes (11): lato, metadata, playfair, ConditionalLayout(), Header(), getInitialTheme(), ThemeContext, ThemeProvider() (+3 more)

### Community 6 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 7 - "AccountClient.js"
Cohesion: 0.20
Nodes (9): AddressesTab(), formatDate(), formatRWF(), inputStyle(), labelStyle, OrderCard(), ProfileTab(), SecurityTab() (+1 more)

### Community 8 - "page.js"
Cohesion: 0.23
Nodes (5): getNavCategories(), getProducts(), HomePage(), BannerSlider(), TrustBar()

### Community 9 - "route.js"
Cohesion: 0.31
Nodes (8): GET(), getPath(), POST(), proxyGet(), proxyWithBody(), PUT(), IMPORTANT: we open the client-facing stream RIGHT NOW and do all, NOTE: In Next.js 16, `params` is a Promise and MUST be awaited.

### Community 11 - "route.js"
Cohesion: 0.56
Nodes (8): checkAdminAuth(), DELETE(), GET(), log(), PATCH(), periodStart(), POST(), unauthorized()

### Community 12 - "page.js"
Cohesion: 0.25
Nodes (4): STATUS_COLORS, STATUS_LABELS, STATUS_STEPS, TrackingView()

### Community 13 - "dump-schema.mjs"
Cohesion: 0.32
Nodes (6): __dirname, getRowCount(), getTableSchema(), KNOWN_TABLES, main(), supabase

### Community 14 - "route.js"
Cohesion: 0.43
Nodes (6): getAdminUser(), PATCH(), TODO: Integrate with Africa's Talking, sendStatusSMS(), VALID_STATUSES, VALID_TRANSITIONS

### Community 15 - "route.js"
Cohesion: 0.48
Nodes (5): checkAdminAuth(), DELETE(), PATCH(), POST(), r2Client

### Community 16 - "middleware.js"
Cohesion: 0.38
Nodes (6): checkRateLimit(), config, getRateLimitConfig(), middleware(), RATE_LIMIT_CONFIG, rateLimitMap

### Community 17 - "route.js"
Cohesion: 0.40
Nodes (3): createAdminToken(), JWT_SECRET, POST()

### Community 19 - "page.js"
Cohesion: 0.40
Nodes (4): formatRWF(), STATUS_COLORS, STATUS_LABELS, TrackPageInner()

### Community 20 - "middleware.js"
Cohesion: 0.50
Nodes (4): config, isValidAdminToken(), JWT_SECRET, middleware()

### Community 21 - "route.js"
Cohesion: 0.60
Nodes (4): DELETE(), isAuthorized(), JWT_SECRET, PATCH()

### Community 41 - "StarlordGroup Web - Complete Developer Onboarding Guide"
Cohesion: 0.06
Nodes (28): 1. Prerequisites, 2. Clone & Deps, 3. Supabase Setup, 4. Run, Clone & Run (5 mins), 🤝 Contributing, ☁️ Deployment (Vercel), 🔧 Development Workflow (+20 more)

### Community 42 - "IremboPay Pre-Production Testing Checklist"
Cohesion: 0.11
Nodes (18): 1.1 Successful Payment, 1.2 Failed Payment, 1.3 Expired Payment, 1. MTN Mobile Money (Push Payment), 2.1 Successful Payment, 2.2 Failed Payment, 2. Airtel Money (Push Payment), 3.1 Successful Visa Payment (+10 more)

### Community 43 - "StarlordGroup Web - starlordgroup.rw(live site)"
Cohesion: 0.11
Nodes (19): 1. Clone & Install, 2. Environment Variables, 3. Run Dev Server, 🙌 Acknowledgments, Admin Dashboard:, 🤝 Contributing, ☁️ Deployment, 🔒 Environment Variables Reference (+11 more)

### Community 45 - "route.js"
Cohesion: 0.60
Nodes (5): checkAdmin(), DELETE(), GET(), PATCH(), POST()

### Community 46 - "route.js"
Cohesion: 0.53
Nodes (5): checkAdminAuth(), DELETE(), GET(), PATCH(), POST()

### Community 47 - "route.js"
Cohesion: 0.70
Nodes (4): DELETE(), GET(), getAdminUser(), PUT()

### Community 48 - "route.js"
Cohesion: 0.83
Nodes (3): GET(), getAuthenticatedUser(), PATCH()

### Community 49 - "route.js"
Cohesion: 0.83
Nodes (3): GET(), getAdminUser(), POST()

### Community 53 - "route.js"
Cohesion: 0.67
Nodes (3): CheckoutPage(), formatRWF(), IMPORTANT: we do NOT clearCart()/setStep(3) here anymore.

## Knowledge Gaps
- **135 isolated node(s):** `1.1 Successful Payment`, `1.2 Failed Payment`, `1.3 Expired Payment`, `2.1 Successful Payment`, `2.2 Failed Payment` (+130 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createServiceClient()` connect `createServiceClient` to `useCart`, `server.js`, `page.js`, `route.js`, `route.js`, `route.js`, `route.js`, `route.js`, `route.js`, `route.js`, `route.js`, `route.js`, `route.js`, `route.js`, `route.js`, `route.js`, `route.js`, `route.js`?**
  _High betweenness centrality (0.121) - this node is a cross-community bridge._
- **Why does `useCart()` connect `useCart` to `Header.js`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `createServerSupabaseClient()` connect `server.js` to `useCart`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `1.1 Successful Payment`, `1.2 Failed Payment`, `1.3 Expired Payment` to the rest of the system?**
  _143 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `createServiceClient` be split into smaller, more focused modules?**
  _Cohesion score 0.13438735177865613 - nodes in this community are weakly interconnected._
- **Should `useCart` be split into smaller, more focused modules?**
  _Cohesion score 0.08084163898117387 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._