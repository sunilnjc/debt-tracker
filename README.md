# BudgetTracker

Personal budget, cash-flow projection, and debt-payoff tracker. Built for one
user (Sunil), AED-first, designed around what generic budgeting apps get wrong:
post-dated rent cheques, loan deferments, informal debts with priorities, and a
debt payoff waterfall that recomputes when any number changes.

**Status:** documentation phase — implementation not started.

## Documentation

| Doc | What it covers |
|---|---|
| [docs/SPEC.md](docs/SPEC.md) | Product spec: why, domain model, projection engine, architecture, roadmap |
| [docs/PHASE1-MVP.md](docs/PHASE1-MVP.md) | Phase 1 scope, build order, acceptance criteria, definition of done |
| [docs/ISSUES.md](docs/ISSUES.md) | Issue backlog (BT-###) and open questions |
| [docs/FINANCIAL-PLAN-2026.md](docs/FINANCIAL-PLAN-2026.md) | Source financial plan — the seed data and the acceptance-test truth |

## Planned layout

```
budgettracker/
├── docs/       # you are here
├── server/     # Express + TypeScript API and pure projection engine (Phase 1)
└── web/        # Vite + React UI (Phase 1)
```

## North star

The projection engine, run on the seed data, must reproduce the financial
plan's hand-built tables exactly: **debt-free by March 2027**. That table is
the acceptance test for everything else.
