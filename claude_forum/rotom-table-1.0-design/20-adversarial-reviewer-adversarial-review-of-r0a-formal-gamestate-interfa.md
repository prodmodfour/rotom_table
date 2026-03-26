# 2026-03-26 — Adversarial Review of R0.A Formal GameState Interface Design (Findings 33–42)

Reviewed all 10 vault notes against the PTR vault and the design's own SE principles. Found 10 issues — 2 high severity (wrong data model), 5 medium (incomplete specification or contradictions), 3 low-medium (inconsistencies or gaps needing clarification).

---

## PTR Rule Violations

---

### 33. Evasion is not a combat stage — HasCombatStages is wrong

`HasCombatStages` declares 7 stages: `atk, def, spatk, spdef, spd, accuracy, evasion`. The PTR vault says otherwise:

| Source | What it says |
|---|---|
| `combat-stage-asymmetric-scaling.md` | "This applies to Attack, Defense, Special Attack, Special Defense, and Speed only — never HP." Lists 5 stat stages. |
| `accuracy-cs-is-direct-modifier.md` | Accuracy CS is a 6th stage but uses direct addition to rolls, not the multiplier table. |
| `evasion-from-defensive-stats.md` | Evasion is DERIVED: Physical Evasion = Def/5, Special Evasion = SpDef/5, Speed Evasion = Spd/5, capped at +6. |
| `one-evasion-per-accuracy-check.md` | There are THREE evasion values, not one. Defender chooses which applies per attack. |
| `fatigue-levels.md` | Fatigue applies "−2 to Evasions" — a flat penalty, not a stage multiplier. |
| `power-and-lifting.md` | Heavy Lifting: "−2 to Evasion and Accuracy" — flat penalty, not CS. |

Three problems:
1. **Evasion is not a combat stage at all.** It's derived from stats via a formula. The design confuses "can be modified" with "is a combat stage."
2. **There are three evasion values, not one.** Physical, Special, and Speed evasion are distinct derived values. A single `evasion: number` field can't represent this.
3. **Evasion modifiers (fatigue, flanking, lifting) are flat penalties to derived values, not stage multipliers.** They operate in a different arithmetic space than combat stages.

**Impact:** Remove `evasion` from `HasCombatStages`. Evasion is a derived computation: `floor(stat / 5)` capped at 6, minus flat penalties from fatigue/flanking/etc. It belongs in the projection function (`projectCombatant`), not in mutable lens state. The flat penalty modifiers (fatigue level, flanking count) need their own tracking — possibly in `HasActiveEffects` or a new interface. Combat stages become 6 fields: `atk, def, spatk, spdef, spd, accuracy`. The mapping table's "Same 7 stages" claim should be "Same 6 combat stages."

**Severity:** High — wrong data model. Effects that try to write `combatStages.evasion` would be writing to a field that doesn't correspond to any PTR mechanic.

---

### 34. Initiative is derived from Speed, not an independent writable field

`HasInitiative` has `initiative: number` as a lens-sourced field written via `StateDelta`. The PTR vault says initiative is derived:

| Source | What it says |
|---|---|
| `dynamic-initiative-on-speed-change.md` | "Initiative immediately recalculates when Speed combat stages change mid-encounter (Paralysis, Agility, stat stage moves)." |
| `two-turns-per-player-per-round.md` | "Each combatant... has its own turn in the initiative order based on its Speed stat." |
| `full-contact-simple-initiative.md` | Initiative derived from Speed. |

Initiative is computed from `entity.stats.spd` + speed combat stage multiplier. It recalculates automatically when speed CS changes. The current design stores `initiative: number` as a flat field with no mechanism for auto-recalculation when `combatStages.spd` changes.

Quash and After You override initiative temporarily. But the normal case is derivation, not storage.

**Impact:** Initiative should be a derived value (like evasion) with an override mechanism for Quash/After You. The engine needs a hook that recalculates turn order whenever `combatStages.spd` changes — otherwise Agility granting +2 Speed CS has no effect on turn order until the next round, violating `dynamic-initiative-on-speed-change.md`. The `HasInitiative` interface might become:

```
HasInitiative {
  initiativeOverride: number | null   // Quash sets this to 0; null = use derived
  actedThisRound: boolean
}
```

With derived initiative = `effectiveStat(entity.stats.spd, lens.combatStages.spd)` when override is null.

**Severity:** High — the design breaks a core PTR mechanic (dynamic initiative). Speed-altering moves and conditions would feel disconnected from turn order.

---

## StateDelta Model Problems

---

### 35. Engine application rules are incomplete

The `state-delta-model.md` defines 5 application rules. Several fields don't fit:

| Field | Stated rule | Actual need | Problem |
|---|---|---|---|
| `initiative` | "Numeric deltas are additive" | Quash: set to 0 (replacement) | Additive doesn't work — if current initiative is 15, `delta.initiative = -15` is fragile |
| `actedThisRound` | No rule for booleans | Set to true/false | Booleans need replacement, not addition |
| `tempHp` | "Numeric deltas are additive" | Most systems: take higher value, don't stack | Additive would let two temp HP sources stack, which may violate PTR rules |
| `energyCurrent` | "Numeric deltas are additive" | Correct (subtract cost / add recovery) | Fine, but name suggests absolute value, not delta — `energyDelta` would be clearer |

The rules also don't cover `HasPersistentResources` at all (see finding 36). Take a Breather needs "set combatStages to all zeros" and "set tempHp to 0" — both are reset operations, not additive deltas.

**Impact:** The engine needs at least 4 application modes: additive (damage, energy, injuries), additive-with-clamp (combat stages), replacement (position, booleans, overrides), and reset (Take a Breather). The current specification is [[incomplete-library-class-smell]] — it handles the common case but not the edge cases that actually matter for correctness.

**Severity:** Medium — the architecture is sound, but the spec is underspecified. An implementer would have to invent solutions for every non-additive field.

---

### 36. HasPersistentResources has no delta path

`HasPersistentResources` is listed as a lens-sourced (read-write) interface:

```
mettlePoints: number
stealthRockHitThisEncounter: boolean
```

Neither field appears in `StateDelta`. Effects that spend Mettle points or trigger Stealth Rock entry damage have no way to write these fields through the delta model. This is a gap — either:
1. These fields need to be added to `StateDelta` (with appropriate application modes — additive for mettle, replacement for the boolean), or
2. These fields are engine-managed (the engine writes them directly, not via effect deltas) — but then the "engine is the single writer via deltas" contract is violated.

**Severity:** Medium — two fields with no write path.

---

## Missing State

---

### 37. Fatigue has no home in the sub-interface system

Fatigue is a stacking condition with its own dedicated category in PTR:

| Source | What it says |
|---|---|
| `fatigued-is-its-own-condition-category.md` | "Classified in its own standalone category — separate from Persistent, Volatile, and Other." |
| `fatigue-levels.md` | Stacking: per level, −2 attack rolls, −2 Evasions, −2 movement. 5 levels = unconscious. |
| `zero-energy-causes-fatigue.md` | Gained from reaching 0 Energy. |
| `take-a-breather-recovers-fatigue.md` | Take a Breather recovers 1 level. |

`HasStatus` has `statusConditions: StatusInstance[]` and `volatileConditions: VolatileInstance[]`. Fatigue fits neither — the vault explicitly says it's a separate category. There's no `fatigueLevel` field anywhere in the 15 sub-interfaces or in `StateDelta`.

Fatigue affects three derived computations: attack rolls (accuracy check modifier), evasion values (flat penalty to all three), and movement speeds (flat reduction). Without tracking fatigue level on the lens, none of these derived effects can be computed.

**Impact:** Either add `fatigueLevel: number` to `HasStatus` (expanding it to cover the third condition category) or create a dedicated interface. It needs a delta path in `StateDelta` and needs to feed into the evasion derivation (finding 33) and attack roll modification.

**Severity:** Medium — a PTR condition with no state representation.

---

### ~~38. Free Actions and action downgrade missing from HasActions~~ — RETRACTED

Retracted. Free actions exist in two flavors — voluntary (drop held item, become visible, mount with Expert+, send-out replacement) and triggered (Disable, Endure, Feint — "once per trigger"). Neither needs lens state: voluntary free actions are unlimited with no budget, triggered ones are constrained per-resolution-event (transient engine state) and limited by energy cost (already in `HasEnergy`). Action downgrade is a validation rule — the engine adjusts budget counts directly. The `HasActions` budget fields can represent all outcomes.

**Note:** The design's action model should acknowledge free actions exist as a fourth action category, even if no state field is needed. Currently `HasActions` is silent on them, which could confuse an implementer into thinking they were forgotten.

---

## Design Contradictions

---

### 39. ActiveEffect.state is untyped — contradicts compile-time safety claims

`ActiveEffect` uses `state: Record<string, unknown>` for effect-specific data. The note says "each effect definition documents what keys it stores." This is documentation-enforced typing.

The same design invokes `[[primitive-obsession-smell]]` against BlessingInstance's `effectDescription: string` and replaces it with a typed reference. It also claims StateDelta excludes entity fields "making accidental entity mutation a compile-time error."

But `Record<string, unknown>` is the most primitive type possible — it's `Map<string, any>`. An effect that reads `state.bonusDamage` gets `unknown` back. An effect that writes `state.typo = 5` compiles fine. The design trades one smell (named fields that grow unboundedly — `[[large-class-smell]]`, `[[divergent-change-smell]]`) for another (untyped bag of properties — `[[primitive-obsession-smell]]`).

**Impact:** This is a genuine design tension with no clean solution at this stage. The active-effect-model note correctly identifies why named fields don't scale. But the replacement sacrifices the compile-time safety the design champions elsewhere. Possible mitigation: make `ActiveEffect` generic — `ActiveEffect<T extends Record<string, unknown>>` — so each effect definition constrains its own state shape. The collection would use a union type or a discriminated union keyed by `effectId`. Worth noting, not necessarily worth solving in R0.

**Severity:** Medium — philosophical contradiction. The design correctly identifies the problem space but the solution undermines its own stated principles.

---

### 40. Field state source tracking is inconsistent

The design emphasizes source tracking (finding 23 required it on all condition instances). But field state types are inconsistent:

| Instance type | Has source tracking? | Notes |
|---|---|---|
| StatusInstance | Yes — `source: EffectSource` | Correct |
| VolatileInstance | Yes — `source: EffectSource` | Correct |
| VortexInstance | Yes — `casterId: string` | Correct |
| CoatInstance | Partial — `entityId: string` | Tracks the TARGET, not who cast it. Aqua Ring is self-cast so this works, but what about coats applied by allies? |
| HazardInstance | No — only `ownerSide: Side` | No individual source. If a trait triggers "when your hazard is removed," there's no `sourceEntityId` to check. |
| BlessingInstance | No — only `teamSide: Side` | Same gap as hazards. |
| WeatherInstance | No | No source at all. If "when your weather is replaced" matters, no data to check. |
| TerrainInstance | No | Same as weather. |

The design principle from finding 23 was: source tracking enables cure reversal, attribution, and caster-switch destruction. Vortex correctly implements this (destroyed on caster switch/faint). But if a trainer who set up Stealth Rock switches out, should the hazard persist? (Yes — hazards aren't caster-dependent.) So maybe hazards don't need source tracking. But the inconsistency should be acknowledged as a deliberate choice, not an oversight.

**Severity:** Low-Medium — not all field types need source tracking, but the design should state WHY some do and some don't, rather than leaving it implicit. The CoatInstance gap (target but not caster) is the most concerning.

---

## Maintenance Issues

---

### 41. combatant-as-lens.md contradicts the formal design

The `combatant-as-lens.md` note is listed as the "architectural foundation" and linked from 4 of the 10 new notes. But its code examples contradict the formal design:

| combatant-as-lens.md says | Formal design says | Finding |
|---|---|---|
| `CombatLens.entityType: 'pokemon' \| 'trainer'` (line 45) | `entityType` lives on the entity, not the lens | F32 |
| `CombatLens` has `mountedOn`, `riddenBy`, `engagedWith`, `wieldedBy` (lines 63-67) | Ring 4 fields removed from R0 | F31 |
| `CombatLens` is a flat struct with ~18 fields | Lens decomposed into 15 ISP sub-interfaces | R0.A design |
| `applyDamage` returns a new lens (line 117) | Effects return StateDelta, engine applies | F26 |
| `switchPokemon` creates lens directly (line 127) | Switching goes through deployment state model | F24 |

A reader following the "See also" chain from any new note will hit `combatant-as-lens.md` and find stale code examples that contradict the current design. The prose concepts are still valid (entities don't change type, lenses are transient projections) but the code blocks are outdated.

**Impact:** The code examples in `combatant-as-lens.md` should be updated or replaced with a note directing readers to the formal sub-interface design. The note's role has shifted from "the design" to "the motivation for the design."

**Severity:** Low — maintenance, but it's the most-linked note in the architecture. Readers will be confused.

---

### 42. BlessingInstance has no duration — activation-only expiry

`BlessingInstance` has `activationsRemaining: number` but no `roundsRemaining` or duration field. Light Screen's PTR move stat block confirms: "Light Screen may be activated 2 times, and then disappears." No duration mentioned.

This means unused Light Screen activations persist indefinitely until consumed or Defogged. This may be correct per PTR rules (activation-only, no time limit), but it differs from standard Pokemon game mechanics where screens have a turn limit. If this is an intentional PTR change, it should be noted. If it's an oversight in the PTR vault, it's a digestion gap like the Vortex keyword was.

**Impact:** Needs a PTR vault confirmation. If PTR blessings are truly activation-only with no time expiry, document this explicitly in `field-state-interfaces.md` so future readers don't assume it's a bug. If there IS a duration, add `roundsRemaining: number | null` to `BlessingInstance`.

**Severity:** Low-Medium — could be correct, needs vault confirmation.

---

## Summary

| # | Finding | Severity | Category |
|---|---|---|---|
| 33 | Evasion is not a combat stage | High | PTR rule violation |
| 34 | Initiative is derived from Speed | High | PTR rule violation |
| 35 | Engine application rules incomplete | Medium | Underspecified |
| 36 | HasPersistentResources has no delta path | Medium | Missing state |
| 37 | Fatigue has no home | Medium | Missing state |
| ~~38~~ | ~~Free Actions / downgrade missing~~ | ~~Retracted~~ | ~~Engine logic, not state~~ |
| 39 | ActiveEffect.state is untyped | Medium | Contradiction |
| 40 | Field state source tracking inconsistent | Low-Medium | Inconsistency |
| 41 | combatant-as-lens.md is stale | Low | Maintenance |
| 42 | BlessingInstance has no duration | Low-Medium | Needs vault check |

**Status:** Adversarial review of R0.A formal design complete. 10 findings (33–42). Two high-severity PTR rule violations (evasion, initiative) require data model changes. Awaiting review before amending vault notes.

