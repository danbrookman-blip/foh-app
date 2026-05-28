# Front of House

A manager-facing PWA that sits in front of **Airship** (vouchers, customer profile) and **Toggle** (gift cards). Built so floor managers, GMs and system managers can look up what a customer can redeem — without exposing PII — and authorise the redemption with a customer-side text/email tap.

## Why this exists

There is no Ops-level access at the venue today. Floor staff can't help a customer who says "I had a birthday voucher but can't find the email." The current options are: refuse, or trust on the customer's word. Neither is acceptable in a regulated hospitality environment.

This app fixes that with one mechanic: **the customer's tap on the verification link is both the proof they're physically present *and* the authorisation to redeem.** Manager never sees the customer's data, customer never has to dig through email at the bar.

## Run it

**Prerequisites:** Node 20+ — install from <https://nodejs.org> (LTS). This machine doesn't have Node installed yet, so the dev server hasn't been smoke-tested end-to-end; once Node's in, the install + run should work cleanly.

```powershell
cd C:\Users\Airsh\Github\foh-app
npm install
npm run dev
```

Then `npm run typecheck` to confirm the TypeScript is clean.

Open <http://localhost:3000> on a desktop browser to drive both sides, or on your phone (same Wi-Fi) to feel the PWA. On iOS, share → "Add to Home Screen" for the full-screen experience.

## The demo walkthrough

Pick a manager + venue on the home screen, then:

1. **Lookup → Sarah** — `07700 900 001`. She's a VIP with a birthday this month, a £20 voucher, a free-dessert voucher, *and* a £45 Toggle gift card. The screen shows entitlements — no name, no number.
2. Select 1–2 items, pick **Text** or **Email**, hit *Send verification*.
3. You land on the **Waiting** screen. In a real demo, the customer would tap the link in their inbox.
4. To simulate the customer, open the verify URL printed at the bottom of the waiting screen in a second tab (or on a second device). That's the **headline moment** — the screen the customer sees on their own phone.
5. Tap **Yes, redeem it now**. The Waiting screen flips to confirmed instantly.
6. Then try:
   - **`07700 900 005`** (Priya) — VIP with *no* vouchers, only a gift card. Tests the empty-voucher UX honestly.
   - **`07700 900 002`** (James) — lapsed regular with a recovery voucher.
   - **`07700 900 003`** (Olivia) — new customer with a welcome voucher.
   - **`07700 900 999`** — no match. Lands on a "Register them now" CTA flowing into the add-customer screen.

Finally open **Arrivals** to see the Strava-style signals feed. Each card shows tier, recency, frequency, lifetime visits, last item, birthday-month — no PII beyond first name + initial.

## The verification-by-text mechanic (in one paragraph)

Manager submits identifier → app looks up entitlements in Airship + Toggle → manager selects → backend mints a single-use token (10-minute TTL), Airship sends an SMS/email link, manager waits → customer taps → token confirms → backend marks the voucher/gift-card *authorised for this visit* → till redeems through the normal flow. The till is still the redemption surface; the app only unlocks the entitlement, like a one-time PIN against a voucher.

## Architecture

```
app/
  page.tsx               manager home + login
  lookup/                identifier entry → entitlement results → waiting state
  verify/[token]/        customer-facing confirmation page
  add-customer/          new-customer capture
  arrivals/              Strava-style signal feed
  api/
    customers/lookup     joins Airship + Toggle on identifier
    customers/register   posts new customer to Airship
    verifications/       create / fetch / confirm / cancel a token
    signals/[ref]        signals for arrivals + profile
    arrivals/            mock arrival feed (WiFi/booking source)
    session/             mock manager login
lib/
  airship/   adapter interface + mock + types  (swap point)
  toggle/    adapter interface + mock + types  (swap point)
  verification/store     in-memory token store (swap for Redis in prod)
  seeds.ts               five demo personas, shared by both adapters
  session.ts             mock session in a cookie
```

## Swapping to real APIs

Both vendors hide behind a single interface. To go live:

**Airship:**
1. Add an `airship-client.ts` next to `lib/airship/mock.ts` that implements `AirshipAdapter` against the real Airship API (lookup, voucher state machine, messaging send, profile registration).
2. Change `lib/airship/index.ts` to export the new client instead of `airshipMock`.
3. Wire `AIRSHIP_API_KEY` etc. into `.env.local` and read in the new client.

**Toggle:** same pattern, in `lib/toggle/`.

**Verification store:** swap `lib/verification/store.ts` for a Redis-backed equivalent. The keys are short-lived (10 min TTL), so an in-memory store is fine for one-instance dev, but won't survive serverless cold starts.

**Identity resolution:** the mock joins Airship + Toggle on mobile/email. In production you may need a customer-resolution step — leave a clear TODO in `app/api/customers/lookup/route.ts` for that, since it's a customer-by-customer decision.

**Arrival source:** `/api/arrivals` currently fakes the feed. In production, point this at:
- Your WiFi captive-portal webhook (e.g. Purple, Stampede)
- Your reservations system webhook (Sevenrooms, OpenTable, SuperbExperience)

Both can post arrival events to a small ingestion endpoint, which then writes to the same arrivals store.

## What we deliberately don't show the manager

| Field | Why |
| --- | --- |
| Name (in lookup) | The lookup screen exposes nothing beyond entitlements. Name only appears in Arrivals (first + last initial), where the *purpose* is greeting. |
| Mobile / email | The whole point — there's no path to harvest contacts. |
| DOB | Birthday-month flag yes. Actual DOB never. |
| Spend totals (£) | Could be added later as a tier signal, but raw spend feels too close to PII. Tier bucket (VIP / regular / new) is the right altitude. |
| Visit history detail | Aggregates only. No per-visit log. |

## Roles

- **GM / Floor Manager** — lookup, add-customer, arrivals.
- **System Manager** — same plus, in future, brand-level overrides on which entitlements appear.

Roles are stubbed today (cookie). Real implementation pulls from staff identity (SSO) and the manager's assigned venues.

## What's mocked vs. real

| Piece | State |
| --- | --- |
| UI / PWA shell | Real |
| Adapter interfaces | Real (production-shaped) |
| Verification token flow | Real (in-memory store) |
| Airship API | Mocked behind `AirshipAdapter` |
| Toggle API | Mocked behind `ToggleAdapter` |
| SMS / email send | Console-logged, not sent |
| Manager auth | Cookie-based stub |
| Arrival source | Synthetic feed |
| Icons | Lightweight SVG only — replace with brand PNGs before production |

## Customer feedback (HGEM) — scaffolded, not wired

A placeholder for post-visit feedback lives on the customer's verify success page so you can see where it slots in. The integration itself isn't live — it sits behind an adapter at `lib/hgem/` matching the Airship/Toggle pattern.

Important finding from the docs: **HGEM's public Results API is read-only.** Kleene's HGEM connector confirms it — it pulls visit data *out* of HGEM, doesn't push feedback in. So there's no public "POST a feedback row to HGEM" endpoint. Two realistic wirings for `HgemAdapter` when this is picked up:

1. **HGEM partner write endpoint** — ask your HGEM rep whether they expose one contractually. Implement the adapter against it.
2. **Your own data warehouse, HGEM-shaped schema** (likely the default) — the `FeedbackRecord` type already mirrors HGEM's visit shape (`visitId`, `branchId`, `modificationDate`) so rows join cleanly with whatever Kleene's already pulling from HGEM. Write rows to S3/BigQuery/Snowflake/etc. from the adapter; analysts see one logical "visit feedback" stream with `source` distinguishing first-party (`foh-app`) from HGEM mystery shopper.

Swap point is the same as the others: `lib/hgem/index.ts`.

## Roadmap notes (post-demo)

- **Until** — real Airship API client + sandbox creds.
- **Then** — real Toggle API client.
- **Then** — wire arrivals to actual WiFi/booking webhook.
- **Then** — replace cookie session with SSO.
- **Then** — proper PNG icons + push notifications for arrivals (the "ping the manager when a VIP walks in" beat).
