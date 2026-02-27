---
review_id: rules-review-092
target: ptu-rule-037
trigger: orchestrator-routed
reviewed_commits:
  - 50ec914
verdict: PASS
reviewed_at: 2026-02-20
reviewer: game-logic-reviewer
---

## Rules Review: Seed Parser Name-Detection Skip List (ptu-rule-037)

### PTU Reference

PTU 1.05 Pokedex format (books/markdown/pokedexes/how-to-read.md, Page 6):

> Each pokedex entry begins with the **SPECIES NAME** in ALL CAPS, followed by Base Stats (HP, Attack, Defense, Special Attack, Special Defense, Speed), Basic Information, Abilities, Evolution, Size, Breeding, Capabilities, Skills, and Move Lists.

The stat header format is: `HP:`, `Attack:`, `Defense:`, `Special Attack:`, `Special Defense:`, `Speed:`.

### Verification Scope

1. Does the fix correctly prevent "HP:" from being parsed as a Pokemon name?
2. Is there any real Pokemon species named "HP" or "HP:"?
3. Does the skip list accidentally exclude any valid Pokemon name?
4. Are there other stat headers or non-name lines that could still false-positive?

### Findings

#### 1. "HP:" Is the Only Stat Header at Risk

The name-detection regex requires the first group to be `[A-Z][A-Z0-9\-\(\).:'...]+` (2+ uppercase/special characters). Among all stat headers:

| Header | Matches Regex? | Passes Length >= 3? | At Risk? |
|--------|---------------|---------------------|----------|
| `HP:` | Yes | Yes (len=3) | **YES** |
| `HP` | Yes | No (len=2) | No |
| `Attack:` | No (lowercase 't') | Yes | No |
| `Defense:` | No (lowercase 'e') | Yes | No |
| `Special Attack:` | No (lowercase) | Yes | No |
| `Special Defense:` | No (lowercase) | Yes | No |
| `Speed:` | No (lowercase) | Yes | No |

Only `HP:` passes all three guards (length, regex, not-all-digits). The fix correctly targets this entry.

#### 2. No Pokemon Species Named "HP" or "HP:"

Searched all 994 pokedex files across gen1-gen8 and hisui directories:
- `^HP:$` matches only 3 files: `oricorio-pompom.md`, `oricorio-pau.md`, `oricorio-sensu.md` -- all on line 7 as stat headers after `Base Stats:`, NOT as species names.
- `^HP$` matches zero files.
- No Pokemon species in any generation is named "HP" or "HP:".

#### 3. Skip List Does Not Exclude Any Valid Pokemon

Full skip list after fix: `Contents`, `TM`, `HM`, `MOVE LIST`, `TUTOR MOVE LIST`, `EGG MOVE LIST`, `HP:`, `HP`.

None of these are Pokemon species names. Verified against all pokedex files.

#### 4. Redundancy Observation (Non-Blocking)

Three of the original skip list entries plus the new `HP` entry would never actually reach the `.includes()` check because they fail earlier guards:

- `Contents` -- fails the regex (lowercase letters after 'C')
- `TM` -- fails `line.length >= 3` (len=2)
- `HM` -- fails `line.length >= 3` (len=2)
- `HP` -- fails `line.length >= 3` (len=2)

These are harmless defensive entries. Only `MOVE LIST`, `TUTOR MOVE LIST`, `EGG MOVE LIST`, and `HP:` actually need to be in the skip list. This is not a correctness issue -- just a minor observation about redundancy in the defensive coding.

#### 5. Real-World Impact Assessment

The Oricorio alternate form files (Pa'u, Pom-Pom, Sensu) have `HP:` on line 7, which falls within the 10-line scan window. In practice, the Pokemon name (`ORICORIO Pa'u`, etc.) appears on line 3 and is matched first, so the scanner never reaches line 7. The fix guards against the edge case where a pokedex file has a missing or malformed name line, which would cause the scanner to fall through to `HP:` on line 7.

### Verdict: PASS

The fix correctly addresses the latent false-positive identified in ptu-rule-037. No Pokemon species data is affected. No valid Pokemon name is excluded by the skip list. The `HP:` entry is the only stat header that can false-positive on the name-detection regex, and it is now correctly blocked.
