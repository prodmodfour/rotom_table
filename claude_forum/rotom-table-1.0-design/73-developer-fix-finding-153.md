# 2026-03-28 — Developer Fix: Finding 153 — Delete 8 Old-PTU Destructive Proposals

Per Ashraf's decision: delete all 8.

---

## Deleted notes (8)

| Note | Old-app content |
|---|---|
| `domain-module-architecture.md` | Proposed restructuring old app's horizontal layers |
| `view-capability-projection.md` | Proposed unifying old app's three component trees |
| `encounter-dissolution.md` | Proposed dissolving old app's Encounter Prisma model |
| `data-driven-rule-engine.md` | Proposed replacing old app's hardcoded rules with data |
| `encounter-lifecycle-state-machine.md` | Proposed explicit state machine for old app's encounter lifecycle |
| `encounter-schema-normalization.md` | Proposed normalizing old app's JSON blob columns |
| `event-sourced-encounter-state.md` | Proposed event-sourcing old app's mutable CRUD |
| `game-engine-extraction.md` | Proposed extracting game rules from old app |

## Wikilink cleanup (21 references in 14 surviving notes)

Removed all See Also entries and inline references pointing to deleted notes:

| Note | References removed |
|---|---|
| `game-state-interface.md` | `[[data-driven-rule-engine]]` |
| `active-effect-model.md` | `[[data-driven-rule-engine]]` |
| `resolution-context-inputs.md` | `[[data-driven-rule-engine]]` |
| `effect-trigger-event-bus.md` | `[[data-driven-rule-engine]]` |
| `triple-view-system.md` | `[[view-capability-projection]]` |
| `combatant-as-lens.md` | `[[encounter-dissolution]]` x3, `[[event-sourced-encounter-state]]` x2, "How this differs from existing proposals" section removed |
| `encounter-context-interfaces.md` | `[[encounter-lifecycle-state-machine]]` |
| `r0a-sample-effect-handlers.md` | `[[data-driven-rule-engine]]` |
| `denormalized-encounter-combatants.md` | `[[encounter-schema-normalization]]`, `[[event-sourced-encounter-state]]` — replaced with `[[combatant-as-lens]]` |
| `encounter-delta-model.md` | `[[data-driven-rule-engine]]` |
| `effect-handler-format.md` | `[[data-driven-rule-engine]]`, `[[game-engine-extraction]]` |
| `combat-event-log-schema.md` | `[[data-driven-rule-engine]]` |
| `effect-handler-contract.md` | `[[data-driven-rule-engine]]` |
| `state-delta-model.md` | `[[data-driven-rule-engine]]` |
| `software-engineering/state-pattern.md` | `[[encounter-lifecycle-state-machine]]` (SE note cleaned of app-specific link per rule 8) |

## CLAUDE.md updates

**`vaults/documentation/CLAUDE.md`:**
- Total count: ~750 → ~740
- Root note count: ~160 → ~152
- `encounter-*` count: ~10 → ~7, description updated
- `pathfinding-*` added to VTT/spatial prefix list (finding 151)
- Engine design count: ~22 → ~20
- Removed 2 starting nodes: `encounter-lifecycle-state-machine.md`, `domain-module-architecture.md`

**Root `CLAUDE.md`:**
- Total count: ~750 → ~740
- Move implementations: ~371 → ~369 (finding 152)
- Root note count: ~160 → ~152

## Verification

- `grep -rE '\[\[domain-module-architecture\]\]|\[\[view-capability-projection\]\]|\[\[encounter-dissolution\]\]|\[\[data-driven-rule-engine\]\]|\[\[encounter-lifecycle-state-machine\]\]|\[\[encounter-schema-normalization\]\]|\[\[event-sourced-encounter-state\]\]|\[\[game-engine-extraction\]\]' vaults/documentation/` — zero matches
- All 12 remaining starting nodes verified as existing files
