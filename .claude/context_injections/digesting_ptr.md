# Digesting Notes into the PTR Vault

- Target vault: `vaults/ptr/`
- You are receiving raw, unstructured notes from the user. Decompose them into atomic Zettelkasten files.
- **Every distinct rule, mechanic, formula, game design principle, or constraint becomes its own file.** No exceptions — even a single sentence is valid if it's one idea.
- **Never combine two ideas into one file.** If you're unsure whether something is one idea or two, it's two.
- **File names should be short, lowercase, hyphenated noun phrases** that name the idea (e.g., `gm-as-narrator.md`, `fog-of-war-intent.md`, `combat-should-feel-weighty.md`).

## Linking

- **Inline first.** When the body text references another concept, use a `[[wikilink]]` right there — e.g., "this exists because [[combat-should-feel-weighty]]". The surrounding sentence should make clear *why* the connection exists.
- **`## See also` for real but awkward connections.** If a connection is genuine but doesn't fit naturally into the prose, list it under `## See also`. This is not a dumping ground — every entry must be a relationship you could explain if asked.
- **Link on conceptual relationships, not just topical similarity.** Worth linking: shared principles, tensions, constraints, dependencies, contradictions. Not worth linking: two notes that happen to mention the same feature.
- **Before writing any new file, search the vault for related notes** by keyword, principle, or domain. Read the matches, then update them to link to the new note where appropriate. New notes must not be orphans, and existing notes must not ignore relevant new arrivals.

## Content

- **Do not restate content from other files.** Link to them instead.
- **Do not editorialize or expand** on what the user wrote. Capture their intent faithfully. Rephrase only for clarity, never for substance.
- After digesting, list every file you created/modified so the user can review.
