---
review_id: rules-review-293
review_type: rules
reviewer: senior-reviewer
trigger: bug-fix
target_report: feature-018
domain: scenes
commits_reviewed:
  - 058851d4
  - e3a785f6
  - c24c4c30
  - 7458d79e
  - d8c1c9d8
files_reviewed:
  - app/server/utils/turn-helpers.ts
  - app/server/services/mounting.service.ts
  - app/utils/damageCalculation.ts
  - app/utils/weatherRules.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-04T11:15:00Z
follows_up: rules-review-290
---

## Review Scope

Rules compliance re-review for feature-018 P2 fix cycle. Previous rules-review-290 was APPROVED. This review focuses on whether the fix commits introduced any PTU rule violations.

## Rules Verification

### Thermosensitive (PTU p.329)

Thermosensitive halves Overland speed during Hail. The fix in 058851d4 ensures `applyMovementModifiers()` receives the encounter weather on the server side, matching the client-side behavior that was already correct. The halving logic itself (in `utils/movementModifiers.ts`) was not changed -- only the weather parameter threading. No rules impact.

### Sand Force (PTU p.327)

Sand Force grants a flat damage bonus to Ground, Rock, and Steel type moves during Sandstorm. The fix in e3a785f6 changes the ordering so the ability damage bonus is added before the min-1 damage clamp. This is the correct PTU behavior: the damage formula computes (base + attack - defense - DR + ability bonus), then clamps to minimum 1. The previous ordering incorrectly clamped to 1 before adding the bonus, which could inflate damage when pre-bonus damage was negative.

### Decree Compliance

- **decree-045 (Sun Blanket):** Verified `hpFraction: 10` in WEATHER_ABILITY_EFFECTS for Sun Blanket (Tick = 1/10th max HP). Compliant.
- **decree-032 (Cursed tick):** Not affected by these changes. No modification to status tick logic.
- **decree-038 (Sleep persistence):** Not affected by these changes. No modification to sleep/recall logic.

### Weather Ability Effects (PTU pp.311-335)

The WEATHER_ABILITY_EFFECTS constant was moved from `weather-automation.service.ts` to `utils/weatherRules.ts` without any value changes. All entries verified unchanged:
- Ice Body: Hail heal, 1/10th (correct per PTU p.319)
- Rain Dish: Rain heal, 1/10th (correct per PTU p.326)
- Sun Blanket: Sunny heal, 1/10th (correct per decree-045)
- Solar Power: Sunny damage, 1/16th (correct per PTU p.328)
- Dry Skin: Rain heal 1/10th, Sun damage 1/10th (correct per PTU p.316)
- Desert Weather: Rain heal, 1/16th (correct per PTU p.315)

## Verdict

**APPROVED.** The fix cycle introduces no PTU rule violations. All changes are mechanical (parameter threading, import relocation, clamp reordering) with no rule-logic modifications. Previous rules-review-290 approval remains valid.
