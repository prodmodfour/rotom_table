---
review_id: code-review-188
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-105+106+feature-003
domain: rest-healing
commits_reviewed:
  - 904f848
  - 3e0dfd9
  - 81c2b02
  - 46be3bf
  - 1835cf6
  - b2bce27
  - 5534e2b
files_reviewed:
  - app/assets/scss/components/_player-character-sheet.scss
  - app/server/api/characters/[id]/extended-rest.post.ts
  - app/server/api/pokemon/[id]/extended-rest.post.ts
  - app/composables/useRestHealing.ts
  - app/components/common/HealingTab.vue
  - app/utils/restHealing.ts
  - app/prisma/schema.prisma
  - app/server/api/characters/[id]/rest.post.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-02-26T19:45:00Z
follows_up: code-review-182
---

## Review Scope

Three items reviewed in a single pass, all implemented by slave-1 (plan-20260226-190737), 7 commits total:

1. **feature-003 Track A P2 fix cycle 3** (re-review of code-review-182 C1): Removal of `:deep()` pseudo-selectors from global SCSS file. 1 commit, 1 file.
2. **ptu-rule-105** (decree-016): Extended rest preserves Bound AP, only clears Drained AP. 1 commit, 1 file.
3. **ptu-rule-106** (decree-018): Extended rest accepts duration parameter (4-8 hours). 4 commits, 4 files.

Plus 1 docs commit updating ticket resolution logs.

## Issues

No issues found. All three changes are correct, complete, and well-structured.

## Detailed Analysis

### feature-003 fix cycle 3 (commit 904f848)

**Re-review of code-review-182 C1: `:deep()` pseudo-selectors in global SCSS.**

The fix correctly replaces 3 `:deep()` wrappings with plain selectors in `_player-character-sheet.scss`:

1. `:deep(.player-hp-bar-label)` -> `.player-hp-bar-label` (line 81)
2. `:deep(svg)` -> `svg` (line 111)
3. `:deep(.player-stat-cell__value)` -> `.player-stat-cell__value` (line 132)

Verified: `_player-character-sheet.scss` is a global SCSS file imported via `nuxt.config.ts` css array (not a Vue `<style scoped>` block). The `:deep()` pseudo-selector is a Vue SFC-only construct that compiles to `[v-data-xxx]` attribute selectors inside scoped styles. In global SCSS, `:deep()` compiles to a literal CSS selector that browsers do not recognize, producing dead rules. The plain selectors are correct because global SCSS already has full reach into child component DOM.

Grep confirms zero remaining `:deep()` occurrences across all `app/assets/scss/` files. Fix is complete.

### ptu-rule-105 (commit 3e0dfd9)

**Bound AP preservation per decree-016.**

Before: the character extended-rest endpoint set `boundAp: 0`, `currentAp: maxAp` (clearing both bound and drained AP).

After: the endpoint sets only `drainedAp: 0` and `currentAp: maxAp - character.boundAp`. The `boundAp` field is never written to (preserved as-is). The response returns `boundAp: updated.boundAp` instead of the old `boundApCleared` field.

This correctly implements decree-016: "Extended rest clears only Drained AP, not Bound AP." The `currentAp` calculation is correct: after clearing drainedAp, available AP = maxAp - boundAp (since drainedAp is now 0).

Verified that the Pokemon model does NOT have `boundAp`/`drainedAp`/`currentAp` fields in the Prisma schema -- Pokemon don't have Action Points in PTU, so ptu-rule-105 correctly only targets the character endpoint. No Pokemon-side change was needed.

### ptu-rule-106 (commits 81c2b02, 46be3bf, 1835cf6, b2bce27)

**Duration parameter per decree-018.** Four-layer implementation: server (character), server (Pokemon), composable, UI.

**Server endpoints (character + Pokemon):**

Both endpoints use identical duration parsing:
```typescript
const body = await readBody(event).catch(() => ({}))
const rawDuration = body?.duration ?? 4
const duration = Math.min(8, Math.max(4, Number(rawDuration) || 4))
```

- `readBody` failure falls back to empty object (backward-compatible with no-body calls)
- `?? 4` provides default when duration is undefined/null
- `Number(rawDuration) || 4` handles NaN from non-numeric input
- `Math.min(8, Math.max(4, ...))` clamps to [4, 8] range per decree-018
- `requestedPeriods = Math.floor(duration * 60 / 30)` correctly converts hours to 30-min rest periods (4h = 8 periods, 8h = 16 periods)

The healing loop correctly delegates to `calculateRestHealing()` which enforces the daily 480-minute cap internally (returns `canHeal: false` when `restMinutesToday >= 480`). This means even if the GM requests 8 hours and the entity already rested 4 hours today via 30-minute rests, the loop will stop after 8 more periods (not 16). Interaction between duration and daily cap is correct.

Rest minutes tracking: `currentRestMinutes` accumulates correctly inside the loop (starting from `restMinutesToday`), and the final value is persisted to `restMinutesToday` in the DB update. Response includes both `restMinutesToday` and `restMinutesRemaining`.

Note: fractional durations (e.g., 4.5) are technically accepted by the server and produce correct results (9 periods via `Math.floor`). The UI constrains to `step="1"` whole hours, which is reasonable for the GM interface. If fractional-hour precision is needed later, this is already supported server-side.

**Composable (useRestHealing.ts):**

The `extendedRest` function correctly accepts an optional `duration: number = 4` parameter and passes it in the request body. Default of 4 preserves backward compatibility for any existing callers (though currently HealingTab is the only caller and it always passes duration explicitly).

**UI (HealingTab.vue):**

- Duration state: `extendedRestDuration = ref(4)` with `v-model.number` binding
- Number input with `min="4"`, `max="8"`, `step="1"` -- appropriate constraints
- Client-side clamping in `handleExtendedRest`: `Math.min(8, Math.max(4, extendedRestDuration.value || 4))` -- defense-in-depth, matches server validation
- Button label dynamically shows duration: `` `Extended Rest (${extendedRestDuration}h)` ``
- Description text updated from "Heal HP for 4 hours" to "Heal HP over the chosen duration" -- accurate
- SCSS for `&__duration`, `&__duration-label`, `&__duration-input` follows existing BEM conventions and uses project SCSS variables

**Commit granularity:** Each commit touches exactly one file and represents a single logical change (server character, server Pokemon, composable, UI). Commit messages are descriptive with decree references. This is correct granularity per project guidelines.

## What Looks Good

1. **Decree compliance.** Both decree-016 and decree-018 are implemented exactly as specified. Code comments cite the decree numbers for future maintainers.

2. **Backward compatibility.** Default duration of 4 hours at every layer (server, composable, UI) means no existing behavior changes for callers that don't pass duration. The `readBody().catch(() => ({}))` pattern handles requests with no body gracefully.

3. **Defense-in-depth validation.** Duration is clamped on both client (HealingTab) and server (both endpoints). Even if a direct API call sends duration=100, the server caps at 8.

4. **Daily cap interaction.** The `calculateRestHealing()` utility already enforces the 480-minute daily cap, so the loop correctly stops when the entity has used up their daily rest allowance -- regardless of the requested duration. No special cap logic needed in the endpoint itself.

5. **Consistent implementation across entity types.** Character and Pokemon endpoints use identical duration parsing logic. The only difference is character has AP handling (per ptu-rule-105) while Pokemon has move restoration -- which is exactly correct for the two entity types.

6. **Clean SCSS fix.** The `:deep()` removal is surgical (3 lines changed) and grep confirms zero remaining instances in global SCSS files.

7. **File sizes.** All files are well within the 800-line limit: HealingTab.vue (357), character endpoint (114), Pokemon endpoint (140), composable (191), SCSS (462).

## Verdict

**APPROVED.** All three items are correctly implemented with no issues found. Decree-016 and decree-018 are respected. The feature-003 fix cycle 3 `:deep()` removal is complete and verified. Code quality, commit granularity, and backward compatibility are all solid.
