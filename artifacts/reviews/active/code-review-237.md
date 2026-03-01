---
review_id: code-review-237
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-006
domain: pokemon-lifecycle
commits_reviewed:
  - 897920d0
  - 98ac8f2e
  - bc87faf8
  - eaa6a4c2
  - 825f6aff
  - 49dc745e
  - b9e92fca
  - cb080f25
  - 6ce92ba5
  - 865d0618
files_reviewed:
  - app/server/services/evolution.service.ts
  - app/utils/evolutionCheck.ts
  - app/server/api/pokemon/[id]/evolve.post.ts
  - app/server/api/pokemon/[id]/evolution-check.post.ts
  - app/components/pokemon/EvolutionConfirmModal.vue
  - app/components/pokemon/EvolutionAbilityStep.vue
  - app/components/pokemon/EvolutionMoveStep.vue
  - app/components/pokemon/EvolutionStatStep.vue
  - app/pages/gm/pokemon/[id].vue
  - app/components/encounter/XpDistributionResults.vue
  - app/server/utils/websocket.ts
  - app/server/routes/ws.ts
  - app/assets/scss/components/_evolution-modal.scss
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 2
  medium: 3
reviewed_at: 2026-03-01T10:15:00Z
follows_up: code-review-231
---

## Review Scope

P1 implementation of feature-006 (Pokemon Evolution System). P0 was previously APPROVED via code-review-231 + rules-review-207. This review covers the 10 commits from plan-20260301-084803 slave-2, implementing:

- R032: Ability remapping (positional, with GM resolution for edge cases)
- R033: Evolution move learning (decree-036 for stone evolutions)
- R034: Capability/skill/size updates
- WebSocket `pokemon_evolved` broadcast
- Multi-step evolution modal (stat/ability/move/summary) with 3 extracted sub-components
- Caller updates (Pokemon sheet page, XpDistributionResults)

Files reviewed: 13 source files, ~4,076 total lines. All files under 800-line limit (largest: `gm/pokemon/[id].vue` at 629 lines).

Decrees checked:
- decree-035 (nature-adjusted base stats for Base Relations ordering): P0 compliance verified in code-review-231. P1 does not modify Base Relations logic. Compliant.
- decree-036 (stone evolution move learning -- at or below current level): Implementation partially compliant -- see CRITICAL-1 below.

## Issues

### CRITICAL

**CRITICAL-1: `getEvolutionMoves()` uses `<=` instead of `<` for level-based evolutions (PTU rule violation)**

File: `app/utils/evolutionCheck.ts`, line 168

The PTU text (Chapter 5, p.202) states: "they can immediately learn any Moves that their new form learns **at a Level lower than** their minimum Level for Evolution." The design spec (section 2.2, algorithm step 1) correctly encodes this as `level < evolutionMinLevel` for the standard level-based case and `level <= currentLevel` for stone evolutions (per decree-036).

The implementation uses a single comparison for both cases:
```typescript
const levelCeiling = evolutionMinLevel ?? currentLevel
// ...
if (entry.level > levelCeiling) return false  // This is entry.level <= levelCeiling
```

This makes the standard case use `<=` when it should be `<`. For a Charmeleon evolving at level 36, the code would incorrectly offer Charizard moves AT level 36, when PTU rules only allow moves at levels 1-35.

**Fix:** Split the comparison:
```typescript
const levelCeiling = evolutionMinLevel !== null
  ? evolutionMinLevel - 1   // PTU: "lower than" = strict less than
  : currentLevel             // decree-036: "at or below" = less than or equal
```

Or equivalently:
```typescript
if (evolutionMinLevel !== null && entry.level >= evolutionMinLevel) return false
if (evolutionMinLevel === null && entry.level > currentLevel) return false
```

### HIGH

**HIGH-1: `getOldAbilityName()` uses wrong index mapping for ability display**

File: `app/components/pokemon/EvolutionAbilityStep.vue`, lines 88-93

```typescript
function getOldAbilityName(remapIndex: number): string {
  if (remapIndex < props.currentAbilities.length) {
    return props.currentAbilities[remapIndex].name
  }
  return '???'
}
```

This function takes `remapIndex` -- the index within `remappedAbilities[]` -- and uses it to look up `currentAbilities[remapIndex]`. This assumes a 1:1 positional correspondence between `remappedAbilities` and `currentAbilities`, but that is not the case. `remapAbilities()` splits current abilities into three categories: remapped, needsResolution, and preserved. If any current abilities are preserved (not in old species list), they are excluded from `remappedAbilities`, shifting all subsequent indices.

Example: Pokemon has abilities [FeatureAbility, OldBasic1, OldBasic2]. FeatureAbility is preserved (index 0 in currentAbilities but not in remappedAbilities). OldBasic1 maps to remappedAbilities[0] but `getOldAbilityName(0)` returns `currentAbilities[0].name` = "FeatureAbility" instead of "OldBasic1".

**Fix:** Track the original ability name within `remapAbilities()` result (add an `oldName` field to each remapped entry), or pass the old species ability list and use positional lookup against it.

**HIGH-2: N+1 query pattern in `enrichAbilityEffects()`**

File: `app/server/services/evolution.service.ts`, lines 267-276

```typescript
export async function enrichAbilityEffects(
  abilities: Array<{ name: string; effect: string }>
): Promise<Array<{ name: string; effect: string }>> {
  const enriched: Array<{ name: string; effect: string }> = []
  for (const ability of abilities) {
    const effect = await lookupAbilityEffect(ability.name)  // 1 query per ability
    enriched.push({ name: ability.name, effect: effect || ability.effect })
  }
  return enriched
}
```

This makes N sequential DB queries (one per ability, typically 3-5). Should batch into a single `findMany`:

```typescript
const names = abilities.map(a => a.name)
const records = await prisma.abilityData.findMany({
  where: { name: { in: names } }
})
const effectMap = new Map(records.map(r => [r.name, r.effect]))
return abilities.map(a => ({
  name: a.name,
  effect: effectMap.get(a.name) || a.effect
}))
```

### MEDIUM

**MEDIUM-1: `selectedMoveList` computed property duplicated between parent and child**

Files: `app/components/pokemon/EvolutionConfirmModal.vue` (line 304) and `app/components/pokemon/EvolutionMoveStep.vue` (line 133)

The exact same `selectedMoveList` computed property (filtering removed moves and mapping added moves) is duplicated in both the parent modal and the child step component. This violates DRY. The parent needs it for validation (`canProceed`, `canEvolve`) and for submitting the final move list; the child needs it for display.

**Fix:** Either pass `selectedMoveList` as a prop from parent to child, or lift the computation to the parent and pass the result down.

**MEDIUM-2: `app-surface.md` not updated for P1 additions**

File: `.claude/skills/references/app-surface.md`

The app-surface.md still describes P0-only evolution functionality. P1 added:
- New functions: `remapAbilities()`, `getEvolutionMoves()`, `enrichAbilityEffects()`, `lookupAbilityEffect()`, `notifyPokemonEvolved()`
- New components: `EvolutionAbilityStep.vue`, `EvolutionMoveStep.vue`, `EvolutionStatStep.vue`
- Extended endpoints: evolve now accepts abilities/moves; evolution-check now returns abilityRemap and evolutionMoves
- New WS event: `pokemon_evolved`

This must be updated so other skills and reviewers can discover the new surface area.

**MEDIUM-3: Ability resolution dropdown does not show ability effect descriptions**

File: `app/components/pokemon/EvolutionAbilityStep.vue`, lines 52-57

When a GM must resolve an ambiguous ability (slot mismatch), the dropdown shows only ability names:
```vue
<option v-for="opt in item.options" :key="opt.name" :value="opt.name">
  {{ opt.name }}
</option>
```

The `options` array from `remapAbilities()` only has `{ name: string }` (no effect text). The GM must choose an ability replacement without seeing what any of the options actually do. For Pokemon with 5 abilities in the new species' list, this forces the GM to look up effects externally.

**Fix:** Enrich the `needsResolution.options` with effect text (fetch from AbilityData in the evolution-check endpoint) and display it in the dropdown or as a tooltip.

## What Looks Good

1. **Clean architecture.** Pure functions in `utils/evolutionCheck.ts` (no DB access), service layer in `evolution.service.ts` (business logic + DB), thin controller in the API endpoints. SRP well-applied across the 3-layer separation.

2. **Immutability.** All functions return new objects/arrays. `remapAbilities()` uses `{ ...ability }` spreads. `enrichAbilityEffects()` builds a new array. Reactive state updates use `[...array]` patterns. No mutations detected.

3. **Component extraction.** The modal was decomposed into 3 sub-components (EvolutionStatStep, EvolutionAbilityStep, EvolutionMoveStep) keeping the parent at 406 lines. All components are well under 800 lines. SCSS extracted to a shared partial.

4. **Capability/skill updates (R034).** Straightforward and correct -- new species capabilities and skills are directly read from SpeciesData and written to the Pokemon record. Size, weight class, movement speeds, jump, power, other capabilities all correctly sourced from the target species.

5. **WebSocket integration.** `notifyPokemonEvolved()` broadcasts to all connected clients (not just encounter-scoped). The ws.ts handler correctly relays `pokemon_evolved` events. Clean separation between the utility function and the route handler.

6. **Decree-035 compliance.** P1 does not modify Base Relations validation logic -- the nature-adjusted base stats ordering established in P0 remains intact and is used correctly in the stat redistribution step.

7. **Decree-036 partial compliance.** The stone evolution case (no minimum level) correctly substitutes the Pokemon's current level as the upper bound. The error is only in the standard case using `<=` instead of `<`.

8. **Move learning UI.** The add/replace/remove flow is well-designed. The `replacingIndex` state for swap mode, the `unlearnedEvolutionMoves` computed filtering out already-added moves, and the 6-move slot limit enforcement all work correctly.

9. **Endpoint validation.** The evolve endpoint validates abilities array (each must have a name string), moves array (max 6, each must have a name string), and stat points (all integers, all non-negative). The encounter-active guard (409) is a sensible safety check.

10. **MoveData enrichment.** The evolution-check endpoint pre-fetches MoveData for available evolution moves using a batch `findMany` query, then maps them into the response. This avoids N+1 on the client side.

## Verdict

**CHANGES_REQUIRED**

CRITICAL-1 is a PTU rule correctness bug that must be fixed before this can be approved. The level comparison for evolution moves uses `<=` when PTU rules require `<` (strict less than) for level-based evolutions. This could offer incorrect moves to players.

HIGH-1 (ability display index mismatch) is a display correctness bug that will show wrong "old ability" names when a Pokemon has non-species abilities. Must fix.

HIGH-2 (N+1 query) is a performance issue that should be fixed while the developer is already in this code.

## Required Changes

1. **[CRITICAL-1]** In `app/utils/evolutionCheck.ts`, `getEvolutionMoves()`: change the level comparison to use strict less-than (`<`) when `evolutionMinLevel` is not null. The stone evolution case (`<=` with `currentLevel`) is correct per decree-036 and should remain.

2. **[HIGH-1]** In `app/components/pokemon/EvolutionAbilityStep.vue`: fix `getOldAbilityName()` to correctly map remapped ability indices back to the original ability names. Either add an `oldName` field to `AbilityRemapResult.remappedAbilities` entries in the service, or use the old species ability list for the lookup.

3. **[HIGH-2]** In `app/server/services/evolution.service.ts`: replace the sequential `enrichAbilityEffects()` loop with a batch `findMany` query.

4. **[MEDIUM-1]** Remove the `selectedMoveList` duplication between EvolutionConfirmModal and EvolutionMoveStep. Pass it as a prop from parent to child.

5. **[MEDIUM-2]** Update `app-surface.md` with P1 additions (new functions, components, endpoint changes, WS event).

6. **[MEDIUM-3]** Enrich ability resolution options with effect text in the evolution-check endpoint response.
