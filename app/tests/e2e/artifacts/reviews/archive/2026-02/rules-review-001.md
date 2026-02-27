---
review_id: rules-review-001
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: bug-002
domain: capture
commits_reviewed:
  - ec11197
  - 71b6987
  - 4515dbb
  - 7c49daf
mechanics_verified:
  - evolution-stage-modifier
  - evolution-stage-parsing
  - max-evolution-stage-api
  - hp-modifier
  - level-modifier
  - status-condition-modifiers
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/05-pokemon.md#Capture Rate
  - errata-2.md#Capture Mechanic Changes
reviewed_at: 2026-02-16T03:00:00
---

## Review Scope

Fix for bug-002: SpeciesData seeder stored `evolutionStage=1` for all species, and `rate.post.ts` hardcoded `maxEvolutionStage = Math.max(3, evolutionStage)`. Four commits reviewed: initial fix (ec11197), word-boundary name matching (71b6987), species name regex broadening (4515dbb), Mega form stage fix (7c49daf).

Verified all changes against PTU 1.05 core/05-pokemon.md p214 capture rate rules and the three worked examples on p214-215.

## Mechanics Verified

### Evolution Stage Modifier
- **Rule:** "If the Pokemon has two evolutions remaining, add +10 to the Pokemon's Capture Rate. If the Pokemon has one evolution remaining, don't change the Capture Rate. If the Pokemon has no evolutions remaining, subtract 10 from the Pokemon's Capture Rate." (`core/05-pokemon.md#Capture Rate`, p214)
- **Implementation:** `evolutionsRemaining = maxEvolutionStage - evolutionStage`, then `>=2 → +10`, `===1 → 0`, `else → -10` (`utils/captureRate.ts:104-112`)
- **Status:** CORRECT
- **Notes:** Code uses `>= 2` rather than `=== 2`. These are equivalent in PTU (max chain length is 3 stages, so max remaining is 2). Defensive and correct.

### Evolution Stage Parsing (Seeder)
- **Rule:** Each species' evolution block lists numbered stages (e.g., `1 - Pichu`, `2 - Pikachu Minimum 10`, `3 - Raichu Thunderstone Minimum 20`). The species' position in this list determines its `evolutionStage`; the highest numbered line determines `maxEvolutionStage`.
- **Implementation:** Regex captures the full evolution block, iterates all `N - SpeciesName` lines, matches current species by name with word-boundary check, stores both values. (`seed.ts:299-321`)
- **Status:** CORRECT
- **Species traced through parser:**
  - **Pikachu** (gen1/pikachu.md): `nameLC="pikachu"`, line 2 text `"pikachu minimum 10"` → `startsWith("pikachu ")` = true → stage 2/3 ✓
  - **Hydreigon** (gen5/hydreigon.md): `nameLC="hydreigon"`, line 3 text `"hydreigon minimum 50"` → `startsWith("hydreigon ")` = true → stage 3/3 ✓
  - **Caterpie** (gen1/caterpie.md): `nameLC="caterpie"`, line 1 text `"caterpie"` → exact match → stage 1/3 ✓
  - **Kabuto** (gen1/kabuto.md): `nameLC="kabuto"`, line 2 text `"kabutops minimum 40"` → `startsWith("kabuto ")` = false ("kabutops" ≠ "kabuto ") → no false positive ✓ Stage 1/2 ✓
  - **Porygon** (gen1/porygon.md): `nameLC="porygon"`, line 2 text `"porygon2 holding upgrade minimum 10"` → `startsWith("porygon ")` = false ("porygon2" ≠ "porygon ") → no false positive ✓ Stage 1/3 ✓
  - **Porygon-Z** (gen4/porygon-z.md): `nameLC="porygon-z"`, line 3 text `"porygon-z holding dubious disc minimum 25"` → `startsWith("porygon-z ")` = true → stage 3/3 ✓
  - **Absol** (gen3/absol.md): Single evolution line `1 - Absol`. Only 1 line → maxEvolutionStage=1, stage=1. Remaining=0, modifier=-10 ✓ (non-evolving = final form)

### Max Evolution Stage (API Endpoint)
- **Rule:** Evolution modifier requires both the species' current stage and the total stages in its evolution line.
- **Implementation:** Both code paths in `rate.post.ts` (lines 57-58 and 84-85) now read `speciesData.evolutionStage` and `speciesData.maxEvolutionStage` from the database. The `Math.max(3, evolutionStage)` hardcode is completely removed.
- **Status:** CORRECT

### HP Modifier (Cross-Verified)
- **Rule:** "above 75% Hit Points, subtract 30... at 75% Hit Points or lower, subtract 15... at 50% or lower, the Capture Rate is unmodified... at 25% or lower, add +15... at exactly 1 Hit Point, add +30" (`core/05-pokemon.md#Capture Rate`, p214)
- **Implementation:** `captureRate.ts:89-100` — checks `currentHp === 1` first (total +30), then `<=25%` (+15), `<=50%` (0), `<=75%` (-15), else (-30). The "total" keyword in the rule means the +30 replaces all other HP modifiers, not stacks with them. The priority chain in the code correctly handles this.
- **Status:** CORRECT

### Level Modifier (Cross-Verified)
- **Rule:** "subtract the Pokemon's Level x2" (`core/05-pokemon.md#Capture Rate`, p214)
- **Implementation:** `levelModifier = -(level * 2)` (`captureRate.ts:86`)
- **Status:** CORRECT

### Status Condition Modifiers (Cross-Verified)
- **Rule:** "Persistent Conditions add +10... Injuries and Volatile Conditions add +5. Additionally, Stuck adds +10... and Slow adds +5." (`core/05-pokemon.md#Capture Rate`, p214)
- **Implementation:** Persistent (Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned, Asleep) → +10 each. Volatile (Confused, Flinched, etc.) → +5 each. Stuck/Trapped → +10 (separate). Slowed → +5 (separate). Injuries → +5 each. All stack independently. (`captureRate.ts:119-141`)
- **Status:** CORRECT

## Worked Examples Verification

All three worked examples from PTU core/05-pokemon.md p214-215 produce correct results with the fixed code:

### Example 1: Level 10 Pikachu, 70% HP, Confused
| Component | Rule | Code Value | Match |
|-----------|------|------------|-------|
| Base | 100 | 100 | ✓ |
| Level | -(10×2) = -20 | -20 | ✓ |
| HP (70%, ≤75%) | -15 | -15 | ✓ |
| Evolution (stage 2/3, 1 remaining) | 0 | 0 | ✓ |
| Confused (volatile) | +5 | +5 | ✓ |
| **Total** | **70** | **70** | **✓** |

### Example 2: Shiny Level 30 Caterpie, 40% HP, 1 Injury
| Component | Rule | Code Value | Match |
|-----------|------|------------|-------|
| Base | 100 | 100 | ✓ |
| Level | -(30×2) = -60 | -60 | ✓ |
| HP (40%, ≤50%) | 0 | 0 | ✓ |
| Evolution (stage 1/3, 2 remaining) | +10 | +10 | ✓ |
| Shiny | -10 | -10 | ✓ |
| Injury (×1) | +5 | +5 | ✓ |
| **Total** | **45** | **45** | **✓** |

### Example 3: Level 80 Hydreigon, 1 HP, Burned, Poisoned, 1 Injury
| Component | Rule | Code Value | Match |
|-----------|------|------------|-------|
| Base | 100 | 100 | ✓ |
| Level | -(80×2) = -160 | -160 | ✓ |
| HP (1 HP exact) | +30 | +30 | ✓ |
| Evolution (stage 3/3, 0 remaining) | -10 | -10 | ✓ |
| Burned (persistent) | +10 | +10 | ✓ |
| Poisoned (persistent) | +10 | +10 | ✓ |
| Injury (×1) | +5 | +5 | ✓ |
| **Total** | **-15** | **-15** | **✓** |

## Edge Cases Verified

| Species Type | Example | Stage | Max | Remaining | Modifier | Correct? |
|---|---|---|---|---|---|---|
| Stage 1 of 3 | Caterpie | 1 | 3 | 2 | +10 | ✓ |
| Stage 2 of 3 | Pikachu | 2 | 3 | 1 | 0 | ✓ |
| Stage 3 of 3 | Hydreigon | 3 | 3 | 0 | -10 | ✓ |
| Stage 1 of 2 | Kabuto | 1 | 2 | 1 | 0 | ✓ |
| Stage 1 of 1 | Absol | 1 | 1 | 0 | -10 | ✓ |
| Mega form | (any) | max | max | 0 | -10 | ✓ |
| Name collision | Kabuto vs Kabutops | 1 | 2 | 1 | 0 | ✓ |
| Numeric name | Porygon vs Porygon2 | 1 | 3 | 2 | +10 | ✓ |

## Errata Check

`errata-2.md` contains a September 2015 Playtest Packet with a completely different d20-based capture system (base rate 10, different modifiers). The app implements the PTU 1.05 core d100 system from `core/05-pokemon.md`. The errata's alternative capture system does **not** apply — no errata corrections affect the evolution stage modifier logic.

## Summary

- Mechanics checked: 6
- Correct: 6
- Incorrect: 0
- Needs review: 0

## Rulings

(none — no escalations or ambiguities)

## Verdict

APPROVED — The fix correctly addresses both root causes from bug-002. The seeder now parses the full evolution block to determine species-specific `evolutionStage` and line-wide `maxEvolutionStage`. The capture rate endpoint reads both values from the database. The `calculateCaptureRate` function correctly implements the PTU 1.05 evolution modifier rule. All three worked examples from the rulebook produce exact matches. Seven species traced through the parser with no errors. Ready for re-test.

## Required Changes

(none)
