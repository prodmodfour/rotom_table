---
id: docs-010
title: "Add CLAUDE.md for decrees/"
priority: P0
severity: MEDIUM
status: open
domain: workflow
source: plan-descendant-claude-md-rollout
created_by: user
created_at: 2026-03-02
phase: 3
affected_files:
  - decrees/CLAUDE.md (new)
---

# docs-010: Add CLAUDE.md for decrees/

## Summary

Create a descendant CLAUDE.md in `decrees/` to document the decree format, authority level, referencing convention, and domain distribution. Decrees are the highest authority in the project — they override PTU book text, errata, and all skill-level rulings. Agents must understand this authority chain and how to reference decrees in code and specs.

## Target File

`decrees/CLAUDE.md` (~40 lines)

## Required Content

### What Are Decrees
Binding human rulings on ambiguous design decisions. When a PTU rule is unclear or has multiple valid interpretations, skills create `decree-need` tickets. The human runs `/address_design_decrees` to make rulings, which are recorded as decree files.

### Authority Level
**Decrees are the HIGHEST authority in the project.** They override:
1. PTU book text (core chapters)
2. PTU errata (errata-2.md)
3. All skill-level rulings and assumptions

Violations in code reviews are **CRITICAL severity** — reviewers must check relevant decrees before approving any code.

### Decree Format
Each decree file (`decree-NNN.md`) has:

**YAML Frontmatter:**
- `decree_id`, `status` (active/superseded), `domain`, `topic`, `title`
- `ruled_at`, `supersedes`, `superseded_by`
- `source_ticket` (the decree-need that prompted it)
- `implementation_tickets`, `tags`

**Body (5 sections):**
1. **The Ambiguity** — What's unclear, with source ticket citation
2. **Options Considered** — 2-3 lettered options (A, B, C) with pros/cons
3. **Ruling** — Starts with "**The true master decrees:**" followed by chosen option + implementation guidance
4. **Precedent** — Generalizable principle for future similar cases
5. **Implementation Impact** — Tickets created, files affected, skills that should cite this decree

### How to Reference Decrees
- **In code**: `// per decree-012: enforce type immunity server-side`
- **In type definitions**: Comments near affected types (e.g., `StageSource` cites decree-005)
- **In design specs**: `decree: decree-002, decree-003` in _index.md frontmatter
- **In tickets**: `source: decree-005` linking back to originating decree

### Domain Distribution (40 decrees, all active)
| Domain | Count | Example Topics |
|--------|-------|---------------|
| combat | 14 | minimum damage floor, stage sources, tick damage timing, switching |
| vtt / vtt-grid | 10 | burst shape, cone width, terrain costs, token blocking, diagonal lines |
| rest | 6 | move refresh, AP restoration, injury healing |
| capture | 3 | ball modifiers, capture linking |
| character-lifecycle | 3 | trainer XP, level-up flow |
| pokemon-lifecycle | 2 | evolution, base relations |
| encounter | 2 | significance tiers, XP capping |

### Current State
40 decrees total (`decree-001.md` through `decree-040.md`), all with `status: active`, none superseded. Index at `_index.md`.

## Verification

- File is 30-80 lines
- Authority chain matches CLAUDE.md root description
- Format verified against 3+ sample decrees (decree-001, decree-020, decree-040)
- Domain distribution verified against _index.md table
