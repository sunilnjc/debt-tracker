# BudgetTracker — Product Specification

*Version 0.1 — July 2026*
*Owner: Sunil*

---

## 1. Why this app exists

Off-the-shelf budgeting apps (Wallet, Money Lover, YNAB) model a simple world:
recurring income, recurring bills, daily expenses. Sunil's real financial life has
four things they handle badly or not at all:

1. **Irregular known-future events** — rent paid via 4 post-dated cheques per year,
   a one-time Tabby payment, a planned crypto cash-out. These are *known in advance*
   but not monthly-recurring.
2. **Debt payoff as a first-class feature** — five creditors (mostly informal,
   friends/family) with explicit priorities, paid via a waterfall: whatever cash is
   left each month goes to the highest-priority remaining debt.
3. **Loan deferment logic** — Emirates NBD allows 2 deferments per loan cycle year;
   a deferred month has zero EMI and shifts cash flow downstream.
4. **AED-first, INR-aware** — one debt is denominated in INR (3 lakh ≈ 13,500 AED)
   and its AED value floats with the exchange rate.

The app's core object is therefore **not the transaction** — it is the
**projected monthly cash flow**. Actual expenses, once entered, refine the
projection. The killer feature is answering, instantly:

> *"When am I debt-free, and what happens to that date if X changes?"*

## 2. Product principles

- **Single user.** No auth screens, no multi-tenancy, no sharing. It's Sunil's app.
- **Projection first, tracking second.** Day one, the app already knows the whole
  year ahead (seeded from the financial plan). Daily expense entry comes later.
- **Every number editable, every edit recalculates.** Change salary → debt-free
  date updates. Toggle a deferment → all downstream months update.
- **Stupid-fast expense entry.** When tracking arrives (Phase 2), logging an
  expense must take under 5 seconds: amount, category, done.
- **Free to run.** Free-tier hosting or local-first. Zero recurring cost.

## 3. Domain model

### 3.1 RecurringItem
A cash flow that repeats monthly (or on a fixed schedule).

| Field | Type | Example |
|---|---|---|
| id | string | `salary` |
| name | string | "Monthly Salary" |
| amount | number (AED, signed) | `+32000`, `-15420` |
| category | enum | `income`, `loan_emi`, `fixed_cost` |
| frequency | enum | `monthly` (later: `quarterly`, `yearly`) |
| startMonth | YYYY-MM | `2026-07` |
| endMonth | YYYY-MM \| null | null = open-ended |
| notes | string | "Emirates NBD personal loan" |

Seed data (from financial plan): salary +32,000; loan EMI -15,420; tithe -3,000;
home transfer -3,600; postpaid & internet -740; DEWA -90; petrol -300;
grocery -600; house cleaning -200; car cleaning -160.

### 3.2 OneTimeEvent
A dated, non-recurring cash flow, known in advance.

| Field | Type | Example |
|---|---|---|
| id | string | `tabby-final` |
| name | string | "Tabby final payment" |
| amount | number (signed) | `-3782` |
| month | YYYY-MM | `2026-07` |
| status | enum | `planned`, `done`, `cancelled` |

Seed data: Tabby -3,782 (Jul-26); crypto cash-out +11,000 (Aug-26);
rent cheque #1 -15,000 (Aug-26); rent cheques #2-#4 -11,500 each
(Nov-26, Feb-27, May-27).

> Rent cheques are modeled as OneTimeEvents (not recurring) because amounts differ
> (#1 includes commission) and dates shift with lease renewal. A future enhancement
> may add a "cheque series" generator.

### 3.3 Debt

| Field | Type | Example |
|---|---|---|
| id | string | `shruthi` |
| creditor | string | "Shruthi" |
| originalAmount | number | `20000` |
| currentBalance | number | `20000` |
| priority | int (1 = first) | `1` |
| currency | enum | `AED`, `INR` |
| fxRate | number \| null | INR→AED rate used for display (Arun only) |
| payments | Payment[] | logged repayments |

Seed data: Shruthi 20,000 (P1); Bhagya 5,000 (P2); Paul 5,000 (P3);
Arun 300,000 INR ≈ 13,500 AED (P4); Credit Card 10,000 AED (P5).

### 3.4 Deferment

| Field | Type | Example |
|---|---|---|
| id | string | `def-jan27` |
| targetItemId | string | `loan-emi` |
| month | YYYY-MM | `2027-01` |
| fee | number | `105` |
| status | enum | `planned`, `confirmed`, `used` |

Effect: the target RecurringItem contributes 0 in that month; the fee is charged.
Constraint (informational, not enforced in MVP): max 2 per loan cycle year,
non-consecutive.

### 3.5 Expense (Phase 2)
Actual daily spending. `amount`, `category`, `date`, `note`. Monthly totals per
category are compared against the budgeted RecurringItem amounts.

### 3.6 SavingsTarget (Phase 3)
Staged goals: 5,000 → 15,000 → 24,000 → 72,000 AED, with projected achievement
dates derived from post-debt-free cash flow.

## 4. Core computation: the projection engine

Pure function — no I/O, fully unit-testable:

```
project(recurringItems, oneTimeEvents, debts, deferments, horizonMonths)
  → MonthProjection[]
```

For each month in the horizon:

1. **Net cash flow** = Σ recurring items active that month (respecting deferments,
   which zero out the deferred item and subtract the fee) + Σ one-time events that
   month (status ≠ cancelled).
2. **Debt waterfall**: if net cash flow > 0, allocate it to the
   highest-priority debt with remaining balance; overflow cascades to the next
   priority. If net cash flow ≤ 0 (rent-cheque months), no debt payment — the
   deficit is absorbed by prior surplus (tracked as running buffer).
3. **Outputs per month**: net cash flow, debt payments made (per creditor),
   balances after, running buffer, and flags (`rent_cheque_month`,
   `deferment_month`, `debt_cleared: [names]`).
4. **Summary outputs**: projected debt-free month, total interest-free months,
   savings-phase start month.

The engine must reproduce the hand-built tables in the financial plan
(sections 6 & 7): debt-free by **March 2027** with current inputs. That table is
the acceptance test.

### Scenario mode (Phase 3)
`project()` takes overrides (e.g., salary = 40,000 from 2026-09) without mutating
stored data. Powers the "what if I get a raise?" slider:

| Scenario | Free cash/month | Debt-free by |
|---|---|---|
| Current | 7,890 | Mar 2027 |
| +5,000 hike | 12,890 | ~Jan 2027 |
| +9,000 hike | 16,890 | ~Nov 2026 |

## 5. Architecture

| Layer | Choice | Rationale |
|---|---|---|
| Language | TypeScript everywhere | Already fluent (myheartswords stack) |
| Backend | Express + TypeScript | Same skeleton as existing project |
| DB | MongoDB (Atlas free tier) | Familiar (mongoose); free |
| Frontend | React (Vite) — single page to start | Table-first UI; PWA later |
| Hosting | Render/Railway free tier (API) + static host | Zero cost |
| Auth | **None in MVP** | Single user; add simple token later if deployed publicly |

Monorepo layout:

```
budgettracker/
├── docs/           # this documentation
├── server/         # Express API + projection engine
│   └── src/
│       ├── engine/     # pure projection functions (no I/O)
│       ├── models/     # mongoose schemas
│       ├── routes/
│       └── seed/       # financial-plan seed data
└── web/            # React app (Phase 1: projection table + debt dashboard)
```

Key design rule: **the projection engine is a pure module** with zero dependency
on Express or Mongo. It can be unit-tested standalone and later moved into the
browser for a local-first version.

## 6. Phased roadmap

| Phase | Theme | Deliverable |
|---|---|---|
| **1 — MVP** | Replace the Excel tracker | Seeded data, projection engine, 12-month table + debt payoff view, edit any number, CRUD for items/events/debts. See [PHASE1-MVP.md](PHASE1-MVP.md). |
| **2 — Actuals** | Daily habit | Expense entry (<5 s), budget vs. actual per category, month close-out (projections become actuals), PWA install. |
| **3 — Levers** | Decisions | Scenario mode + salary slider, deferment toggles, debt payment logging with waterfall recompute, debt-free progress bar, INR rate refresh. |
| **4 — Savings era** | Post-March-2027 | Savings stages tracker, emergency-fund progress, spending trend reports, data export. |

## 7. Non-goals (deliberate)

- Bank/API integrations, statement imports (manual entry is fine at this scale)
- Multi-user, sharing, permissions
- Native mobile apps (PWA is sufficient)
- Investment tracking (the crypto lesson has been learned)
- Notifications/reminders (maybe Phase 4+; calendar handles due dates today)

## 8. Success criteria

1. The Excel tracker (`Sunil_Budget_Debt_Tracker.xlsx`) is retired.
2. Projection matches the hand-built plan exactly on seed data (debt-free Mar 2027).
3. Any input change reflects in the projection in under a second.
4. Running cost: 0 AED/month.
5. (Phase 2) Expenses logged on ≥ 25 days/month — the habit sticks.
