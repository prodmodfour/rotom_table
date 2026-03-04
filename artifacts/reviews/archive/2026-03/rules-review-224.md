---
review_id: rules-review-224
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-006
domain: pokemon-lifecycle
commits_reviewed:
  - e36f5b11
  - 52878c55
  - f82bc48f
  - 1de3db6e
  - 63633ee8
  - 339a0d90
  - 4d4651e1
  - 35cb1af5
  - 4353f7a2
mechanics_verified:
  - everstone-prevention
  - eviolite-prevention
  - stone-consumption
  - held-item-consumption
  - post-evolution-undo
  - evolution-history-logging
  - gender-specific-triggers
  - move-specific-triggers
  - seed-parser-learn-keyword
  - seed-parser-gender-keyword
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 0
  medium: 2
ptu_refs:
  - core/09-gear-and-items.md#Everstone
  - core/09-gear-and-items.md#Eviolite
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
reviewed_at: 2026-03-01T20:30:00Z
follows_up: rules-review-219
---

## Mechanics Verified

### 1. Everstone Prevention
- **Rule:** "Evolution is prevented for the holder. Cannot be used by Trainers." (`core/09-gear-and-items.md`, line 1877-1878)
- **Implementation:** `checkEvolutionEligibility()` in `app/utils/evolutionCheck.ts` lines 68-83 checks if `heldItem` matches "Everstone" (case-insensitive). When matched, returns all triggers as ineligible with reason string, plus `preventedByItem: 'Everstone'`. UI surfaces the prevention via an alert in both `gm/pokemon/[id].vue` and `XpDistributionResults.vue`.
- **Status:** CORRECT

### 2. Eviolite Prevention
- **Rule:** "Only affects not-fully-evolved Pokemon of a single family... Prevents Pokemon from evolving when held. Cannot be used by Trainers." (`core/09-gear-and-items.md`, lines 1880-1884)
- **Implementation:** Same prevention check as Everstone. The `preventionItems` array includes both `'Everstone'` and `'Eviolite'`. The Eviolite stat bonus mechanics (+5 to two stats) are correctly documented as out of scope for the evolution feature (spec section 2.3). Only the prevention check matters here.
- **Status:** CORRECT

### 3. Stone Consumption from Trainer Inventory
- **Rule:** PTU does not specify explicit inventory mechanics for stone consumption -- this is an app-level design decision. The spec defines the flow: consume stone from trainer inventory with GM override option.
- **Implementation:** `consumeStoneFromInventory()` in `app/server/services/evolution.service.ts` lines 346-372. Fetches trainer's inventory JSON, finds item by case-insensitive name match, decrements quantity (removes entry if quantity reaches 0), saves updated inventory. Called from `performEvolution()` at line 596 only when `consumeItem` is provided AND `skipInventoryCheck` is false. The `EvolutionConfirmModal.vue` sends `consumeItem` with the owner ID and item name when the trigger is stone-based and not held-item based (lines 373-379).
- **Status:** CORRECT

### 4. Held Item Consumption
- **Rule:** Held items used as evolution triggers are consumed by default per design spec section 1.2. No explicit PTU rule; this is an app design decision.
- **Implementation:** `performEvolution()` in `evolution.service.ts` lines 561-563 computes `shouldConsumeHeldItem`: true when `trigger.itemMustBeHeld && trigger.requiredItem !== null && input.consumeHeldItem !== false`. The Pokemon update at line 591 conditionally clears `heldItem` via spread. The modal sends `consumeHeldItem: true` for held-item evolutions (line 381).
- **Status:** CORRECT

### 5. Post-Evolution Undo (Snapshot + Endpoint + Composable)
- **Rule:** PTU p.202: "You may choose not to Evolve your Pokemon if you wish." The design extends this with post-evolution undo for GM convenience.
- **Implementation:** Three-part system:
  1. **Snapshot capture:** `performEvolution()` captures `PokemonSnapshot` (lines 438-462) BEFORE any changes are applied. The snapshot includes species, types, all stats, maxHp, currentHp, spriteUrl, abilities, moves, capabilities, skills, and heldItem. Returned in the `EvolutionResult`.
  2. **Undo endpoint:** `POST /api/pokemon/:id/evolution-undo` validates the snapshot, checks the Pokemon is not in an active encounter, restores all snapshot fields via `prisma.pokemon.update()`, and broadcasts a `pokemon_evolved` event with `undone: true`.
  3. **Composable:** `useEvolutionUndo()` stores snapshots in a `useState` Map keyed by Pokemon ID. Immutable state updates (new Map on every change). `canUndo()`, `undoEvolution()`, `clearUndo()`, `clearAll()` methods. UI wired in `gm/pokemon/[id].vue` with a conditional "Undo Evolution" button.
- **Status:** CORRECT (with MEDIUM note about `notes` field -- see issue M1 below)

### 6. Evolution History Logging
- **Rule:** Design spec section 4.2: "After evolution, prepend to the Pokemon's notes: `[Evolved from <OldSpecies> at Level <N> on <Date>]`"
- **Implementation:** `performEvolution()` lines 600-611. Constructs the note string with ISO date, prepends to existing notes (or sets as sole note), writes via a second `prisma.pokemon.update()` call.
- **Status:** CORRECT. The format matches the spec. The note is prepended (newest first), which is the right ordering for a log.

### 7. Gender-Specific Triggers
- **Rule:** PTU pokedex entries encode gender requirements directly:
  - Combee: `2 - Vespiquen Minimum 20 Female` (`pokedexes/gen4/combee.md`)
  - Burmy: `2 - Wormadam Minimum 20 Female` / `2 - Mothim Minimum 20 Male` (`pokedexes/gen4/burmy.md`)
  - Kirlia: `3 - Gallade Dawn Stone Male Minimum 30` (`pokedexes/gen3/kirlia.md`)
- **Implementation:**
  1. **Type:** `EvolutionTrigger.requiredGender?: 'Male' | 'Female' | null` in `app/types/species.ts`
  2. **Seed parser:** `parseEvolutionTriggerText()` extracts gender via `/\b(Male|Female)\b/i` regex, removes from remaining text before further parsing.
  3. **Eligibility check:** `checkEvolutionEligibility()` lines 100-106 compares Pokemon's gender against trigger's `requiredGender` (case-insensitive).
  4. **Service validation:** `performEvolution()` lines 422-427 throws error if gender mismatch.
  5. **Response:** `evolution-check.post.ts` line 207 exposes `requiredGender` in available evolution data.
- **Seed parser trace for Combee ("Vespiquen Minimum 20 Female"):**
  - `parseEvoLineSpeciesAndTrigger("Vespiquen Minimum 20 Female")` -- "Minimum" keyword found, returns `{ speciesName: "Vespiquen", triggerText: "Minimum 20 Female" }`
  - `parseEvolutionTriggerText("Minimum 20 Female", ...)` -- extracts gender "Female", remaining = "Minimum 20", matches level-only pattern, returns `{ minimumLevel: 20, requiredGender: 'Female' }`
- **Seed parser trace for Kirlia -> Gallade ("Dawn Stone Male Minimum 30"):**
  - "Dawn Stone" keyword found, returns `{ speciesName: "Gallade", triggerText: "Dawn Stone Male Minimum 30" }`
  - Extracts gender "Male", remaining = "Dawn Stone Minimum 30", matches stone+level pattern.
- **Status:** CORRECT. All three gender-specific evolution families parse correctly.

### 8. Move-Specific Triggers (Eligibility Check + Service Validation)
- **Rule:** PTU pokedex entries encode move requirements with "Learn <MoveName>" pattern:
  - Aipom: `2 - Ambipom Learn Double Hit` (`pokedexes/gen2/aipom.md`)
  - Yanma: `2 - Yanmega Learn Ancient Power` (`pokedexes/gen2/yanma.md`)
  - Piloswine: `3 - Mamoswine Learn Ancient Power` (`pokedexes/gen2/piloswine.md`)
  - And 5 others (Lickitung, Tangela, Bonsly, Mime Jr., Steenee)
- **Implementation (eligibility + service):**
  1. **Type:** `EvolutionTrigger.requiredMove?: string | null` in `app/types/species.ts`
  2. **Eligibility check:** `checkEvolutionEligibility()` lines 108-114 checks if `currentMoves` includes the required move name.
  3. **Service validation:** `performEvolution()` lines 429-436 parses Pokemon's moves JSON and validates the move is known.
  4. **Response:** `evolution-check.post.ts` line 208 exposes `requiredMove`.
- **Logic for check and service is CORRECT** -- if the trigger data reaches the check/service correctly, it will enforce the move requirement properly.
- **Status:** CORRECT (contingent on seed parser fix -- see CRITICAL issue C1 below)

### 9. Seed Parser: "Learn" Keyword Not in parseEvoLineSpeciesAndTrigger (CRITICAL)
- **Rule:** PTU pokedex entries for move-based evolutions use the pattern `<SpeciesName> Learn <MoveName>`, e.g., "Ambipom Learn Double Hit".
- **Implementation:** `parseEvoLineSpeciesAndTrigger()` in `app/prisma/seed.ts` lines 255-268 uses a regex of known trigger keywords to split species name from trigger text. The keyword list includes `Minimum`, `Holding`, and all stone names, but does NOT include `Learn`.
- **Consequence:** For evolution lines like "Ambipom Learn Double Hit" where "Learn" is the only trigger keyword and no other keywords (Minimum, stone names) are present, the function returns `{ speciesName: "Ambipom Learn Double Hit", triggerText: "" }`. This corrupted species name will fail the DB lookup when trying to find "Ambipom Learn Double Hit" in SpeciesData -- meaning the evolution trigger is silently lost during seeding.
- **Affected Pokemon (7 species, all missing "Minimum" in their Learn-based evo line):**
  - Aipom -> Ambipom (Learn Double Hit)
  - Yanma -> Yanmega (Learn Ancient Power)
  - Piloswine -> Mamoswine (Learn Ancient Power)
  - Lickitung -> Lickilicky (Learn Rollout)
  - Tangela -> Tangrowth (Learn Ancient Power)
  - Mime Jr. -> Mr. Mime (Learn Mimic)
  - Steenee -> Tsareena (Learn Stomp)
- **Unaffected (1 species, has "Minimum" keyword):**
  - Bonsly -> Sudowoodo ("Minimum Learn Mimic" -- "Minimum" is found, correctly splits)
- **Fix:** Add `Learn` to the `triggerKeywords` regex in `parseEvoLineSpeciesAndTrigger()`:
  ```
  /\b(Minimum|Holding|Learn|Water Stone|Fire Stone|...)\b/i
  ```
  Also add `Male` and `Female` for safety (currently works only because gender always co-occurs with Minimum/stone keywords, but adding them prevents fragility).
- **Status:** INCORRECT -- CRITICAL severity (7 Pokemon species' evolution triggers silently fail to parse)

### 10. Seed Parser: Gender Keyword in parseEvoLineSpeciesAndTrigger
- **Rule:** Gender keywords ("Male"/"Female") appear in evolution lines like "Vespiquen Minimum 20 Female".
- **Implementation:** `parseEvoLineSpeciesAndTrigger()` does NOT include "Male"/"Female" in its trigger keyword list. However, all gender-specific evolutions in the PTU pokedex also include "Minimum" or a stone name, so the species/trigger split happens correctly via those keywords.
- **Status:** CORRECT (currently works, but fragile -- see C1 fix recommendation to add Male/Female to keyword list for robustness)

## Issues

### C1: CRITICAL -- Seed parser `parseEvoLineSpeciesAndTrigger` missing "Learn" keyword

**File:** `app/prisma/seed.ts`, line 257
**Impact:** 7 Pokemon species cannot have their move-based evolution triggers parsed. The "Learn" keyword is recognized by `parseEvolutionTriggerText()` (second-stage parser) but never reaches it because `parseEvoLineSpeciesAndTrigger()` (first-stage parser) fails to split the species name from trigger text.

**PTU Reference:** All 7 affected pokedex entries use the format `<Stage> - <Species> Learn <MoveName>` without any other trigger keyword.

**Required Fix:** Add `Learn` to the `triggerKeywords` regex:
```typescript
const triggerKeywords = /\b(Minimum|Holding|Learn|Water Stone|Fire Stone|...)\b/i
```

### M1: MEDIUM -- Evolution undo does not restore Pokemon notes

**File:** `app/server/services/evolution.service.ts` (PokemonSnapshot interface, lines 58-81)
**Impact:** When evolution is undone, the `[Evolved from X at Level N on Date]` note prepended during evolution remains in the notes field. The `PokemonSnapshot` does not capture `notes`, and the undo endpoint does not restore it. This leaves stale history for a reverted evolution.
**Spec Reference:** Design spec section 3.3: "Restores the Pokemon to its pre-evolution state."
**Recommendation:** Add `notes: string` to `PokemonSnapshot`, capture it before evolution, and restore it during undo. Alternatively, document this as intentional (notes are informational logs, not state).

### M2: MEDIUM -- Evolution undo does not restore consumed stone from trainer inventory

**File:** `app/server/api/pokemon/[id]/evolution-undo.post.ts`
**Impact:** When a stone-based evolution is undone, the stone that was consumed from the trainer's inventory (via `consumeStoneFromInventory`) is not restored. The held item IS correctly restored (it's in the snapshot), but trainer inventory is a separate entity. If a GM undoes a Water Stone evolution, the Water Stone stays consumed.
**Recommendation:** Either (a) store the consumed item info (ownerId + itemName) in the undo snapshot and restore it during undo, or (b) document this limitation in the UI ("Note: consumed items are not restored on undo").

## Summary

P2 implements 8 mechanics across the evolution system. The core PTU rule implementations are correct:

- **Everstone/Eviolite prevention:** Matches PTU item descriptions exactly. Both items block all evolution paths when held, with clear user messaging.
- **Item consumption:** Stone consumption from inventory and held item clearing both work correctly with GM override support.
- **Post-evolution undo:** Three-layer system (snapshot + endpoint + composable) correctly captures and restores pre-evolution state. Active encounter guard prevents undo during combat.
- **Evolution history logging:** Prepends formatted note to Pokemon's notes field with species, level, and date.
- **Gender-specific triggers:** Correctly parses all PTU pokedex gender keywords and enforces them in both client eligibility check and server-side validation.
- **Move-specific triggers:** The eligibility check and service validation logic is correct, BUT the seed parser fails to extract "Learn" triggers for 7 of 8 affected species because `parseEvoLineSpeciesAndTrigger()` is missing the "Learn" keyword.

The one CRITICAL issue (C1) blocks correct seeding of move-based evolution triggers for the majority of affected Pokemon. The runtime code (eligibility check, service validation, API response) is all correctly implemented -- the only broken link is the seed parser's first-stage species/trigger splitter.

## Rulings

- **Everstone/Eviolite:** Both items correctly prevent evolution per PTU Core p.291. No ambiguity.
- **Stone/held item consumption:** App design decision, not PTU RAW. Implementation matches design spec.
- **Post-evolution undo:** App feature extending PTU's "You may choose not to Evolve" (p.202). Implementation is sound.
- **Gender triggers:** Pokedex entries for Combee (Female), Burmy (Male/Female), and Kirlia->Gallade (Male + Dawn Stone) all parse and enforce correctly.
- **Move triggers:** PTU pokedex uses "Learn <MoveName>" format. The check/service code correctly enforces this, but seed parsing is broken for 7/8 species (C1).
- **Per decree-035:** Base Relations validation continues to use nature-adjusted base stats. No P2 changes affect this. Compliant.
- **Per decree-036:** Stone evolution move learning uses `<= currentLevel`. No P2 changes affect this. Compliant.

## Verdict

**CHANGES_REQUIRED**

One CRITICAL issue must be fixed before approval:

### Required Changes

1. **C1 (CRITICAL):** Add `Learn` to the `triggerKeywords` regex in `parseEvoLineSpeciesAndTrigger()` (`app/prisma/seed.ts` line 257). Without this fix, 7 Pokemon species' move-based evolution triggers are silently lost during seeding, making their evolutions impossible to trigger in the app.

### Recommended Changes (non-blocking)

2. **M1 (MEDIUM):** Add `notes` to `PokemonSnapshot` and restore it during undo, or document the omission as intentional.
3. **M2 (MEDIUM):** Document that consumed stones are not restored on evolution undo, or implement inventory restoration.
4. **Robustness:** Add `Male` and `Female` to the `triggerKeywords` regex for future-proofing (currently works only because gender always co-occurs with other keywords).
