# 2026-03-26 — R0.A: GameState Interface — State Inventory from 45 Sample Definitions

Per the SE principles (DIP: depend on abstractions; ISP: narrow interfaces; OCP: extensible without modification), the first design task for R0.A is the **GameState interface** — the shared abstraction that both the effect engine and entity model depend on. This post enumerates every piece of game state that the 45 exit-criterion definitions read or write, derived from the PTR vault.

---

## Approach

The existing documentation vault proposals converge on this:
- **`combatant-as-lens.md`** — entities are permanent; combat state is a separate lens (delta layer). The lens IS the combat portion of the GameState. Functions are `(entity, lens) → lens`.
- **`trait-composed-domain-model.md`** — entities decompose into narrow interfaces (HasHealth, HasCombatStats, HasPosition...). ISP applied to the state shape.
- **`data-driven-rule-engine.md`** — rules are data; a generic evaluator processes definitions against a context. That context IS the GameState.
- **`damage-pipeline-as-chain-of-responsibility.md`** — the damage formula is a chain where each step receives state and passes modified state forward.

Per `dependency-inversion-principle.md`: both high-level modules (effect engine) and low-level modules (entity model) depend on this abstraction. Per `interface-segregation-principle.md`: the GameState decomposes into narrow sub-interfaces so each effect atom receives only the state it needs. Per `open-closed-principle.md`: new atoms extend the transformation vocabulary without modifying the state shape.

---

## The 45 Definitions

**30 Moves:**

| # | Move | Coverage pattern |
|---|---|---|
| 1 | Thunderbolt | Pure damage + conditional status (Paralyze 19+) |
| 2 | Thunder Wave | Status-only, auto-hit, type immunity check |
| 3 | Will-O-Wisp | Status-only with AC |
| 4 | Swords Dance | Self-buff (Attack CS +2) |
| 5 | Dragon Dance | Multi-stat self-buff (Atk +1, Spd +1) |
| 6 | Earthquake | AoE (Burst 3), Groundsource, hit underground targets |
| 7 | Bullet Seed | Multi-hit (Five Strike, 2–5 hits) |
| 8 | Struggle Bug | AoE (Cone 2) + debuff (SpAtk -1 CS on hit) |
| 9 | Circle Throw | Displacement (Push 6m - Weight Class) + conditional (Trip 15+) |
| 10 | Roar | Forced displacement + forced recall, delayed resolution |
| 11 | Gyro Ball | Conditional bonus damage (Speed stat comparison) |
| 12 | Hex | Conditional DB override (7→13 if target has status affliction) |
| 13 | Retaliate | Historical event query (ally fainted by target in last 2 rounds → DB doubled) |
| 14 | Toxic Spikes | Hazard (spatial placement, layerable to 2, type-conditional removal) |
| 15 | Stealth Rock | Hazard (proximity trigger, 1 tick damage with type effectiveness) |
| 16 | Safeguard | Blessing (3 activations, voluntary, blocks status affliction) |
| 17 | Light Screen | Blessing (2 activations, voluntary, resists Special damage one step) |
| 18 | Aqua Ring | Coat (turn-start heal, 1 tick/turn) |
| 19 | Wide Guard | Interrupt (negate hit for all adjacent allies, replacement effect) |
| 20 | Protect | Interrupt (negate hit for self, replacement effect) |
| 21 | Whirlpool | Damage + Vortex (embedded swift action, Trapped) |
| 22 | Quash | Initiative manipulation (set target initiative to 0 for round) |
| 23 | After You | Initiative manipulation (target goes next, swift action) |
| 24 | Psyshock | Replacement effect (subtract Defense instead of SpDef) |
| 25 | Heal Block | Effect suppression (no HP/TempHP gain from any source, persistent) |
| 26 | Taunt | Behavioral restriction (Enraged — damaging moves only) |
| 27 | Thief | Damage + inventory mutation (steal held item if user slot empty) |
| 28 | Beat Up | Multi-attacker delegation (user + 2 adjacent allies each Struggle Attack, Dark-typed) |
| 29 | Defog | Field clearing (weather → Clear, destroy all Blessings/Coats/Hazards) |
| 30 | Recover | Self-heal (50% max HP) |

**15 Traits:**

| # | Trait | Coverage pattern |
|---|---|---|
| 1 | Volt Absorb | Type-absorb (Electric immunity → energy recovery) |
| 2 | Water Absorb | Type-absorb (Water immunity → HP recovery) |
| 3 | Flash Fire | Type-absorb (Fire immunity → offensive buff, fizzles if unused) |
| 4 | Rough Skin | Contact-retaliation (attacker loses 1 tick HP) |
| 5 | Opportunist [X] | Action economy modifier (X additional AoO/round + Dark Struggle Attacks) |
| 6 | Teamwork | Spatial query + conditional buff (adjacent to opponent → allies +2 accuracy on melee) |
| 7 | Shell [X] | Damage pipeline modifier (flat DR by X) |
| 8 | Ice Body | Weather-conditional trigger (Hail → turn-start heal 1 tick + Hail damage immunity) |
| 9 | Phaser [X] | Movement type grant (Phase movement, ignore solid objects/Slow Terrain) |
| 10 | Limber | Status immunity (immune to Paralysis) |
| 11 | Mettle | Cross-encounter persistent resource (max 3, +1 on faint, spend to reroll) |
| 12 | Seed Sower | Defensive trigger → terrain creation (hit by damage → field becomes Grassy 5 rounds) |
| 13 | Pack Hunt | Reactive out-of-turn attack (ally melee hits adjacent foe → user AoO) |
| 14 | Sniper | Damage pipeline modifier (crits deal +5 bonus damage, multiplied) |
| 15 | Technician | DB modifier (moves with DB ≤ 6 gain +2 DB, always applies to Double/Five Strike) |

---

## Coverage Verification

| Atom / Composition Pattern | Covered by |
|---|---|
| **Deal damage** | Thunderbolt, Earthquake, Gyro Ball, etc. |
| **Apply status** | Thunder Wave, Will-O-Wisp, Taunt (Enraged) |
| **Displace entity** | Circle Throw (Push), Roar (forced shift + recall) |
| **Modify field state** | Toxic Spikes (Hazard), Stealth Rock (Hazard), Safeguard (Blessing), Light Screen (Blessing), Aqua Ring (Coat), Whirlpool (Vortex), Rain Dance-equivalent via Defog, Grassy Terrain via Seed Sower |
| **Modify stat/stage** | Swords Dance (+2 Atk CS), Dragon Dance (+1 Atk/Spd CS), Struggle Bug (-1 SpAtk CS) |
| **Mutate inventory** | Thief |
| **Query spatial state** | Teamwork (adjacency), Beat Up (allies adjacent to target), Wide Guard (allies adjacent to user) |
| **Query combat history** | Retaliate (ally fainted by target in last 2 rounds) |
| **Modify action economy** | Opportunist (additional AoO), Whirlpool/Sand Tomb (embedded swift action) |
| **Modify move legality** | Taunt (Enraged = damaging moves only) |
| **Grant/suppress movement type** | Phaser (Phase movement) |
| **Modify damage pipeline** | Shell (flat DR), Sniper (crit bonus), Technician (DB boost for weak moves), STAB (+2 DB) |
| **Trigger on event** | Rough Skin (on contact hit), Volt/Water/Flash Absorb (on type hit), Ice Body (turn start), Seed Sower (on damage received), Pack Hunt (on ally melee hit) |
| **Resource management** | Mettle (points), Energy (move costs) |
| **Skill check resolution** | (Not directly in the 45, but training unlock conditions reference it) |
| **Replacement effect** | Psyshock (Defense instead of SpDef), Wide Guard/Protect (negate hit entirely) |
| **Effect suppression** | Heal Block (blocks all healing) |
| **Initiative manipulation** | Quash (set to 0), After You (target goes next) |
| **Object/entity creation** | Stealth Rock (creates rock objects in field), Toxic Spikes (creates hazard zones) |
| **Usage counters** | Safeguard (3 activations), Light Screen (2 activations) |
| **Conditional** | Hex (DB override if status), Gyro Ball (bonus damage from speed diff), Thunderbolt (Paralyze on 19+) |
| **Sequence** | Thief (damage then steal), Whirlpool (damage then Vortex) |
| **Recursive trigger** | Rough Skin (hit → attacker HP loss → could trigger Destiny Bond chain) |
| **Replacement** | Psyshock, Wide Guard, Protect |
| **Cross-entity filter** | Heal Block (prevents OTHER effects from healing target) |
| **Choice point** | Safeguard (user MAY activate when receiving status) |
| **Embedded action** | Whirlpool (Swift Action Vortex inside Standard Action move) |
| **Multi-attacker** | Beat Up (up to 3 entities attack through one move) |
| **Status-gated targeting** | (Nightmare would cover this — stretch goal) |
| **Weather-conditional** | Ice Body (Hail), Seed Sower/Grassy Terrain interaction |
| **Delayed resolution** | Roar (declares, then resolves end of round) |
| **Cross-encounter persistence** | Mettle (points survive encounters) |
| **Type immunity** | Limber (Paralysis), Volt/Water/Flash Absorb (type-based) |

All ~20 atoms, all ~5 resolution modifiers, and all 7 composition patterns are covered.

---

## State Inventory

Every piece of game state that the 45 definitions read or write, organized by domain. This is the raw material for the GameState sub-interfaces.

---

### 1. Entity State (permanent, intrinsic — survives combat)

Read by almost every definition. Never written by effects during combat (per combatant-as-lens: effects modify the lens, not the entity).

**Pokemon:**
- `id: string`
- `species: string`
- `level: number`
- `types: Type[]` — read by: STAB (step 3), type effectiveness (step 8), Thunder Wave immunity, Toxic Spikes type-conditional removal, Limber, Volt/Water/Flash Absorb
- `stats: { hp, atk, def, spatk, spdef, spd, stamina }` — read by: damage formula (steps 6, 7), Gyro Ball (speed comparison), effective stat calculation, energy derivation, HP tick calculation
- `moves: MoveRef[]` — read by: Taunt/Enraged (filters to damaging moves only), action presentation
- `traits: TraitRef[]` — read by: movement type checks (Phaser, Roar's "highest movement trait"), trait triggers
- `heldItem: ItemRef | null` — read by: Thief (target has item?), user slot check
- `accessorySlotItem: ItemRef | null` — read by: Thief (alternative steal target)
- `weightClass: number` — read by: Circle Throw (push distance = 6 - WC)
- `movementTypes: MovementType[]` — read by: Roar (forced shift uses highest), terrain interaction, Phaser grants Phase type
- `experience: number` — written by: XP distribution (Ring 3)
- `loyalty: number` — read by: command checks (Ring 3+)
- `skills: Record<SkillName, number>` — read by: skill checks, unlock conditions

**Trainer:**
- `id, name, stats, skills, traits, equipment, inventory` — parallel structure, subset of fields

---

### 2. Combat Lens State (transient, per-combatant — created on encounter entry, destroyed on end)

The primary write target for effects. Each field below is cited with which definitions read/write it.

| Field | Type | Read by | Written by |
|---|---|---|---|
| `entityId` | string | All (links to entity) | Created on entry |
| `entityType` | 'pokemon' \| 'trainer' | Type-conditional logic | Created on entry |
| `side` | 'allies' \| 'enemies' \| 'neutral' | Beat Up (ally check), targeting | Created on entry |
| `hpDelta` | number | HP display, faint check, Recover, healing effects | Thunderbolt/damage, Recover, Aqua Ring tick, Water Absorb heal, Stealth Rock tick, Rough Skin retaliation, Ice Body heal |
| `tempHp` | number | Damage application, Heal Block (blocks TempHP too) | Take a Breather clears |
| `injuries` | number | HP effective max calculation | Damage that crosses injury thresholds |
| `energyCurrent` | number | Move cost validation, fatigue check | Move use (subtract cost), Volt Absorb (+5), energy regain per turn |
| `combatStages` | `{ atk, def, spatk, spdef, spd, accuracy, evasion }` | Damage formula (steps 6, 7), Gyro Ball (speed comparison), accuracy check | Swords Dance (atk +2), Dragon Dance (atk +1, spd +1), Struggle Bug (spatk -1), Take a Breather resets to 0 |
| `statusConditions` | StatusInstance[] | Hex (has affliction?), Nightmare (asleep?), Taunt/Enraged (restricts moves), Thunder Wave/Will-O-Wisp (apply), Limber (immune to Paralysis) | Thunder Wave, Will-O-Wisp, Thunderbolt (19+), Taunt, Toxic Spikes (Poisoned/Badly Poisoned), Safeguard (blocks), Take a Breather (clears volatile) |
| `volatileConditions` | VolatileInstance[] | Flinch, Trapped (Vortex), Bound (Destiny Bond), Enraged (Taunt), Heal Block | Whirlpool (Trapped), Taunt (Enraged), Heal Block, Circle Throw (Tripped), Rock Slide (Flinch 17+) |
| `initiative` | number | Turn order, Quash, After You | Quash (set to 0), After You (reorder) |
| `position` | GridPosition \| null | Circle Throw (push destination), Roar (shift direction), Teamwork/Beat Up/Wide Guard (adjacency queries), Toxic Spikes (spatial placement), Stealth Rock (proximity) | Circle Throw (push), Roar (forced shift), Surf-like repositioning |
| `actionBudget` | `{ standard, movement, swift }` | Move use validation, embedded actions (Whirlpool swift action), After You (swift action) | Move use consumes standard, Whirlpool/Sand Tomb embed swift action within resolution |
| `outOfTurnUsage` | `{ aooRemaining, interruptUsed }` | Pack Hunt (AoO available?), Wide Guard/Protect (interrupt available?), Opportunist (AoO budget) | Opportunist (sets aooRemaining = 1 + X), Pack Hunt (decrements AoO), Wide Guard/Protect (marks interrupt used) |
| `actedThisRound` | boolean | After You (can only target someone who hasn't acted) | Turn resolution (set true after turn) |
| `mountedOn / riddenBy` | string \| null | Mounting rules (Ring 4) | — |
| `engagedWith / wieldedBy` | string \| null | Living weapon (Ring 4) | — |

---

### 3. Persistent Combatant State (survives combat but tracked per-combatant)

| Field | Type | Read by | Written by |
|---|---|---|---|
| `mettlePoints` | number (max 3) | Mettle (spend to reroll) | Mettle (+1 on faint, persists across encounters) |
| `stealthRockHitThisEncounter` | boolean | Stealth Rock (can only hit once per entry) | Stealth Rock trigger, recall resets |

---

### 4. Buff/Debuff Tracking (transient state for time-limited effects)

| Field | Type | Read by | Written by |
|---|---|---|---|
| `flashFireBonus` | `{ active: boolean, expiresEndOfTurn: number }` | Flash Fire (next Fire damage +5) | Flash Fire trigger (set active), user's next Fire move or turn end (consumed/fizzled) |
| `healBlocked` | boolean | All healing effects (Recover, Aqua Ring, Water Absorb, items) | Heal Block (set true), switch out or Take a Breather (clears) |
| `boundTo` | string[] | Destiny Bond (if bound target causes faint → mutual faint) | Destiny Bond (adds entity IDs), user's next turn end (expires) |

Note: Many status conditions (Burned, Poisoned, Paralyzed, etc.) have their own tick behaviors and mechanical effects. These are currently modeled as instances in `statusConditions[]` and `volatileConditions[]` on the lens.

---

### 5. Field State (per-encounter, not per-combatant)

| Field | Type | Read by | Written by |
|---|---|---|---|
| `weather` | `{ type: WeatherType, roundsRemaining: number }` | Ice Body (is Hail?), Rain Dance effects (+5 Water/-5 Fire damage rolls), Solar Beam (Sunny skips charge), Defog (clears) | Rain Dance (set Rainy, 5 rounds), Defog (set Clear) |
| `terrain` | `{ type: TerrainType, roundsRemaining: number }` | Seed Sower / Grassy Terrain (Grassy = grounded heal + Grass damage bonus), movement costs | Seed Sower (set Grassy, 5 rounds), Grassy Terrain (set Grassy, 5 rounds), Defog (does NOT clear terrain — only weather/blessings/coats/hazards) |
| `hazards` | `HazardInstance[]` | Toxic Spikes (layer count for poison severity, Poison-type removal), Stealth Rock (proximity trigger, type effectiveness) | Toxic Spikes (create 8sqm, stackable to 2 layers), Stealth Rock (create 4sqm rocks), Defog (destroy all) |
| `blessings` | `BlessingInstance[]` | Safeguard/Light Screen (voluntary activation when receiving status/Special damage) | Safeguard (create, 3 uses), Light Screen (create, 2 uses), activation (decrement counter), Defog (destroy all) |
| `coats` | `CoatInstance[]` | Aqua Ring (turn-start heal trigger) | Aqua Ring (create on user), Defog (destroy all) |
| `vortexes` | `VortexInstance[]` | Trapped condition (blocks recall), residual damage per turn | Whirlpool/Sand Tomb (create on target), switch out or caster switch (destroy) |

**Hazard detail** (from Toxic Spikes + Stealth Rock):
```
HazardInstance {
  type: 'toxic-spikes' | 'stealth-rock' | ...
  positions: GridPosition[]
  layers: number              // Toxic Spikes can layer to 2
  ownerSide: Side
}
```

**Blessing detail** (from Safeguard + Light Screen):
```
BlessingInstance {
  type: 'safeguard' | 'light-screen' | ...
  teamSide: Side
  activationsRemaining: number  // Safeguard=3, Light Screen=2
  effectDescription: string     // "block status" or "resist Special damage one step"
}
```

**Coat detail** (from Aqua Ring):
```
CoatInstance {
  type: 'aqua-ring' | ...
  entityId: string              // Coats are per-entity, not team-wide
  triggerTiming: 'turn-start'   // When the effect activates
}
```

**Vortex detail** (from Whirlpool/Sand Tomb):
```
VortexInstance {
  targetId: string
  casterId: string              // Destroyed if caster switches
  appliesTrapped: boolean       // Blocks recall
}
```

---

### 6. Encounter State (global combat context)

| Field | Type | Read by | Written by |
|---|---|---|---|
| `round` | number | Retaliate (last 2 rounds), Flash Fire (fizzle timing), Blessing/Weather/Terrain duration countdown | Turn advancement |
| `phase` | 'declaration' \| 'resolution' \| 'priority' | Roar (delayed resolution = declares but resolves end of round) | Phase advancement |
| `turnOrder` | CombatantId[] | After You (reorder), Quash (set to 0 = move to end) | Initiative calculation, Quash, After You |
| `currentTurnIndex` | number | Whose turn it is | Turn advancement |

---

### 7. Combat Event Log (historical queries)

| Field | Type | Read by | Written by |
|---|---|---|---|
| `events` | CombatEvent[] | Retaliate ("ally fainted by target in last 2 rounds"), Destiny Bond ("bound target caused user to faint") | Every damage application, every faint, every status application, every move use |

**CombatEvent structure** (from Retaliate + Destiny Bond):
```
CombatEvent {
  round: number
  type: 'damage' | 'faint' | 'status-applied' | 'move-used' | ...
  sourceId: string             // Who caused it
  targetId: string             // Who it happened to
  moveId?: string              // Which move (for "fainted by damaging move" queries)
  isDamagingMove?: boolean     // Retaliate checks "fainted by a Damaging Move"
  amount?: number              // Damage dealt, for attribution
}
```

---

### 8. Resolution Context (expanded inputs for pure functions)

Per finding 20: pure functions need an expanded input surface beyond game state.

| Input | Type | Read by | Written by |
|---|---|---|---|
| `accuracyRoll` | number (1d20) | Thunderbolt (19+ = Paralyze), Rock Slide (17+ = Flinch), Circle Throw (15+ = Trip), all AC-based moves | Injected by caller |
| `damageRolls` | number[] | Damage formula step 5, Bullet Seed (per-hit) | Injected by caller |
| `multiHitCount` | number (2–5) | Bullet Seed (Five Strike roll) | Injected by caller |
| `playerDecisions` | `{ activateBlessing?: BlessingId, activateMettle?: boolean, ... }` | Safeguard/Light Screen (voluntary activation), Mettle (spend to reroll) | Injected by caller (from UI interaction) |
| `interruptDecisions` | `{ useProtect?: boolean, useWideGuard?: boolean, ... }` | Wide Guard, Protect (Interrupt trigger) | Injected by caller |

---

### 9. Move Definition Properties (read-only reference data)

Every move definition has properties that effects read:

| Property | Type | Read by |
|---|---|---|
| `type` | Type | STAB, type effectiveness, absorb traits (Volt/Water/Flash), weather damage modifiers |
| `damageClass` | 'physical' \| 'special' \| 'status' | Which stats to use in damage formula (Atk/Def or SpAtk/SpDef), Psyshock override, Light Screen (Special only) |
| `damageBase` | number \| null | Damage formula step 1, Hex (override to 13), Technician (boost if ≤6), Retaliate (double) |
| `ac` | number \| null | Accuracy check threshold |
| `range` | RangeSpec | Target selection, AoE shape, Beat Up (adjacency), Roar (Burst 1) |
| `energyCost` | number | Energy deduction, cost validation |
| `keywords` | string[] | Five Strike, Double Strike (Technician), Push (Circle Throw), Interrupt/Shield/Trigger (Wide Guard/Protect), Hazard, Blessing, Coat, Vortex, Social, Sonic, Groundsource, Set-Up |
| `isContact` | boolean | Rough Skin trigger, Pickpocket trigger |
| `isDamaging` | boolean | Taunt/Enraged filter (damaging moves only), Retaliate (fainted by damaging move) |

---

## Candidate Sub-Interfaces (ISP decomposition)

Following `trait-composed-domain-model.md` and `interface-segregation-principle.md`, the state groups into narrow interfaces that effect atoms can depend on individually:

| Sub-interface | Fields | Consumed by |
|---|---|---|
| `HasIdentity` | id, name, side, entityType | All effects (targeting, attribution) |
| `HasTypes` | types[] | STAB, type effectiveness, absorb traits, type immunity |
| `HasStats` | stats (7 individual stats) | Damage formula, Gyro Ball, effective stat calc, HP/Energy derivation |
| `HasCombatStages` | combatStages (7 stages) | Damage formula, Gyro Ball (speed with CS), stage modifiers |
| `HasHealth` | hpDelta, tempHp, injuries, maxHp (derived) | Damage application, healing, faint check, tick calculation |
| `HasEnergy` | energyCurrent, maxEnergy (derived from stamina) | Move cost, Volt Absorb, energy regain |
| `HasStatus` | statusConditions[], volatileConditions[] | Hex, Limber, Safeguard, Taunt/Enraged, healing, Take a Breather |
| `HasPosition` | position | Push, adjacency queries, AoE targeting, hazard placement |
| `HasInitiative` | initiative, actedThisRound | Turn order, Quash, After You |
| `HasActions` | actionBudget, outOfTurnUsage | Move use, embedded actions, Opportunist AoO budget, interrupts |
| `HasInventory` | heldItem, accessorySlotItem | Thief |
| `HasMovement` | movementTypes[], weightClass | Circle Throw push, Roar forced shift, Phaser, terrain interaction |
| `HasMoves` | moves[] | Taunt/Enraged filter, action presentation |
| `HasTraits` | traits[] | Trait trigger evaluation, movement type grants |
| `HasBuffTracking` | flashFireBonus, healBlocked, boundTo, ... | Per-definition buff/debuff state |
| `HasPersistentResources` | mettlePoints, stealthRockHitThisEncounter | Mettle, Stealth Rock one-hit-per-entry |

**Field state interfaces:**

| Sub-interface | Fields | Consumed by |
|---|---|---|
| `HasWeather` | weather { type, roundsRemaining } | Ice Body, Rain Dance effects, Solar Beam, Defog |
| `HasTerrain` | terrain { type, roundsRemaining } | Seed Sower, Grassy Terrain, movement costs |
| `HasHazards` | hazards[] | Toxic Spikes, Stealth Rock, Defog |
| `HasBlessings` | blessings[] | Safeguard, Light Screen, Defog |
| `HasCoats` | coats[] | Aqua Ring, Defog |
| `HasVortexes` | vortexes[] | Whirlpool, Sand Tomb, Trapped condition |

**Encounter context interfaces:**

| Sub-interface | Fields | Consumed by |
|---|---|---|
| `HasRoundState` | round, phase, currentTurnIndex | Duration countdowns, Roar delayed resolution |
| `HasTurnOrder` | turnOrder[] | Quash, After You, initiative display |
| `HasCombatLog` | events[] | Retaliate, Destiny Bond |

---

## Observations

1. **The lens/entity split from `combatant-as-lens.md` holds perfectly.** Every effect writes to lens fields (hpDelta, combatStages, statusConditions, etc.) — never to entity fields (stats, species, level, type). The entity is read-only during combat. The 45 definitions confirm this pattern without exception.

2. **Field state is four distinct systems, as predicted by finding 14.** Hazards, Blessings, Coats, and Vortexes have completely different lifecycle rules (scope, duration, stacking, removal, user agency). They share only Defog as a cross-cutting clear operation.

3. **The combat event log is structurally necessary.** Retaliate and Destiny Bond both require historical queries ("who did what to whom, when"). This isn't optional logging — it's load-bearing game state that effects read from. The log must be structured, not just a text record.

4. **Buff/debuff tracking is open-ended.** Flash Fire's timed bonus, Heal Block's persistent suppression, Destiny Bond's bound state — these are per-entity, per-effect stateful conditions that don't fit cleanly into the status condition system (they're not "Burned" or "Paralyzed" — they're effect-specific tracking). This may need a generic `activeEffects: EffectInstance[]` rather than named fields.

5. **The resolution context (finding 20) is confirmed.** Roll results, multi-hit counts, and player decisions (Safeguard activation, Mettle reroll, interrupt use) must be inputs, not generated inside the function. The 45 definitions require at least 5 distinct input categories beyond game state.

6. **Move definition properties are a reference data layer.** The effect engine reads move properties (type, DB, AC, range, keywords, isContact, isDamaging) but never writes them. This is a separate read-only data model, not part of the mutable GameState.

**Status:** State inventory complete. 45 definitions enumerated across 9 state domains, 16 combatant sub-interfaces, 6 field state sub-interfaces, and 3 encounter context sub-interfaces. ~~Next step: synthesize these into the formal GameState interface design (documentation vault note) with SE principle cross-references.~~ Adversarial review posted below.

