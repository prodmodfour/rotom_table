# 2026-03-27 — Adversarial Plan Review: Documentation Vault Triage

Reviewed the developer's Phase 2 plan (post 61) against the context gather (post 60), the current documentation vault contents, and the SE vault.

## Verification Method

- Read all index notes (categories, rubric, execution plan, SE citations, Ashraf's decisions)
- Spot-checked individual note categorizations by reading the actual vault notes
- Checked for duplicate entries across categories
- Assessed wikilink impact of proposed deletions
- Verified SE citations against the SE vault definitions

---

## Finding 142 — Duplicate categorizations across categories

**Severity: High (plan bug — contradictory actions on same notes)**

Five notes appear in two different categories with contradictory prescribed actions:

| Note | Category B (clean) | Also in | Actual content |
|---|---|---|---|
| `status-condition-ripple-effect.md` | status-* batch | D → delete | Smell analysis of deleted `types/combat.ts` — pure old-code diagnosis |
| `switching-validation-duplication.md` | misc app design batch | D → delete | Smell analysis of deleted `switching.service.ts` — pure old-code diagnosis |
| `view-component-duplication.md` | view system batch | D → delete | Diagnosis of deleted component duplication — old-code problem |
| `rest-healing-api-endpoints.md` | rest/healing batch | C (delete) | Endpoint listing for deleted `/api/characters/[id]/rest` routes |
| `rest-healing-composable.md` | rest/healing batch | C (delete) | Composable documentation for deleted `useRestHealing.ts` |

I read all five notes. In each case, the more specific categorization (C or D→delete) is correct. The notes contain no transferable design intent — they are implementation specs or smell analyses of deleted code.

**Root cause:** The Category B list was assembled by domain-prefix name matching. Notes whose names pattern-match a B batch (e.g., `status-*`, `rest-healing-*`) were bulk-included without cross-checking against the C and D lists.

**SE principle:** [[duplicate-code-smell]] — the same note appears in two places with different semantics. The plan itself has the smell it's trying to cure in the vault.

**Fix:** Remove these five notes from Category B. They are correctly classified in C/D→delete.

---

## Finding 143 — Systematic miscategorization in Category B domain batches

**Severity: High (materially wrong counts — ~157 B is inflated, ~129 C is deflated)**

Beyond the five explicit duplicates, the Category B "view system" and other domain batches contain notes that are pure old implementation specs (Category C material), not contaminated design intent (Category B). I read eight notes from the view system batch and six from other batches:

**View system batch (claimed ~5, actually lists 8):**

| Note | Content | Correct category |
|---|---|---|
| `combatant-card-subcomponents.md` | Props and events for deleted `CombatantCard.vue` sub-components | C (delete) |
| `gm-view-routes.md` | Route table for deleted `pages/gm/*.vue` Nuxt pages | C (delete) |
| `group-view-tabs.md` | Lists 4 deleted Vue tab components | C (delete) |
| `group-view-api.md` | REST endpoints for deleted `/api/group/*` routes | C (delete) |
| `group-view-scene-interaction.md` | WebSocket/store implementation detail for deleted scene sync | C (delete) |
| `view-component-duplication.md` | Old-code diagnosis (finding 142 duplicate) | D → delete |

Only `triple-view-system.md` and `view-capability-projection.md` in this batch are genuinely B.

**Other batches spot-checked:**

| Note | Batch | Content | Correct category |
|---|---|---|---|
| `encounter-table-components.md` | encounter-* | Lists 6 deleted Vue components in `components/encounter-table/` | C (delete) |
| `encounter-table-api.md` | encounter-* | REST endpoints for deleted `/api/encounter-tables` | C (delete) |
| `encounter-table-store.md` | encounter-* | Pinia store at deleted `stores/encounterTables.ts` | C (delete) |
| `scene-components.md` | scene-* | 8 deleted Vue components with line counts | C (delete) |
| `scene-api-endpoints.md` | scene-* | REST endpoints for deleted `/api/scenes` | C (delete) |

This pattern — old API endpoint docs, old component listings, old store descriptions bulk-included in B — likely repeats across the player-*, websocket-*, and other domain batches.

**SE principle:** The developer acknowledged this limitation in the plan: "Notes I haven't read are categorized by name pattern and cross-reference signals; these will be verified during Phase 4." However, the summary counts (~157 B / ~129 C) are used to scope the Phase 4 work ("all at once" decision was based on these counts). If the actual split is closer to ~120 B / ~170 C, the work profile changes — fewer edits, more deletes, different time estimate.

**Impact:** Not blocking if the developer verifies each note during Phase 4 execution (which the plan already intends). But the summary counts table at the end of the plan should carry a caveat that the B/C split is provisional and will shift toward more deletes during execution.

**Fix:** Add a rubric step between steps 5 and 6: "Does it describe a specific old component, API endpoint, store, composable, or service implementation? → C (delete) even if the domain it belongs to has valid B notes." This prevents domain-prefix name matching from overriding the C rubric.

---

## Finding 144 — No plan for broken wikilinks after deletion

**Severity: Medium (degrades vault quality — stale links confuse future agents)**

Deleting ~129+ notes will break `[[wikilinks]]` in surviving notes. I checked references to just four notes being deleted (`service-inventory`, `service-dependency-map`, `prisma-schema-overview`, `pinia-store-classification`) and found 49 occurrences across 40 files. Many of those 40 files are themselves being deleted, but some are in Category A or B (surviving notes).

For example, `group-view-scene-interaction.md` references `[[pinia-store-classification]]` — but both notes are being deleted, so that's fine. However, `triple-view-system.md` (Category A, surviving) links to notes being deleted, and its links will break.

Obsidian shows broken wikilinks as unresolved references, which degrades vault navigation and confuses future agents into thinking the linked concept exists but can't be found.

**SE principle:** [[dead-code-smell]] — broken wikilinks are the documentation equivalent of dead references. They point to something that no longer exists, creating confusion without value.

**Fix:** Add a wikilink cleanup step to Phase 4 execution. For each batch of deletions: grep for `[[deleted-note-name]]` across surviving notes and remove or replace the broken links. This can be done per-batch after the deletions in that batch.

---

## Finding 145 — No thin-note fallback for Category B edits

**Severity: Low (edge case, but will arise during execution)**

Category B says "remove old file paths, keep design content." But some B notes may be 90% implementation detail and 10% design intent. After cleaning, they could be reduced to just a title and a sentence or two — insufficient to justify a standalone vault note.

The rubric has no rule for this case. During Phase 4, the developer will encounter notes where removing old references essentially guts the note. Without a fallback rule, they'll need to make ad-hoc decisions that could be inconsistent across 157 edits.

**SE principle:** [[speculative-generality-smell]] — keeping a hollow note "just in case" the sentence might be useful is the documentation equivalent of keeping a class that doesn't earn its keep ([[lazy-class-smell]]).

**Fix:** Add a fallback rule: "After cleaning a B note, if the remaining content is less than ~3 substantive sentences (excluding title, See Also, and metadata), downgrade to C (delete) or merge the surviving content into a related note."

---

## Finding 146 — SRP citation is imprecise

**Severity: Low (documentation only — doesn't affect execution)**

The plan cites [[single-responsibility-principle]] for "notes that blend valid design with stale implementation have two responsibilities that change at different rates."

SRP applies to classes and modules: "a class should have one, and only one, reason to change." A vault note isn't a class — it doesn't "change for two reasons." The note is simply out of date. The actual concern is that design intent and implementation detail are separate concerns mixed in the same note.

**SE principle:** The better citation is [[separation-of-concerns]] — "each module should address a distinct aspect of the problem." Design intent and implementation specifics are separate concerns. When mixed in a single note, a change in implementation status (code deleted) forces a change in a note whose design intent hasn't changed. This is exactly what SoC describes.

**Fix:** Replace the SRP citation with separation-of-concerns. The dead-code-smell and speculative-generality-smell citations are accurate.

---

## Verdict

**Plan structure is sound.** The four-category triage, the classification rubric, and the execution approach (batch by domain prefix) are well-designed. Ashraf's decisions to collapse Category D and process all at once are incorporated correctly.

**Five findings, two require plan adjustment before Phase 4:**

| Finding | Severity | Blocking? |
|---|---|---|
| 142 — Duplicate categorizations | High | Yes — remove 5 notes from B list |
| 143 — Systematic B→C miscategorization | High | Yes — add rubric step to prevent implementation specs from entering B |
| 144 — Broken wikilinks | Medium | Yes — add cleanup step to execution plan |
| 145 — Thin-note fallback | Low | No — recommended addition |
| 146 — SRP citation imprecise | Low | No — recommended correction |

Findings 142–144 should be addressed in a plan adjustment post before proceeding to Phase 4.
