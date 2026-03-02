---
id: docs-004
title: "Add CLAUDE.md for app/components/encounter/"
priority: P0
severity: HIGH
status: in-progress
domain: combat
source: plan-descendant-claude-md-rollout
created_by: user
created_at: 2026-03-02
phase: 1
affected_files:
  - app/components/encounter/CLAUDE.md (new)
---

# docs-004: Add CLAUDE.md for app/components/encounter/

## Summary

Create a descendant CLAUDE.md in `app/components/encounter/` to document the core gameplay loop. With 33 components spanning turn flow, damage resolution, status management, out-of-turn actions, Pokemon management, healing, and XP distribution, this is the largest component domain. Agents need the turn lifecycle, battle mode differences, and component→composable delegation map to work effectively.

## Target File

`app/components/encounter/CLAUDE.md` (~70 lines)

## Required Content

### Turn Lifecycle (5 phases)
1. **Declaration** (`currentPhase === 'trainer_declaration'`) — League Battles only. Trainers declare in low-speed-first order. `DeclarationPanel.vue` collects declarations, store calls `POST /declare`.
2. **Priority Window** (`betweenTurns === true`) — After `nextTurn()`. `PriorityActionPanel.vue` shows eligible combatants. GM either declares priority action or clicks "No Priority — Continue".
3. **Action Phase** (`currentPhase === 'pokemon'` or `'trainer_resolution'`) — Current combatant acts. `GMActionModal.vue` is the central hub: tracks standard/shift action usage, presents moves, maneuvers, items.
4. **Out-of-Turn Interrupts** — Movement/attacks can trigger AoOs (`AoOPrompt.vue`) or Intercepts (`InterceptPrompt.vue`). Detected by server's `out-of-turn.service.ts` and `intercept.service.ts`.
5. **Turn End** — `encounterStore.nextTurn()` calls `POST /next-turn`. Server processes tick damage (Burn/Poison via `status-automation.service.ts`), checks held actions, advances `currentTurnIndex`.

### Battle Modes
- **Full Contact**: All combatants in single initiative order, `currentPhase = 'pokemon'`
- **League (Trainer)**: Two-phase system per decree-021
  - `trainer_declaration`: trainers declare (low speed first) via DeclarationPanel
  - `trainer_resolution`: trainers resolve (high speed first)
  - `pokemon`: Pokemon act (high speed first)

### Damage Flow
```
MoveButton (click) → MoveTargetModal (select targets, preview damage)
  → useMoveCalculation (accuracy + damage math)
  → DamageSection (display per-target breakdown)
  → TargetDamageList (multi-target layout)
```

### Component Categories (33 components)

**Turn Flow (5):** DeclarationPanel, DeclarationSummary, PriorityActionPanel, GMActionModal, HoldActionButton

**Damage & Move Resolution (7):** DamageSection, MoveButton, MoveInfoCard, MoveTargetModal, TargetDamageList, TargetSelector, ManeuverGrid

**Combatant Cards (3):** CombatantCard (GM), GroupCombatantCard (Group view), PlayerCombatantCard (Player view)

**Status & Conditions (3):** CombatantConditionsSection, StatusConditionsModal, CombatStagesModal

**Out-of-Turn (2):** AoOPrompt, InterceptPrompt

**Pokemon Management (3):** AddCombatantModal, SwitchPokemonModal, CaptureRateDisplay

**Healing & Items (3):** UseItemModal, TempHpModal, BreatherShiftBanner

**XP & Level Up (4):** XpDistributionModal, XpDistributionResults, LevelUpNotification, TrainerXpSection

**Encounter Setup (3):** BudgetIndicator, SignificancePanel, PlayerRequestPanel

### Component→Composable Delegation
| Composable | Used By |
|---|---|
| `useEncounterStore()` | DeclarationPanel, GMActionModal, MoveTargetModal, CombatantCard, SwitchPokemonModal, PriorityActionPanel, SignificancePanel, UseItemModal, XpDistributionModal |
| `useMoveCalculation()` | MoveTargetModal (full pre-hit damage preview with effectiveness) |
| `useDamageCalculation()` | DamageSection (dice rolling) |
| `useFlankingDetection()` | MoveTargetModal (flanking penalty overlay) |
| `useCombat()` | GroupCombatantCard, PlayerCombatantCard (HP calcs, stage multipliers) |
| `useCapture()` | CombatantCard, CaptureRateDisplay |
| `useSwitching()` | SwitchPokemonModal (bench Pokemon, range check, execute switch) |
| `useHealingItems()` | UseItemModal (item catalog, apply healing) |
| `useCombatantDisplay()` | TargetSelector, MoveTargetModal, UseItemModal (name resolution) |
| `useTypeChart()` | MoveButton (STAB check) |
| `usePokemonSprite()` / `useTrainerSprite()` | All card components, AddCombatantModal, SwitchPokemonModal |

## Verification

- File is 30-80 lines
- Turn lifecycle matches actual encounter store phase handling
- Component count verified against actual directory listing (33 .vue files)
- Battle mode descriptions match decree-021
- Composable delegation map verified against actual component imports

## Resolution Log

- **Commit:** `0acd51bc` — docs: add encounter components CLAUDE.md with turn lifecycle and composable map
- **File created:** `app/components/encounter/CLAUDE.md` (60 lines)
- All 33 components categorized into 9 groups
- Turn lifecycle documented with 5 phases
- Battle modes reference decree-021
- 11 encounter composables mapped to their consuming components
- Damage flow chain documented: MoveButton -> MoveTargetModal -> useMoveCalculation -> DamageSection -> TargetDamageList
