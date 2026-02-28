# P2: Polish -- Special Conditions, Items, and Cancellation

**Priority:** P2 (nice to have)
**Scope:** Evolution stones/items from inventory, trade evolution placeholder, special conditions, evolution cancellation/prevention, Eviolite interaction, evolution history/log
**Depends on:** P0 + P1

## Overview

P2 adds the quality-of-life features and edge cases that make the evolution system complete. P0+P1 cover the core mechanics; P2 handles the item consumption flow, prevents evolution when holding Everstone or Eviolite, adds an undo/cancellation window, and logs evolution events in the move history.

## 1. Evolution Item Integration

### 1.1 Stone Consumption from Inventory

When a stone-based evolution is confirmed, the stone should be consumed. The app already has an inventory system on HumanCharacter (JSON array).

#### Flow:
1. GM clicks "Evolve" on a Pokemon with a stone-based trigger
2. Evolution check identifies the required item (e.g., "Water Stone")
3. UI prompts: "This evolution requires a Water Stone. Consume from trainer's inventory?"
4. If trainer has the stone in inventory, consume it (decrement quantity or remove)
5. If trainer does not have it, show warning but allow GM override ("Use stone anyway?")

#### Implementation:
- Extend `POST /api/pokemon/:id/evolve` with optional `consumeItem` field:
  ```typescript
  {
    // ...existing fields...
    consumeItem?: {
      ownerId: string,       // Trainer whose inventory to consume from
      itemName: string,      // "Water Stone"
      skipInventoryCheck?: boolean  // GM override
    }
  }
  ```
- If `consumeItem` is provided:
  1. Fetch the trainer's inventory
  2. Find the item by name
  3. Decrement quantity (or remove if quantity becomes 0)
  4. Save updated inventory

### 1.2 Held Item Consumption

For held-item evolutions (e.g., Scizor requires Holding Metal Coat):
- The Pokemon's `heldItem` is already checked in the eligibility check (P0)
- After evolution, the held item may or may not be consumed (PTU varies by item)
- **Design decision:** Held items used as evolution triggers are consumed by default. GM can override.

#### Implementation:
- Extend `POST /api/pokemon/:id/evolve` with `consumeHeldItem` boolean:
  ```typescript
  {
    // ...existing fields...
    consumeHeldItem?: boolean  // Default: true for held-item evolutions
  }
  ```
- If `consumeHeldItem` is true and the trigger has `itemMustBeHeld`:
  1. Clear the Pokemon's `heldItem` field after evolution

## 2. Evolution Prevention Items

### 2.1 Everstone

PTU Core p.291:
> "Evolution is prevented for the holder. Cannot be used by Trainers."

If a Pokemon holds an Everstone, evolution is blocked entirely.

#### Implementation:
- In `checkEvolutionEligibility()`, add a pre-check:
  ```typescript
  if (input.heldItem === 'Everstone') {
    return {
      available: [],
      ineligible: triggers.map(t => ({
        ...t,
        reason: 'Pokemon is holding an Everstone (evolution prevented)'
      })),
      preventedByItem: 'Everstone'
    }
  }
  ```
- The evolution-check endpoint returns this reason to the UI
- UI shows: "This Pokemon cannot evolve while holding an Everstone."

### 2.2 Eviolite

PTU Core p.291:
> "Only affects not-fully-evolved Pokemon of a single family, decided when the Eviolite is made. Grants a +5 Bonus to two different Stats, after Combat Stages, decided when the Eviolite is made. Prevents Pokemon from evolving when held."

Same prevention mechanic as Everstone, but additionally provides stat bonuses.

#### Implementation:
- Same check as Everstone:
  ```typescript
  if (input.heldItem === 'Eviolite') {
    return {
      available: [],
      ineligible: triggers.map(t => ({
        ...t,
        reason: 'Pokemon is holding an Eviolite (evolution prevented)'
      })),
      preventedByItem: 'Eviolite'
    }
  }
  ```

### 2.3 Stat Bonus from Eviolite

The Eviolite's +5 stat bonuses are applied "after Combat Stages." This means they function like equipment bonuses on the stat calculation chain. The full Eviolite implementation (stat bonus tracking, which two stats are boosted) is out of scope for the evolution feature and belongs to a held-item/equipment feature. For evolution purposes, only the prevention check matters.

## 3. Evolution Cancellation

### 3.1 PTU Rule

Pokemon can choose not to evolve:
> "You may choose not to Evolve your Pokemon if you wish."

Additionally, after evolution occurs, the GM may want to undo it (misclick, wrong species selected for branching evolutions, etc.).

### 3.2 Pre-Evolution Cancellation

This is handled naturally by the confirmation modal:
- "Cancel" button at any step aborts the evolution
- No data is changed until the final "Confirm Evolution" is clicked

### 3.3 Post-Evolution Undo

Leverage the existing undo/redo system pattern. The evolution endpoint returns a snapshot of the Pokemon's pre-evolution state.

#### Implementation:
- Before performing the evolution, capture a complete snapshot of the Pokemon record
- Store the snapshot in the `EvolutionResult`:
  ```typescript
  interface EvolutionResult {
    // ...existing fields...
    undoSnapshot: PokemonSnapshot  // Complete pre-evolution state
  }
  ```
- Add endpoint: `POST /api/pokemon/:id/evolution-undo`
  - Input: `{ snapshot: PokemonSnapshot }`
  - Restores the Pokemon to its pre-evolution state
  - Only valid within a reasonable window (e.g., same session, before the next combat action)
- Client stores the snapshot in a composable or store for the undo window

### 3.4 Composable: `useEvolutionUndo`

```typescript
// app/composables/useEvolutionUndo.ts
export function useEvolutionUndo() {
  const undoStack = ref<Map<string, PokemonSnapshot>>(new Map())

  function recordEvolution(pokemonId: string, snapshot: PokemonSnapshot) {
    undoStack.value = new Map(undoStack.value).set(pokemonId, snapshot)
  }

  function canUndo(pokemonId: string): boolean {
    return undoStack.value.has(pokemonId)
  }

  async function undoEvolution(pokemonId: string): Promise<boolean> {
    const snapshot = undoStack.value.get(pokemonId)
    if (!snapshot) return false

    await $fetch(`/api/pokemon/${pokemonId}/evolution-undo`, {
      method: 'POST',
      body: { snapshot }
    })

    const newStack = new Map(undoStack.value)
    newStack.delete(pokemonId)
    undoStack.value = newStack
    return true
  }

  function clearUndo(pokemonId: string) {
    const newStack = new Map(undoStack.value)
    newStack.delete(pokemonId)
    undoStack.value = newStack
  }

  return { recordEvolution, canUndo, undoEvolution, clearUndo }
}
```

## 4. Evolution History / Logging

### 4.1 Move Log Entry

When evolution occurs, log it in the encounter's move log (if in an active encounter) or as a note on the Pokemon:

```typescript
interface EvolutionLogEntry {
  type: 'evolution'
  timestamp: string
  pokemonId: string
  previousSpecies: string
  newSpecies: string
  level: number
  trigger: {
    type: 'level' | 'stone' | 'held_item'
    item?: string
  }
}
```

If in an encounter, append to the encounter's `moveLog`. If not in an encounter, append to the Pokemon's `notes` field.

### 4.2 Pokemon Notes Auto-Update

After evolution, prepend to the Pokemon's notes:

```
[Evolved from <OldSpecies> at Level <N> on <Date>]
```

This preserves a permanent record regardless of encounter context.

## 5. Trade Evolution Placeholder

### 5.1 PTU Simplification

PTU 1.05 converts most trade evolutions to level-based or item-based:
- Machamp: Minimum 40 (was trade in games)
- Alakazam: Minimum 36 (was trade in games)
- Gengar: Minimum 36 (was trade in games)
- Scizor: Holding Metal Coat Minimum 30 (was trade + Metal Coat in games)

Most "trade" evolutions in PTU are already handled by the level and held-item trigger types.

### 5.2 Future Consideration

If any PTU-specific trade evolutions exist that are NOT converted to level/item triggers in the pokedex files, a `trade` trigger type can be added:

```typescript
interface EvolutionTrigger {
  // ...existing fields...
  requiresTrade?: boolean  // P2 addition for any remaining trade evolutions
}
```

The seed parser would detect "Trade" or "Link Trade" text in the evolution line. The UI would show "This evolution requires a trade" and the GM confirms the trade occurred.

**Current assessment:** After reviewing multiple pokedex files, all PTU 1.05 evolution triggers map to level, stone, or held-item categories. A dedicated trade trigger type is likely unnecessary but can be added if edge cases surface during implementation.

## 6. Special Evolution Conditions

### 6.1 Gender-Specific Evolutions

Some Pokemon evolve differently by gender:
- Kirlia -> Gardevoir (any gender at Minimum 30) OR Gallade (Male only, Dawn Stone)
- Burmy -> Wormadam (Female, Minimum 20) OR Mothim (Male, Minimum 20)
- Combee -> Vespiquen (Female only, Minimum 21)

#### Implementation:
- Extend `EvolutionTrigger` with optional gender requirement:
  ```typescript
  interface EvolutionTrigger {
    // ...existing fields...
    requiredGender?: 'Male' | 'Female' | null  // null = any gender
  }
  ```
- Extend seed parser to detect gender text in evolution lines (e.g., "Male" keyword)
- Extend `checkEvolutionEligibility()` to check Pokemon's gender against requirement

### 6.2 Move-Specific Evolutions

A few Pokemon require knowing a specific move to evolve:
- Aipom -> Ambipom (knows Double Hit, Minimum 32)
- Yanma -> Yanmega (knows Ancient Power, Minimum 33)
- Piloswine -> Mamoswine (knows Ancient Power, Minimum 33)
- Lickitung -> Lickilicky (knows Rollout, Minimum 33)
- Tangela -> Tangrowth (knows Ancient Power, Minimum 33)
- Bonsly -> Sudowoodo (knows Mimic, Minimum 17)
- Mime Jr. -> Mr. Mime (knows Mimic, Minimum 18)
- Steenee -> Tsareena (knows Stomp, Minimum 29)

#### Implementation:
- Extend `EvolutionTrigger` with optional move requirement:
  ```typescript
  interface EvolutionTrigger {
    // ...existing fields...
    requiredMove?: string | null  // Move name that must be known
  }
  ```
- Extend seed parser to detect "knows <MoveName>" pattern in evolution lines
- Extend `checkEvolutionEligibility()` to accept `currentMoves: string[]` and check
- NOTE: Need to verify how PTU 1.05 pokedex files encode these. They may use different phrasing like "Knows Rollout Minimum 33" or "Level 33 + Rollout".

### 6.3 Form Changes (Non-Evolution)

Some Pokemon change forms without evolving (e.g., Castform weather forms, Deoxys formes, Rotom appliance forms). These are NOT evolutions and are out of scope for this feature. They would be a separate "Form Change" feature.

## 7. Sprite Auto-Update

### 7.1 Current State

The `spriteUrl` field is manually set or populated by the generator. On evolution, the sprite should update to the new species.

### 7.2 Implementation

During evolution, auto-clear the `spriteUrl`:

```typescript
// In performEvolution():
await prisma.pokemon.update({
  where: { id: input.pokemonId },
  data: {
    // ...all evolution fields...
    spriteUrl: null  // Clear old sprite; UI falls back to default or generates new
  }
})
```

The UI should handle `spriteUrl === null` by:
1. Attempting to load a sprite from the app's sprite directory based on species name
2. Showing a placeholder icon if no sprite is found

If the app has a sprite resolver utility (mapping species name to sprite file), the evolution service can set the new URL directly. Otherwise, null-clearing forces the UI to re-resolve.

## 8. Implementation Order

1. **Everstone/Eviolite prevention** -- Extend eligibility check
2. **Item consumption** -- Stone from inventory, held item consumption
3. **Post-evolution undo** -- Snapshot + undo endpoint + composable
4. **Evolution history** -- Move log entry + Pokemon notes update
5. **Gender-specific triggers** -- Extend trigger type + seed parser
6. **Move-specific triggers** -- Extend trigger type + seed parser
7. **Sprite auto-update** -- Clear spriteUrl on evolution
8. **Trade evolution placeholder** -- If needed after full pokedex review

## 9. Acceptance Criteria

- [ ] Everstone prevents evolution with clear user message
- [ ] Eviolite prevents evolution with clear user message
- [ ] Stone-based evolutions consume the stone from trainer inventory (with override option)
- [ ] Held-item evolutions consume the held item by default (configurable)
- [ ] Evolution can be undone immediately after completion
- [ ] Undo restores all pre-evolution state (species, stats, abilities, moves, capabilities, skills)
- [ ] Evolution events are logged in encounter move log when applicable
- [ ] Evolution history is recorded in Pokemon notes
- [ ] Gender-specific evolution triggers are correctly enforced
- [ ] Move-specific evolution triggers are correctly enforced (knows required move)
- [ ] Sprite URL updates (or clears) on evolution
- [ ] All special conditions surface clear messages in the evolution check UI
