# Combat Lens Sub-Interfaces

The per-combatant lens state from [[combatant-as-lens]] decomposed into narrow sub-interfaces per [[interface-segregation-principle]]. [[effect-utility-catalog|Utility functions]] are typed to receive only the sub-interfaces they need. Part of the [[game-state-interface]].

## Entity-sourced interfaces (read-only during combat)

These sub-interfaces expose intrinsic entity properties. Effects read them but cannot write them (the [[state-delta-model]] excludes entity fields). The one exception is [[entity-write-exception|tagged entity-write effects]].

### HasIdentity

```
id: string
name: string
side: 'allies' | 'enemies' | 'neutral'
```

Present on every combatant. Used by all effects for targeting and attribution. The `entityType` discriminator lives on the entity, not here — the lens is entity-type-agnostic per [[open-closed-principle]].

### HasTypes

```
types: Type[]
```

Read by STAB calculation, type effectiveness, absorb traits (Volt Absorb, Water Absorb, Flash Fire), type immunity checks, Toxic Spikes Poison-type removal.

**Trainers do not implement this interface.** Trainers are typeless in PTR — they skip type effectiveness entirely, receive no STAB, and all attacks against them deal neutral damage. This is the only sub-interface that differs between Pokemon and Trainers.

### HasStats

```
stats: { hp: number, atk: number, def: number, spatk: number, spdef: number, spd: number, stamina: number }
```

The 7 combat stats, shared by both Pokemon and Trainers. Read by the [[nine-step-damage-formula]] (steps 6, 7), Gyro Ball (speed comparison), effective stat calculation, HP derivation, energy derivation.

### HasMoves

```
moves: MoveRef[]
```

Read by Taunt/Enraged (filters to damaging moves only) and action presentation. Both Pokemon and Trainers can have moves — PTR uses a universal move pool where any combatant can unlock moves meeting the unlock conditions.

### HasTraits

```
traits: TraitRef[]
```

Read by trait trigger evaluation, movement type grants (Phaser), and trait prerequisite checks.

### HasInventory

```
heldItem: ItemRef | null
accessorySlotItem: ItemRef | null
```

Read by Thief (does target have an item? is user's slot empty?). Written only via [[entity-write-exception]] — item theft mutates entity state.

### HasMovement

```
movementTypes: MovementType[]
weightClass: number
```

Read by Circle Throw (push distance = 6 - WC), Roar (forced shift uses highest movement trait), terrain interaction, Phaser (grants Phase movement type).

## Lens-sourced interfaces (read-write during combat)

These sub-interfaces contain transient combat state. Effects write to them via [[state-delta-model|StateDelta]]. Created when an entity enters combat, destroyed when combat ends.

### HasCombatStages

```
combatStages: { atk: number, def: number, spatk: number, spdef: number, spd: number, accuracy: number }
```

Six combat stages. Written by Swords Dance (+2 Atk), Dragon Dance (+1 Atk/Spd), Struggle Bug (-1 SpAtk), status condition auto-apply (Burn: -2 Def, Poison: -2 SpDef via [[status-cs-auto-apply-with-tracking]]). Reset to 0 by Take a Breather. Both Pokemon and Trainers receive combat stages.

**Evasion is not a combat stage.** Evasion is derived: Physical Evasion = `floor(Def / 5)`, Special Evasion = `floor(SpDef / 5)`, Speed Evasion = `floor(Spd / 5)`, each capped at +6 (per [[evasion-from-defensive-stats]]). There are three evasion values, not one — the defender chooses which applies per attack (per [[one-evasion-per-accuracy-check]]). Flat penalties from fatigue (per [[fatigue-levels]]) and flanking reduce the derived values directly, not via the combat stage multiplier table. Evasion belongs in the projection function (`projectCombatant`), not in mutable lens state. See [[game-state-interface]] — derived-vs-stored principle.

**Accuracy CS uses direct addition**, not the multiplier table (per [[accuracy-cs-is-direct-modifier]]). It is still a combat stage — it is tracked, written by effects, and reset by Take a Breather — but its application arithmetic differs from the stat stages.

### HasHealth

```
hpDelta: number
tempHp: number
injuries: number
```

`hpDelta` is relative to entity's max HP (negative = damage taken). Max HP is derived from entity stats — different formula for Pokemon (`HP + (Level x 3) + 10`) vs Trainers (`HP x 3 + 10`), selected by entity type, not by the lens.

Written by damage application, Recover, Aqua Ring tick, Water Absorb heal, Rough Skin retaliation, Stealth Rock tick, Ice Body heal. Read by faint check, healing effects, Heal Block suppression.

### HasEnergy

```
energyCurrent: number
```

Max energy derived from entity's Stamina stat. Written by move use (subtract cost), Volt Absorb (+5), per-turn energy regain. Read by move cost validation, fatigue checks. Both Pokemon and Trainers have energy.

### HasStatus

```
statusConditions: StatusInstance[]
volatileConditions: VolatileInstance[]
fatigueLevel: number
```

Every condition instance includes [[condition-source-tracking]] — `source: EffectSource` and `appliedCombatStages` for cure reversal. See [[status-condition-categories]] for the category taxonomy.

**Fatigue** is its own condition category — separate from Persistent, Volatile, and Other (per [[fatigued-is-its-own-condition-category]]). Each level applies -2 to attack rolls, -2 to all three evasion values, and -2 to movement speeds (per [[fatigue-levels]]). 5 levels = unconscious. Gained from reaching 0 Energy (per [[zero-energy-causes-fatigue]]), recovered by Take a Breather (per [[take-a-breather-recovers-fatigue]]). Fatigue feeds into the evasion derivation (see HasCombatStages above) and attack roll modification.

```
StatusInstance {
  condition: StatusType
  source: EffectSource
  appliedCombatStages: Record<StatName, number>
}

VolatileInstance {
  condition: VolatileType
  source: EffectSource
}
```

### HasPosition

```
position: GridPosition | null
```

Written by Circle Throw (push), Roar (forced shift). Read by adjacency queries (Teamwork, Beat Up, Wide Guard), AoE targeting (Earthquake Burst 3), hazard placement, Stealth Rock proximity.

### HasInitiative

```
initiativeOverride: number | null
actedThisRound: boolean
```

Initiative is derived from Speed: `effectiveStat(entity.stats.spd, lens.combatStages.spd)`. It recalculates automatically when Speed CS changes — Agility granting +2 Speed CS immediately affects turn order (per [[dynamic-initiative-on-speed-change]]). The lens stores only `initiativeOverride` for moves that temporarily replace initiative: Quash sets it to 0, After You reorders. When `initiativeOverride` is null, derived initiative is used.

`actedThisRound` prevents After You from targeting someone who already acted. See [[game-state-interface]] — derived-vs-stored principle.

### HasActions

```
actionBudget: { standard: number, movement: number, swift: number }
outOfTurnUsage: { aooRemaining: number, interruptUsed: boolean }
```

Written by move use (consumes standard), Whirlpool (embeds swift action within resolution), Opportunist (sets aooRemaining = 1 + X), Pack Hunt (decrements AoO), Wide Guard/Protect (marks interrupt used).

### HasActiveEffects

```
activeEffects: ActiveEffect[]
```

Generic, open-ended tracking for buffs and debuffs that don't fit the status/volatile condition system. Replaces the former named-field approach (`flashFireBonus`, `healBlocked`, `boundTo`). See [[active-effect-model]] for the `ActiveEffect` struct and rationale.

### HasPersistentResources

```
mettlePoints: number
stealthRockHitThisEncounter: boolean
```

State that persists across encounters (Mettle points survive between combats) or tracks per-entry triggers (Stealth Rock can only hit once per entry, reset on recall).

## Trainer vs Pokemon mapping

| Sub-interface | Pokemon | Trainer | Notes |
|---|---|---|---|
| HasIdentity | Yes | Yes | |
| HasTypes | Yes | **No** | Trainers are typeless |
| HasStats | Yes | Yes | Same 7 stats |
| HasCombatStages | Yes | Yes | Same 6 stages |
| HasHealth | Yes | Yes | Different HP formula, same lens fields |
| HasEnergy | Yes | Yes | Stamina derives energy |
| HasStatus | Yes | Yes | Trainers can be statused and fainted |
| HasPosition | Yes | Yes | On the grid |
| HasInitiative | Yes | Yes | Own turn in initiative |
| HasActions | Yes | Yes | Standard + Movement + Swift + Free |
| HasInventory | Yes | Yes | Held items, equipment |
| HasMovement | Yes | Yes | Landwalker for humans |
| HasMoves | Yes | Yes | Universal move pool |
| HasTraits | Yes | Yes | Trainers can have traits |
| HasActiveEffects | Yes | Yes | Can receive buffs/debuffs |
| HasPersistentResources | Yes | Maybe | Could track Mettle or similar |

## See also

- [[game-state-interface]] — the parent design this belongs to
- [[combatant-as-lens]] — the lens/entity architecture these interfaces decompose
- [[trait-composed-domain-model]] — the ISP decomposition approach
- [[state-delta-model]] — how effects write to lens-sourced interfaces
- [[entity-write-exception]] — the one exception to entity read-only
- [[active-effect-model]] — the generic model behind HasActiveEffects
- [[condition-source-tracking]] — source tracking on StatusInstance and VolatileInstance
- [[interface-segregation-principle]] — the principle driving the decomposition
- [[effect-handler-contract]] — handlers receive a context with the full lens; utility function params provide narrowing
- [[effect-utility-catalog]] — each utility is typed to read only the sub-interfaces it needs
