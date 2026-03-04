---
review_id: code-review-329
review_type: code
reviewer: senior-reviewer
trigger: refactoring
target_report: refactoring-125
domain: encounter
commits_reviewed:
  - ceb39066
  - 71058454
  - 0e71e396
  - 1551c5fb
  - cfc507a0
files_reviewed:
  - app/components/encounter/CombatantGmActions.vue
  - app/components/encounter/CombatantCard.vue
  - app/components/encounter/CLAUDE.md
  - artifacts/tickets/in-progress/refactoring/refactoring-125.md
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 0
  medium: 1
reviewed_at: 2026-03-04T15:00:00Z
follows_up: null
---

## Review Scope

Extraction of GM action controls from CombatantCard.vue (930 lines, exceeding 800-line CRITICAL limit) into CombatantGmActions.vue. Pure refactoring -- no behavioral changes expected.

Checked against decrees 001-046. decree-034 (Whirlwind is push, not forced switch) is referenced in CombatantGmActions.vue line 302 comment and logic is preserved from the original. No decree violations found.

## Issues

### MEDIUM

**M1: `app-surface.md` not updated with new CombatantGmActions component.**
Per project checklist, new components must be registered in `app-surface.md`. CombatantGmActions is documented in the encounter CLAUDE.md (correct) but missing from `.claude/skills/references/app-surface.md`. Add an entry in the encounter component section.

## What Looks Good

1. **Clean extraction boundary.** The GM actions panel is a self-contained unit: input state (damageInput, healInput), modal state (4 modals), switch button computed properties (5 computeds with non-trivial turn/action logic), and action handlers. All correctly moved with no logic changes.

2. **Props interface is well-scoped.** The 6 props (combatant, displayName, currentTempHp, currentStages, statusConditions, entityTypes) provide exactly the data CombatantGmActions needs without passing the entire parent's computed state. The child component independently accesses `useEncounterStore()` for turn-order checks in the switch button computeds, which is the correct pattern since that data is dynamic and not owned by the parent.

3. **Event forwarding is complete and type-safe.** All 9 emitted events (damage, heal, stages, status, openActions, remove, switchPokemon, faintedSwitch, forceSwitch) are properly declared with typed signatures in both components. The parent CombatantCard uses inline arrow functions to forward each event, which matches the existing pattern used by CombatantSides.vue upstream.

4. **SCSS properly split.** The `.combatant-gm-actions`, `.action-row`, `.use-item-btn`, and `.btn-icon` styles moved to CombatantGmActions. The stale `&__actions` rule was removed from CombatantCard in a separate commit (0e71e396). CombatantCard retains all card layout, visual, badge, and status styles.

5. **Line counts within limits.** CombatantCard: 585 lines (well under 800). CombatantGmActions: 396 lines (well under 800).

6. **Commit granularity is appropriate.** Four logical commits: create new file, wire it up in parent, clean up dead SCSS, update docs. Each produces a working state (though commit 1 alone creates an unreferenced file, the sequence is correct for review).

7. **No behavioral changes.** Verified via diff: every template element, computed property, handler function, and SCSS rule from the original `__actions` section and associated script logic appears identically in CombatantGmActions.vue. The `PhFirstAidKit` import moved to the child; `PhHorse` stays in the parent. The `emit` variable in CombatantCard changed from `const emit = defineEmits` to `defineEmits` (no local binding needed since the parent only uses `$emit` in template now).

8. **Documentation updated.** Encounter CLAUDE.md correctly incremented component count from 36 to 37 and added CombatantGmActions to the Combatant Cards category.

## Verdict

**CHANGES_REQUIRED** -- one medium issue (app-surface.md not updated). Fix is mechanical and small. No correctness or logic concerns.

## Required Changes

1. **M1:** Add CombatantGmActions to `.claude/skills/references/app-surface.md` in the encounter components section, alongside the existing CombatantCard and CombatantCaptureSection entries.
