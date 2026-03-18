# Git & Attribution Rules

- **Never push commits as Claude** - Do not use Claude or any AI identity as the commit author
- **Never include AI attribution** - Do not add "Co-Authored-By: Claude" or similar AI attribution lines
- **No AI-generated mentions** - Do not mention that code was AI-generated in commits, comments, or documentation
- Commits should appear as if written by the human developer

# Commit Guidelines

## CRITICAL: Small, Frequent Commits

**Commit early and often. Do NOT batch multiple changes into one commit.**

- After completing ANY single logical change, commit immediately
- One file changed? Commit it
- One function added? Commit it
- One bug fixed? Commit it
- Do NOT wait until "everything is done" to commit
- Do NOT combine unrelated changes in one commit

**Examples of correct granularity:**
- `fix: correct damage calculation for steel types` (1 file)
- `refactor: extract useGridMovement composable` (2-3 files)
- `feat: add fog of war toggle button` (1 component)

**Examples of commits that are TOO LARGE:**
- "feat: add fog of war system" (10+ files - should be 3-5 commits)
- "refactor: improve encounter system" (vague, too broad)

## Other Guidelines

- **Conventional commits** - Use prefixes: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- **Descriptive messages** - Include what changed and why
- **Only commit relevant files** - Don't include unrelated changes, test artifacts, or logs
- **Don't wait to be asked** - Proactively commit after completing meaningful work