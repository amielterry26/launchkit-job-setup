# AGENT HANDOFF — LaunchKit

> **Purpose:** Read this document first. It contains everything you need to continue work on this project as if no context was lost — the product, the design decisions, the infrastructure, the current state, and the next steps.

---

## What This Project Is

**LaunchKit** is a premium single-page static landing site for a personal job-search setup service. The owner is a systems-minded engineer who takes on clients and manually sets up their job-search infrastructure — resumes, LinkedIn profiles, job board accounts, templates, alerts. Clients pay a flat rate, fill out an intake form, and receive a polished deliverable package.

This is a **real, live, revenue-generating service site.** Not a demo.

---

## Owner Profile

- Systems-minded engineer — prefers clean, direct, no-hype design
- Has experience with AWS (CLI, S3, CloudFront)
- Values: calm, trustworthy, premium — not loud or salesy
- Wants practical, concise copy — no exaggerated promises
- Comfortable with technical decisions; trusts the agent to make good calls

---

## Live URLs

| Environment | URL |
|---|---|
| **CloudFront (production)** | `https://d2dy7uhnrh7039.cloudfront.net` |
| S3 origin (internal only) | `http://launchkit-job-setup-674981078226.s3-website-us-east-1.amazonaws.com` |
| GitHub repo | `https://github.com/amielterry26/launchkit-job-setup` |

**Active branch:** `claude`

---

## Infrastructure

| Resource | Detail |
|---|---|
| S3 Bucket | `launchkit-job-setup-674981078226` (us-east-1, static website hosting) |
| CloudFront Distribution ID | `E28Q7FUW2SGCW9` |
| Form backend | Formsubmit → `amielterry.dev@gmail.com` |
| Payment (pending) | Stripe Payment Links — see Stripe section below |

### Standard Deploy Command
Every deploy is one command — S3 sync + CloudFront cache invalidation:
```bash
aws s3 sync /Users/amielterry40/Desktop/Coding/git/apps/job_seeker/ s3://launchkit-job-setup-674981078226/ \
  --exclude ".git/*" --exclude ".claude/*" --exclude "*.DS_Store" --exclude ".gitignore" --delete \
&& aws cloudfront create-invalidation --distribution-id E28Q7FUW2SGCW9 --paths "/*"
```

**Warning:** Always include `--exclude ".claude/*"` — otherwise `settings.local.json` gets uploaded. If it ever sneaks in: `aws s3 rm s3://launchkit-job-setup-674981078226/.claude/settings.local.json`

---

## File Structure

```
/
├── index.html          # Single page — all sections live here
├── css/
│   └── styles.css      # All styles — design tokens at top, components below
├── js/
│   └── main.js         # All JS — vanilla, no frameworks
└── AGENT_HANDOFF.md    # This file
```

No build step. No framework. No dependencies. Pure HTML/CSS/JS.

---

## Design Language

### Palette
```css
--color-bg:             #FAF8F5;   /* soft cream base */
--color-surface:        #FFFFFF;   /* white cards */
--color-surface-alt:    #F3F0EA;   /* light warm cream — section rhythm */
--color-text-primary:   #0F0D0C;   /* near-black — headings and body */
--color-text-secondary: #0F0D0C;   /* same as primary — full black body text */
--color-text-tertiary:  #5A544E;   /* medium warm gray — supporting/meta */
--color-accent:         #DA7756;   /* Claude coral-orange — primary CTA color */
--color-accent-hover:   #C4654A;
--color-accent-mid:     #E8906A;
--color-accent-light:   #FDF0EB;
--color-border:         #E0D9CF;
```

### Rules
- **Font:** Inter — weights 400, 500, 600, 700
- **Orange** (`#DA7756`) is used for: primary CTA buttons, logo accent, eyebrow labels, active tab, feature list bullets, process step numbers, links in footer
- **Black** (`#0F0D0C`) is used for: all outline buttons (Light, Ultimate, Consult package cards), contact form border — gives visual contrast and premium feel
- **No loud colors, no hype copy, no gradients on text**
- Dark mode is fully implemented — both OS (`prefers-color-scheme`) and manual toggle (localStorage key `theme`)

### Typography hierarchy
- `h1` — 2.5–4rem, bold, near-black
- `h2` — semi-bold, near-black
- `h3` — 1.0625rem, semi-bold
- Body/`p` — near-black (we intentionally made secondary = primary for legibility after comparing to Claude.ai)
- Eyebrows (small caps labels above section titles) — orange, 0.6875rem

---

## Page Structure (in order, top to bottom)

1. **Nav** — Logo (left), nav links desktop only (center), theme toggle + Get Started CTA (right). No hamburger — floating pill nav handles mobile navigation.
2. **Hero** — Headline, subhead, two CTAs, hero chips. Orange radial glow at top.
3. **What's Included** (`#features`) — Tab carousel (Resume / Collateral / Profiles) with CSS mockups. Desktop: fade-switch panels. Mobile ≤600px: horizontal swipe carousel with dot indicators.
4. **How It Works** (`#process`) — Three step cards (01, 02, 03) with hover lift animation. White cards on cream background.
5. **Packages / Pricing** (`#packages`) — 4-column grid: Light ($99), Full ($249, featured with pulse animation), Ultimate ($349), Consult ($49). Consult soft-CTA callout below the grid ("Not sure which package fits?"). Outline buttons are black.
6. **Story / Video** (`#story`) — Left: "Why I built this" founder copy. Right: video placeholder (iframe commented out, ready to uncomment). Owner will add video and social proof/testimonials here.
7. **Contact / Intake Form** (`#contact`) — Left: intro copy. Right: form in a dark-bordered white card. Form submits natively to Formsubmit → redirects to Stripe payment link → Stripe redirects to success page.
8. **FAQ** (`#faq`) — Accordion, 6 questions.
9. **Footer** — Dark (`#1A1714`) background, orange logo, muted white text. Slim.

### Mobile Navigation
- Hamburger removed — replaced by a fixed floating pill nav at the bottom of the screen (dark frosted glass, `rgba(26,23,20,0.88)`, blur)
- Pill contains: Included · Packages · FAQ · **Get Started** (orange pill)
- The `Get Started` CTA in the nav bar (right side) stays visible on mobile too

---

## Key Components

### Tab Carousel (`initTabs()` in main.js)
- Desktop (>600px): click tabs to fade-switch panels
- Mobile (≤600px): `.tab-track` flex container, pixel-based `translateX` via `syncPanelWidths()`, touch swipe with 40px threshold, dot indicators
- `align-items: stretch` on panels is critical — DO NOT remove, it prevents carousel overflow bug

### CSS Mockups
All three tab panels contain hand-coded CSS mockups (no images):
- **Resume tab:** Realistic resume with name, contact, experience bullets, education, skills pills
- **Collateral tab:** Two stacked cards — cover letter template + references document
- **Profiles tab:** LinkedIn-style profile card + job board platform badge grid

Mockup sizing: elements use `0.4–0.625rem` font sizes to appear as miniature documents. `.mock-line` skeleton bars have `overflow: hidden; font-size: 0; color: transparent` — if you see text leaking out of gray bars, that's the root cause.

Dark mode: `.mock-doc-card-refs` was previously hardcoded `#F8F9FD` (caused white card in dark mode). Fixed to `var(--color-surface-alt)`.

### Dark Mode
- OS preference: `@media (prefers-color-scheme: dark)` → `html:not([data-theme="light"])`
- Manual: `[data-theme="dark"]` on `<html>`, toggled by button `#theme-toggle`, stored in `localStorage('theme')`
- Dark bg: `#1A1917`, surface: `#242220`, surface-alt: `#1E1C1A`
- Accent in dark: `#E08060` (slightly brighter than light mode `#DA7756`)
- Footer (`#1A1714`) is always dark in both modes by design

### Featured Package Card (Full, $249)
- Orange border (2px), pulsing glow animation (`@keyframes featured-glow`, 2.8s ease-in-out infinite)
- Animation pauses on hover
- "Most Popular" badge in orange above the card

### Process Steps
- White cards on cream `surface-alt` background
- Hover: `translateY(-4px)` + stronger shadow — same lift behavior as package cards

---

## Stripe Payment Integration (PENDING — needs owner action)

The JS infrastructure is fully wired. When a user submits the intake form:
1. Formsubmit receives the form data and emails it to `amielterry.dev@gmail.com`
2. Formsubmit redirects the user to the Stripe Payment Link for their selected package
3. User pays on Stripe
4. Stripe redirects back to the site (configure in Stripe dashboard)

### What needs to be done (owner action required)

**Step 1** — Create a Stripe account at [stripe.com](https://stripe.com) if you don't have one.

**Step 2** — Create 4 Products in Stripe dashboard → Products:
- Light — $99 one-time
- Full — $249 one-time
- Ultimate — $349 one-time
- Consult — $49 one-time

**Step 3** — For each product, create a **Payment Link** (Payment Links tab in dashboard). Copy the URL for each — they look like `https://buy.stripe.com/xxxxxxxx`.

**Step 4** — In Stripe dashboard → Settings → **Checkout and Payment Links → After payment** — set the redirect URL to `https://d2dy7uhnrh7039.cloudfront.net` (or your custom domain once attached).

**Step 5** — Open `js/main.js` and find the `STRIPE_LINKS` object near the top of `initForm()`. Replace the 4 placeholder URLs:
```js
const STRIPE_LINKS = {
  light:    'https://buy.stripe.com/REPLACE_LIGHT_LINK',
  full:     'https://buy.stripe.com/REPLACE_FULL_LINK',
  ultimate: 'https://buy.stripe.com/REPLACE_ULTIMATE_LINK',
  consult:  'https://buy.stripe.com/REPLACE_CONSULT_LINK',
};
```

**Step 6** — Deploy: run the standard deploy command above. Done.

---

## What's In Progress / Next Steps

### Owner action needed
- [ ] Record intro video and drop into the `#story` section (replace placeholder)
- [ ] Write social proof / testimonials — add near the video (owner said they'd handle this)
- [ ] Complete Stripe setup (steps above) and paste 4 Payment Link URLs into `js/main.js`
- [ ] Attach custom domain (e.g. `launchkit.co`) to the CloudFront distribution + ACM certificate

### Nice-to-haves discussed but not yet built
- [ ] Skills overflow in resume mockup on desktop (minor, owner said "that's okay")
- [ ] Possibly add a `success.html` page that Stripe redirects to after payment (better UX than homepage redirect)
- [ ] A/B test the hero headline — current: "Your job search, set up and ready to run"

### Design philosophy going forward
- Uniform cream background is intentional — contrast comes from section content, card elevation, and typographic weight — not alternating background colors
- When in doubt: add contrast with **black** (borders, buttons) or **orange** (CTAs, accents) — avoid adding more colors
- Claude.ai is the visual reference point — same warm cream palette, same approach to using black type aggressively for legibility
- Keep the footer always dark — it anchors the page and adds the contrast pop the light mode needs at the bottom

---

## Git / Branch Notes

- **Active branch:** `claude` (branched from `light`)
- Previous branches: `main`, `light` (older iterations with green accent)
- The `claude` branch is the canonical current version — all work happens here

---

## Tone / Copy Guidelines

- Direct, practical, no fluff
- Target user: someone who is ready to apply for jobs but hasn't set up their materials properly
- Not a resume writing service — a *setup* service. That distinction matters in the copy.
- Price anchor: $249 Full is the hero offering. Consult ($49) is the low-commitment entry point.
- Never use: "transform your career", "land your dream job", "take your career to the next level"
- Do use: "clean", "organized", "ready to use", "set up properly", "efficient"
