# StarlordGroup Web - Complete Developer Onboarding Guide

## 🎯 Quick Start (TL;DR)
This is the **definitive guide** for any new developer joining StarlordGroup. Read [README.md](README.md) first for high-level overview. This doc dives deep into setup, architecture, workflows, and everything else.

**Live Site**: [starlordgroup.rw](https://starlordgroup.rw) (Vercel-hosted, production-ready e-commerce).

### Clone & Run (5 mins)
```bash
git clone <repo> starlord-web
cd starlord-web
npm install
# Create .env.local with Supabase keys (see below)
npm run dev
```
Open http://localhost:3000.

---

## 🏗️ Project Deep Dive

### Tech Stack
| Layer | Tech | Notes |
|-------|------|-------|
| **Framework** | Next.js 14+ (App Router) | SSR/SSG/API routes, React 19, TypeScript strict. |
| **DB/Auth/Storage** | Supabase | Postgres, RLS, OTP/email auth, Storage for images/uploads. |
| **Styling** | TailwindCSS 4 (PostCSS) + module CSS | Utility-first, custom components (e.g., ProductGrid.module.css). |
| **Payments** | IremboPay (webhook) | WIP; manual processing now. `/api/webhooks/irembopay`. |
| **Linting** | ESLint (Next.js config) | Web vitals + TS rules. |
| **Deployment** | Vercel | Auto-deploys from GitHub, env vars required. |
| **Other** | jose (JWT), sanitize-html, Vercel Analytics/Speed Insights | Security-focused (next.config.ts headers). |

**Key Configs**:
- `next.config.ts`: Supabase image domains, security headers (HSTS, XFO, CSP).
- `tsconfig.json`: Paths `@/*`, strict mode, includes `.js` files in app/.
- `postcss.config.mjs`: Tailwind plugin.
- `eslint.config.mjs`: Next.js vitals/TS.

### Folder Structure (Full Map)
```
starlord-web/
├── app/                          # Next.js App Router pages/API
│   ├── (auth)/                   # Auth pages: login/register/forgot-password
│   ├── about/contact/faq/terms/  # Static pages
│   ├── account/                  # User dashboard: profile/addresses/orders/returns
│   ├── admin/                    # Admin panel (protected): dashboard/products/categories etc.
│   │   ├── middleware.js         # Admin auth guard
│   │   └── AdminHelpers.js       # Admin utils
│   ├── cart/checkout/track/review/# User flows
│   ├── category/[slug]/          # Dynamic category pages
│   ├── products/[id]/            # PDP with variations/reviews
│   ├── api/                      # API Routes (Supabase backend)
│   │   ├── auth/*                # Login/register/OTP/reset
│   │   ├── products/categories/banners/# CRUD
│   │   ├── orders/checkout/reviews/# User ops
│   │   ├── admin/*               # Admin-only (analytics/upload)
│   │   └── webhooks/irembopay/   # Payment callbacks
│   ├── globals.css               # Tailwind base
│   ├── layout.js                 # Root layout (no auth)
│   ├── middleware.js             # Global middleware (admin checks?)
│   ├── page.js                   # Homepage
│   └── sitemap.xml/route.js      # Dynamic sitemap
├── components/                   # Reusable UI (Client/Server mix)
│   ├── CartContext.js            # Cart state (localStorage?)
│   ├── Header.js                 # Nav + cart indicator
│   ├── ProductGrid.js/css        # Product listing
│   ├── VariationSelector.js      # Product variants
│   ├── ImageGallery.js           # Product images zoom
│   ├── BannerSlider.js           # Homepage banners
│   ├── ProductReviews.js         # Reviews + ratings
│   ├── AddToCartButton.js        # ATC logic
│   ├── ThemeProvider.js          # CSS vars?
│   ├── WhatsAppWidget.js         # Support chat
│   ├── TrustBar.js               # Trust badges
│   └── ConditionalLayout.js      # Dynamic layouts
├── lib/supabase/                 # Supabase wrappers
│   ├── client.js                 # Browser (cookies)
│   └── server.js                 # Server (service role)
├── public/                       # Static assets (SVGs)
├── .env.local.example?           # (Add this)
├── package.json                  # Deps/scripts
├── next.config.ts                # Images/security
├── tailwind.config.ts?           # (Infer from PostCSS)
├── postcss.config.mjs
├── tsconfig.json
├── eslint.config.mjs
├── README.md                     # High-level
├── Todo.md                       # Tasks
└── Instructions.md               # ← You are here
```

**Data Flow**:
1. Pages → Components (e.g., page.js → ProductGrid → API fetch).
2. API routes → lib/supabase → Queries (RLS enforced).
3. Auth: Supabase SSR, middleware.js checks sessions.
4. Cart: Client-side Context (persists).
5. Admin: Separate layout/middleware, service role for mutations.

### Supabase Schema (Inferred from APIs)
- `products`: id, name, price, images[], variations, category_id, stock.
- `categories`: id, slug, name.
- `orders`: id, user_id, status, items[], tracking.
- `reviews`: product_id, user_id, rating, comment.
- `banners`: id, image, link.
- `user_addresses`, `profiles`.
**Seed**: Use Supabase SQL editor or admin uploads.

---

## 🚀 Setup (Detailed)

### 1. Prerequisites
- Node.js ≥20
- [Supabase Account](https://supabase.com) (free tier).
- Git.

### 2. Clone & Deps
```bash
git clone https://github.com/<user>/starlord-web.git  # Update URL
cd starlord-web
npm ci  # Clean install
```

### 3. Supabase Setup
1. Create project: `starlord-web-local`.
2. Settings → API: Copy URL, anon key, service role key.
3. Enable Email/OTP auth.
4. Storage bucket `images` public.
5. **RLS**: Enable on tables (policies in code).
6. Seed sample data via SQL:
```sql
-- Products, categories, etc. (use admin/products for prod)
```

**.env.local** (create, gitignore'd):
```
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Prod
NEXT_PUBLIC_SITE_URL=https://starlordgroup.rw
```

### 4. Run
```bash
npm run dev  # http://localhost:3000
npm run build && npm start  # Prod test
npm run lint  # Fix issues
```

**VSCode Tips**: Install Tailwind/ESLint/TS extensions. Open in Codespaces if remote.

---

## 🧪 Testing & Debugging
- **Manual**: Browse all pages, add to cart, admin login (create via /admin).
- **API**: Postman/curl to `/api/products`, test auth.
- **Supabase**: Dashboard → Table editor → Run queries.
- **Common Issues**:
  | Issue | Fix |
  |-------|-----|
  | Images broken | Check remotePatterns in next.config.ts |
  | Auth fails | Verify RLS policies, keys |
  | Tailwind missing | `npm run dev` rebuilds |
  | CORS | Vercel/Supabase settings |
  | Build fails | `npm run lint -- --fix` |

**Logs**: `npm run dev` console, Vercel dashboard.

---

## ☁️ Deployment (Vercel)
1. GitHub repo → Vercel import.
2. Add env vars (Prod Supabase keys).
3. Custom domain: starlordgroup.rw.
4. Auto-deploys on push/main.

**Prod Notes**:
- Service role key **never** client-side.
- Monitor Analytics/Speed Insights.
- Webhooks: IremboPay URL = `https://site.vercel.app/api/webhooks/irembopay`.

---

## 🔧 Development Workflow
1. **Feature Branch**: `git checkout -b feat/add-xyz`.
2. **Code Standards**:
   - TS everywhere, no `any`.
   - Tailwind: `className`, responsive/mobile-first.
   - Components: Server where possible (data fetch).
   - API: Validate inputs, RLS, error responses.
3. **PR**: Lint passes, test flows, update Todo.md.
4. **Commit**: Conventional: `feat: add reviews`, `fix: cart bug`.

**Admin Access**: `/admin` → Login with Supabase user.

---

## 📋 Todo.md Integration
Check [Todo.md](Todo.md) for pending tasks. Update as you complete.

---

## 🤝 Contributing
- Read this + README.
- Small PRs, describe changes.
- No breaking changes without discussion.

**Questions?** Check code comments, Supabase logs, or deploy your fork.

---

