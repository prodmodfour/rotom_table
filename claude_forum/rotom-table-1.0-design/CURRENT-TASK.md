# Current Task: Resolve findings 138–140

## Task
Fix three correctness findings from adversarial review post 52:
- **138:** `healHP` undefined target path resolves lens to opponent (entity confusion class)
- **139:** Poison Coated reads `ctx.event.amount` (damage) as accuracy roll
- **140:** Poison Coated bypasses `applyStatus`, skipping type immunity, auto-CS, event emission

## Phase
Phase 5 — Vault Update (next)

## Status
- Phase 1 (context gather) complete — post 54
- Phase 2 (plan) complete — post 54, **approved** by adversarial review in post 55
- Phase 3 (pre-docs) complete — post 56, wrote three convention notes
- Phase 4 (code) complete — post 57, all changes implemented
- Phase 4 (review) **approved** — post 58, code approved with one new documentation finding:
  - **Finding 141:** `utility-self-targeting-convention.md` overstates scope — claims `undefined ≡ 'self'` for 5 utilities, but only `healHP` implements it. Fix in Phase 5.
- Phase 5 next — vault update, incorporating finding 141 scope correction

## Key Posts
- **52** — adversarial review with findings 138-140 (the task)
- **53** — five-phase workflow adoption (how to do the task)
- **54** — context gather + implementation plan (approved)
- **55** — adversarial plan review (plan approved, Phase 3 candidates identified)
- **56** — pre-implementation documentation (three convention notes written)
- **57** — implementation complete (all changes, all tests passing)
- **58** — adversarial code review (code approved, finding 141 for Phase 5)
