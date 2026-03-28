# 2026-03-28 — Adversarial Review Amendment: Destructive Proposals Are Old-App Artifacts

Ashraf's correction: the 8 "destructive proposal" notes are proposals for the former PTU app, not forward-looking design documents.

---

## Finding 153 — Destructive proposal notes describe deleted old-app code, not current architecture

**Severity: Blocking (amends approval in post 71)**

Post 71 accepted the developer's characterization that destructive proposal notes use "file paths as structural illustrations." Ashraf's correction reveals this was wrong — these notes are proposals for restructuring the old PTU app. That app was deleted (post 35). The problems described, the code referenced, and the solutions proposed all target code that no longer exists.

**The 8 notes:**

| Note | What it proposes |
|---|---|
| `domain-module-architecture.md` | Restructuring the old app's horizontal layer directories (158 components, 64 composables, 38 utils, etc.) |
| `view-capability-projection.md` | Replacing the old app's three parallel component trees (17 Player components, GroupEncounterTab, etc.) |
| `encounter-dissolution.md` | Dissolving the old app's monolithic Encounter Prisma model (15+ JSON TEXT columns) |
| `data-driven-rule-engine.md` | Replacing the old app's hardcoded rules (871-line useMoveCalculation.ts, 791-line combatant.service.ts) |
| `encounter-lifecycle-state-machine.md` | Making the old app's implicit encounter lifecycle explicit (44 routes, out-of-turn.service.ts) |
| `encounter-schema-normalization.md` | Normalizing the old app's JSON blob columns into relational tables |
| `event-sourced-encounter-state.md` | Event-sourcing the old app's mutable encounter CRUD (Prisma, SQLite, Nuxt stack) |
| `game-engine-extraction.md` | Extracting game rules from the old app (38 utils, 23 services, composables) |

Every one of these references deleted code: specific file names, line counts, route counts, Prisma models, Vue components, store sizes. The "Why this is destructive" sections describe restructuring operations on code that was deleted wholesale when the old app was archived.

This is [[dead-code-smell]] applied to documentation — these notes describe transformations of code that no longer exists. They violate the `documentation-note-content-boundary` convention for the same reason the 17 cleaned notes did: they reference implementation locations for deleted code.

**Note:** Some of these notes contain design IDEAS that may still inform the new PTR app (e.g., the encounter state machine concept, the view capability projection concept, the state container composition concept). The `game-engine-extraction.md` proposal has already been partially realized — `packages/engine/` exists. The question is whether the ideas are already captured by other notes or need to be preserved.

Two of these notes are listed as starting nodes in `vaults/documentation/CLAUDE.md`:
- `encounter-lifecycle-state-machine.md`
- `domain-module-architecture.md`

These starting nodes currently route agents into notes about the old app, not the new one.

**Resolution options (Ashraf decides):**

1. **Delete all 8.** The design ideas that survived are already represented by adopted notes (effect-handler-contract, state-delta-model, game-state-interface, etc.). The proposals themselves are historical.
2. **Clean and keep.** Strip old-app framing and specific file/line references. Rewrite as forward-looking design concepts for the new PTR app. Risk: the notes become speculative generality ([[speculative-generality-smell]]) if the new app's architecture doesn't follow the same approach.
3. **Selectively delete/clean.** Delete notes whose ideas were superseded or adopted elsewhere. Clean notes whose ideas are still unadopted but potentially relevant.

---

## Impact on post 71 approval

Post 71's approval was based on the assessment that all old-app artifact references in non-proposal notes were resolved, and that destructive proposal references were a "lower priority" acknowledged category. Ashraf's correction invalidates the second part of that assessment.

The Phase 4 execution for non-proposal notes remains approved. The 8 destructive proposal notes need a decision from Ashraf on how to handle them before Phase 4 can be fully closed.

---

## Updated CURRENT-TASK.md

Phase reverted to "Phase 4 — CODE (awaiting decision on finding 153)."
