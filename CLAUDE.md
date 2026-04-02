# crazy4points — Project Reference

## Stack
- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4 (no config file — tokens defined in `styles/globals.css` via `@theme inline`)
- Fonts loaded via `next/font/google` in `lib/fonts.ts`
- Deployed on Vercel, connected to `jillyz250/crazy4points_V2` on GitHub
- Live at: https://crazy4points.com

## Folder Structure
- `app/` — root layout + metadata in `app/layout.tsx`; pages live under `app/(site)/`
- `components/` — organized by section: `layout/`, `home/`, `destinations/`, `legal/`
- `lib/fonts.ts` — font definitions (Playfair Display, Lato, Montserrat)
- `styles/globals.css` — all design tokens + global base styles
- `public/` — static assets

## Design System — "Royal Glow"

### Colors
| Token | Value | Usage |
|---|---|---|
| `--color-primary` | `#6B2D8F` | Headings, logo, links, primary buttons |
| `--color-primary-hover` | `#5A237A` | Primary button hover state |
| `--color-accent` | `#D4AF37` | Decision Engine button, highlights |
| `--color-background` | `#FFFFFF` | Page background |
| `--color-background-soft` | `#F8F5FB` | Section backgrounds, cards |
| `--color-text-primary` | `#1A1A1A` | Body text |
| `--color-text-secondary` | `#4A4A4A` | Secondary/muted text |
| `--color-border-soft` | `#E6DEEE` | Card borders, dividers |

Always reference colors via CSS variables, never hardcode hex values.

### Fonts
| Token | Font | Usage |
|---|---|---|
| `--font-display` | Playfair Display (serif) | All headings (h1–h6) |
| `--font-body` | Lato (sans-serif) | Body copy, paragraphs |
| `--font-ui` | Montserrat (sans-serif) | Nav, buttons, labels, UI elements |

Font variables are injected via `lib/fonts.ts` and applied to `<html>` in `app/layout.tsx`.

### Spacing & Radius
| Token | Value | Usage |
|---|---|---|
| `--spacing-section` | `5rem` | Major section padding (`rg-major-section`) |
| `--spacing-subsection` | `2.5rem` | Sub-section padding (`rg-sub-section`) |
| `--radius-ui` | `0.375rem` | Buttons, inputs |
| `--radius-card` | `0.75rem` | Cards |
| `--shadow-soft` | `0 2px 8px rgba(26,26,26,0.04)` | Card shadows |

### Utility Classes
| Class | Description |
|---|---|
| `.rg-container` | Max-width 80rem, centered, horizontal padding |
| `.rg-major-section` | Top/bottom padding for full sections |
| `.rg-sub-section` | Top/bottom padding for sub-sections |
| `.rg-btn-primary` | Filled purple button (Montserrat, white text) |
| `.rg-btn-secondary` | Outlined purple button, turns gold on hover |

Always use these classes for layout and buttons — do not invent new patterns.

## Key Rules
- Never hardcode colors, fonts, or spacing — always use the CSS tokens above
- All headings are Playfair Display and `--color-primary` purple by default (set in globals)
- Buttons use Montserrat via `--font-ui`
- New pages go under `app/(site)/` to inherit the site layout
- New components go in `components/` organized by section
- Do not add `output: 'export'` to `next.config.ts` — Vercel handles server rendering
