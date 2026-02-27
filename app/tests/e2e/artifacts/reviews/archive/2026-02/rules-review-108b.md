---
review_id: rules-review-108b
target: ptu-rule-056
trigger: follow-up
follows_up: rules-review-108
verdict: PASS
reviewed_commits: [478b646, 4c7c7df, ed19c91]
reviewed_files:
  - app/constants/trainerBackgrounds.ts
  - app/composables/useCharacterCreation.ts
date: 2026-02-20
reviewer: game-logic-reviewer
---

## PTU Rules Verification Report

### Issue 1 Resolution (Hermit background)

**Original problem:** Hermit background had `adeptSkill: 'Perception'` and `noviceSkill: 'Survival'`. PTU Core p. 14 specifies "Rank Up: Adept Education Skill, Novice Perception" and "Rank Down: Charm, Guile, and Intuition."

**PTU source text (02-character-creation.md, lines 195-198):**
> Hermit
> You don't like people, and they tend to not like you.
> Rank Up: Adept Education Skill, Novice Perception
> Rank Down: Charm, Guile, and Intuition

**Current code (`trainerBackgrounds.ts`, lines 32-36):**
```typescript
{
  name: 'Hermit',
  description: 'You don\'t like people, and they tend to not like you.',
  adeptSkill: 'Occult Ed', // PTU: "Adept Education Skill" -- player's choice; Occult Ed as default
  noviceSkill: 'Perception',
  patheticSkills: ['Charm', 'Guile', 'Intuition']
}
```

**Verification:**
- Adept skill is now `'Occult Ed'`, which is a valid Education skill. The PTU text says "Adept Education Skill" (player's choice), so any Education skill is acceptable as a default. CORRECT.
- Novice skill is now `'Perception'`, matching the PTU text exactly. CORRECT.
- Pathetic skills remain `['Charm', 'Guile', 'Intuition']`, matching the PTU text exactly. CORRECT (unchanged).
- The inline comment documents that Occult Ed is a default for a player-choice slot. Good practice.

**Status:** RESOLVED

### Issue 2 Resolution (Evasion +6 cap)

**Original problem:** Evasion formula used `Math.floor(stat / 5)` without a `Math.min(6, ...)` cap. PTU Core p. 16 states the maximum is +6.

**PTU source text (02-character-creation.md, lines 311-315):**
> There are three types of Evasion: Physical Evasion, Special Evasion, and Speed Evasion. To calculate these Evasion values, divide the related Combat Stat by 5 and round down. You may never have more than +6 in a given Evasion from Combat Stats alone.

**Additional confirmation (lines 274-276):**
> for every 5 points a Pokemon or Trainer has in Speed, they gain +1 Speed Evasion, up to a maximum of +6 at 30 Speed.

**Current code (`useCharacterCreation.ts`, lines 80-85):**
```typescript
/** Combat evasions derived from stats: floor(stat / 5), capped at +6 (PTU Core p. 16) */
const evasions = computed(() => ({
  physical: Math.min(6, Math.floor(computedStats.value.defense / 5)),
  special: Math.min(6, Math.floor(computedStats.value.specialDefense / 5)),
  speed: Math.min(6, Math.floor(computedStats.value.speed / 5))
}))
```

**Verification:**
- All three evasion values (physical, special, speed) now wrapped in `Math.min(6, ...)`. CORRECT.
- The floor-divide-by-5 base formula is preserved. CORRECT.
- JSDoc comment updated to document the cap and cite the PTU page reference. CORRECT.
- Manual check: stat of 35 yields `Math.min(6, Math.floor(35/5))` = `Math.min(6, 7)` = 6. Cap enforced correctly.
- Manual check: stat of 29 yields `Math.min(6, Math.floor(29/5))` = `Math.min(6, 5)` = 5. Below-cap values unaffected.

**Status:** RESOLVED

### Commit 3 (ed19c91): Design spec update

The third commit updates the design document `design-char-creation-001.md` with an implementation log referencing the two fixes and their commit hashes. This is a documentation-only change and does not affect game logic correctness.

### Summary

| Check | Original Status | Current Status |
|-------|----------------|----------------|
| Hermit background skills | INCORRECT (Adept Perception, Novice Survival) | CORRECT (Adept Occult Ed, Novice Perception) |
| Evasion +6 cap | INCORRECT (no cap) | CORRECT (`Math.min(6, ...)` on all 3 evasions) |

Both issues from rules-review-108 are fully resolved. No new PTU rule violations introduced. All fixes are minimal and correctly scoped to the identified problems.
