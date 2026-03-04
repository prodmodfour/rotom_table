---
review_id: rules-review-207
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-006
domain: pokemon-lifecycle
commits_reviewed:
  - 663454a
  - d6fe48a
  - 9c0f826
  - ae5dbeb
  - 722f519
  - 9d62911
  - 35ddd2c
  - 766585e
  - 739fbb7
  - 82cb606
  - e8247d0
  - 8b82360
  - 9e3f125
  - c2d050f
mechanics_verified:
  - evolution-stat-recalculation
  - base-relations-validation
  - hp-formula
  - nature-application
  - evolution-eligibility-check
  - evolution-execution
  - level-up-evolution-integration
  - stat-allocation-endpoint
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
ptu_refs:
  - core/05-pokemon.md#Evolution (p.592-607)
  - core/05-pokemon.md#Base Relations Rule (p.105-114)
  - core/05-pokemon.md#Pokemon Hit Points (p.118)
  - core/05-pokemon.md#Natures (p.199)
  - core/05-pokemon.md#Level Up (p.564-571)
reviewed_at: 2026-03-01T00:15:00Z
follows_up: rules-review-202
---

## Mechanics Verified

### Evolution Stat Recalculation (R031)

- **Rule:** "Take the new form's Base Stats, apply the Pokemon's Nature again, reapply any Vitamins that were used, and then re-Stat the Pokemon, spreading the Stats as you wish. Again, Pokemon add +X Stat Points to their Base Stats, where X is the Pokemon's Level plus 10." (`core/05-pokemon.md#Evolution, p.592-598`)
- **Implementation:** `recalculateStats()` in `app/server/services/evolution.service.ts:111-174`:
  1. Fetches raw base stats from SpeciesData for the target species (lines 232-238)
  2. Applies nature via `applyNatureToBaseStats()` (line 120)
  3. Validates stat points total equals `level + 10` (lines 123-135)
  4. Validates no negative stat points (lines 138-149)
  5. Validates Base Relations Rule (line 152)
  6. Calculates final stats: `natureAdjusted[stat] + statPoints[stat]` (lines 155-162)
  7. Calculates maxHp: `level + (calculatedStats.hp * 3) + 10` (line 165)
- **Status:** CORRECT

  Formula chain verified:
  - Stat points total: `level + 10` -- matches PTU "where X is the Pokemon's Level plus 10"
  - HP formula: `level + (hpStat * 3) + 10` -- matches PTU "Pokemon Hit Points = Pokemon Level + (HP x3) + 10" (p.118)
  - Nature: `+2/-2` for non-HP stats, `+1/-1` for HP, floored at 1 (`constants/natures.ts:78-79, 101-103`) -- matches PTU p.199 "raised by 2" / "lowered by 2"

### Base Relations Validation (decree-035)

- **Rule:** "The Base Relations Rule puts a Pokemon's Base Stats in order from highest to lowest. This order must be maintained when adding Stat Points." (`core/05-pokemon.md#p.105-114`)
- **Decree:** decree-035 mandates nature-adjusted base stats for ordering: "Base Relations ordering uses nature-adjusted base stats, not raw species base stats."
- **Implementation:** `validateBaseRelations()` in `app/utils/baseRelations.ts:76-120` compares all stat pairs. If `natureAdjustedBase[a] > natureAdjustedBase[b]`, then `final[a]` must be `>= final[b]`. Equal base stats are unconstrained (`baseA === baseB` skips at line 93). This matches PTU p.111: "Stats that are equal need not be kept equal."
- **Status:** CORRECT -- per decree-035

  The shared utility is now properly extracted to `app/utils/baseRelations.ts` (M3 fix from code-review-226). The `evolutionCheck.ts` re-exports it via a legacy wrapper (lines 126-135) for backward compatibility. Both server (`evolution.service.ts` line 21-22) and client (`EvolutionConfirmModal.vue` line 149) use the same validation logic. The `allocate-stats.post.ts` endpoint (line 146) also uses the shared utility directly, ensuring consistent Base Relations enforcement across all stat allocation paths.

  **Tier ordering verified:** `buildStatTiers()` (baseRelations.ts:38-62) sorts by value descending and groups equal values. The `getValidAllocationTargets()` function (baseRelations.ts:129-142) correctly tests each stat independently by adding +1 and re-validating, preventing allocations that would create violations.

### HP Formula

- **Rule:** "Pokemon Hit Points = Pokemon Level + (HP x3) + 10" (`core/05-pokemon.md#p.118`)
- **Implementation locations:**
  - `evolution.service.ts:165`: `level + (calculatedStats.hp * 3) + 10`
  - `EvolutionConfirmModal.vue:237`: `props.currentLevel + (hpStat * 3) + 10`
  - `allocate-stats.post.ts:163`: `pokemon.level + (newHpStat * 3) + 10`
  - `baseRelations.ts:167`: HP extraction: `Math.round((pokemon.maxHp - pokemon.level - 10) / 3)`
- **Status:** CORRECT -- all four locations use the correct formula. The extraction formula correctly inverts `maxHp = level + (hp * 3) + 10` to `hp = (maxHp - level - 10) / 3`.

### Nature Application on Evolution

- **Rule:** "...apply the Pokemon's Nature again..." (`core/05-pokemon.md#Evolution, p.593`)
- **Implementation:** `performEvolution()` at `evolution.service.ts:231` parses the nature from the existing Pokemon record: `JSON.parse(pokemon.nature).name`. The raw species base stats are fetched from SpeciesData (not carried from the old Pokemon), and `applyNatureToBaseStats()` is called with the new species' raw stats.
- **Status:** CORRECT

  Critical correctness detail: `SpeciesData.baseHp` stores RAW species base stats. `Pokemon.baseHp` stores NATURE-ADJUSTED base stats. The service correctly:
  1. Reads raw base stats from `targetSpeciesData` (lines 232-238)
  2. Applies nature to those raw values (line 120 via `recalculateStats`)
  3. Writes nature-adjusted results to `Pokemon.base*` fields (lines 281-286)

  This matches the PTU sequence: "Take the new form's Base Stats, apply the Pokemon's Nature again."

### Evolution Eligibility Check (R029)

- **Rule:** "Next, there is the possibility your Pokemon may learn a Move or Evolve. Check its Pokedex Entry to see if either of these happens." (`core/05-pokemon.md#p.567-568`)
- **Implementation:** `checkEvolutionEligibility()` in `app/utils/evolutionCheck.ts:57-89` checks:
  - Level requirement: `currentLevel >= minimumLevel` (null = no restriction)
  - Held item: case-insensitive match when `itemMustBeHeld === true`
  - Stones: listed as available (GM authority on inventory)
- **Status:** CORRECT

  The level-up integration via `getEvolutionLevels()` (evolutionCheck.ts:96-100) correctly filters for level-only triggers (`minimumLevel !== null && requiredItem === null`) and feeds them into `calculateLevelUps()`. Both XP endpoints (`add-experience.post.ts:86-102` and `xp-distribute.post.ts:159-189`) fetch triggers from SpeciesData and pass them through. The `canEvolve` flag on `LevelUpEvent` accurately reflects level-based evolution eligibility.

  **Branching evolution handling (H2 fix):** Both the Pokemon sheet page (`pages/gm/pokemon/[id].vue:378-384`) and `XpDistributionResults.vue` (lines 225-233) now check `available.length` and show a selection UI when multiple evolution paths exist. This allows the GM to choose the correct path for species like Eevee, Poliwag, etc.

### Evolution Execution (spriteUrl fix -- C1)

- **Rule:** No explicit PTU rule for sprite management, but the design spec requires sprite update on evolution.
- **Implementation:** `performEvolution()` at `evolution.service.ts:294` sets `spriteUrl: null` in the Prisma update. This causes the client-side `usePokemonSprite` composable to recompute the sprite URL from the new species name.
- **Status:** CORRECT (design-specified, not PTU-mandated)

  Setting `spriteUrl: null` is the correct approach given the client-side sprite composable generates URLs from species name. The client always has the new species name after evolution, so the sprite will automatically update.

### HP Proportional Preservation

- **Rule:** No explicit PTU rule for HP preservation during evolution. Design spec defines proportional HP.
- **Implementation:** `performEvolution()` at `evolution.service.ts:257-260`:
  ```typescript
  const hpRatio = oldMaxHp > 0 ? oldCurrentHp / oldMaxHp : 1
  const newCurrentHp = Math.max(1, Math.round(hpRatio * recalc.maxHp))
  ```
- **Status:** CORRECT (design-specified)

  The `Math.max(1, ...)` prevents setting HP to 0. The proportional approach is reasonable: a Pokemon at 50% HP before evolution remains at approximately 50% after.

### Encounter-Active Guard (H3 fix)

- **Rule:** Not a PTU rule, but a data integrity requirement. Evolving a Pokemon in an active encounter would cause the combatant snapshot to desync from the DB record.
- **Implementation:** `evolve.post.ts:81-95` queries all active encounters, parses their combatant JSON, and checks if the Pokemon ID appears. If found, returns 409 Conflict.
- **Status:** CORRECT

  The guard follows the same pattern as `bulk-action.post.ts`. It correctly checks by `entityId` match against the combatant list. The error message is clear: "Cannot evolve a Pokemon that is in an active encounter. End the encounter first."

### Stat Allocation Endpoint (new -- feature-007 integration)

- **Rule:** "you must understand the Base Relations Rule" (`core/05-pokemon.md#p.103-104`), stat points total = level + 10 (`core/05-pokemon.md#p.102-103`).
- **Implementation:** `allocate-stats.post.ts` (lines 32-207) supports both incremental (single stat +N) and batch (full allocation) modes. Validates:
  - Budget: `proposedTotal <= level + 10` (lines 133-143)
  - Base Relations: `validateBaseRelations(natureAdjustedBase, proposedStatPoints)` (line 146)
  - Negative stat points: checked per-key for batch mode (lines 118-123)
  - HP formula: `level + (newHpStat * 3) + 10` (line 163)
  - HP preservation: if at full HP, stays at full HP (lines 166-167)
- **Status:** CORRECT

  **Note on budget validation:** The endpoint checks `proposedTotal > budget` (greater than, not not-equal-to). This allows partial allocation (not all points spent), which is correct -- PTU does not mandate that all stat points be spent at once. The GM may allocate incrementally across multiple sessions.

  The `skipBaseRelations` flag (line 148) allows GM override for Features that break Base Relations (per PTU p.228-232: "there are several Features that allow trainers to break Stat Relations"). This is correctly implemented as an opt-in override rather than a default.

### Level-Up Integration (calculateLevelUps)

- **Rule:** "Next, there is the possibility your Pokemon may learn a Move or Evolve." (`core/05-pokemon.md#p.567`)
- **Implementation:** `calculateLevelUps()` in `experienceCalculation.ts:316-354` accepts an optional `evolutionLevels` array. For each level gained, `canEvolve` is set to `evolutionLevels.includes(info.newLevel)` (line 341). This is consumed by `LevelUpNotification.vue` (lines 144-146) which filters `levelUps` for `canEvolve === true` and renders clickable "Evolution available at Level X!" buttons.
- **Status:** CORRECT

  The `getEvolutionLevels()` helper correctly excludes stone/item-based triggers since those are not level-triggered. The GM handles those cases via the manual Evolve button on the Pokemon sheet page.

## Fix Verification Summary

### C1 (spriteUrl) -- VERIFIED FIXED
`evolution.service.ts:294` now sets `spriteUrl: null`. The client recomputes the sprite from the new species name.

### H1 (pokemon-evolved event) -- VERIFIED FIXED
`XpDistributionModal.vue:204` now binds `@pokemon-evolved="handlePokemonEvolved"`. The handler (lines 514-521) refreshes encounter data via `encounterStore.fetchEncounter()` and emits upward via `emit('pokemon-evolved', result)`.

### H2 (branching evolutions) -- VERIFIED FIXED
Both `pages/gm/pokemon/[id].vue` (lines 145-193, 365-385) and `XpDistributionResults.vue` (lines 37-75, 225-233) now show a selection modal when `available.length > 1`. Single evolution paths go directly to confirmation. The selection UI displays sprites, species names, types, and item requirements.

### H3 (encounter-active guard) -- VERIFIED FIXED
`evolve.post.ts:81-95` queries active encounters for the Pokemon ID before allowing evolution. Returns 409 Conflict if found.

### M1 (app-surface.md) -- VERIFIED FIXED
Commit `c2d050f` added evolution system entries. Verified at `.claude/skills/references/app-surface.md:104-105` (endpoints), line 139 (component), line 141 (utilities), line 240 (service).

### M2 (PokemonLevelUpPanel) -- VERIFIED FIXED
`PokemonLevelUpPanel.vue:33-34` now reads: "Use the **Evolve** button in the header to check evolution eligibility." -- replacing the stale "Check the Pokedex entry" placeholder. Commit `9e3f125`.

### M3 (validateBaseRelations location) -- VERIFIED FIXED
`baseRelations.ts` is a standalone shared utility at `app/utils/baseRelations.ts` with `validateBaseRelations()`, `buildStatTiers()`, `getValidAllocationTargets()`, `extractStatPoints()`, and `formatStatName()`. The `evolutionCheck.ts` file re-exports via a legacy wrapper for backward compatibility (lines 119-135). The `allocate-stats.post.ts` endpoint imports directly from `baseRelations.ts` (line 23). Clean SRP separation.

## Medium Issues

### M1: EvolutionConfirmModal stat point initialization uses even distribution instead of preserving old allocation

**File:** `app/components/pokemon/EvolutionConfirmModal.vue:205-216`

```typescript
const totalPoints = props.currentLevel + 10
const perStat = Math.floor(totalPoints / 6)
const remainder = totalPoints - (perStat * 6)
statPointInputs.hp = perStat + (remainder > 0 ? 1 : 0)
// ...even distribution across all stats
```

The PTU evolution text says "re-Stat the Pokemon, spreading the Stats as you wish" -- the player/GM chooses the new allocation. The modal initializes with even distribution, which is an acceptable default. However, it does not attempt to preserve the previous allocation pattern. For example, if the Pokemon had all points in Speed and Sp.Atk before evolution, the modal starts with an even spread, forcing the GM to manually redistribute.

This is not PTU-incorrect (the rules say "as you wish"), but it could be a UX annoyance for GMs who want to replicate the old distribution. The `extractStatPoints()` function exists in both `evolution.service.ts` and `baseRelations.ts` and could be used to pre-populate the old allocation as the default.

**Severity:** MEDIUM -- the feature works correctly per PTU rules; this is a UX improvement opportunity. Not a rules violation since the GM always makes the final choice. The even distribution is safe (unlikely to violate Base Relations) and does not produce incorrect game values.

**Note:** This was flagged as MEDIUM-001 in rules-review-202. It remains a low-priority UX concern for P1.

## Decree Compliance

- **decree-035 (nature-adjusted base stats for Base Relations):** COMPLIANT. All three code paths that validate Base Relations -- `evolution.service.ts:152`, `EvolutionConfirmModal.vue:250`, and `allocate-stats.post.ts:146` -- pass nature-adjusted base stats to `validateBaseRelations()`. The ordering tiers are computed from nature-modified values per the decree.

- **decree-036 (stone evolutions learn new-form moves at or below current level):** NOT APPLICABLE TO P0. Move learning is deferred to P1 (evolution.service.ts comment at line 295: "P1 handles: abilities, moves, capabilities, skills"). No violation -- the decree constraint applies when move learning is implemented.

No decree violations found. No new ambiguities requiring decree-need tickets.

## Summary

The fix cycle for feature-006 (Pokemon Evolution System P0) has addressed all 7 issues from code-review-226:
- **C1 (spriteUrl):** Fixed by resetting to null so client recomputes from new species
- **H1 (pokemon-evolved event):** Fixed by wiring the event handler in XpDistributionModal
- **H2 (branching evolutions):** Fixed with a proper selection UI for multi-path evolutions
- **H3 (encounter-active guard):** Fixed with 409 Conflict rejection for in-encounter Pokemon
- **M1 (app-surface.md):** Updated with all new entries
- **M2 (PokemonLevelUpPanel):** Updated text to reference the Evolve button
- **M3 (validateBaseRelations):** Properly extracted to shared `baseRelations.ts`

The new code introduced by the fix cycle (encounter guard, branching selection UI, event wiring, spriteUrl null) does not introduce any PTU rule violations. The `allocate-stats.post.ts` endpoint (introduced alongside these fixes as part of feature-007) correctly enforces the Base Relations Rule and HP formula.

All PTU formulas remain correct:
- HP: `level + (hpStat * 3) + 10`
- Stat budget: `level + 10`
- Nature: `+2/-2` (non-HP) or `+1/-1` (HP), floored at 1
- Base Relations: nature-adjusted ordering preserved per decree-035

## Rulings

1. **R029 (evolution check on level up):** CORRECT. Level-up integration feeds evolution levels accurately. Stone/item evolutions correctly excluded from level-up notifications.

2. **R031 (stat recalculation):** CORRECT. Formula chain follows PTU p.202 exactly. Nature reapplied to new species' raw base stats. spriteUrl now properly cleared.

3. **R032 (ability remapping):** NOT IMPLEMENTED (deferred to P1). Acceptable per P0 scope.

4. **R033 (immediate move learning):** NOT IMPLEMENTED (deferred to P1). decree-036 will apply when implemented.

5. **R034 (skills/capabilities update):** NOT IMPLEMENTED (deferred to P1). Acceptable per P0 scope.

## Verdict

**APPROVED**

All 7 issues from code-review-226 have been verified as fixed. The fix cycle introduces no new PTU rule violations. The core evolution mechanics (stat recalculation, Base Relations, HP formula, nature application, eligibility check) remain PTU-correct. Decree-035 compliance is maintained across all stat allocation code paths. The single medium issue (even distribution default) is a carried-over UX note from rules-review-202 and does not constitute a rules violation.

No critical or high issues found. No decree violations found.

## Required Changes

None. APPROVED for merge.

P1 implementation should address:
- R032: Ability remapping (positional mapping from old to new ability list)
- R033: Move learning (respecting decree-036 for stone evolutions)
- R034: Skills/capabilities update from new species data
- MEDIUM-001 (carried): Consider pre-populating old stat allocation as default in EvolutionConfirmModal
