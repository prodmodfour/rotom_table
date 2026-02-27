---
review_id: code-review-030
review_type: code
reviewer: senior-reviewer
trigger: refactoring
target_report: refactoring-025
domain: code-health
commits_reviewed:
  - 93f842b
  - aa4286a
files_reviewed:
  - app/types/character.ts
  - app/server/services/combatant.service.ts
  - app/server/services/pokemon-generator.service.ts
  - app/tests/unit/stores/library.test.ts
  - app/pages/gm/characters/[id].vue
  - app/pages/gm/pokemon/[id].vue
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
scenarios_to_rerun: []
reviewed_at: 2026-02-18T09:50:00
---

## Summary

Clean refactoring that adds missing healing tracking fields to `HumanCharacter` and `Pokemon` type definitions, updates all entity builders to include them, and removes all 13 `as any` casts across both sheet pages.

## Commit Review

### 93f842b — Add healing tracking fields to types + entity builders + test fixtures

**Scope:** 4 files, +28 lines

- `app/types/character.ts`: Added `restMinutesToday`, `lastInjuryTime`, `injuriesHealedToday` to both `Pokemon` and `HumanCharacter`. Added `drainedAp` to `HumanCharacter` only. Types match Prisma schema exactly (`DateTime?` → `string | null`, `Int @default(0)` → `number`).
- `app/server/services/combatant.service.ts`: Both `buildPokemonEntityFromRecord` and `buildHumanEntityFromRecord` now include the new fields. `lastInjuryTime` correctly serialized via `?.toISOString() ?? null`.
- `app/server/services/pokemon-generator.service.ts`: `createdPokemonToEntity` initializes all 3 Pokemon fields to defaults (0, null, 0). Correctly omits `drainedAp` (Pokemon don't have AP).
- `app/tests/unit/stores/library.test.ts`: Both `createMockHuman` and `createMockPokemon` fixtures updated with matching defaults.

### aa4286a — Remove all as-any casts

**Scope:** 2 files, 13 lines changed (cast removal only)

- `app/pages/gm/characters/[id].vue`: 10 `(character as any).X` → `character.X` and 4 `(character.value as any).X` → `character.value.X` replacements in template + script.
- `app/pages/gm/pokemon/[id].vue`: 3 `(pokemon.value as any).X` → `pokemon.value.X` replacements in `healingInfo` computed.

## Verification

- **Zero `as any` remaining** in `app/pages/gm/characters/[id].vue` — confirmed via grep
- **Zero `as any` remaining** in `app/pages/gm/pokemon/[id].vue` — confirmed via grep
- **Zero `as any` remaining** in `app/pages/` and `app/server/` — confirmed via grep
- **All 3 entity construction sites updated**: `buildHumanEntityFromRecord`, `buildPokemonEntityFromRecord`, `createdPokemonToEntity`
- **Prisma schema alignment**: All 4 fields exist in HumanCharacter model; 3 fields (no `drainedAp`) in Pokemon model — matches type definitions exactly
- **508/508 unit tests pass** — confirmed by running `npx vitest run`
- **No behavioral changes** — purely additive type declarations + cast removal. Entity builders were already returning these fields from Prisma records; the TypeScript interfaces just weren't declaring them.

## What Looks Good

- Clean 2-commit split: types+builders first, then cast removal. Each commit leaves the project in a valid state.
- Correct `drainedAp` asymmetry — only on HumanCharacter, not Pokemon (Pokemon don't use AP in PTU).
- `lastInjuryTime` serialization handled correctly at the entity builder level (`DateTime?.toISOString() ?? null`).
- Test fixtures updated in the same commit as the type changes.

## Verdict

**APPROVED** — no issues. Proceed to Game Logic Reviewer.
