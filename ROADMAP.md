# crazy4points — Project Roadmap

> Last updated: April 2026  
> Goal: Get the site live with real content, indexed by Google, and capturing subscribers — then automate the content machine.

---

## Phase 1 — Real Content (Do This First)
*Google can't index an empty site. Every published alert is a page that can rank.*

### 1. Publish Real Alerts ← START HERE
- The alert system is fully built and working (AI summary on publish is live)
- Start adding real bonus offers: signup bonuses, transfer bonuses, limited-time deals
- Target: 20–30 real alerts to start
- Every alert = its own SEO page at `/alerts/[slug]`

### 2. Homepage Pin Slots (Admin UI)
- The homepage shows 4 "Daily Alert" slots but there's no way to control which ones appear
- Need a simple admin UI to pin/choose the top 4 alerts to feature
- Estimated build time: ~1 hour
- **File to build:** `app/admin/(protected)/homepage/page.tsx`

### 3. Daily Brief Auto-Populates
- `/daily-brief` and `/daily-brief/[date]` already work — they just need real alerts
- Once alerts are published, this page updates automatically every day
- Free SEO page every single day with zero extra work

### 4. Programs Pages Populated
- `/programs/chase-ultimate-rewards`, `/programs/amex-membership-rewards`, etc. already exist
- They auto-populate once alerts are tagged to each program
- These "hub" pages are strong SEO targets — Google loves topical authority pages

---

## Phase 2 — Keep People Coming Back
*Turn one-time visitors into subscribers who come back daily.*

### 5. Newsletter Signup Form
- CTA section exists on homepage but has no real email capture
- Need a simple form: name + email → stored in Supabase `subscribers` table
- Use Resend for email delivery (simple API, free tier generous)
- **Files to build:** signup form component + `/api/subscribe` route + Supabase table

### 6. Email Delivery — Daily Brief
- Send the Daily Brief to subscribers every morning (~6am)
- Template: top 5 alerts of the day, links back to site
- Triggered by Claude Brief routine (Phase 3) or a simple cron job
- **Stack:** Resend API + Supabase subscribers table

### 7. Decision Engine — Actually Works
- The slot machine UI at `/decision-engine` is fully built with animations + filters
- The API currently returns empty results (destinations not in Supabase yet)
- Need to: seed destinations data + wire `/api/decision-engine` to real Supabase queries
- This is the most unique feature on the site — nothing else in travel rewards has it
- **Files to fix:** `app/api/decision-engine/route.ts` + destinations seed data

---

## Phase 3 — Automate the Content Machine
*So you're not manually adding alerts every day.*

### 8. Claude Scout Routine (4:30am)
- Scheduled job that scans configured sources for new bonus offers
- Sources: airline blogs, credit card news pages, Reddit r/churning, FlyerTalk, etc.
- Outputs raw findings to `intel` table in Supabase
- **Stack:** Vercel Cron + Claude Haiku + `sources` table + `intel` table

### 9. Claude Analyze Routine (5:00am)
- Takes Scout's raw findings and scores each one: value, urgency, relevance, uniqueness
- Filters out duplicates and low-quality hits
- Flags top picks for human review
- **Stack:** Vercel Cron + Claude Haiku + scoring logic

### 10. Admin Intel Queue (`/admin/intel`)
- A review page where you see Claude's findings each morning
- One-click approve → creates a draft alert ready to publish
- One-click reject → removes from queue
- **Files to build:** `app/admin/(protected)/intel/page.tsx` + approve/reject actions

### 11. Claude Brief Routine (5:15am)
- Composes the daily email brief from top approved alerts
- Queues it in Resend for 6am send
- Also updates the homepage pin slots automatically (optional)
- **Stack:** Vercel Cron + Claude Haiku + Resend

### 12. Add New Sources (`/admin/sources/new`)
- The sources page exists but the "Add Source" form is a placeholder
- Need the actual form to add URLs, source types, and scan frequency
- **File to build:** `app/admin/(protected)/sources/new/page.tsx`

---

## Phase 4 — Big Content Sections
*High SEO value but also high effort. Don't touch until Phase 1–3 are solid.*

### 13. Guides
- Long-form articles: "How to Use Chase Ultimate Rewards", "Best Ways to Redeem Amex Points"
- Strong SEO — people search for these constantly
- Need: guide data model in Supabase, `/guides/[slug]` pages, admin editor
- `FeaturedGuides` component on homepage already exists — just needs real data

### 14. Destinations (Full Build)
- `/destinations` is a placeholder page ("coming soon")
- Full build: destination cards, points costs, best redemption windows, weather data
- Decision Engine needs this data anyway (Phase 2 #7)
- Need: seed ~50 destinations in Supabase, `/destinations/[slug]` detail pages

### 15. Deals Section
- Slightly different from alerts — more like "Right now: Paris for 50k points on United"
- Time-sensitive, price-drop style content
- `FeaturedDeals` component on homepage exists — needs real data model + admin UI

---

## Infrastructure / Security (Do Before Launch)
- [ ] Change `ADMIN_PASSWORD` from `changeme` in `.env.local` + Vercel env vars
- [ ] Set up Google Search Console and submit sitemap (`/sitemap.xml` already built)
- [ ] Set up Vercel Analytics (free, already supported by Next.js)
- [ ] Add `robots.txt` if not already present
- [ ] PR merge: current work is on branch `claude/magical-lumiere` — needs merge to main

---

## Tech Stack Reference
- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Backend:** Supabase (PostgreSQL) — alerts, programs, sources, subscribers
- **AI:** Claude Haiku (`claude-haiku-4-5-20251001`) via Anthropic SDK — AI summaries
- **Email:** Resend (to be added)
- **Hosting:** Vercel — connected to `jillyz250/crazy4points_V2` on GitHub
- **Live site:** https://crazy4points.com
