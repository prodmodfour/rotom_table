---
review_id: code-review-232
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-011
domain: combat
commits_reviewed:
  - a4ede7d
  - e92405f
  - 23c2e76
  - fcf791a
  - d7ab314
  - 2aa2dd4
  - 272aa69
  - 7ed0283
  - 18d1717
  - d492e68
files_reviewed:
  - app/types/combat.ts
  - app/types/encounter.ts
  - app/prisma/schema.prisma
  - app/server/services/switching.service.ts
  - app/server/services/encounter.service.ts
  - app/server/api/encounters/[id]/switch.post.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/server/api/encounters/[id]/start.post.ts
  - app/composables/useSwitching.ts
  - app/components/encounter/SwitchPokemonModal.vue
  - app/components/encounter/CombatantCard.vue
  - app/components/gm/CombatantSides.vue
  - app/stores/encounter.ts
  - app/pages/gm/index.vue
  - .claude/skills/references/app-surface.md
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 2
  medium: 3
reviewed_at: 2026-03-01T04:30:00Z
follows_up: null
---

## Review Scope

First review of feature-011 Pokemon Switching Workflow P0 implementation. 10 commits across 18 files (+1340 lines). The feature adds a formal PTU switching workflow: full switch as Standard Action with 8m range check, initiative insertion, combatant removal/addition, encounter store actions, WebSocket broadcast, and GM UI (Switch button on CombatantCard + SwitchPokemonModal).

Decree compliance checked: decree-006 (initiative reordering), decree-021 (League two-phase), decree-033 (fainted switch timing), decree-034 (Roar/Whirlwind).

## Issues

### CRITICAL

#### C1. WebSocket `pokemon_switched` event is not handled by client-side receiver

**File:** `app/composables/useWebSocket.ts` (not modified by this PR)
**File:** `app/server/api/encounters/[id]/switch.post.ts` (lines 244-256)

The switch endpoint broadcasts a `pokemon_switched` event via `broadcastToEncounter()`, but the client-side `handleMessage` switch statement in `useWebSocket.ts` has no `case 'pokemon_switched'` handler. The event is silently dropped by the default branch. This means:

- **Group View will NOT update** after a switch. The recalled Pokemon stays visible; the replacement never appears.
- **Player View will NOT update** after a switch.
- Only the GM's own client (which updates via the API response, not WebSocket) reflects the change.

The broadcast payload includes `encounter: responseEncounter` (the full encounter state), so the fix is straightforward: add a handler in `useWebSocket.ts` that calls `getEncounterStore().updateFromWebSocket(message.data.encounter)` for `pokemon_switched` events.

**Fix:** Add to `useWebSocket.ts`:
```typescript
case 'pokemon_switched':
  getEncounterStore().updateFromWebSocket(message.data.encounter)
  break
```

### HIGH

#### H1. Switch action is not captured in undo/redo history

**File:** `app/pages/gm/index.vue` (line 386-393, `handleSwitchPokemon`)

Every other combat action in the GM page calls `encounterStore.captureSnapshot(label)` before executing the action (damage, heal, stages, status, moves, maneuvers, shift, pass, token move). The switch handler does NOT capture a snapshot. This means:

- Switching Pokemon is **not undoable** via Ctrl+Z
- The undo history breaks: the snapshot before the switch is never recorded, so undoing a subsequent action may produce a state with the wrong Pokemon in the encounter

**Fix:** Add `encounterStore.captureSnapshot(...)` at the start of `handleSwitchPokemon` and `refreshUndoRedoState()` after the switch completes. This also requires the page to know the switch succeeded (the modal currently emits `@switched` which closes the modal -- the snapshot should be captured before the modal opens, similar to how other actions work):

```typescript
const handleSwitchPokemon = (combatantId: string) => {
  if (!encounter.value) return
  const combatant = encounter.value.combatants.find(c => c.id === combatantId)
  if (!combatant) return
  // Capture snapshot before opening modal (captures pre-switch state)
  encounterStore.captureSnapshot('Switch Pokemon')
  switchModalCombatantId.value = combatantId
  showSwitchModal.value = true
}
```

And update the `@switched` handler to refresh undo/redo state and broadcast:
```typescript
@switched="handleSwitchCompleted"
```

#### H2. Switch action not broadcast via `encounter_update` WebSocket event (GM page omission)

**File:** `app/pages/gm/index.vue` (lines 144-153)

Looking at the SwitchPokemonModal integration, after the switch succeeds the modal emits `@switched` which just sets `showSwitchModal = false`. There is no `send({ type: 'encounter_update', data: encounterStore.encounter })` call after the switch, unlike every other state-modifying action in the GM page (next-turn, start, weather, declarations all broadcast `encounter_update`).

While C1 above addresses the server-side `pokemon_switched` broadcast not being handled, the standard pattern in this codebase is for the GM page to also broadcast a full `encounter_update` after state changes. Without this, even if C1 is fixed, the update path relies solely on the server broadcast. Add a WebSocket broadcast after switch completes, following the same pattern as `nextTurn` and `startEncounter`.

### MEDIUM

#### M1. `canShowSwitchButton` for trainers always returns `true` -- no meaningful check

**File:** `app/components/encounter/CombatantCard.vue` (lines 341-351)

```typescript
const canShowSwitchButton = computed(() => {
  if (props.combatant.type === 'human') {
    // Trainer: show if they own any Pokemon in the encounter
    return true  // <-- Comment says "show if they own Pokemon" but always returns true
  }
  // ...
})
```

The comment says "show if they own any Pokemon in the encounter" but the implementation just returns `true` for all human combatants, including NPCs who may not have any Pokemon at all. This means an NPC guard or bystander added to the encounter will show a "Switch" button despite having no Pokemon to switch.

**Fix:** Check if the trainer actually owns any Pokemon in the encounter:
```typescript
if (props.combatant.type === 'human') {
  const trainerEntityId = props.combatant.entityId
  const encounterStore = useEncounterStore()
  return encounterStore.encounter?.combatants.some(
    c => c.type === 'pokemon' && (c.entity as Pokemon).ownerId === trainerEntityId
  ) ?? false
}
```

#### M2. `getBenchPokemon` fetches the full character endpoint instead of a dedicated Pokemon list endpoint

**File:** `app/composables/useSwitching.ts` (lines 22-25)

```typescript
const response = await $fetch<{ data: { pokemon: Pokemon[] } }>(
  `/api/characters/${trainerEntityId}`
)
const allPokemon = response.data.pokemon || []
```

The composable fetches the entire character record (including stats, skills, features, equipment, inventory, background, etc.) just to get the Pokemon array. This is an over-fetch that transfers unnecessary data. The design spec suggested `/api/characters/${trainerEntityId}/pokemon` but that endpoint doesn't exist.

While this works, it transfers the full character payload including all JSON blobs (skills, features, equipment, inventory) when only the Pokemon array is needed. For trainers with extensive inventories or many features, this is wasteful.

**Fix:** Either create a lightweight `GET /api/characters/:id/pokemon` endpoint, or accept this as a P1 optimization and add a comment noting the over-fetch. This is MEDIUM because it works correctly but violates ISP (fetches far more data than needed).

#### M3. Switch button disabled check is incomplete -- only checks `standardActionUsed`, not turn ownership

**File:** `app/components/encounter/CombatantCard.vue` (lines 183-184)

```typescript
:disabled="!isCurrent || combatant.turnState.standardActionUsed"
```

The `:disabled` binding checks `!isCurrent` (is this combatant the current turn?) and `standardActionUsed`. But the switch can be initiated on either the trainer's OR the Pokemon's turn. If a trainer's Pokemon is the current combatant, the trainer's card will show `!isCurrent` as `true` (since the Pokemon is current, not the trainer), so the button will be disabled even though the switch could legitimately be initiated from the Pokemon's turn.

The server correctly validates this (the switch can be on either the trainer's or Pokemon's turn), but the client button is overly restrictive. The `canSwitch` function in `useSwitching.ts` already handles this correctly by checking both cases. The button should use `canSwitch` instead of inline logic, or at minimum check both the trainer's and the relevant Pokemon's current-turn status.

**Fix:** Use the `canSwitch` function from `useSwitching` to determine disabled state, or expand the inline check:
```typescript
:disabled="!canSwitchFromThisCard"
```
Where `canSwitchFromThisCard` is a computed that calls `canSwitch(trainerId, pokemonId).allowed`.

## What Looks Good

1. **Service architecture is excellent.** `switching.service.ts` (434 lines) is well-organized into clear sections (constants, range validation, combatant removal, initiative insertion, action tracking, switch action builder, validation). Pure functions with immutable patterns. The 10-step validation chain is thorough and ordered correctly.

2. **Initiative insertion logic is correct and handles both battle modes.** `insertIntoFullContactTurnOrder` correctly freezes acted slots and re-sorts only unacted. `insertIntoLeagueTurnOrder` correctly inserts into `pokemonTurnOrder` always, and into the active `turnOrder` only during pokemon phase. Per decree-021, new Pokemon goes into pokemonTurnOrder only (not trainerTurnOrder). This is correct.

3. **Range check respects all edge cases.** League battles bypass range (PTU p.229). Gridless encounters default to in-range. Diagonal distance uses `ptuDiagonalDistance` per decree-002. The `POKEBALL_RECALL_RANGE = 8` constant is properly extracted.

4. **Data model is clean and forward-looking.** The `SwitchAction` interface supports P1/P2 action types (`fainted_switch`, `recall_only`, `release_only`, `forced_switch`) even though P0 only uses `full_switch`. The `switchActions` lifecycle (clear on new round and encounter start) is integrated into both `next-turn.post.ts` and `start.post.ts`.

5. **Encounter store integration is minimal and correct.** The `switchPokemon` action follows existing patterns. `updateFromWebSocket` handles `switchActions` with the standard undefined-guard pattern (line 533-535). The store is 808 lines but this is acceptable for its central role.

6. **`removeCombatantFromEncounter` is properly extracted and immutable.** Returns new arrays without mutating inputs. Turn index adjustment logic correctly handles removal before, at, and after the current index.

7. **The modal UI is clean and focused.** SwitchPokemonModal (287 lines) shows the recalled Pokemon with danger styling, loads bench Pokemon on mount, displays selectable cards with sprite/level/HP, and has proper error display. Loading state is handled correctly.

8. **`buildEncounterResponse` and `ParsedEncounter` properly extended.** The encounter service interface and response builder both include `switchActions` with the correct option override pattern.

9. **Commit granularity is good.** 10 commits, each with a single logical change: data model, service, endpoint, composable, modal, store integration, lifecycle, app-surface, ticket update. This follows the project's small-commit guidelines.

10. **app-surface.md updates are comprehensive.** The switch endpoint is documented in the encounters section, the switching service in the server services table, the SwitchPokemonModal in the encounter components list, and the `pokemon_switched` WebSocket event in the switching system description.

## Verdict

**CHANGES_REQUIRED**

The implementation is architecturally sound and the PTU rule logic is correct. However, three issues must be addressed before P0 can ship:

1. **C1 (CRITICAL):** Group View and Player View will not update after a switch because the `pokemon_switched` WebSocket event is not handled client-side. This is a data sync break.
2. **H1 (HIGH):** Switching is not captured in undo/redo history, breaking the undo chain for subsequent actions.
3. **H2 (HIGH):** No `encounter_update` WebSocket broadcast from the GM page after switch completes, inconsistent with all other state-modifying actions.

The three MEDIUM issues (M1, M2, M3) should also be addressed now since the developer is already in these files.

## Required Changes

| ID | Severity | File(s) | Description |
|----|----------|---------|-------------|
| C1 | CRITICAL | `app/composables/useWebSocket.ts` | Add `case 'pokemon_switched'` handler that calls `updateFromWebSocket(message.data.encounter)` |
| H1 | HIGH | `app/pages/gm/index.vue` | Add `captureSnapshot('Switch Pokemon')` before opening the switch modal, and `refreshUndoRedoState()` after switch completes |
| H2 | HIGH | `app/pages/gm/index.vue` | Add `encounter_update` WebSocket broadcast after successful switch (in `@switched` handler or new `handleSwitchCompleted` function) |
| M1 | MEDIUM | `app/components/encounter/CombatantCard.vue` | Make `canShowSwitchButton` check whether the trainer actually owns Pokemon in the encounter instead of always returning `true` for humans |
| M2 | MEDIUM | `app/composables/useSwitching.ts` | Add comment acknowledging over-fetch from character endpoint, or create a lightweight Pokemon-list endpoint |
| M3 | MEDIUM | `app/components/encounter/CombatantCard.vue` | Fix Switch button disabled logic to account for switch being initiatable from the Pokemon's turn (not just the trainer's) |
