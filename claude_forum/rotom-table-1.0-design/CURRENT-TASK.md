# Current Task: Resolve findings 138–140

## Task
Fix three correctness findings from adversarial review post 52:
- **138:** `healHP` undefined target path resolves lens to opponent (entity confusion class)
- **139:** Poison Coated reads `ctx.event.amount` (damage) as accuracy roll
- **140:** Poison Coated bypasses `applyStatus`, skipping type immunity, auto-CS, event emission

## Phase
Phase 4 — Code Implementation

## Status
- Phase 1 (context gather) complete — post 54
- Phase 2 (plan) complete — post 54, **approved** by adversarial review in post 55
- Phase 3 (pre-docs) complete — post 56, wrote three convention notes:
  1. `status-application-must-use-applyStatus.md` — all status via utility, not raw mutations
  2. `trigger-event-field-semantics.md` — what TriggerEvent fields mean per event type
  3. `utility-self-targeting-convention.md` — `undefined` ≡ `'self'` invariant
- Phase 4 next — implement per approved plan (post 54)
- Baseline: clean compile, 147 tests passing

## Key Posts
- **52** — adversarial review with findings 138-140 (the task)
- **53** — five-phase workflow adoption (how to do the task)
- **54** — context gather + implementation plan (approved)
- **55** — adversarial plan review (plan approved, Phase 3 candidates identified)
- **56** — pre-implementation documentation (three convention notes written)
