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

| ID | Title | Priority | Status |
|---|---|---|---|
| BT-020 | Expense model + `POST /api/expenses` | P2 | todo |
| BT-021 | Web: fast expense entry form (<5 s, mobile-first) | P2 | todo |
| BT-022 | Budget vs. actual per category, per month | P2 | todo |
| BT-023 | Month close-out: freeze actuals, projections roll forward | P2 | todo |
| BT-024 | PWA manifest + installable on phone home screen | P2 | todo |

## Phase 3 — Levers

| ID | Title | Priority | Status |
|---|---|---|---|
| BT-030 | Scenario mode: projection with overrides (no data mutation) | P2 | todo |
| BT-031 | Web: salary-hike slider → live debt-free date | P2 | todo |
| BT-032 | Debt payment logging + waterfall recompute from actuals | P2 | todo |
| BT-033 | Deferment planner: toggle months, enforce 2/year non-consecutive rule | P2 | todo |
| BT-034 | Debt-free progress bar (total paid / 53,500) | P2 | todo |
| BT-035 | INR→AED rate refresh for Arun debt (manual or free API) | P2 | todo |

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
- 2026-07-09 — Pushed to github.com/sunilnjc/debt-tracker (merged remote LICENSE).
- 2026-07-09 — BT-001 done. Toolchain notes: machine Node 16 replaced with Homebrew Node 26 (old binary kept at /usr/local/bin/node16.bak); ts-node/nodemon swapped for tsx (ts-node is incompatible with TypeScript 7).
- 2026-07-09 — BT-004, BT-005, BT-006 done. 38 tests green; engine reproduces the plan (debt-free 2027-03). Deliberate divergence: engine charges the 105 AED deferment fee the plan tables omit, so Feb-27 nets 11,705 (plan: 11,810) and Apr-27 nets 23,205 (plan: 23,310).
