---
review_id: rules-review-133
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-001
domain: character-lifecycle
commits_reviewed:
  - 7f9dd1f
  - 0a9c67d
  - d78d29d
  - 86ce748
  - 76fb481
  - 9d56757
  - 3393ffd
  - 309ca83
mechanics_verified:
  - trainer-hp-formula
  - combat-logic-isolation
  - capture-logic-isolation
  - stat-calculation-isolation
  - avatar-data-passthrough
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/04-trainers.md#trainer-hp
reviewed_at: 2026-02-23T10:15:00Z
follows_up: null
---

## Mechanics Verified

### Trainer HP Formula
- **Rule:** "Trainer HP = Level x 2 + (HP Stat x 3) + 10" (`core/04-trainers.md#trainer-hp`)
- **Implementation:** `QuickCreateForm.vue:149` — `const maxHp = level * 2 + hpStat * 3 + 10` — unchanged by this feature. The only addition on the adjacent line is `avatarUrl: localForm.avatarUrl || undefined` which is pure data passthrough.
- **Status:** CORRECT

### Combat Logic Isolation
- **Rule:** All combat mechanics (damage, stages, initiative, maneuvers, turn tracking) must remain untouched by cosmetic changes.
- **Implementation:** Verified via `git diff --stat` that zero core game logic files were modified:
  - `composables/useCombat.ts` — NOT MODIFIED
  - `composables/useCapture.ts` — NOT MODIFIED
  - `composables/useMoveCalculation.ts` — NOT MODIFIED
  - `composables/useEntityStats.ts` — NOT MODIFIED
  - `composables/useRestHealing.ts` — NOT MODIFIED
  - `utils/captureRate.ts` — NOT MODIFIED
  - `utils/diceRoller.ts` — NOT MODIFIED
  - `utils/restHealing.ts` — NOT MODIFIED
  - `constants/combatManeuvers.ts` — NOT MODIFIED
  - `constants/statusConditions.ts` — NOT MODIFIED
  - `server/services/combatant.service.ts` — NOT MODIFIED
  - `server/services/pokemon-generator.service.ts` — NOT MODIFIED
- **Status:** CORRECT

### Capture Logic Isolation
- **Rule:** Capture rate formula (base 100, level/HP/evolution/status modifiers) must not be affected.
- **Implementation:** `CombatantCard.vue` imports `useCapture()` and calls `calculateCaptureRateLocal` — these lines are entirely untouched in the diff. The only changes in `CombatantCard.vue` are (1) adding the `useTrainerSprite()` import and (2) wrapping the existing `avatarUrl` computed through `getTrainerSpriteUrl()`. The capture calculation path is unaffected.
- **Status:** CORRECT

### Stat Calculation Isolation
- **Rule:** Stat computation (base + level-up + nature), evasion (`floor(calculatedStat / 5)`), and combat stage multipliers must remain untouched.
- **Implementation:** `useCharacterCreation.ts` changes are limited to two lines: adding `avatarUrl: null` to the form defaults and `avatarUrl: form.avatarUrl || undefined` to the payload builder. The HP formula (`maxHp`), stat computation (`computedStats`), and evasion calculation (`evasions`) are all untouched.
- **Status:** CORRECT

### Avatar Data Passthrough
- **Rule:** The `avatarUrl` field on `HumanCharacter` is a cosmetic string — it must not interact with any game formula.
- **Implementation:** Across all 22 files:
  - **3 new files** (`trainerSprites.ts`, `useTrainerSprite.ts`, `TrainerSpritePicker.vue`): Pure UI/presentation code. The composable maps sprite keys to CDN URLs. No game calculations.
  - **19 modified files**: Every change follows the same pattern — replace direct `avatarUrl` references with `getTrainerSpriteUrl(avatarUrl)` for display purposes only. No changes to `emit()` payloads carrying game data. No changes to API call bodies. No changes to store actions or mutations that process combat/stat/capture data.
  - **Type change** (`character.ts`): Added `avatarUrl?: string` to `QuickCreatePayload` — an additive optional field that carries through to the existing DB column. No impact on `Stats`, `HumanCharacter`, or any combat-related interface.
  - **SCSS changes**: `object-fit: cover` changed to `object-fit: contain` + `image-rendering: pixelated` on avatar images — purely visual rendering. Added `overflow: hidden` on a few avatar containers — purely visual clipping.
- **Status:** CORRECT

## Summary

This is a purely cosmetic feature — B2W2 trainer sprites for NPC/player avatars. The implementation is clean and well-isolated:

1. **Zero game logic files touched.** All 12 core mechanics files (composables, utils, constants, server services) have zero changes.
2. **All 19 modified files** follow an identical, minimal pattern: import `useTrainerSprite`, wrap existing `avatarUrl` reads through `getTrainerSpriteUrl()` for display, and add avatar error handling. No game formulas, combat logic, or stat calculations were altered.
3. **The `useCharacterCreation.ts` changes** add only `avatarUrl` passthrough (2 lines) without touching HP computation, stat allocation, evasion, or any other game mechanic.
4. **The `QuickCreatePayload` type extension** is additive (optional field) and does not affect existing fields or any consuming logic.
5. **The `QuickCreateForm.vue` HP formula** at line 149 (`level * 2 + hpStat * 3 + 10`) is confirmed untouched and correct per PTU rules.

## Rulings

No PTU rule violations found. The feature is entirely cosmetic and correctly isolated from all game mechanics.

## Verdict

**APPROVED** — No game logic was modified, added, or removed. All PTU mechanics remain correct and untouched. The trainer sprite system is a pure presentation layer that reads existing `avatarUrl` data and resolves it to CDN URLs for display.

## Required Changes

None.
