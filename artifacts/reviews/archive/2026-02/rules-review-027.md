---
review_id: rules-review-027
target: refactoring-025
trigger: developer-fix-review
reviewer: game-logic-reviewer
verdict: APPROVED
date: 2026-02-18
commits_reviewed:
  - 93f842b
  - aa4286a
---

# Rules Review: refactoring-025

## Scope

- [x] Healing tracking fields added to `HumanCharacter` and `Pokemon` types
- [x] Entity builders updated to map DB fields to typed properties
- [x] 13 `as any` casts removed from character and pokemon sheet pages
- [x] Test fixtures updated with new fields

## Mechanics Verified

### 1. Rest HP Healing — `restMinutesToday` field

- **Rule:** "For the first 8 hours of rest each day, Pokémon and Trainers that spend a continuous half hour resting heal 1/16th of their Maximum Hit Points." (PTU 1.05, 07-combat.md:1995-1998)
- **Implementation:** `restMinutesToday: number` on both `Pokemon` and `HumanCharacter` types. Prisma schema comment says "max 480 for HP regen" (8 hours = 480 minutes). Both entity builders map from `record.restMinutesToday`. New Pokemon default to 0.
- **Status:** CORRECT
- **Notes:** Field exists on both types, matching the rule that both Trainers and Pokemon benefit from rest healing.

### 2. Natural Injury Healing — `lastInjuryTime` field

- **Rule:** "If a Pokémon or Trainer has an Injury, they can naturally heal from a single Injury if they go 24 hours without gaining any new injuries." (PTU 1.05, 07-combat.md:2004-2006)
- **Implementation:** `lastInjuryTime: string | null` on both types. Prisma stores as `DateTime?`, entity builders convert via `?.toISOString() ?? null`. New Pokemon default to `null`.
- **Status:** CORRECT
- **Notes:** `string | null` is the correct client-side representation — `useRestHealing.ts` accepts `Date | string | null` and converts via `new Date()`.

### 3. Daily Injury Healing Cap — `injuriesHealedToday` field

- **Rule:** "Pokémon Centers can remove a maximum of 3 Injuries per day; Injuries cured through natural healing, Bandages, or Features count toward this total." (PTU 1.05, 07-combat.md:2026-2028)
- **Implementation:** `injuriesHealedToday: number` on both types. Prisma comment: "max 3 from Pokemon Center". Both entity builders map from DB. New Pokemon default to 0.
- **Status:** CORRECT
- **Notes:** Field exists on both types, matching the rule that the 3/day cap applies to both Trainers and Pokemon.

### 4. Drained AP — `drainedAp` field

- **Rule:** "Trainers can also remove Injuries as an Extended Action by Draining 2 AP." and "Extended rests... restore a Trainer's Drained AP." (PTU 1.05, 07-combat.md:2006-2011)
- **Implementation:** `drainedAp: number` on `HumanCharacter` only. NOT on `Pokemon` type.
- **Status:** CORRECT
- **Notes:** AP (Action Points) are a Trainer-only resource. Pokemon do not have AP and cannot drain AP to heal injuries. The field is correctly absent from the `Pokemon` type and absent from the Pokemon Prisma model.

### 5. 5+ Injuries Rest Block — UI text

- **Rule:** "a Trainer or Pokémon is unable to restore Hit Points through rest if the individual has 5 or more injuries." (PTU 1.05, 07-combat.md:1999-2003)
- **Implementation:** Template checks `character.injuries >= 5` and shows "(Cannot rest-heal)". Previously used `(character as any).injuries >= 5` — same logic, now type-safe.
- **Status:** CORRECT

### 6. Healing UI descriptions (context lines in diff)

- **"Heal 1 injury after 24 hours without gaining new injuries. Max 3 injuries healed per day from all sources."** — matches PTU 07-combat.md:2004-2006 and 2026-2028. CORRECT.
- **"Drain 2 AP to heal 1 injury as an Extended Action. Subject to daily injury limit."** — matches PTU 07-combat.md:2006-2008. CORRECT.

## Type-to-Schema Alignment

| Field | TypeScript Type | Prisma Type | Match |
|-------|----------------|-------------|-------|
| `restMinutesToday` | `number` | `Int @default(0)` | YES |
| `lastInjuryTime` | `string \| null` | `DateTime?` | YES (ISO string serialization) |
| `injuriesHealedToday` | `number` | `Int @default(0)` | YES |
| `drainedAp` | `number` (HumanCharacter only) | `Int @default(0)` (HumanCharacter only) | YES |

## Entity Builder Verification

| Builder | Fields Mapped | Defaults Correct |
|---------|--------------|-----------------|
| `buildPokemonEntityFromRecord` | 3/3 (restMinutesToday, lastInjuryTime, injuriesHealedToday) | N/A — maps from DB |
| `buildHumanEntityFromRecord` | 4/4 (+ drainedAp) | N/A — maps from DB |
| `createdPokemonToEntity` | 3/3 | YES — 0, null, 0 |

## Cast Removal Verification

All 13 `as any` casts replaced with direct property access. No logic changes — only the type assertion was removed. The underlying field references are identical.

- `characters/[id].vue`: 10 casts removed (template: 5, script: 4, v-if: 1)
- `pokemon/[id].vue`: 3 casts removed (script computed)

## Pre-Existing Issues

None found. The healing UI text in the touched files accurately reflects PTU rest/healing rules. No PTU incorrectness observed in the surrounding code.

## Summary

- Mechanics checked: 6
- Correct: 6
- Incorrect: 0
- Needs review: 0
- Pre-existing issues: 0

## Verdict

**APPROVED** — This is a purely structural refactoring. No game logic was introduced or modified. The type definitions now correctly mirror the existing Prisma schema and API response shapes. All field names, types, and presence/absence (e.g., `drainedAp` on Trainer only) align with PTU 1.05 rest and healing rules.
