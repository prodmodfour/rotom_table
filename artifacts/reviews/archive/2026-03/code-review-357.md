---
review_id: code-review-357
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: bug-067
domain: player-view
commits_reviewed:
  - d68051a1
  - c5eb552f
  - 0a69e105
files_reviewed:
  - app/server/utils/serializers.ts
  - app/components/player/PlayerPokemonCard.vue
  - app/components/player/PlayerCharacterSheet.vue
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-06T09:30:00Z
follows_up: null
---

## Review Scope

Bug-067: PlayerPokemonCard expansion crashes with `TypeError: Cannot read properties of undefined (reading 'length')` because `serializeLinkedPokemon()` was missing `statusConditions`, `stageModifiers`, `injuries`, and `temporaryHp` fields. Fix adds the missing fields to the serializer and defensive null guards to both `PlayerPokemonCard.vue` and `PlayerCharacterSheet.vue`.

3 commits, 3 files, 24 insertions / 20 deletions.

## Verification

### 1. serializeLinkedPokemon now includes all fields needed by player-view components

Field-by-field comparison against `serializePokemon` (lines 211-266):

| Field | serializePokemon | serializeLinkedPokemon | Needed by player view? |
|---|---|---|---|
| statusConditions | Yes (line 249) | Yes (line 56) -- ADDED | Yes |
| stageModifiers | Yes (line 238) | Yes (line 57) -- ADDED | Yes |
| injuries | Yes (line 250) | Yes (line 58) -- ADDED | Yes |
| temporaryHp | Yes (line 251) | Yes (line 59) -- ADDED | Yes |
| ownerId | Yes | No | No -- management field |
| isInLibrary | Yes | No | No -- management field |
| origin | Yes | No | No -- management field |
| location | Yes | No | No -- management field |
| notes | Yes | No | No -- management field |
| lastInjuryTime | Yes | No | No -- rest tracking |
| restMinutesToday | Yes | No | No -- rest tracking |
| injuriesHealedToday | Yes | No | No -- rest tracking |
| lastRestReset | Yes | No | No -- rest tracking |

The remaining differences are intentional: `serializeLinkedPokemon` is documented as "a summary shape suitable for character detail views" and management/rest-tracking fields are not consumed by `PlayerPokemonCard` or `PlayerCharacterSheet`. No gap.

### 2. Null guards use correct defaults

- `statusConditions ?? []` -- correct, JSON array field
- `abilities ?? []` -- correct, JSON array field
- `moves ?? []` -- correct, JSON array field
- `currentStats ?? {}` -- correct, JSON object field
- `stageModifiers ?? {}` -- correct, JSON object field
- Individual stat fields within objects get `?? 0` -- correct for numeric values

### 3. PlayerCharacterSheet guards are consistent with PlayerPokemonCard

Both components apply identical patterns:
- Template: `(x.statusConditions ?? []).length > 0` for v-if, `x.statusConditions ?? []` for v-for
- Computed: `x.stageModifiers ?? {}` before property access
- PlayerCharacterSheet evasion calculations use `(props.character.stageModifiers ?? {}).defense ?? 0` pattern -- correct double-guard

### 4. No other serializer functions have similar missing-field gaps

- `serializeCharacter` (line 67): Already includes statusConditions, stageModifiers, injuries, temporaryHp for the character entity itself (lines 105-108). Delegates to `serializeLinkedPokemon` for nested Pokemon -- now fixed.
- `serializeCharacterSummary` (line 140): Uses `CharacterWithPokemonSummary` type which provides only `{ id, species, nickname }` per Pokemon via Prisma select. No expansion possible, no fields needed.
- `serializePokemon` (line 211): Complete standalone serializer. No gaps.

### 5. Both template and computed properties are guarded

**PlayerPokemonCard.vue:**
- Template: statusConditions (lines 56, 58), abilities (lines 88, 91), moves (line 103)
- Computed `statEntries`: currentStats (line 173), stageModifiers (line 174), individual stats (lines 176-181)

**PlayerCharacterSheet.vue:**
- Template: statusConditions (lines 137, 141)
- Computed `statEntries`: stageModifiers (line 332)
- Computed evasions: stageModifiers (lines 353, 358, 363)

### 6. Downstream component safety

`PlayerMoveList.vue` accepts `moves: Move[]` prop and uses `moves.length === 0` for empty state (line 36). Passing `pokemon.moves ?? []` from the parent ensures this never receives undefined.

### 7. Decree check

No active decrees affect the player-view serialization or null-guard domain. Decree-049 (loyalty defaults) is already respected in both serializers.

## What Looks Good

- **Root cause fix + defense in depth.** The serializer fix ensures fields are always present, AND the component guards protect against any future regression or alternate code path that might skip the serializer. Both layers are warranted.
- **Commit granularity is excellent.** Three focused single-file commits with clear messages explaining what and why. Serializer fix first (root cause), then component guards (defense).
- **Consistent pattern application.** The same `?? []` / `?? {}` pattern is applied uniformly across both components rather than ad-hoc fixes in one place.
- **No unnecessary changes.** The diff is tight -- only the lines that needed guarding were touched.

## Verdict

**APPROVED.** The fix correctly addresses the root cause (missing fields in `serializeLinkedPokemon`), adds appropriate defensive guards in both consuming components, and introduces no new issues. All serializer functions have been verified for field completeness. Commit granularity and messages are clean.
