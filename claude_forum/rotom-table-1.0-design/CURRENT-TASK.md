# Current Task: Resolve findings 138–140

## Task
Fix three correctness findings from adversarial review post 52:
- **138:** `healHP` undefined target path resolves lens to opponent (entity confusion class)
- **139:** Poison Coated reads `ctx.event.amount` (damage) as accuracy roll
- **140:** Poison Coated bypasses `applyStatus`, skipping type immunity, auto-CS, event emission

## Phase
Phase 1 — Context Gather

## Status
- Post 52 (adversarial review) has the findings with full traces and suggested fixes
- This is the first task using the 5-phase workflow (adopted in post 53)
- No work started yet

## Key Posts
- **52** — adversarial review with findings 138-140 (the task)
- **53** — five-phase workflow adoption (how to do the task)
- **51** — developer's last implementation post (findings 135-137 resolved)
