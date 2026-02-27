---
review_id: rules-review-058
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: bug-026
domain: combat
commits_reviewed:
  - 70ee060
files_reviewed:
  - app/server/api/encounter-templates/[id]/load.post.ts
mechanics_verified:
  - injury-tracking-data-shape
  - combat-stages-data-shape
  - temporary-hp-field-name
  - action-economy-defaults
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#Injuries (p.237, p.250)
  - core/07-combat.md#Combat Stages (p.235)
  - core/07-combat.md#Temporary Hit Points (p.247)
  - core/07-combat.md#Actions in Combat (p.238)
reviewed_at: 2026-02-20T12:00:00
---

## Review Scope

Reviewing commit `70ee060` which fixes field name and data shape mismatches in the encounter template load endpoint (`app/server/api/encounter-templates/[id]/load.post.ts`) for human combatants. Three issues were addressed: injuries shape, combatStages vs stageModifiers naming, and tempHp vs temporaryHp naming. Bonus fixes added missing action economy fields and turnState fields.

## Mechanics Verified

### Injury Tracking Data Shape

- **Rule:** "For each Injury a Pokemon or Trainer has, their Maximum Hit Points are reduced by 1/10th." (`core/07-combat.md`, p.250). Injuries are tracked as a count. The death threshold is "10 injuries" (`core/07-combat.md`, p.251). The "Heavily Injured" threshold is "5 or more injuries" (`core/07-combat.md`, p.250).
- **Implementation:**
  - **Entity level (HumanCharacter):** Changed from `injuries: { count: 0, max: 5 }` to `injuries: 0`. The `HumanCharacter` type defines `injuries: number` (plain number). This matches PTU's model of injuries as a simple count.
  - **Combatant level:** Changed from `injuries: { count: 0, max: 5 }` to `injuries: { count: 0, sources: [] }`. The `InjuryState` interface in `app/types/combat.ts` defines `{ count: number; sources: string[] }`. The `sources` array is an app-specific extension for tracking what caused each injury (descriptive, as PTU suggests: "it's better to describe the injury").
- **Status:** CORRECT
- **Notes:** The old `{ count: 0, max: 5 }` shape was incorrect in two ways: (1) `max: 5` is wrong -- PTU death occurs at 10 injuries, not 5; 5 is the "Heavily Injured" threshold, not a maximum. (2) The shape did not match either the `HumanCharacter` type (plain number) or the `InjuryState` type (`{ count, sources }`). The fix correctly uses the appropriate shape at each level. Injuries starting at 0 for a freshly loaded template is correct -- a new encounter starts with no injuries.

### Combat Stages Data Shape

- **Rule:** "Only Attack, Defense, Special Attack, Special Defense, and Speed may have Combat Stages." (`core/07-combat.md`, p.235). "Combat Stages remain until the Pokemon or Trainer is switched out, or until the end of the encounter." (`core/07-combat.md`, p.235).
- **Implementation:** The fix removes `combatStages` from the combatant level (where it does not exist on the `Combatant` type) and adds `stageModifiers` to the entity level with the correct `StageModifiers` interface shape: `{ attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 }`. The `StageModifiers` interface in `app/types/combat.ts` includes all five PTU combat stage stats plus accuracy and evasion (which PTU treats as combat-stage-like modifiers per p.234).
- **Status:** CORRECT
- **Notes:** Initializing all combat stages to 0 for a template load is correct -- a fresh encounter starts with neutral stages. The `StageModifiers` type includes `accuracy` and `evasion` in addition to the five core stats. PTU p.234 states "Accuracy's Combat Stages apply directly" and evasion bonuses "stack on top" with the same -6/+6 limits, so including them in the same interface is an appropriate design choice. Placing `stageModifiers` on the entity level (not combatant level) matches the `HumanCharacter` type definition.

### Temporary HP Field Name

- **Rule:** "Some effects grant Temporary Hit Points. Temporary Hit Points are 'bonus' health that stacks on top of 'real' Hit Points." (`core/07-combat.md`, p.247).
- **Implementation:** Changed from `tempHp: 0` to `temporaryHp: 0` on the entity. The `HumanCharacter` type defines `temporaryHp: number`. Initializing to 0 is correct for a new encounter.
- **Status:** CORRECT
- **Notes:** This is a naming consistency fix. The field name `temporaryHp` matches the `HumanCharacter` type and aligns with the PTU terminology "Temporary Hit Points." The previous `tempHp` abbreviation would have caused type mismatches with downstream consumers.

### Action Economy Defaults

- **Rule:** PTU combat actions per turn: "During their turn, a combatant may take one Standard Action, one Shift Action, and one Swift Action." (`core/07-combat.md`, p.238).
- **Implementation:** The fix adds `actionsRemaining: 2` and `shiftActionsRemaining: 1` to the combatant, and `canBeCommanded: true` and `isHolding: false` to the `turnState`. The `Combatant` type requires both `actionsRemaining: number` and `shiftActionsRemaining: number`. The `TurnState` type requires `canBeCommanded: boolean` and `isHolding: boolean`.
- **Status:** CORRECT
- **Notes:** The `actionsRemaining: 2` default is consistent with the canonical `buildCombatantFromEntity` in `combatant.service.ts` (standard action + swift action = 2 non-shift actions tracked). `shiftActionsRemaining: 1` correctly represents the single shift action per turn. `canBeCommanded: true` is the correct default (only false for newly switched Pokemon in League battles). `isHolding: false` is the correct default (no held action at encounter start). All four fields were required by the type definitions but missing from the template load, which would have caused runtime type mismatches.

## Summary

- Mechanics checked: 4
- Correct: 4
- Incorrect: 0
- Needs review: 0

## Rulings

None required. All field shapes and names now correctly match both PTU mechanics and the app's type definitions. The old `{ count: 0, max: 5 }` injury shape was doubly wrong (incorrect max value and incorrect shape); the fix resolves both issues.

## Verdict

APPROVED -- All three ticket issues (injuries shape, combatStages naming, tempHp naming) are correctly resolved. The bonus fixes for action economy fields and turnState fields are also correct per PTU combat rules. The template load endpoint now produces data shapes consistent with both PTU mechanics and the `Combatant`/`HumanCharacter` type definitions.
