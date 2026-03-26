# Entity Write Exception

The documented exception to the entity-is-read-only-during-combat rule from [[combatant-as-lens]]. A small number of effects write entity state. These are tagged explicitly and permitted by the engine. Part of the [[game-state-interface]].

## The rule and its exception

Per [[combatant-as-lens]], the entity is the source of truth for intrinsic properties and is read-only during combat. Effects write to the lens via [[state-delta-model|StateDelta]]. The [[combat-lens-sub-interfaces]] enforce this at the type level — entity fields are absent from `StateDelta`.

The exception: **Thief** steals the target's held item and attaches it to the user. `heldItem` and `accessorySlotItem` are entity state — they survive combat. Thief writes entity state during combat.

## How it works

Effect definitions that require entity mutation are tagged:

```
{ entityWrite: true }
```

The engine checks this tag before permitting entity writes. Untagged effects cannot produce an `EntityWriteDelta` — the type system prevents it. Tagged effects may return:

```
EntityWriteDelta {
  heldItem?: ItemRef | null
  accessorySlotItem?: ItemRef | null
}
```

The type is deliberately narrow. Only inventory fields are writable. If future effects need to write other entity fields (unlikely in R0), each new field requires explicit addition to `EntityWriteDelta`, making scope creep visible and auditable.

## Why not lens overrides

An alternative was considered: add `heldItemOverride` to the lens, reconcile back to the entity at encounter end. This was rejected because:

- Every item-reading effect must check the override first, adding branching complexity
- Reconciliation at encounter end is a new failure mode (what if the encounter crashes?)
- The override creates two sources of truth for item ownership during combat

Acknowledging the exception and tagging it explicitly is simpler. The boundary remains enforceable — just not absolute.

## Known entity-write effects

Currently only **Thief** (move #27 in the 45-definition sample). XP distribution (Ring 3) may also write entity state but is out of scope for R0.

## See also

- [[game-state-interface]] — the parent design
- [[combatant-as-lens]] — the read-only-during-combat rule this amends
- [[state-delta-model]] — the delta model that excludes entity fields by default
- [[combat-lens-sub-interfaces]] — `HasInventory` hosts the entity fields Thief writes
