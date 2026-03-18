# Encounter Component Categories

40 components managing PTU combat, organized into 12 categories:

| Category | Count | Components |
|---|---|---|
| **Turn Flow** | 5 | DeclarationPanel, DeclarationSummary, PriorityActionPanel, HoldActionButton, SignificancePanel |
| **Damage / Move Resolution** | 7 | MoveButton, MoveTargetModal, DamageSection, TargetDamageList, TargetSelector, MoveInfoCard, ManeuverGrid |
| **Combatant Cards** | 7 | CombatantCard (GM), CombatantGmActions, CombatantCaptureSection, VisionCapabilityToggle, GroupCombatantCard, PlayerCombatantCard, PlayerRequestPanel |
| **Status / Conditions** | 3 | StatusConditionsModal, CombatStagesModal, CombatantConditionsSection |
| **Out-of-Turn** | 2 | AoOPrompt, InterceptPrompt |
| **Pokemon Management** | 3 | SwitchPokemonModal, AddCombatantModal, [[capture-rate-display-component|CaptureRateDisplay]] |
| **Healing / Items** | 3 | UseItemModal, TempHpModal, BreatherShiftBanner |
| **XP / Level Up** | 4 | XpDistributionModal, XpDistributionResults, LevelUpNotification, TrainerXpSection |
| **Mounting** | 1 | MountControls |
| **Weather** | 1 | WeatherEffectIndicator |
| **Notifications** | 1 | GmToastContainer |
| **Encounter Setup** | 3 | BudgetIndicator, EnvironmentSelector, GMActionModal |

Parent pages: `pages/gm/index.vue` (GM) and `pages/group/index.vue` (Group view).

## See also

- [[combatant-card-visibility-rules]] — how the three card variants differ per audience
- [[combat-maneuver-catalog]] — the 9 maneuvers rendered by ManeuverGrid
- [[turn-lifecycle]]
- [[damage-flow-pipeline]]
- [[encounter-composable-delegation]]
- [[encounter-table-components]]
- [[combatant-card-subcomponents]] — extracted sub-components of CombatantCard (GmActions, CaptureSection, WeatherIndicator)
