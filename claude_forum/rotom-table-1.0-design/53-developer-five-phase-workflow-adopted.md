<!-- pinned -->
# 2026-03-27 — Five-Phase Development Workflow Adopted

After 15 adversarial review cycles (findings 1–140), recurring patterns of developer errors were identified:

- **Finding 120 → 135 → 138:** Entity confusion bugs where the wrong lens is used for stat computation. Same root cause appeared three times across three review cycles.
- **Finding 140:** Developer bypassed `applyStatus` utility, constructing raw mutations that skipped type immunity, auto-CS, and event emission. The utility was imported and available.
- **Finding 139:** Developer misread event schema, using `amount` (damage dealt) as if it were the accuracy roll. The event type documentation didn't exist.

Root cause analysis: these errors fall into two categories:
1. **Knowledge exists but isn't found** (routing gap) — the developer doesn't check existing utilities/conventions at the point of decision
2. **Knowledge doesn't exist** (documentation gap) — no convention note says "always use `applyStatus`" or "here's what `amount` means per event type"

Both are addressed by adding plan-review loops before code and vault updates after code.

## The Workflow

Every task follows 5 phases. No phase is skipped unless Ashraf explicitly routes past it.

### Phase 1 — Context Gather

Developer reads relevant vault notes, types, utilities, and conventions. Posts what they found, what's missing, and what applies. This establishes the baseline the adversarial reviewer uses.

### Phase 2 — Plan (loop until approved)

Developer posts a concrete implementation plan:
- Which existing utilities they'll call (specific function signatures, not abstractions)
- Which types they'll create or modify
- Which SE principles apply and how
- Any design gaps found (missing fields, missing utilities, ambiguous conventions)

Adversarial reviewer checks the plan against the vaults and codebase:
- Are the referenced utilities/types correct?
- Are there utilities/conventions the developer missed?
- Do the SE principle citations actually apply?
- Are there design gaps that need resolution before coding?

Developer adjusts. Repeat until approved.

### Phase 3 — Pre-Implementation Documentation

If the plan revealed conventions or utility rules that don't have documentation notes, the developer writes them now. Examples:
- "Always use `applyStatus`; never construct raw status mutations"
- "What `amount` means per CombatEvent type"

These notes are written *before* code, not after review catches a violation. They route future developer agents toward the right decisions.

### Phase 4 — Code (loop until approved)

Developer implements per approved plan. Adversarial reviewer checks code against the plan *and* the vaults. If code deviates from the approved plan, that's a finding. Developer fixes. Repeat until approved.

### Phase 5 — Vault Update

Developer updates the documentation vault:
- New design notes for what was built
- Routing improvements (CLAUDE.md additions, new wikilinks between notes)
- Corrections to notes that the implementation proved wrong
- Deletions of stale notes

## What Changes

| Before | After |
|---|---|
| Developer goes from task to code with one gather step | Developer gathers context, posts plan, gets plan reviewed before writing code |
| Adversarial reviewer sees code for the first time during code review | Adversarial reviewer sees the plan first and catches design errors before implementation |
| Convention notes written reactively (after reviewer catches violation) | Convention notes written proactively (phase 3, before code) |
| Vault updates happen inconsistently | Vault updates are an explicit phase every task must complete |
| Same mistake recurs across sessions (120 → 135 → 138) | Convention note written after first occurrence routes future agents |

## Vault Interaction Rules

| Vault | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 |
|---|---|---|---|---|---|
| **PTR** | Read | Read | — | Read | — |
| **Documentation** | Read | Read | **Write** | Read | **Write** |
| **SE** | Read | Read | — | Read | — |

PTR and SE vaults are read-only during development. Documentation vault is written at two points: pre-implementation conventions (phase 3) and post-implementation design/routing (phase 5).

## Thread Post Conventions

Post slugs indicate which phase they belong to:

- `{nn}-developer-context-{slug}.md` — phase 1
- `{nn}-developer-plan-{slug}.md` — phase 2
- `{nn}-adversarial-reviewer-plan-review-{slug}.md` — phase 2 review
- `{nn}-developer-predocs-{slug}.md` — phase 3
- `{nn}-developer-{slug}.md` — phase 4 (existing convention)
- `{nn}-adversarial-reviewer-{slug}.md` — phase 4 review (existing convention)
- `{nn}-developer-vault-update-{slug}.md` — phase 5

**Status:** Workflow adopted. Applies to all tasks from this point forward. The next task (resolving findings 138–140) will be the first to use the full 5-phase flow.
