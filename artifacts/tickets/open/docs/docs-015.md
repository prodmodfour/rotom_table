---
id: docs-015
title: "Slim root CLAUDE.md — replace data models and PTU section with cross-references"
priority: P0
severity: MEDIUM
status: open
domain: workflow
source: plan-descendant-claude-md-rollout
created_by: user
created_at: 2026-03-02
phase: 4
depends_on:
  - docs-006
  - docs-008
affected_files:
  - CLAUDE.md (modify)
---

# docs-015: Slim root CLAUDE.md — replace data models and PTU section with cross-references

## Summary

After descendant CLAUDE.md files are created in Phase 1-3, the root `CLAUDE.md` contains duplicated content in its Data Models section (lines 35-44) and PTU Rules Reference section (lines 87-92). Replace these with cross-references to the descendant files and update the descendant file listing on line 3.

## Depends On

This ticket should only be executed AFTER these tickets are resolved:
- docs-006 (prisma CLAUDE.md)
- docs-008 (books/markdown CLAUDE.md)

## Changes Required

### 1. Update descendant listing (line 3)
Current:
```
Descendant CLAUDE.md files exist in `app/`, `app/server/`, `scripts/`, and `ux-sessions/` for domain-specific context.
```
Replace with:
```
Descendant CLAUDE.md files exist in 17 directories for domain-specific context: `app/`, `app/components/encounter/`, `app/components/scene/`, `app/components/vtt/`, `app/composables/`, `app/prisma/`, `app/server/`, `app/server/api/`, `app/server/services/`, `app/stores/`, `app/tests/`, `app/types/`, `artifacts/`, `books/markdown/`, `decrees/`, `scripts/`, `ux-sessions/`.
```

### 2. Replace Data Models section (lines 35-44)
Current: 10 lines listing all 14 Prisma models with descriptions.
Replace with:
```markdown
## Data Models
14 Prisma models — see `app/prisma/CLAUDE.md` for schema relationships, origin enum, JSON field conventions, and seed sources.
```

### 3. Replace PTU Rules Reference section (lines 87-92)
Current: 5 lines describing books/markdown directory structure.
Replace with:
```markdown
## PTU Rules Reference
Complete PTU 1.05 ruleset in `books/markdown/` — see `books/markdown/CLAUDE.md` for chapter→topic lookup table, pokedex format, and authority chain (decrees > errata > core text).
```

## What to Keep
- Tech Stack section (lines 5-12) — project overview, always relevant
- Project Structure section (lines 14-33) — directory tree, always relevant
- Icons & Sprites section (lines 46-49) — app-wide concern
- Git & Attribution Rules (lines 51-56) — critical policy
- Commit Guidelines (lines 58-85) — critical policy
- Feature Development Pattern (lines 94-106) — workflow pattern
- Design Decrees (lines 108-116) — workflow pattern

## Expected Result
~117 lines → ~95 lines. Removes ~17 lines of detail, adds ~5 lines of cross-references.

## Verification
- No content lost — all removed content exists in descendant CLAUDE.md files
- Cross-reference paths are correct relative to project root
- Descendant listing on line 3 lists all 17 CLAUDE.md locations
- Policy sections preserved unchanged
