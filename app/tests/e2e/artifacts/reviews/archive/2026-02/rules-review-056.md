---
review_id: rules-review-056
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: bug-015
domain: character-lifecycle
commits_reviewed:
  - f496cad
files_reviewed:
  - app/server/api/characters/[id].put.ts
mechanics_verified:
  - features-as-character-data
  - edges-as-character-data
  - json-serialization-for-features-edges
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/02-character-creation.md#Step 4 Choose Features
  - core/02-character-creation.md#Step 3 Choose Edges
  - core/02-character-creation.md#Leveling Up
reviewed_at: 2026-02-20T12:00:00
---

## Review Scope

Reviewing commit `f496cad` which adds `features` and `edges` handling to the character PUT endpoint (`app/server/api/characters/[id].put.ts`). This fix addresses bug-015: features and edges were frozen after creation because the PUT endpoint did not include them in its update-data builder. The code review (code-review-061) has already APPROVED.

## Mechanics Verified

### Features as Character Data

- **Rule:** "Starting Trainers begin with four Features to distribute as they see fit. They also choose one Training Feature to gain, regardless of prerequisites." (`core/02-character-creation.md`, Step 4). "Every odd Level you gain a Feature." (`core/02-character-creation.md`, p.19 Leveling Up).
- **Implementation:** The Prisma schema stores features as a JSON string column (`features String @default("[]")`). The fix adds `if (body.features !== undefined) updateData.features = JSON.stringify(body.features)` to the PUT endpoint, following the identical pattern used by `trainerClasses`, `skills`, `inventory`, `statusConditions`, and `stageModifiers`.
- **Status:** CORRECT
- **Notes:** Features are a core part of the PTU character sheet. They are gained at character creation (4 + 1 Training Feature) and every odd level thereafter. Being able to update them is essential for the leveling workflow. JSON array serialization is an appropriate storage format for a list of feature names.

### Edges as Character Data

- **Rule:** "Starting Trainers begin with four Edges to distribute as they see fit." (`core/02-character-creation.md`, Step 3). "Every even Level you gain an Edge." (`core/02-character-creation.md`, p.19 Leveling Up).
- **Implementation:** The Prisma schema stores edges as a JSON string column (`edges String @default("[]")`). The fix adds `if (body.edges !== undefined) updateData.edges = JSON.stringify(body.edges)` to the PUT endpoint, matching the existing pattern.
- **Status:** CORRECT
- **Notes:** Edges are equivalent in importance to features for character progression. Trainers gain 4 at creation and 1 every even level. JSON array serialization is the correct pattern, consistent with how the codebase handles all other array-type character fields.

### JSON Serialization for Features/Edges

- **Rule:** PTU does not prescribe a storage format, but features and edges are lists of named items. The Prisma schema uses `@default("[]")` for both columns, confirming they are stored as JSON-serialized string arrays.
- **Implementation:** `JSON.stringify(body.features)` and `JSON.stringify(body.edges)` serialize the arrays to strings before writing to SQLite. This matches the established pattern for all other JSON-stored fields in the same endpoint (`trainerClasses`, `skills`, `inventory`, `statusConditions`, `stageModifiers`).
- **Status:** CORRECT
- **Notes:** Consistent serialization across all JSON fields eliminates the risk of format mismatches between create (POST) and update (PUT) paths.

## Summary

- Mechanics checked: 3
- Correct: 3
- Incorrect: 0
- Needs review: 0

## Rulings

None required. Features and edges are well-defined PTU character data (Core Chapter 2, Steps 3-4, and Leveling Up table). The fix correctly enables editing these fields, which is a prerequisite for level-up progression and retraining workflows.

## Verdict

APPROVED -- The fix correctly enables updates to features and edges, which are standard PTU character progression fields. The serialization pattern is consistent with all other JSON-stored character data. No PTU rule violations.
