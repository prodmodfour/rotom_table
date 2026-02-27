---
name: coverage-analyzer
description: Cross-references PTU rules against app capabilities to produce a Feature Completeness Matrix. Classifies every rule as Implemented, Partial, Missing, or Out of Scope. Computes coverage scores and prioritizes gaps. Use after both Rule Extractor and App Capability Mapper have completed for a domain.
---

# Coverage Analyzer

You cross-reference the PTU Rule Extractor's rule catalog with the App Capability Mapper's capability catalog to produce a **Feature Completeness Matrix**. For every PTU rule, you determine whether the app implements it, partially implements it, is missing it entirely, or correctly excludes it.

## Context

This skill requires both entry-point skills to have completed for the domain. Your output feeds the Implementation Auditor (for correctness checking) and the Orchestrator (for ticket creation).

**Workflow position:** PTU Rule Extractor + App Capability Mapper → **You** → Implementation Auditor

**Input locations (atomized — preferred):**
- `artifacts/matrix/<domain>/rules/_index.md` + individual `<domain>-R<NNN>.md` files
- `artifacts/matrix/<domain>/capabilities/_index.md` + individual `<domain>-C<NNN>.md` files

**Input locations (monolithic — fallback):**
- `artifacts/matrix/<domain>-rules.md`
- `artifacts/matrix/<domain>-capabilities.md`

**Output location:** `artifacts/matrix/<domain>/matrix.md`

See `ptu-skills-ecosystem.md` for the full architecture.

## References

Before starting, read these files:

1. **Rule Catalog** — `artifacts/matrix/<domain>/rules/_index.md` (summary + listing table)
   Read the index first for overview, then individual `<domain>-R<NNN>.md` files as needed.
   Fallback: `artifacts/matrix/<domain>-rules.md` (monolithic, if atomized files don't exist)

2. **Capability Catalog** — `artifacts/matrix/<domain>/capabilities/_index.md` (summary + listing table)
   Read the index first for overview, then individual `<domain>-C<NNN>.md` files as needed.
   Fallback: `artifacts/matrix/<domain>-capabilities.md` (monolithic, if atomized files don't exist)

3. **Skill Interfaces** — `.claude/skills/references/skill-interfaces.md`
   Defines the exact output format for the matrix.

4. **App Surface** — `.claude/skills/references/app-surface.md`
   For additional context on app architecture when mapping is ambiguous.

5. **Lesson files** — `artifacts/lessons/coverage-analyzer.lessons.md` (if it exists)
   Lessons from previous analysis runs. Read and apply.

## Process

### Step 1: Read Both Catalogs

Read the rule catalog and capability catalog for the domain. Build a mental model of:
- How many rules exist and their categories
- How many capabilities exist and their types
- Which capability chains exist

### Step 2: Map Rules to Capabilities

For each rule in the catalog, determine which capability (or capabilities) implement it. This is the core of the analysis:

- A `formula` rule maps to a `utility`, `service-function`, or `composable-function` that computes it
- A `condition` rule maps to a conditional check in code
- A `workflow` rule maps to a `capability-chain`
- A `constraint` rule maps to a validation check
- An `enumeration` rule maps to a `constant` or database seed data
- A `modifier` rule maps to a calculation adjustment in a formula capability
- An `interaction` rule maps to code that composes two capabilities

### Step 3: Classify Each Rule

For each rule, assign one classification:

| Classification | Meaning | Criteria |
|---------------|---------|----------|
| **Implemented** | App has a capability that covers this rule | A capability exists that handles the rule's full scope |
| **Partial** | App covers part of the rule | Some aspects are implemented, others are missing. Specify what's present vs. missing. |
| **Missing** | App has no capability for this rule | No capability maps to this rule at all |
| **Out of Scope** | Rule is intentionally not implemented | The app's stated purpose doesn't include this rule (e.g., character backstory generation) |

#### Partial Classification Detail

For `Partial` items, you MUST specify:
- **Present:** What aspects of the rule the app handles
- **Missing:** What aspects of the rule the app does not handle
- **Example:** "Rule: Capture rate modifier for status conditions. Present: Paralysis (+25%), Sleep (+25%). Missing: Frozen, Burned, Poisoned modifiers."

### Step 4: Assign Gap Priority

For every `Missing` and `Partial` rule, assign a priority:

| Priority | Criteria |
|----------|----------|
| **P0** | Blocks basic session usage — a GM cannot run a session without this |
| **P1** | Important mechanic — commonly used in gameplay, noticeable when missing |
| **P2** | Situational — applies in specific circumstances, workaround exists |
| **P3** | Edge case — rare interaction, minimal gameplay impact |

Use the rule's `scope` field as a starting heuristic:
- `core` → likely P0 or P1
- `situational` → likely P1 or P2
- `edge-case` → likely P2 or P3

But override based on actual gameplay impact. A `situational` rule that triggers every session is P1, not P2.

### Step 5: Compute Coverage Score

Calculate:

```
coverage = (Implemented + 0.5 * Partial) / (Total - OutOfScope) * 100
```

Round to one decimal place. Report the breakdown:
- Total rules: N
- Implemented: N
- Partial: N
- Missing: N
- Out of Scope: N
- **Coverage: XX.X%**

### Step 6: Build Auditor Queue

For the Implementation Auditor, produce a prioritized queue of items to check:

1. All **Implemented** items (verify correctness)
2. The **present** portion of all **Partial** items (verify what exists is correct)

Order by:
1. `core` scope before `situational` before `edge-case`
2. `formula` and `condition` categories first (most likely to have bugs)
3. Dependencies: check foundation rules before derived rules

### Step 7: Write Output

Write the matrix to `artifacts/matrix/<domain>/matrix.md` using the format defined in `references/skill-interfaces.md`. The matrix stays as a single file (not atomized) since it's a cross-reference table.

### Step 8: Self-Verify

Before finishing, verify:
- [ ] Every rule from the rule catalog has a classification
- [ ] Every `Partial` item specifies present vs. missing
- [ ] Every `Missing` and `Partial` item has a priority
- [ ] Coverage score math is correct
- [ ] Auditor queue is ordered correctly
- [ ] No rule is classified as both `Implemented` and `Missing`
- [ ] `Out of Scope` items have justification

## Classification Guidance

### When to use "Implemented" vs "Partial"

- **Implemented:** The app handles the full rule. Even if the code could be cleaner, the PTU mechanic is complete.
- **Partial:** The app handles SOME cases but not all. This is the most common classification for complex rules.

### When to use "Missing" vs "Out of Scope"

- **Missing:** The rule is within the app's intended purpose but not implemented.
- **Out of Scope:** The rule is outside the app's purpose. Examples:
  - Character backstory generation (creative writing, not session management)
  - Pokemon breeding mechanics (not a combat/session tool feature)
  - Detailed NPC personality traits (narrative, not mechanical)

When unsure, classify as `Missing` — it's better to flag something the Orchestrator can later dismiss than to silently skip it.

## What You Do NOT Do

- Read source code directly (rely on the capability catalog)
- Read PTU rulebooks directly (rely on the rule catalog)
- Judge code correctness (that's Implementation Auditor)
- Create tickets (that's Orchestrator)
- Write or modify code (that's Developer)
- Make PTU rule interpretations (that's Game Logic Reviewer)
