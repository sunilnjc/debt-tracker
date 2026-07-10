# BudgetTracker

Personal budget, cash-flow projection, and debt-payoff tracker. Built for one
user (Sunil), AED-first, designed around what generic budgeting apps get wrong:
post-dated rent cheques, loan deferments, informal debts with priorities, and a
debt payoff waterfall that recomputes when any number changes.

**Status:** Phase 1 MVP complete — projection engine, API, and web UI all working locally.

## Documentation

| Doc | What it covers |
|---|---|
| [docs/SPEC.md](docs/SPEC.md) | Product spec: why, domain model, projection engine, architecture, roadmap |
| [docs/PHASE1-MVP.md](docs/PHASE1-MVP.md) | Phase 1 scope, build order, acceptance criteria, definition of done |
| [docs/ISSUES.md](docs/ISSUES.md) | Issue backlog (BT-###) and open questions |
| [docs/FINANCIAL-PLAN-2026.md](docs/FINANCIAL-PLAN-2026.md) | Source financial plan — the seed data and the acceptance-test truth |

## Layout

```
budgettracker/
├── docs/       # spec, issue backlog, phase plans
├── server/     # Express + TypeScript API and pure projection engine
└── web/        # Vite + React UI
```

## Running locally

Requires a local MongoDB (`brew services start mongodb-community`).

```bash
# one-time: seed the database from the financial plan
cd server && npm install && npm run seed

# terminal 1
cd server && npm run dev      # API on :4000

# terminal 2
cd web && npm install && npm run dev   # UI on :4321 (or next free port), proxies /api to :4000
```

Run tests: `npm test` in `server/` (engine + API-facing logic) and in `web/` (component tests).

## North star

The projection engine, run on the seed data, must reproduce the financial
plan's hand-built tables exactly: **debt-free by March 2027**. That table is
the acceptance test for everything else.
