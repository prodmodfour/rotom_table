---
review_id: code-review-240
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-011
domain: combat
commits_reviewed:
  - c7d1cff8
  - 7bc455d9
  - 241e5f47
  - 1c2bece5
  - 7965cadc
  - 2c86d50c
  - a86b86d0
  - a805fd75
  - 39c0bb06
  - 261d7771
  - 29e33886
  - 8fad2e34
  - d646b77a
files_reviewed:
  - app/server/services/switching.service.ts
  - app/server/api/encounters/[id]/switch.post.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/composables/useSwitching.ts
  - app/components/encounter/SwitchPokemonModal.vue
  - app/components/encounter/CombatantCard.vue
  - app/components/gm/CombatantSides.vue
  - app/components/group/InitiativeTracker.vue
  - app/pages/gm/index.vue
  - app/stores/encounter.ts
  - app/types/combat.ts
  - app/composables/useWebSocket.ts
  - .claude/skills/references/app-surface.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 1
  medium: 2
reviewed_at: 2026-03-01T14:30:00Z
follows_up: code-review-232
---

## Review Scope

Second review of feature-011 Pokemon Switching Workflow, covering P1 implementation. 13 commits by slave-2 across 12 files (+763 lines). P1 adds:

- **Section G**: League Battle switch restriction (`canBeCommanded = false` on switched-in Pokemon, auto-skip in pokemon phase)
- **Section H**: Fainted switch (Shift Action, decree-033 timing enforcement)
- **Section I**: Forced switch (no action cost, GM-triggered by move effects)
- **UI**: Fainted Switch + Force Switch buttons on CombatantCard, extended SwitchPokemonModal with mode badges, dimmed uncommandable Pokemon in InitiativeTracker, League restriction indicator on CombatantCard

**Decree compliance verified:**
- decree-033 (fainted switch on trainer's turn only): `validateFaintedSwitch` checks `currentTurnCombatantId !== trainerId`, client-side `canFaintedSwitch` and `isFaintedSwitchDisabled` both enforce trainer's turn. Correct.
- decree-034 (Roar uses own 6m range; Whirlwind is push, not forced switch): The forced switch endpoint uses the standard 8m recall range, not Roar's 6m. The design spec Section I acknowledges decree-034 and notes that Roar/Whirlwind-specific mechanics are per-move implementation, not the generic forced switch system. The forced switch framework is correctly general-purpose. No violation.
- decree-038 (decouple condition behaviors from categories): Recall-side-effects in `switch.post.ts` line 228 use `RECALL_CLEARED_CONDITIONS`. The current code still uses category-based arrays, but this is a pre-existing pattern tracked by refactoring-106. Not introduced by P1.

**P0 review follow-up (code-review-232):**
All six issues from the P0 review (C1, H1, H2, M1, M2, M3) have been fixed:
- C1 (CRITICAL): `pokemon_switched` WebSocket handler added at `useWebSocket.ts` line 195-197. Verified.
- H1 (HIGH): `captureSnapshot` called before opening switch modal in all three handlers (`handleSwitchPokemon`, `handleFaintedSwitch`, `handleForceSwitch`). `refreshUndoRedoState` called in `handleSwitchCompleted`. Verified.
- H2 (HIGH): `encounter_update` WebSocket broadcast added in `handleSwitchCompleted` (gm/index.vue lines 427-438). Verified.
- M1 (MEDIUM): `canShowSwitchButton` now checks for actual Pokemon ownership in the encounter (CombatantCard.vue lines 374-388). Verified.
- M2 (MEDIUM): Comment added to `getBenchPokemon` acknowledging over-fetch (useSwitching.ts lines 22-25). Verified.
- M3 (MEDIUM): `isSwitchDisabled` rewritten to check trainer turn OR owned Pokemon turn, using the initiating combatant's Standard Action (CombatantCard.vue lines 395-430). Verified.

## Issues

### HIGH

#### H1. CombatantCard.vue exceeds 800-line limit (841 lines)

**File:** `app/components/encounter/CombatantCard.vue` (841 lines)

The file was 730 lines before P1. The addition of fainted switch, force switch, and League restriction indicator UI (+111 lines) pushed it to 841, exceeding the project's 800-line maximum.

The switching button computeds (`canShowSwitchButton`, `isSwitchDisabled`, `canShowFaintedSwitchButton`, `isFaintedSwitchDisabled`, `canShowForceSwitchButton`) account for ~125 lines of script logic. These should be extracted into a composable (e.g., `useCombatantSwitchButtons`) that takes the combatant and returns computed booleans. This would reduce CombatantCard to ~715 lines and keep the switch button logic testable in isolation.

**Fix:** Extract the five switch-related computeds and the `useEncounterStore()` calls they depend on into a composable. The CombatantCard template references stay the same -- only the script changes.

### MEDIUM

#### M1. `switchModalPokemonId` selects first fainted Pokemon arbitrarily when trainer has multiple fainted Pokemon

**File:** `app/pages/gm/index.vue` (lines 463-471)

```typescript
if (switchModalMode.value === 'fainted') {
  const faintedPokemon = encounter.value.combatants.find(
    c => c.type === 'pokemon' &&
      (c.entity as { ownerId?: string }).ownerId === combatant.entityId &&
      c.entity.currentHp <= 0
  )
  return faintedPokemon?.id ?? ''
}
```

When a trainer has multiple fainted Pokemon in the encounter and clicks "Fainted Switch" on their trainer card, this selects the *first* fainted Pokemon found. The GM has no way to choose which fainted Pokemon to recall. If the trainer has a fainted Pikachu at position (3,4) and a fainted Bulbasaur at position (7,8), the system always picks the first one it finds in the combatants array.

The fix is to either: (a) show a sub-selection step in the SwitchPokemonModal letting the GM pick which fainted Pokemon to recall, or (b) when the trainer has multiple fainted Pokemon, require the GM to click the fainted switch button on the specific fainted Pokemon's card (not the trainer's card). Option (b) is simpler and already works -- clicking "Fainted Switch" on a fainted Pokemon card correctly sets `switchModalPokemonId` to that Pokemon's combatant ID (line 461: `if (combatant.type === 'pokemon') return combatant.id`). Option (a) is a better UX but is P2 scope.

**Fix:** For now, add a code comment documenting this limitation and noting that the GM should click the button on the specific fainted Pokemon's card when there are multiple fainted Pokemon. The trainer-card button is a convenience for the single-fainted-Pokemon case.

#### M2. `app-surface.md` not updated for P1 additions

**File:** `.claude/skills/references/app-surface.md` (line 152)

The switching system description still reads as P0-only:
> `composables/useSwitching.ts` (getBenchPokemon, canSwitch pre-validation, executeSwitch)

Missing from the description:
- `canFaintedSwitch` validation function
- Fainted/forced switch modes in `SwitchPokemonModal`
- `canShowFaintedSwitchButton`, `canShowForceSwitchButton`, `isFaintedSwitchDisabled` on `CombatantCard`
- `validateFaintedSwitch`, `validateForcedSwitch`, `canSwitchedPokemonBeCommanded` in `switching.service.ts`
- `skipUncommandablePokemon` in `next-turn.post.ts`
- League restriction indicator and uncommandable dimming in `InitiativeTracker`

**Fix:** Update the switching system description in `app-surface.md` to mention the P1 additions: fainted switch (Shift Action), forced switch (no cost), League restriction (`canBeCommanded`), auto-skip uncommandable Pokemon in pokemon phase.

## What Looks Good

1. **Decree-033 compliance is thorough.** Both server (`validateFaintedSwitch`) and client (`canFaintedSwitch`, `isFaintedSwitchDisabled`) enforce that fainted switch can only happen on the trainer's turn. The fainted Pokemon cannot initiate its own switch. This matches the decree exactly: "fainted Pokemon switching happens on the trainer's next available turn in initiative order, not as an immediate reaction."

2. **League restriction logic is clean and correct.** `canSwitchedPokemonBeCommanded(isLeague, isFaintedSwitch, isForcedSwitch)` is a pure function with clear exemptions. The restriction is applied in exactly one place (switch.post.ts line 261), persisted to DB, and enforced during turn progression via `skipUncommandablePokemon`. The round reset in `resetCombatantsForNewRound` correctly clears `canBeCommanded` back to `true`.

3. **Three-mode validation architecture is well-separated.** Standard switch uses `validateSwitch` + `validateActionAvailability`. Fainted switch uses `validateSwitch` + `validateFaintedSwitch`. Forced switch uses `validateForcedSwitch` (independent chain that skips Trapped and action checks). Each mode has distinct validation logic without overloading a single function with mode flags.

4. **`skipUncommandablePokemon` is correctly integrated at all transition points.** It runs: (a) during pokemon phase mid-turn progression (line 221), (b) at the start of pokemon phase when transitioning from resolution (lines 249, 269, 286), and (c) at the start of pokemon phase when all trainers skip (lines 249, 269). No path into the pokemon phase misses the skip check.

5. **Fainted switch correctly marks hasActed on skipped Pokemon.** `skipUncommandablePokemon` sets `combatant.hasActed = true` (line 587), ensuring skipped Pokemon don't get a second chance to act if the turn order wraps. This prevents an edge case where the pokemon phase loops back.

6. **Switch endpoint correctly separates action cost by mode.** Forced switch: no action marked (lines 291-292). Fainted switch: Shift Action on trainer (lines 293-298). Standard switch: Standard Action on initiating combatant (lines 299-308). The mode-dependent branching is clean and easy to verify.

7. **SwitchPokemonModal mode UI is well-designed.** Mode badge with color-coded styling (orange for fainted/Shift Action, violet for forced/No Action Cost), League warning only shown for standard switches, fainted recall section with grayscale styling and "Fainted" label. The modal correctly passes `faintedSwitch` and `forced` flags to `executeSwitch`.

8. **InitiativeTracker dimming is unobtrusive and informative.** The `initiative-entry--uncommandable` class applies `opacity: 0.45` and `grayscale(40%)`, with a "Cannot Act" text label. The condition `!combatant.turnState?.canBeCommanded && combatant.entity.currentHp > 0` correctly excludes fainted Pokemon from the uncommandable styling (they have their own fainted styling).

9. **WebSocket integration is complete.** The server broadcasts `pokemon_switched` with full encounter state (switch.post.ts lines 344-357). The client handles it in `useWebSocket.ts` line 195-197. The GM page also broadcasts `encounter_update` in `handleSwitchCompleted` (gm/index.vue lines 427-438). Both update paths are covered.

10. **Undo/redo snapshots are captured for all three switch modes.** `handleSwitchPokemon` captures "Switch Pokemon", `handleFaintedSwitch` captures "Fainted Switch", `handleForceSwitch` captures "Force Switch". All three call `refreshUndoRedoState` via `handleSwitchCompleted`.

11. **Commit granularity is excellent.** 13 commits, each with a single logical change: helpers, endpoint extension, auto-skip, initiative dimming, composable validation, modal extension, buttons, propagation, wiring, fainted resolution fix, League indicator, docs. Clean progression from server to client.

12. **Immutability patterns respected.** The switching service returns new arrays from `removeCombatantFromEncounter` and `insertIntoTurnOrder`. The `markActionUsed` mutation is documented as acceptable (freshly parsed JSON). The `skipUncommandablePokemon` mutation of `hasActed` is similarly acceptable.

## Verdict

**APPROVED**

The P1 implementation is correct, complete, and well-structured. All three switch modes (standard, fainted, forced) work correctly with proper validation on both server and client. Decree-033 (fainted switch timing) is enforced. League Battle restrictions are applied and reset properly. The auto-skip for uncommandable Pokemon covers all transition paths. All P0 review issues have been fixed.

The one HIGH issue (CombatantCard exceeding 800 lines) should be addressed soon via extraction but is not blocking because: (a) the file was already 730 lines before P1, approaching the limit, (b) the new code is well-organized and the extraction is a mechanical refactor, and (c) P2 will add more switch-related UI (batch recall/release) which will force the extraction anyway. File a ticket for the extraction.

## Required Changes

| ID | Severity | File(s) | Description |
|----|----------|---------|-------------|
| H1 | HIGH | `app/components/encounter/CombatantCard.vue` | Extract switch button computeds into a `useCombatantSwitchButtons` composable to bring file under 800 lines. File ticket. |
| M1 | MEDIUM | `app/pages/gm/index.vue` | Add comment to `switchModalPokemonId` documenting that trainer-card fainted switch picks first fainted Pokemon arbitrarily when multiple exist; GM should use the Pokemon card button in that case. |
| M2 | MEDIUM | `.claude/skills/references/app-surface.md` | Update switching system description to include P1 additions: fainted/forced switch modes, League restriction, auto-skip, new composable validation functions. |
