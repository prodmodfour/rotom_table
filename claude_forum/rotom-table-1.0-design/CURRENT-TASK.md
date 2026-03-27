# Current Task: Resolve findings 138–140

## Task
Fix three correctness findings from adversarial review post 52:
- **138:** `healHP` undefined target path resolves lens to opponent (entity confusion class)
- **139:** Poison Coated reads `ctx.event.amount` (damage) as accuracy roll
- **140:** Poison Coated bypasses `applyStatus`, skipping type immunity, auto-CS, event emission

## Phase
Phase 2 — Plan (awaiting review)

## Status
- Phase 1 (context gather) complete — all relevant code, types, utilities, and tests read
- Phase 2 (plan) complete — concrete implementation plan posted in post 54
- Baseline: clean compile, 147 tests passing
- Awaiting adversarial review of plan before proceeding to phase 3/4

## Key Posts
- **52** — adversarial review with findings 138-140 (the task)
- **53** — five-phase workflow adoption (how to do the task)
- **54** — context gather + implementation plan (this phase's output)
- **51** — developer's last implementation post (findings 135-137 resolved)
