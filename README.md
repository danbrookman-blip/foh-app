# Airship Lookout

The front-of-house companion to **Airship**. A PWA that GMs, floor managers, and system managers run from their phone. They can look up entitlements without seeing customer PII, send a verification SMS/email, capture notes, and issue Random Acts of Kindness — all without leaving the floor.

Sits alongside **Airship** (vouchers, customer profile, messaging), **Toggle** (gift cards), and reads/writes feedback in an **HGEM**-compatible shape.

## Why this exists

There is no Ops-level access at the venue today. Floor staff can't help a customer who says "I had a birthday voucher but can't find the email." The current options are: refuse, or trust on the customer's word. Neither is acceptable in a regulated hospitality environment.

This app fixes that with one mechanic: **the customer's tap on the verification link is both the proof they're physically present *and* the authorisation to redeem.** Manager never sees the customer's data, customer never has to dig through email at the bar.

## The product spec lives in [docs/handover-plan.md](docs/handover-plan.md)

That document is the source of truth for what to build and how it must behave. This codebase is a **partial proof** of that spec — the spine works end-to-end, several requirements are stubbed structurally, and some are deliberately missing. The "Spec gaps still open" section below names what's missing so a reviewer or the next engineer can see at a glance.

## Run it

**Prerequisites:** Node 20+ (LTS).

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

## Production seams (stubbed, ready to swap)

These structural pieces exist as adapter interfaces with in-memory mocks. Each maps to a specific requirement in [docs/handover-plan.md](docs/handover-plan.md). Production wiring replaces the mock exports in `lib/<module>/index.ts` without touching the UI.

| Seam | What it does | Spec | Swap point |
| --- | --- | --- | --- |
| `lib/audit/` | Append-only, hash-chained audit log + HMAC identifier hashing. Every manager write hits it (lookup, verification send/confirm, register, kindness grant, note add). | L1.1–L1.5, P1.4, P1.8 | `lib/audit/index.ts` exports `auditMock`; swap to immutable store (S3 Object Lock, QLDB) |
| `lib/verification/store.ts` | HMAC-signed token bound to (identifierHash, venueId, entitlementIds, sessionId), 5-min expiry, 6-digit PIN fallback with attempt rate-limit. | V1.1–V1.5 | Replace in-memory `Map` with Redis-with-TTL; keep the signing + binding logic |
| `lib/tenant-config/` | Per-operator config: signal toggles, verification expiry override, opt-out registry. | F3.4, P3.3, C1 | Replace mock with the operator-config service brand admins write to |
| `lib/airship/`, `lib/toggle/`, `lib/hgem/`, `lib/kindness/` | Vendor adapters. UI imports only from the index files. | F1.2, F1.4, F2.5 | Implement the interface in a real client file and re-export |

The audit log's hash-chain integrity can be verified at any time via `audit.verifyChain(operatorId)` — production audit + DSAR endpoints sit on top of that.

## Spec gaps still open

The prototype does not yet implement these requirements from the handover plan. Each is small-to-medium work, called out so the next engineer doesn't have to rediscover them:

- **A1.1–A1.5** — auth is a cookie stub. No 2FA, no device pairing, no shift-end re-auth, no head-office force-logout. The session type has the right fields (`operatorId`, `staffId`, `sessionId`); the surfacing of those is what's missing.
- **F1.6** — manager doesn't currently "log redemption complete" as a separate action. The confirmation event is logged but a manual confirm-on-till step isn't surfaced.
- **F2.4** — guest's second-device consent acknowledgement for new-guest capture. The `AddCustomerForm` writes through directly today; production needs a verify-style link to the guest's own device. Add-customer route includes a TODO comment.
- **G1.4** — multiple-match disambiguation on lookup is not handled.
- **P1.5** — DSAR export endpoint not wired. The audit log has `query()` keyed on `identifierHash`; the public surface that lets a customer pull their own history is what's needed.
- **F3.4** — tenant-config exists; the arrivals signal layer doesn't yet honour the per-signal toggles. One-line change in `app/api/arrivals/route.ts`.
- **P3.3** — customer signal-layer opt-out flow not surfaced (opt-out registry exists in tenant-config).
- **X1.1** — full WCAG 2.1 AA audit not run.

## Two prototype features not in the spec

- **Notes on profiles** (`components/NotesPanel.tsx`). Manager-attached free-text notes with **voice dictation** (Web Speech API — tap the mic, speak, the transcript appears live in the textarea). Useful for floor service but crosses the "what does the manager see" line the spec is careful with. Treat as a Phase 3+ candidate or remove.

  **Voice transcription notes for production:** Chrome's Web Speech API routes audio to Google's servers — that has data-processing implications worth flagging to the DPO (P1.7 cross-border data flow). Safari uses Apple's on-device or server recognition depending on version. For a regulated production deployment, the recommended path is server-side Whisper (or a UK-hosted ASR equivalent): capture audio with `MediaRecorder`, POST the blob to `/api/transcribe`, server transcribes. Same UI shape; swap inside `components/useVoiceDictation.ts`. The Web Speech approach also won't cope well with noisy venues — second reason to consider Whisper.
- **Random Acts of Kindness** (`lib/kindness/`). Manager-issued comps with monthly quotas. Bypasses the verification mechanic (manager hands it over without customer confirmation), which makes it harder to defend regulatorily. Either belongs as its own use case or needs to inherit the verification primitive.

## Roadmap notes (post-demo)

- **Until** — real Airship API client + sandbox creds.
- **Then** — real Toggle API client.
- **Then** — wire arrivals to actual WiFi/booking webhook.
- **Then** — replace cookie session with SSO.
- **Then** — proper PNG icons + push notifications for arrivals (the "ping the manager when a VIP walks in" beat).
