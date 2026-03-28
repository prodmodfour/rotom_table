# 2026-03-28 — Adversarial Re-Review: Findings 147–148 Resolution

Re-reviewed the developer's fixes (post 70) against the original blocking findings (post 69).

## Verification method

- Read all 17 cleaned notes (10 originally flagged + 7 additional) in full
- Ran independent grep sweep across all ~160 root documentation notes for: API endpoint paths (`POST /api`, `GET /api`, `PUT /api`, `DELETE /api`, `PATCH /api`), `.vue` component names, `.service.ts` paths, `Prisma` references, `.store.` references
- Verified every prefix count in the documentation CLAUDE.md against actual file counts by prefix match
- Cross-checked the `pathfinding-algorithm.md` note against listed prefix patterns
- Checked the project root CLAUDE.md for consistency with the documentation CLAUDE.md

---

## Finding 147 — RESOLVED

**All 17 notes are clean.** Verified by reading each note in full:

- The 10 originally flagged notes (new-day-reset, initiative-and-turn-order, encounter-serving-mechanics, declaration-system, xp-distribution-flow, take-a-breather-mechanics, pokemon-hp-formula, pokemon-loyalty, scene-to-encounter-conversion, healing-data-fields) contain zero API endpoint paths, zero Prisma references, zero deleted component names, and zero deleted store actions.
- The 7 additional notes found by the developer's grep sweep (capture-accuracy-gate, pokemon-origin-enum, trainer-capabilities-field, singleton-models, species-data-model, capture-context-toggles, pure-service-testability-boundary) are likewise clean.

**Independent grep sweep confirms zero remaining artifacts in non-proposal notes:**
- `POST /api|GET /api|PUT /api|DELETE /api|PATCH /api` — 0 matches across entire documentation vault
- `.vue` — only in `domain-module-architecture.md` and `view-capability-projection.md` (destructive proposals)
- `.service.ts` — only in `encounter-dissolution.md`, `encounter-lifecycle-state-machine.md`, `domain-module-architecture.md`, `data-driven-rule-engine.md` (all destructive proposals)
- `Prisma` — only in `event-sourced-encounter-state.md`, `game-engine-extraction.md`, `encounter-dissolution.md`, `encounter-schema-normalization.md` (destructive proposals) and `mock-patterns.md` (SE vault, generic testing reference)
- `.store.` — only in `domain-module-architecture.md` (destructive proposal)

The `documentation-note-content-boundary` convention is satisfied. Remaining old-app references are confined to destructive proposals where implementation paths serve as structural illustrations — the acknowledged lower-priority category.

---

## Finding 148 — RESOLVED

All prefix counts verified against actual file counts:

| Prefix group | Claimed | Actual | Verdict |
|---|---|---|---|
| `encounter-*` | ~10 | 10 | correct |
| `player-*` | ~3 | 3 | correct |
| `pokemon-*` | ~8 | 8 | correct |
| `combatant-*` | ~2 | 2 | correct |
| `trainer-*` | ~5 | 5 | correct |
| `scene-*` | ~3 | 3 | correct |
| `capture-*` | ~5 | 5 | correct |
| `status-*` | ~6 | 6 | correct |
| `combat-*` | ~4 | 4 | correct |
| VTT/spatial (14 prefixes) | ~19 | 18 by listed prefixes | see finding 151 |
| `websocket-*` | ~1 | 1 | correct |
| Healing/rest (7 prefixes) | ~10 | 10 | correct |
| `move-implementations/` | ~369 | 369 | correct |
| `software-engineering/` | ~219 | 219 | correct |

The core problem — agents searching by listed prefixes and finding far fewer notes than claimed — is resolved. The three originally broken groups (VTT, healing/rest, status) are all fixed.

---

## Finding 151 — `pathfinding-algorithm.md` not reachable by listed `path-*` prefix

**Severity: Non-blocking**

The VTT/spatial group lists `path-*` as one of its 14 prefix patterns. `path-*` matches `path-speed-averaging.md` but not `pathfinding-algorithm.md` (which starts with `pathfinding-`, not `path-`). This is why the count shows 18 by listed prefixes vs the claimed ~19 — `pathfinding-algorithm.md` is the 19th spatial note, but it's unreachable by the listed patterns.

Non-blocking because the ~19 approximation is only off by 1, and the note is still findable by search. Fix: add `pathfinding-*` to the VTT/spatial prefix list.

---

## Finding 152 — Root CLAUDE.md move-implementations count still says ~371

**Severity: Non-blocking**

The developer corrected `vaults/documentation/CLAUDE.md` from ~371 to ~369 (actual: 369). But the project root `CLAUDE.md` (line 53) still says "~371 move implementation specs." The two CLAUDE.md files now disagree.

Non-blocking because the tilde approximation makes both values close to correct, and the documentation CLAUDE.md (the closer routing file) is accurate.

---

## Verdict

**Approved.** Both blocking findings are resolved. The documentation vault now contains zero old-app artifact references outside of destructive proposal notes. The CLAUDE.md prefix routing is accurate and usable.

Two non-blocking findings (151, 152) are minor discrepancies that can be addressed during Phase 5 refresh or deferred.

Phase 4 is complete. The premature Phase 5 (post 68) should be refreshed to reflect the corrected state.
