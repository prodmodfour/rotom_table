# Skill Interfaces

Data contracts between skills in the PTU Skills Ecosystem. All artifacts use markdown with YAML frontmatter. Skills read from the previous stage's directory and write to their own.

## Artifact Directory Layout

```
artifacts/
├── tickets/               # Cross-ecosystem communication
│   ├── bug/               # Orchestrator writes (from audit) → Developer reads
│   ├── ptu-rule/          # Orchestrator/Game Logic Reviewer writes → Developer reads
│   ├── feature/           # Orchestrator writes (from matrix) → Developer reads
│   ├── ux/                # Orchestrator writes (from matrix) → Developer reads
│   └── decree/            # Skills write (ambiguities) → Decree Facilitator reads
├── matrix/                # Feature Matrix workflow artifacts
│   ├── _index.md                  # Cross-domain summary (auto-generated)
│   ├── _archive/                  # Archived monolithic originals
│   └── <domain>/                  # Per-domain subdirectory
│       ├── _index.md              # Domain pipeline summary (auto-generated)
│       ├── rules/                 # PTU Rule Extractor writes
│       │   ├── _index.md          # Rule listing + dependency graph
│       │   └── <domain>-R<NNN>.md # Individual rule files
│       ├── capabilities/          # App Capability Mapper writes
│       │   ├── _index.md          # Capability listing + chains
│       │   └── <domain>-C<NNN>.md # Individual capability files
│       ├── matrix.md              # Coverage Analyzer writes (stays monolithic)
│       ├── audit/                 # Implementation Auditor writes
│       │   ├── _index.md          # Summary + action items
│       │   ├── tier-N-<slug>.md   # Grouped verifications by tier
│       │   └── correct-items.md   # COLD: all verified-correct items
│       └── browser-audit/         # Browser Auditor writes
│           ├── _index.md          # Summary + action items + view file links
│           ├── view-gm.md         # Capabilities verified on /gm/* views
│           ├── view-group.md      # Capabilities verified on /group
│           ├── view-player.md     # Capabilities verified on /player
│           └── untestable-items.md # Server-side only capabilities (COLD)
├── designs/               # Developer writes (atomized per-design dirs)
│   ├── design-NAME/       # Per-design directory
│   │   ├── _index.md      # Frontmatter + summary + tier status
│   │   ├── spec-p0.md     # P0 tier specification
│   │   ├── spec-p1.md     # P1 tier specification
│   │   ├── spec-p2.md     # P2 tier specification
│   │   ├── shared-specs.md # Cross-cutting specs
│   │   ├── testing-strategy.md
│   │   └── implementation-log.md
│   └── _archive/          # Original monolithic files
├── refactoring/           # Code Health Auditor writes
├── reviews/               # Senior Reviewer + Game Logic Reviewer write
│   ├── _index.md          # Active review summary (auto-generated)
│   ├── active/            # Reviews requiring action or pending
│   └── archive/           # APPROVED reviews (organized by YYYY-MM)
├── tickets/               # Cross-ecosystem ticket system
│   ├── open/              # New tickets (bug/, ptu-rule/, feature/, ux/, decree/)
│   ├── in-progress/       # Being worked on
│   └── resolved/          # Completed
├── lessons/               # Retrospective Analyst writes
└── state/                 # Ecosystem state files
    ├── dev-state.md       # Orchestrator writes (sole writer)
    ├── test-state.md      # Orchestrator writes (sole writer)
    └── alive-agents.md    # Slave Collector writes
```

## File Naming Conventions

- Rule catalogs: `matrix/<domain>/rules/<domain>-R<NNN>.md` (atomized) with `_index.md` summary
- Capability catalogs: `matrix/<domain>/capabilities/<domain>-C<NNN>.md` (atomized) with `_index.md` summary
- Coverage matrices: `matrix/<domain>/matrix.md` (single file per domain)
- Implementation audits: `matrix/<domain>/audit/tier-N-<slug>.md` (per-tier) with `_index.md` summary
- Browser audits: `matrix/<domain>/browser-audit/view-<actor>.md` (per-view) with `_index.md` summary
- Tickets: `<type>-<NNN>.md` in `tickets/open/<type>/` (e.g., `tickets/bug/bug-003.md`)
- Designs: `design-<NNN>.md` (e.g., `design-001.md`) — per-prefix counter in `artifacts/designs/`
- Code reviews: `code-review-<NNN>.md` (e.g., `code-review-001.md`) — per-prefix counter in `artifacts/reviews/`
- Rules reviews: `rules-review-<NNN>.md` (e.g., `rules-review-001.md`) — per-prefix counter in `artifacts/reviews/`

---

## 1. Rule Catalog

**Written by:** PTU Rule Extractor
**Read by:** Coverage Analyzer, Implementation Auditor
**Location:** `artifacts/matrix/<domain>/rules/` (atomized: `_index.md` + `<domain>-R<NNN>.md` per rule)

```markdown
---
domain: <domain>
extracted_at: <ISO timestamp>
extracted_by: ptu-rule-extractor
total_rules: <count>
sources:
  - <rulebook-file>
  - ...
errata_applied: true | false
---

# PTU Rules: <Domain Display Name>

## Summary
- Total rules: <count>
- Categories: formula(<N>), condition(<N>), workflow(<N>), constraint(<N>), enumeration(<N>), modifier(<N>), interaction(<N>)
- Scopes: core(<N>), situational(<N>), edge-case(<N>)

## Dependency Graph
<!-- Foundation → Derived → Workflow ordering -->
- Foundation: <rule_id>, <rule_id>, ...
- Derived: <rule_id> (depends on <rule_id>), ...
- Workflow: <rule_id> (depends on <rule_id>, <rule_id>), ...

---

## <domain>-R001: <Rule Name>

- **Category:** formula | condition | workflow | constraint | enumeration | modifier | interaction
- **Scope:** core | situational | edge-case
- **PTU Ref:** `<rulebook-file>#<section>`
- **Quote:** "<exact quote from rulebook or errata>"
- **Dependencies:** <rule_id>, <rule_id> (or "none" for foundation rules)
- **Errata:** true | false

## <domain>-R002: <Rule Name>
...
```

**Constraints:**
- One directory per domain with individual rule files + `_index.md` summary
- Rule IDs are sequential: `<domain>-R001`, `<domain>-R002`, etc.
- Every rule has a direct quote from the rulebook or errata
- Cross-domain references use `scope: cross-domain-ref` and are not fully extracted
- Dependency graph must be acyclic
- Ambiguous rules include a `## Notes` section with multiple interpretations

---

## 2. Capability Catalog

**Written by:** App Capability Mapper
**Read by:** Coverage Analyzer, Implementation Auditor
**Location:** `artifacts/matrix/<domain>/capabilities/` (atomized: `_index.md` + `<domain>-C<NNN>.md` per capability)

```markdown
---
domain: <domain>
mapped_at: <ISO timestamp>
mapped_by: app-capability-mapper
total_capabilities: <count>
files_read: <count>
---

# App Capabilities: <Domain Display Name>

## Summary
- Total capabilities: <count>
- Types: api-endpoint(<N>), service-function(<N>), composable-function(<N>), store-action(<N>), store-getter(<N>), component(<N>), constant(<N>), utility(<N>), websocket-event(<N>), prisma-model(<N>), prisma-field(<N>)
- Orphan capabilities: <count>

---

## <domain>-C001: <Capability Name>

- **Type:** api-endpoint | service-function | composable-function | store-action | store-getter | component | constant | utility | websocket-event | prisma-model | prisma-field
- **Location:** `<file-path>:<function-or-export-name>`
- **Game Concept:** <what PTU concept this relates to>
- **Description:** <1-2 sentences>
- **Inputs:** <parameters, request body fields>
- **Outputs:** <response fields, state changes, UI updates>
- **Orphan:** true | false

## <domain>-C002: <Capability Name>
...

---

## Capability Chains

### Chain 1: <Workflow Name>
1. `<cap_id>` (<type>) → 2. `<cap_id>` (<type>) → ... → N. `<cap_id>` (<type>)
**Breaks at:** <cap_id where chain is incomplete, or "complete">

### Chain 2: ...
```

**Constraints:**
- One directory per domain with individual capability files + `_index.md` summary
- Cap IDs are sequential: `<domain>-C001`, `<domain>-C002`, etc.
- Every capability has a specific `file:function` location from actual source code reading
- Orphan capabilities (not connected to any chain) are flagged
- Capability chains trace full paths from UI to DB

---

## 3. Feature Completeness Matrix

**Written by:** Coverage Analyzer
**Read by:** Implementation Auditor, Orchestrator (ticket creation)
**Location:** `artifacts/matrix/<domain>/matrix.md`

```markdown
---
domain: <domain>
analyzed_at: <ISO timestamp>
analyzed_by: coverage-analyzer
total_rules: <count>
implemented: <count>
partial: <count>
missing: <count>
out_of_scope: <count>
coverage_score: <XX.X>
---

# Feature Completeness Matrix: <Domain Display Name>

## Coverage Score
**<XX.X>%** — (Implemented + 0.5 * Partial) / (Total - OutOfScope) * 100

| Classification | Count |
|---------------|-------|
| Implemented | <N> |
| Partial | <N> |
| Missing | <N> |
| Out of Scope | <N> |
| **Total** | **<N>** |

---

## Implemented Rules

### <domain>-R001: <Rule Name>
- **Classification:** Implemented
- **Mapped to:** `<cap_id>` — `<capability name>` (`<file:function>`)

### <domain>-R002: ...

---

## Partial Rules

### <domain>-R010: <Rule Name>
- **Classification:** Partial
- **Present:** <what aspects are implemented>
- **Missing:** <what aspects are not implemented>
- **Mapped to:** `<cap_id>` — `<capability name>` (`<file:function>`)
- **Gap Priority:** P0 | P1 | P2 | P3

---

## Missing Rules

### <domain>-R020: <Rule Name>
- **Classification:** Missing
- **Gap Priority:** P0 | P1 | P2 | P3
- **Notes:** <why this matters, any partial workarounds>

---

## Out of Scope

### <domain>-R030: <Rule Name>
- **Classification:** Out of Scope
- **Justification:** <why this rule is outside the app's purpose>

---

## Auditor Queue

Ordered list of items for the Implementation Auditor to check:

1. `<domain>-R001` — Implemented — core/formula
2. `<domain>-R002` — Implemented — core/condition
3. `<domain>-R010` — Partial (present portion) — core/workflow
...
```

**Constraints:**
- One file per domain
- Every rule from the rule catalog has exactly one classification
- Partial items MUST specify present vs. missing
- Missing and Partial items MUST have a gap priority (P0-P3)
- Out of Scope items MUST have justification
- Coverage score formula: `(Implemented + 0.5 * Partial) / (Total - OutOfScope) * 100`
- Auditor Queue is ordered: core before situational, formulas/conditions first

---

## 4. Implementation Audit Report

**Written by:** Implementation Auditor
**Read by:** Orchestrator (ticket creation), Game Logic Reviewer (ambiguous items)
**Location:** `artifacts/matrix/<domain>/audit/` (atomized: `_index.md` + `tier-N-<slug>.md` per tier + `correct-items.md`)

```markdown
---
domain: <domain>
audited_at: <ISO timestamp>
audited_by: implementation-auditor
items_audited: <count>
correct: <count>
incorrect: <count>
approximation: <count>
ambiguous: <count>
---

# Implementation Audit: <Domain Display Name>

## Summary

| Classification | Count |
|---------------|-------|
| Correct | <N> |
| Incorrect | <N> |
| Approximation | <N> |
| Ambiguous | <N> |
| **Total** | **<N>** |

### Severity Breakdown (Incorrect + Approximation)
- CRITICAL: <N>
- HIGH: <N>
- MEDIUM: <N>
- LOW: <N>

---

## Correct Items

### <domain>-R001: <Rule Name>
- **Classification:** Correct
- **Code:** `<file>:<line-range>` — `<function name>`
- **Rule:** "<PTU quote>"
- **Verification:** <brief confirmation of why it's correct>

---

## Incorrect Items

### <domain>-R005: <Rule Name>
- **Classification:** Incorrect
- **Severity:** CRITICAL | HIGH | MEDIUM | LOW
- **Code:** `<file>:<line-range>` — `<function name>`
- **Rule:** "<PTU quote>"
- **Expected:** <what the rule requires>
- **Actual:** <what the code does>
- **Evidence:** <specific code behavior with values>

---

## Approximation Items

### <domain>-R012: <Rule Name>
- **Classification:** Approximation
- **Severity:** CRITICAL | HIGH | MEDIUM | LOW
- **Code:** `<file>:<line-range>` — `<function name>`
- **Rule:** "<PTU quote>"
- **Expected:** <full rule behavior>
- **Actual:** <simplified behavior>
- **What's Missing:** <specific simplification>

---

## Ambiguous Items

### <domain>-R018: <Rule Name>
- **Classification:** Ambiguous
- **Code:** `<file>:<line-range>` — `<function name>`
- **Rule:** "<PTU quote>"
- **Interpretation A:** <one reading> → expected behavior X
- **Interpretation B:** <another reading> → expected behavior Y
- **Code follows:** Interpretation <A|B>
- **Action:** Escalate to Game Logic Reviewer

---

## Additional Observations
<!-- Items noticed outside the audit queue -->
```

**Constraints:**
- One directory per domain with per-tier files + `_index.md` summary + `correct-items.md`
- Every item in the Auditor Queue from the matrix has been checked
- Source code and rulebook sections were actually read (not assumed)
- Every Incorrect item has specific `file:line` references
- Every Incorrect item explains expected vs. actual behavior
- Every Ambiguous item documents multiple interpretations
- Severity assignments are consistent across items
- Verified-correct items go to `correct-items.md` (COLD storage, rarely re-read)

---

## 4b. Browser Audit Report

**Written by:** Browser Auditor
**Read by:** Orchestrator (ticket creation), Developer (absent/error items)
**Location:** `artifacts/matrix/<domain>/browser-audit/` (atomized: `_index.md` + per-view files + `untestable-items.md`)

### `_index.md`

```markdown
---
domain: <domain>
type: browser-audit
browser_audited_at: <ISO timestamp>
browser_audited_by: browser-auditor
total_checked: <count>
present: <count>
absent: <count>
error: <count>
unreachable: <count>
untestable: <count>
---

# Browser Audit: <Domain Display Name>

## Summary

| Classification | Count |
|---------------|-------|
| Present | <N> |
| Absent | <N> |
| Error | <N> |
| Unreachable | <N> |
| Untestable | <N> |
| **Total** | **<N>** |

## Action Items

| Cap ID | Name | Classification | Severity | Route | View File |
|--------|------|---------------|----------|-------|-----------|
| <domain>-C<NNN> | <name> | Absent | HIGH | /gm | [view-gm.md](view-gm.md) |
| <domain>-C<NNN> | <name> | Error | HIGH | /group | [view-group.md](view-group.md) |
<!-- non-present, non-untestable items only -->

## View Files
- [GM Views](view-gm.md)
- [Group Views](view-group.md)
- [Player Views](view-player.md)
- [Untestable Items](untestable-items.md)
```

### Per-View Files (`view-gm.md`, `view-group.md`, `view-player.md`)

```markdown
---
domain: <domain>
view: gm | group | player
routes_checked:
  - /gm
  - /gm/sheets
  - /gm/characters/1
total_capabilities: <count>
present: <count>
absent: <count>
error: <count>
unreachable: <count>
---

# Browser Audit: <Domain> — <View> Views

## Route: /gm

### <domain>-C<NNN>: <Capability Name>
- **Classification:** Present
- **Route:** `/gm`
- **Expected:** Button with text "Start Encounter"
- **Found:** `role: button, name: "Start Encounter", ref: s1e5`
- **Evidence:** Accessibility tree line 42

### <domain>-C<NNN>: <Capability Name>
- **Classification:** Absent
- **Severity:** HIGH
- **Route:** `/gm`
- **Expected:** Panel showing combatant HP values
- **Found:** Not present in accessibility tree
- **Evidence:** Searched for role: heading/text containing "HP" — no match after 5s wait + re-snapshot

## Route: /gm/sheets
...
```

### `untestable-items.md`

```markdown
---
domain: <domain>
total_untestable: <count>
---

# Browser Audit: <Domain> — Untestable Items

Server-side only capabilities with no UI terminus. These are verified by the Implementation Auditor, not the Browser Auditor.

| Cap ID | Name | Type | Reason |
|--------|------|------|--------|
| <domain>-C<NNN> | <name> | service-function | No UI renders this data directly |
| <domain>-C<NNN> | <name> | api-endpoint | Internal API, no component consumes response |
```

### Classification Table

| Classification | Meaning | Criteria |
|---------------|---------|----------|
| **Present** | Element found in accessibility tree | Matching role/text/name on the correct actor's view |
| **Absent** | Element not found | Navigated to correct view, element not in accessibility tree |
| **Error** | View fails to render | 500 error, blank page, JS error, SPA hydration failure |
| **Unreachable** | Element on wrong actor's view | Element exists but not accessible to the intended actor |
| **Untestable** | Server-side only capability | No UI terminus (service, utility, prisma, constant) |

### Severity Assignment (for Absent/Error/Unreachable)

| Severity | Criteria |
|----------|----------|
| **HIGH** | Core UI missing — primary action button, main display panel, critical form |
| **MEDIUM** | Supporting display absent — secondary info, status indicator, tooltip |
| **LOW** | Optional/indirect element — convenience shortcut, cosmetic display |

**Constraints:**
- One directory per domain with per-view files + `_index.md` summary + `untestable-items.md`
- Every component-type capability in the catalog has been checked or classified as Untestable
- Accessibility tree snapshots were actually captured (not assumed from code reading)
- Every `Absent` item includes the route checked and what was expected
- Every `Unreachable` item explains the actor mismatch
- Every `Error` item includes the error output
- `untestable-items.md` is COLD storage (rarely re-read, like `correct-items.md` for audits)

---

## 5. Bug Report / Correction / Escalation (Legacy)

> **Note:** Sections 5-5e below are from the previous test pipeline. The reports format is retained for existing artifacts in `reports/`. New bug/feature/ux tickets are created by the Orchestrator from matrix data using the ticket schema in Section 6d.

**Written by:** Previously Feature Designer (bug, feature-gap, ux-gap), Scenario Verifier (correction), Game Logic Reviewer (escalation)
**Read by:** Developer (bug), Game Logic Reviewer (escalation)
**Location:** `artifacts/reports/<type>-<NNN>.md`

### Bug Report (APP_BUG)

```markdown
---
bug_id: bug-<NNN>
severity: CRITICAL | HIGH | MEDIUM
category: APP_BUG
scenario_id: <scenario-id>
affected_files:
  - <app file path>
  - ...
---

## What Happened
<Concise description of the incorrect behavior>

## Expected vs Actual
- **Expected:** <value with PTU derivation>
- **Actual:** <value from test result>

## Root Cause Analysis
<Where in the code the bug likely lives and why>

## PTU Rule Reference
<rulebook file>: "<exact quote>"

## Suggested Fix
<Specific code change suggestion>

## Fix Log
<!-- Dev fills this in after fixing -->
- [ ] Fixed in commit: ___
- [ ] Files changed: ___
- [ ] Re-run scenario: <scenario-id>
```

### Correction (SCENARIO_BUG)

```markdown
---
correction_id: correction-<NNN>
category: SCENARIO_BUG
scenario_id: <scenario-id>
---

## What Was Wrong
<Which assertion(s) had incorrect expected values>

## Correct Values
<Re-derived values with shown math>

## Action Required
Update scenario file `artifacts/scenarios/<scenario-id>.md` assertion(s).
```

### Escalation (AMBIGUOUS)

```markdown
---
escalation_id: escalation-<NNN>
category: AMBIGUOUS
scenario_id: <scenario-id>
ptu_refs:
  - <conflicting rulebook sections>
---

## The Ambiguity
<What the rule says vs what's unclear>

## Possible Interpretations
1. <interpretation A> → expected value X
2. <interpretation B> → expected value Y

## Action Required
Game Logic Reviewer to make a ruling. Update scenario after ruling.
```

### Feature Gap Report (FEATURE_GAP)

```markdown
---
feature_gap_id: feature-gap-<NNN>
category: FEATURE_GAP
scope: FULL | PARTIAL | MINOR
scenario_id: <scenario-id>
loop_id: <source loop_id>
domain: <domain>
missing_capabilities:
  - <capability description>
  - ...
ptu_refs:
  - <rulebook-file>#<section>
  - ...
---

## What Is Missing
<Concise description of the capability the app lacks>

## Workflow Impact
<Which workflow step fails and why — reference the source loop>

## What Exists Today
<Any partial implementation, related endpoints, or adjacent features>

## PTU Rule Reference
<Rulebook quote establishing why this capability is needed>

## Recommended Scope
<FULL: new subsystem | PARTIAL: extend existing feature | MINOR: small addition>

## Design Spec
<!-- Developer fills this in when needed -->
See: `artifacts/designs/design-<NNN>.md`
```

### UX Gap Report (UX_GAP)

```markdown
---
ux_gap_id: ux-gap-<NNN>
category: UX_GAP
scope: PARTIAL | MINOR
scenario_id: <scenario-id>
loop_id: <source loop_id>
domain: <domain>
working_endpoints:
  - <endpoint that works via direct API call>
  - ...
missing_ui:
  - <UI element that doesn't exist>
  - ...
---

## What Is Missing
<Concise description of the UI gap — backend works but no UI exposes the action>

## Backend Evidence
<API calls that succeed, confirming the backend supports the operation>

## Workflow Impact
<Which workflow step fails for the GM and why>

## What GM Sees Today
<What the GM's current experience is — no button, no route, no form field>

## Design Spec
<!-- Developer fills this in when needed -->
See: `artifacts/designs/design-<NNN>.md`
```

**Constraints (both gap types):**
- UX_GAP scope is never `FULL` — if there's no backend at all, it's `FEATURE_GAP`
- Gap reports link to their design spec once one is produced
- Counters are per-prefix: `feature-gap-001` and `ux-gap-001` start independently

---

## 5e. Design Spec

**Written by:** Developer (when a feature ticket needs a design before implementation)
**Read by:** Senior Reviewer (reviews architecture), Game Logic Reviewer (PTU rule questions)
**Location:** `artifacts/designs/design-<NNN>.md`

```markdown
---
design_id: design-<NNN>
gap_report: <feature-gap-NNN or ux-gap-NNN>
category: FEATURE_GAP | UX_GAP
scope: FULL | PARTIAL | MINOR
domain: <domain>
scenario_id: <scenario-id>
loop_id: <source loop_id>
status: pending | complete | implemented
affected_files:
  - <existing app file path>
  - ...
new_files:
  - <new file path to create>
  - ...
---

## Summary
<1-2 sentences: what this design adds to the app>

## GM User Flow
1. <step-by-step user interaction from the GM's perspective>
2. ...

## Data Model Changes
<!-- FEATURE_GAP only — skip for UX_GAP -->
- <Prisma schema changes, new fields, new models>

## API Changes
<!-- FEATURE_GAP only — skip for UX_GAP -->
- <new or modified endpoints>

## Client Changes
- **Components:** <new or modified components>
- **Stores:** <new or modified Pinia stores>
- **Pages:** <new or modified page routes>
- **Composables:** <new or modified composables>

## WebSocket Events
- <new events for GM-to-Group sync, if any>

## Existing Patterns to Follow
- <reference to existing app code that implements a similar pattern>

## PTU Rule Questions
<!-- Flag ambiguous rules for Game Logic Reviewer -->
- <question about PTU rule interpretation, if any>

## Questions for Senior Reviewer
<!-- Architectural questions the Developer should route during implementation review -->
- <e.g., "New service vs extend existing?", "New store vs extend?">

## Implementation Log
<!-- Developer fills this in after implementing -->
- Commits: <commit hashes>
- Files changed: <list>
- `app-surface.md` updated: yes/no
```

**Status lifecycle:**
- `pending` — Design is in progress
- `complete` — spec written, awaiting pre-flight validation
- `validated` — pre-flight passed (dependencies mapped, open questions surfaced), ready for Developer implementation
- `implemented` — Developer filled in the Implementation Log and updated `app-surface.md`

**Constraints:**
- One design spec per gap report (1:1 relationship)
- The Developer updates `status` to `implemented` after filling in the Implementation Log
- The Orchestrator uses the `status` frontmatter field for routing decisions

---

## 6. State Files

The Orchestrator is the **sole writer** of both state files. No other skill writes to them.

### 6a. Dev State

**Written by:** Orchestrator (sole writer)
**Read by:** Dev Ecosystem skills
**Location:** `artifacts/state/dev-state.md`

Tracks: open tickets per type, active Developer work, review status, retest tickets created, refactoring queue, code health metrics.

### 6b. Matrix State

**Written by:** Orchestrator (sole writer)
**Read by:** Matrix Ecosystem skills
**Location:** `artifacts/state/test-state.md`

Tracks: domain progress table (Rules → Capabilities → Matrix → Audit → Tickets), coverage scores, active work, ambiguous items pending ruling.

### 6c. Pipeline State (Legacy)

**Location:** `artifacts/pipeline-state.legacy.md`

The original unified state file, archived for historical reference. Contains the full record from combat and capture domain cycles.

## 6d. Cross-Ecosystem Tickets

**Written by:** Orchestrator (bug/feature/ux from matrix data), Game Logic Reviewer (ptu-rule)
**Read by:** Developer
**Location:** `artifacts/tickets/<type>/<type>-<NNN>.md`

### Unified Ticket Schema

```markdown
---
ticket_id: <type>-<NNN>
type: bug | ptu-rule | feature | ux
priority: P0 | P1 | P2
status: open | in-progress | resolved | rejected
source_ecosystem: dev | test
target_ecosystem: dev | test
created_by: <skill-name>
created_at: <ISO timestamp>
domain: <domain>
# Type-specific optional fields:
severity: CRITICAL | HIGH | MEDIUM          # bug, ptu-rule
scope: FULL | PARTIAL | MINOR              # feature, ux
affected_files:                             # bug, ptu-rule
  - <app file path>
scenario_ids:                               # bug, feature, ux, retest
  - <scenario-id>
design_spec: <design-NNN>                  # feature, ux (back-reference)
source_report: <report-filename>           # bug, feature, ux (link to internal report — legacy)
matrix_source:                             # bug, feature, ux, ptu-rule (from matrix workflow)
  rule_id: <domain>-R<NNN>
  domain: <domain>
  audit_classification: incorrect | approximation | missing | partial
categories:                                 # refactoring only
  - <category-id>
estimated_scope: small | medium | large    # refactoring only
---

## Summary
<actionable description for the target ecosystem>

## <type-specific sections>
```

**Constraints:**
- Ticket is slimmer than full matrix data — just actionable info + `matrix_source` link back to rule_id/domain
- Status lifecycle: `open` → `in-progress` → `resolved` (or `rejected`)
- Bug/feature/ux tickets are created by the Orchestrator when processing completed matrix + audit data
- Legacy tickets may have `source_report` instead of `matrix_source` — both are valid

---

## 6e. Decree-Need Ticket

**Written by:** Senior Reviewer, Game Logic Reviewer, Implementation Auditor, Slave Collector, UX Ticket Creator
**Read by:** Decree Facilitator
**Location:** `artifacts/tickets/open/decree/decree-need-<NNN>.md`

```markdown
---
ticket_id: decree-need-NNN
type: decree-need
priority: P1
status: open | addressed | rejected
domain: <domain>
source: <review-id or skill-name or ux-session-NNN>
created_by: <skill-name>
created_at: <ISO timestamp>
decree_id: null | decree-NNN
---

# decree-need-NNN: Question requiring human ruling

## The Ambiguity
<What question arose>

## Context
<file:line references, PTU quotes, review artifacts that surfaced this>

## Options Identified
### Option A: <Name>
<Description, implications, precedent>
### Option B: <Name>
<Description, implications, precedent>

## Recommendation
<Skill's recommendation, or "genuinely ambiguous — needs human input">

## Blocking Work
<Ticket IDs blocked by this ruling, or "none">
```

**Status lifecycle:** `open` → `addressed` (decree recorded) or `rejected` (existing decree reaffirmed)

**Constraints:**
- One decree-need per ambiguity (don't duplicate)
- Always include at least 2 options
- Set `decree_id` after Decree Facilitator records the ruling

---

## 6f. Design Decree

**Written by:** Decree Facilitator (from human ruling)
**Read by:** All reviewer/auditor/dev skills
**Location:** `decrees/decree-<NNN>.md` (project root)

```markdown
---
decree_id: decree-NNN
status: active | superseded | withdrawn
domain: <domain>
topic: <short-kebab-case-topic>
title: "<Imperative: Use X approach for Y>"
ruled_at: <ISO timestamp>
supersedes: null | decree-NNN
superseded_by: null | decree-NNN
source_ticket: decree-need-NNN
implementation_tickets: [<ticket-id>, ...]
tags: [<searchable>, <tags>]
---

# decree-NNN: <Title>

## The Ambiguity
<What question arose. Reference the source ticket/review.>

## Options Considered
### Option A: <Name>
<Description, pros, cons, PTU references.>
### Option B: <Name>
<Description, pros, cons, PTU references.>

## Ruling
**The true master decrees: <one-sentence decision>.**
<Full explanation with rationale.>

## Precedent
<The reusable principle this establishes. This is what reviewers and skills cite.>

## Implementation Impact
- Tickets created: <list or "none — confirms current behavior">
- Files affected: <key files>
- Skills affected: <which skills need awareness>
```

**Status lifecycle:** `active` → `superseded` (replaced by newer decree) or `withdrawn`

**Constraints:**
- Decrees are immutable once written (only `status`, `superseded_by` fields change)
- Supersession creates a new decree and marks the old one
- Active decrees override all skill-level rulings
- Decree violations found by reviewers are CRITICAL severity

---

## 7. Lesson File

**Written by:** Retrospective Analyst
**Read by:** All skills (for learning from past errors)
**Location:** `artifacts/lessons/<skill-name>.lessons.md`

```markdown
---
skill: <skill-name>
last_analyzed: <ISO timestamp>
analyzed_by: retrospective-analyst
total_lessons: <count>
domains_covered:
  - <domain>
  - ...
---

# Lessons: <Skill Display Name>

## Summary
<2-3 sentences summarizing key patterns found for this skill>

---

## Lesson <N>: <imperative title>

- **Category:** <one of: math-error, data-lookup, missing-check, process-gap, triage-error, selector-issue, routing-error, rule-ambiguity, fix-pattern>
- **Severity:** high | medium | low
- **Domain:** <domain or cross-cutting>
- **Frequency:** observed | recurring | systemic
- **First observed:** <date>
- **Status:** active | resolved | promote-candidate

### Pattern
<Concrete description of the error pattern with artifact references>

### Evidence
- `artifacts/<dir>/<file>`: <what was found>
- `git diff <hash>`: <what was changed>

### Recommendation
<Imperative instruction that could be added to the skill's process>
```

**File naming:** `<skill-name>.lessons.md` — hyphenated, matching ecosystem conventions. Examples:
- `ptu-rule-extractor.lessons.md`
- `coverage-analyzer.lessons.md`
- `game-logic-reviewer.lessons.md`

**Cross-cutting summary:** `artifacts/lessons/retrospective-summary.md` — aggregates metrics and patterns that span multiple skills.

**Constraints:**
- One file per skill — only created for skills with actual lessons
- `promote-candidate` status means the lesson should be considered for integration into the skill's process
- Resolved lessons remain in the file (marked `status: resolved`) for historical reference
- Lessons are numbered sequentially within each file
- The Retrospective Analyst deduplicates before writing — if a pattern already exists, it updates frequency and adds evidence rather than creating a duplicate

---

## 8. Refactoring Ticket + Audit Summary

**Written by:** Code Health Auditor
**Read by:** Developer (implements refactoring), Senior Reviewer (reviews approach)
**Location:** `artifacts/refactoring/refactoring-<NNN>.md` and `artifacts/refactoring/audit-summary.md`

### Refactoring Ticket

```markdown
---
ticket_id: refactoring-<NNN>
priority: P0 | P1 | P2
categories:
  - <category-id>
affected_files:
  - <app file path>
estimated_scope: small | medium | large
status: open | in-progress | resolved
created_at: <ISO timestamp>
---

## Summary
<1-2 sentences: what the problem is and why it matters for LLM agents>

## Findings

### Finding 1: <category-id>
- **Metric:** <measured value>
- **Threshold:** <threshold that was exceeded>
- **Impact:** <how this affects LLM agent code generation>
- **Evidence:** <file:line-range, function names>

### Finding 2: ...

## Suggested Refactoring
1. <step with exact file paths>
2. <step referencing existing patterns to follow>
3. ...
Estimated commits: <count>

## Related Lessons
- <cross-reference to Retrospective Analyst finding, or "none">

## Resolution Log
<!-- Developer fills this in after refactoring -->
- Commits: ___
- Files changed: ___
- New files created: ___
- Tests passing: ___
```

**File naming:** `refactoring-<NNN>.md` — sequential counter starting from 001. Examples:
- `refactoring-001.md`
- `refactoring-002.md`

**Scope definitions:**
- **small**: Single file, <50 lines changed, no interface changes
- **medium**: 2-3 files, possible interface changes, <200 lines changed
- **large**: 4+ files, interface changes, >200 lines changed

**Status lifecycle:** `open` → `in-progress` → `resolved`

### Audit Summary

```markdown
---
last_audited: <ISO timestamp>
audited_by: code-health-auditor
scope: <"full codebase" | "domain: <name>" | "targeted: <paths>">
files_scanned: <count>
files_deep_read: <count>
total_tickets: <count>
overflow_files: <count of files that qualified but exceeded the 20-file cap>
---

## Metrics
| Metric | Value |
|--------|-------|
| Total files scanned | <count> |
| Total lines of code | <count> |
| Files over 800 lines | <count> |
| Files over 600 lines | <count> |
| Files over 400 lines | <count> |
| Open tickets (P0) | <count> |
| Open tickets (P1) | <count> |
| Open tickets (P2) | <count> |

## Hotspots
| Rank | File | Lines | Categories | Priority |
|------|------|-------|------------|----------|
| 1 | <path> | <count> | <ids> | <P0/P1/P2> |

## Tickets Written
- `refactoring-<NNN>`: <summary> (P<X>)

## Overflow
<!-- Files that qualified for deep-read but were capped -->
- <path> (<line count>, reason: <size/hot/lesson-ref>)

## Comparison to Last Audit
- Resolved since last audit: <count>
- New issues found: <count>
- Trend: improving | stable | degrading
```

**Constraints:**
- One audit summary file — overwritten each audit run
- Overflow section tracks files that exceeded the 20-file deep-read cap
- Comparison section is empty on first audit
- Max 10 tickets per audit run

---

## 9. Code Review

**Written by:** Senior Reviewer
**Read by:** Orchestrator, Developer, Game Logic Reviewer
**Location:** `artifacts/reviews/code-review-<NNN>.md`

```markdown
---
review_id: code-review-<NNN>
review_type: code
reviewer: senior-reviewer
trigger: bug-fix | design-implementation | refactoring
target_report: <bug-NNN | design-NNN | refactoring-NNN>
domain: <domain>
commits_reviewed:
  - <commit hash>
  - ...
files_reviewed:
  - <app file path>
  - ...
verdict: APPROVED | CHANGES_REQUIRED | BLOCKED
issues_found:
  critical: <count>
  high: <count>
  medium: <count>
scenarios_to_rerun:
  - <scenario-id>
  - ...
reviewed_at: <ISO timestamp>
follows_up: <code-review-NNN>  # optional — for re-reviews
---

## Review Scope
<What was reviewed — commits, bug report reference, design spec reference>

## Issues

### CRITICAL
<!-- Empty if none -->
1. **<title>** — `<file>:<line>`
   ```<language>
   <buggy code>
   ```
   **Fix:**
   ```<language>
   <corrected code>
   ```

### HIGH
<!-- Empty if none -->

### MEDIUM
<!-- Empty if none -->

## What Looks Good
- <specific positive observations>

## Verdict
<APPROVED | CHANGES_REQUIRED | BLOCKED> — <one sentence justification>

## Required Changes
<!-- Empty if APPROVED -->
1. <specific change with file:line reference>

## Scenarios to Re-run
- <scenario-id>: <why this scenario is affected>
```

**Constraints:**
- One review per target report per review cycle (re-reviews use `follows_up` or create a new artifact)
- Verdict `BLOCKED` means CRITICAL issues found — Developer must fix before any further pipeline progress
- Verdict `CHANGES_REQUIRED` means HIGH/MEDIUM issues that must be addressed before approval
- Verdict `APPROVED` means the code is ready for rules review and eventually re-test
- `scenarios_to_rerun` is informational — notes which scenarios are affected by the reviewed changes
- Counters are per-prefix: `code-review-001` and `rules-review-001` coexist independently

---

## 10. Rules Review

**Written by:** Game Logic Reviewer
**Read by:** Orchestrator, Developer
**Location:** `artifacts/reviews/rules-review-<NNN>.md`

```markdown
---
review_id: rules-review-<NNN>
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix | design-implementation | escalation-ruling
target_report: <bug-NNN | design-NNN | escalation-NNN>
domain: <domain>
commits_reviewed:
  - <commit hash>
  - ...
mechanics_verified:
  - <mechanic-name>
  - ...
verdict: APPROVED | CHANGES_REQUIRED | BLOCKED
issues_found:
  critical: <count>
  high: <count>
  medium: <count>
ptu_refs:
  - <rulebook-file>#<section>
  - ...
reviewed_at: <ISO timestamp>
follows_up: <rules-review-NNN>  # optional — for re-reviews
---

## Review Scope
<What was reviewed — commits, bug report reference, mechanic areas>

## Mechanics Verified

### <Mechanic Name>
- **Rule:** "<exact quote>" (`<rulebook-file>#<section>`)
- **Implementation:** <what the code does>
- **Status:** CORRECT | INCORRECT | NEEDS REVIEW
- **Fix (if incorrect):** <specific correction>

### <Next Mechanic>
...

## Summary
- Mechanics checked: <N>
- Correct: <N>
- Incorrect: <N>
- Needs review: <N>

## Rulings
<!-- For escalation triggers or ambiguous rule interpretations -->
- <ruling with rulebook justification>

## Verdict
<APPROVED | CHANGES_REQUIRED | BLOCKED> — <one sentence justification>

## Required Changes
<!-- Empty if APPROVED -->
1. <specific change with PTU rule reference>
```

**Constraints:**
- One review per target report per review cycle (re-reviews use `follows_up` or create a new artifact)
- Verdict meanings match Code Review (BLOCKED = CRITICAL, CHANGES_REQUIRED = must fix, APPROVED = ready)
- `mechanics_verified` lists every mechanic the reviewer checked — even if all are correct
- `ptu_refs` must point to actual rulebook files via `references/ptu-chapter-index.md`
- Escalation rulings should also produce a `rules-review-*.md` for audit trail
- Counters are per-prefix: `rules-review-001` and `code-review-001` coexist independently
