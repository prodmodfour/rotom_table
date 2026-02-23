---
review_id: rules-review-128
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-056
domain: character-lifecycle
commits_reviewed:
  - 27ffffd
  - 1180c9c
  - b7c53ee
mechanics_verified:
  - character-creation
  - trainer-hp-formula
  - starting-money
  - stat-allocation
  - quick-create-payload-completeness
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/02-character-creation.md#Page 15 (Combat Stats)
  - core/02-character-creation.md#Page 16 (Derived Stats, Trainer HP, Weight Class)
  - core/02-character-creation.md#Page 17 (Starting Money)
  - core/02-character-creation.md#Page 18 (Quick-Start Steps)
reviewed_at: 2026-02-23T09:15:00Z
follows_up: rules-review-123
---

## Review Scope

Re-review of 3 commits (27ffffd, 1180c9c, b7c53ee) fixing issues raised in code-review-133 for ptu-rule-056 P2. The previous game logic review (rules-review-123) was APPROVED. This review verifies that the SCSS extraction and type-safety fixes did not introduce any functional regressions to PTU character creation mechanics.

## Mechanics Verified

### Trainer HP Formula (QuickCreateForm.vue)

- **Rule:** "Trainer Hit Points = Trainer's Level x 2 + (HP x 3) + 10" (`core/02-character-creation.md#Page 16`)
- **Confirmed on Quick-Start (Page 18):** "Trainers have Hit Points equal to (Trainer Level x2) + (HP x3) + 10."
- **Implementation:** `QuickCreateForm.vue` line 109: `const maxHp = level * 2 + hpStat * 3 + 10`. This is unchanged from the pre-fix code. The `currentHp` is set to `maxHp` on line 130, which is correct for newly created characters.
- **Server-side cross-check:** `server/api/characters/index.post.ts` line 13: `const computedMaxHp = level * 2 + hpStat * 3 + 10`. The server also accepts `body.maxHp` from the client, falling back to its own computation. The Quick Create payload passes both `maxHp` and `currentHp` explicitly, so the client value takes precedence — but both use the same formula, so no discrepancy is possible.
- **Status:** CORRECT

### Starting Money (QuickCreateForm.vue)

- **Rule:** "we recommend all starting Trainers begin with a Pokédex and $5000 to split between spending on supplies and keeping as cash." (`core/02-character-creation.md#Page 17, Step 9`)
- **Implementation:** `QuickCreateForm.vue` lines 112-114: `const money = localForm.characterType === 'player' ? DEFAULT_STARTING_MONEY : 0`. The `DEFAULT_STARTING_MONEY` constant is imported from `useCharacterCreation.ts` line 35 where it is defined as `5000`.
- **Server-side cross-check:** `server/api/characters/index.post.ts` line 43: `money: body.money || 0`. The Quick Create payload includes `money: 5000` for PCs, which the server stores directly. For NPCs, `money: 0` is sent explicitly, and `0 || 0` = 0 on the server side, which is correct.
- **Status:** CORRECT

### Stat Allocation Defaults (QuickCreateForm.vue)

- **Rule:** "Starting Trainers begin with 10 HP and 5 points each in the rest of their Combat Stats." (`core/02-character-creation.md#Page 15, Step 5`)
- **Implementation:** `QuickCreateForm.vue` lines 95-101 define initial form state: `hp: 10, attack: 5, defense: 5, specialAttack: 5, specialDefense: 5, speed: 5`. These are the raw stat values entered directly (Quick Create bypasses the stat-point allocation system and takes raw values). The defaults match PTU base stats for a level 1 trainer with zero additional points.
- **Status:** CORRECT

### QuickCreatePayload Completeness vs PTU Requirements

- **Rule:** PTU character creation (Steps 1-9, pp. 12-17) requires: name, background, skills, edges, features, classes, combat stats, derived stats, description, Pokemon, and money.
- **Implementation:** The `QuickCreatePayload` interface in `app/types/character.ts` (lines 200-210) includes:
  - `name: string` — Step 1/7 (character name)
  - `characterType: CharacterType` — PC vs NPC designation
  - `level: number` — determines stat budgets and derived values
  - `location?: string` — optional location metadata
  - `stats: Stats` — all 6 combat stats (hp, attack, defense, specialAttack, specialDefense, speed) — Step 5
  - `maxHp: number` — derived from Trainer HP formula — Step 6
  - `currentHp: number` — set to maxHp for new characters
  - `money: number` — Step 9 starting money
  - `notes?: string` — freeform notes

- **Fields intentionally omitted from Quick Create:** Background (Step 2), Edges (Step 3), Features/Classes (Step 4), biography fields (Step 7), Skills. This is by design — Quick Create is a "minimal NPC scaffolding" mode (as stated in the mode toggle description). The server endpoint fills in defaults for omitted fields: `trainerClasses: []`, `skills: {}`, `features: []`, `edges: []`, `inventory: []`, `statusConditions: []`, `stageModifiers: { all zeroes }`. These defaults are appropriate for Quick Create — a GM can flesh out the character later via the edit interface.

- **Type alignment with HumanCharacter:** Every field in `QuickCreatePayload` maps to a valid field in `HumanCharacter` or is accepted by the server API. The `stats` field uses the shared `Stats` interface (lines 21-28), which has the same 6 keys as the server's individual stat columns. The `characterType` field uses the shared `CharacterType` union. No type mismatch or field name drift is possible at compile time.

- **Status:** CORRECT — Quick Create includes all fields needed for a mechanically valid (if minimal) character record. The omitted PTU steps are appropriate for the "quick scaffolding" use case and match the server's default-filling behavior.

### No Functional Regressions from SCSS Extraction (27ffffd)

- **Verification:** The commit `27ffffd` moved `.create-form`, `.create-form__section`, `.create-form__actions`, and `.form-row` style definitions from `create.vue`'s scoped style block into `app/assets/scss/_create-form.scss` and registered it in `nuxt.config.ts` SCSS preprocessor imports. This is a purely presentational change — no `<script>` or `<template>` code was modified in the same commit.
- **Cross-check:** The `_create-form.scss` file (55 lines) contains only CSS class definitions with SCSS variables for spacing, colors, and gradients. No JavaScript logic, no computed properties, no game formulas.
- **Full Create form in create.vue** still uses the same class names (`.create-form`, `.create-form__section`, `.create-form__actions`, `.form-row`) in its template, and these classes are now globally available via the SCSS import chain. The Full Create form's HP formula (`useCharacterCreation.ts` line 114: `form.level * 2 + computedStats.value.hp * 3 + 10`), evasion calculations (lines 119-123), stat allocation logic, and validation system are completely untouched.
- **Status:** CORRECT — no functional regression

### No Functional Regressions from Type Safety Fix (1180c9c)

- **Verification:** The commit `1180c9c` replaced `Record<string, unknown>` with `QuickCreatePayload` in two locations: the `defineEmits` call in `QuickCreateForm.vue` (line 87) and the `createHumanQuick` parameter type in `create.vue` (line 423). No runtime behavior changed — the actual payload object constructed in `handleSubmit()` (lines 116-133) is identical. The change only narrows the TypeScript type at the emit boundary.
- **Cross-check:** The `QuickCreatePayload` fields exactly match the object literal emitted in `handleSubmit()`: `name`, `characterType`, `level`, `location` (optional), `stats` (Stats object), `maxHp`, `currentHp`, `money`, `notes` (optional). No field was added, removed, or renamed.
- **Status:** CORRECT — no functional regression

## Summary

All three commits have been reviewed for PTU rule correctness. The changes are strictly presentational (SCSS extraction) and type-narrowing (payload interface), with zero impact on game logic:

1. **Trainer HP formula** (`level * 2 + hp * 3 + 10`) remains correct in both Quick Create and Full Create paths, matching PTU Core p. 16.
2. **Starting money** ($5000 for PCs, $0 for NPCs) is unchanged, matching PTU Core p. 17.
3. **Stat defaults** (HP 10, others 5) match PTU Core p. 15 for level 1 trainers.
4. **QuickCreatePayload** captures all mechanically necessary fields for minimal character creation. Omitted fields (skills, edges, features, classes) are appropriately defaulted by the server.
5. **No errata** entries affect character creation mechanics (`errata-2.md` has no relevant corrections).
6. **No game logic was modified** in any of the three commits. The SCSS extraction and type annotation changes are purely non-functional from a PTU mechanics standpoint.

## Rulings

None required. The previous rulings from rules-review-123 (R1: sub-55-lb WC 3 default, R2: NPC $0 starting money) remain in effect and are unaffected by these commits.

## Verdict

**APPROVED** — No PTU mechanics were modified. The SCSS extraction and type safety fixes are purely presentational/structural changes that do not affect any game logic. All character creation formulas and defaults remain correct per PTU Core Chapter 2.

## Required Changes

None.
