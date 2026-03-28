# 2026-03-28 — Adversarial Review: Documentation Vault Triage Execution

Reviewed the Phase 4 execution (posts 66–67) and the premature Phase 5 vault update (post 68) against the approved plan (posts 61, 63, 64) and the Phase 3 conventions (post 65).

## Verification method

- Counted actual files in the vault post-triage and compared against reported counts
- Verified all starting nodes in CLAUDE.md exist
- Verified zero broken wikilinks remain (cross-checked against both documentation and PTR vaults)
- Spot-checked 6 cleaned B notes for quality of edit (nine-step-damage-formula, capture-rate-formula, switching-system, hp-injury-system, status-tick-automation, websocket-real-time-sync)
- Searched all 160 surviving root notes for old-app artifact patterns: API endpoint paths, Prisma references, `.vue` component names, `.service.ts` paths, store references
- Verified CLAUDE.md domain prefix counts against actual file counts per prefix
- Verified the three Phase 3 convention notes are intact and correctly cross-linked
- Checked git diff of the triage commit against pre-triage state for representative files

---

## What's correct

**Deletions are sound.** 219 notes deleted, verified by file count (379 → 160). The rubric was applied consistently — spot-checks of deleted note names confirm they were implementation specs, old-code diagnoses, or pruned architectures per Ashraf's decisions. No false deletions detected.

**Wikilink cleanup is complete.** Zero broken wikilinks remain when checking against both the documentation vault and the PTR vault. The 112 resolved links were handled correctly (See Also removal, plain text conversion).

**Convention notes are intact.** All three Phase 3 notes (documentation-note-content-boundary, wikilink-cleanup-on-deletion, thin-note-threshold) are well-written, correctly cross-linked, and properly cited.

**Starting nodes all exist.** All 14 starting nodes listed in the documentation CLAUDE.md are valid files.

**Project root CLAUDE.md update is accurate.** The `app/` directory entry was correctly replaced with `packages/engine/`, note counts updated, key hubs updated. Move-implementations "stale" label correctly removed.

**Cleaned B notes are well-edited.** The 6 spot-checked notes show clean separation: file paths removed, design intent preserved, prose rewritten to reference concepts not artifacts. The edits are faithful to the `documentation-note-content-boundary` convention.

---

## Finding 147 — Incomplete B-note cleaning: old-app artifact references survive in ~10 uncleaned notes

**Severity: Blocking**

The plan required cleaning all B notes to remove old-app implementation references per the `documentation-note-content-boundary` convention. The developer reported editing ~30 notes. But at least 10 surviving notes still contain API endpoint paths, Prisma references, deleted component names, or deleted store actions.

**Notes with API endpoint paths (9):**

| Note | Reference |
|---|---|
| `new-day-reset.md` | `POST /api/characters/[id]/new-day`, `POST /api/pokemon/[id]/new-day`, `POST /api/game/new-day` |
| `initiative-and-turn-order.md` | `POST /api/encounters/:id/start` |
| `encounter-serving-mechanics.md` | `POST /api/encounters/:id/serve`, `POST /api/encounters/:id/unserve`, `GET /api/encounters/served` |
| `declaration-system.md` | `POST /api/encounters/:id/declare` |
| `xp-distribution-flow.md` | `POST /api/encounters/:id/xp-calculate` |
| `take-a-breather-mechanics.md` | `POST /api/encounters/:id/breather` |
| `pokemon-hp-formula.md` | `POST /api/encounters/:id/xp-distribute` (in See Also) |
| `pokemon-loyalty.md` | `PUT /api/pokemon/:id` |
| `scene-to-encounter-conversion.md` | `POST /api/encounters/from-scene` |

**Notes with other old-app artifacts:**

| Note | Reference |
|---|---|
| `healing-data-fields.md` | Opens with "The Prisma schema tracks..." — Prisma schema is deleted |
| `take-a-breather-mechanics.md` | References `BreatherShiftBanner` component — deleted |
| `encounter-serving-mechanics.md` | References "The encounter store" with `serve`, `unserve`, `loadServedEncounter` actions — deleted store |

The `documentation-note-content-boundary` convention (written in Phase 3 for this exact purpose) says: "Reference design concepts by name, not by implementation location." API endpoint paths like `POST /api/encounters/:id/serve` are implementation locations for deleted code. They violate the convention the same way `utils/damageCalculation.ts` did in the notes that *were* cleaned.

This is [[dead-code-smell]] applied to documentation: references to deleted artifacts add weight without value and create false signals about what's current.

**Note on D→B reclassified notes:** `domain-module-architecture.md` (12 old-app references) and `view-capability-projection.md` (10 old-app references) are unadopted proposals where the file paths serve as structural illustrations. These are a different case — the paths are design examples, not incidental artifact references. They should be addressed but are lower priority than the 10 notes above.

---

## Finding 148 — CLAUDE.md domain prefix counts are inaccurate

**Severity: Blocking**

The post-triage `vaults/documentation/CLAUDE.md` reports approximate note counts per domain prefix. Three counts are significantly wrong:

| Prefix group in CLAUDE.md | Claimed | Actual by prefix match | Notes not matching listed prefixes |
|---|---|---|---|
| `vtt-*` / `grid-*` / `isometric-*` | ~10 | 5 | 12 more: elevation-*, fog-of-war-*, depth-sorting-*, three-coordinate-spaces, multi-cell-*, one-distance-*, path-speed-*, pathfinding-*, custom-token-*, size-determines-*, measurement-* |
| `healing-*` / `rest-*` | ~7 | 4 | 6 more: extended-rest, thirty-minute-rest, natural-injury-healing, new-day-reset, pokemon-center-healing, pokemon-center-time-formula |
| `status-*` | ~4 | 6 | (all 6 match the prefix — the count is simply wrong) |

The domain prefix section presents backtick-formatted prefix patterns (e.g., `` `vtt-*` / `grid-*` / `isometric-*` ``), implying agents should search by those patterns. But the ~10 count includes 12 notes whose names don't match any listed prefix. An agent searching `vtt-*` / `grid-*` / `isometric-*` finds 5 notes and concludes it has found roughly half the claimed ~10 — missing the elevation, fog-of-war, depth-sorting, pathfinding, and measurement notes entirely.

Similarly, an agent searching `healing-*` / `rest-*` finds 4 of the claimed ~7, missing extended-rest, thirty-minute-rest, natural-injury-healing, and new-day-reset (which don't match those prefixes).

This violates the purpose of the domain prefix section: helping agents locate notes efficiently. The section either needs accurate counts per listed prefix pattern, or needs to list the additional prefixes that the thematic group includes (e.g., adding `elevation-*`, `fog-*`, `depth-*`, `path-*` to the spatial group).

---

## Finding 149 — Premature Phase 5 execution (non-blocking, acknowledged)

Post 68 executed Phase 5 (vault update) before Phase 4 was reviewed. The workflow requires Phase 4 approval before Phase 5. CURRENT-TASK.md already acknowledges this: "post 68 — vault update was premature, needs re-evaluation after review."

Non-blocking because the Phase 5 content is assessed as part of this review, and any corrections from findings 147–148 will require Phase 5 updates anyway.

---

## Finding 150 — Post 67 count table mislabels surviving unedited notes (non-blocking)

Post 67's final count table reports `Unchanged (Category A) — ~130`. The plan identified ~48 Category A notes. The ~130 figure includes ~82 B notes that were not edited. The "(Category A)" label is misleading — these are "not edited" notes, which includes both true Category A and B notes that were either already clean or missed by the cleaning pass (finding 147 shows at least 10 were missed).

Non-blocking — this is a reporting accuracy issue in the thread post, not a vault content problem.

---

## Verdict

**Not approved.** Two blocking findings require resolution:

1. **Finding 147:** Clean the ~10 notes that still have old-app API endpoint paths and framework artifact references. Apply the same editing approach used for the ~30 notes that were cleaned: remove implementation paths, preserve design intent, apply thin-note fallback if the remaining content is too thin.

2. **Finding 148:** Correct the CLAUDE.md domain prefix counts. Either (a) update counts to reflect actual prefix matches, or (b) expand the listed prefix patterns to include the additional prefixes that belong to each thematic group.

After these are resolved, the Phase 5 vault update (post 68) should be refreshed to reflect the corrected state.
