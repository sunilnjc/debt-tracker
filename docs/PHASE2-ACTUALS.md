# Phase 2 — Actuals: Daily Expense Tracking

*Scope for the second build phase. Phase 1 gave you the projection — a plan
for the year. Phase 2 gives you the log — what actually happened — and lets
you compare the two.*

Related: [SPEC.md](SPEC.md) (full product spec) · [ISSUES.md](ISSUES.md) (backlog: BT-020 … BT-024)

---

## 1. Goal

Log a day's spending in under 5 seconds, then see — per category, per month —
budgeted vs. actual. No new insight requires opening a spreadsheet.

## 2. In scope / out of scope

| In (Phase 2) | Out (later / never) |
|---|---|
| Expense model + CRUD | Bank statement import (manual entry is fine at this scale) |
| Fast entry form (amount, category, date, note) | Receipt photo capture / OCR |
| Budget vs. actual per category, per month | Multi-currency actuals (AED only) |
| Month close-out (lock a month's actuals) | Automated recurring-expense detection |
| PWA install (home-screen icon, works offline for reads) | Push notifications / reminders |

## 3. Domain model addition

### Expense
A single logged spend — the thing Phase 1 didn't have.

| Field | Type | Example |
|---|---|---|
| id | string (ObjectId) | auto |
| amount | number, positive | `45` |
| category | string | must match a `fixed_cost`-category RecurringItem id, or `"other"` |
| date | YYYY-MM-DD | `2026-07-15` |
| note | string, optional | "extra groceries" |

Category is intentionally just a string matching an existing RecurringItem id
(`grocery`, `petrol`, `dewa`, …) rather than a new enum — one less thing to
keep in sync when fixed costs change.

## 4. Build order

### Step 1 — Expense model + API (BT-020)
Mongoose schema, generic `crudRouter` reuse for `/api/expenses` (same pattern
as Phase 1's four models — no new abstraction needed).

### Step 2 — Fast entry form (BT-021)
One form: amount, category `<select>` (options = fixed-cost RecurringItems +
"other"), date (defaults to today), optional note. Submit → POST → clear form,
stay on the page. Target: two taps/keystrokes plus submit.

### Step 3 — Budget vs. actual (BT-022)
`GET /api/expenses/summary?month=YYYY-MM` — group expenses by category, sum
amounts, join against that month's budgeted fixed-cost amounts. Web: a table —
category, budgeted, actual, delta (over/under, colored).

### Step 4 — Month close-out (BT-023)
Deliberately scoped down for Phase 2: "close" a month by recording its actual
total net cash flow (income assumed as planned + real one-time events actually
logged - actual expense total - actual EMI/debt payments) as a read-only
snapshot. This is a **display feature**, not a rewrite of the projection
engine — the engine stays the single source of forward-looking truth. Closed
months show actual vs. projected side by side in the projection table.

> Full "projections roll forward using actuals" (e.g., auto-adjusting future
> grocery budget from a 3-month actual average) is out of scope for Phase 2 —
> revisit in Phase 3 scenario mode if the manual comparison isn't enough.

### Step 5 — PWA (BT-024)
`vite-plugin-pwa`, manifest with name/icons/theme color, `registerType:
'autoUpdate'`. Enough to "Add to Home Screen" on a phone; offline support is a
bonus, not a requirement (the app needs the API to be useful anyway).

## 5. Definition of done

- [ ] Logging an expense takes under 5 seconds end to end (form → saved)
- [ ] Budget vs. actual table matches manual arithmetic for a test month
- [ ] Closing a month locks its actuals; the projection table shows the
      comparison for closed months
- [ ] App installs to a phone home screen via the browser's install prompt
- [ ] `npm test` green in both `server/` and `web/`
