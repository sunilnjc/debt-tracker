# Phase 3 — Levers: Decisions, Not Just Reports

*Phase 1 gave you the plan. Phase 2 gave you the log. Phase 3 gives you the
knob to turn — "what happens if X changes?" answered instantly, since that's
the single highest-leverage thing this app can do (see SPEC.md §9's job-search
scenarios: the whole reason this app exists is to make that question free to ask.)*

Related: [SPEC.md](SPEC.md) · [ISSUES.md](ISSUES.md) (backlog: BT-030 … BT-035)

---

## 1. Goal

Turn a knob (salary, a deferment, a debt balance) and see the debt-free date
move *before* committing the change to real data. Give debt payments a real
history instead of just overwriting a balance. Make the two "informational
only" Phase 1 shortcuts (deferment rules, FX rate) actually useful.

## 2. In scope / out of scope

| In (Phase 3) | Out (later / never) |
|---|---|
| Scenario mode: project with overrides, no DB writes | Multi-scenario comparison / saved scenarios |
| Salary-hike slider showing live debt-free date | Full "what-if" builder UI for every field |
| Debt payment logging (history, not just balance edits) | Automated payment reminders |
| Deferment planner with the 2-per-year/non-consecutive rule enforced | Auto-applying for deferments with the bank |
| Debt-free progress bar (total paid vs. total owed) | — |
| Manual INR→AED rate refresh on the Arun debt | Live FX API integration (still a non-goal — see SPEC §7) |

## 3. Build order

### Step 1 — Scenario mode (BT-030)
`POST /api/projection/scenario` — same shape as `GET /api/projection` but takes
an `overrides` body (partial patches to recurring items, keyed by id) and a
`months` count. Loads real stored data, applies the overrides **in memory
only**, runs `project()`, returns the result. Nothing is written to the DB.
This reuses the pure `project()` engine function entirely — no new engine
code, just a different data-assembly path in the route layer.

### Step 2 — Salary-hike slider (BT-031)
Web: a slider from the current salary to +15,000 AED, calling the scenario
endpoint (debounced ~300ms while dragging) and showing the resulting
debt-free month live, plus the delta ("2 months earlier"). This is
`SPEC.md §9`'s table made interactive.

### Step 3 — Debt payment logging (BT-032)
A `DebtPayment` record (debtId, amount, date, note) — logging a payment both
records history and decrements `currentBalance`, replacing "just edit the
balance" as the primary way to record a real payment (inline balance editing
from Phase 1 stays available for corrections). `POST /api/debts/:id/payments`
does both atomically; `GET /api/debts/:id/payments` returns history for a
simple per-debt payment log in the UI.

### Step 4 — Deferment planner (BT-033)
Phase 1 left the "2 non-consecutive deferments per loan cycle year" rule as a
comment, not code. Phase 3 enforces it: creating a deferment that would be a
3rd within a rolling 12-month window, or land in a month adjacent to an
existing deferment for the same loan, is rejected with a 400 explaining why.
Web: a small form (target loan item, month) plus a list of existing
deferments — replaces raw CRUD-via-curl as the only way to manage these.

### Step 5 — Debt-free progress bar (BT-034)
Client-side only — no new endpoint needed. `(originalTotal - currentTotal) /
originalTotal` across all debts (AED-normalized, reusing each debt's `fxRate`),
rendered as a bar in the existing debt dashboard banner.

### Step 6 — INR rate refresh (BT-035)
Manual, not live (see SPEC §7's explicit non-goal on bank/FX integrations
— this app stays free and dependency-free). Just makes the Arun debt's
`fxRate` editable inline, same pattern as `EditableAmount`, so Sunil can type
in today's rate when it matters instead of it being fixed forever.

## 4. Definition of done

- [ ] Dragging the salary slider changes the shown debt-free date without
      touching the database (confirmed via `GET /api/recurring-items` before/after)
- [ ] Logging a debt payment updates both the balance and a visible history list
- [ ] Creating a 3rd deferment in a rolling year, or two in adjacent months for
      the same loan, is rejected with a clear error
- [ ] The debt dashboard shows a single "% paid off" bar alongside the existing
      per-debt bars
- [ ] Arun's FX rate can be edited inline and the AED-converted balance updates
- [ ] `npm test` green in both `server/` and `web/`
