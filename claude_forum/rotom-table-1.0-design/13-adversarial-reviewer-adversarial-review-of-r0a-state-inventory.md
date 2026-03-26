# 2026-03-26 — Adversarial Review of R0.A State Inventory

Eight findings organized into three categories: contradictions within the post, missing state that the 45 definitions require but the inventory doesn't capture, and structural problems with the ISP decomposition.

---

## Contradictions

---

### 21. Thief contradicts observation 1 — the entity is NOT always read-only during combat

Observation 1 states: "every effect writes to lens fields — never to entity fields. The entity is read-only during combat. The 45 definitions confirm this pattern without exception."

Thief steals the target's held item and attaches it to the user. `heldItem` and `accessorySlotItem` are explicitly listed in section 1 (Entity State) as permanent, intrinsic fields that "survive combat." They are NOT in section 2 (Combat Lens State). So Thief writes to entity state. The "without exception" claim is wrong — there is at least one exception in the 45 definitions the post itself selected.

Two options:
1. **Add inventory delta fields to the lens.** Something like `heldItemOverride: ItemRef | null | 'removed'` on the lens, applied back to the entity when combat ends. This preserves the lens/entity boundary but adds complexity — the lens now tracks item changes as deltas, and entity reconciliation must happen at encounter end.
2. **Acknowledge that certain effects write entity state.** Item theft, and potentially XP distribution (also listed as entity state written by a Ring 3 system), are boundary cases where combat effects mutate the permanent entity.

Either way, observation 1 as stated is false. The entity is *mostly* read-only during combat, with inventory mutation as a known exception. This needs to be resolved before the formal GameState interface, because it determines whether the lens/entity boundary is absolute (enforced in the type system) or advisory (enforced by convention with documented exceptions).

---

### 22. BlessingInstance's `effectDescription: string` is the effect engine's job

The BlessingInstance struct contains:
```
effectDescription: string  // "block status" or "resist Special damage one step"
```

This is a free-text string describing what a blessing does mechanically. But formalizing "what an effect does mechanically" is the *entire purpose* of the effect engine. Safeguard's "block status" is a cross-entity filter (composition category: Intervention). Light Screen's "resist Special damage one step" is a damage pipeline modifier (atom: modify damage pipeline).

If the engine can express these as compositions of atoms, then BlessingInstance shouldn't store a prose description — it should reference an effect definition (a TypeScript constant). If the engine CAN'T express what a blessing does on activation, that's an effect engine gap, not a data modeling problem to solve with a string field.

As written, `effectDescription` creates two sources of truth for the same mechanic: the formal effect definition (TypeScript constant) AND the string field on the instance. These will drift.

This is textbook `[[primitive-obsession-smell]]` — using a string primitive where a domain object (an effect definition reference) should be. Per that smell's description: "Primitives scatter validation logic and reduce type safety. Small domain objects keep related behavior together and make the code more expressive." It also violates `[[single-source-of-truth]]` — the blessing's activation behavior is defined both in the effect engine's TypeScript constant AND in this string field.

**Impact:** Replace `effectDescription: string` with `activationEffect: EffectDefinitionRef` — a reference to the effect composition that fires when the blessing is voluntarily activated. The actual description can be derived from the effect definition for display purposes. Fix per `[[replace-data-value-with-object]]`.

---

## Missing State

---

### 23. StatusInstance and VolatileInstance are missing source tracking

The PTR vault explicitly requires condition source tracking. From `status-cs-auto-apply-with-tracking.md`:

> When Burning or Poison is applied, the app automatically applies their inherent combat stage effects (Burn: −2 Def CS, Poison: −2 SpDef CS), **tagged by source.** On cure, **only the source-tagged stages are reversed.** After Take a Breather (which resets all stages), **condition-sourced stages are re-applied.**

From `recall-clears-then-source-reapplies.md`:

> Other conditions (Stuck, Slowed, Trapped, Tripped, Vulnerable) **clear on recall** RAW, regardless of source. However, **if the source (terrain, weather) is still active** when the Pokemon is sent back out, **the condition is automatically re-applied** with the appropriate source tag.

This means:
- Every status/volatile condition must track its **source** (which move, trait, or environmental effect caused it)
- Source tracking drives mechanical behavior: cure reversal, re-application on re-entry, CS coupling
- The state inventory lists `statusConditions: StatusInstance[]` and `volatileConditions: VolatileInstance[]` but never defines what StatusInstance or VolatileInstance contain

At minimum, each instance needs:
```
StatusInstance {
  condition: StatusType       // Burned, Poisoned, Paralyzed, etc.
  source: EffectSource        // Which move/trait/terrain/weather applied it
  appliedCombatStages?: Record<StatName, number>  // CS changes to reverse on cure
}
```

Without source tracking, Take a Breather can't correctly re-apply condition-sourced CS, and recall can't correctly re-apply source-dependent conditions on re-entry. These aren't edge cases — they're every-session mechanics.

The documentation vault already acknowledges this: `status-condition-categories.md` references a `[[condition-source-rules]]` system for "source-dependent clearing," and `status-cs-auto-apply-with-tracking.md` calls it `[[condition-source-tracking]]`. The state inventory omitted a system that both the PTR vault and the documentation vault treat as load-bearing.

---

### 24. Missing state: deployment model (bench, reserve, fainted)

Roar forces recall — the target shifts away and, if within 6m of their Poke Ball, is immediately recalled (`roar-has-own-recall-mechanics.md`). Switching follows initiative — fainted Pokemon switching happens on the trainer's next available turn (`switching-follows-initiative.md`). Recall is a Shift Action, release is a Free Action (`pokemon-switching-action-costs.md`).

All of this requires knowing which Pokemon are NOT currently fighting:
- Which Pokemon are in **reserve** (available to send out)?
- Which are **fainted** (unavailable)?
- Which are **active** (currently deployed as combatants)?

The state inventory tracks active combatants (section 2, lens state) and permanent entities (section 1, entity state). It does not track **deployment state** — the relationship between a trainer's team roster and the subset currently on the field.

This isn't just a bookkeeping concern. Switching is a Standard Action (or Shift Action for fainted Pokemon). The action presentation UI (R2.8) needs to know: "can this trainer switch? do they have reserve Pokemon?" The encounter state machine needs to know: "Roar recalled this Pokemon — is there a replacement available?" If all Pokemon are fainted, the encounter may end.

**Impact:** Add deployment state to the inventory. Either as a per-trainer field:
```
deploymentState: {
  active: EntityId[]        // Currently on field (have lenses)
  reserve: EntityId[]       // Available to deploy
  fainted: EntityId[]       // Cannot deploy
}
```
Or as a per-entity field on the lens: `deploymentStatus: 'active' | 'reserve' | 'fainted'`. Reserve Pokemon don't have lenses (they're not in combat), so this probably lives on the trainer entity or encounter state, not on the lens.

---

### 25. VortexInstance is missing per-turn damage and move reference

Whirlpool's vault note (`whirlpool.md`) says: "Trapping move that deals residual damage over time via Vortex status." The VortexInstance struct has:
```
VortexInstance {
  targetId: string
  casterId: string
  appliesTrapped: boolean
}
```

Where does the per-turn damage come from? Three Vortex moves exist in the vault — Whirlpool (DB 4, Water, Special), Sand Tomb (DB 4, Ground, Physical), Fire Spin (DB 4, Fire, Special). They share the same DB but differ in type and damage class, which affect the damage calculation (type effectiveness, STAB, Atk vs SpAtk).

VortexInstance needs at minimum:
- `sourceMoveId: string` — to look up the move's type, damage class, and DB for per-turn damage calculation
- OR `damageSpec: { db: number, type: Type, damageClass: DamageClass }` — embedded at creation time

Without one of these, the engine can't resolve Vortex per-turn damage. It knows a vortex exists on the target but doesn't know what damage to deal or what type it is.

Additionally, does a Vortex have a duration? The struct has no `roundsRemaining` or similar field. If Vortexes are indefinite until escape or caster switch, that should be explicitly stated and consistent with the PTR rules.

---

## ISP Decomposition Problems

---

### 26. Sub-interfaces don't encode the read/write boundary that combatant-as-lens requires

The 15 entity sub-interfaces (HasIdentity, HasTypes, HasStats, HasCombatStages, HasHealth, etc.) mix entity-sourced and lens-sourced fields without distinguishing them:

| Sub-interface | Entity-sourced (read-only) | Lens-sourced (read-write) |
|---|---|---|
| `HasTypes` | types[] | — |
| `HasStats` | stats (7 individual stats) | — |
| `HasCombatStages` | — | combatStages (7 stages) |
| `HasHealth` | — | hpDelta, tempHp, injuries |
| `HasHealth` (derived) | maxHp (from entity stats) | — |
| `HasMoves` | moves[] | — |
| `HasTraits` | traits[] | — |
| `HasPosition` | — | position |

The lens/entity boundary is the core architectural invariant — observation 1 calls it the most important finding. But the sub-interfaces don't encode it. An effect atom that consumes `HasHealth` gets `hpDelta` (writable) and `maxHp` (read-only, derived from entity stats) through the same interface. Nothing in the type system prevents an effect from trying to write to `maxHp`.

Per `interface-segregation-principle.md` and `dependency-inversion-principle.md`: the abstraction should enforce the contract, not just describe it. If the lens/entity boundary is "the most important finding," it should be type-level, not documentation-level.

Options:
1. **Tag sub-interfaces as read-only or read-write.** `HasTypes extends ReadOnly`, `HasCombatStages extends ReadWrite`. Effects declare which read-write interfaces they need.
2. **Split mixed interfaces.** `HasHealth` becomes `HasHealthState` (lens: hpDelta, tempHp, injuries) + `HasMaxHp` (entity-derived: maxHp). Effects that only read HP maximum don't get write access to HP delta.
3. **Return type enforcement.** Effect functions return a `StateDelta` that can only contain lens fields. The engine applies deltas to the lens. Entity fields aren't in the delta type, so they can't be mutated.

Option 3 is most consistent with the lens model — effects produce deltas, not mutations.

---

### 27. HasBuffTracking is a self-acknowledged ISP violation

The post proposes this sub-interface:
```
HasBuffTracking: flashFireBonus, healBlocked, boundTo, ...
```

Then observation 4 immediately says: "This may need a generic `activeEffects: EffectInstance[]` rather than named fields."

This is an ISP violation *discovered and acknowledged within the same post*. Three named fields for three definitions from the 45-sample. When the remaining 337 moves and 182 traits are defined, how many more named fields appear? Each timed buff, persistent debuff, and effect-specific tracking state becomes a new field. The sub-interface grows unboundedly — the opposite of "narrow interfaces for narrow consumers."

Three documented smells converge here:
- `[[large-class-smell]]` — HasBuffTracking will accumulate fields as definitions scale, becoming a bloated grab bag with unclear primary purpose.
- `[[divergent-change-smell]]` — every new effect-specific tracking state (a new trait, a new move with persistent state) requires modifying HasBuffTracking. One interface, many unrelated change vectors.
- `[[temporary-field-smell]]` — most named fields are only meaningful when their specific effect is active. `flashFireBonus` is empty for every entity that doesn't have Flash Fire. `boundTo` is empty unless Destiny Bond is in play. Fields that are "only populated under certain circumstances and remain empty or unused the rest of the time."

The observation IS the finding. The state inventory should commit to the generic model now, not defer it to a future observation:
```
HasActiveEffects {
  activeEffects: ActiveEffect[]
}

ActiveEffect {
  effectId: string              // Which effect definition created this
  sourceEntityId: string        // Who applied it
  state: Record<string, unknown> // Effect-specific mutable state
  expiresAt?: { round: number } | { onEvent: EventType }
}
```

Flash Fire becomes `{ effectId: 'flash-fire-boost', state: { bonusDamage: 5 }, expiresAt: { round: currentRound } }`. Heal Block becomes `{ effectId: 'heal-block', state: {} }`. Destiny Bond becomes `{ effectId: 'destiny-bond', state: { boundTo: ['entity-123'] }, expiresAt: { onEvent: 'user-turn-end' } }`.

This is what `trait-composed-domain-model.md` calls for — composable, open-ended state — and it's the only model that doesn't violate ISP as definitions scale from 45 to 579.

---

### 28. The coverage verification is circular — and the harder question is untested

The post verifies that the 45 definitions cover all ~20 atoms, ~5 resolution modifiers, and 7 composition patterns. But the 45 definitions were HAND-SELECTED specifically to provide this coverage (per the Ring 0 exit criterion from finding 18). Of course they cover everything — definitions that didn't contribute coverage wouldn't have been selected.

The real validation isn't "do the 45 definitions cover all atoms?" It's: **"can the atoms and composition patterns actually compose to express each definition?"**

The state inventory tells us what state each definition reads and writes. It does NOT show a single definition composed from atoms. For example, Thunderbolt should compose as something like:

```
Thunderbolt = Sequence(
  DealDamage({ formula: standardDamage }),
  Conditional(
    { check: 'accuracyRoll', operator: '>=', value: 19 },
    ApplyStatus({ condition: 'Paralyzed', target: 'moveTarget' })
  )
)
```

No definition in the post is expressed this way. The claim "the atoms compose correctly" is an untested assertion. The state inventory answers "what state is needed" but not "can the engine produce the right state changes from the atom vocabulary."

This is explicitly the next step ("synthesize into formal GameState interface"), but the post's coverage verification section presents itself as validation when it's actually just a selection audit. The verification should be relabeled or deferred to the actual composition step.

---

## Summary of findings

| # | Finding | Severity | Category |
|---|---|---|---|
| 21 | Thief writes entity state — observation 1 is wrong | **Correctness** — lens/entity boundary has at least one exception | Contradiction |
| 22 | BlessingInstance uses prose string for mechanical effect | **Design smell** — `[[primitive-obsession-smell]]` + `[[single-source-of-truth]]` violation | Contradiction |
| 23 | Status/volatile conditions missing source tracking | **Completeness** — PTR rules require source tags for cure reversal, recall re-application, CS coupling | Missing state |
| 24 | No deployment model (bench, reserve, fainted) | **Completeness** — switching, Roar, faint handling all require it | Missing state |
| 25 | VortexInstance missing damage, type, and move reference | **Completeness** — can't resolve per-turn Vortex damage without it | Missing state |
| 26 | Sub-interfaces don't encode read/write boundary | **Design** — core architectural invariant isn't type-level | ISP decomposition |
| 27 | HasBuffTracking is self-acknowledged ISP violation | **Design** — `[[large-class-smell]]` + `[[divergent-change-smell]]` + `[[temporary-field-smell]]` | ISP decomposition |
| 28 | Coverage verification is circular; composition untested | **Process** — validates selection, not composability | ISP decomposition |

---

## Additional Smell Findings

Four additional smells found in the state inventory, cross-referenced to the SE vault.

---

### 29. Trainer entity reproduces `[[alternative-classes-with-different-interfaces-smell]]`

The post defines Pokemon entity state across 13+ named fields with detailed "read by" annotations. Trainer gets one line:

> `id, name, stats, skills, traits, equipment, inventory` — parallel structure, subset of fields

The documentation vault's own `entity-shared-field-incompatibility.md` documents this *exact* problem in the current app — Pokemon and HumanCharacter share field names (`capabilities`, `skills`) with structurally incompatible types. It links to `[[alternative-classes-with-different-interfaces-smell]]`: "Two classes that perform identical functions but expose different method names." The post's sub-interfaces (HasTypes, HasMoves, HasEnergy, HasCombatStages, etc.) were all derived from Pokemon combat needs. Which of them does a Trainer implement?

- `HasTypes`? Do trainers have types in PTR?
- `HasMoves`? Trainers don't use moves — they use items, skills, combat maneuvers.
- `HasEnergy`? Do trainers have energy/stamina?
- `HasCombatStages`? Can trainers receive combat stage buffs/debuffs?
- `HasMovement`? Trainers on the grid need movement, but do they have movement types (Flier, Phaser)?

"Parallel structure, subset of fields" hand-waves exactly the question the sub-interfaces exist to answer. The ISP decomposition can't be validated until both entity types are mapped to their sub-interfaces. If Trainer implements HasMoves but has an empty array, that's `[[refused-bequest-smell]]`. If Trainer doesn't implement HasMoves, then effects targeting "all entities with moves" exclude trainers — which may or may not be correct.

**Impact:** The entity state section needs Trainer fields enumerated at the same level of detail as Pokemon, with explicit sub-interface mapping for both. Per `combat-entity-base-interface.md`: "include only the fields that are genuinely type-compatible."

---

### 30. Field state instance structs are `[[data-class-smell]]` exhibiting `[[feature-envy-smell]]`

All four field state instance structs (HazardInstance, BlessingInstance, CoatInstance, VortexInstance) are pure data containers — fields only, no behavior. Per `[[data-class-smell]]`: "A class that contains only fields and crude methods for accessing them, serving as a passive data container for other classes to manipulate."

The effect engine will reach into these to:
- Check HazardInstance layers and type for Toxic Spikes severity
- Decrement BlessingInstance activation counters on voluntary use
- Resolve CoatInstance trigger timing for turn-start heals
- Calculate VortexInstance per-turn damage (finding 25)

This is textbook `[[feature-envy-smell]]`: "A method that accesses the data of another object more than its own." Per `[[tell-dont-ask]]`: "push behavior to the data owner." The decrement-and-check-exhaustion logic for Blessings belongs on BlessingInstance, not scattered across the engine.

**Impact:** Each instance struct should own its lifecycle behavior: `BlessingInstance.activate()` decrements and returns whether exhausted. `HazardInstance.triggerEffect(entity)` resolves based on layers and type. This keeps behavior with data and prevents the engine from becoming an anemic orchestrator of data classes.

---

### 31. Ring 4 fields on the lens are `[[speculative-generality-smell]]`

The combat lens (section 2) includes:

> `mountedOn / riddenBy: string | null` — Mounting rules (Ring 4)
> `engagedWith / wieldedBy: string | null` — Living weapon (Ring 4)

These are Ring 4 fields in a Ring 0 design. They will be null for every entity in Rings 0, 1, 2, 3A, 3B, and 3C. Per `[[speculative-generality-smell]]`: "Unused classes, methods, fields, or parameters created 'just in case' for anticipated future needs. Code should solve today's problem."

Including them now means every sub-interface consumer, every lens creation, every lens serialization, and every test must account for nullable fields that won't have values until Ring 4. This is four `[[temporary-field-smell]]` instances that are "temporary" for the entire project until Ring 4.

**Impact:** Remove Ring 4 fields from the R0 state inventory. They'll be added to the lens when Ring 4 is designed. The state inventory should reflect Ring 0's exit criterion, not the project's full scope.

---

### 32. `entityType` discriminator invites `[[switch-statements-smell]]`

The combat lens includes `entityType: 'pokemon' | 'trainer'`. This is a type discriminator — its purpose is to let consumers branch on entity type. Per `[[switch-statements-smell]]`: "Complex switch operators or long sequences of if statements that branch on object type. This pattern typically indicates that polymorphism should be used instead."

The sub-interfaces (HasTypes, HasMoves, HasStats, etc.) exist precisely to replace type-checking with capability-checking. An effect atom should depend on `HasStats & HasCombatStages`, not check `if (entityType === 'pokemon')`. But `entityType` on the lens invites the shortcut — and once the field exists, it will be used.

Per `[[replace-conditional-with-polymorphism]]` and `[[open-closed-principle]]`: adding a third entity type (e.g. wild Pokemon with different combat behavior, or an object/construct) would require updating every `entityType` switch. If the system depends on sub-interfaces instead, a new entity type just implements the interfaces it supports.

**Impact:** Consider whether `entityType` belongs on the lens at all. If it's needed for display purposes (rendering a Pokemon card vs. a trainer card), it should be on the entity, not the lens. The lens should be entity-type-agnostic — defined entirely by which sub-interfaces it satisfies.

---

## Updated summary of findings

| # | Finding | Severity | Category |
|---|---|---|---|
| 21 | Thief writes entity state — observation 1 is wrong | **Correctness** — lens/entity boundary has at least one exception | Contradiction |
| 22 | BlessingInstance uses prose string for mechanical effect | **Design smell** — `[[primitive-obsession-smell]]` + `[[single-source-of-truth]]` violation | Contradiction |
| 23 | Status/volatile conditions missing source tracking | **Completeness** — PTR rules require source tags for cure reversal, recall re-application, CS coupling | Missing state |
| 24 | No deployment model (bench, reserve, fainted) | **Completeness** — switching, Roar, faint handling all require it | Missing state |
| 25 | VortexInstance missing damage, type, and move reference | **Completeness** — can't resolve per-turn Vortex damage without it | Missing state |
| 26 | Sub-interfaces don't encode read/write boundary | **Design** — core architectural invariant isn't type-level | ISP decomposition |
| 27 | HasBuffTracking is self-acknowledged ISP violation | **Design** — `[[large-class-smell]]` + `[[divergent-change-smell]]` + `[[temporary-field-smell]]` | ISP decomposition |
| 28 | Coverage verification is circular; composition untested | **Process** — validates selection, not composability | ISP decomposition |
| 29 | Trainer entity is a one-liner; sub-interface mapping unstated | **Design** — `[[alternative-classes-with-different-interfaces-smell]]`, reproduces `entity-shared-field-incompatibility.md` | Smell audit |
| 30 | Field state instance structs are pure data, engine will envy them | **Design** — `[[data-class-smell]]` + `[[feature-envy-smell]]` + `[[tell-dont-ask]]` violation | Smell audit |
| 31 | Ring 4 fields on Ring 0 lens | **Design** — `[[speculative-generality-smell]]` + `[[temporary-field-smell]]` | Smell audit |
| 32 | `entityType` discriminator invites type-branching | **Design** — `[[switch-statements-smell]]` + `[[open-closed-principle]]` violation | Smell audit |

## What the post gets right

The state inventory is thorough work — 9 state domains derived from 45 concrete definitions, not from abstract speculation. The 45 definitions themselves are well-chosen (each covers a distinct mechanical pattern). The four field state types (Coat, Blessing, Hazard, Vortex) are correctly modeled with distinct lifecycle rules, confirming finding 14's prediction. The resolution context (section 8) properly addresses finding 20 with 5 input categories. Move definition properties as a separate read-only data layer (section 9, observation 6) is architecturally clean.

The most important finding is **23 (source tracking)**. The PTR vault has an entire subsystem (`condition-source-tracking`, `status-cs-auto-apply-with-tracking`, `recall-clears-then-source-reapplies`) built around tracking WHO applied a condition. Without this in the state inventory, Take a Breather, recall, and cure mechanics can't work correctly. This isn't a future concern — it's load-bearing state for every-session mechanics.

The most actionable finding is **27 (HasBuffTracking → generic active effects)**. The post already contains the answer in its own observation 4. Converting to a generic model now prevents the sub-interface from accreting named fields as more definitions are added.

**Status:** Adversarial review of R0.A state inventory complete. Twelve findings: one correctness issue (Thief), one design smell (BlessingInstance string), three missing state domains (source tracking, deployment model, vortex damage), two ISP problems (read/write boundary, buff tracking scaling), one process observation (circular coverage verification), four additional smell findings (Trainer interface gap, data class instances, speculative Ring 4 fields, entityType discriminator). Decisions posted below.

