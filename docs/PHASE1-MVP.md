# Phase 1 — MVP: Replace the Excel Tracker

*Scope for the first working version. When this doc's acceptance criteria pass,
Phase 1 is done and `Sunil_Budget_Debt_Tracker.xlsx` is retired.*

Related: [SPEC.md](SPEC.md) (full product spec) · [ISSUES.md](ISSUES.md) (backlog: BT-001 … BT-014)

---

## 1. Goal

A web app that, on first launch, already knows Sunil's entire financial year —
seeded from the July 2026 financial plan — and shows:

1. a **12-month cash flow projection** (the plan's section 6 table, generated),
2. a **debt payoff schedule** (section 7 table, generated),
3. every number **editable in place**, with instant recalculation.

No expense tracking yet. No scenarios yet. Just: the plan, alive instead of static.

## 2. In scope / out of scope

| In (Phase 1) | Out (later phases) |
|---|---|
| Seeded recurring items, one-time events, debts, deferments | Daily expense entry (Phase 2) |
| Projection engine + debt waterfall | Scenario mode / salary slider (Phase 3) |
| 12-month projection table UI | Budget vs. actual (Phase 2) |
| Debt dashboard with clear dates | Payment logging with history (Phase 3) |
| CRUD + inline editing for all four models | PWA install (Phase 2) |
| Engine unit tests against the plan's tables | Savings tracker (Phase 4) |
| Free-tier deployment (optional; local `npm run dev` is acceptable) | Auth beyond a shared secret |

## 3. Build order

Work the issues in this order — each step is verifiable before the next starts.

### Step 1 — Scaffold (BT-001)
Monorepo: `server/` (Express + TypeScript, same toolchain as myheartswords-backend:
ts-node + nodemon dev loop, tsc build) and `web/` (Vite + React + TypeScript).
Server boots with a `/health` route; web shows a placeholder page.

### Step 2 — Engine before database (BT-004, BT-005, BT-006)
Build `server/src/engine/` as a **pure TypeScript module** — plain types, no
mongoose, no Express. Develop it against hardcoded seed data with unit tests.

```
project(input: PlanInput, horizonMonths: number): Projection

PlanInput  = { recurringItems, oneTimeEvents, debts, deferments }
Projection = {
  months: MonthProjection[],   // netCashFlow, debtPayments, balances, buffer, flags
  debtFreeMonth: string | null,
  summary: { totalDebt, perDebtClearMonth }
}
```

Waterfall rules (from the plan):
- Positive net cash flow → pay highest-priority debt with balance remaining;
  overflow cascades to the next priority.
- Net cash flow ≤ 0 (rent-cheque months) → **no debt payment**; deficit reduces
  the running buffer.
- Deferment month → target item contributes 0, fee (105) is charged.

**Acceptance test (the whole point):** with seed data, the engine must output
exactly the plan's numbers —

| Check | Expected |
|---|---|
| Jul-26 net | +4,108 |
| Aug-26 net (crypto + rent cheque) | +3,890 |
| Nov-26 net | -3,610 |
| Feb-27 net (deferment) | +11,810 |
| Apr-27 net (deferment) | +23,310 |
| Shruthi cleared | Oct-26 |
| Bhagya & Paul cleared | Dec-26 |
| Arun cleared | Feb-27 |
| Credit card cleared / debt-free | **Mar-27** |

If these pass, the engine is correct. Everything after is plumbing and UI.

### Step 3 — Persistence + seed (BT-002, BT-003)
Mongoose schemas mirroring the engine's plain types (see SPEC §3). A `seed`
script (`npm run seed`) loads the financial plan's numbers. Idempotent — safe to
re-run, wipes and reloads.

### Step 4 — API (BT-007, BT-008)
- `GET /api/projection?months=12` — loads data, runs engine, returns Projection.
- CRUD: `GET/POST/PUT/DELETE` for `/api/recurring-items`, `/api/one-time-events`,
  `/api/debts`, `/api/deferments`.
- No auth locally; if deployed publicly, a single shared-secret header (BT-013).

### Step 5 — Web UI (BT-009, BT-010, BT-011)
Two views, one page, table-first (function over polish):

**Projection table** — rows = months, columns = salary, one-time, EMI, fixed
costs, rent cheque, net cash flow, debt payments, remaining debt. Row highlights:
rent-cheque months (red tint), deferment months (green tint), debt-cleared
months (🎉 badge).

**Debt dashboard** — card per creditor: balance, priority, projected clear month.
Header: total remaining debt + projected debt-free date, big and unmissable.

**Inline editing** — click any seeded amount (salary, a fixed cost, a debt
balance…) → edit → save → projection refetches and re-renders. Under a second.

### Step 6 — Deploy (BT-012, optional)
MongoDB Atlas free tier + Render/Railway free tier + static hosting for web.
Local-only is acceptable to close Phase 1; deployment can trail into Phase 2.

## 4. Definition of done

- [ ] Engine unit tests pass, including the full acceptance table above
- [ ] `npm run seed` then `GET /api/projection` returns the plan's 12 months
- [ ] Projection table and debt dashboard render the seeded plan
- [ ] Editing salary to 40,000 moves the debt-free date earlier — visibly, instantly
- [ ] Adding/removing a one-time event updates the affected month
- [ ] README covers: install, seed, run dev, run tests
- [ ] Total recurring cost: 0 AED

## 5. Estimated effort — the 4-evening plan

Working product on localhost in 4 evenings (~2–3 focused hours each).
Granular per-issue checklists live in [ISSUES.md](ISSUES.md).

| Evening | Theme | Issues | End state |
|---|---|---|---|
| 1 | "It computes" | BT-001, BT-004 | Scaffold done; engine prints Jul-26 = +4,108 |
| 2 | "It's correct" | BT-005, BT-006 | Waterfall + tests prove debt-free Mar-27 |
| 3 | "It serves" | BT-002, BT-003, BT-007, BT-008 | Seeded DB; projection + CRUD over HTTP |
| 4 | "You can see it" | BT-009, BT-010, BT-011 | Table + dashboard + inline editing. **MVP done.** |

If evening 2 spills over, let it — a correct engine makes the rest plumbing.
If inline editing doesn't fit in evening 4, it's a fine fifth evening.
Deployment (BT-012/BT-013) is stretch, after the local MVP works.

## 6. First implementation command

When ready to start:

> "Start Phase 1 — step 1 and 2: scaffold the repo and build the projection
> engine with the acceptance tests."
