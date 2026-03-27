# 2026-03-27 — Plan: Documentation Vault Triage

## Methodology

Triage all ~377 documentation vault root notes into four categories with a specific action for each.

### Triage categories

| Category | Label | Action | Criteria |
|---|---|---|---|
| **A — Current** | `keep` | No changes | Notes that describe the new engine design (R0.A+), pure design philosophy, or conventions. No old-app references. |
| **B — Valid intent, contaminated** | `clean` | Edit: remove old file paths/component names, keep design intent | Notes with valid game mechanic or architecture design that also reference deleted old-app artifacts (service files, composables, stores, API routes, Prisma schema). |
| **C — Stale** | `delete` | Delete the note | Notes that are purely about old-app implementation detail with no transferable design value. Implementation specs for deleted components, composables, services, stores, or routes that carry no design insight beyond "this is what the old code did." |
| **D — Architecture analysis** | `decide` | Flag for Ashraf's decision | Old-app smell analyses and destructive proposals. Some may have lasting design value as cautionary notes; others describe problems that no longer exist. |

### Classification rubric

For each note, ask in order:

1. Does it describe something in `packages/engine/` or the R0.A+ design? → **A (keep)**
2. Is it a pure design principle with no implementation references? → **A (keep)**
3. Is it a convention note (phase 3 output)? → **A (keep)**
4. Does it describe a valid game mechanic/formula/workflow AND reference old code? → **B (clean)**
5. Does it describe a valid architectural concept (views, state machines, pipelines) AND reference old code? → **B (clean)**
6. Is it purely an implementation spec for deleted code (component props, API endpoint params, store action signatures, service function docs)? → **C (delete)**
7. Does it diagnose a problem in the old code or propose a redesign? → **D (decide)**

### Execution plan

**Phase 4 (execute):** Work through notes in batches by domain prefix. For each batch:
- Read each note
- Apply the rubric
- For **B** notes: edit to remove old-app references, keeping design content
- For **C** notes: delete
- For **D** notes: compile a decision list for Ashraf
- Post progress after each batch

**Phase 5 (vault update):** Update `vaults/documentation/CLAUDE.md` to reflect the new note counts, remove references to deleted notes, and add a routing note about which notes describe implemented vs. planned design.

### Initial bulk categorization

Below is my proposed categorization for every root note, organized by domain prefix. Notes I've read are categorized with high confidence. Notes I haven't read are categorized by name pattern and cross-reference signals; these will be verified during Phase 4.

---

#### Engine design — Category A (keep as-is, ~21 notes)

These describe the new `@rotom/engine` architecture. Already implemented or actively being implemented.

- `active-effect-model.md`
- `before-handler-response-modes.md`
- `combat-event-log-schema.md`
- `combat-lens-sub-interfaces.md`
- `combatant-as-lens.md`
- `deployment-state-model.md`
- `effect-handler-contract.md`
- `effect-handler-format.md`
- `effect-trigger-event-bus.md`
- `effect-utility-catalog.md`
- `encounter-context-interfaces.md`
- `encounter-delta-model.md`
- `entity-write-exception.md`
- `field-state-interfaces.md`
- `game-state-interface.md`
- `r0a-sample-effect-handlers.md`
- `resolution-context-inputs.md`
- `silence-means-no-effect.md`
- `state-delta-model.md`
- `status-application-must-use-applyStatus.md`
- `trigger-event-field-semantics.md`
- `utility-self-targeting-convention.md`

#### Pure design philosophy — Category A (keep as-is, ~15 notes)

Implementation-agnostic principles that apply to any version of the app.

- `automate-routine-bookkeeping.md`
- `encounter-creation-is-gm-driven.md`
- `errata-corrections-not-replacements.md`
- `gm-delegates-authority-into-system.md`
- `information-asymmetry-by-role.md`
- `minimum-floors-prevent-absurd-results.md`
- `no-false-citations.md`
- `per-conflict-decree-required.md`
- `percentages-are-additive.md`
- `player-autonomy-boundaries.md`
- `presets-stay-within-raw.md`
- `raw-fidelity-as-default.md`
- `separate-mechanics-stay-separate.md`
- `server-enforcement-with-gm-override.md`
- `the-table-as-shared-space.md`
- `cross-reference-before-concluding-omission.md`

#### Game mechanic design — Category B (clean: remove old code refs, ~80+ notes)

Valid design for how PTR rules become app logic, but contaminated with old file paths. Grouped by prefix.

**capture-*** (~7): `capture-accuracy-gate`, `capture-api-endpoints`, `capture-context-toggles`, `capture-difficulty-labels`, `capture-rate-display-component`, `capture-rate-formula`, `capture-roll-mechanics`

**combat-/combatant-*** (~10): `combat-maneuver-catalog`, `combat-stage-system`, `combatant-card-visibility-rules`, `combatant-movement-capabilities`, `combatant-type-hierarchy`, `combatant-type-segregation`, `combatant-capabilities-utility`, `combatant-interface-breadth`, `combat-entity-base-interface`

**encounter-*** (~15): `encounter-lifecycle-state-machine`, `encounter-serving-mechanics`, `encounter-core-api`, `encounter-grid-state`, `encounter-table-data-model`, `encounter-table-entry`, `encounter-generation-service`, `encounter-template-api`, `encounter-budget-needs-ptu-basis`, `encounter-table-api`, `encounter-table-store`, `encounter-table-components`

**damage/evasion/healing*** (~10): `nine-step-damage-formula`, `damage-flow-pipeline`, `damage-base-chart`, `evasion-and-accuracy-system`, `evasion-from-defensive-stats`, `effective-max-hp-formula`, `hp-injury-system`, `healing-mechanics`, `healing-item-system`, `healing-data-fields`

**status-*** (~8): `status-condition-categories`, `status-condition-registry`, `status-condition-ripple-effect`, `status-cs-auto-apply-with-tracking`, `status-tick-automation`, `status-capture-bonus-hierarchy`, `condition-source-tracking`, `condition-source-rules`

**player-*** (~15): `player-view-architecture`, `player-page-orchestration`, `player-identity-system`, `player-combat-composable`, `player-combat-action-panel`, `player-encounter-display`, `player-pokemon-team-display`, `player-character-sheet-display`, `player-websocket-composable`, `player-websocket-events`, `player-reconnection-sync`, `player-scene-view`, `player-grid-interaction`, `player-group-view-control`, `player-capture-healing-interface`, `player-data-api`, `player-action-discriminated-union`, `player-action-request-optionals`, `player-grid-tools`

**pokemon-/trainer-*** (~15): `pokemon-hp-formula`, `pokemon-stat-allocation`, `pokemon-evolution-system`, `pokemon-experience-chart`, `pokemon-loyalty`, `pokemon-move-learning`, `pokemon-origin-enum`, `pokemon-generator-entry-point`, `trainer-hp-formula`, `trainer-stat-budget`, `trainer-skill-definitions`, `trainer-derived-stats`, `six-trainer-combat-stats`, `trainer-capabilities-field`

**scene-*** (~7): `scene-data-model`, `scene-activation-lifecycle`, `scene-to-encounter-conversion`, `scene-group-system`, `scene-api-endpoints`, `scene-components`, `scene-websocket-events`

**switching/mounting/living-weapon** (~6): `switching-system`, `switching-validation-pipeline`, `mounting-system`, `living-weapon-system`, `intercept-disengage-system`, `attack-of-opportunity-system`

**turn/initiative/battle** (~5): `turn-lifecycle`, `initiative-and-turn-order`, `battle-modes`, `declaration-system`, `take-a-breather-mechanics`

**websocket-*** (~6): `websocket-real-time-sync`, `websocket-event-union`, `websocket-store-sync`, `websocket-sync-as-observer-pattern`, `websocket-union-extensibility`

**view system** (~5): `triple-view-system`, `view-capability-projection`, `view-component-duplication`, `combatant-card-subcomponents`, `group-view-tabs`, `group-view-api`, `group-view-scene-interaction`, `gm-view-routes`

**grid/vtt/isometric** (~15): `grid-distance-calculation`, `grid-mode-is-encounter-identity`, `grid-interaction-unification`, `vtt-rendering-pipeline`, `vtt-grid-components`, `vtt-grid-composables`, `vtt-grid-persistence-apis`, `vtt-component-composable-map`, `isometric-camera-system`, `isometric-projection-math`, `three-coordinate-spaces`, `depth-sorting-layers`, `projection-agnostic-spatial-engine`, `multi-cell-token-footprint`, `size-determines-grid-footprint`, `size-category-footprint-map`, `custom-token-shapes`, `fog-of-war-system`, `measurement-aoe-modes`, `one-distance-metric-everywhere`, `path-speed-averaging`, `pathfinding-algorithm`, `elevation-system`, `elevation-is-persistent-state`

**rest/healing** (~8): `rest-healing-system`, `rest-healing-api-endpoints`, `rest-healing-composable`, `natural-injury-healing`, `pokemon-center-healing`, `pokemon-center-time-formula`, `thirty-minute-rest`, `extended-rest`, `new-day-reset`, `advance-day-button`, `daily-counter-auto-reset`

**misc game mechanics** (~15): `poke-ball-system`, `conditional-ball-modifier-rules`, `weather-rules-utility`, `weather-tick-automation`, `terrain-type-system`, `move-energy-system`, `equipment-system`, `equipment-bonus-aggregation`, `xp-distribution-flow`, `xp-from-new-pokemon`, `species-data-model`, `type-grants-status-immunity`, `type-status-immunity-utility`, `decouple-behaviors-from-categories`, `condition-independent-behavior-flags`, `faint-and-revival-effects`, `fainted-pokemon-cannot-be-captured`, `owned-pokemon-reject-capture`, `temp-hp-mechanics`, `ghost-type-ignores-movement-restrictions`, `movement-is-atomic-per-shift`, `movement-modifiers-utility`, `movement-preview-sync`, `legendary-species-detection`

**misc app design** (~10): `damage-pipeline-as-chain-of-responsibility`, `switching-validation-duplication`, `property-based-rule-verification`, `vault-sourced-data-repository`, `data-driven-rule-engine`, `other-conditions-source-dependent-faint`, `sleep-volatile-but-persists`, `confused-three-outcome-save`, `recall-clears-then-source-reapplies`, `clear-then-reapply-pattern`, `significance-and-budget`, `significance-cap-x5`

#### Old-app implementation specs — Category C (delete, ~40+ notes)

Pure implementation detail for deleted code. No design insight beyond documenting what the old code did.

- `api-endpoint-layout.md` — layout of deleted `server/api/` routes
- `api-error-handling.md` — error handling in deleted API layer
- `api-response-format.md` — response format of deleted API
- `api-to-service-mapping.md` — mapping of deleted routes to deleted services
- `auto-parse-stat-feature-tags.md` — old CSV parsing detail
- `ball-condition-service.md` — old service implementation
- `ball-modifier-formatting.md` — old utility detail
- `branching-class-suffix-pattern.md` — old naming convention
- `character-api-endpoints.md` — deleted API routes
- `character-card.md` — deleted component
- `character-creation-composable.md` — deleted composable
- `character-creation-page.md` — deleted page
- `character-creation-validation.md` — deleted validation
- `character-export-import-composable.md` — deleted composable
- `character-sheet-modal.md` — deleted component
- `connection-utilities.md` — deleted utility
- `csv-import-service.md` — old service
- `daily-moves-once-per-scene.md` — old frequency system (PTR removed frequencies)
- `debounced-persistence.md` — old persistence pattern
- `dev-server-commands.md` — old dev setup
- `display-name-helper-duplication.md` — old smell analysis
- `display-name-utility-extraction.md` — old refactoring proposal
- `encounter-component-categories.md` — deleted component listing
- `encounter-composable-delegation.md` — deleted composable architecture
- `entity-update-service.md` — deleted service
- `haptic-feedback-patterns.md` — mobile UX detail (may reapply later)
- `healing-tab-component.md` — deleted component
- `heavily-injured-penalty-duplication.md` — old smell
- `heavily-injured-penalty-extraction.md` — old refactoring
- `largest-composables.md` — old code metrics
- `library-store.md` — deleted store
- `map-reactivity-gotcha.md` — Vue/Pinia gotcha (framework-specific)
- `movedata-reference-table.md` — old seed data
- `moves-csv-source-file.md` — old data pipeline
- `nitro-file-based-routing.md` — old Nuxt routing
- `pending-request-routing.md` — old request routing
- `pokemon-api-endpoints.md` — deleted API routes
- `pokemon-bulk-operations.md` — deleted bulk ops
- `pokemon-nickname-resolution.md` — old component detail
- `pokemon-sheet-dice-rolls.md` — old component
- `pokemon-sheet-page.md` — deleted page
- `pokemon-sprite-resolution-chain.md` — old sprite loading
- `prisma-derived-vs-hand-written-types.md` — old type generation
- `prisma-schema-overview.md` — deleted schema
- `qr-code-utility.md` — old utility
- `quick-stat-workflow.md` — old component workflow
- `ranked-feature-tag.md` — old PTU concept
- `rest-healing-api-endpoints.md` — deleted API
- `rest-healing-composable.md` — deleted composable
- `schema-sync-strategy.md` — old Prisma sync
- `seed-data-pipeline.md` — old seeding
- `service-dependency-map.md` — deleted service topology
- `service-inventory.md` — deleted service listing
- `settings-api.md` — deleted settings route
- `showdown-sprite-name-mappings.md` — old sprite mapping
- `store-to-domain-mapping.md` — deleted store mapping
- `structured-data-for-complex-metadata.md` — old data modeling
- `structured-edge-objects.md` — old PTU edge system
- `suppressed-frequency-downgrade.md` — old frequency system
- `test-coverage-gaps.md` — old test analysis
- `test-directory-structure.md` — old test layout
- `test-selector-guidance.md` — old testing convention
- `touch-gesture-handling.md` — old mobile handler detail
- `trainer-owned-species-tracking.md` — old Prisma detail
- `trainer-sprites.md` — old sprite detail
- `type-file-classification.md` — old type file listing
- `utility-api-endpoints.md` — deleted API
- `vitest-configuration.md` — old test config
- `sample-backgrounds.md` — old UI concept

#### Architecture analysis / destructive proposals — Category D (decide, ~40+ notes)

These diagnosed old-code problems or proposed redesigns. Some may have lasting value. I'll flag each with a recommendation but defer to Ashraf.

**Adopted proposals (recommend: reclassify to A):**
- `combatant-as-lens.md` — adopted, already Category A
- `game-state-interface.md` — adopted, already Category A
- `data-driven-rule-engine.md` — partially adopted as the effect engine concept
- `game-engine-extraction.md` — adopted as `@rotom/engine`

**Unadopted proposals (recommend: keep as future design reference):**
- `encounter-lifecycle-state-machine.md` — still relevant for Ring 1
- `domain-module-architecture.md` — still relevant for app restructuring
- `encounter-dissolution.md` — may inform encounter design
- `view-capability-projection.md` — still relevant for Ring 1
- `event-sourced-encounter-state.md` — future possibility
- `universal-event-journal.md` — future possibility
- `encounter-schema-normalization.md` — future persistence design

**Old-code problem diagnoses (recommend: delete — problems no longer exist):**
- `combatant-interface-bloat.md` — old interface, solved by lens
- `combatant-service-mixed-domains.md` — deleted service
- `combatant-service-decomposition.md` — deleted service
- `composable-architectural-overreach.md` — deleted composables
- `composable-dependency-chains.md` — deleted composables
- `composable-dependency-injection-pattern.md` — deleted composables
- `composable-store-direct-coupling.md` — deleted coupling
- `encounter-store-as-facade.md` — deleted store
- `encounter-store-decomposition.md` — deleted store
- `encounter-store-god-object-risk.md` — deleted store
- `encounter-store-surface-reduction.md` — deleted store
- `entity-data-model-rigidity.md` — deleted model
- `entity-shared-field-incompatibility.md` — deleted types
- `entity-union-unsafe-downcasts.md` — deleted types
- `framework-coupled-game-server.md` — old Nuxt coupling
- `game-logic-boundary-absence.md` — old problem, engine solves it
- `grid-isometric-interaction-duplication.md` — deleted grid code
- `hardcoded-game-rule-proliferation.md` — old problem, engine solves it
- `horizontal-layer-coupling.md` — old directory structure
- `implicit-encounter-lifecycle.md` — old implicit lifecycle
- `in-memory-encounter-state.md` — old state management
- `monolithic-mechanic-integration.md` — old integration problems
- `next-turn-route-business-logic.md` — deleted route
- `nuxt-framework-entanglement.md` — old Nuxt coupling
- `out-of-turn-service-bundled-actions.md` — deleted service
- `out-of-turn-service-split.md` — deleted service
- `persistence-hot-path-overhead.md` — old persistence problem
- `routes-bypass-service-layer.md` — deleted routes
- `service-pattern-classification.md` — deleted services
- `service-responsibility-conflation.md` — deleted services
- `singleton-state-coupling.md` — old state coupling
- `status-condition-ripple-effect.md` — old shotgun surgery
- `store-independence-from-each-other.md` — deleted stores
- `switching-validation-duplication.md` — deleted duplication
- `transaction-script-turn-lifecycle.md` — old lifecycle problem
- `trigger-validation-switch-chains.md` — old switch chain problem
- `trigger-validation-strategy-registry.md` — old registry proposal
- `view-component-duplication.md` — deleted components
- `view-logic-component-entanglement.md` — deleted components

**Alternative architectures (recommend: keep for reference):**
- `cqrs-mediator-architecture.md`
- `command-bus-ui-architecture.md`
- `entity-component-system-architecture.md`
- `headless-domain-components.md`
- `headless-game-server.md`
- `ioc-container-architecture.md`
- `plugin-mechanic-architecture.md`
- `repository-use-case-architecture.md`
- `saga-orchestrated-turn-lifecycle.md`
- `server-authoritative-reactive-streams.md`
- `typed-rpc-api-layer.md`
- `explicit-vue-architecture.md`
- `kill-the-api-directory.md`
- `client-server-state-mirroring.md`
- `route-to-service-migration-strategy.md`
- `service-delegation-rule.md`
- `service-layer-pattern.md`
- `domain-driven-persistence-adapter.md`
- `storeless-query-cache.md`
- `trait-composed-domain-model.md`

**Remaining misc (verify during Phase 4):**
- `pinia-store-classification.md` — delete (describes deleted stores)
- `denormalized-encounter-combatants.md` — clean (design concept, old impl)
- `json-as-text-columns.md` — delete (SQLite pattern, old schema)
- `singleton-models.md` — clean (concept applies to new design)
- `isinlibrary-archive-flag.md` — delete (old schema flag)
- `pokemon-origin-enum.md` — clean (enum concept, old Prisma ref)
- `pure-service-testability-boundary.md` — clean (principle, old service refs)
- `turn-advancement-service-extraction.md` — delete (old service refactoring)
- `geometry-utility-extraction.md` — delete (old refactoring)
- `cross-store-coordination-rule.md` — delete (old store rule)

---

## Summary counts (estimated)

| Category | Count | Action |
|---|---|---|
| A — Keep as-is | ~37 | None |
| B — Clean (remove old refs) | ~150 | Edit each note |
| C — Delete | ~70 | Delete |
| D — Decide (Ashraf) | ~60 | Present list |
| **Not in scope** | ~60 | move-implementations/, software-engineering/ |

## SE principles applied

- **[[dead-code-smell]]** — notes describing deleted code are the documentation equivalent of dead code. They add weight without value and confuse future readers about what's current.
- **[[single-responsibility-principle]]** — each note should describe one thing accurately. Notes that blend valid design with stale implementation have two responsibilities that change at different rates.
- **[[speculative-generality-smell]]** — some architecture proposals explored paths not taken. Keeping them suggests they're planned, creating false signals.

## Open questions for Ashraf

1. **Category D disposition:** Should old-code problem diagnoses be kept as cautionary notes, or deleted since the problems no longer exist?
2. **Alternative architecture notes:** Keep all ~20 as "considered alternatives" reference, or prune to only those relevant to the ring plan?
3. **Phase 4 batch size:** Work through all ~150 Category B notes in one session, or break into smaller batches with check-ins?
4. **Move-implementations scope:** The ~371 move implementation specs were described as "stale, being updated to PTR" in the CLAUDE.md. Should they be included in this triage or handled separately?

## Ashraf's decisions

1. **Delete** all old-code problem diagnoses. The problems no longer exist.
2. **Prune all** alternative architecture notes. Delete them.
3. **All at once.** Process all ~150 Category B notes in a single session.
4. **Move-implementations are up to date.** The CLAUDE.md description is stale — fix it. No triage needed for move-implementations.

### Impact on plan

Category D collapses. Old-code diagnoses (~39 notes) and alternative architectures (~20 notes) move to delete. The only D survivors are:
- **Adopted proposals** (combatant-as-lens, game-state-interface, game-engine-extraction, data-driven-rule-engine) — already Category A.
- **Ring-plan-relevant unadopted proposals** (encounter-lifecycle-state-machine, domain-module-architecture, encounter-dissolution, view-capability-projection, event-sourced-encounter-state, universal-event-journal, encounter-schema-normalization) — move to Category B (clean).

### Revised counts

| Category | Count | Action |
|---|---|---|
| A — Keep as-is | ~48 | None |
| B — Clean (remove old refs) | ~157 | Edit each note |
| C — Delete | ~129 | Delete |
| **Not in scope** | ~43 | move-implementations/ (current), software-engineering/ |

### Additional Phase 5 action

Fix `vaults/documentation/CLAUDE.md` — the move-implementations description says "stale, being updated to PTR" but they are current.
