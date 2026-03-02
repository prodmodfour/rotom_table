# Encounter Components

33 components managing PTU combat. Parent page: `pages/gm/index.vue` (GM) and `pages/group/index.vue` (Group view).

## Turn Lifecycle (5 Phases)

1. **Declaration** (`currentPhase === 'trainer_declaration'`, League only) — `DeclarationPanel` collects declarations, store calls `POST /declare`.
2. **Priority Window** (`betweenTurns === true`) — `PriorityActionPanel` after `nextTurn()`. GM declares priority or continues.
3. **Action Phase** (`currentPhase === 'pokemon'` or `'trainer_resolution'`) — `GMActionModal` hub: Standard/Shift/Swift actions, moves, maneuvers.
4. **Out-of-Turn Interrupts** — `AoOPrompt` / `InterceptPrompt` triggered by `out-of-turn.service.ts` and `intercept.service.ts`.
5. **Turn End** — `encounterStore.nextTurn()` calls `POST /next-turn`. Server runs `status-automation.service.ts` (Burn/Poison tick), advances `currentTurnIndex`.

## Battle Modes

- **Full Contact**: single initiative list, `pokemon` phase only. All combatants act in speed order.
- **League / Trainer** (decree-021): three phases per round — `trainer_declaration` (low-to-high speed), `trainer_resolution` (high-to-low speed), then `pokemon` phase. Faster trainers see slower declarations before resolving. Death is suppressed in League mode.

## Damage Flow

`MoveButton` (select move) -> `MoveTargetModal` (pick targets, roll accuracy, roll damage) -> `useMoveCalculation` (STAB, range/LoS, evasion, effectiveness, rough terrain penalty) -> `DamageSection` (damage roll display) -> `TargetDamageList` (per-target final damage after defense and type effectiveness).

For status moves (no damage base), MoveTargetModal skips the damage section entirely.

## Component Categories (33 components, 9 categories)

**Turn Flow (5):** DeclarationPanel, DeclarationSummary, PriorityActionPanel, HoldActionButton, SignificancePanel

**Damage / Move Resolution (7):** MoveButton, MoveTargetModal, DamageSection, TargetDamageList, TargetSelector, MoveInfoCard, ManeuverGrid

**Combatant Cards (4):** CombatantCard (GM), GroupCombatantCard (Group view), PlayerCombatantCard (Player view), PlayerRequestPanel

**Status / Conditions (3):** StatusConditionsModal, CombatStagesModal, CombatantConditionsSection

**Out-of-Turn (2):** AoOPrompt, InterceptPrompt

**Pokemon Management (3):** SwitchPokemonModal, AddCombatantModal, CaptureRateDisplay

**Healing / Items (3):** UseItemModal, TempHpModal, BreatherShiftBanner

**XP / Level Up (4):** XpDistributionModal, XpDistributionResults, LevelUpNotification, TrainerXpSection

**Encounter Setup (2):** BudgetIndicator, GMActionModal

## Composable Delegation (11 encounter composables)

| Composable | Purpose | Used by |
|---|---|---|
| `useCombat` | Stage multipliers, HP calc, evasions, injuries, XP | CombatantCard, GroupCombatantCard, PlayerCombatantCard |
| `useMoveCalculation` | Accuracy, damage, range/LoS, STAB, targeting | MoveTargetModal |
| `useDamageCalculation` | Damage base chart, rolled/set damage modes | DamageSection |
| `useEncounterActions` | GM action handlers (damage, heal, stages, status, moves, grid) | pages/gm/index.vue (parent) |
| `useEncounterHistory` | Undo/redo with 50-snapshot ring buffer | pages/gm/index.vue (parent) |
| `useEncounterBudget` | Difficulty budget analysis (PTU p.460) | BudgetIndicator (via parent) |
| `useSwitching` | Switch, recall, release workflows (Standard/Shift action cost) | SwitchPokemonModal |
| `useHealingItems` | Item filtering by category and target state | UseItemModal |
| `useCapture` | Capture rate calc, accuracy check (AC 6), ball modifiers | CombatantCard |
| `useSwitchModalState` | Switch modal open/close, trainer/pokemon ID resolution | pages/gm/index.vue (parent) |
| `useCombatantDisplay` | Name resolution for Pokemon (nickname/species) and humans | MoveTargetModal, UseItemModal, TargetSelector |
| `useEncounterStore()` | Core encounter state, turn management, combatant CRUD | DeclarationPanel, GMActionModal, MoveTargetModal, CombatantCard, PriorityActionPanel, SwitchPokemonModal, SignificancePanel, UseItemModal, XpDistributionModal |
| `useFlankingDetection()` | Flanking penalty overlay on target selection | MoveTargetModal |

Shared composables also used: `useTypeChart` (MoveButton), `usePokemonSprite` / `useTrainerSprite` (all card components), `useWebSocket` (PlayerRequestPanel, SignificancePanel).
