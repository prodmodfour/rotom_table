---
review_id: code-review-306
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-022
domain: pokemon-lifecycle
commits_reviewed:
  - cb89b8d9
  - bfa81656
  - 9e0bf8c9
  - b1ab6c93
  - aabbc668
  - 0f1b30e2
files_reviewed:
  - app/prisma/schema.prisma
  - app/types/character.ts
  - app/server/services/pokemon-generator.service.ts
  - app/server/api/pokemon/index.post.ts
  - app/server/api/pokemon/[id].put.ts
  - app/server/utils/serializers.ts
  - app/server/services/entity-builder.service.ts
  - app/components/pokemon/PokemonStatsTab.vue
  - app/server/api/capture/attempt.post.ts
  - .claude/skills/references/app-surface.md
  - artifacts/tickets/in-progress/feature/feature-022.md
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 3
  medium: 2
reviewed_at: 2026-03-03T18:10:00Z
follows_up: null
---

## Review Scope

First review of feature-022 (Pokemon Loyalty System) partial implementation. 6 commits adding:
- Loyalty integer field (0-6) on Pokemon schema with default 3
- Starting loyalty by origin (captured/wild=2, default=3)
- API exposure in serializers, entity-builder, update endpoint
- Display + edit UI in PokemonStatsTab with PhHandshake icon
- Friend Ball +1 loyalty wired to DB update in capture attempt

Checked decrees: decree-035 (base relations ordering) and decree-036 (stone evolution moves) are pokemon-lifecycle domain but do not apply to loyalty. No existing decrees govern loyalty mechanics.

## Issues

### CRITICAL

**C1: `createdPokemonToEntity()` hardcodes `loyalty: 3` instead of using the DB value or `getStartingLoyalty()`**
File: `app/server/services/pokemon-generator.service.ts`, line 335
Severity: CRITICAL (correctness bug — data divergence)

The `createPokemonRecord()` function correctly calls `getStartingLoyalty(input.origin)` and writes the correct loyalty to the database (e.g., 2 for captured/wild). But `createdPokemonToEntity()` — which converts the same `CreatedPokemon` into an in-memory entity for encounter combatants — hardcodes `loyalty: 3`.

This means when a wild Pokemon is generated and immediately added to an encounter (via `buildPokemonCombatant()`), its combatant entity will show loyalty 3 (Neutral) even though the DB record has loyalty 2 (Wary). The combatant entity embedded in the encounter JSON diverges from the canonical DB record.

The root cause is that `CreatedPokemon` does not carry `origin` (only `id`, `species`, `level`, `nickname`, `data`), so `createdPokemonToEntity` cannot call `getStartingLoyalty()`. Two possible fixes:
1. Add `origin` to `CreatedPokemon` interface and thread it from `createPokemonRecord` through to `createdPokemonToEntity`
2. Read the loyalty value back from the DB record in `createPokemonRecord` and include it in `CreatedPokemon`

Fix required before merge.

### HIGH

**H1: No server-side validation on loyalty range (0-6) in update endpoint**
File: `app/server/api/pokemon/[id].put.ts`, line 50
Severity: HIGH (data integrity)

The update endpoint blindly accepts `body.loyalty` and writes it to the database:
```typescript
if (body.loyalty !== undefined) updateData.loyalty = body.loyalty
```

There is no validation that the value is an integer in range [0, 6]. A client could send `loyalty: -1`, `loyalty: 99`, `loyalty: 3.5`, or `loyalty: "banana"`. The UI constrains via dropdown, but the API is the trust boundary.

Add: `if (typeof body.loyalty === 'number' && Number.isInteger(body.loyalty) && body.loyalty >= 0 && body.loyalty <= 6)` guard, or clamp with `Math.max(0, Math.min(6, Math.round(body.loyalty)))`.

**H2: No server-side validation on loyalty in create endpoint**
File: `app/server/api/pokemon/index.post.ts`, line 68
Severity: HIGH (data integrity)

Same issue as H1. The manual creation endpoint accepts `body.loyalty ?? 3` with no type or range check. While the create endpoint is less commonly hit with arbitrary input than update, the same trust-boundary principle applies.

**H3: Five `(as any)` casts for loyalty field across server code**
Files: `serializers.ts` (lines 51, 242), `entity-builder.service.ts` (line 64), `attempt.post.ts` (lines 192, 196)
Severity: HIGH (fragile pattern, silent failures)

All five locations use `(record as any).loyalty` or `(pokemon as any).loyalty` because the Prisma-generated types have not been regenerated after the schema change. The `?? 3` fallback masks what would otherwise be a type error.

This is understandable since `npx prisma generate` cannot be run in the worktree, but it must be addressed before merge. The post-merge instructions should explicitly state: run `npx prisma generate` (not just `npx prisma db push`) and then remove all five `as any` casts. File a follow-up task or add it to the ticket's migration checklist so it is not forgotten.

### MEDIUM

**M1: `getStartingLoyalty()` JSDoc claims traded=1 and bred=4, but neither origin value exists**
File: `app/server/services/pokemon-generator.service.ts`, lines 198-200
Severity: MEDIUM (misleading documentation)

The JSDoc comment says: "Traded: 1 (Resistant), Bred/Egg: 4 (Friendly)" but the `PokemonOrigin` type is `'manual' | 'wild' | 'template' | 'import' | 'captured'` — there is no `'traded'` or `'bred'` origin value, and the switch statement does not handle them. The comment describes aspirational behavior that is not implemented and has no supporting type.

Either remove the traded/bred mentions from the comment (they are already documented in the ticket's "Out of Scope" section), or add a comment noting these are future-scope values. Do not leave a function comment claiming behavior that the function does not implement.

**M2: Duplicate JSDoc block before `getStartingLoyalty()`**
File: `app/server/services/pokemon-generator.service.ts`, lines 193-196
Severity: MEDIUM (code quality)

There are two JSDoc blocks stacked on top of each other:
```typescript
/**
 * Create a Pokemon DB record from generated data.
 * Always sets isInLibrary: true (visible in sheets).
 */
/**
 * Map Pokemon origin to starting loyalty value (PTU Chapter 10).
 * ...
 */
function getStartingLoyalty(origin: PokemonOrigin): number {
```

The first JSDoc belongs to the old `createPokemonRecord` function that was pushed down when `getStartingLoyalty` was inserted. The stale JSDoc should be removed (it now sits orphaned above the wrong function). The actual `createPokemonRecord` function at line 210 no longer has its own JSDoc.

## What Looks Good

1. **Schema design is clean.** `loyalty Int @default(3)` is the right approach — simple integer field with a sensible default. The PTU Chapter 10 rank names are documented in a comment directly in the schema.

2. **TypeScript type change from `loyalty?: number` to `loyalty: number` is correct.** Making it non-optional reflects that every Pokemon now has a loyalty value via the DB default. The old optional type with the intercept-only comment was replaced with a comprehensive Chapter 10 comment.

3. **UI implementation is solid.** The `PokemonStatsTab.vue` additions follow the existing component patterns (props/emits, no prop mutation). The PhHandshake icon follows the project icon standard. Color-coded loyalty ranks (`loyalty--low` through `loyalty--devoted`) provide good visual feedback. The dropdown select for editing is a sensible UX choice for a 7-value enum. File is 494 lines, well under the 800-line limit.

4. **Friend Ball +1 loyalty in `attempt.post.ts` is correctly implemented.** The `Math.min(6, currentLoyalty + 1)` clamp prevents exceeding max rank. The `?? 2` fallback is correct for the capture context (wild Pokemon default to loyalty 2). The descriptive message showing the transition (`Loyalty: 2 -> 3`) is a nice touch.

5. **Commit granularity is good.** Schema + type in one commit, starting values in another, API exposure separate from UI, Friend Ball as its own commit. Each commit produces a working state.

6. **Documentation is thorough.** The ticket was properly moved to `in-progress/`, the resolution log records each commit, the app-surface.md entry covers the full feature surface, and the out-of-scope items are clearly documented.

## Verdict

**CHANGES_REQUIRED** — One critical correctness bug (C1: in-memory entity diverges from DB on loyalty for encounter combatants) must be fixed. Three high-severity issues (H1-H2: input validation, H3: `as any` removal plan) also require attention before merge.

## Required Changes

1. **[CRITICAL] Fix `createdPokemonToEntity()` loyalty divergence.** Thread the origin (or the computed loyalty value) from `createPokemonRecord` through `CreatedPokemon` to `createdPokemonToEntity` so the in-memory entity matches the DB record.

2. **[HIGH] Add server-side loyalty range validation** to both `PUT /api/pokemon/:id` and `POST /api/pokemon` — validate integer type and 0-6 range before writing to DB.

3. **[HIGH] Document the `as any` removal** as a mandatory post-merge step in the ticket. After `npx prisma generate` runs, all five `as any` casts for loyalty must be removed and the code must compile cleanly without them.

4. **[MEDIUM] Fix the stale JSDoc** above `getStartingLoyalty()` (remove the orphaned `createPokemonRecord` comment) and remove the traded/bred claims from `getStartingLoyalty()`'s own JSDoc, or explicitly mark them as future-scope.
