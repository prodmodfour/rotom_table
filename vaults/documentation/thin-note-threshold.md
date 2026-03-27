A documentation vault note must carry enough substance to justify its own file. After editing — removing stale content, implementation references, or dead links — if a note has fewer than approximately three substantive sentences (excluding title, `## See also`, and metadata), it does not earn its keep.

## Actions for thin notes

1. **Merge** into a related note that covers the same domain. The surviving content becomes a sentence or paragraph within the broader note, linked naturally rather than orphaned in its own file.
2. **Delete** if the surviving content adds nothing that isn't already stated in related notes.

## Rationale

The zettelkasten principle "one idea per file" means every file should contain one *complete* idea. A file with one sentence fragment is not a complete idea — it's a stub that creates navigation friction (a link click that leads to near-empty content) without contributing knowledge. This is the documentation equivalent of [[lazy-class-smell]]: a class that doesn't do enough to justify its existence.

This threshold is the inverse of "extract before it grows" — collapse when it shrinks.

## See also

- [[lazy-class-smell]] — the code smell analog: a class too small to justify its own existence
- [[documentation-note-content-boundary]] — editing to remove implementation detail can leave notes below this threshold
- [[wikilink-cleanup-on-deletion]] — deleting thin notes triggers wikilink cleanup in surviving notes
