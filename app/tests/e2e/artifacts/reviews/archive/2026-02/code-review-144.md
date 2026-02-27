---
review_id: code-review-144
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: feature-003
domain: player-view
commits_reviewed:
  - 2340554
  - 818f479
  - b8bc03c
  - 41c25f8
  - 37f80d5
  - 430f96a
  - dc1f21e
  - 698e479
  - c04921c
files_reviewed:
  - app/pages/player/index.vue
  - app/components/player/PlayerCharacterSheet.vue
  - app/components/player/PlayerNavBar.vue
  - app/components/player/PlayerPokemonCard.vue
  - app/components/player/PlayerMoveList.vue
  - app/components/player/PlayerCombatantInfo.vue
  - app/components/player/PlayerPokemonTeam.vue
  - app/components/player/PlayerEncounterView.vue
  - app/types/player.ts
  - app/types/index.ts
  - app/assets/scss/components/_player-view.scss
  - app/assets/scss/_variables.scss
  - app/nuxt.config.ts
  - app/tests/e2e/artifacts/tickets/feature/feature-003.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
reviewed_at: 2026-02-23T11:15:00Z
follows_up: code-review-139
---

## Review Scope

Re-review of the feature-003 P0 Track A fix cycle. The developer addressed all 8 issues (C1, H1-H3, M1-M4) from code-review-139 across 9 commits (2340554..c04921c). This review verifies each fix was correctly implemented and checks for newly introduced issues.

## Verification of Original Issues

### C1: WebSocket `character_update` listener -- VERIFIED CORRECT

**Commit:** 37f80d5

The listener is wired in `onMounted` at `pages/player/index.vue:210-218`:

```typescript
removeWsListener = onMessage((message) => {
  if (message.type === 'character_update' && playerStore.characterId) {
    const data = message.data as { id?: string }
    const entityId = data?.id
    if (entityId === playerStore.characterId || playerStore.pokemonIds.includes(entityId ?? '')) {
      refreshCharacterData()
    }
  }
})
```

Verification points:
- `onMessage()` returns a cleanup function, stored in `removeWsListener` and invoked in `onUnmounted` (line 248-251). No leak.
- The `character_update` event type has `data: Pokemon | HumanCharacter` (confirmed in `types/api.ts:40`). Both types have `id: string`, so the `{ id?: string }` cast is safe.
- Matches against both `characterId` (for the trainer) and `pokemonIds` (for owned Pokemon). Both entity types are covered.
- Calls `refreshCharacterData()` which re-fetches from the API, ensuring the local state stays current.
- Guard `playerStore.characterId` prevents processing when not identified.

### H1: SCSS extracted to shared `_player-view.scss` -- VERIFIED CORRECT

**Commit:** 818f479

Four shared class families were extracted to `assets/scss/components/_player-view.scss` (106 lines):
1. `.type--*` (18 Pokemon type badge colors)
2. `.player-stat-cell` (stat grid cell with label, value, stage)
3. `.player-hp-bar-*` (track, fill with color variants, label)
4. `.player-status-badge` (status condition badges)

The file is registered globally via `nuxt.config.ts` CSS array (line 18). This is correct because the styles need to be unscoped so child components can reference them, and the scoped components use `:deep()` for size overrides.

Verified removed from: PlayerPokemonCard.vue (type badges, stat cells, HP bar, status badges), PlayerMoveList.vue (type badges), PlayerCombatantInfo.vue (type badges, HP bar, status badges), PlayerCharacterSheet.vue (stat cells, HP bar, status badges).

Each component retains local `:deep()` overrides for component-specific sizing (e.g., PokemonCard HP bar at 6px, CombatantInfo HP bar at 5px, CombatantInfo status badge at 9px/2px-radius).

Class names were renamed from generic (`.stat-cell`, `.hp-bar-*`, `.status-badge`) to prefixed (`.player-stat-cell`, `.player-hp-bar-*`, `.player-status-badge`) to avoid global namespace collisions. This is good practice.

### H2: Equipment evasion bonus in `calculateEvasion()` -- VERIFIED CORRECT

**Commit:** 41c25f8

`PlayerCharacterSheet.vue` now imports `computeEquipmentBonuses` and `calculateEvasion`:

```typescript
const equipBonuses = computed(() =>
  computeEquipmentBonuses((props.character.equipment ?? {}) as EquipmentSlots)
)

const physEvasion = computed(() => {
  const { evasionBonus, statBonuses } = equipBonuses.value
  const defBonus = statBonuses.defense ?? 0
  return calculateEvasion(props.character.stats.defense, props.character.stageModifiers.defense ?? 0, evasionBonus, defBonus)
})
```

Cross-referenced against `useMoveCalculation.ts:191-233` (GM combat evasion calculation), which follows the same pattern: `computeEquipmentBonuses()` for human targets, extracting `evasionBonus` and per-stat Focus bonuses, passing all four parameters to the evasion function. The `calculateEvasion()` signature in `damageCalculation.ts:102` is `(baseStat, combatStage, evasionBonus, statBonus)` with defaults of 0 for the last two. The player sheet now passes all four, matching the GM combat path exactly.

One difference from the GM combat path: the GM view picks the MAX of physical/special evasion vs speed evasion per PTU p.234 (rational defender always picks best). The player sheet displays all three evasions separately, which is correct for a character sheet display -- the player needs to see all three values, and the max-selection happens at accuracy check time in combat.

### H3: Exponential backoff on encounter polling -- VERIFIED CORRECT

**Commit:** 430f96a

Implementation in `pages/player/index.vue:116-172`:

```typescript
const POLL_BASE_INTERVAL = 3000      // 3s base
const POLL_MAX_INTERVAL = 30000      // 30s cap
const POLL_BACKOFF_THRESHOLD = 5     // 5 consecutive failures before backoff

const getPollInterval = (): number => {
  if (pollFailureCount < POLL_BACKOFF_THRESHOLD) return POLL_BASE_INTERVAL
  const backoffFactor = Math.pow(2, pollFailureCount - POLL_BACKOFF_THRESHOLD)
  return Math.min(POLL_BASE_INTERVAL * backoffFactor, POLL_MAX_INTERVAL)
}
```

Behavior verified:
- 0-4 failures: 3s interval (normal polling)
- 5 failures: `3000 * 2^0 = 3000ms` (3s -- first backoff, same as normal)
- 6 failures: `3000 * 2^1 = 6000ms` (6s)
- 7 failures: `3000 * 2^2 = 12000ms` (12s)
- 8 failures: `3000 * 2^3 = 24000ms` (24s)
- 9+ failures: capped at 30000ms (30s)

On success, `pollFailureCount` resets to 0 and if it was in a backed-off state, `restartPolling()` restores the normal 3s interval. The `catch` block increments the counter and restarts polling with the new interval when crossing or exceeding the threshold.

The interval cleanup happens in `onUnmounted` (line 252-255). The `restartPolling()` function clears the old interval before setting the new one, preventing stacked intervals.

### M1: `PlayerTab` type moved to `types/player.ts` -- VERIFIED CORRECT

**Commit:** 2340554

`types/player.ts` (7 lines) defines:
```typescript
export type PlayerTab = 'character' | 'team' | 'encounter'
```

Re-exported via `types/index.ts` barrel (line 35: `export * from './player'`). `PlayerNavBar.vue` imports from `~/types/player` (line 23). `pages/player/index.vue` imports from `~/types/player` (line 73). The SFC export in PlayerNavBar was removed.

### M2: `aria-label` on Switch Character button -- VERIFIED CORRECT

**Commit:** dc1f21e

`pages/player/index.vue:23`:
```html
<button class="player-top-bar__switch" aria-label="Switch character" @click="handleSwitchCharacter">
```

The icon-only button now has proper accessibility labeling.

### M3: `alert()` replaced with inline error -- VERIFIED CORRECT

**Commit:** 698e479

`pages/player/index.vue:5-8` shows inline error display:
```html
<div v-if="selectionError" class="player-error player-error--selection">
  <PhWarningCircle :size="32" />
  <p>{{ selectionError }}</p>
</div>
```

The `handleSelectCharacter` function (line 176-195) sets `selectionError.value` on catch and clears it on entry. The error styling uses `.player-error--selection` with compact padding and smaller font. The error is dismissed automatically when the user tries again (`selectionError.value = null` at line 177).

### M4: Hardcoded `72px` replaced with `$player-nav-clearance` -- VERIFIED CORRECT

**Commit:** b8bc03c

`_variables.scss:208`:
```scss
$player-nav-clearance: 72px;
```

With a comment explaining the derivation (56px nav + safe-area + buffer). Used in:
- `PlayerCharacterSheet.vue:296`: `padding-bottom: $player-nav-clearance;`
- `PlayerPokemonTeam.vue:31`: `padding-bottom: $player-nav-clearance;`
- `PlayerEncounterView.vue:112`: `padding-bottom: $player-nav-clearance;`

All three content-bearing tab components use the variable consistently.

## Issues

### MEDIUM

**M1: Stat cell label/stage font-size changed for PokemonCard (visual regression)**

The original `PlayerPokemonCard.vue` used `font-size: 9px` for `.stat-cell__label` and `.stat-cell__stage`. The original `PlayerCharacterSheet.vue` used `font-size: 10px` for both. The shared `_player-view.scss` unified on 10px (the CharacterSheet values). The CharacterSheet correctly overrides `.player-stat-cell__value` via `:deep()` for its larger value font, but the PokemonCard does not add a `:deep()` override to restore its original 9px label/stage sizing.

This is a 1px visual difference on compact Pokemon card stat grids. Since the PokemonCard is a mobile-first compact view, the smaller 9px was intentional for space efficiency. The fix is to add a `:deep()` override in `PlayerPokemonCard.vue`:

```scss
.pokemon-card__stats {
  :deep(.player-stat-cell__label) {
    font-size: 9px;
  }
  :deep(.player-stat-cell__stage) {
    font-size: 9px;
  }
}
```

**Not blocking.** This is a cosmetic-level regression (1px). The PokemonCard still looks correct; the stat cells are marginally wider. Can be fixed in a follow-up without re-review.

## What Looks Good

1. **WebSocket listener architecture** -- Clean setup/teardown pattern. The listener is registered in `onMounted`, stored as a cleanup ref, and destroyed in `onUnmounted`. No memory leaks. Guard against processing when not identified.

2. **SCSS extraction strategy** -- The developer chose global CSS via the Nuxt `css` array with `:deep()` overrides for per-component sizing. This is the correct approach for shared utility classes that span multiple scoped components. Class name prefixing (`player-*`) prevents global collisions with GM/Group view styles.

3. **Evasion calculation parity** -- The player sheet now exactly mirrors the GM combat path (`useMoveCalculation.ts`) for equipment bonus integration. Both extract `evasionBonus` and per-stat Focus bonuses from `computeEquipmentBonuses()`, then pass all four parameters to `calculateEvasion()`.

4. **Backoff implementation** -- Exponential backoff with configurable threshold, base interval, and cap. Recovery logic correctly restores normal polling speed after success. No interval stacking due to `clearInterval` before `setInterval` in `restartPolling()`.

5. **Commit granularity** -- 9 commits for 8 issues, each commit addressing exactly one concern. Good discipline.

6. **Type extraction** -- `PlayerTab` is properly re-exported through the barrel file (`types/index.ts`) and imported in both consuming files.

7. **Inline error pattern** -- The selection error display with `PhWarningCircle` icon follows the existing error display pattern used elsewhere in the page (lines 35-41). Auto-clear on retry is good UX.

8. **Documentation** -- The feature-003 ticket was updated with a complete resolution log including all 8 commit hashes, dates, descriptions, and file lists.

## Verdict

**APPROVED**

All 8 issues from code-review-139 have been correctly implemented. The one medium-severity visual regression (1px font size change in PokemonCard stat cells) is cosmetic and does not affect functionality. It can be addressed in a follow-up patch without blocking the fix cycle.

No new CRITICAL or HIGH issues were introduced. The code is clean, properly structured, and follows project patterns.
