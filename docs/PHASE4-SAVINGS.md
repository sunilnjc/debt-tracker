# Phase 4 — Savings Era: After Debt-Free

*Phases 1–3 were about getting out of debt. Phase 4 is about what comes after
March 2027: watching savings accumulate toward staged targets, understanding
where the money actually went over time, and being able to get your data out.*

Related: [SPEC.md](SPEC.md) · [ISSUES.md](ISSUES.md) (backlog: BT-040 … BT-042)

---

## 1. Goal

Turn the plan's savings section (SPEC §8 / financial plan §8) into something the
app tracks automatically: projected dates for hitting each savings stage, a view
of spending trends by category over time, and a one-click data backup.

## 2. In scope / out of scope

| In (Phase 4) | Out (later / never) |
|---|---|
| Savings stages (5k → 15k → 24k → 72k) with projected achievement months | A separate "savings account balance" the user maintains by hand |
| Spending trends: category totals across a month range | Charting libraries / interactive graphs (a clean table is enough) |
| Data export (JSON backup of all collections) | Automated cloud backup / scheduled export |
| CSV export of expenses | Import / restore-from-backup (a future phase if needed) |

## 3. The key insight: savings = the buffer after debt-free

The projection engine already tracks a cumulative `buffer` per month — money not
owed to anyone. While in debt it dips (rent-cheque months) and recovers; after
the debt-free month it only climbs. So a savings target is "reached" the first
projected month where `buffer >= target`. No new engine state is needed — just a
pure function reading the existing buffer trajectory over a longer horizon
(the projection endpoint already supports up to 36 months).

Default targets (from the plan, SPEC §3.6):

| Stage | Amount (AED) | Meaning |
|---|---|---|
| 1 | 5,000 | Emergency buffer |
| 2 | 15,000 | — |
| 3 | 24,000 | ~1 month of expenses |
| 4 | 72,000 | ~3 months of expenses |

## 4. Build order

### Step 1 — Savings forecast (BT-040)
- `engine/savings.ts`: pure `forecastSavings(months, targets)` → for each target,
  the first month its `buffer` is reached (or null). Plus the final projected
  buffer at the end of the horizon.
- `GET /api/savings?months=36`: run the projection over the horizon, return the
  forecast.
- Web: `SavingsTracker` — one row per stage with projected achievement month and a
  progress bar (end-of-horizon buffer vs. target).

### Step 2 — Spending trends (BT-041)
- `engine/trends.ts`: pure `spendingTrends(expenses, months)` → per-category
  totals for each month in the range (categories = rows, months = columns).
- `GET /api/expenses/trends?from=YYYY-MM&to=YYYY-MM`.
- Web: `SpendingTrends` — a table (category × month) with a total column, plus a
  simple inline bar per cell so heavy months stand out. No chart library.

### Step 3 — Data export (BT-042)
- `GET /api/export` → JSON dump of every collection (recurring items, one-time
  events, debts, deferments, expenses, month-closes, debt-payments).
- `GET /api/export/expenses.csv` → expenses as CSV.
- Web: a "Download backup" button (JSON) and "Export expenses (CSV)" button that
  fetch and trigger a browser download. No server-side file writes.

## 5. Definition of done

- [ ] Savings tracker shows a projected month for each of the four stages
      (or "beyond horizon"), matching the plan's April-2027 windfall timing
- [ ] Spending trends table shows category totals across a chosen month range and
      matches manual sums for a fixture range
- [ ] "Download backup" produces a JSON file containing all collections
- [ ] "Export expenses" produces a valid CSV
- [ ] `npm test` green in both `server/` and `web/`
