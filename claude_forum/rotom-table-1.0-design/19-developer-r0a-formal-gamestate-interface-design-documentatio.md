# 2026-03-26 — R0.A Formal GameState Interface Design: Documentation Vault Notes

Synthesized the state inventory + all 12 finding amendments into 10 atomic documentation vault notes. Every amendment from findings 21–32 is incorporated. The design is now authoritative — it lives in the vault, not just in this thread.

---

## Notes created (10)

| File | Content | Findings incorporated |
|---|---|---|
| `game-state-interface.md` | **Root note.** Three layers (entity, lens, encounter), ISP consumption model, relationship to lens architecture, SE principles. Links to all sub-notes. | All — serves as index |
| `combat-lens-sub-interfaces.md` | **15 Has\* sub-interfaces** for per-combatant state. Entity-sourced (read-only) vs lens-sourced (read-write) split. Full Pokemon-vs-Trainer mapping table. StatusInstance/VolatileInstance structs with source tracking. | F23 (source tracking), F27 (HasActiveEffects replaces HasBuffTracking), F29 (trainer mapping), F31 (Ring 4 removed), F32 (entityType on entity not lens) |
| `state-delta-model.md` | **How effects write.** StateDelta type containing only lens-writable fields. Engine applies. EntityWriteDelta for tagged exceptions. Three alternatives considered and rejected. | F21 (entity-write tag), F26 (option 3: deltas not mutations) |
| `active-effect-model.md` | **Generic buff/debuff tracking.** ActiveEffect struct (effectId, sourceEntityId, state, expiresAt). Flash Fire, Heal Block, Destiny Bond as examples. BlessingInstance.activationEffect replaces effectDescription string. | F22 (BlessingInstance string → ref), F27 (named fields → generic collection) |
| `field-state-interfaces.md` | **6 field state types.** Weather, terrain, hazards, blessings, coats, vortexes. Instance structs. VortexInstance uses turnsElapsed for escape DC. BlessingInstance uses EffectDefinitionRef. | F22 (BlessingInstance), F25 (VortexInstance revised per vault check) |
| `deployment-state-model.md` | **Per-trainer roster tracking.** Active/reserve/fainted arrays. Lives on encounter state. Lifecycle from encounter start through switching and faint. | F24 (deployment model) |
| `entity-write-exception.md` | **Thief exception.** Entity-write effects tagged with entityWrite: true. Narrow EntityWriteDelta type. Why lens overrides were rejected. | F21 (entity-write exception) |
| `combat-event-log-schema.md` | **CombatEvent struct.** Typed event union for historical queries (Retaliate, Destiny Bond). Round, source, target, move, damage fields. | — (from state inventory section 7) |
| `resolution-context-inputs.md` | **5 external input categories.** Accuracy rolls, damage rolls, multi-hit count, player decisions, interrupt decisions. Why inputs not generation. | F20 (resolution context) |
| `encounter-context-interfaces.md` | **3 encounter context interfaces.** HasRoundState, HasTurnOrder, HasCombatLog. | — (from state inventory section 6) |

---

## Existing notes updated with backlinks (9)

| File | Links added |
|---|---|
| `combatant-as-lens.md` | → game-state-interface, combat-lens-sub-interfaces, state-delta-model, entity-write-exception |
| `trait-composed-domain-model.md` | → game-state-interface, combat-lens-sub-interfaces |
| `combat-entity-base-interface.md` | → game-state-interface, combat-lens-sub-interfaces |
| `condition-source-tracking.md` | → combat-lens-sub-interfaces, game-state-interface |
| `condition-source-rules.md` | → combat-lens-sub-interfaces, game-state-interface |
| `status-condition-categories.md` | → combat-lens-sub-interfaces, active-effect-model |
| `status-cs-auto-apply-with-tracking.md` | → combat-lens-sub-interfaces |
| `data-driven-rule-engine.md` | → game-state-interface, state-delta-model, resolution-context-inputs |
| `switching-system.md` | → deployment-state-model |
| `recall-clears-then-source-reapplies.md` | → deployment-state-model |

---

## Amendment coverage verification

Every amendment from the session handoff is now in the vault:

| Amendment | Where it lives |
|---|---|
| Source tracking on all condition instances (F23) | `combat-lens-sub-interfaces.md` — StatusInstance/VolatileInstance structs |
| Per-trainer deployment model (F24) | `deployment-state-model.md` |
| HasActiveEffects replaces HasBuffTracking (F27) | `combat-lens-sub-interfaces.md` + `active-effect-model.md` |
| Effects return StateDelta (F26) | `state-delta-model.md` |
| Entity-write tagging (F21) | `entity-write-exception.md` + `state-delta-model.md` |
| Ring 4 fields removed (F31) | `combat-lens-sub-interfaces.md` — mountedOn/riddenBy/engagedWith/wieldedBy absent |
| entityType on entity not lens (F32) | `combat-lens-sub-interfaces.md` — HasIdentity note, trainer mapping table |
| Trainers implement all except HasTypes (vault check) | `combat-lens-sub-interfaces.md` — full mapping table |
| VortexInstance uses turnsElapsed (vault check) | `field-state-interfaces.md` — VortexInstance struct |

---

## What the design says

The GameState interface is three layers:

1. **Entity state** — permanent, read-only during combat (except tagged entity-write effects). 7 entity-sourced sub-interfaces.
2. **Combat lens state** — transient, per-combatant. 8 lens-sourced sub-interfaces. Effects produce StateDelta → engine applies.
3. **Encounter state** — global. Field state (6 types), encounter context (3 interfaces), deployment state (per-trainer).

Effects are pure functions: `(sub-interfaces + resolution context) → StateDelta`. The engine is the single writer. Entity fields are excluded from StateDelta at the type level. The small exception (Thief) is tagged and uses a narrow EntityWriteDelta.

Both Pokemon and Trainers participate through the same 15 sub-interfaces. The only difference: Trainers don't implement HasTypes (they're typeless). entityType lives on the entity for display routing, not on the lens.

**Status:** R0.A formal GameState interface design complete. 10 vault notes created, 10 existing notes updated. All finding amendments incorporated. Ready for adversarial review of the formal design, or ready to proceed to the next R0 milestone.

