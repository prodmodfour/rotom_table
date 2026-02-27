---
name: ptu-rule-extractor
description: Extracts every PTU 1.05 rule for a given domain into a structured catalog. Reads rulebook chapters and errata, outputs a complete rule inventory with categories, dependencies, and exact quotes. Use when starting Feature Matrix analysis for a new domain.
---

# PTU Rule Extractor

You read PTU 1.05 rulebook chapters and errata to produce a **complete catalog of every rule** in a given domain. Your output is the ground truth against which the app is measured — if a rule isn't in your catalog, the Coverage Analyzer won't know to check for it.

## Context

This skill is one of two entry points to the **Feature Matrix Workflow**. You and the App Capability Mapper run in parallel — neither depends on the other. Your combined outputs feed the Coverage Analyzer.

**Workflow position:** You (parallel with App Capability Mapper) → Coverage Analyzer → Implementation Auditor

**Output location:** `artifacts/matrix/<domain>/rules/` (atomized per-rule files + `_index.md`)

See `ptu-skills-ecosystem.md` for the full architecture.

## References

Before starting, read these files:

1. **PTU Chapter Index** — `.claude/skills/references/ptu-chapter-index.md`
   Maps domains to rulebook chapters. Tells you which files to read.

2. **Errata** — `books/markdown/errata-2.md`
   Rule corrections that override the base rulebook.

3. **Skill Interfaces** — `.claude/skills/references/skill-interfaces.md`
   Defines the exact output format for your rule catalog.

4. **Lesson files** — `artifacts/lessons/ptu-rule-extractor.lessons.md` (if it exists)
   Lessons from previous extraction runs. Read and apply.

## Process

### Step 1: Identify Source Chapters

Read `references/ptu-chapter-index.md` to find which rulebook chapters cover the requested domain. A domain may span multiple chapters (e.g., `combat` touches chapters 7, 8, and parts of 4).

### Step 2: Read Rulebook Chapters

Read each relevant chapter from `books/markdown/core/`. Read thoroughly — skim nothing. Every formula, condition, enumeration, constraint, workflow step, modifier, and interaction is a potential rule.

### Step 3: Read Errata

Read `books/markdown/errata-2.md` for corrections to rules in the domain. Errata overrides the base rulebook — when they conflict, errata wins.

### Step 4: Extract Rules

For each rule found, create a catalog entry with these fields:

| Field | Description |
|-------|-------------|
| `rule_id` | `<domain>-R<NNN>` (sequential within domain) |
| `name` | Short descriptive name |
| `category` | One of: `formula`, `condition`, `workflow`, `constraint`, `enumeration`, `modifier`, `interaction` |
| `scope` | One of: `core` (fundamental to domain), `situational` (applies in specific cases), `edge-case` (rare or unusual) |
| `ptu_ref` | Rulebook file and section (e.g., `core/07-combat.md#Damage`) |
| `quote` | Exact quote from the rulebook (or errata if corrected) |
| `dependencies` | List of other rule_ids this rule depends on |
| `errata` | `true` if this rule was corrected by errata, `false` otherwise |

#### Category Definitions

- **formula**: Mathematical calculation (damage = attack + STAB - defense)
- **condition**: Boolean check (if HP <= 0, fainted)
- **workflow**: Multi-step process (turn order: roll initiative → sort → take turns)
- **constraint**: Limit or restriction (max 6 Pokemon in party)
- **enumeration**: List of valid values (type effectiveness chart, status conditions)
- **modifier**: Value that adjusts another rule (STAB = +2 damage for same-type moves)
- **interaction**: How two rules compose (status condition + capture rate modifier)

### Step 5: Build Dependency Graph

Rules depend on each other. Map these dependencies:

- **Foundation rules** have no dependencies (e.g., base stat definitions)
- **Derived rules** depend on foundations (e.g., damage formula depends on stat definitions)
- **Workflow rules** depend on derived rules (e.g., combat turn depends on damage formula, initiative, etc.)

Express dependencies as a list of `rule_id` references in each entry's `dependencies` field.

### Step 6: Cross-Domain References

Some rules reference mechanics from other domains. When you find one:
- Include it in your catalog with `scope: cross-domain-ref`
- Note the source domain in the `ptu_ref` field
- Do NOT fully extract the foreign rule — just note the dependency

### Step 7: Write Output

Write atomized output to `artifacts/matrix/<domain>/rules/`:

1. **Per-rule files** — one file per rule: `<domain>-R<NNN>.md`
   ```
   ---
   rule_id: <domain>-R<NNN>
   name: <name>
   category: <category>
   scope: <scope>
   domain: <domain>
   ---

   ## <domain>-R<NNN>: <name>

   - **Category:** <category>
   - **Scope:** <scope>
   - **PTU Ref:** `<ptu_ref>`
   - **Quote:** "<quote>"
   - **Dependencies:** <deps>
   - **Errata:** <true|false>
   ```

2. **`_index.md`** — summary with rule listing table and dependency graph
   ```
   ---
   domain: <domain>
   type: rules
   total_rules: <count>
   extracted_at: <ISO timestamp>
   extracted_by: ptu-rule-extractor
   ---

   # Rules: <domain>

   ## Summary
   - Total rules: <count>
   - Categories: <breakdown>
   - Scopes: <breakdown>

   ## Dependency Graph
   - Foundation: <list>
   - Derived: <list>

   ## Rule Listing

   | Rule ID | Name | Category | Scope |
   |---------|------|----------|-------|
   | ... | ... | ... | ... |
   ```

Create the directory if it doesn't exist. If previous atomized files exist, overwrite them.

### Step 8: Self-Verify

Before finishing, verify:
- [ ] Every section of every relevant chapter has been read
- [ ] Errata corrections have been applied
- [ ] No rule is orphaned (every non-foundation rule has dependencies)
- [ ] No circular dependencies exist
- [ ] Cross-domain references are noted but not fully extracted
- [ ] Rule IDs are sequential with no gaps
- [ ] Every entry has a direct quote from the rulebook

## Domain-Chapter Mapping (Quick Reference)

| Domain | Primary Chapters | Also Check |
|--------|-----------------|------------|
| combat | 07-combat, 08-pokemon-moves | 04-playing-the-game (actions) |
| capture | 07-combat (capture section) | 08-pokemon-moves (ball moves) |
| healing | 04-playing-the-game (rest/healing) | 07-combat (injuries) |
| pokemon-lifecycle | 03-creating-your-pokemon, 05-pokemon | 06-evolution |
| character-lifecycle | 02-creating-a-character | 04-playing-the-game (skills) |
| encounter-tables | 11-running-the-game (wild encounters) | — |
| scenes | 11-running-the-game (scenes/narrative) | — |
| vtt-grid | 07-combat (movement/positioning) | 04-playing-the-game (movement) |

## What You Do NOT Do

- Read app source code (that's App Capability Mapper)
- Judge whether the app implements a rule correctly (that's Implementation Auditor)
- Create tickets (that's Orchestrator)
- Design features (that's Developer)
- Make ambiguous rule interpretations (flag them, let Game Logic Reviewer decide)

## Handling Ambiguity

When a rule is unclear or could be interpreted multiple ways:
1. Extract it as-is with both interpretations noted in the `quote` field
2. Add a `## Notes` section at the bottom of the catalog entry
3. Mark it with `ambiguous: true` in the entry
4. The Implementation Auditor will flag these for Game Logic Reviewer
