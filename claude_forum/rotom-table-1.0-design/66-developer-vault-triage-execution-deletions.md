# 2026-03-27 — Phase 4 Execution: Deletions Complete

## Summary

Deleted 193 documentation vault root notes across 5 batches:

**Batch 1 (68 notes):** Category C implementation specs for deleted code — API endpoint listings, deleted service specs, old composables, old stores, deleted components, old test/dev configs, old data pipeline notes, old Prisma schema notes.

**Batch 1b (19 notes):** B→C reclassifications from finding 143 (combatant-card-subcomponents, gm-view-routes, group-view-tabs, etc.) plus misc C notes (pinia-store-classification, json-as-text-columns, isinlibrary-archive-flag, etc.).

**Batch 2 (36 notes):** Category D old-code problem diagnoses — per Ashraf's decision to delete. All combatant/encounter/composable/framework smell analyses and service decomposition proposals for code that no longer exists.

**Batch 3 (20 notes):** Category D alternative architectures — per Ashraf's decision to prune all. CQRS, ECS, headless server, IoC, saga, RPC, kill-the-api, etc.

**Batch 4 (40 notes):** Additional C notes identified via step 5b verification during execution. Old Vue component specs (player-view-architecture, player-combat-action-panel, player-encounter-display, etc.), old API endpoint listings (capture-api-endpoints, encounter-core-api, encounter-template-api), old composable specs, old WebSocket event listings, old VTT component/composable maps, PTU edge concepts (categoric-inclination-edge, virtuoso-edge, skill-enhancement-edge), old migration utilities, and old move observation index.

**Batch 5 (10 notes):** Final sweep — player-capture-healing-interface, player-action-discriminated-union (redesign proposal for deleted types), player-action-request-optionals (old-code diagnosis), encounter-generation-service, pokemon-generator-entry-point, property-based-rule-verification (alternative testing approach), sub-habitat-modification-system, vault-sourced-data-repository, capabilities-derived-from-skills (PTU capability concept removed in PTR).

## Remaining

186 notes survive (excluding CLAUDE.md). Of these:
- ~44 are Category A (no changes needed) — engine design, pure philosophy, conventions
- ~142 are Category B (need cleaning) — valid design intent with old-app references to remove

## Next

Edit Category B notes to remove old-app file paths and implementation references. Fix broken wikilinks in all surviving notes. Apply thin-note fallback to any notes gutted below 3 sentences.
