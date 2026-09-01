# SellEZ — Design Redesign Plan

## 0. Method

Explored all 21 frontend routes and 6 shared components, ran the app end-to-end (logged in via a real OTP flow, seeded a super-admin session), and screenshotted every screen in both light/dark and desktop/mobile before writing this plan.

## 1. What's wrong today

**Structural / UX**
- **No real mobile navigation.** The header nav just wraps onto a second/third line at 375px (`app-shell.tsx`), pushing the actual page content down ~500px before anything useful appears. Mobile is a squeezed desktop, not a designed mobile experience.
- **Destructive/administrative actions are always-armed inline forms.** `admin/users` renders a live "type + days + reason + Ban" form on *every single member row, all the time*. `admin/listings` has bare reject/return reason inputs sitting next to Approve. One misclick bans someone. Nothing this consequential should be one click away with no confirmation.
- **No tables anywhere.** Audit log, members, communities, reports are all dense tabular data forced into stacked `Card`s with the same 28px-radius/heavy-shadow treatment as a marketplace listing. Scanning 20 audit rows means scrolling past 20 near-identical large cards.
- **Chat "report" is four buttons in a row** (`Report spam / Report scam / Report offensive / Report fake_listing / Report other`) sitting permanently under every conversation — but the *listing detail* page already solves the same problem correctly with a single "Report" button that opens a reason-select dialog. Same feature, two inconsistent implementations.
- **Duplicated, inconsistent listing-card markup.** The marketplace grid card, marketplace list row, and admin review-queue card each hand-roll their own JSX for "image + title + price + category + seller" instead of sharing one component — so they drift (admin queue has no image aspect-ratio handling, no price formatting via `formatPrice`, etc).
- **Inconsistent empty states.** `admin/reports` shows "No open cases." in a card; `super/appeals` shows nothing at all when empty; `marketplace` has a centered message; `chats` has a centered message with different copy conventions. No shared `EmptyState` component.
- **Flat loading states.** Every page's loading state is one grey `Skeleton` block, unrelated in shape to what actually loads (a 5-tile dashboard shows one bar; a two-column listing detail shows one bar).
- **Rating input is a raw `<input type="range">`** with no visual feedback beyond a number — feels unfinished next to everything else that has at least some styling.

**Visual**
- **Every corner is the same giant radius** (cards, dialogs, and *every button, including "Ban"* are `rounded-full`/28px), so nothing reads as more or less important — buttons, inputs, cards, and modals all look like the same soft blob. Pill-shaped destructive buttons ("Ban", "Reject") undercut their own severity.
- **One shadow value used everywhere** (`--shadow: 0 24px 60px rgba(...)`) — no elevation hierarchy between a resting card and a modal.
- **`h1`/`h2`/`h3` are unconditionally serif** (Fraunces) via a blanket CSS rule, so a stat-tile number, a chat thread title, a dashboard heading, and the landing-page hero all render in the same display serif — hierarchy collapses because everything "important-looking" is visually identical.
- **The accent olive-green (`#8fbf6a` dark / `#2f6f4e` light) is overloaded**: it's the brand color, every link, every "success"-ish state, and the only saturated color in the palette, so nothing stands out as a status signal (pending vs. active vs. rejected all look the same neutral grey-on-dark).
- **Dark theme reads muddy**: warm brown-tinted radial gradients over a warm near-black background reduce contrast and make the product feel dated rather than "trusted modern SaaS."
- Icons are almost entirely absent (only the theme toggle uses one), so the UI leans on text labels for everything, including things an icon would communicate instantly (search, filters, view toggle, message, report, edit).

## 2. Design direction

**"Quiet trust, quietly modern."** SellEZ's actual value prop is privacy and calm moderation inside a closed community — the visual system should feel restrained, precise, and confident, the way Linear/Vercel/Stripe read: dark-first neutral surfaces, one disciplined accent color reserved for actions and brand (not decoration), real typographic hierarchy instead of size-via-serif, and tabular/structural components for the admin surfaces that are actually tabular data. Keep the sans+serif pairing that already exists in the codebase, but demote serif to an intentional, rare "editorial" voice (marketing/auth moments only) instead of a blanket heading rule.

## 3. Principles

1. **Hierarchy over decoration.** One accent color, used only for primary actions, active states, and brand — never for muted chrome.
2. **The right shape for the content.** Tabular data gets a table. A destructive action gets a confirmation dialog. A status gets a badge, not prose.
3. **Consistency through shared components**, not per-page reinvention — one `ListingCard`, one `EmptyState`, one `StatusBadge`, one confirm-dialog pattern for every mutating action.
4. **Mobile is designed, not shrunk.** A bottom tab bar for the four things people actually do on a phone (Browse, Sell, Chats, Account); admin/super surfaces reachable via the account menu, not fighting for header space.
5. **Motion is functional.** Hover/focus/press feedback and enter/exit transitions on menus and dialogs — no gratuitous animation.
6. **Accessible by default.** Real focus rings, sufficient contrast in both themes, labelled icon-only controls, no color-only status signaling (badges carry text, not just a colored dot).

## 4. Visual system

- **Color** — cooler, higher-contrast neutral scale (near-black `#0a0b0d` dark / soft off-white light) replacing the warm brown-tinted theme; a single confident emerald accent (`#34d399` dark / `#0f9d68` light) reserved for primary actions and active/brand states; explicit **semantic** tokens separate from the brand accent — `--success`, `--warning`, `--danger`, `--info` — used for status badges (ACTIVE/UNDER_REVIEW/SOLD/REJECTED, role tags, ban notices) so state is legible at a glance instead of everything sharing the brand green.
- **Typography** — Outfit (sans) becomes the default for all in-app UI headings at a real weight/size scale (page title → section heading → card title → body → meta label); Fraunces (serif) is reserved for the landing page hero and the auth screens (sign-in/verify/onboarding), where an editorial voice supports the "private, human" brand moment.
- **Radius scale** — `sm` (8px, inputs/badges/small controls), `md` (12px, buttons), `lg` (16px, cards), `xl` (20px, dialogs/sheets). Full-pill (`rounded-full`) reserved for avatars, status dots, and the view-mode toggle — not for buttons that need to signal weight/severity.
- **Elevation** — cards rely on a 1px border + surface-color difference, not a heavy shadow; shadow reserved for things that actually float (dropdowns, dialogs, sheets), with a real sm/md/lg scale.
- **Icons** — `lucide-react` (already a dependency) used throughout: nav, search, filters, view toggle, status, empty states, actions.
- **Motion** — 150–200ms ease-out on hover/focus/press; Radix-driven enter/exit on dialogs, dropdowns, and the mobile sheet.

## 5. New shared components (`components/ui/`)

`badge` (status pills), `empty-state`, `page-header`, `table` (Table/THead/TRow/TCell, responsive → stacked cards under `sm`), `alert-dialog` (confirm destructive actions), `dropdown-menu` (row actions, account menu), `select` (styled trigger over native semantics), `avatar` (initials/color dot), `otp-input` (segmented 6-digit code), `star-rating` (click-to-rate), `listing-card` (single source of truth for grid/list/admin-queue rendering), plus revisions to `button`, `field` (Input/Textarea/Label/Card/Skeleton), and `dialog`.

## 6. Screens to redesign (all 21 routes)

Landing · Login · Verify OTP · Onboarding · Banned appeal · Not-found · App shell (header + mobile bottom nav + account menu) · Marketplace (grid/list) · Listing detail · New/Edit listing · My listings · Chats list · Chat thread · Admin dashboard · Admin review queue · Admin reports · Admin members · Super dashboard · Super communities · Super appeals · Super audit log.

## 7. Implementation order

1. Design tokens (`globals.css`) — color, type, radius, shadow, motion.
2. Core primitives (`components/ui/*`) — button, field set, dialog, + new: badge, empty-state, page-header, table, alert-dialog, dropdown-menu, select, avatar.
3. App shell — desktop header, mobile bottom nav + sheet menu, account dropdown.
4. Auth/marketing surfaces — landing, login, verify (segmented OTP), onboarding, banned appeal, not-found.
5. Marketplace + shared `ListingCard` (grid/list) + listing detail (gallery, star rating, report dialog).
6. Create/edit listing form + My listings.
7. Chats list + thread (consolidated report dialog).
8. Admin: dashboard, review queue (dialog-confirmed moderation actions), reports, members (table + ban dialog).
9. Super: dashboard, communities, appeals, audit log (table).
10. Full responsive + accessibility + dark/light pass; fix anything left inconsistent.

Business logic, API calls, and request/response contracts are unchanged throughout — this is a presentation-layer rebuild.
