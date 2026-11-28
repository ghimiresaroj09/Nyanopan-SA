# Nyanopan · Super Admin Dashboard

Super-admin dashboard for the Nyanopan ecommerce store — **React 18 + TypeScript + Vite**, organized in clean-architecture layers, talking to the live backend at `https://api.nyanopan.com`.

Theme: primary `#f7f4ea` (warm white) · secondary `#5c7d6c` (sage) · typeface **DM Sans** (self-hosted, `public/fonts/`).

## Business model

The **storefront** owns cart and checkout: checkout composes in the browser and **redirects to WhatsApp**. There is **no customer auth** and **no order/customer records** anywhere — so this admin never manages orders or customers. It manages everything the business controls server-side:

- **Catalog** — Categories, Attributes, Models, Products (3-step wizard: info → variants → images)
- **CMS** — Home Page (hero section, sections + collections), Configuration, Policies, Our Story & Sustainability (story / makers / sustainability)
- **Dashboard** — catalog KPIs + storefront content health
- **Account** — JWT session, change password (auto sign-out after change)

## Run it

```bash
npm install
npm run dev        # dev server on http://localhost:5173
npm run build      # type-check + production build to dist/
npm run preview    # serve the production build
```

`VITE_API_BASE` configures the backend base URL. `.env.production` sets it to `https://api.nyanopan.com`; `.env.example` documents the same value. Do not put secrets in Vite environment variables because they are embedded in the client build.

## Deploy to DirectAdmin

The production build is a static SPA intended for the root of `https://admin.nyanopan.com/`.

1. Run `npm install` and `npm run build`.
2. In DirectAdmin, open the document root configured for `admin.nyanopan.com`.
3. Upload the **contents** of `dist/` to that document root (not the `dist` directory itself).
4. Ensure the site is served over HTTPS. The app uses `HashRouter`, so client-side routes do not require server rewrite rules.

Vite's base path is `/`, so generated asset URLs are root-relative; do not deploy this build under a nested path.

## Deploy to Vercel

The app is a static SPA (hash routing) — Vercel-ready out of the box; `vercel.json` already pins framework, build command, output dir, SPA fallback and cache headers.

1. Push the repo to GitHub/GitLab/Bitbucket.
2. In Vercel: **Add New → Project**, import the repo. Vercel auto-detects Vite (`build: npm run build`, output `dist/`).
3. The committed `.env.production` configures `VITE_API_BASE` as `https://api.nyanopan.com`; set the same value in the hosting environment if overriding it.
4. Deploy. Every push to `main` redeploys; PRs get preview URLs.

Notes:

- Routing uses `HashRouter`, so deep links work on any static host even without rewrites.
- Images upload to Cloudinary via `POST /api/v1/admin/images/upload/`; the admin only stores returned URLs.
- Fonts and hashed assets are served with immutable cache headers (see `vercel.json`).

## Architecture

```
src/
├── domain/               # Pure business layer — no framework imports
│   ├── entities/         # product, catalog, policy, configuration,
│   │                     # story, homepage, analytics types
│   └── repositories.ts   # Repository contracts (ports)
│
├── data/                 # Adapters implementing the contracts
│   ├── api/
│   │   ├── client.ts     # fetch + JWT (Bearer, one refresh on 401),
│   │   │                 # envelope unwrap, readable error extraction
│   │   └── repositories.ts  # API-backed adapters for the configured backend
│   └── repositories.ts   # Composition root (`repositories` object)
│
├── application/          # Use-cases as reusable hooks
│   ├── auth/             # AuthProvider (boot /me, login/logout)
│   ├── hooks/            # useAsync, useTableState, useCrud, useDebounce…
│   └── toast/            # ToastProvider + useToast
│
├── presentation/         # React UI
│   ├── components/
│   │   ├── ui/           # Button, Card, Badge, Input, Select, Field, Switch,
│   │   │                 # Modal, StatCard, Avatar, Skeleton, PasswordInput…
│   │   ├── table/        # DataTable — generic table (SN, search, sort,
│   │   │                 # pagination, rows-per-page)
│   │   ├── charts/       # BarChart, DonutChart (pure SVG)
│   │   ├── cms/          # Shared section editors (image picker, rows)
│   │   └── layout/       # AppLayout, Sidebar, Topbar, PageHeader
│   └── pages/            # Dashboard, Catalog pages, CMS pages, Login
│
├── shared/               # sanitize (HTML allowlist), formatting, cn
└── styles/global.css     # Theme tokens (CSS variables) + all styles
```

### Dependency rule

`presentation → application → domain ← data`

Pages talk to hooks; hooks depend on repository **interfaces**; the API adapters in `data/` are the only place that knows URLs.

## Reusable pieces

- **`<DataTable<T> />`** — generic over the row type: continuous SN, debounced search, tri-state column sorting, pagination with rows-per-page selector, loading skeletons, empty states.
- **`useTableState`** — the search/sort/pagination engine behind the table.
- **`useAsync`** — promise lifecycle with stale-response protection + `reload()`.
- **`useCrud`** — list/create/update/delete with toast feedback.
- **Shared CMS editors** — file-only image picker (direct Cloudinary upload), section fields, ordered row list/modal; reused by Story, Sustainability and Home pages.
- **`PasswordInput`** — show/hide password field (login + change password).

## Feature map

- **Dashboard** — 8 live KPIs, category/gender/attribute charts, top models, and a storefront-content status panel with deep links to every CMS editor.
- **Catalog** — Categories (multipart incl. image), Attributes (value lists), Models, Products (3-step wizard: multipart info + feature image → variant palette & prices → per-value images; filters: category, gender, usage, sole, status, featured, price range).
- **CMS** — Home Page (hero section, 3 sections + collections), Configuration (company profile + socials), Policies (4 rich-text documents, sanitized), Our Story & Sustainability (story sections, makers with photo upload, sustainability sections).
- **Auth** — JWT login, boot profile refresh, account modal with change password (signs out and returns to login).



