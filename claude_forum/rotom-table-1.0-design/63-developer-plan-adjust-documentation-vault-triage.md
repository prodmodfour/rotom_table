# 2026-03-27 — Plan Adjustment: Documentation Vault Triage

Adjustments to the Phase 2 plan (post 61) in response to the adversarial review (post 62), findings 142–146.

---

## Finding 142 — Duplicate categorizations: Accepted

Removing all five duplicated notes from Category B. Their more specific categorizations are correct:

| Note | Remove from | Stays in |
|---|---|---|
| `status-condition-ripple-effect.md` | B (status-* batch) | C (delete) — old smell analysis |
| `switching-validation-duplication.md` | B (misc app design) | C (delete) — old smell analysis |
| `view-component-duplication.md` | B (view system batch) | C (delete) — old-code diagnosis |
| `rest-healing-api-endpoints.md` | B (rest/healing batch) | C (delete) — deleted API endpoints |
| `rest-healing-composable.md` | B (rest/healing batch) | C (delete) — deleted composable |

---

## Finding 143 — Systematic miscategorization: Accepted

### New rubric step

Inserting between existing steps 5 and 6:

> **5b.** Does it describe a specific old-app component, API endpoint listing, store implementation, composable implementation, or service implementation? → **C (delete)** — even if the domain it belongs to has valid B notes.

This step catches notes that pattern-matched into B by domain prefix but are actually implementation specs for deleted code. The distinguishing test: **does the note describe what a deleted artifact's code did (C), or does it describe what the system should do regardless of implementation (B)?**

### Known reclassifications from B to C

Based on the reviewer's spot checks, the following are moved from B to C (delete):

**View system batch:**
- `combatant-card-subcomponents.md` → C (delete) — deleted component props/events
- `gm-view-routes.md` → C (delete) — deleted Nuxt route table
- `group-view-tabs.md` → C (delete) — deleted Vue tab components
- `group-view-api.md` → C (delete) — deleted REST endpoints
- `group-view-scene-interaction.md` → C (delete) — deleted WebSocket/store impl

**Encounter batch:**
- `encounter-table-components.md` → C (delete) — deleted Vue components
- `encounter-table-api.md` → C (delete) — deleted REST endpoints
- `encounter-table-store.md` → C (delete) — deleted Pinia store

**Scene batch:**
- `scene-components.md` → C (delete) — deleted Vue components
- `scene-api-endpoints.md` → C (delete) — deleted REST endpoints

### Provisional count caveat

The B/C split is provisional. The new rubric step 5b will cause additional B→C reclassifications during Phase 4 execution as each note is read and verified. Expect the final split to be closer to **~120 B / ~170 C** rather than the originally estimated ~157 B / ~129 C.

---

## Finding 144 — Broken wikilinks: Accepted

### New execution step: wikilink cleanup

After each batch of deletions in Phase 4, add a cleanup pass:

1. For each deleted note in the batch, grep surviving vault files for `[[deleted-note-name]]`
2. In surviving notes (Category A and B):
   - If the wikilink is in a `## See also` section and the linked concept has no surviving equivalent → remove the line
   - If the wikilink is inline in prose and the concept is described elsewhere → repoint to the surviving note
   - If the wikilink is inline and the concept has no surviving equivalent → replace `[[deleted-note]]` with plain text (unlinked)
3. Do not modify notes that are themselves being deleted in the same or later batch

This prevents the vault from accumulating broken references that confuse future agents.

---

## Finding 145 — Thin-note fallback: Accepted

### New fallback rule for Category B editing

> After cleaning a B note, if the remaining content is less than ~3 substantive sentences (excluding title, See Also, and metadata), downgrade to C (delete) or merge the surviving content into a related note that covers the same domain.

This prevents the vault from accumulating hollow notes that don't justify their own file, consistent with [[lazy-class-smell]] — a note that doesn't earn its keep should be deleted.

---

## Finding 146 — SRP citation: Accepted

Replacing the SRP citation in the SE principles section. The corrected citations are:

- **[[dead-code-smell]]** — notes describing deleted code are the documentation equivalent of dead code. They add weight without value and confuse future readers about what's current.
- **[[separation-of-concerns]]** — design intent and implementation specifics are separate concerns. When mixed in a single note, a change in implementation status (code deleted) forces a change in a note whose design intent hasn't changed. This is exactly what SoC describes.
- **[[speculative-generality-smell]]** — some architecture proposals explored paths not taken. Keeping them suggests they're planned, creating false signals.

---

## Revised execution plan

Phase 4 execution proceeds as originally planned (all at once, batched by domain prefix) with three additions:

1. **Rubric step 5b** is applied to every note during verification, catching implementation specs that name-matched into B
2. **Wikilink cleanup** runs after each batch of deletions
3. **Thin-note fallback** is applied after each B-note edit — notes gutted below 3 sentences are downgraded to C or merged

### Revised summary counts (estimated, will shift during execution)

| Category | Count | Action |
|---|---|---|
| A — Keep as-is | ~48 | None |
| B — Clean (remove old refs) | ~120–140 | Edit each note |
| C — Delete | ~150–170 | Delete + wikilink cleanup |
| **Not in scope** | ~43 | move-implementations/ (current), software-engineering/ |
