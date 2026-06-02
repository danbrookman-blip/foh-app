# Front of House Companion — Developer Handover Plan

## Context

This plan is a developer-facing requirements specification for the **Front of House Companion**, an in-venue PWA for hospitality managers (GMs, floor managers, "system managers" in PS4 terminology). It was triggered by a 2026-05-28 workshop brief that unparked the long-dormant "Front of House Web App" roadmap item (referenced in workspaces/Ant_-_Toggle/clusters.md:173,178) by anchoring it to a real persona (PS4 — Tom) and a novel mechanic — *customer-driven verification* — that solves the trust+PII problem in one move.

**Why a plan, and what's the intended outcome:** the workspace contains the problem statement (PS4), the use case (#8), and a use-case scaffold (workspaces/Ant_-_Toggle/use-cases/foh-companion.md). What it lacks is a specification developers can build against. This plan closes that gap. It covers all three phases at developer-handover depth (per scoping decision 2026-05-28). It assumes **Airship as the substrate, Toggle as optional** — meaning the lookup model must treat gift card sources as pluggable.

**Provisional anchor warning:** PS4's persona (Tom) is provisional. No FOH staff have yet been interviewed. The plan calls out where every requirement depends on persona research that should run in parallel to (not after) early build work. See workspaces/Ant_-_Toggle/problem-statements.md PS4 Gaps flagged.

---

## Source artefacts developers should read first (in order)

1. **workspaces/Ant_-_Toggle/problem-statements.md PS4** — the problem the product solves, in plain language. Read the **goal sentence and the Customer-world root** carefully; the *because-clauses* are the requirements seed.
2. **workspaces/Ant_-_Toggle/use-cases/foh-companion.md** — the use case shape, the three-capability framing, the phasing recommendation, the seven open tensions. This plan builds on those.
3. **workspaces/Ant_-_Toggle/rai-inventory.md** — the six-dimensional Responsible AI framework already in use across the workspace (Privacy & Security / Safety / Transparency / Explainability / Veracity & Robustness / Fairness). All new RAI entries this product creates should follow this same shape.
4. **workspaces/Ant_-_Toggle/problem-statements.md PS3 (Mark) + workspaces/Ant_-_Toggle/use-cases/liability-cockpit.md** — controls and audit thinking that transfers directly to the FOH staff-lookup audit log.
5. **workspaces/Ant_-_Toggle/personas/sophie-group-marketing-manager.md** — the head-office stakeholder whose "data round-trip" scar tissue (Airship→Toggle one-way gap) shapes the new-guest capture requirement.

---

## Scope decisions baked into this plan

| Decision | Choice | Implication |
|---|---|---|
| Phase coverage | All three phases at equal depth | Phase 1 spine, Phase 2 capture, Phase 3 notification + signals — single document, single backlog |
| Substrate | Airship-anchored; Toggle optional (pluggable gift-card source) | Lookup architecture treats gift-card systems as adapters; v1 ships with Toggle adapter, others can follow |
| Till / EPOS | EPOS-agnostic on principle; Zonal is the de-risked first integration | Redemption hands off to the till's existing voucher flow — see Out of Scope |
| Form factor | PWA (workshop brief — "add to home screen", no native build) | Web standards stack; treat iOS Safari + Android Chrome as the two target environments |
| Geography | UK first | UK GDPR + Data Protection Act 2018 are the regulatory floor |
| Pilot site | Small multi-site Airship customer, TBD by sales | Persona research with at least one GM at the pilot site is gating |
| Persona research | Runs in parallel to early build, not after | Build only what's confidently anchored; defer ambiguous design decisions to the research |

---

## Phase 1 — Lookup-verify-redeem (the spine)

This is the demo. Without the verification mechanic working in a regulated environment, neither Phase 2 nor Phase 3 is shippable.

### User story (primary)

> *As a venue manager, when a guest hands me their mobile number or email, I want to look them up and see only what they're entitled to use today — vouchers from Airship, gift cards from any connected gift-card source — without seeing their record, and then have the guest themselves confirm presence so the redemption is authorised and logged.*

### Functional requirements

- **F1.1** A venue-scoped staff user authenticates into the PWA. Session is short-lived (see auth requirements below).
- **F1.2** Manager enters an identifier (mobile in E.164 form, or email). The system performs a **unified entitlement lookup** across Airship vouchers and any connected gift card source. Returns a list of entitlements with: type (voucher/gift card), value, expiry, restrictions. **Never returns** guest name, address, history, or any other PII field beyond a one-line acknowledgement that the identifier resolves ("identifier matches a record").
- **F1.3** If the identifier does not resolve, the system returns "no entitlements found" — never "guest not in system" (which would leak whether the identifier exists). Routes the manager to the new-guest capture flow (Phase 2).
- **F1.4** Manager selects an entitlement to redeem. System triggers a **verification message** to the matching contact's identifier (the channel the guest provided — SMS for mobile, email for email). The message contains a short-lived (5 min) signed confirmation link.
- **F1.5** Guest taps link on their own device. Page confirms the action ("Confirm redemption of [entitlement] at [venue] now?"). Guest taps confirm.
- **F1.6** Manager's screen updates to show "✓ confirmed" with the entitlement details. Manager redeems on the till via the **existing voucher-redemption flow** (the FOH companion does not change till behaviour). Manager logs completion in the PWA.
- **F1.7** All four events (lookup, verification triggered, customer confirmed, redemption logged) are written to an **append-only audit log** with timestamps and staff/venue identifiers.

### Auth & session requirements

- **A1.1 Venue-scoped staff role.** Airship's current permission model is head-office-shaped (see Gotchas G1). A new role tier must be defined: scoped to one venue, restricted to lookup + redemption-trigger actions, audited per lookup. No service-account credentials on the device.
- **A1.2 Device pairing / enrolment.** Initial sign-in requires 2FA. Device is registered against the staff identity. Subsequent sign-ins use a refresh token tied to the device. Device can be revoked by head office.
- **A1.3 Session length.** Active session: 30 min idle timeout. Hard ceiling: end-of-shift (or 12 hours, whichever is shorter). Re-auth at every shift start.
- **A1.4 No password storage on device.** Use OS-level credential storage (Web Authentication API / Passkeys where available; PIN fallback).
- **A1.5 Head-office override.** Head office can force-logout a specific device or role instance immediately.

### Verification mechanic — detailed spec

- **V1.1** Primary flow: **customer-confirms-on-own-device** (Option A). Message contains a signed, single-use link with a 5-minute expiry. Tap → confirmation page → confirm → manager sees ✓.
- **V1.2** Fallback flow: **PIN-readback** (Option B). If primary fails (e.g. poor signal in venue), system can send a 6-digit PIN. Manager enters it. Use is rate-limited, audit-flagged ("fallback used"), and per-staff counters reviewable by head office for abuse detection.
- **V1.3** Replay protection. One-time tokens, signed (HMAC), bound to (identifier, venue, entitlement, manager session). No reuse.
- **V1.4** Channel choice. The system messages the **same channel** the guest provided (SMS for mobile, email for email) — never the other channel, so a stolen email can't be confirmed by SMS to a different number.
- **V1.5** Timeout handling. If no confirmation in 5 min, flow expires. Manager has a documented "try again" path. No staff-side override that bypasses confirmation — this is the line that protects the trust + PII story.
- **V1.6** Connectivity failure handling. If the message demonstrably fails to send (provider returns error), surface the failure to the manager immediately; do not silently retry.

### Audit log requirements

- **L1.1** Append-only, tamper-evident (signed entries). Stored in a system the staff role cannot edit.
- **L1.2** Each entry captures: timestamp, staff ID, venue ID, session ID, action type, identifier hash (not raw — see PII), entitlement ID where relevant, outcome, fallback-used flag.
- **L1.3** Retention: 7 years (aligned with Mark's audit window for the £1.4m balance-sheet liability; check with the operator's DPO at pilot).
- **L1.4** Surfaceable to head office, finance, and external auditor via export.
- **L1.5** Surfaceable to the customer via DSAR (data subject access request) — see GDPR.

### GDPR / PII handling (Phase 1)

- **P1.1 Lawful basis for the lookup.** Legitimate interest (venue operations, fraud prevention, anti-abuse on stored-value instruments). Operator's DPO must approve at pilot.
- **P1.2 Lawful basis for the verification message.** Two interpretations: (a) legitimate interest (one-off transactional message to a known contact), (b) contract performance (the redemption is contractually scoped). Pre-pilot legal opinion required. Both interpretations point to no marketing opt-in being needed for this message, but the message itself must be transactional only — no marketing content.
- **P1.3 Data minimisation in the manager UI.** What the manager sees: entitlement type, value, expiry, restrictions. What they do NOT see: name, address, history, spending pattern, lifetime value (until Phase 3, and even then in bracketed-signal form only).
- **P1.4 Identifier hashing in logs.** Audit log stores a hash of the identifier (mobile/email) plus the entitlement ID, not the raw identifier. The raw identifier→hash mapping lives in a separately-permissioned store accessible only for DSAR/audit.
- **P1.5 DSAR support.** When a customer requests their data, the FOH lookup activity (every time a venue manager queried their identifier, the verification messages sent, the redemption events) must be exportable. Build this in v1 — retrofitting is expensive.
- **P1.6 Retention beyond audit.** Customer-facing data (verification message logs, confirmation events) retained only as long as the audit log requires. No analytics retention beyond that without further consent.
- **P1.7 Cross-border data flow.** If any component is hosted outside the UK, document the safeguards (UK IDTA / SCCs as applicable).
- **P1.8 No PII in observability.** Application logs (errors, traces, metrics) must not contain identifiers, names, or message contents.

### Accessibility (Phase 1)

- **X1.1 WCAG 2.1 AA baseline.** All standard criteria.
- **X1.2 Hospitality context.** The PWA is used in:
  - Low-light venues (high-contrast theme; manual contrast toggle).
  - Noisy environments (no audio-only feedback; haptic + visual feedback for key state changes).
  - One-handed (target sizes ≥44×44pt; thumb-reachable primary actions).
  - Possibly gloved hands.
  - Bright daylight (outdoor terrace) — sun-readable; test at >3000 lux.
  - Time pressure — primary actions must complete in ≤5 seconds from intent.
- **X1.3 Device variance.** Managers use personal phones. Support iOS 16+ Safari and Android 11+ Chrome at minimum; document any feature degradation on older devices.
- **X1.4 Language.** English UK only for v1. Strings externalised so localisation is additive, not a rewrite.

### Phase 1 NFR

- Lookup latency: p95 < 800ms from identifier entry to entitlements rendered.
- Verification trigger latency: p95 < 2s from manager triggers to provider accepts.
- Verification message delivery target: ≥99% within 10 seconds of trigger (SMS), 30 seconds (email). Surface delivery failure to manager.
- Concurrency: two managers looking up the same guest simultaneously must see consistent entitlement state; no double-redemption window.
- Availability: 99.9% during venue hours (operator-defined).

### Phase 1 gotchas

- **G1.1 Venue-scoped role does not exist in Airship today.** Per Explore Agent 1 + foh-companion.md open tension #4. Must be designed and built — not configured. This is a non-trivial platform-side prerequisite to v1; it is not a sprint task.
- **G1.2 Unified-entitlement lookup endpoint does not exist.** Vouchers (Airship) and gift cards (Toggle) are queried separately today, with no per-guest unified view. Phase 1 either builds a thin orchestration layer in the FOH backend that fans out and merges, or commissions the unified-record substrate (shared with use cases #1, #3, #4 — use-cases.md line ~111). The orchestration layer is the faster path for v1; the substrate is the long-term answer.
- **G1.3 SMS/email verification flow not natively supported.** No documented "send a signed confirmation link and await a callback" endpoint in Airship today. Build on top of raw send endpoints (SparkPost for email; SMS provider TBD — UK shortcode or alphanumeric sender). PSP/provider choice has GDPR implications.
- **G1.4 Identifier ambiguity.** A mobile number can belong to multiple records (shared family number, recycled number); an email can have multiple contacts in multi-brand groups. Define disambiguation behaviour: at point of lookup, present "multiple matches — request a second identifier from the guest" rather than picking one.
- **G1.5 Identifier hygiene.** Mobile numbers come in various forms (international, local, with spaces). Normalise to E.164 server-side. Emails should be lowercased and trimmed.
- **G1.6 Rate limits.** Airship/Toggle API rate limits are unknown. High-volume venues at peak could saturate. Confirm with both teams before pilot; design with caching of the per-guest lookup for the duration of the verification window only.

---

## Phase 2 — New-guest capture

### User story

> *As a venue manager, when a guest I've just identified is not in the system, I want to register them on the spot — with their explicit consent — so they exist as a first-class Airship contact for next time.*

### Functional requirements

- **F2.1** Capture form with minimum fields: identifier (mobile or email, at least one), name. Optional: marketing opt-in.
- **F2.2** Real-time deduplication against Airship contacts. If a match is found, do not create a duplicate; surface to manager that "this identifier already exists" and route back to lookup.
- **F2.3** Consent capture must be **explicit, separable, and recorded** — marketing opt-in is a distinct checkbox from contact creation. Default un-ticked.
- **F2.4** A just-in-time **data-processing notice** is presented to the guest (not just shown on the manager's screen). This is the same primitive as the verification message: a one-tap acknowledgement from the guest's own device. The guest acknowledges the data being collected and the purpose, on their device.
- **F2.5** The new contact writes back to Airship as a **first-class contact**, not a venue-side cache. Tagged with: capture venue, capture timestamp, capturing staff ID, consent state.
- **F2.6** All four events (capture initiated, guest acknowledged, contact created, consent recorded) are written to the audit log.

### GDPR / PII (Phase 2)

- **P2.1 Lawful basis for contact creation.** Contract performance (the guest is opting into a service relationship) OR legitimate interest (operator's commercial interest in customer data) depending on operator's preferred basis. Operator's DPO chooses at pilot.
- **P2.2 Lawful basis for marketing opt-in.** Consent, GDPR Article 6(1)(a) — full stop. Must be explicit, granular, and revocable.
- **P2.3 Consent record format.** Capture: timestamp, channel of acknowledgement (the device the guest tapped), what was shown to the guest verbatim, version of the privacy notice. Retain alongside contact.
- **P2.4 No "deemed consent."** A guest physically present at the venue does not imply consent to marketing. The opt-in must come from their device, their tap.
- **P2.5 Right to erasure.** A guest captured via this flow can later request deletion. The contact and the consent record must be eraseable as a unit; the audit log of "capture happened" can be retained (legal basis: compliance with retention obligations) but with the identifier hashed.

### Phase 2 gotchas

- **G2.1 The "data round-trip" tension** (foh-companion.md, Sophie's persona stakeholder review). Sophie's scar tissue is from the one-way Airship→Toggle integration; she'll test whether new-guest data genuinely lands as a first-class Airship contact. F2.5 is non-negotiable.
- **G2.2 Deduplication is harder than it looks.** "07700 900000" and "+447700900000" and "07700900000" should all match. "first.last@example.com" and "firstlast@example.com" *should not* (different addresses). Specify normalisation rules carefully; test them.
- **G2.3 Consent UI degradation.** If the guest's device fails to load the consent screen (no signal), the manager has no fallback. Without consent confirmed on the guest's device, no contact is created. State this clearly to managers — do not let a "paper alternative" emerge.
- **G2.4 Identifier collision with existing contacts under a different brand.** A multi-brand group may have the same email associated with separate brand contacts. Define behaviour: separate contact per brand, or shared? Likely separate at v1, with cross-brand merge a deliberate later step.

---

## Phase 3 — Known-guest notification + signal layer

This phase has the highest dependency surface and the lowest persona evidence. Treat the open tensions as gates, not "nice-to-haves."

### User story

> *As a venue manager, when a known regular enters the venue, I want a heads-up — with enough signal to greet them appropriately, and nothing more.*

### Functional requirements

- **F3.1 Detection.** A "known guest is at the venue" trigger fires from at least one of two sources:
  - **Booking match** — operator's booking system fires a webhook or polled event when a known contact's booking arrives.
  - **WiFi registration** — operator's venue WiFi system fires a known-contact event when a recognised device joins.
- **F3.2 Notification.** The duty manager receives a notification with a signal-only profile of the arriving guest. Notification is delivered through the PWA (push, where permitted; in-app banner otherwise).
- **F3.3 Signal-only profile.** v1 ships with **exactly five signals**:
  1. Recency — bracketed (e.g. "this week", "last month", "last year").
  2. Frequency — bracketed (e.g. "occasional", "regular", "frequent").
  3. Spend bracket — banded (operator-configurable banding).
  4. Last item ordered — single item, masked if marked sensitive.
  5. Birthday-this-month flag — boolean.
  No other fields. **No name, no contact details, no history list, no lifetime value figure.**
- **F3.4 Per-tenant configuration.** Each signal individually toggleable by operator. Some operators may turn off "last item ordered" on data-minimisation grounds (see RAI deltas — re-identifiability risk).
- **F3.5 Audit log.** Each notification fired and viewed is logged. Includes who saw what about whom.

### GDPR / PII (Phase 3)

- **P3.1 Re-identification risk is the load-bearing concern.** Five signals in combination can identify a specific small-venue regular. The combinatorial risk is greater than the per-signal risk. Run a re-identification assessment per operator at pilot; the assessment is a first-class deliverable, not a checkbox.
- **P3.2 Lawful basis.** Legitimate interest (operations, customer experience). The legitimate interest balancing test must consider that the guest may not expect their visit signature to be shown to floor staff. Operator's DPO sign-off is gating.
- **P3.3 Customer opt-out.** Guests must be able to opt out of having their signal profile shown to FOH staff. Surface this in the privacy notice; provide a no-friction opt-out path (email link, in-app, or via existing operator unsubscribe mechanism).
- **P3.4 Detection source consent.** WiFi-based detection has separate consent implications (the WiFi T&Cs at the venue must cover device-recognition-for-identification). Booking-based is generally cleaner (the booking is itself a contract). Treat WiFi as the higher-bar consent surface.

### Phase 3 gotchas

- **G3.1 Signal-layer overlap with use case #6 (Gift Intelligence Layer).** Both surface insights on top of the same unified record, to different audiences. Reconcile *before* either builds — same substrate, same signal definitions, divergent surface. See workspaces/Ant_-_Toggle/use-cases.md row #6 + workspaces/Ant_-_Toggle/use-cases/foh-companion.md open tension #2.
- **G3.2 Booking and WiFi vendors vary by operator.** SevenRooms, Stampede, RST EPOS, Zonal Aztec all named in the workspace; each has a different (or no) integration surface for booking webhooks. WiFi vendors (Cisco Meraki, Aruba, Stampede's own WiFi, etc.) similarly fragmented. Treat the detection layer as an adapter pattern — one adapter per vendor, v1 ships with the pilot operator's vendor only.
- **G3.3 False positives are reputationally expensive.** Greeting the wrong guest as a regular is worse than greeting a regular as a new guest. Tune for precision over recall; surface confidence; allow manager dismissal without penalty.
- **G3.4 No AI-derived signals in v1.** "Predicted to upgrade", "likely to complain", etc. are out of scope. The five named signals are deterministic computations. If AI-derived signals are added later, they require explainability + a separate RAI pass — see rai-inventory.md Explainability dimension.
- **G3.5 The "signals not PII" line is fuzzier than the brief suggests.** Communicated honestly to operator and DPO.

---

## Cross-cutting requirements

These apply across all three phases. Where a phase-specific requirement above says "see cross-cutting," the detail lives here.

### Multi-tenancy

- **C1** Each operator's data is fully isolated. No cross-operator queries, no shared keys, no analytics that aggregate across operators without explicit contractual consent.
- **C2** Within an operator, brand isolation respects the operator's data model. Multi-brand groups feeding one Airship is a known constraint (insights.md:71, "you can't have multiple um pogle accounts feeding into airship despite it literally being like sister platforms"). Phase 1's gift-card adapter must handle multi-brand operators where the gift card source is single-tenant.

### Observability (without PII leakage)

- **O1** Application logs are PII-free. Identifiers are hashed; message contents are never logged.
- **O2** Per-lookup latency, per-verification-message delivery state, per-redemption success rate are first-class metrics.
- **O3** Failure mode dashboard for SRE: provider failures (SMS/email), API failures (Airship/Toggle), auth failures (staff sign-in), audit log write failures.

### Out of scope (explicit)

The following are **out of scope for the first delivery of all three phases**. State them in the developer brief so they don't become scope creep:

- AI-derived or ML-predicted signals (any signal not deterministically computable from a transaction record).
- Cross-operator pattern detection ("this guest is a regular at three of your brands").
- Wallet pass (Apple Wallet / Google Wallet) integration — that is use case #2.
- Till-side redemption changes — the FOH companion hands off to the operator's existing voucher-redeem flow on the till.
- Multi-language UI.
- Offline mode (the PWA must be online to function).
- Manager performance analytics derived from the staff audit log (e.g. "who's redeemed the most" league tables). The log exists for audit, not management.

---

## RAI inventory deltas — new entries this product creates

Follow workspaces/Ant_-_Toggle/rai-inventory.md's six-dimensional format (Considerations / Unknowns / Potential Issues / Ownership). Below are the new entries this product introduces. They should be added to the inventory **before** any phase ships.

| Dimension | New entries |
|---|---|
| **Privacy & Security** | Venue-scoped staff role and audit-log surface. PII minimisation on the manager UI. Identifier hashing in logs. DSAR-ability of FOH lookup activity. Cross-border data flow if any component hosts outside UK. Consent capture format for new-guest capture (Phase 2). Re-identification risk from signal-layer combinations (Phase 3). |
| **Safety** | Verification mechanic timeout handling — what happens when the customer doesn't confirm. Fallback PIN flow rate-limit and abuse signals. Staff-lookup audit anomaly detection (unusual patterns flagged to head office). |
| **Transparency** | What the guest sees about why they received a verification message. What the guest sees about why their signal profile is visible to staff (and how to opt out — P3.3). What the manager sees about why a guest was flagged as a known regular (provenance per signal). |
| **Explainability** | Per-signal source-row provenance — the recency value was derived from booking X on date Y; the spend-bracket value was derived from N transactions in the last 12 months. Not AI-derived in v1, so explainability is mechanical, but the surface must exist so that AI-derived signals (later) inherit the affordance. |
| **Veracity & Robustness** | Deduplication failure modes (G2.2). Identifier collision across brands (G2.4). Detection false positives (G3.3). Provider failures (G3.2) — when WiFi or booking integration silently degrades, the signal layer must fail closed. |
| **Fairness** | Detection-source bias: booking-based detection favours guests who book; WiFi-based detection favours guests with smartphones connected to venue WiFi. Operators in venues where significant guest cohorts neither book nor use WiFi (walk-ins, older demographics) will have systematically thinner data on those cohorts. State this honestly to operators. |

---

## Pre-build gotchas — confirm with Airship/Toggle engineering before any code

These are build-blocking unknowns. None of them are sprint-sized. Resolving them is the prerequisite to a credible v1 timeline.

1. **Venue-scoped staff role in Airship.** Confirm: does it exist, can it be configured, or must it be built? If built, owner and timeline.
2. **Lookup-by-identifier endpoints.** Confirm: Airship voucher lookup by mobile/email — exists? Toggle gift card lookup by mobile/email — exists? Rate limits? Latency? Pagination?
3. **Verification message primitive.** Confirm: native flow or build on raw send endpoints? Cost per message (SMS especially) at expected volumes. Provider selection if building.
4. **Contact creation endpoint with consent.** Confirm: minimum fields, consent capture format, write-back behaviour into Airship as a first-class record.
5. **Booking system webhooks for the pilot operator.** What does the operator run? Does it expose a "booking arrived" event we can hook?
6. **WiFi detection for the pilot operator.** What does the operator run? Same question.
7. **Audit log infrastructure.** Is there an existing append-only audit log surface in Airship we can write to, or build new? 7-year retention story confirmed with platform team.
8. **DPO contact at the pilot operator.** Schedule a Phase-1-pre-pilot session — lawful basis, retention, DSAR, consent UX all need their sign-off.
9. **SMS provider and email provider** (currently SparkPost — see insights.md:80 for the 60-day event-retention caveat). For the verification mechanic, 60-day retention is enough, but confirm.

---

## Verification / acceptance

How to test the product end-to-end at pilot, in the same shape as the existing use-case files would expect.

### Phase 1 acceptance scenarios

- **AC1.1** Manager looks up known guest with valid voucher. Guest confirms. Manager redeems on till. All events in audit log.
- **AC1.2** Manager looks up identifier not in system. Manager is offered new-guest capture (Phase 2). Audit log captures the no-match lookup.
- **AC1.3** Manager triggers verification. Guest does not confirm within 5 min. Flow expires cleanly. Manager can retry; audit log captures both attempts.
- **AC1.4** Manager triggers verification. SMS provider returns delivery failure. Manager sees the failure immediately and can offer the email fallback if the guest has provided one.
- **AC1.5** Two managers look up the same guest simultaneously. Both see consistent state. Only one redemption succeeds; the other sees a conflict.
- **AC1.6** Head office force-revokes a manager's device. The device's next request returns "unauthorised" and the PWA logs the manager out.
- **AC1.7** Auditor requests the staff-lookup log for a date range. Export is complete, signed, and contains all required fields.

### Phase 2 acceptance scenarios

- **AC2.1** Manager captures a new guest. Guest acknowledges on own device. Contact lands in Airship with venue + staff + consent tagging.
- **AC2.2** Manager attempts to capture an identifier that already exists. System refuses and routes to lookup.
- **AC2.3** Guest's device fails to load the consent screen. No contact is created. Manager sees a clear "consent not captured — try again" message.

### Phase 3 acceptance scenarios

- **AC3.1** Known regular enters the venue (booking-matched). Notification fires within 60s of the trigger. Manager sees the five signals, no PII.
- **AC3.2** Operator turns off "last item ordered" in tenant config. That signal no longer appears in any notification.
- **AC3.3** Guest opts out of the signal layer. No notifications fire for this guest's future visits.
- **AC3.4** False positive: the booking webhook fires for a guest who has not arrived. Manager dismisses without penalty. The dismissal is logged.

### Pilot success criteria (90 days)

- ≥ 1 named pilot operator live across ≥ 2 venues.
- ≥ 500 successful lookup-verify-redeem cycles across the pilot.
- Zero PII exposures in the staff UI (verified by red-team review).
- Verification mechanic refusal rate (guests who don't confirm) tracked and < 15%.
- Persona research with ≥ 3 venue managers complete; PS4 promoted from provisional to evidenced, or the use case re-scoped on the findings.

---

## Recommended sequence

1. **Weeks 0–4 (parallel with persona research)** — Pre-build gotchas resolution. Engineering-level conversations with Airship + Toggle to nail the auth model, the lookup endpoints, the verification primitive. DPO conversation at the pilot operator. Persona interviews against PS4.
2. **Weeks 4–12** — Phase 1 build. Venue-scoped role, unified lookup orchestration, verification mechanic, audit log, manager PWA.
3. **Weeks 12–14** — Phase 1 pilot at one venue. Red-team review for PII exposure. Acceptance scenarios AC1.1–AC1.7.
4. **Weeks 14–20** — Phase 2 build. New-guest capture with consent flow. Acceptance scenarios AC2.1–AC2.3.
5. **Weeks 20–24** — Phase 2 pilot.
6. **Weeks 24–32** — Phase 3 build. Detection adapters (booking, then WiFi). Signal layer with the five named signals. Per-tenant configuration. Re-identification assessment.
7. **Weeks 32–34** — Phase 3 pilot. Acceptance scenarios AC3.1–AC3.4.
8. **Week 34+** — Reconcile with use case #6 (Gift Intelligence Layer) on shared substrate. Decide whether to evolve the signal layer toward AI-derived signals — if so, that triggers a fresh RAI pass.

Timeline is indicative. The pre-build gotchas (especially venue-scoped role and the lookup endpoint architecture) can extend Weeks 0–4 materially; treat the resolution of those as the pacing constraint, not the Phase 1 build duration.

---

## Critical files referenced

- workspaces/Ant_-_Toggle/problem-statements.md — PS3 (Mark, controls/audit thinking) + PS4 (Tom, the problem this product solves)
- workspaces/Ant_-_Toggle/use-cases.md — row #8 (this use case), row #6 (signal-layer overlap — Gift Intelligence Layer)
- workspaces/Ant_-_Toggle/use-cases/foh-companion.md — the scaffold this plan extends
- workspaces/Ant_-_Toggle/use-cases/liability-cockpit.md — Mark's controls model that transfers to FOH staff-lookup audit log
- workspaces/Ant_-_Toggle/rai-inventory.md — the six-dimensional RAI format the plan extends
- workspaces/Ant_-_Toggle/personas/sophie-group-marketing-manager.md — the head-office stakeholder whose conditions shape Phase 2
- workspaces/Ant_-_Toggle/personas/mark-financial-controller.md — the audit-and-controls stakeholder whose conditions shape the staff audit log
- workspaces/Ant_-_Toggle/insights.md — platform-constraint signals (Sparkpost 60-day, multi-brand-breaks-Airship, bulk-ops integrity)
- workspaces/Ant_-_Toggle/clusters.md — original FOH Web App roadmap context (:173, 178)

---

## Final note — what this plan does not do

This plan stops at "what to build, how it must behave, what to confirm before building, what's out of scope, how to verify." It does **not** include: visual design, tech-stack choices (framework, hosting, SMS provider selection), commercial pricing, sales channel. Those are the next layer down, owned by the engineering and commercial teams respectively.

It also assumes the persona research runs in parallel — and that the plan's confident-sounding requirements will be adjusted if persona interviews produce surprises. The interview guide is in workspaces/Ant_-_Toggle/use-cases/foh-companion.md under the "Tom — primary user, provisional" section.
