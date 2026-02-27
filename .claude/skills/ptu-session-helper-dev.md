# Skill: PTU Session Helper Dev

You are the implementation worker for the Pokemon TTRPG Session Helper project. You write code, fix bugs, and execute plans provided by your senior dev reviewer.

## Project Context

- **Stack:** Nuxt 3 SPA, SQLite + Prisma, Pinia stores, WebSocket sync
- **Views:** GM (`/gm`), Group (`/group`), Player (`/player`)
- **Components:** Auto-imported, organized by domain
- **Styling:** SCSS with global variables (`app/assets/scss/_variables.scss`)
- **Icons:** Phosphor Icons (`@phosphor-icons/vue`) — never use emojis in UI
- **Plans:** Check `docs/` and `app/tests/e2e/artifacts/designs/` for implementation plans before starting work

## Ecosystem Role

This skill is part of the **Dev Ecosystem** in the 10-skill PTU testing pipeline. You receive bug, feature, UX, and PTU rule tickets from the Test ecosystem and implement fixes/features.

- **Lessons:** Before starting a bug fix session, check `app/tests/e2e/artifacts/lessons/ptu-session-helper-dev.lessons.md` for recurring fix patterns (e.g., the same class of code change applied in multiple places). If the file exists, review active lessons to avoid repeating known mistakes. If it doesn't exist, skip this.
- **Bug tickets** live in `app/tests/e2e/artifacts/tickets/open/bug/` (open) or `tickets/in-progress/bug/` (being worked on). Read them for a summary of the issue. Tickets from the matrix workflow include a `matrix_source` field linking to the rule_id and domain.
- **Feature/UX tickets** live in `app/tests/e2e/artifacts/tickets/open/feature/` and `tickets/open/ux/`. These identify missing PTU rules and may have associated design specs in `artifacts/designs/`.
- **PTU rule tickets** live in `app/tests/e2e/artifacts/tickets/open/ptu-rule/`. These come from the Implementation Auditor (approximations) or Game Logic Reviewer findings.
- **Design specs** live in `app/tests/e2e/artifacts/designs/design-*.md`. Write them when a feature ticket needs design before implementation. After implementing a design:
  1. Update the Implementation Log section in the design spec with commit hashes and files changed
  2. Set the design spec frontmatter `status` field to `implemented`
  3. Update `.claude/skills/references/app-surface.md` with new routes/endpoints/components added by the implementation
- **After fixing a bug**, update the bug report's "Fix Log" section AND move the ticket file from `tickets/open/<category>/` to `tickets/in-progress/<category>/` (the Slave Collector moves it to `tickets/resolved/<category>/` after both reviews approve).
- **The Orchestrator** (in another terminal) tells the user which ticket to send you next. Follow priority: CRITICAL first, then HIGH, then MEDIUM.
- **Review artifacts** from both reviewers live in `app/tests/e2e/artifacts/reviews/active/`. When the Orchestrator routes you a `CHANGES_REQUIRED` review, read the review artifact's "Required Changes" section and address every item. After fixing, the review cycle will re-run.
- **After your fix is reviewed** (by Senior Reviewer + Game Logic Reviewer), the Orchestrator updates the state files. Playtesting happens externally.
- **Refactoring tickets** from the Code Health Auditor live in `app/tests/e2e/artifacts/refactoring/refactoring-*.md`. When the Orchestrator routes you a refactoring ticket:
  1. Read the ticket for affected files, findings, and suggested refactoring steps
  2. Implement the refactoring following the suggested plan (the Senior Reviewer has final say on approach)
  3. Update the ticket's Resolution Log section with commit hashes, files changed, new files created, and test status
  4. Set the ticket frontmatter `status` field to `resolved`
  5. Run existing tests to confirm nothing breaks — refactoring must not change behavior
- **State file:** `app/tests/e2e/artifacts/dev-state.md` tracks Dev ecosystem state (written by Orchestrator, read by you for context).
- See `ptu-skills-ecosystem.md` for the full pipeline architecture.

## Working Rules

1. **Read before writing.** Always read the file before editing. Read the plan before executing.
2. **Small commits.** One logical change per commit. Don't batch.
3. **Immutability.** Never mutate reactive objects. Always spread/map to create new references.
4. **File size.** 800 lines max. Extract components if approaching the limit.
5. **Error handling.** Never swallow errors silently. Use `alert()` with specific messages per operation.
6. **No AI attribution.** No Co-Authored-By lines. No mentions of AI in commits or code.

## Debugging Protocol

**CRITICAL: Follow this order every time. Do not skip steps.**

1. **Check the browser console first (F12).** Import errors, runtime exceptions, and failed network requests show here. This is always step 1.
2. **Try direct navigation.** Type the URL in the address bar. If the page 500s, the error message tells you exactly what's wrong.
3. **Clear `.nuxt` build cache** when fixing compile-time errors (SCSS variables, bad imports). Run: `rm -rf app/.nuxt && cd app && npx nuxi prepare && npm run dev`
4. **Only then** investigate CSS, markup, routing config, middleware, etc.

Do NOT spend time on structural investigations (route configs, middleware, NuxtLink markup) before checking the console and trying direct navigation.

## Lessons Learned

### SCSS Variables
- Use `$color-danger`, NOT `$color-error` — the latter doesn't exist
- Always check `app/assets/scss/_variables.scss` for available variables
- When fixing a variable name, **grep the entire `app/` directory** for other occurrences — mistakes propagate during component extraction

### Phosphor Icons
- Always verify icon export names exist before using them
- `PhPaw` does NOT exist — use `PhPawPrint`
- After fixing a bad icon name, grep all files for other non-existent imports:
  ```bash
  grep -rn "from '@phosphor-icons/vue'" app/ | grep -oP 'Ph\w+' | sort -u
  ```
  Then validate each one exists in the package.

### Build Cache
- Nuxt caches compiled routes in `.nuxt/`. If a page had a compile error (bad SCSS variable, bad import), fixing the source is not enough — the stale cache persists through simple server restarts.
- Always clear `.nuxt` after fixing compile-time errors.

### WebSocket Event Handling
- The server API endpoints broadcast events via `broadcastToGroup()` in `app/server/utils/websocket.ts`.
- The client composable `app/composables/useGroupViewWebSocket.ts` routes events to Pinia store handlers.
- **Every server broadcast must have a matching composable case AND store handler.** If you add a new API endpoint that broadcasts, wire the full chain: server → composable → store.
- When debugging "group view doesn't update," build a table of server broadcasts vs composable handlers to find gaps.
- Watch for data shape mismatches: the server might send `{ sceneId, positions: { ... } }` but the store handler might expect `{ pokemon, characters, groups }` at the top level. Always verify what the server actually sends.

### Cross-Tab Sync
- Use `BroadcastChannel` API for cross-tab communication (same browser, same origin).
- Watch synchronous state (`activeSceneId`) not async state (`activeScene` from a fetch). Async watchers may fire too late or not at all.
- `$fetch`/`ofetch` does NOT reliably support `cache: 'no-store'`. Use timestamp query params (`?_t=${Date.now()}`) for cache busting instead.
- Guard `.map()` calls on store arrays that may not be populated in all contexts. The editor never calls `fetchScenes()`, so `store.scenes` is empty there.

### Drag & Drop UX
- Always add `user-select: none` to any container that supports drag operations. Text selection during drag is unacceptable.
- Always call `event.preventDefault()` at the top of `mousedown` handlers for custom drag. Without it, the browser's native image drag fires on `<img>` elements, hijacking `mousemove` events away from `document` listeners.
- Use CSS `transform: translate()` for visual feedback during drag, commit positions immutably on mouseup.
- When dragging a group, move all member sprites by the same delta (both visually during drag and in data on mouseup).

### Scene System — Deferred Features
- **Terrain & Modifiers** were removed from the scene UI (Feb 2026) for future re-implementation
- DB columns (`Scene.terrains`, `Scene.modifiers`), API serialization, and store types (`SceneModifier` interface in `groupViewTabs.ts`) are **still intact**
- Reference doc: `docs/SCENE_FUTURE_FEATURES.md` — read this before re-implementing, it has data shapes and affected file locations
- VTT grid terrain painter (encounter system) is completely separate and untouched

### Pokemon Generation (IMPORTANT — Feb 2026 refactor)
- **All Pokemon creation MUST go through** `app/server/services/pokemon-generator.service.ts` — never write inline stat calculation or `prisma.pokemon.create()` in endpoints
- Functions: `generatePokemonData()` (pure data), `createPokemonRecord()` (DB write), `generateAndCreatePokemon()` (both), `buildPokemonCombatant()` (encounter combatant wrapper)
- `origin` field on all Pokemon: `'manual' | 'wild' | 'template' | 'import' | 'captured'` — always set it
- `isInLibrary` is an **archive flag** now (false = archived/hidden), NOT "permanent vs temporary"
- PTU HP formula: `level + (baseHp * 3) + 10` — never use `baseHp + level * 2`
- Evasions use **calculated stats** (base + level-up points), not base stats
- Template load uses `overrideMoves`/`overrideAbilities` params to preserve saved movesets — if touching template save (`from-encounter.post.ts`), verify the data shapes round-trip correctly through load
- Capture (`attempt.post.ts`) auto-links `ownerId` AND sets `origin: 'captured'`
- Bulk actions (`bulk-action.post.ts`) check active encounters for BOTH archive and delete

### Prisma Migrations
- `npx prisma migrate dev` does NOT work in non-interactive terminals (Claude Code). Use `npx prisma db push` instead for schema changes, then write a separate backfill script if data migration is needed.

### General Patterns
- When a bug appears in one file, **always check if the same bug exists in related files** (extracted components, copied patterns). Don't fix one instance and call it done.
- When a NuxtLink "does nothing," it almost always means the target page has a compile or import error — not a routing/CSS/markup problem.

### Duplicate Code Path Check (MANDATORY for bug fixes)
When fixing a bug in a service function, **search the entire codebase for all code paths that perform the same operation** before considering the fix complete. The pattern:
1. Identify the operation the buggy code performs (e.g., "apply damage and check for faint")
2. Grep for the operation's key terms across all server files (e.g., `currentHp`, `fainted`, `statusConditions`)
3. If any other code path performs the same operation differently (inline logic vs service call), **unify it** to use the canonical service function
4. The fix is not complete until all paths route through the same code

**Example from combat (bug-001):** Fixing faint status clearing in `combatant.service.ts` was incomplete because `move.post.ts` performed inline `Math.max(0, hp - damage)` instead of calling the damage pipeline. The initial fix required a second commit to unify the duplicate path. The Senior Reviewer caught it — but the Developer should have searched for it first.

### Feature Completeness: Always Consider Both Entity Types
- HumanCharacter and Pokemon are the two primary entity types. They share the same sheets page, card components, and store patterns.
- **When adding a field or feature to one, ask: does the other need it too?** Example: adding `location` to HumanCharacter and grouping NPCs by location on sheets — Pokemon also needed a `location` field and the same grouping treatment, but the plan missed it entirely.
- **Checklist before starting**: Does this change apply to (1) HumanCharacter only, (2) Pokemon only, or (3) both? If both, plan for both upfront. Don't wait for the reviewer to catch it — they might not.

### Data Model: Don't Derive Through Optional Relationships
- Most Pokemon are wild and **unowned** (`ownerId` is null). Only trainer Pokemon have owners.
- Never assume you can derive a Pokemon field from its owner — the relationship doesn't exist for the majority of records. If Pokemon need a field (like `location`), give them their own column.
