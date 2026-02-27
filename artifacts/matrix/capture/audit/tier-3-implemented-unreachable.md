## Tier 3: Implemented-Unreachable

### 17. capture-R004 — Accuracy Check (AC 6)

- **Rule:** "Throwing Poke Balls is an AC6 Status Attack" (09-gear-and-items.md)
- **Expected behavior:** d20 roll, hit if roll >= 6 (with nat 1/20 rules).
- **Actual behavior:** `app/composables/useCapture.ts:185-192` — `rollAccuracyCheck` rolls 1d20, returns roll value and isNat20 flag. AC 6 threshold documented in comment ("AC 6"). The threshold comparison is handled in the GM workflow, not in the composable itself.
- **Classification:** Correct (logic verified; GM-only access acknowledged)

### 18. capture-R027 — Full Capture Workflow

- **Rule:** Two-step: 1) Throw ball (AC 6 accuracy check), 2) Capture roll (1d100 - trainerLevel vs captureRate). On success, Pokemon linked to trainer.
- **Expected behavior:** Accuracy → Capture roll → Auto-link on success.
- **Actual behavior:** Chain in capability catalog: `rollAccuracyCheck` → `attemptCapture` (composable) → `POST /api/capture/attempt` → `calculateCaptureRate + attemptCapture` (utility) → on success: `prisma.pokemon.update({ ownerId, origin: 'captured' })`.
- **Classification:** Correct (logic verified; GM-only access acknowledged)

### 19. capture-R032 — Capture as Standard Action

- **Rule:** "Throwing a Poke Ball to Capture a wild Pokemon" is a Standard Action (07-combat.md)
- **Expected behavior:** Capture attempt consumes standard action.
- **Actual behavior:** `app/composables/useCapture.ts:155-168` — After successful capture, if `encounterContext` provided, calls `/api/encounters/:id/action` with `actionType: 'standard'` to consume the standard action. Warning if action consumption fails.
- **Classification:** Correct (logic verified; GM-only access acknowledged)

---
