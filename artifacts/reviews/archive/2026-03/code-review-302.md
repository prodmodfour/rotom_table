---
review_id: code-review-302
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-018
domain: scenes
commits_reviewed:
  - 524ad829
  - 9b7ba91d
  - 658bd73a
  - f71aee73
files_reviewed:
  - app/utils/weatherRules.ts
  - app/server/services/weather-automation.service.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/server/services/status-automation.service.ts
  - app/server/services/combatant.service.ts
  - app/types/character.ts
  - app/types/encounter.ts
  - artifacts/designs/design-weather-001/spec-p0.md
  - artifacts/designs/design-weather-001/shared-specs.md
  - artifacts/designs/design-weather-001/_index.md
  - artifacts/tickets/in-progress/feature/feature-018.md
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 2
  medium: 2
reviewed_at: 2026-03-03T15:12:00+00:00
follows_up: null
---

## Review Scope

First review of feature-018 P0 (Weather Effect Automation). Four commits implementing:
- `weatherRules.ts`: Pure utility for weather type/ability immunity checks
- `weather-automation.service.ts`: Weather tick calculation service
- Integration into `next-turn.post.ts`: Weather damage at turn start with faint handling, move log, WebSocket broadcast

Decrees checked: decree-001 (minimum damage), decree-004 (massive damage + temp HP), decree-032 (Cursed tick context), decree-038 (Sleep behavior). None violated. Weather tick damage is flat HP loss through `calculateTickDamage` (minimum 1 enforced), flowing through `calculateDamage` which correctly handles temp HP absorption per decree-004. Weather damage (1/10 max HP) can never reach the 50% massive damage threshold, so decree-004 is not materially triggered.

## Issues

### CRITICAL

#### CRIT-001: `next-turn.post.ts` exceeds 800-line limit (857 lines)

**File:** `app/server/api/encounters/[id]/next-turn.post.ts`
**Lines:** 857 (was 743 pre-change, +114 from weather integration)

The file was already approaching the limit at 743 lines and the weather integration pushed it to 857. Per project rules, files over 800 lines are CRITICAL severity.

**Required fix:** Extract the weather tick processing block (lines 440-505) and/or the existing status tick processing block (lines 162-223) into a helper function or a dedicated module. The helper functions at the bottom of the file (`resetCombatantsForNewRound`, `skipFaintedTrainers`, `skipUndeclaredTrainers`, `skipUncommandablePokemon`, `decrementWeather`) could also be extracted to a shared `turn-helpers.ts` file, which would reclaim ~170 lines. The weather block itself is a self-contained unit that could be a function like `processWeatherTick(weather, currentTurnIndex, turnOrder, combatants, allCombatants)`.

### HIGH

#### HIGH-001: Adjacent ally protection does not check if the protecting ally is alive

**File:** `app/utils/weatherRules.ts`, lines 182-203 (Hail) and 243-261 (Sandstorm)

The adjacent ally immunity check (Snow Cloak / Sand Veil) iterates over all same-side combatants but never checks whether the ally with the protecting ability is still alive. A fainted ally with Snow Cloak at 0 HP should not confer weather immunity to adjacent combatants. Fainted Pokemon's abilities are inactive per PTU p.248.

**Required fix:** Add `if (ally.entity.currentHp <= 0) continue` after the side check in both `isImmuneToHail` and `isImmuneToSandstorm`.

```typescript
if (ally.id === combatant.id) continue
if (ally.side !== combatant.side) continue
if (!ally.position) continue
if (ally.entity.currentHp <= 0) continue  // Fainted allies cannot protect
```

#### HIGH-002: Missing Magic Guard ability from weather immunity lists

**File:** `app/utils/weatherRules.ts`

PTU p.1770-1775 defines Magic Guard as: "The user is immune to damage and Hit Point loss from Hazards, Weather, Status Afflictions, Vortexes, Recoil, Hay Fever, Iron Barbs, Rough Skin, and Leech Seed."

Magic Guard explicitly grants immunity to Weather damage. It is not in either `HAIL_IMMUNE_ABILITIES` or `SANDSTORM_IMMUNE_ABILITIES`. Pokemon with Magic Guard (Clefable, Reuniclus, Sigilyph, Magearna, etc.) will incorrectly take Hail and Sandstorm damage.

**Required fix:** Add `'Magic Guard'` to both `HAIL_IMMUNE_ABILITIES` and `SANDSTORM_IMMUNE_ABILITIES` arrays. Magic Guard grants blanket weather damage immunity regardless of weather type.

### MEDIUM

#### MED-001: `app-surface.md` not updated with new files

**File:** `.claude/skills/references/app-surface.md`

Two new files were created (`app/utils/weatherRules.ts`, `app/server/services/weather-automation.service.ts`) but `app-surface.md` was not updated to register them. The project checklist requires updating `app-surface.md` when new endpoints/components/routes/stores are created. While these are utility/service files rather than endpoints, the services CLAUDE.md was updated (via commit 9fcf0bdc in the collection) and `app-surface.md` should also reflect the new service.

**Required fix:** Add `weather-automation.service.ts` to the services section and `weatherRules.ts` to the utils section of `app-surface.md`.

#### MED-002: Adjacent ally protection ignores token size for large Pokemon

**File:** `app/utils/weatherRules.ts`, lines 188-190

The adjacency check uses simple Chebyshev distance between position anchors:
```typescript
const dx = Math.abs(ally.position.x - combatant.position.x)
const dy = Math.abs(ally.position.y - combatant.position.y)
const isAdjacent = dx <= 1 && dy <= 1 && (dx + dy > 0)
```

This treats all combatants as 1x1 regardless of their `tokenSize`. A 2x2 Steelix at position (5,5) occupies cells (5,5)-(6,6), but only the anchor cell (5,5) is used for adjacency. A combatant at (7,5) is adjacent to the Steelix's body but would calculate `dx=2`, failing the adjacency check.

This is a pre-existing pattern across the codebase (not introduced by this PR), but since the adjacent ally protection is a new feature relying on adjacency calculations, it should be documented as a known limitation.

**Required fix:** Add a code comment at the adjacency check noting this limitation: `// Note: uses anchor position only; does not account for large token sizes (pre-existing limitation)`. File a follow-up ticket if large-token adjacency is needed for P2 (Snow Cloak evasion aura, Sand Veil evasion aura).

## What Looks Good

1. **Clean architecture separation.** Pure utility (`weatherRules.ts`) -> pure service (`weather-automation.service.ts`) -> integration point (`next-turn.post.ts`). The utility is auto-imported on both client and server. The service reuses `calculateTickDamage` from `status-automation.service.ts` rather than reimplementing it.

2. **Correct PTU rules implementation.** Weather damage is 1 Tick (1/10 max HP), not 1/16. Corrected from the original ticket description. The correction was documented in both the ticket resolution log and the design index. Damage fires at turn start (beginning of turn) per PTU p.341-342.

3. **Type and ability immunity lists are comprehensive for P0 scope.** Ice immunity to Hail, Ground/Rock/Steel immunity to Sandstorm. Ability lists include Snow Warning, Overcoat, Desert Weather, Sand Force -- not just the obvious ones. Adjacent ally protection from Snow Cloak and Sand Veil is correctly scoped to same-side allies.

4. **Declaration phase correctly excluded.** Weather damage does not fire during `trainer_declaration` phase (line 446), which is correct -- declaration is not a real turn. The spec explicitly called this out and it was implemented.

5. **Faint handling is thorough.** Weather-induced faint triggers `applyFaintStatus`, auto-dismount via `clearMountOnFaint`, and `trackDefeated` for XP calculation. This matches the existing faint handling pattern for status tick damage.

6. **Correct damage flow.** Weather tick damage flows through `calculateDamage` + `applyDamageToEntity` from `combatant.service.ts`, which handles temp HP absorption, injury marker crossings, and the massive damage rule. This is the canonical damage application path.

7. **Good commit granularity.** Three implementation commits (utility -> service -> integration) + one docs commit. Each commit changes a focused set of files and has a clear commit message.

8. **Move log and WebSocket broadcast follow existing patterns.** Weather tick is logged as a move log entry matching the structure of status tick entries. WebSocket broadcast reuses the `status_tick` event type per the design spec.

9. **Case-insensitive ability matching.** The ability comparison uses `.toLowerCase()` on both sides, which prevents data inconsistency issues from casing differences in stored ability names.

10. **Trainers correctly take weather damage.** The design decision that trainers in Full Contact take weather damage (no type immunity since they have no types) is correct per PTU intent and documented in the spec.

## Verdict

**CHANGES_REQUIRED**

Three issues must be fixed before approval:

1. **CRIT-001**: `next-turn.post.ts` at 857 lines exceeds the 800-line project limit. Extract helper functions to reduce below 800.
2. **HIGH-001**: Adjacent ally protection must check that the protecting ally is alive (not fainted). A one-line fix per immunity function.
3. **HIGH-002**: Magic Guard ability must be added to both weather immunity lists. PTU explicitly lists Weather as a damage source Magic Guard protects against.

## Required Changes

| ID | Severity | File | Fix |
|----|----------|------|-----|
| CRIT-001 | CRITICAL | `next-turn.post.ts` | Extract helper functions to get under 800 lines |
| HIGH-001 | HIGH | `weatherRules.ts` | Add `ally.entity.currentHp <= 0` skip in adjacent ally checks (both Hail and Sandstorm) |
| HIGH-002 | HIGH | `weatherRules.ts` | Add `'Magic Guard'` to both `HAIL_IMMUNE_ABILITIES` and `SANDSTORM_IMMUNE_ABILITIES` |
| MED-001 | MEDIUM | `app-surface.md` | Register new utility and service files |
| MED-002 | MEDIUM | `weatherRules.ts` | Add comment documenting token-size limitation in adjacency check |
