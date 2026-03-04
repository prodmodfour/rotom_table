---
review_id: rules-review-266
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-006
domain: pokemon-lifecycle
commits_reviewed:
  - 1642491f
  - a9a4789c
  - 93ebfcee
  - 854a0d97
  - 34165cb6
mechanics_verified:
  - seed-parser-learn-keyword
  - seed-parser-gender-keyword
  - evolution-undo-notes-restore
  - evolution-undo-stone-restore
  - stone-consumption-atomicity
  - gm-override-missing-stone
  - decree-035-compliance
  - decree-036-compliance
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/05-pokemon.md#Evolution
  - pokedexes/gen2/aipom.md#Evolution
  - pokedexes/gen2/yanma.md#Evolution
  - pokedexes/gen2/piloswine.md#Evolution
  - pokedexes/gen1/lickitung.md#Evolution
  - pokedexes/gen1/tangela.md#Evolution
  - pokedexes/gen4/bonsly.md#Evolution
  - pokedexes/gen4/mime-jr.md#Evolution
  - pokedexes/gen7/steenee.md#Evolution
  - pokedexes/gen4/combee.md#Evolution
  - pokedexes/gen4/burmy.md#Evolution
  - pokedexes/gen3/kirlia.md#Evolution
reviewed_at: 2026-03-02T22:30:00Z
follows_up: rules-review-224
---

## Mechanics Verified

### 1. Seed Parser: "Learn" Keyword Fix (rules-review-224 C1) -- RESOLVED

**Rule:** PTU pokedex entries encode move-based evolution triggers with the pattern `<SpeciesName> Learn <MoveName>`, e.g., "Ambipom Learn Double Hit".

**Fix (commit a9a4789c):** `parseEvoLineSpeciesAndTrigger()` in `app/prisma/seed.ts` line 257 now includes `Learn` in the `triggerKeywords` regex:

```
/\b(Minimum|Holding|Learn|Male|Female|Water Stone|Fire Stone|...)\b/i
```

**Trace verification for all 7 previously affected species:**

1. **Aipom -> Ambipom ("Ambipom Learn Double Hit")**
   - `parseEvoLineSpeciesAndTrigger`: "Learn" keyword found at index 8, splits to `{ speciesName: "Ambipom", triggerText: "Learn Double Hit" }`
   - `parseEvolutionTriggerText`: `learnMatch` captures "Double Hit", returns `{ requiredMove: "Double Hit" }`
   - Status: CORRECT

2. **Yanma -> Yanmega ("Yanmega Learn Ancient Power")**
   - "Learn" found, splits correctly. Returns `{ requiredMove: "Ancient Power" }`
   - Status: CORRECT

3. **Piloswine -> Mamoswine ("Mamoswine Learn Ancient Power")**
   - "Learn" found, splits correctly. Returns `{ requiredMove: "Ancient Power" }`
   - Status: CORRECT

4. **Lickitung -> Lickilicky ("Lickilicky Learn Rollout")**
   - "Learn" found, splits correctly. Returns `{ requiredMove: "Rollout" }`
   - Status: CORRECT

5. **Tangela -> Tangrowth ("Tangrowth Learn Ancient Power")**
   - "Learn" found, splits correctly. Returns `{ requiredMove: "Ancient Power" }`
   - Status: CORRECT

6. **Mime Jr. -> Mr. Mime ("Mr. Mime Learn Mimic")**
   - "Learn" found, splits correctly. Returns `{ requiredMove: "Mimic" }`
   - Status: CORRECT

7. **Steenee -> Tsareena ("Tsareena Learn Stomp")**
   - "Learn" found, splits correctly. Returns `{ requiredMove: "Stomp" }`
   - Status: CORRECT

**Previously unaffected species still correct:**

8. **Bonsly -> Sudowoodo ("Sudowoodo Minimum Learn Mimic")**
   - "Minimum" keyword found first (before "Learn"). Splits to `{ speciesName: "Sudowoodo", triggerText: "Minimum Learn Mimic" }`
   - `parseEvolutionTriggerText`: `learnMatch` captures "Mimic", remaining becomes empty (edge case handled at line 308). Returns `{ requiredMove: "Mimic" }`
   - Status: CORRECT (unchanged behavior -- "Minimum" still found first, "Learn" in keyword list is harmless)

### 2. Seed Parser: Male/Female Keywords (rules-review-224 robustness recommendation) -- RESOLVED

**Fix (commit a9a4789c):** `Male` and `Female` added to `triggerKeywords` regex.

**Impact analysis:** All existing gender-specific evolutions co-occur with "Minimum" or a stone name, so these keywords were already correctly split by other keywords. Adding them explicitly provides robustness:

- **Combee -> Vespiquen ("Minimum 20 Female"):** "Minimum" still matches first. No behavior change.
- **Burmy -> Wormadam ("Minimum 20 Female"):** Same. No behavior change.
- **Burmy -> Mothim ("Minimum 20 Male"):** Same. No behavior change.
- **Kirlia -> Gallade ("Dawn Stone Male Minimum 30"):** "Dawn Stone" still matches first. No behavior change.

If a hypothetical future pokedex entry had a gender-only trigger (e.g., "Hypothetical Male"), the "Male" keyword would now correctly split it. This is pure future-proofing with zero risk to existing parsing.

Status: CORRECT

### 3. Evolution Undo: Notes Restoration (rules-review-224 M1) -- RESOLVED

**Rule:** Design spec section 3.3: "Restores the Pokemon to its pre-evolution state."

**Fix (commit 1642491f):** `PokemonSnapshot` now captures `notes: string | null` (evolution.service.ts line 81). The snapshot is populated with `pokemon.notes` before any changes (line 505). The undo endpoint restores `notes: snapshot.notes ?? null` (evolution-undo.post.ts line 114).

**Verification:** When evolution adds `[Evolved from Charmander at Level 16 on 2026-03-02]` to the notes and the GM undoes the evolution, the notes field reverts to its pre-evolution content. If the Pokemon had existing notes, they are preserved. If it had no notes, `null` is restored.

Status: CORRECT. The evolution history note no longer persists after undo.

### 4. Evolution Undo: Consumed Stone Restoration (rules-review-224 M2) -- RESOLVED

**Rule:** Design spec section 3.3 undo intent; app design decision to track consumed items for full undo.

**Fix (commits 1642491f + 93ebfcee):**
- `PokemonSnapshot.consumedStone` tracks `{ ownerId, itemName }` when a stone is consumed (evolution.service.ts lines 82-86, populated at lines 680-684 inside the transaction)
- `restoreStoneToInventory()` (evolution.service.ts lines 385-415) re-adds the stone to the trainer's inventory
- The undo endpoint calls `restoreStoneToInventory()` when `snapshot.consumedStone` is present (evolution-undo.post.ts lines 119-121)

**Verification:** A Water Stone evolution that consumes the stone from the trainer's inventory will restore the stone on undo. The stone is added back with quantity +1 (or created as a new entry if no longer in inventory).

Status: CORRECT

### 5. Stone Consumption Atomicity

**Fix (commit 93ebfcee):** `performEvolution()` now wraps the Pokemon update and stone consumption in a single `prisma.$transaction()` (evolution.service.ts lines 621-688). The consumed stone tracking is set inside the transaction (line 681), ensuring it only records consumption that actually succeeded.

**PTU impact:** If a stone is not found in inventory (e.g., GM error, race condition), the entire evolution is rolled back. The Pokemon remains in its pre-evolution state. This prevents the scenario where a Pokemon evolves but the stone error is thrown, leaving the system in an inconsistent state.

Status: CORRECT. Matches the expected behavior that evolution and stone consumption are an atomic operation.

### 6. GM Override for Missing Stone

**Fix (commit 854a0d97):** `EvolutionConfirmModal.vue` pre-checks stone availability via a character API fetch (lines 356-370). If missing, a `confirm()` dialog offers the GM an override. When confirmed, `skipInventoryCheck: true` is sent in the evolve request (line 413), which causes `performEvolution()` to skip the stone consumption step entirely (line 620: `shouldConsumeStone` evaluates to false).

**PTU context:** Stone availability is an app-level inventory management concern, not a PTU rule. PTU assumes the stone exists when the evolution is triggered. The GM override correctly handles the edge case where the inventory tracking may not reflect reality (e.g., stone was used outside the app, or wasn't tracked).

Status: CORRECT

### 7. decree-035 Compliance (Base Relations)

- **Decree:** "Base Relations ordering uses nature-adjusted base stats." (`decrees/decree-035.md`)
- **Implementation:** `recalculateStats()` in `evolution.service.ts` line 179 applies nature via `applyNatureToBaseStats()` before calling `validateBaseRelations()` at line 211. The ordering constraint uses nature-adjusted values.
- **Fix commit impact:** None of the 5 fix commits modified `recalculateStats()` or `validateBaseRelations()`. The logic remains as approved in rules-review-213 (P1).
- **Status:** CORRECT -- per decree-035, this approach was ruled correct.

### 8. decree-036 Compliance (Stone Evolution Move Learning)

- **Decree:** "Stone evolutions learn new-form moves at or below the Pokemon's current level." (`decrees/decree-036.md`)
- **Implementation:** `getEvolutionMoves()` in `utils/evolutionCheck.ts` lines 209-211: `evolutionMinLevel !== null ? entry.level < evolutionMinLevel : entry.level <= currentLevel`. Stone evolutions (null minimumLevel) use `<=` comparison against current level; level-based evolutions use strict `<` against the minimum evolution level.
- **Fix commit impact:** None of the 5 fix commits modified `getEvolutionMoves()`. The logic remains as approved in rules-review-213 (P1).
- **Status:** CORRECT -- per decree-036, this approach was ruled correct.

### 9. Core Evolution Mechanics (PTU p.202)

- **Rule:** "Upon Evolving, several changes occur in a Pokemon. Take the new form's Base Stats, apply the Pokemon's Nature again, reapply any Vitamins that were used, and then re-Stat the Pokemon, spreading the Stats as you wish. Again, Pokemon add +X Stat Points to their Base Stats, where X is the Pokemon's Level plus 10. You must of course, still follow the Base Relations Rule." (`core/05-pokemon.md`, lines 592-598)
- **Implementation:** `recalculateStats()` applies nature (line 179), validates stat point total = level + 10 (lines 183-194), validates Base Relations (line 211), calculates HP = level + (hpStat * 3) + 10 (line 224).
- **Fix commit impact:** None of the 5 fix commits modified the core stat recalculation or HP formula.
- **Status:** CORRECT -- HP formula, stat total, and Base Relations enforcement all match PTU RAW.

## Summary

All 3 issues from rules-review-224 are resolved:

| Issue | Severity | Status | Fix |
|-------|----------|--------|-----|
| C1: Seed parser missing "Learn" keyword | CRITICAL | RESOLVED | `Learn`, `Male`, `Female` added to `triggerKeywords` regex. All 7 previously broken species now parse correctly. |
| M1: Undo does not restore notes | MEDIUM | RESOLVED | `notes` added to `PokemonSnapshot`, captured before evolution, restored on undo. |
| M2: Undo does not restore consumed stone | MEDIUM | RESOLVED | `consumedStone` tracking in snapshot, `restoreStoneToInventory()` called on undo. |

The runtime logic for move-based evolution triggers (eligibility check in `checkEvolutionEligibility()`, service validation in `performEvolution()`, API response in `evolution-check.post.ts`) was already correct in the original P2 implementation. The only gap was the seed parser's first-stage splitter, which is now fixed.

## Rulings

- **Move-based evolution triggers:** Now correctly seeded for all 8 PTU species with "Learn" triggers (7 fixed + 1 that was already working via "Minimum" keyword).
- **Gender keywords in seed parser:** Added as robustness measure. No current species rely on them alone, but they prevent future fragility.
- **Evolution undo completeness:** Undo now restores all state: species, types, stats, HP, abilities, moves, capabilities, skills, held item, notes, and consumed stone. This constitutes a full reversal of the evolution operation.
- **Per decree-035:** Compliant. No changes to Base Relations logic.
- **Per decree-036:** Compliant. No changes to stone evolution move learning logic.

## Verdict

**APPROVED**

All CRITICAL and MEDIUM issues from rules-review-224 are resolved. Seed parser now correctly handles all PTU evolution trigger patterns. Evolution undo is now a complete state reversal. No new rules issues introduced.
