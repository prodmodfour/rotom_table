---
name: find-maturation-tickets
description: Find maturation opportunities in a vault and create tickets in the open folder. Usage: /find-maturation-tickets <ptr|documentation>
---

You are finding maturation tickets in a vault. The vault to mature is: $ARGUMENTS

If no vault was specified, ask the user which vault to mature (ptr or documentation). Only ptr and documentation are valid — reject anything else.

## Context

Read and follow these context injections before starting:
- `.claude/context_injections/vaults/maturation.md` — what maturation means
- `.claude/context_injections/vaults/maturation_tickets.md` — ticket format and lifecycle
- `.claude/context_injections/vaults/explore_vault.md` — how to use the obsidian CLI
- `.claude/context_injections/vaults/zettelkasten.md` — vault note conventions

## Process

1. Explore the vault using the obsidian CLI (`obsidian vault=<vault> ...`). Use a mix of:
   - `search` to find clusters of related notes
   - `read` to examine note content
   - `unresolved` to find broken wikilinks (gaps)
   - `orphans` to find disconnected notes
   - `backlinks` and `links` to trace relationships
   - Sample broadly across different topic areas — don't just read the first 20 notes alphabetically

2. Look for maturation opportunities that need a human decision:
   - Contradictions between notes
   - Vague or imprecise definitions needing sharpening
   - Multi-concept notes that should be atomized
   - Gaps — something that is needed but doesn't exist yet
   - Undefined references — concepts referenced but never defined
   - Loose ends (tying up) — ideas started but not fully explored
   - Loose ends (expanding) — something that could be expanded upon but isn't
   - Decisions that should be reconsidered
   - Implicit connections that should be made explicit

3. For each opportunity that requires a human decision, create a ticket file in `.claude/tickets/maturation_tickets/<vault>/open/` using the ticket template from the maturation_tickets context injection.

4. Ticket filenames: descriptive kebab-case, e.g. `vague-weather-stacking-rules.md`, `gap-mounting-speed-interaction.md`.

5. Fill in ALL sections EXCEPT "# Final Decision" — that is for the human.
   - Topic: concise name for the issue
   - Vault: ptr or documentation
   - Priority: based on how playable the game is without this decision
   - Explanation: thorough bullet points explaining the issue
   - Relevant Notes: reproduce the body text of every relevant note (not just one)
   - Possible Decisions: at least Safe, Moderate, and Radical options with explanation

6. After creating tickets, list them with a one-line summary of each.

## Important

- Do NOT make decisions — only identify things that need human decisions
- Do NOT modify any vault notes — only create ticket files
- Do NOT create tickets for things that are merely incomplete but clearly on track
- Focus on genuine ambiguities, contradictions, and design questions
