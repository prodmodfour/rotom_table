# 2026-03-27 — Vault Update: Findings 138–140

Phase 5 complete. Documentation vault updated with corrections and backlinks.

## Finding 141 resolved — `utility-self-targeting-convention.md` scope corrected

The note previously claimed all 5 listed utilities treat `undefined` and `'self'` as equivalent. Code tracing in the adversarial review (post 58) showed only `healHP` implements this — the other 7 utilities default `undefined` to `ctx.target` (opponent).

**Rewrote the note** to document two distinct categories:

- **Self-benefit utilities** (`healHP`): `undefined` defaults to `ctx.user` — `'self'` and `undefined` are equivalent
- **Opponent-targeting utilities** (7 others): `undefined` defaults to `ctx.target` — `'self'` explicitly overrides to target user

Added a table for each category listing every utility and its default target with rationale. The bug pattern and fix pattern sections remain unchanged — they correctly describe the `healHP`-specific invariant.

## Backlinks added

Per Zettelkasten bidirectional linking:

| Note | Backlink added |
|---|---|
| `combat-event-log-schema.md` | `→ trigger-event-field-semantics` |
| `status-cs-auto-apply-with-tracking.md` | `→ status-application-must-use-applyStatus` |
| `effect-trigger-event-bus.md` | `→ trigger-event-field-semantics` |

## Backlink text corrected

| Note | Old text | New text |
|---|---|---|
| `effect-utility-catalog.md` | "convention: `undefined` and `'self'` are equivalent in target params" | "convention: self-benefit utilities (e.g. `healHP`) treat `undefined` as `'self'`; opponent-targeting utilities default to `ctx.target`" |

## Notes reviewed — no deletions needed

The three Phase 3 convention notes (`status-application-must-use-applyStatus.md`, `trigger-event-field-semantics.md`, `utility-self-targeting-convention.md`) remain valid after implementation. No stale notes to delete.

## Summary of all vault changes (Phase 3 + Phase 5)

| Note | Phase | Action |
|---|---|---|
| `status-application-must-use-applyStatus.md` | 3 | Created |
| `trigger-event-field-semantics.md` | 3 | Created |
| `utility-self-targeting-convention.md` | 3 | Created |
| `effect-utility-catalog.md` | 3+5 | Backlinks added (3), backlink text corrected (5) |
| `effect-handler-contract.md` | 3 | Backlinks added |
| `utility-self-targeting-convention.md` | 5 | Scope corrected per finding 141 |
| `combat-event-log-schema.md` | 5 | Backlink added |
| `status-cs-auto-apply-with-tracking.md` | 5 | Backlink added |
| `effect-trigger-event-bus.md` | 5 | Backlink added |

**Task complete.** Findings 138–140 fully resolved through all 5 phases. Finding 141 resolved in this phase.
