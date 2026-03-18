# Encounter Composable Delegation

How [[encounter-component-categories|encounter components]] delegate to [[composable-domain-grouping|composables]]:

| Composable | Purpose | Used by |
|---|---|---|
| `useCombat` | Stage multipliers, HP calc, evasions, injuries, XP | CombatantCard, GroupCombatantCard, PlayerCombatantCard |
| `useMoveCalculation` | Accuracy, damage, range/LoS, STAB, targeting, vision penalties | MoveTargetModal |
| `useDamageCalculation` | Damage base chart, rolled/set damage modes | DamageSection |
| `useEncounterActions` | GM action handlers (damage, heal, stages, status, moves, grid); uses useGmToast | pages/gm/index.vue |
| `useEncounterHistory` | Undo/redo with 50-snapshot ring buffer | pages/gm/index.vue |
| `useEncounterBudget` | Difficulty budget analysis (PTU p.460) | BudgetIndicator |
| `useSwitching` | Switch, recall, release workflows (Standard/Shift action cost) | SwitchPokemonModal |
| `useHealingItems` | Item filtering by category and target state | UseItemModal |
| `useCapture` | Capture rate calc, accuracy check (AC 6), ball modifiers | CapturePanel |
| `useSwitchModalState` | Switch modal open/close, trainer/pokemon ID resolution | pages/gm/index.vue |
| `useCombatantDisplay` | Name resolution for Pokemon (nickname/species) and humans | MoveTargetModal, UseItemModal, TargetSelector |
| `useCombatantSwitchButtons` | Switch button visibility/disabled logic | CombatantGmActions |
| `useGmToast` | Non-blocking GM toast notifications | GmToastContainer, useEncounterActions |
| `useOutOfTurnState` | Out-of-turn computed getters (pendingAoOs, holdQueue, isBetweenTurns) | PriorityActionPanel, pages/gm/index.vue |
| `useFlankingDetection` | Flanking penalty overlay on target selection | MoveTargetModal |

Shared composables also used: `useTypeChart` (MoveButton), `usePokemonSprite`/`useTrainerSprite` (all card components), `useWebSocket` (PlayerRequestPanel, SignificancePanel).

## See also

- [[nine-step-damage-formula]] — the calculation `useMoveCalculation` implements
- [[evasion-and-accuracy-system]] — accuracy/evasion math in `useMoveCalculation` and `useCombat`
- [[combat-stage-system]] — stage multipliers used by `useCombat`
- [[move-frequency-system]] — frequency validation in move execution
- [[encounter-store-decomposition]]
- [[damage-flow-pipeline]]
