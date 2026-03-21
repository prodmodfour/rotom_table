# Observing the App into the App Vault

- Target vault: `vaults/app/`
- Observations come from two sources: **the running app** (via `playwright-cli`) and **the codebase** (via reading source files).
- Decompose what you find into atomic Zettelkasten files.
- **Every distinct observation becomes its own file.** No exceptions — even a single sentence is valid if it's one observation.
- **Never combine two observations into one file.** If you're unsure whether something is one observation or two, it's two.
- **File names should be short, lowercase, hyphenated noun phrases** that name the observation (e.g., `damage-panel-shows-step-breakdown.md`, `turn-tracker-highlights-active-combatant.md`, `capture-store-queues-pending-rolls.md`, `damage-composable-delegates-to-api.md`).

## Linking

- **Inline first.** When the body text references another observation, use a `[[wikilink]]` right there — e.g., "clicking the attack button opens the [[damage-panel-shows-step-breakdown]]", or "the [[damage-composable-delegates-to-api]] produces the values shown in the [[damage-panel-shows-step-breakdown]]". The surrounding sentence should make clear *why* the connection exists.
- **`## See also` for real but awkward connections.** If a connection is genuine but doesn't fit naturally into the prose, list it under `## See also`. This is not a dumping ground — every entry must be a relationship you could explain if asked.
- **Link across perspectives.** Usage observations and codebase observations should link to each other freely. A UI behavior that depends on a particular data flow, a component that renders a particular panel — these are exactly the connections that make the vault useful.
- **Link on conceptual relationships, not just topical similarity.** Worth linking: UI elements that trigger each other, behaviors that depend on each other, interactions that share state, code structures that produce visible outcomes. Not worth linking: two notes that happen to describe the same page or the same directory.
- **Before writing any new file, search the vault for related notes** by keyword, principle, or domain. Read the matches, then update them to link to the new note where appropriate. New notes must not be orphans, and existing notes must not ignore relevant new arrivals.

## Content

- **Do not restate content from other files.** Link to them instead.
- **Describe what is, not what should be.** For usage observations, write from the perspective of someone using the app. For codebase observations, write from the perspective of someone reading the source.
- **Do not editorialize or judge.** Describe neutrally — never label something a bug, issue, problem, or anti-pattern.
- **Always create notes for surprising or unusual things** — whether that's a UI behavior you didn't expect or a code structure that's unconventional. Describe it neutrally.
- **This vault is self-contained.** Do not link to notes in the PTR or documentation vaults.
- After observing, list every file you created/modified so the user can review.
