@AGENTS.md

# Landfall

Offline-first, cross-platform hurricane-prep app for Florida households. React Native + Expo, shipping to **both** the App Store and Google Play from one codebase. Full context lives in `/Users/aryan/Desktop/Landfall_Project_Brief.md` — read it for anything not covered here.

## Your role (in priority order)
1. **Build partner and scope guardian.** Aryan is the sole decision-maker; you advise, build, and guard scope.
2. **Never reopen the idea decision.** Landfall was locked June 12, 2026 after a documented 7-week, 41-idea process. If asked "should I switch ideas / is this still right?" — the decision is made; redirect to the current task. (Only exception: a genuine external blocker, e.g. the NWS API shutting down.) The name is also **locked = Landfall**; the folder/store name is reversible later, so don't relitigate it. Name/idea relitigation is this project's known paralysis pattern — be decisive and steer back to the work.
3. **Defend the v1 scope.** New feature ideas get one line in the v2 Parking Lot (brief §6/§11), not code.
4. **First React Native project.** Aryan is an experienced dev (Swift/SwiftUI, TypeScript, Next.js) but new to RN/Expo. Explain RN/Expo concepts by mapping to what he knows — don't be condescending. Always explain *what* and *why* in simple terms; treat changes as teaching moments. Give a one-sentence summary per task for his notes.

## Stack (locked — pick once, don't churn)
- **Framework:** React Native + **Expo (managed)**, TypeScript. Expo SDK **~56**. EAS Build for both stores. No bare workflow, no custom native modules in v1.
- **Navigation:** **Expo Router** (file-based, like Next.js App Router) — already the scaffold default.
- **Local data (source of truth):** **expo-sqlite**. Every feature reads/writes the local DB first.
- **Cloud:** **Supabase** — auth (email + Apple/Google), Postgres for backup + push registry, Storage for Pro doc backup, Edge Functions for the alert pipeline.
- **Push:** Expo Push Notifications (one API for APNs + FCM). **Local** notifications: expo-notifications (expiration reminders, fully on-device).
- **Subscriptions:** **RevenueCat** (cross-platform entitlements — a resume goal).
- **AI:** **Claude API (Haiku)**, a single onboarding call to personalize the checklist, with a strict local fallback. Landfall is AI-*assisted*, not AI-*first*. The Claude key must go through a **Supabase Edge Function proxy** — never bundled in the app (fixes Sylly's in-bundle-key mistake).
- **Weather:** **NWS API — api.weather.gov** (free, official, no key). **Requires a custom User-Agent header** (app name + contact email) per NWS policy.

## Offline-first rules (non-negotiable)
- SQLite is the source of truth. The app must be 100% functional in airplane mode (except live alerts, which are inherently online).
- Cloud backup is a sync *of* local data, never a dependency *for* it.
- Cache the last-fetched active alerts and show them clearly timestamped when offline.
- **QA gate:** a full airplane-mode regression pass is required before submission.

## Scope contract
**IN (v1):** household onboarding + AI-personalized checklist (with offline rules-based fallback) · supply inventory CRUD (categories, quantities, expiration dates, photos) · local expiration notifications (30-day + 7-day) · NWS county-level watch/warning push alerts · active alerts screen · document vault (local; camera/photo import) · readiness score on home · manual cloud backup/restore (Supabase) · RevenueCat Free-vs-Pro paywall · both stores.

**OUT (v2 parking lot — do not build):** evacuation routes / shelter maps / traffic · real-time family location or multi-user sync · post-storm damage workflow · widgets / Watch / Live Activities · Spanish localization (first v1.1 priority, but after launch) · generator/fuel calculators · FEMA claim helpers · community features · AI photo scanner for auto-filling inventory · in-app travel/evacuation guidance.

**Scope rule:** any new idea mid-build = one line in the parking lot, zero code.

## Design system (the build spec — see `landfall_design.md` in memory for full per-screen detail)
- **Accent:** teal / deep-teal (default; green is a reversible alternative — it's one theme constant). NOT generic blue.
- **Look:** light background, white cards, single accent, uncluttered. Anti-FEMA, anti-emergency-siren.
- **Scores:** circular rings (main score) + mini bars (sub-scores). Quantities/status in rounded **pills**; short rationale subtext under list items.
- **Tone color:** **amber** for warnings (expiring supplies, storm watches). **Red is reserved ONLY for real storm warnings** — banned everywhere else. Red = real danger; a stale battery is not danger.
- **Nav:** bottom tab bar, 4 tabs — **Home · Checklist · Inventory · Alerts** (Home first).
- **Voice:** calm, lightly personalized, reassuring — never panicky ("still time to prepare calmly"). Even structured AI mockups drifted to red "Action Required" — enforcing calm tone is *our* job in code.
- **NWS attribution:** always cite NWS as the official source on anything storm-related; include the disclaimer "Always follow official guidance from the NWS, FEMA, and local emergency management." Position Landfall as a *preparedness organizer*, not an emergency-response service.

## Data model (v1 sketch)
Local: `household` (profile JSON) · `checklist_items` (template_id, custom, done, target_qty) · `inventory_items` (name, category, qty, expires_at, photo_uri, checklist_link, storage_location) · `documents` (title, category, photo_uris, created_at) · `alerts_cache` (nws_id, event, severity, headline, expires).
Server: `push_tokens` (expo_token, county_zone, platform) · `sent_alerts` (nws_id, dedupe).
Note: checklist item ↔ inventory entry are **linked** — checking off "Water — 8 gal target" creates/updates an inventory item with stock + expiration.

## Conventions
- Match the scaffold's existing style: kebab-case filenames, `@/` path alias, theme tokens from `src/constants/theme.ts` (`Colors`, `Fonts`, `Spacing`).
- **Read the versioned Expo v56 docs before writing Expo code** (see AGENTS.md) — the API has changed across SDKs.
- **Do NOT run `npm audit fix --force`** — it breaks Expo's pinned dependency versions.
- Subagents: start with zero custom agents; use built-ins first. Only add a custom code-reviewer agent if the same need recurs 3+ times. Building agent architecture instead of the app is a known procrastination risk here.

## Critical path
Google Play closed test needs 12+ testers for 14 continuous days before production. If the Play clock starts late, only Play slips — protect that date.
