---
review_id: rules-review-098
ticket: ptu-rule-057
commits_reviewed: ["8c33677", "01f2f2f"]
verdict: PASS
reviewer: game-logic-reviewer
date: 2026-02-20
---

# Rules Review: Species Diversity in Encounter Generation

## Mechanic Under Review

Encounter generation species diversity enforcement — exponential weight decay + per-species cap added to the weighted random selection loop in `generate.post.ts`.

## PTU Rule Analysis

PTU 1.05 does not define a formal algorithm for encounter generation from weighted tables. The rulebook provides GM-facing guidance in Chapter 11 ("Running The Game"), pages 444 and 474. The key passages are:

### Page 474 — "Quick-Statting Pokemon" (Section 1)

> **"Stick to 2 or 3 different species."**
> You want to clone a few Pokemon to populate your encounter, but you don't want an encounter made entirely of one species either. Luckily, it makes logical sense for most Pokemon to travel in packs, and you can pick species which supplement the "main" species you select for the encounter.

This is the single most relevant rule. PTU explicitly advises:
1. Encounters should NOT be entirely one species.
2. Multiple species (2-3) should be present.
3. Repetition is expected and acceptable ("clone a few Pokemon") — but not total monoculture.

### Pages 444-445 — Sensible Ecosystems

> The Sewaddles which feed off of leaves in the forest will be much more numerous than the Pidgeys eating them which are in turn less common than higher level predators such as Sevipers.

This establishes that the base weighted distribution matters — common species SHOULD appear more often than rare ones. Any diversity mechanic must preserve this relative ordering, not flatten it into uniform distribution.

### Page 474 — Encounter Building Example

> Our GM from the previous example may create an encounter of **three Cacnea and three Trapinch** for a desert encounter in the case of six Level 20 foes.

This example shows a 50/50 split between two species in a 6-Pokemon encounter. The GM also includes a Growlithe pack with an Arcanine leader and "a Herdier to give the encounter some variety" — demonstrating a dominant species with a supplementary one.

### Errata (September 2015 Playtest)

No encounter generation or species diversity errata found. The errata covers Cheerleader, Medic, capture mechanics, Poke Edges, and tutor moves only.

## Implementation Assessment

### Does the diversity algorithm align with PTU encounter generation philosophy?

**Yes.** The implementation correctly captures the PTU guidance:

| PTU Guidance | Implementation |
|---|---|
| "Don't want an encounter made entirely of one species" | Per-species cap at `ceil(count / 2)` prevents monocultures. For 6 spawns, max 3 of any species. |
| "Clone a few Pokemon" — repetition is normal | Exponential decay (0.5^n) reduces but does NOT eliminate repetition. A dominant species can still appear multiple times. |
| Common species more numerous than rare ones | Decay is multiplicative on the base weight, so a species with weight 20 still outweighs a species with weight 5 even after one selection (effective 10 vs 5). The relative ordering is preserved. |
| "Stick to 2 or 3 different species" | The algorithm naturally trends toward 2-3 species for typical pool sizes. It does not force uniform distribution across all species. |

### Are there PTU rules about species distribution that the fix might violate?

**No.** PTU provides advisory guidance, not hard formulas, for encounter composition. The implementation respects the spirit of the guidance without contradicting any specific rule. Specific checks:

1. **Weighted distribution preserved**: The base weights still determine relative likelihood. A weight-20 species will still dominate over a weight-2 species.
2. **Not overly aggressive**: The 0.5 decay factor is gentle. After one pick, a species has 50% of its original weight — it is still very likely to be picked again. This matches the PTU expectation that species "travel in packs."
3. **Cap is generous**: `ceil(count / 2)` means a species can still be half the encounter. For a 6-Pokemon encounter, 3 of the same species is entirely consistent with the "three Cacnea and three Trapinch" example.
4. **Single-species pool handled**: When only one species exists, diversity is correctly skipped. This handles edge cases like a route with only Zubat.

### Is the exponential decay + cap approach consistent with PTU intent?

**Yes.** The algorithm produces encounters that look like what PTU describes:
- A "main" species appearing 2-3 times (the highest-weight entry)
- Supplementary species appearing 1-2 times
- No monoculture encounters (unless the table literally has one species)

The fallback to original weights when all species are capped prevents infinite loops without violating any rule — it only triggers in degenerate cases (e.g., 2 species in pool, 10 spawn count).

## Edge Case Analysis

| Scenario | Behavior | PTU-Correct? |
|---|---|---|
| 1 species in pool, count=6 | Diversity skipped, 6 of that species | Yes — no alternative exists |
| 2 species (equal weight), count=6 | Cap at 3 each, will be ~3/3 split | Yes — matches Cacnea/Trapinch example |
| 2 species (20:5 weight), count=6 | Dominant species capped at 3, other fills rest | Yes — preserves rarity gradient while preventing monoculture |
| 5 species, count=4 | Decay gently discourages repeats; likely 3-4 unique species | Yes — matches "2 or 3 different species" guidance |
| 1 species in pool, count=1 | Single Pokemon generated, no diversity logic | Yes — trivial case |

## Code Quality Notes (non-rules)

- The `weight` field in the response correctly shows the original configured weight, not the effective draw weight. This preserves auditability of the table configuration.
- The `selectionCounts` map uses `speciesName` as key, which is consistent with the `entryPool` map key used elsewhere in the file.

## Verdict

**PASS**. The species diversity enforcement aligns with PTU 1.05 encounter building guidance. The algorithm prevents the specific failure case (all-Zubat encounters) while preserving weighted distribution, allowing natural pack repetition, and matching the rulebook's own encounter composition examples. No PTU rules are violated.
