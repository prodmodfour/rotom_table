---
review_id: rules-review-208
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-011
domain: combat
commits_reviewed:
  - e92405f
  - 23c2e76
  - fcf791a
  - d7ab314
  - 2aa2dd4
  - 272aa69
  - 7ed0283
  - 18d1717
  - d492e68
  - a4ede7d
mechanics_verified:
  - pokemon-switching-standard-action
  - pokeball-recall-range-8m
  - league-battle-always-in-range
  - initiative-insertion-on-switch
  - switch-action-economy
  - combat-stage-clear-on-recall
  - volatile-status-clear-on-recall
  - temporary-hp-clear-on-recall
  - trapped-prevents-recall
  - switchActions-lifecycle
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 2
  medium: 2
ptu_refs:
  - core/07-combat.md#page-229-pokemon-switching
  - core/07-combat.md#page-234-combat-stages
  - core/07-combat.md#page-247-volatile-afflictions
  - core/07-combat.md#page-247-trapped
  - core/07-combat.md#page-247-temporary-hit-points
reviewed_at: 2026-03-01T05:00:00Z
follows_up: null
---

## Mechanics Verified

### 1. Full Switch as Standard Action

- **Rule:** "A full Pokemon Switch requires a Standard Action and can be initiated by either the Trainer or their Pokemon on their respective Initiative Counts." (`core/07-combat.md#page-229`)
- **Implementation:** `switching.service.ts:validateActionAvailability()` checks whether it is the trainer's or the Pokemon's turn, then validates Standard Action availability on the initiating combatant. `switch.post.ts` calls `markActionUsed(initiator, 'standard')` on the correct combatant.
- **Status:** CORRECT

### 2. Poke Ball Recall Range (8m)

- **Rule:** "A Trainer cannot Switch or Recall their Pokemon if their active Pokemon is out of range of their Poke Ball's recall beam -- 8 meters." (`core/07-combat.md#page-229`)
- **Implementation:** `switching.service.ts:checkRecallRange()` calculates PTU diagonal distance (per decree-002) between trainer and Pokemon positions, compares against `POKEBALL_RECALL_RANGE = 8`. Returns `{ inRange, distance }`. Gridless/pre-placement falls back to in-range.
- **Status:** CORRECT

### 3. League Battle Always In Range

- **Rule:** "During a League Battle, Trainers are generally considered to always be in Switching range." (`core/07-combat.md#page-229`)
- **Implementation:** `checkRecallRange()` returns `{ inRange: true, distance: 0 }` when `isLeagueBattle` is true, bypassing the distance calculation entirely.
- **Status:** CORRECT

### 4. Initiative Insertion for Released Pokemon

- **Rule:** "If a player has a Pokemon turn available, a Pokemon may act during the round it was released. If the Pokemon's Initiative Count has already passed, then this means they may act immediately." (`core/07-combat.md#page-229`)
- **Implementation:** `insertIntoTurnOrder()` dispatches to either `insertIntoFullContactTurnOrder()` or `insertIntoLeagueTurnOrder()` based on battle type.
  - **Full Contact:** Splits turn order into acted/unacted halves at `currentTurnIndex`, inserts new combatant among unacted, re-sorts by initiative via `sortByInitiativeWithRollOff`. This means the released Pokemon gets a turn if its initiative tick hasn't passed yet in the remaining order.
  - **League:** Inserts into `pokemonTurnOrder` always (stored for future rounds). If currently in pokemon phase, also inserts into active turn order among unacted combatants. Per decree-021: new Pokemon goes into `pokemonTurnOrder` only, not `trainerTurnOrder`. Correct.
- **Status:** CORRECT for P0 scope. The "immediate act" case (initiative tick already passed, Pokemon acts immediately per Full Contact example p.232) is acknowledged as P2 scope per feature-011 ticket.

### 5. Switch Action Economy (Who Spends the Action)

- **Rule:** The switch is "a Standard Action" that "can be initiated by either the Trainer or their Pokemon on their respective Initiative Counts." (`core/07-combat.md#page-229`)
- **Implementation:** `validateActionAvailability()` checks `currentTurnCombatantId` against both trainer and recalled Pokemon IDs. The Standard Action is consumed on whichever combatant's turn it is (trainer on trainer's turn, Pokemon on Pokemon's turn). Correct.
- **Status:** CORRECT

### 6. Combat Stages Clear on Recall

- **Rule:** "Combat Stages remain until the Pokemon or Trainer is switched out, or until the end of the encounter." (`core/07-combat.md#page-234`)
- **Implementation:** The recalled Pokemon's combatant is removed from the encounter via `removeCombatantFromEncounter()`. Combat stages live on the combatant object (transient), not the DB entity. When the Pokemon is later re-released, `buildCombatantFromEntity()` creates a fresh combatant with zeroed combat stages. However, the DB record retains a `stageModifiers` field -- see MEDIUM-002 for the stale data concern.
- **Status:** CORRECT by architecture (transient combatant destruction effectively clears stages), with a data hygiene concern noted in MEDIUM-002.

### 7. Volatile Status Conditions Clear on Recall

- **Rule:** "Volatile Afflictions are cured completely at the end of the encounter, and from Pokemon by recalling them into their Poke Balls." (`core/07-combat.md#page-247`)
- **Implementation:** The switch endpoint (`switch.post.ts`) does NOT update the recalled Pokemon's DB record to remove volatile status conditions. The `statusConditions` field on the Pokemon model persists all conditions including volatile ones (Confused, Flinched, Infatuated, Cursed, Disabled, Enraged, Suppressed, Stuck, Slowed, Tripped, Vulnerable). If the Pokemon is later re-released via another switch, these volatile conditions would be loaded from the DB and applied to the new combatant.
- **Status:** INCORRECT -- see HIGH-001

### 8. Temporary HP Clear on Recall

- **Rule:** "Temporary Hit Points are... lost if the user is recalled in a Poke Ball, and disappears on its own after 5 minutes while outside of combat." (`core/07-combat.md#page-247`)
- **Implementation:** The switch endpoint does NOT clear `temporaryHp` on the recalled Pokemon's DB record. The Pokemon model has `temporaryHp Int @default(0)`. If the Pokemon is later re-released, it would retain its temporary HP from before recall.
- **Status:** INCORRECT -- see HIGH-002

### 9. Trapped Condition Prevents Recall

- **Rule:** "Trapped: A Pokemon or Trainer that is Trapped cannot be recalled. Ghost Type Pokemon are immune to the Trapped Condition." (`core/07-combat.md#page-247`)
- **Implementation:** The 10-step validation chain in `validateSwitch()` does NOT check whether the recalled Pokemon has the Trapped status condition. A Trapped Pokemon can currently be recalled via the switch endpoint without error.
- **Status:** INCORRECT -- see CRITICAL-001

### 10. switchActions Lifecycle (Clear on New Round)

- **Rule:** Design spec: switchActions are "Cleared at the start of each new round" for per-round tracking.
- **Implementation:** `next-turn.post.ts` clears `switchActions` alongside `declarations` when `clearDeclarations` is true (new round boundary). `start.post.ts` initializes `switchActions` to empty array on encounter start. The `buildEncounterResponse` function correctly parses/passes `switchActions`. The `updateFromWebSocket` handler in the encounter store merges `switchActions` from incoming data.
- **Status:** CORRECT

### 11. SwitchAction.forced Comment References Whirlwind

- **Rule:** Per decree-034: "Whirlwind is a push move, not a forced switch." Roar uses its own 6m recall range. Whirlwind has NO recall or forced-switch mechanic.
- **Implementation:** The `forced` field JSDoc in `SwitchAction` interface (`app/types/combat.ts`, line 122) says: `"Whether forced by a move (Roar, Whirlwind, etc.)"`. This incorrectly implies Whirlwind triggers forced switches.
- **Status:** INCORRECT -- see MEDIUM-001

### 12. Position Placement

- **Rule:** PTU p.229: "Switching Pokemon... returns their current active Pokemon into its Poke Ball and sends out another Pokemon to take its place."
- **Implementation:** The released Pokemon defaults to the recalled Pokemon's grid position (`recalledPosition`), with an optional `releasePosition` override from the request body. Side is inherited from the recalled combatant.
- **Status:** CORRECT

### 13. Side Preservation

- **Rule:** Replacement Pokemon should fight on the same side as the recalled Pokemon.
- **Implementation:** `switch.post.ts` line 173: `side: recalledSide`.
- **Status:** CORRECT

---

## Decree Compliance

### decree-006: Dynamic initiative reorder on speed changes

**Status: Compliant.** The `insertIntoTurnOrder` function inserts the new Pokemon among unacted combatants only, preserving acted/current slots. This respects decree-006's "never grant extra turns" principle. Ties in full contact mode are broken by `sortByInitiativeWithRollOff` (d20 roll-off). No conflict.

### decree-021: True two-phase trainer system for League Battles

**Status: Compliant.** `insertIntoLeagueTurnOrder()` correctly:
- Inserts new Pokemon into `pokemonTurnOrder` always (line 203-205)
- Inserts into active `turnOrder` only during pokemon phase (line 210-221)
- Does NOT modify `trainerTurnOrder` (new combatant is a Pokemon) (line 227)
- During trainer phases, the Pokemon will appear when pokemon phase starts

### decree-033: Fainted switch timing (on trainer's next turn)

**Status: Not applicable to P0.** P0 only implements voluntary full switch. Fainted switch is P1 scope. The `SwitchAction.actionType` includes `'fainted_switch'` for forward compatibility. No conflict.

### decree-034: Roar recall range and Whirlwind push

**Status: Minor violation in documentation.** The `SwitchAction.forced` JSDoc comment incorrectly references Whirlwind as a forced switch (MEDIUM-001). No functional violation since forced switch logic is P1 scope. The `POKEBALL_RECALL_RANGE = 8` constant is correctly specific to voluntary switching (Roar uses its own 6m range per decree-034).

---

## Summary

The P0 switching workflow is **mechanistically sound** for its core path: Standard Action cost, 8m recall range with League exemption, initiative insertion for both Full Contact and League modes, action availability checking on the correct initiating combatant, turn order management, and switchActions lifecycle.

However, three PTU rules governing **recall side-effects** (what happens when a Pokemon is recalled into its Poke Ball) are missing from the validation and execution flow:

1. **CRITICAL -- Trapped prevention:** PTU p.247 explicitly states "Trapped... cannot be recalled." No check exists in the validation chain. A Trapped Pokemon (via Mean Look, Block, Spider Web, Shadow Tag, Arena Trap, Magnet Pull) can be illegally recalled.

2. **HIGH -- Volatile condition clearing:** PTU p.247 says volatile afflictions are "cured completely... from Pokemon by recalling them into their Poke Balls." The recalled Pokemon's DB record retains volatile conditions (Confused, Flinched, Infatuated, Cursed, Disabled, Enraged, Suppressed, Stuck, Slowed, Tripped, Vulnerable) after recall.

3. **HIGH -- Temporary HP clearing:** PTU p.247 says Temporary HP is "lost if the user is recalled in a Poke Ball." The recalled Pokemon's `temporaryHp` DB field is not zeroed on recall.

These three issues share a common root cause: the switch endpoint handles the action mechanics (remove combatant, build new one, insert into turn order, mark action used) but does not apply the side-effects of the recall itself on the recalled Pokemon's persistent state.

---

## Rulings

### CRITICAL-001: Trapped Condition Not Checked on Recall

- **Severity:** CRITICAL
- **Rule:** "Trapped: A Pokemon or Trainer that is Trapped cannot be recalled." (`core/07-combat.md#page-247`)
- **File:** `app/server/services/switching.service.ts`, function `validateSwitch()` (lines 326-394)
- **Issue:** The 10-step validation chain checks: encounter active, trainer exists, recalled Pokemon exists, ownership (x2), released not in encounter, released not fainted, then delegates range and action checks. It does NOT check whether the recalled Pokemon has the `Trapped` status condition. Per PTU rules, Trapped is a hard block on recall.
- **Impact:** A Trapped Pokemon (set by Mean Look, Block, Spider Web, Shadow Tag, Arena Trap, Magnet Pull) can be illegally recalled. This fundamentally breaks the Trapped mechanic, which exists specifically to prevent switching. Any opponent who uses a trapping move/ability gains no benefit from it.
- **Fix:** Add a Trapped check after step 3 (recalled combatant found) in `validateSwitch()`:
  ```typescript
  // 3b. Recalled Pokemon must not be Trapped
  const recalledStatuses: string[] = (recalled.entity as any)?.statusConditions || []
  if (recalledStatuses.includes('Trapped')) {
    return { valid: false, error: 'Pokemon is Trapped and cannot be recalled', statusCode: 400 }
  }
  ```
  Ghost-type immunity to Trapped should be enforced at the status application layer (when Trapped would be applied), not here. If a Ghost-type somehow has Trapped, allowing the switch is acceptable since Ghosts are immune anyway.

### HIGH-001: Volatile Status Conditions Not Cleared on Recall

- **Severity:** HIGH
- **Rule:** "Volatile Afflictions are cured completely at the end of the encounter, and from Pokemon by recalling them into their Poke Balls." (`core/07-combat.md#page-247`). Also: "Slowed: ...This condition may be removed by switching" (p.247). "Stuck: ...This condition may be removed by switching" (p.247).
- **File:** `app/server/api/encounters/[id]/switch.post.ts` (execution section, after step 2)
- **Issue:** The recalled Pokemon's DB record retains all status conditions, including volatile ones, after recall. When the Pokemon is later re-released, `buildPokemonEntityFromRecord` reads `statusConditions` from the DB and loads them onto the new combatant. Volatile conditions that should have been cured by recall persist.
- **Impact:** Switching no longer cures Confusion, Infatuation, Slowed, Stuck, and other volatile conditions. This removes a core strategic incentive for switching (clearing debuffs) and produces mechanically incorrect game states.
- **Fix:** After the removal step in `switch.post.ts`, update the recalled Pokemon's DB record to strip volatile conditions:
  ```typescript
  const VOLATILE_CONDITIONS = [
    'Confused', 'Flinched', 'Infatuated', 'Cursed', 'Disabled',
    'Enraged', 'Suppressed', 'Stuck', 'Slowed', 'Tripped', 'Vulnerable'
  ]
  // Also includes: Bad Sleep (volatile sub-status of Sleep)
  const recalledDbRecord = await prisma.pokemon.findUnique({
    where: { id: recalledCombatant.entityId }
  })
  if (recalledDbRecord) {
    const currentStatuses: string[] = JSON.parse(recalledDbRecord.statusConditions || '[]')
    const persistentOnly = currentStatuses.filter(s => !VOLATILE_CONDITIONS.includes(s))
    await prisma.pokemon.update({
      where: { id: recalledCombatant.entityId },
      data: { statusConditions: JSON.stringify(persistentOnly) }
    })
  }
  ```
  Note: The VOLATILE_CONDITIONS list should be centralized (e.g., in `constants/statusConditions.ts`) since it is needed by multiple systems (encounter end, switching, Pokemon Center healing).

### HIGH-002: Temporary HP Not Cleared on Recall

- **Severity:** HIGH
- **Rule:** "Temporary Hit Points are... lost if the user is recalled in a Poke Ball." (`core/07-combat.md#page-247`)
- **File:** `app/server/api/encounters/[id]/switch.post.ts` (execution section)
- **Issue:** The recalled Pokemon's `temporaryHp` field in the DB is not zeroed on recall.
- **Impact:** Pokemon illegally retain Temporary HP across switches. A Pokemon buffed with Temporary HP (from moves like Wish, Aqua Ring effects, etc.) could be recalled and re-released with the HP intact, which PTU explicitly prohibits.
- **Fix:** Combine with the HIGH-001 DB update:
  ```typescript
  await prisma.pokemon.update({
    where: { id: recalledCombatant.entityId },
    data: {
      statusConditions: JSON.stringify(persistentOnly),
      temporaryHp: 0
    }
  })
  ```

### MEDIUM-001: SwitchAction Comment Incorrectly References Whirlwind

- **Severity:** MEDIUM
- **Rule:** Per decree-034: "Whirlwind is a push move, not a forced switch."
- **File:** `app/types/combat.ts`, line 122
- **Issue:** The `forced` field comment on the `SwitchAction` interface says: `"Whether forced by a move (Roar, Whirlwind, etc.)"`. Per decree-034, Whirlwind is NOT a forced switch. It is a push/displacement move with no recall mechanic. Only Roar (and similar moves with explicit recall text) qualify as forced switches.
- **Impact:** Misleading documentation that contradicts an active decree. Could lead to incorrect Whirlwind implementation in P1 if developers follow the comment.
- **Fix:** Change to: `"Whether forced by a move with recall mechanics (Roar, etc.) -- per decree-034, only moves with explicit recall text qualify"`

### MEDIUM-002: Recalled Pokemon stageModifiers Not Cleared in DB

- **Severity:** MEDIUM
- **Rule:** "Combat Stages remain until the Pokemon or Trainer is switched out, or until the end of the encounter." (`core/07-combat.md#page-234`)
- **File:** `app/server/api/encounters/[id]/switch.post.ts`
- **Issue:** The Pokemon DB record has a `stageModifiers` field (`String @default("{}")` in schema.prisma) that persists combat stage data. While the combatant object (transient) is correctly destroyed on recall -- effectively clearing stages -- the DB record retains stale stage data. If any code path reads `stageModifiers` from the DB entity directly when re-building a combatant, the old stages would carry over. The `buildCombatantFromEntity` function likely initializes fresh stages, but the stale DB data is a maintenance hazard.
- **Fix:** Add `stageModifiers: JSON.stringify({})` to the recall side-effects DB update, or verify and document that `buildCombatantFromEntity` always initializes fresh stage modifiers regardless of the DB value.

---

## Verdict

**CHANGES_REQUIRED**

The core switching mechanics (Standard Action cost, 8m range with League exemption, initiative insertion, turn order management, switchActions lifecycle, position/side preservation) are correctly implemented per PTU 1.05 p.229-232 and all applicable decrees (decree-006, decree-021, decree-033, decree-034).

However, the **recall side-effects** from PTU p.247 are missing. These are not obscure edge cases -- they are core rules governing what happens when any Pokemon enters a Poke Ball:

- **CRITICAL-001** (Trapped check) must be fixed before P0 approval. Trapped is a fundamental combat mechanic and its enforcement is non-negotiable.
- **HIGH-001** (volatile condition clearing) and **HIGH-002** (temp HP clearing) should be fixed in P0 as well, since they are inherent to the recall action itself, not specific to any P1/P2 feature.

All three fixes share a common implementation pattern: a single DB update on the recalled Pokemon after removal from the encounter.

---

## Required Changes

1. **CRITICAL-001**: Add Trapped status condition check to `validateSwitch()` in `switching.service.ts` -- block recall if Pokemon has Trapped condition
2. **HIGH-001**: Clear volatile status conditions on recalled Pokemon's DB record in `switch.post.ts` after removal
3. **HIGH-002**: Clear `temporaryHp` on recalled Pokemon's DB record in `switch.post.ts` after removal
4. **MEDIUM-001**: Fix `SwitchAction.forced` JSDoc comment in `app/types/combat.ts` to remove Whirlwind reference per decree-034
5. **MEDIUM-002**: Clear `stageModifiers` on recalled Pokemon's DB record, or verify and document fresh initialization on re-release
