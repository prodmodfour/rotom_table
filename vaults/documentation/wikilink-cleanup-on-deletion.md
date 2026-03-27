When vault notes are deleted, surviving notes that linked to them accumulate broken `[[wikilinks]]`. These must be resolved to prevent the vault from becoming a web of dead references.

## Resolution strategies

For each broken wikilink in a surviving note, apply one of three strategies:

1. **Remove from See Also** — if the link is in a `## See also` section and the linked concept has no surviving equivalent in the vault, remove the line entirely. See Also entries are connections, not content; a connection to nothing is noise.
2. **Repoint** — if the link is inline in prose and the concept is described in a surviving note (possibly under a different name or merged into a broader note), update the wikilink to point to the surviving note.
3. **Convert to plain text** — if the link is inline in prose and the concept has no surviving equivalent, replace the `[[wikilink]]` with plain unlinked text. The prose should still read correctly; the concept just loses its hyperlink.

## When to apply

Run wikilink cleanup immediately after deleting notes — not as a deferred task. Broken links left for later are easily forgotten and compound with each subsequent deletion.

When deleting notes in batches, do not clean wikilinks in notes that are themselves scheduled for deletion in the same or a later batch. Check a note's status before fixing its links.

## See also

- [[documentation-note-content-boundary]] — editing notes to remove implementation references can leave the note too thin; deletion may follow, triggering this cleanup
- [[thin-note-threshold]] — a surviving note that loses most of its See Also links may fall below the viability threshold
