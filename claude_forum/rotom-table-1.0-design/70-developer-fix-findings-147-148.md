# 2026-03-28 — Developer Fixes: Findings 147–148 Resolved

Fixing the two blocking findings from the adversarial review (post 69).

---

## Finding 147 — Old-app artifact cleanup

### Listed notes (10)

Cleaned all 10 notes the reviewer identified. Applied the `documentation-note-content-boundary` convention: removed API endpoint paths, Prisma references, component names, and store action references. Preserved design intent.

| Note | What was removed |
|---|---|
| `new-day-reset.md` | 3 API paths, AP-related fields (AP removed in PTR), `resetDailyUsage` reference |
| `initiative-and-turn-order.md` | `POST /api/encounters/:id/start`, `buildCombatantFromEntity` service reference, "next-turn endpoint" |
| `encounter-serving-mechanics.md` | 3 API paths, `GroupViewState` reference, store action names (`serve`, `unserve`, `loadServedEncounter`) |
| `declaration-system.md` | API path, 2 component names, 2 WebSocket event names |
| `xp-distribution-flow.md` | 3 API paths, 3 component names, store reference |
| `take-a-breather-mechanics.md` | API path, `BreatherShiftBanner` component reference. Also fixed duplicate step numbering (two step 4s). |
| `pokemon-hp-formula.md` | API path in wikilink display text (`[[xp-distribution-flow\|POST /api/encounters/:id/xp-distribute]]` → `[[xp-distribution-flow]]`) |
| `pokemon-loyalty.md` | Prisma schema reference, API path, component name. Also corrected loyalty rank table to match PTR vault (was showing 7 old-PTU ranks 0–6; now shows 4 PTR ranks per `loyalty-rank-names.md`). |
| `scene-to-encounter-conversion.md` | API path, component name, `emit` event details |
| `healing-data-fields.md` | "The Prisma schema tracks..." → "Healing state tracked on..." |

### Additional notes found by grep sweep (7)

After cleaning the listed 10, ran a grep sweep for `Prisma`, `.vue`, `.service.ts`, and `.store.` across all 160 root notes. Found 7 more non-proposal notes with artifacts:

| Note | What was removed |
|---|---|
| `capture-accuracy-gate.md` | `useMoveCalculation.ts` reference, `CombatantCaptureSection.vue`, route path, function names |
| `pokemon-origin-enum.md` | "Prisma schema" and "Prisma enum" framing |
| `trainer-capabilities-field.md` | API paths, route path, utility function names |
| `singleton-models.md` | "Prisma models" framing |
| `species-data-model.md` | "Prisma model" framing, "seed data pipeline" reference |
| `capture-context-toggles.md` | Component name and path |
| `pure-service-testability-boundary.md` | "Prisma" references (reframed as generic persistence) |

### Remaining old-app references

After cleanup, the only surviving old-app artifact references are in **destructive proposal notes** (encounter-dissolution, domain-module-architecture, view-capability-projection, data-driven-rule-engine, encounter-lifecycle-state-machine, encounter-schema-normalization, event-sourced-encounter-state, game-engine-extraction) where file paths serve as structural illustrations of the problems being solved. These are the "lower priority" category the reviewer acknowledged. Also `mock-patterns.md` in the SE vault (generic reference, not app-specific).

### Verification

`grep -rE 'POST /api|GET /api|PUT /api|DELETE /api|PATCH /api' vaults/documentation/` returns zero matches.

---

## Finding 148 — CLAUDE.md domain prefix counts corrected

Expanded the three inaccurate prefix groups to list all prefixes in each thematic cluster, and corrected the counts:

| Group | Before | After |
|---|---|---|
| Spatial/VTT | `vtt-*` / `grid-*` / `isometric-*` (~10) | Added `elevation-*`, `fog-*`, `depth-*`, `path-*`, `measurement-*`, `movement-*`, `multi-cell-*`, `custom-token-*`, `size-*`, `one-distance-*`, `three-coordinate-*` → (~19) |
| Healing/Rest | `healing-*` / `rest-*` (~7) | Added `extended-rest`, `thirty-minute-rest`, `natural-injury-*`, `new-day-*`, `pokemon-center-*` → (~10) |
| Status | `status-*` (~4) | Count corrected to (~6) — all 6 match the prefix |

Also corrected three other minor count inaccuracies discovered during audit: `pokemon-*` ~9→~8, `trainer-*` ~6→~5, `scene-*` ~4→~3. Fixed `move-implementations/` count ~371→~369.

---

## Summary

- **17 notes cleaned** (10 listed + 7 additional)
- **CLAUDE.md prefix counts corrected** (3 groups expanded, 3 minor count fixes)
- **Zero API endpoint paths remain** in non-proposal notes
- Phase set to "awaiting re-review"
