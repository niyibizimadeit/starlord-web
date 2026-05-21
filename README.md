# StarlordGroup Web - starlordgroup.rw(live site)

## 🌟 Project Overview

**StarlordGroup.rw** is a live, production e-commerce platform built for simplicity, cleanliness, efficiency, and effectiveness. Deployed on [Vercel](https://vercel.com) and powered by [Supabase](https://supabase.com), it serves real users in Rwanda with a fully functional online store including product browsing, cart, checkout, order tracking, user accounts, and a comprehensive admin dashboard.

The entire philosophy behind StarlordGroup is **minimalism with maximum impact**:
- **Simplicity**: Intuitive UI/UX, no bloat.
- **Cleanliness**: Well-organized code, TypeScript everywhere, TailwindCSS for styling.
- **Efficiency**: Optimized Next.js App Router, server-side rendering, fast API routes.
- **Effectiveness**: Real-world features like OTP auth, order management, reviews – battle-tested with actual users.

Live site: [starlordgroup.rw](https://starlordgroup.rw)

## 🚀 Key Features

### User-Facing:
- Browse products/categories with grid view, image gallery, variation selector.
- Shopping cart with persistence (CartContext).
- Checkout & orders with tracking/returns.
- User accounts: Login/register (email/OTP), profile, addresses, order history.
- Product reviews & ratings.
- Contact/FAQ/Terms pages.
- WhatsApp widget for support.

### Admin Dashboard:
- Authentication & middleware protection.
- Dashboard analytics.
- Product/Category/Banner management (CRUD, image upload).
- Order management (view/update status).
- Review moderation.
- File uploads to Supabase Storage.

### Note on Payments:
Payment integration API is a work-in-progress. Currently, all payments are handled **manually**. IremboPay webhook (`/api/webhooks/irembopay`) is set up, and full integration is being developed.

## 🏗️ Tech Stack & Architecture

- **Frontend**: Next.js 14+ (App Router), React 19, TypeScript, TailwindCSS 4 (via PostCSS).
- **Backend/DB**: Supabase (Postgres DB, Auth, Storage, Realtime).
  - SSR clients (`@supabase/ssr`).
  - Server actions/API routes for all ops.
- **Styling**: TailwindCSS + module CSS (e.g., ProductGrid.module.css).
- **Payments**: IremboPay (webhook-ready).
- **Analytics**: Vercel Analytics & Speed Insights.
- **Security**: Custom headers (HSTS, XFO, etc.), Supabase RLS, middleware.
- **Images**: Optimized via next.config.ts for Supabase Storage (`zphpfahgyerabtpvtwol.supabase.co`).
- **Other**: ESLint, jose (JWT), sanitize-html.

**Architecture Flow**:
1. User interacts → App Router pages/components.
2. Auth checks → Supabase server/browser clients.
3. Data ops → API routes (`/api/products`, `/api/orders`, etc.) → Supabase queries.
4. Admin → Protected layouts/middleware.
5. Webhooks → Payment confirmations.

## 📁 Folder Structure & Descriptions

```
to be updated
```

## 🛠️ Getting Started (Local Development)

### Prerequisites
- Node.js 20+
- Supabase project (free tier OK): Get URL, ANON_KEY, SERVICE_ROLE_KEY.

### 1. Clone & Install
```bash
git clone <repo>
cd starlord-web
npm install
```

### 2. Environment Variables
Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# Optional: NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Run Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

### Scripts
- `npm run dev` - Development
- `npm run build` - Production build
- `npm run start` - Production server
- `npm run lint` - Lint code

## ☁️ Deployment

Hosted on **Vercel** (seamless for Next.js):
1. Push to GitHub.
2. Connect repo in Vercel dashboard.
3. Add env vars (Supabase keys).
4. Deploy! Auto-builds on push.

**Custom Domain**: starlordgroup.rw already live.

**Production Config**:
- Set `NEXT_PUBLIC_SITE_URL=https://starlordgroup.rw`
- Supabase Edge Functions if needed for complex logic.

## 🔒 Environment Variables Reference
| Key | Description | Required |
|-----|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (bypass RLS) | Yes (admin/server ops) |
| `NEXT_PUBLIC_SITE_URL` | Site base URL | Prod |

## 🤝 Contributing
1. Fork & PR.
2. Follow TypeScript/Tailwind/ESLint standards.
3. Test API routes with Supabase seed data.

## 📄 License
MIT

## 🙌 Acknowledgments
- [Next.js](https://nextjs.org)
- [Supabase](https://supabase.com)
- [Vercel](https://vercel.com)
- [TailwindCSS](https://tailwindcss.com)

---

*Built with simplicity in mind. Efficient. Effective. Clean.*
