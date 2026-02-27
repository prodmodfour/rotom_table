---
review_id: rules-review-122
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-045
domain: equipment
commits_reviewed:
  - 49a45e7
  - dc177e9
  - 8c69c64
  - 0a2f936
  - dc3b0e3
mechanics_verified:
  - equipment-dr-values-unchanged
  - equipment-evasion-values-unchanged
  - equipment-focus-stat-bonus-values-unchanged
  - heavy-armor-speed-penalty-unchanged
  - helmet-conditional-dr-unchanged
  - custom-item-dr-evasion-bounds
  - equipment-bonuses-display-integrity
  - websocket-broadcast-data-completeness
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/09-gear-and-items.md#p286-Equipment
  - core/09-gear-and-items.md#p293-Body-Equipment
  - core/09-gear-and-items.md#p293-Head-Equipment
  - core/09-gear-and-items.md#p294-Hand-Equipment
  - core/09-gear-and-items.md#p295-Accessory-Items
reviewed_at: 2026-02-22T22:30:00Z
follows_up: rules-review-117
---

# Rules Review 122: Equipment P2 Follow-up Fixes (code-review-127)

## Scope

Re-review of 5 fix commits (49a45e7..dc3b0e3) that address C1/H1/H2/M1 issues from code-review-127 (ptu-rule-045 P2 CHANGES_REQUIRED). The previous rules review (rules-review-117) approved P2 with 0 critical/high issues and 2 pre-existing medium issues. This review verifies that the follow-up fixes do not alter or break any PTU game mechanics.

**Changes in scope:**
- C1: WebSocket broadcast moved from child `HumanEquipmentTab.vue` to parent components (`CharacterModal.vue`, `gm/characters/[id].vue`)
- H1: `STAT_LABELS` and `SLOT_LABELS` extracted to shared `constants/equipment.ts`
- H2: `app-surface.md` updated with Equipment tab and components
- M1: `max="100"` added to custom item DR and Evasion inputs

**Files changed:** `HumanEquipmentTab.vue`, `EquipmentCatalogBrowser.vue`, `CharacterModal.vue`, `gm/characters/[id].vue`, `constants/equipment.ts`, `app-surface.md`, `ptu-rule-045.md`

**Files NOT changed:** `equipmentBonuses.ts`, all server files (no API, service, or damage calculation changes)

---

## Mechanics Verified

### 1. Equipment DR Values (Armor)

- **Rule:** "Light Armor: Grants 5 Damage Reduction. $8000" / "Heavy Armor grants +10 Damage Reduction. Heavy Armor causes the wearer's Speed's Default Combat Stage to be -1. $12,000" (`09-gear-and-items.md` p.293)
- **Implementation:** `EQUIPMENT_CATALOG['Light Armor']` = `{ damageReduction: 5 }`, `EQUIPMENT_CATALOG['Heavy Armor']` = `{ damageReduction: 10, speedDefaultCS: -1 }` (`constants/equipment.ts` lines 13-27). These values are unchanged by any of the 5 commits. The only change to `constants/equipment.ts` was adding `SLOT_LABELS` and `STAT_LABELS` exports (lines 133-153), which are purely display labels with no mechanical impact.
- **Status:** CORRECT -- no regression

### 2. Equipment Evasion Values (Shields)

- **Rule:** "Light Shields grant +2 Evasion" / "Heavy Shields grnat [sic] +2 Evasion" (`09-gear-and-items.md` p.294)
- **Implementation:** `EQUIPMENT_CATALOG['Light Shield']` = `{ evasionBonus: 2 }`, `EQUIPMENT_CATALOG['Heavy Shield']` = `{ evasionBonus: 2 }` (`constants/equipment.ts` lines 57-74). Readied bonuses also unchanged: Light Shield readied = `{ evasionBonus: 4, damageReduction: 10, appliesSlowed: true }`, Heavy Shield readied = `{ evasionBonus: 6, damageReduction: 15, appliesSlowed: true }`.
- **Status:** CORRECT -- no regression

### 3. Focus Stat Bonus Values

- **Rule:** "A Focus grants +5 Bonus to a Stat, chosen when crafted. This Bonus is applied AFTER Combat Stages." (`09-gear-and-items.md` p.295)
- **Implementation:** All five Focus items retain `statBonus: { stat: '<stat>', value: 5 }` and `cost: 6000` (`constants/equipment.ts` lines 91-125). Unchanged by these commits.
- **Status:** CORRECT -- no regression

### 4. Heavy Armor Speed Penalty

- **Rule:** "Heavy Armor causes the wearer's Speed's Default Combat Stage to be -1." (`09-gear-and-items.md` p.293)
- **Implementation:** `EQUIPMENT_CATALOG['Heavy Armor']` = `{ speedDefaultCS: -1 }` (`constants/equipment.ts` line 24). Unchanged. The `computeEquipmentBonuses()` function in `equipmentBonuses.ts` (which applies `Math.min(speedDefaultCS, item.speedDefaultCS)`) was not modified in any of the 5 commits.
- **Status:** CORRECT -- no regression

### 5. Helmet Conditional DR

- **Rule:** "The user gains 15 Damage Reduction against Critical Hits." (`09-gear-and-items.md` p.293)
- **Implementation:** `EQUIPMENT_CATALOG['Helmet']` = `{ conditionalDR: { amount: 15, condition: 'Critical Hits only' } }` (`constants/equipment.ts` lines 37-42). Unchanged.
- **Status:** CORRECT -- no regression

### 6. Custom Item DR and Evasion Input Bounds (M1 fix)

- **Rule:** PTU does not define a hard maximum for custom equipment DR or evasion, but the existing API Zod validation enforces `0-100` for both fields. This is a reasonable practical upper bound -- the highest standard item DR is 15 (Heavy Shield readied), and the highest standard evasion bonus is 6 (Heavy Shield readied). A max of 100 allows GM flexibility for homebrew without permitting absurd values.
- **Implementation:** Custom item form inputs now have `min="0" max="100"` for DR (`HumanEquipmentTab.vue` line 65) and Evasion (`HumanEquipmentTab.vue` line 69). Speed CS retains `min="-6" max="0"` (line 73). These client-side bounds match the server-side Zod validation exactly.
- **Status:** CORRECT -- the bounds are consistent between client and server, and do not restrict any standard PTU equipment values (all standard items fall well within 0-100).

### 7. Equipment Bonuses Display Integrity

- **Rule:** The combat bonuses summary in `HumanEquipmentTab.vue` should accurately reflect `computeEquipmentBonuses()` output.
- **Implementation:** The `bonuses` computed property (`HumanEquipmentTab.vue` line 197) still calls `computeEquipmentBonuses(props.equipment)`. The template rendering logic (lines 118-148) is unchanged from the P2 implementation approved in rules-review-117. The only change affecting display is that `formatStatName()` (line 223-224) now uses the shared `STAT_LABELS` import from `constants/equipment.ts` instead of a locally defined copy. The values in the shared `STAT_LABELS` are identical to the previously local definition:
  - `attack: 'Attack'`, `defense: 'Defense'`, `specialAttack: 'Sp. Atk'`, `specialDefense: 'Sp. Def'`, `speed: 'Speed'`, `hp: 'HP'`, `accuracy: 'Accuracy'`, `evasion: 'Evasion'`
- **Status:** CORRECT -- display labels are unchanged; the extraction to a shared file is a pure refactor with no mechanical impact

### 8. WebSocket Broadcast Data Completeness (C1 fix)

- **Rule:** The `character_update` WebSocket event must send a complete `HumanCharacter` object so that receiving clients can replace their store entry without data loss.
- **Implementation (CharacterModal.vue, lines 316-321):**
  ```typescript
  const onEquipmentChangedInEncounter = (equipment: EquipmentSlots) => {
    send({
      type: 'character_update',
      data: { ...humanData.value, equipment }
    })
  }
  ```
  `humanData` is `computed(() => props.character as HumanCharacter)` (line 246), which is the full character object passed as a prop. The spread `{ ...humanData.value, equipment }` creates a new object with all character fields intact, overriding only the `equipment` field with the updated value. This is mechanically correct -- the receiving client gets a full `HumanCharacter` with the latest equipment state.

- **Implementation (gm/characters/[id].vue, lines 296-302):**
  ```typescript
  const onEquipmentChangedInEncounter = (equipment: EquipmentSlots) => {
    if (!character.value) return
    send({
      type: 'character_update',
      data: { ...character.value, equipment }
    })
  }
  ```
  `character` is the page's ref holding the full character data fetched from the API. Same spread pattern as CharacterModal. The null guard (`if (!character.value) return`) is an appropriate safety check.

- **Game logic impact:** The WebSocket broadcast itself does not perform any game calculations. It transmits state. The C1 fix ensures equipment bonuses (DR, evasion, Focus, speed CS, conditional DR) are included as part of the full character object, which is what the receiving clients need to render the character correctly. The actual bonus calculations happen on each client via `computeEquipmentBonuses()` when rendering the character. No game logic is altered.
- **Status:** CORRECT -- the fix resolves the data integrity issue without affecting any game mechanics

---

## Errata Considerations

No change from rules-review-117. The implementation uses PTU 1.05 core values, not the September 2015 Playtest Packet values. The playtest packet proposes changes to shields and armor that are not adopted. This is the correct project policy decision per the established ruling in rules-review-117.

---

## Pre-existing Issues (carried forward from rules-review-117)

| ID | Severity | Description | Status |
|----|----------|-------------|--------|
| R117-1 | MEDIUM | Focus one-at-a-time rule not enforced when custom Focus items are in different slots | Unchanged -- not addressed by these commits, not worsened |
| R117-2 | MEDIUM | Catalog omits 12+ non-combat PTU equipment items | Unchanged -- not addressed by these commits, not worsened |

Neither pre-existing issue is affected by the 5 fix commits. The custom item form's new `max="100"` bounds do not interact with Focus stacking (Focus items use `statBonus`, not `damageReduction` or `evasionBonus`). The catalog contents are unchanged.

---

## Summary

| Mechanic | PTU Rule Source | Status After Fixes |
|----------|----------------|--------------------|
| Light Armor DR 5 | p.293 | CORRECT -- unchanged |
| Heavy Armor DR 10 | p.293 | CORRECT -- unchanged |
| Heavy Armor Speed CS -1 | p.293 | CORRECT -- unchanged |
| Helmet 15 DR vs crits | p.293 | CORRECT -- unchanged |
| Light Shield +2 Evasion | p.294 | CORRECT -- unchanged |
| Heavy Shield +2 Evasion | p.294 | CORRECT -- unchanged |
| Shield readied bonuses | p.294 | CORRECT -- unchanged |
| Focus +5 stat after CS | p.295 | CORRECT -- unchanged |
| Custom item DR max | API validation | CORRECT -- client now matches server (0-100) |
| Custom item Evasion max | API validation | CORRECT -- client now matches server (0-100) |
| Bonuses display labels | computed | CORRECT -- shared STAT_LABELS identical to previous local copies |
| WS broadcast completeness | architecture | CORRECT -- full HumanCharacter sent, no game data lost |

## Rulings

1. **No game logic was modified.** All 5 commits are UI-layer changes: event plumbing (C1), constant extraction (H1), input attributes (M1), and documentation (H2, dc3b0e3). The core game logic files (`equipmentBonuses.ts`, server APIs, `combatant.service.ts`, `damageCalculation.ts`) are completely untouched. There is zero risk of formula regression.

2. **The `STAT_LABELS` and `SLOT_LABELS` extraction is a pure refactor.** I verified the values in the shared `constants/equipment.ts` definition (lines 133-153) are character-for-character identical to the previously duplicated definitions in both `HumanEquipmentTab.vue` and `EquipmentCatalogBrowser.vue`. No label was renamed, added, or removed.

3. **The `max="100"` bounds are appropriate.** No standard PTU equipment exceeds DR 15 or Evasion +6 in passive mode. The 100 ceiling matches server-side Zod validation and leaves generous room for GM homebrew without allowing nonsensical values.

## Verdict

**APPROVED**

All equipment mechanics (DR, evasion, Focus stat bonuses, Heavy Armor speed penalty, Helmet conditional DR) remain correct and unchanged. The 5 commits address code-review-127 issues (C1 WS broadcast, H1 duplicated constants, H2 app-surface, M1 input bounds) without modifying any game logic. No new PTU rule violations introduced. No regressions detected. The two pre-existing medium issues from rules-review-117 (Focus stacking, catalog completeness) are unaffected.

## Required Changes

None.
