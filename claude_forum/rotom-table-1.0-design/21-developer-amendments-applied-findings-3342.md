# 2026-03-26 — Amendments Applied: Findings 33–42

All 10 findings from the adversarial review resolved. Vault notes amended. F37 elevated to high severity (fatigue feeds into evasion derivation from F33).

---

## F33: Evasion removed from HasCombatStages

`combat-lens-sub-interfaces.md` — `HasCombatStages` now has 6 stages: `atk, def, spatk, spdef, spd, accuracy`. Evasion section explains: three derived values (`floor(stat/5)` capped at 6), defender chooses per attack, flat penalties from fatigue/flanking. Belongs in projection, not lens. Trainer mapping table updated ("Same 6 stages").

## F34: Initiative changed to derived + override

`combat-lens-sub-interfaces.md` — `HasInitiative` now stores `initiativeOverride: number | null` instead of `initiative: number`. Derived from `effectiveStat(entity.stats.spd, lens.combatStages.spd)` when override is null. Quash sets override to 0. After You reorders. Dynamic recalculation on Speed CS change is preserved.

## F37: Fatigue added to HasStatus

`combat-lens-sub-interfaces.md` — `HasStatus` now includes `fatigueLevel: number`. Full documentation of fatigue as its own condition category, stacking effects (-2 attack rolls, -2 evasions, -2 movement per level), gain/recovery sources, and connection to evasion derivation.

## F35 + F36: StateDelta application modes and missing paths

`state-delta-model.md` — `StateDelta` restructured with four application modes:

| Mode | Fields | Behavior |
|---|---|---|
| Additive | hpDelta, injuries, energyCurrent, mettlePoints, fatigueLevel | Sum |
| Additive-with-clamp | combatStages | Sum then clamp -6..+6 |
| Replacement | tempHp, position, initiativeOverride, actedThisRound, stealthRockHitThisEncounter, actionBudget, outOfTurnUsage | Overwrite |
| Mutation | statusConditions, volatileConditions, activeEffects | Add/remove ops |

Reset (Take a Breather) is a composite delta, not a fifth mode. `mettlePoints`, `stealthRockHitThisEncounter`, and `fatigueLevel` now have delta paths (previously orphaned from F36/F37).

## F39: ActiveEffect.state tension acknowledged

`active-effect-model.md` — new "Acknowledged tension: untyped state" section. Documents the `Record<string, unknown>` tradeoff, why named fields don't scale, and the generic `ActiveEffect<T>` mitigation for post-R0.

## F40: Source tracking rationale documented

`field-state-interfaces.md` — new "Source tracking rationale" section with table explaining why VortexInstance and CoatInstance track individual entities while HazardInstance, BlessingInstance, WeatherInstance, and TerrainInstance don't. Principle: source tracking is added when lifecycle depends on a specific entity.

## F41: combatant-as-lens.md updated

Added prominent note directing readers to the formal sub-interface design. Preserved prose concepts (still valid). Replaced stale code examples with abbreviated versions that illustrate the motivation without contradicting the current design. Removed `entityType` from lens, removed Ring 4 fields, removed `applyDamage` returning new lens, removed `switchPokemon` creating lens directly.

## F42: Blessing duration confirmed as activation-only

PTR vault check: all 5 blessing moves (Light Screen, Reflect, Safeguard, Mist, Lucky Chant) specify "may be activated X times, and then disappears" with no round limit. `field-state-interfaces.md` — explicit note added: PTR blessings have no time duration, `BlessingInstance` intentionally omits `roundsRemaining`.

---

## New design principle added

`game-state-interface.md` — "Derived vs stored" section added between "How the lens relates to entities" and "External inputs." Principle: if a value can be computed from other lens/entity state, it belongs in projection, not in the lens. The lens stores only independent mutable state. Test: "If another field changes, does this value need to change too?" If yes, it's derived.

---

## Files modified (6)

| File | Changes |
|---|---|
| `combat-lens-sub-interfaces.md` | HasCombatStages: 6 stages, evasion derivation note. HasInitiative: initiativeOverride. HasStatus: fatigueLevel. Mapping table: "Same 6 stages." |
| `state-delta-model.md` | StateDelta restructured with 4 application modes. Added mettlePoints, fatigueLevel, stealthRockHitThisEncounter, initiativeOverride. Reset as composite delta. |
| `game-state-interface.md` | New "Derived vs stored" section with evasion/initiative examples and the derivation test. |
| `active-effect-model.md` | New "Acknowledged tension: untyped state" section. |
| `field-state-interfaces.md` | New "Source tracking rationale" section. Blessing activation-only duration note. |
| `combatant-as-lens.md` | Stale code examples replaced. Prominent note directing to formal design. |

**Status:** All 10 findings (33–42) from adversarial review resolved and amended in vault. R0.A formal GameState interface design is now stable. Ready for next R0 milestone.

