# BudgetTracker — Issue Backlog

Working issue tracker until the repo moves to GitHub Issues.
Conventions: `BT-###` id, one line per status change in the log.
Statuses: `todo` → `in-progress` → `done` (or `blocked` / `wontfix`).

Priorities: **P0** = MVP blocker · **P1** = MVP nice-to-have · **P2** = later phase

---

## Phase 1 evening plan

Target: **working product on localhost in 4 evenings** (~2–3 focused hours each).
Deployment (BT-012/BT-013) is deliberately excluded — local is the Phase 1 finish line.

| Evening | Theme | Issues | You end the evening with… |
|---|---|---|---|
| **1** | "It computes" | BT-001, BT-004 | Repo scaffolded; engine computes net cash flow per month; a scratch script prints Jul-26 = +4,108 |
| **2** | "It's correct" | BT-005, BT-006 | Debt waterfall done; full test suite proves the engine reproduces the plan — debt-free **Mar-27** |
| **3** | "It serves" | BT-002, BT-003, BT-007, BT-008 | Mongo schemas + seed; `GET /api/projection` returns your year as JSON; CRUD works via curl |
| **4** | "You can see it" | BT-009, BT-010, BT-011 | Projection table + debt dashboard in the browser; edit salary → debt-free date moves. **MVP done.** |

Stretch (only if an evening finishes early): BT-014 (buffer warnings), then BT-012 (deploy).

> Evenings 1–2 are the hard, valuable part. If evening 2 spills over, let it —
> a correct engine makes evenings 3–4 pure plumbing. Evening 4 is the longest;
> if inline editing (BT-011) doesn't fit, it's a fine fifth evening on its own.

---

## Phase 1 — MVP issues (granular)

### BT-001 · Scaffold monorepo — P0 · **done**
*Evening 1 · ~45 min*

- [ ] 1. `mkdir server` → `npm init -y`; install `express cors dotenv mongoose`
      and dev deps `typescript ts-node nodemon vitest @types/express @types/cors @types/node`
- [ ] 2. Add `server/tsconfig.json` (strict mode on) and scripts:
      `dev` (nodemon + ts-node), `build` (tsc), `test` (vitest) — mirror the
      myheartswords-backend setup you already know
- [ ] 3. `server/src/index.ts`: Express app with `GET /health` → `{ ok: true }`;
      verify with `curl localhost:4000/health`
- [ ] 4. `npm create vite@latest web -- --template react-ts`; verify `npm run dev`
      shows the Vite page on :5173
- [ ] 5. Add `web/vite.config.ts` proxy: `/api` → `http://localhost:4000`
- [ ] 6. Commit: "scaffold server and web"

**Done when:** both dev servers run side by side; `/health` responds.

### BT-004 · Projection engine: monthly net cash flow — P0 · **done**
*Evening 1 · ~90 min · pure TypeScript, no Express/Mongo imports*

- [ ] 1. `server/src/engine/types.ts`: plain interfaces — `RecurringItem`,
      `OneTimeEvent`, `Debt`, `Deferment`, `MonthProjection`, `Projection`
      (field lists in [SPEC.md §3](SPEC.md))
- [ ] 2. `server/src/engine/month.ts`: `YYYY-MM` helpers — `addMonths`,
      `compareMonths`, `monthRange(start, count)` (+ 3-4 quick unit tests;
      date math is where silent bugs live)
- [ ] 3. `server/src/engine/seed-data.ts`: the full plan as typed constants —
      10 recurring items, 6 one-time events, 5 debts, 2 deferments
      (copy numbers from [FINANCIAL-PLAN-2026.md](FINANCIAL-PLAN-2026.md))
- [ ] 4. `server/src/engine/cashflow.ts`: `netCashFlowForMonth(month, items, events, deferments)` —
      sum recurring items active that month (startMonth ≤ m ≤ endMonth);
      a deferment zeroes its target item and charges the 105 fee;
      add one-time events in that month (skip `cancelled`)
- [ ] 5. Scratch check `server/src/engine/dev-run.ts` (run with ts-node):
      print 12 months — eyeball Jul-26 = **+4,108**, Aug-26 = **+3,890**,
      Nov-26 = **-3,610**, Feb-27 = **+11,810**, Apr-27 = **+23,310**
- [ ] 6. Commit: "engine: monthly net cash flow"

**Done when:** the five eyeball numbers match the plan.

### BT-005 · Projection engine: debt payoff waterfall — P0 · **done**
*Evening 2 · ~90 min*

- [ ] 1. `server/src/engine/waterfall.ts`: `allocate(surplus, debtBalances)` —
      pay highest-priority debt with balance > 0; overflow cascades to next;
      returns payments made + updated balances (pure function, easy to test)
- [ ] 2. Rule: net cash flow ≤ 0 → **no debt payment** (rent-cheque months);
      the deficit reduces a running buffer carried month to month
- [ ] 3. `server/src/engine/project.ts`: the main `project(input, horizonMonths)` —
      loop months, compute net cash flow (BT-004), run waterfall, track buffer,
      set flags: `rentChequeMonth`, `defermentMonth`, `debtsCleared: string[]`
- [ ] 4. Summary outputs: `debtFreeMonth`, per-debt clear month, total remaining
- [ ] 5. INR handling: Arun's debt stores 300,000 INR + fxRate; waterfall operates
      on the AED value (`amount / fxRate` rounded) — keep it that simple for MVP
- [ ] 6. Extend `dev-run.ts` to print the payoff schedule; eyeball against plan §7
- [ ] 7. Commit: "engine: debt waterfall and projection summary"

**Done when:** `dev-run.ts` prints Shruthi ✅ Oct-26 … debt-free **Mar-27**.

### BT-006 · Engine acceptance tests — P0 · **done**
*Evening 2 · ~60 min*

- [ ] 1. `server/src/engine/project.test.ts` — vitest, seed data as input
- [ ] 2. Table-driven test: all 12 months' net cash flow equal plan §6 exactly
      (Jul +4,108 … Jun +7,890)
- [ ] 3. Payoff tests: Shruthi clears Oct-26; Bhagya & Paul clear Dec-26;
      Arun clears Feb-27; CC clears Mar-27; `debtFreeMonth === "2027-03"`
- [ ] 4. Waterfall unit tests: overflow cascades across two debts in one month
      (Oct-26 case: Shruthi 4,112 + Bhagya 3,778); zero/negative surplus pays nothing
- [ ] 5. Deferment tests: deferred month contributes 0 EMI, charges 105;
      horizon shorter than debt payoff → `debtFreeMonth: null`
- [ ] 6. Commit: "engine: acceptance tests against financial plan"

**Done when:** `npm test` green. **The engine is now provably your plan.**

### BT-002 · Mongoose schemas — P0 · done
*Evening 3 · ~45 min*

- [ ] 1. `server/src/models/`: `RecurringItem`, `OneTimeEvent`, `Debt`, `Deferment` —
      fields mirror `engine/types.ts` (keep engine types as the source of truth;
      schemas are just persistence)
- [ ] 2. Use stable string ids (`salary`, `shruthi`) as `_id` — makes seed
      idempotency and CRUD URLs trivial
- [ ] 3. `server/src/db.ts`: mongoose connect from `MONGODB_URI` env var;
      `.env.example` checked in, `.env` gitignored
- [ ] 4. Decide local vs. Atlas: **local MongoDB (or Atlas free) — either works;
      pick whichever you have running fastest**
- [ ] 5. Commit: "mongoose schemas and db connection"

**Done when:** server boots, connects, logs "db connected".

### BT-003 · Seed script — P0 · done
*Evening 3 · ~30 min*

- [ ] 1. `server/src/seed/run.ts`: wipe the four collections, insert
      `engine/seed-data.ts` constants (one source of numbers — the engine's)
- [ ] 2. `npm run seed` script; idempotent — safe to re-run any time
- [ ] 3. Verify in mongosh/Compass: 10 recurring items, 6 events, 5 debts, 2 deferments
- [ ] 4. Commit: "seed script with financial plan data"

**Done when:** re-running seed twice leaves exactly one copy of everything.

### BT-007 · Projection API — P0 · done
*Evening 3 · ~30 min*

- [ ] 1. `GET /api/projection?months=12` (default 12, max 36): load all four
      collections, map docs → engine types, call `project()`, return JSON
- [ ] 2. `curl localhost:4000/api/projection | jq '.debtFreeMonth'` → `"2027-03"`
- [ ] 3. Commit: "projection endpoint"

**Done when:** the API returns the same numbers the tests proved.

### BT-008 · CRUD API — P0 · done
*Evening 3 · ~60 min*

- [ ] 1. Generic pattern, four routers: `GET /api/<collection>`,
      `POST` (create), `PUT /:id` (update), `DELETE /:id` —
      collections: `recurring-items`, `one-time-events`, `debts`, `deferments`
- [ ] 2. Minimal validation: amount is a number, month matches `YYYY-MM`,
      priority is a positive int — reject with 400 otherwise
- [ ] 3. Smoke test with curl: bump salary to 40,000 via PUT →
      re-fetch projection → debt-free month moves earlier → PUT it back
- [ ] 4. Commit: "crud routes for all four models"

**Done when:** the curl smoke test in step 3 works end to end.

### BT-009 · Web: projection table — P0 · done
*Evening 4 · ~60 min*

- [ ] 1. Fetch `/api/projection` on load (plain `fetch` + `useState`;
      no state library needed at this size)
- [ ] 2. Table: rows = months; columns = Salary, One-time, Loan EMI, Fixed costs,
      Rent cheque, **Net**, Debt paid (to whom), Remaining debt
- [ ] 3. Row highlights: rent-cheque months red tint, deferment months green tint,
      🎉 badge on debt-cleared months
- [ ] 4. Number formatting: thousands separators, negatives in red
- [ ] 5. Commit: "projection table view"

**Done when:** the browser shows the same table as plan §6, generated live.

### BT-010 · Web: debt dashboard — P0 · done
*Evening 4 · ~45 min*

- [ ] 1. Header banner: total remaining debt + projected **debt-free date** —
      big and unmissable
- [ ] 2. Card per creditor: balance, priority, projected clear month;
      Arun's card shows both INR and AED
- [ ] 3. Simple progress bar per debt (paid / original)
- [ ] 4. Commit: "debt dashboard"

**Done when:** one glance answers "how much left, and when am I free?"

### BT-011 · Web: inline editing — P0 · done
*Evening 4 · ~60 min*

- [ ] 1. Editable amounts list (start with recurring items + debt balances):
      click value → input → Enter saves, Esc cancels
- [ ] 2. On save: `PUT` the change, re-fetch `/api/projection`, re-render —
      target under a second end to end
- [ ] 3. The payoff moment: edit salary 32,000 → 40,000 in the browser and
      watch debt-free move from Mar-27 to ~Jan-27
- [ ] 4. Basic input guard: reject non-numeric, keep old value on API error
- [ ] 5. Commit: "inline editing with live recompute" — **Phase 1 complete 🎉**

**Done when:** Definition of done in [PHASE1-MVP.md §4](PHASE1-MVP.md) is all checked.

### BT-012 · Deployment (free tier) — P1 · todo
*Post-MVP stretch.* Atlas free tier; API on Render/Railway free tier; web on
Netlify/Vercel/Cloudflare Pages. Point web at the deployed API via env var.

### BT-013 · Shared-secret API token — P1 · todo
*Only needed with BT-012.* Single `x-api-key` header checked by middleware;
key in env on both sides. No user accounts.

### BT-014 · Running-buffer warnings — P1 · todo
*Stretch.* Flag any month where the cumulative buffer goes negative (means the
plan needs borrowing) — red warning row in the table. Engine already tracks the
buffer (BT-005); this is a flag + UI treatment.

---

## Phase 2 — Actuals

Full context: [PHASE2-ACTUALS.md](PHASE2-ACTUALS.md). No fixed evening schedule
this round — working through BT-020 → BT-024 in order.

| ID | Title | Priority | Status |
|---|---|---|---|
| BT-020 | Expense model + API | P2 | done |
| BT-021 | Web: fast expense entry form (<5 s, mobile-first) | P2 | done |
| BT-022 | Budget vs. actual per category, per month | P2 | done |
| BT-023 | Month close-out: lock actuals, show alongside projection | P2 | done |
| BT-024 | PWA manifest + installable on phone home screen | P2 | done |

### BT-020 · Expense model + API — P2 · done

- [ ] 1. `server/src/models/expense.ts`: `amount` (positive number), `category`
      (string), `date` (YYYY-MM-DD), `note` (optional) — reuse `isValidMonth`-style
      validator pattern for the date
- [ ] 2. Mount `crudRouter(ExpenseModel)` at `/api/expenses` (same generic router
      as the four Phase 1 models — no new code needed there)
- [ ] 3. `GET /api/expenses?month=YYYY-MM` filter (query by date prefix)
- [ ] 4. curl smoke test: POST an expense, GET it back, DELETE it
- [ ] 5. Commit: "expense model and API"

**Done when:** curl round-trip (POST → GET → DELETE) works for `/api/expenses`.

### BT-021 · Web: fast expense entry form — P2 · done

- [ ] 1. `ExpenseEntryForm` component: amount input, category `<select>`
      (options = fixed-cost recurring items + "other"), date defaults to today,
      optional note
- [ ] 2. Submit → POST `/api/expenses` → clear form, keep focus on amount for
      the next entry (the whole point is rapid consecutive logging)
- [ ] 3. Basic validation: amount must be a positive number
- [ ] 4. Component test: fill form, submit, assert POST payload and cleared state
- [ ] 5. Commit: "fast expense entry form"

**Done when:** logging an expense takes under 5 seconds, form → saved → ready
for the next one.

### BT-022 · Budget vs. actual per category, per month — P2 · done

- [ ] 1. `GET /api/expenses/summary?month=YYYY-MM` — group by category, sum
      amounts, join against that month's budgeted fixed-cost RecurringItem
      amounts (category = "other" has no budget row)
- [ ] 2. Web: `BudgetVsActual` table — category, budgeted, actual, delta
      (colored: over budget red, under budget green)
- [ ] 3. Month picker (defaults to current month)
- [ ] 4. Engine-side test: summary math matches a hand-built fixture month
- [ ] 5. Commit: "budget vs actual view"

**Done when:** the table matches manual arithmetic for a test month with a mix
of over- and under-budget categories.

### BT-023 · Month close-out — P2 · done

- [ ] 1. `MonthClose` model: `month`, `actualNetCashFlow`, `closedAt` — a
      snapshot, not a mutation of the engine's projection
- [ ] 2. `POST /api/month-close` — computes actual net cash flow from that
      month's real expenses + logged debt payments + one-time events marked
      `done`, stores the snapshot
- [ ] 3. Web: projection table shows an "actual" column alongside "projected"
      for any month with a close-out record
- [ ] 4. Guard: closing an already-closed month is a no-op (idempotent), not an error
- [ ] 5. Commit: "month close-out"

**Done when:** closing a month locks its actual number and the projection
table displays projected vs. actual side by side for that month.

### BT-024 · PWA — P2 · done

- [ ] 1. `npm install -D vite-plugin-pwa` in `web/`
- [ ] 2. `vite.config.ts`: add the plugin, `registerType: 'autoUpdate'`,
      manifest (name "BudgetTracker", theme color, two icon sizes)
- [ ] 3. Placeholder icons (simple generated PNG/SVG is fine — no need for
      custom design)
- [ ] 4. Verify: `npm run build` produces a manifest + service worker; Chrome
      DevTools → Application tab shows it as installable
- [ ] 5. Commit: "pwa manifest and install support"

**Done when:** the built app can be added to a phone's home screen.

## Phase 3 — Levers

Full context: [PHASE3-LEVERS.md](PHASE3-LEVERS.md).

| ID | Title | Priority | Status |
|---|---|---|---|
| BT-030 | Scenario mode: projection with overrides (no data mutation) | P2 | todo |
| BT-031 | Web: salary-hike slider → live debt-free date | P2 | todo |
| BT-032 | Debt payment logging + waterfall recompute from actuals | P2 | todo |
| BT-033 | Deferment planner: toggle months, enforce 2/year non-consecutive rule | P2 | todo |
| BT-034 | Debt-free progress bar (total paid / 53,500) | P2 | todo |
| BT-035 | INR→AED rate refresh for Arun debt (manual or free API) | P2 | todo |

### BT-030 · Scenario mode — P2 · todo

- [ ] 1. `POST /api/projection/scenario` — body: `{ months, overrides: { recurringItems?: Record<id, Partial<RecurringItem>> } }`
- [ ] 2. Route loads real stored data (same as `/api/projection`), applies
      overrides in memory (shallow merge by id), calls `project()` — no writes
- [ ] 3. curl smoke test: override salary to 40000, confirm debt-free shifts,
      then confirm `GET /api/recurring-items` still shows the real 32000
- [ ] 4. Commit: "scenario projection endpoint"

**Done when:** the scenario endpoint's output changes with the override but
the database is untouched.

### BT-031 · Web: salary-hike slider — P2 · todo

- [ ] 1. `SalaryScenario` component: range slider (current salary → +15,000),
      debounced (~300ms) call to the scenario endpoint on drag
- [ ] 2. Show resulting debt-free month + delta vs. the real projection
      ("2 months earlier")
- [ ] 3. Component test: mock the API, drag the slider, assert debounced call
      and rendered delta
- [ ] 4. Commit: "salary-hike scenario slider"

**Done when:** dragging the slider updates the shown date live without ever
calling the real (non-scenario) update endpoints.

### BT-032 · Debt payment logging — P2 · todo

- [ ] 1. `DebtPayment` model: `debtId`, `amount`, `date`, `note?`
- [ ] 2. `POST /api/debts/:id/payments` — creates the payment record AND
      decrements that debt's `currentBalance` (single transaction-like flow;
      reject if amount exceeds the current balance)
- [ ] 3. `GET /api/debts/:id/payments` — history for one debt
- [ ] 4. Web: small "Log a payment" form + history list on each debt card
- [ ] 5. curl smoke test: log a payment, confirm balance dropped and
      projection's debt-free date reflects it
- [ ] 6. Commit: "debt payment logging"

**Done when:** logging a payment updates both the balance and a visible
history, and the projection recomputes from the new balance.

### BT-033 · Deferment planner — P2 · todo

- [ ] 1. Server-side validation on `POST /api/deferments`: reject a 3rd
      deferment within a rolling 12-month window, or one landing in a month
      adjacent to an existing deferment, **for the same `targetItemId`** — 400
      with a clear message
- [ ] 2. Web: `DefermentPlanner` — list of existing deferments (target, month,
      fee, status) + a small add form (loan item selector, month picker)
- [ ] 3. Surface the server's rejection message inline on the form
- [ ] 4. curl smoke test: 3rd deferment in a year rejected; adjacent-month
      deferment rejected; a valid one accepted
- [ ] 5. Commit: "deferment planner with rule enforcement"

**Done when:** the two known-bad cases are rejected with a clear message and a
valid deferment still succeeds.

### BT-034 · Debt-free progress bar — P2 · todo

- [ ] 1. Client-side only: `(originalTotalAed - currentTotalAed) / originalTotalAed`
      across all debts, AED-normalized using each debt's `fxRate`
- [ ] 2. Render as a single bar in the debt dashboard banner, alongside the
      existing per-debt bars
- [ ] 3. Component test: fixture debts, assert the computed percentage
- [ ] 4. Commit: "overall debt-free progress bar"

**Done when:** the banner shows a single "X% paid off" bar matching manual
arithmetic on the seed data.

### BT-035 · INR rate refresh — P2 · todo

- [ ] 1. Web: make Arun's `fxRate` editable inline (same `EditableAmount`
      pattern already used for balances)
- [ ] 2. Saving triggers the existing debt PUT + reload, so the AED-converted
      balance shown updates immediately
- [ ] 3. Commit: "editable FX rate for INR debts"

**Done when:** updating the rate changes the displayed AED equivalent without
touching `currentBalance` itself.

## Phase 4 — Savings era

| ID | Title | Priority | Status |
|---|---|---|---|
| BT-040 | Savings stages tracker (5k → 15k → 24k → 72k) | P2 | todo |
| BT-041 | Spending trends report (category over time) | P2 | todo |
| BT-042 | Data export (JSON/CSV backup) | P2 | todo |

---

## Open questions

| ID | Question | Resolution |
|---|---|---|
| Q-1 | Local-first (IndexedDB, no server) vs. server-backed from day one? | **Decided: server-backed** — matches existing skill set; engine stays pure so a local-first port remains possible. |
| Q-2 | How to model rent cheques when lease renews (amounts/dates change)? | Open — MVP treats them as one-time events; revisit at renewal (Aug 2026). |
| Q-3 | Shruthi may accept full 20,000 in September instead of split payments — how to model? | Open — likely a scenario-mode case; for MVP just edit the data if it happens. |
| Q-4 | Fixed INR rate vs. live rate for Arun debt? | MVP: fixed manual rate on the debt record (BT-035 adds refresh later). |

## Log

- 2026-07-09 — Backlog created from SPEC v0.1. All Phase 1 issues opened.
- 2026-07-09 — Phase 1 issues expanded to granular step checklists; 4-evening plan added; git repo initialized.
- 2026-07-10 — Evening 1 (BT-001, BT-004) and Evening 2 (BT-005, BT-006) done: engine matches financial plan exactly, debt-free Mar-27.
- 2026-07-10 — Evening 3 (BT-002, BT-003, BT-007, BT-008) done: mongoose schemas, seed script, projection endpoint, CRUD API — all verified against a local MongoDB.
- 2026-07-10 — Evening 4 (BT-009, BT-010, BT-011) done: projection table, debt dashboard, inline editing. **Phase 1 MVP complete.** Verified via curl end-to-end (web dev server proxying to API) and an automated component test suite (browser preview tool was blocked by a stale port registration from an unrelated chat session).
- 2026-07-10 — Phase 2 (BT-020..BT-024) done: expense model/API, fast entry form, budget-vs-actual view, month close-out (idempotent snapshot), PWA manifest. **Phase 2 complete.** All verified via vitest (server: 47 tests; web: 17 tests) plus curl/preview-build checks. Noted: live local DB's tithe value has drifted to -3,200 vs. the seed/plan's -3,000 — real edited data from earlier UI testing, left as-is pending Sunil's confirmation.
- 2026-07-09 — Pushed to github.com/sunilnjc/debt-tracker (merged remote LICENSE).
- 2026-07-09 — BT-001 done. Toolchain notes: machine Node 16 replaced with Homebrew Node 26 (old binary kept at /usr/local/bin/node16.bak); ts-node/nodemon swapped for tsx (ts-node is incompatible with TypeScript 7).
- 2026-07-09 — BT-004, BT-005, BT-006 done. 38 tests green; engine reproduces the plan (debt-free 2027-03). Deliberate divergence: engine charges the 105 AED deferment fee the plan tables omit, so Feb-27 nets 11,705 (plan: 11,810) and Apr-27 nets 23,205 (plan: 23,310).
