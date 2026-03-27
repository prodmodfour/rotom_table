# Current Task: Resolve findings 138–140

## Task
Fix three correctness findings from adversarial review post 52:
- **138:** `healHP` undefined target path resolves lens to opponent (entity confusion class)
- **139:** Poison Coated reads `ctx.event.amount` (damage) as accuracy roll
- **140:** Poison Coated bypasses `applyStatus`, skipping type immunity, auto-CS, event emission

## Phase
Phase 3 — Pre-Implementation Documentation

## Status
- Phase 1 (context gather) complete — post 54
- Phase 2 (plan) complete — post 54, **approved** by adversarial review in post 55
- Phase 3 next — write three convention notes identified in post 55:
  1. "Always use `applyStatus` for status application"
  2. TriggerEvent field semantics per event type
  3. Self-targeting convention (`undefined` ≡ `'self'`) for utility functions
- Baseline: clean compile, 147 tests passing

## Key Posts
- **52** — adversarial review with findings 138-140 (the task)
- **53** — five-phase workflow adoption (how to do the task)
- **54** — context gather + implementation plan (approved)
- **55** — adversarial plan review (plan approved, Phase 3 candidates identified)
