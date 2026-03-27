# 2026-03-27 — Pre-Implementation Documentation: Documentation Vault Triage

Phase 3 output. Three documentation vault convention notes written before Phase 4 triage execution.

## Gap analysis

The zettelkasten rules (`.claude/context_injections/vaults/zettelkasten.md`) cover note creation and linking but have three gaps relevant to the triage task:

1. **No content boundary rule.** Nothing specifies what kind of content belongs in a documentation vault note vs. what doesn't. This is how ~120 notes accumulated old-app file paths alongside valid design intent — there was no convention saying "don't embed implementation artifacts."
2. **No deletion protocol.** The rules say "extract before it grows" and "relationships are bidirectional" but say nothing about what happens when a note is deleted. No broken-link cleanup process.
3. **No minimum viability rule.** "One idea per file" says every file should have one idea, but doesn't address the inverse — a file whose content has been edited down to nearly nothing. The triage will edit B notes to remove old-app references, and some may become empty shells.

## Notes written

### 1. `documentation-note-content-boundary.md`

**Convention:** Documentation vault notes describe what the system should do, not what specific code artifacts did. Reference design concepts by name, not by implementation file path. If both design and implementation must coexist, use a separate `## Implementation` section.

**Why before Phase 4:** Every B-note edit involves deciding what to keep vs. what to remove. This convention is the decision rule: design intent stays, implementation file paths go. Without it, the boundary is implicit and each edit is a judgment call with no reference point.

**SE citation:** [[separation-of-concerns]] — design intent and implementation detail change at different rates and should not be mixed in one note.

### 2. `wikilink-cleanup-on-deletion.md`

**Convention:** When vault notes are deleted, surviving notes must have their broken `[[wikilinks]]` resolved. Three strategies: remove from See Also, repoint to surviving equivalent, or convert to plain text.

**Why before Phase 4:** The triage will delete ~150–170 notes. Without this convention, the wikilink cleanup pass (added to the plan in finding 144) has no authoritative reference. The convention makes the three resolution strategies permanent, not task-specific.

**Zettelkasten alignment:** Extends "relationships are bidirectional" to the deletion case — when one side of a relationship is deleted, the other side must be updated.

### 3. `thin-note-threshold.md`

**Convention:** After editing, if a note has fewer than ~3 substantive sentences (excluding title, See Also, metadata), merge it into a related note or delete it.

**Why before Phase 4:** The thin-note fallback rule (added to the plan in finding 145) needs a permanent home. B-note editing will produce some notes where removing implementation detail leaves almost nothing. This convention tells the developer when to stop trying to save a note.

**SE citation:** [[lazy-class-smell]] — a note too small to justify its own file is the documentation equivalent.

## Cross-links

All three notes are bidirectionally linked to each other. SE vault notes are not modified (per design principle 8 — SE notes contain pure knowledge).
