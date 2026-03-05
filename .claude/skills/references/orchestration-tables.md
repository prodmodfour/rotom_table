# Orchestration Tables — Shared Reference

Read-only reference tables used by the orchestrator survey, planner, and launcher skills.

## D1-D9 Work Categories

Categories label *what kind of work* an item is — they are **NOT a priority ordering** (D1 is not "higher priority" than D4).

| Category | Condition | Agent Type |
|----------|-----------|-----------|
| D1 | CRITICAL bugs — `tickets/open/bug/` with severity CRITICAL | Developer |
| D2 | Fix cycle — in-progress ticket has CHANGES_REQUIRED review | Developer |
| D3 | FULL-scope feature tickets — no design yet | Developer (write design) |
| D3b | Design `status: complete` — needs pre-flight validation | Orchestrator Survey (inline, not a slave) |
| D4 | PTU rule tickets — `tickets/open/ptu-rule/` open | Developer |
| D5 | HIGH bugs + PARTIAL/MINOR gaps | Developer |
| D6 | Committed fix missing review artifacts | Both reviewers (parallel) |
| D7 | Pending designs — `designs/` with `status: validated` | Developer |
| D8 | Refactoring tickets — open | Developer |
| D9 | All clean — suggest Code Health Auditor audit | Code Health Auditor |

**D2 detection:** Cross-reference in-progress tickets (P2+) against active CHANGES_REQUIRED reviews. For each in-progress ticket at P2 or higher, find its latest CHANGES_REQUIRED review. If found, this ticket is D2. Flag any CRITICAL correctness bugs (wrong game values, data loss, logic errors, security) for escalation. File size violations are CRITICAL review severity but are NOT "correctness bugs" for escalation purposes.

## M1-M7 Matrix Ecosystem Priorities (Separate System)

**Matrix work is decoupled from the dev orchestration pipeline.** The human decides when to trigger matrix audits. These categories are retained as reference for the matrix system but are NOT scanned, promoted, or queued by `/survey` or `/plan_slaves`.

| Priority | Condition | Agent Type |
|----------|-----------|-----------|
| M1 | Audit has CRITICAL incorrect items, no ticket yet | Create P0 bug tickets → Developer |
| M2 | Matrix + audit complete, tickets not yet created | Process matrix: create tickets |
| M3 | App code changed since last capability mapping | Capability Mapper (re-map) |
| M4 | Active domain has incomplete matrix stages | Next skill in sequence |
| M5 | Audit has AMBIGUOUS items | Game Logic Reviewer |
| M6 | Domain fully processed, all tickets created | Report, suggest next domain |
| M7 | All domains complete | Report overall coverage |

When the human triggers a matrix audit, M2 ticket creation converts matrix findings into dev tickets, which then appear in the next `/survey` as normal D1-D9 items.

## Parallelization Rules

| Pattern | Parallel? | Reason |
|---------|-----------|--------|
| Dev tickets on different domains | Yes | Different file zones |
| Dev ticket + its review | No | Review needs commits |
| Senior reviewer + game logic reviewer (same target) | Yes | Different concerns, separate panes |
| Multiple reviews for different targets | Yes | Independent |
| Code Health Auditor + dev work | Yes | Auditor reads only |
| Dev tickets on same domain (no file data) | Serial | Merge conflict risk — domain-level fallback |
| Dev tickets on same domain (disjoint files) | Yes | File-level check shows no overlap — safe |
| Dev tickets on same domain (overlapping files) | Serial | File-level check confirms conflict |

## Template Mapping

### Dev Pipeline Templates

| Agent Type | Template File | Source Skill (reference only) |
|---|---|---|
| Developer | `templates/agent-dev.md` | `ptu-session-helper-dev.md` |
| Senior Reviewer | `templates/agent-senior-reviewer.md` | `ptu-session-helper-senior-reviewer.md` |
| Game Logic Reviewer | `templates/agent-game-logic-reviewer.md` | `game-logic-reviewer.md` |
| Code Health Auditor | `templates/agent-code-health-auditor.md` | `code-health-auditor.md` |
| Retrospective Analyst | `templates/agent-retrospective-analyst.md` | `retrospective-analyst.md` |

### Matrix Pipeline Templates (Separate System — Human-Triggered)

| Agent Type | Template File | Source Skill (reference only) |
|---|---|---|
| Rule Extractor | `templates/agent-rule-extractor.md` | `ptu-rule-extractor.md` |
| Capability Mapper | `templates/agent-capability-mapper.md` | `app-capability-mapper.md` |
| Coverage Analyzer | `templates/agent-coverage-analyzer.md` | `coverage-analyzer.md` |
| Implementation Auditor | `templates/agent-implementation-auditor.md` | `implementation-auditor.md` |
| Browser Auditor | `templates/agent-browser-auditor.md` | `browser-auditor.md` |

**Template fallback:** If a template produces poor agent results (incomplete output, wrong format), fall back to embedding the full skill file for that launch. Note this in the plan.

## Template Placeholder Defaults

| Placeholder | Default |
|---|---|
| `{{TICKET_CONTENT}}` | "(No ticket file found — implement based on task description above)" |
| `{{RELEVANT_FILES}}` | "(No specific files identified — explore the domain directory)" |
| `{{PTU_RULES}}` | "(No PTU rules pre-loaded — read rulebook chapters as needed)" |
| `{{RELEVANT_LESSONS}}` | "(No lessons found for this skill)" |
| `{{REVIEW_FEEDBACK}}` | "(No prior review feedback)" |
| `{{DESIGN_SPEC}}` | "(No design spec — implement directly from ticket)" |
| `{{GIT_LOG}}` | "(No recent git history available)" |
| `{{PREVIOUS_REVIEW}}` | "(First review — no prior review artifact)" |
| `{{RELEVANT_DECREES}}` | "(No active decrees for this domain)" |
| `{{CAPABILITY_INDEX}}` | "(No capability index found — read capabilities directory)" |
| `{{MATRIX_ACCESSIBLE_FROM}}` | "(No matrix accessible_from data — read matrix.md)" |
| `{{VIEW_MAP}}` | "(No route mapping found — read browser-audit-routes.md)" |

## Dynamic Data Placeholders

- **`{{RELEVANT_FILES}}`** — Two-tier resolution:
  - **Tier 1 — Ticket-level:** Extract file paths from ticket's "Affected Files"/"Files" section, inline backtick-wrapped paths, `matrix_source` field's referenced rule catalog, design spec's "Files to Modify" section, review artifact's "Files Reviewed" section (for re-work)
  - **Tier 2 — Domain-level fallback:** If Tier 1 yields <2 files, supplement from `references/app-surface.md`
  - Do NOT inject file contents — just provide paths. The agent reads files it needs.
- **`{{TICKET_CONTENT}}`** — Read the ticket file
- **`{{PTU_RULES}}`** — From rulebook chapters if game mechanic
- **`{{RELEVANT_LESSONS}}`** — From `artifacts/lessons/<skill>.lessons.md`
- **`{{REVIEW_FEEDBACK}}`** — If re-work after CHANGES_REQUIRED
- **`{{GIT_LOG}}`** — Recent git log for the domain
- **`{{DESIGN_SPEC}}`** — If implementing a design
- **`{{TASK_DESCRIPTION}}`** — Synthesized from ticket + priority context
- **`{{WORKTREE_PATH}}`** — Set to `{{RESOLVED_AT_SLAVE_TIME}}`
- **`{{BRANCH_NAME}}`** — Set to `{{RESOLVED_AT_SLAVE_TIME}}`
- **`{{PREVIOUS_REVIEW}}`** — Prior review artifact if re-review
- **`{{RELEVANT_DECREES}}`** — Active decrees from `decrees/` matching the slave's domain
- **`{{CAPABILITY_INDEX}}`** — (Matrix pipeline only — Browser Auditor) Read `artifacts/matrix/<domain>/capabilities/_index.md`
- **`{{MATRIX_ACCESSIBLE_FROM}}`** — (Matrix pipeline only — Browser Auditor) Read `artifacts/matrix/<domain>/matrix.md` accessible_from data
- **`{{VIEW_MAP}}`** — (Matrix pipeline only — Browser Auditor) Read `.claude/skills/references/browser-audit-routes.md`

## Domain List

| Domain | Coverage |
|--------|----------|
| combat | damage, stages, initiative, turns, status conditions |
| capture | capture rate, attempt, ball modifiers |
| healing | rest, extended rest, Pokemon Center, injuries |
| pokemon-lifecycle | creation, stats, moves, abilities, evolution |
| character-lifecycle | creation, stats, classes, skills |
| encounter-tables | table CRUD, entries, sub-habitats, generation |
| scenes | CRUD, activate/deactivate, entities, positioning |
| vtt-grid | grid movement, fog of war, terrain, backgrounds |
