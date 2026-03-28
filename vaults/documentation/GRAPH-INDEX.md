# Graph Index: vaults/documentation
# Generated: 2026-03-28
# Notes: 152 | Links: 768 | Avg out-degree: 5.1
#
# Link resolution (unique targets):
#   local: 138
#   ptr/rules: 65
#   documentation/software-engineering: 38
#   unresolved: 2
#   ptr/ptr_traits: 2
#
# Format: note-name [out:N in:N]
#   -> outgoing (this note links to)
#   <- incoming (links to this note)

effect-utility-catalog [out:27 in:12]
  -> effect-handler-contract, game-state-interface, nine-step-damage-formula, resolution-context-inputs, shotgun-surgery-smell, status-cs-auto-apply-with-tracking, condition-source-tracking, state-delta-model, effect-trigger-event-bus, entity-write-exception, active-effect-model, encounter-delta-model, deployment-state-model, before-handler-response-modes, non-immune-attacks-deal-damage, strategy-pattern, single-responsibility-principle, interface-segregation-principle, chain-of-responsibility-pattern, tell-dont-ask, law-of-demeter, effect-handler-format, combat-lens-sub-interfaces, field-state-interfaces, r0a-sample-effect-handlers, status-application-must-use-applyStatus, utility-self-targeting-convention
  <- active-effect-model, before-handler-response-modes, combat-lens-sub-interfaces, effect-handler-contract, effect-handler-format, effect-trigger-event-bus, field-state-interfaces, game-state-interface, r0a-sample-effect-handlers, state-delta-model, status-application-must-use-applyStatus, utility-self-targeting-convention

effect-handler-contract [out:25 in:13]
  -> game-state-interface, effect-utility-catalog, effect-trigger-event-bus, liskov-substitution-principle, combat-lens-sub-interfaces, field-state-interfaces, combat-event-log-schema, deployment-state-model, encounter-delta-model, resolution-context-inputs, state-delta-model, entity-write-exception, before-handler-response-modes, mediator-pattern, law-of-demeter, dependency-inversion-principle, single-responsibility-principle, strategy-pattern, observer-pattern, command-pattern, tell-dont-ask, effect-handler-format, active-effect-model, trigger-event-field-semantics, status-application-must-use-applyStatus
  <- before-handler-response-modes, combat-event-log-schema, combat-lens-sub-interfaces, effect-handler-format, effect-trigger-event-bus, effect-utility-catalog, encounter-delta-model, game-state-interface, r0a-sample-effect-handlers, resolution-context-inputs, state-delta-model, status-application-must-use-applyStatus, trigger-event-field-semantics

game-state-interface [out:20 in:17]
  -> dependency-inversion-principle, entity-write-exception, combat-lens-sub-interfaces, interface-segregation-principle, field-state-interfaces, encounter-context-interfaces, combat-event-log-schema, deployment-state-model, effect-utility-catalog, state-delta-model, combatant-as-lens, open-closed-principle, resolution-context-inputs, single-responsibility-principle, liskov-substitution-principle, active-effect-model, effect-handler-contract, effect-trigger-event-bus, effect-handler-format, encounter-delta-model
  <- active-effect-model, combat-event-log-schema, combat-lens-sub-interfaces, combatant-as-lens, condition-source-tracking, deployment-state-model, effect-handler-contract, effect-handler-format, effect-trigger-event-bus, effect-utility-catalog, encounter-context-interfaces, encounter-delta-model, entity-write-exception, field-state-interfaces, r0a-sample-effect-handlers, resolution-context-inputs, state-delta-model

combat-lens-sub-interfaces [out:22 in:11]
  -> combatant-as-lens, interface-segregation-principle, effect-utility-catalog, game-state-interface, state-delta-model, entity-write-exception, open-closed-principle, nine-step-damage-formula, movement-traits, status-cs-auto-apply-with-tracking, evasion-from-defensive-stats, one-evasion-per-accuracy-check, fatigue-levels, accuracy-cs-is-direct-modifier, condition-source-tracking, status-condition-categories, fatigued-is-its-own-condition-category, zero-energy-causes-fatigue, take-a-breather-recovers-fatigue, dynamic-initiative-on-speed-change, active-effect-model, effect-handler-contract
  <- active-effect-model, combatant-as-lens, condition-source-tracking, effect-handler-contract, effect-utility-catalog, entity-write-exception, game-state-interface, state-delta-model, status-condition-categories, status-cs-auto-apply-with-tracking, utility-self-targeting-convention

status-condition-categories [out:12 in:18]
  -> faint-and-revival-effects, take-a-breather-mechanics, switching-system, stuck-slow-separate-from-volatile, fatigued-is-its-own-condition-category, fatigue-levels, status-tick-automation, type-grants-status-immunity, extended-rest, pokemon-center-healing, combat-lens-sub-interfaces, active-effect-model
  <- active-effect-model, combat-lens-sub-interfaces, condition-independent-behavior-flags, confused-three-outcome-save, extended-rest, faint-and-revival-effects, field-state-interfaces, healing-data-fields, other-conditions-source-dependent-faint, pokemon-center-healing, sleep-volatile-but-persists, status-capture-bonus-hierarchy, status-condition-registry, status-tick-automation, switching-system, take-a-breather-mechanics, turn-lifecycle, type-grants-status-immunity

effect-trigger-event-bus [out:17 in:11]
  -> game-state-interface, combat-event-log-schema, before-handler-response-modes, effect-handler-contract, effect-utility-catalog, non-immune-attacks-deal-damage, rule-of-three, shotgun-surgery-smell, active-effect-model, mediator-pattern, observer-pattern, strategy-pattern, single-responsibility-principle, separation-of-concerns, field-state-interfaces, resolution-context-inputs, trigger-event-field-semantics
  <- active-effect-model, before-handler-response-modes, combat-event-log-schema, effect-handler-contract, effect-handler-format, effect-utility-catalog, field-state-interfaces, game-state-interface, r0a-sample-effect-handlers, status-application-must-use-applyStatus, trigger-event-field-semantics

automate-routine-bookkeeping [out:11 in:13]
  -> status-cs-auto-apply-with-tracking, path-speed-averaging, gm-delegates-authority-into-system, condition-source-tracking, xp-from-new-pokemon, trainer-hp-formula, evasion-from-defensive-stats, quick-stat-workflow, encounter-creation-is-gm-driven, player-autonomy-boundaries, the-table-as-shared-space
  <- condition-source-tracking, confused-three-outcome-save, encounter-creation-is-gm-driven, evasion-from-defensive-stats, gm-delegates-authority-into-system, grid-mode-is-encounter-identity, path-speed-averaging, player-autonomy-boundaries, status-capture-bonus-hierarchy, status-cs-auto-apply-with-tracking, the-table-as-shared-space, trainer-hp-formula, xp-from-new-pokemon

turn-lifecycle [out:8 in:15]
  -> battle-modes, damage-flow-pipeline, initiative-and-turn-order, take-a-breather-mechanics, energy-for-extra-movement, combat-maneuver-catalog, status-condition-categories, declaration-system
  <- battle-modes, combat-event-log-schema, combat-maneuver-catalog, damage-flow-pipeline, damage-pipeline-as-chain-of-responsibility, declaration-system, encounter-context-interfaces, hold-priority-interrupt-system, initiative-and-turn-order, mounting-system, move-energy-system, status-tick-automation, switching-system, take-a-breather-mechanics, weather-tick-automation

active-effect-model [out:13 in:9]
  -> status-condition-categories, game-state-interface, large-class-smell, divergent-change-smell, temporary-field-smell, effect-trigger-event-bus, effect-utility-catalog, primitive-obsession-smell, single-source-of-truth, combat-lens-sub-interfaces, state-delta-model, condition-source-tracking, effect-handler-format
  <- combat-lens-sub-interfaces, effect-handler-contract, effect-handler-format, effect-trigger-event-bus, effect-utility-catalog, field-state-interfaces, game-state-interface, state-delta-model, status-condition-categories

nine-step-damage-formula [out:9 in:13]
  -> damage-base-to-dice-table, stab-adds-to-damage-base, crit-doubles-dice-not-stats, sniper, combat-stage-asymmetric-scaling, non-immune-attacks-deal-damage, trainers-are-typeless, hp-injury-system, evasion-and-accuracy-system
  <- combat-lens-sub-interfaces, combat-stage-system, damage-base-chart, damage-flow-pipeline, damage-pipeline-as-chain-of-responsibility, effect-utility-catalog, equipment-bonus-aggregation, evasion-and-accuracy-system, hp-injury-system, minimum-floors-prevent-absurd-results, move-energy-system, percentages-are-additive, resolution-context-inputs

state-delta-model [out:11 in:10]
  -> game-state-interface, combat-lens-sub-interfaces, command-pattern, entity-write-exception, single-responsibility-principle, interface-segregation-principle, open-closed-principle, active-effect-model, effect-handler-contract, encounter-delta-model, effect-utility-catalog
  <- active-effect-model, combat-lens-sub-interfaces, combatant-as-lens, effect-handler-contract, effect-utility-catalog, encounter-delta-model, entity-write-exception, field-state-interfaces, game-state-interface, resolution-context-inputs

raw-fidelity-as-default [out:10 in:11]
  -> per-conflict-decree-required, minimum-floors-prevent-absurd-results, server-enforcement-with-gm-override, gm-delegates-authority-into-system, errata-corrections-not-replacements, no-false-citations, silence-means-no-effect, percentages-are-additive, ptu-has-no-formal-encounter-tables, emergent-design-through-practice
  <- errata-corrections-not-replacements, gm-delegates-authority-into-system, minimum-floors-prevent-absurd-results, no-false-citations, per-conflict-decree-required, percentages-are-additive, presets-stay-within-raw, ptu-has-no-formal-encounter-tables, server-enforcement-with-gm-override, significance-cap-x5, silence-means-no-effect

condition-source-tracking [out:8 in:12]
  -> status-cs-auto-apply-with-tracking, other-conditions-source-dependent-faint, recall-clears-then-source-reapplies, decouple-behaviors-from-categories, automate-routine-bookkeeping, type-grants-status-immunity, combat-lens-sub-interfaces, game-state-interface
  <- active-effect-model, automate-routine-bookkeeping, clear-then-reapply-pattern, combat-lens-sub-interfaces, decouple-behaviors-from-categories, effect-utility-catalog, field-state-interfaces, other-conditions-source-dependent-faint, recall-clears-then-source-reapplies, separate-mechanics-stay-separate, status-cs-auto-apply-with-tracking, type-grants-status-immunity

combatant-as-lens [out:13 in:5]
  -> combat-lens-sub-interfaces, state-delta-model, game-state-interface, single-responsibility-principle, interface-segregation-principle, open-closed-principle, dependency-inversion-principle, liskov-substitution-principle, proxy-pattern, bridge-pattern, flyweight-pattern, adapter-pattern, entity-write-exception
  <- combat-lens-sub-interfaces, denormalized-encounter-combatants, deployment-state-model, entity-write-exception, game-state-interface

rest-healing-system [out:10 in:8]
  -> thirty-minute-rest, extended-rest, pokemon-center-healing, natural-injury-healing, new-day-reset, healing-data-fields, effective-max-hp-formula, healing-mechanics, healing-item-system, take-a-breather-mechanics
  <- effective-max-hp-formula, extended-rest, healing-data-fields, healing-mechanics, natural-injury-healing, new-day-reset, pokemon-center-healing, thirty-minute-rest

field-state-interfaces [out:11 in:6]
  -> game-state-interface, before-handler-response-modes, effect-trigger-event-bus, effect-utility-catalog, active-effect-model, vortex-keyword, persistent-tick-timing-end-of-turn, state-delta-model, status-condition-categories, condition-source-tracking, encounter-delta-model
  <- effect-handler-contract, effect-trigger-event-bus, effect-utility-catalog, encounter-context-interfaces, encounter-delta-model, game-state-interface

server-enforcement-with-gm-override [out:7 in:8]
  -> raw-fidelity-as-default, ghost-type-ignores-movement-restrictions, fainted-pokemon-cannot-be-captured, owned-pokemon-reject-capture, gm-delegates-authority-into-system, player-autonomy-boundaries, information-asymmetry-by-role
  <- fainted-pokemon-cannot-be-captured, ghost-type-ignores-movement-restrictions, gm-delegates-authority-into-system, information-asymmetry-by-role, owned-pokemon-reject-capture, player-autonomy-boundaries, raw-fidelity-as-default, type-grants-status-immunity

take-a-breather-mechanics [out:9 in:6]
  -> take-a-breather-resets-combat-state, combat-stage-system, temp-hp-mechanics, stuck-slow-separate-from-volatile, fatigue-levels, take-a-breather-recovers-fatigue, status-condition-categories, combat-maneuver-catalog, turn-lifecycle
  <- combat-stage-system, rest-healing-system, status-condition-categories, status-cs-auto-apply-with-tracking, temp-hp-mechanics, turn-lifecycle

effect-handler-format [out:9 in:6]
  -> effect-utility-catalog, game-state-interface, rule-of-three, effect-trigger-event-bus, single-responsibility-principle, separation-of-concerns, effect-handler-contract, active-effect-model, r0a-sample-effect-handlers
  <- active-effect-model, effect-handler-contract, effect-utility-catalog, game-state-interface, r0a-sample-effect-handlers, resolution-context-inputs

pokemon-experience-chart [out:11 in:4]
  -> ptr-xp-table, total-xp-unchanged, pokemon-level-range-1-to-20, five-stat-points-per-level, evolution-check-on-level-up, trait-definition, level-up-ordered-steps, xp-distribution-flow, pokemon-hp-formula, pokemon-stat-allocation, pokemon-move-learning
  <- pokemon-hp-formula, species-data-model, xp-distribution-flow, xp-from-new-pokemon

player-autonomy-boundaries [out:7 in:7]
  -> server-enforcement-with-gm-override, automate-routine-bookkeeping, the-table-as-shared-space, gm-delegates-authority-into-system, information-asymmetry-by-role, player-grid-tools, movement-is-atomic-per-shift
  <- automate-routine-bookkeeping, gm-delegates-authority-into-system, information-asymmetry-by-role, movement-is-atomic-per-shift, player-grid-tools, server-enforcement-with-gm-override, the-table-as-shared-space

gm-delegates-authority-into-system [out:7 in:7]
  -> server-enforcement-with-gm-override, player-autonomy-boundaries, per-conflict-decree-required, automate-routine-bookkeeping, raw-fidelity-as-default, the-table-as-shared-space, encounter-creation-is-gm-driven
  <- automate-routine-bookkeeping, encounter-creation-is-gm-driven, per-conflict-decree-required, player-autonomy-boundaries, raw-fidelity-as-default, server-enforcement-with-gm-override, the-table-as-shared-space

encounter-delta-model [out:9 in:5]
  -> state-delta-model, game-state-interface, effect-handler-contract, field-state-interfaces, deployment-state-model, command-pattern, single-responsibility-principle, open-closed-principle, separation-of-concerns
  <- effect-handler-contract, effect-utility-catalog, field-state-interfaces, game-state-interface, state-delta-model

faint-and-revival-effects [out:6 in:8]
  -> status-condition-categories, xp-distribution-flow, healing-item-system, healing-mechanics, hp-injury-system, switching-system
  <- fainted-pokemon-cannot-be-captured, healing-item-system, healing-mechanics, hp-injury-system, other-conditions-source-dependent-faint, status-condition-categories, switching-system, xp-distribution-flow

hp-injury-system [out:7 in:7]
  -> effective-max-hp-formula, healing-mechanics, natural-injury-healing, pokemon-center-healing, faint-and-revival-effects, nine-step-damage-formula, temp-hp-mechanics
  <- effective-max-hp-formula, faint-and-revival-effects, healing-mechanics, natural-injury-healing, nine-step-damage-formula, status-tick-automation, temp-hp-mechanics

effective-max-hp-formula [out:6 in:7]
  -> thirty-minute-rest, extended-rest, pokemon-center-healing, healing-mechanics, hp-injury-system, rest-healing-system
  <- healing-data-fields, healing-mechanics, hp-injury-system, natural-injury-healing, pokemon-center-healing, rest-healing-system, thirty-minute-rest

combat-event-log-schema [out:6 in:7]
  -> game-state-interface, effect-handler-contract, resolution-context-inputs, turn-lifecycle, effect-trigger-event-bus, trigger-event-field-semantics
  <- effect-handler-contract, effect-trigger-event-bus, encounter-context-interfaces, game-state-interface, resolution-context-inputs, status-application-must-use-applyStatus, trigger-event-field-semantics

combat-stage-system [out:6 in:7]
  -> accuracy-cs-is-direct-modifier, evasion-from-defensive-stats, take-a-breather-mechanics, nine-step-damage-formula, evasion-and-accuracy-system, equipment-bonus-aggregation
  <- damage-flow-pipeline, equipment-bonus-aggregation, evasion-and-accuracy-system, evasion-from-defensive-stats, initiative-and-turn-order, status-cs-auto-apply-with-tracking, take-a-breather-mechanics

move-energy-system [out:10 in:3]
  -> move-energy-cost, energy-stamina-scaling, energy-regain-rate, fatigue-levels, zero-energy-causes-fatigue, energy-overdraft, nine-step-damage-formula, turn-lifecycle, energy-for-extra-movement, energy-resource
  <- extended-rest, new-day-reset, pokemon-move-learning

status-application-must-use-applyStatus [out:9 in:3]
  -> effect-utility-catalog, type-grants-status-immunity, status-cs-auto-apply-with-tracking, combat-event-log-schema, effect-trigger-event-bus, duplicate-code-smell, single-responsibility-principle, effect-handler-contract, shotgun-surgery-smell
  <- effect-handler-contract, effect-utility-catalog, status-cs-auto-apply-with-tracking

healing-mechanics [out:6 in:6]
  -> hp-injury-system, temp-hp-mechanics, faint-and-revival-effects, healing-item-system, rest-healing-system, effective-max-hp-formula
  <- effective-max-hp-formula, faint-and-revival-effects, healing-item-system, hp-injury-system, rest-healing-system, temp-hp-mechanics

the-table-as-shared-space [out:6 in:6]
  -> encounter-creation-is-gm-driven, automate-routine-bookkeeping, information-asymmetry-by-role, player-autonomy-boundaries, gm-delegates-authority-into-system, elevation-is-persistent-state
  <- automate-routine-bookkeeping, elevation-is-persistent-state, encounter-creation-is-gm-driven, gm-delegates-authority-into-system, player-autonomy-boundaries, player-grid-tools

status-cs-auto-apply-with-tracking [out:6 in:6]
  -> automate-routine-bookkeeping, condition-source-tracking, take-a-breather-mechanics, combat-stage-system, combat-lens-sub-interfaces, status-application-must-use-applyStatus
  <- automate-routine-bookkeeping, combat-lens-sub-interfaces, condition-source-tracking, effect-utility-catalog, status-application-must-use-applyStatus, status-condition-registry

vtt-rendering-pipeline [out:7 in:5]
  -> isometric-camera-system, depth-sorting-layers, isometric-projection-math, three-coordinate-spaces, multi-cell-token-footprint, encounter-grid-state, elevation-system
  <- depth-sorting-layers, isometric-camera-system, isometric-projection-math, multi-cell-token-footprint, three-coordinate-spaces

combat-maneuver-catalog [out:9 in:2]
  -> combat-maneuvers-use-opposed-checks, push-chains-with-movement, attack-of-opportunity-trigger-list, disengage-avoids-opportunity-attacks, intercept-as-bodyguard-positioning, intercept-loyalty-gated, take-a-breather-resets-combat-state, energy-for-extra-movement, turn-lifecycle
  <- take-a-breather-mechanics, turn-lifecycle

deployment-state-model [out:4 in:7]
  -> game-state-interface, recall-clears-then-source-reapplies, combatant-as-lens, switching-system
  <- effect-handler-contract, effect-utility-catalog, encounter-context-interfaces, encounter-delta-model, game-state-interface, recall-clears-then-source-reapplies, switching-system

resolution-context-inputs [out:6 in:5]
  -> game-state-interface, nine-step-damage-formula, state-delta-model, combat-event-log-schema, effect-handler-contract, effect-handler-format
  <- combat-event-log-schema, effect-handler-contract, effect-trigger-event-bus, effect-utility-catalog, game-state-interface

pokemon-center-healing [out:5 in:6]
  -> effective-max-hp-formula, status-condition-categories, natural-injury-healing, pokemon-center-time-formula, rest-healing-system
  <- effective-max-hp-formula, hp-injury-system, natural-injury-healing, pokemon-center-time-formula, rest-healing-system, status-condition-categories

extended-rest [out:8 in:3]
  -> thirty-minute-rest, status-condition-categories, extended-rest-clears-persistent-status, energy-resource, fatigue-levels, rest-cures-fatigue, rest-healing-system, move-energy-system
  <- effective-max-hp-formula, rest-healing-system, status-condition-categories

capture-rate-formula [out:4 in:7]
  -> capture-rate-base-formula, capture-roll-mechanics, capture-difficulty-labels, poke-ball-system
  <- capture-difficulty-labels, capture-roll-mechanics, fainted-pokemon-cannot-be-captured, legendary-species-detection, owned-pokemon-reject-capture, poke-ball-system, status-capture-bonus-hierarchy

no-false-citations [out:3 in:7]
  -> encounter-budget-needs-ptu-basis, raw-fidelity-as-default, cross-reference-before-concluding-omission
  <- cross-reference-before-concluding-omission, encounter-budget-needs-ptu-basis, per-conflict-decree-required, presets-stay-within-raw, ptu-has-no-formal-encounter-tables, raw-fidelity-as-default, silence-means-no-effect

isometric-projection-math [out:4 in:6]
  -> isometric-camera-system, depth-sorting-layers, three-coordinate-spaces, vtt-rendering-pipeline
  <- depth-sorting-layers, elevation-system, isometric-camera-system, terrain-type-system, three-coordinate-spaces, vtt-rendering-pipeline

recall-clears-then-source-reapplies [out:6 in:4]
  -> clear-then-reapply-pattern, separate-mechanics-stay-separate, condition-independent-behavior-flags, condition-source-tracking, switching-system, deployment-state-model
  <- clear-then-reapply-pattern, condition-source-tracking, deployment-state-model, separate-mechanics-stay-separate

entity-write-exception [out:4 in:6]
  -> combatant-as-lens, game-state-interface, state-delta-model, combat-lens-sub-interfaces
  <- combat-lens-sub-interfaces, combatant-as-lens, effect-handler-contract, effect-utility-catalog, game-state-interface, state-delta-model

trainer-derived-stats [out:5 in:5]
  -> trait-definition, movement-trait-types, trainer-capabilities-field, trainer-skill-definitions, trainer-stat-budget
  <- six-trainer-combat-stats, trainer-capabilities-field, trainer-hp-formula, trainer-skill-definitions, trainer-stat-budget

equipment-bonus-aggregation [out:7 in:3]
  -> equipment-slots, evasion-and-accuracy-system, initiative-and-turn-order, combat-stage-system, items-unchanged-from-ptu, armor-and-shields, nine-step-damage-formula
  <- combat-stage-system, evasion-and-accuracy-system, initiative-and-turn-order

healing-data-fields [out:8 in:2]
  -> temp-hp-mechanics, effective-max-hp-formula, status-condition-categories, natural-injury-healing, thirty-minute-rest, energy-resource, stamina-stat, rest-healing-system
  <- new-day-reset, rest-healing-system

triple-view-system [out:5 in:5]
  -> singleton-models, player-identity-system, websocket-real-time-sync, encounter-serving-mechanics, combatant-card-visibility-rules
  <- combatant-card-visibility-rules, encounter-serving-mechanics, player-identity-system, singleton-models, websocket-real-time-sync

switching-system [out:6 in:4]
  -> poke-ball-recall-range, status-condition-categories, faint-and-revival-effects, initiative-and-turn-order, turn-lifecycle, deployment-state-model
  <- deployment-state-model, faint-and-revival-effects, recall-clears-then-source-reapplies, status-condition-categories

before-handler-response-modes [out:5 in:5]
  -> effect-trigger-event-bus, effect-handler-contract, effect-utility-catalog, strategy-pattern, open-closed-principle
  <- effect-handler-contract, effect-trigger-event-bus, effect-utility-catalog, field-state-interfaces, r0a-sample-effect-handlers

r0a-sample-effect-handlers [out:7 in:2]
  -> effect-utility-catalog, effect-trigger-event-bus, game-state-interface, shotgun-surgery-smell, before-handler-response-modes, effect-handler-contract, effect-handler-format
  <- effect-handler-format, effect-utility-catalog

trainer-stat-budget [out:6 in:3]
  -> starting-stat-allocation, only-pokemon-have-levels, six-trainer-combat-stats, stamina-stat, trainer-hp-formula, trainer-derived-stats
  <- six-trainer-combat-stats, trainer-derived-stats, trainer-skill-definitions

poke-ball-system [out:4 in:5]
  -> capture-rate-formula, capture-accuracy-gate, capture-roll-mechanics, legendary-species-detection
  <- capture-accuracy-gate, capture-context-toggles, capture-rate-formula, capture-roll-mechanics, pokemon-loyalty

trainer-skill-definitions [out:8 in:1]
  -> ptr-skill-list, skill-categories-removed, skill-ranks-removed, skill-check-1d20-plus-modifier, skill-check-dc-table, skill-modifiers-from-traits-or-circumstance, trainer-derived-stats, trainer-stat-budget
  <- trainer-derived-stats

encounter-grid-state [out:4 in:5]
  -> fog-of-war-system, terrain-type-system, measurement-aoe-modes, isometric-camera-system
  <- elevation-is-persistent-state, fog-of-war-system, measurement-aoe-modes, terrain-type-system, vtt-rendering-pipeline

damage-flow-pipeline [out:6 in:3]
  -> turn-lifecycle, nine-step-damage-formula, evasion-and-accuracy-system, combat-stage-system, damage-base-to-dice-table, damage-pipeline-as-chain-of-responsibility
  <- damage-pipeline-as-chain-of-responsibility, percentages-are-additive, turn-lifecycle

evasion-and-accuracy-system [out:3 in:6]
  -> combat-stage-system, equipment-bonus-aggregation, nine-step-damage-formula
  <- capture-accuracy-gate, combat-stage-system, damage-flow-pipeline, equipment-bonus-aggregation, evasion-from-defensive-stats, nine-step-damage-formula

encounter-creation-is-gm-driven [out:4 in:5]
  -> automate-routine-bookkeeping, gm-delegates-authority-into-system, the-table-as-shared-space, grid-mode-is-encounter-identity
  <- automate-routine-bookkeeping, gm-delegates-authority-into-system, grid-mode-is-encounter-identity, ptu-has-no-formal-encounter-tables, the-table-as-shared-space

elevation-system [out:4 in:5]
  -> pathfinding-algorithm, isometric-projection-math, depth-sorting-layers, terrain-type-system
  <- elevation-is-persistent-state, pathfinding-algorithm, terrain-type-system, three-coordinate-spaces, vtt-rendering-pipeline

condition-independent-behavior-flags [out:4 in:5]
  -> decouple-behaviors-from-categories, specific-text-over-general-category, status-condition-categories, sleep-volatile-but-persists
  <- confused-three-outcome-save, decouple-behaviors-from-categories, other-conditions-source-dependent-faint, recall-clears-then-source-reapplies, sleep-volatile-but-persists

natural-injury-healing [out:4 in:4]
  -> pokemon-center-healing, rest-healing-system, hp-injury-system, effective-max-hp-formula
  <- healing-data-fields, hp-injury-system, pokemon-center-healing, rest-healing-system

battle-modes [out:3 in:5]
  -> turn-lifecycle, scene-to-encounter-conversion, initiative-and-turn-order
  <- declaration-system, hold-priority-interrupt-system, initiative-and-turn-order, scene-to-encounter-conversion, turn-lifecycle

initiative-and-turn-order [out:4 in:4]
  -> equipment-bonus-aggregation, battle-modes, combat-stage-system, turn-lifecycle
  <- battle-modes, equipment-bonus-aggregation, switching-system, turn-lifecycle

per-conflict-decree-required [out:4 in:4]
  -> gm-delegates-authority-into-system, raw-fidelity-as-default, emergent-design-through-practice, no-false-citations
  <- gm-delegates-authority-into-system, minimum-floors-prevent-absurd-results, raw-fidelity-as-default, silence-means-no-effect

terrain-type-system [out:5 in:3]
  -> pathfinding-algorithm, encounter-grid-state, isometric-projection-math, elevation-system, depth-sorting-layers
  <- elevation-system, encounter-grid-state, pathfinding-algorithm

information-asymmetry-by-role [out:3 in:5]
  -> raw-darkness-penalties-with-presets, server-enforcement-with-gm-override, player-autonomy-boundaries
  <- player-autonomy-boundaries, player-grid-tools, raw-darkness-penalties-with-presets, server-enforcement-with-gm-override, the-table-as-shared-space

capture-roll-mechanics [out:5 in:3]
  -> capture-workflow, only-pokemon-have-levels, capture-accuracy-gate, capture-rate-formula, poke-ball-system
  <- capture-accuracy-gate, capture-rate-formula, poke-ball-system

xp-distribution-flow [out:4 in:4]
  -> pokemon-stat-allocation, faint-and-revival-effects, pokemon-experience-chart, pokemon-hp-formula
  <- faint-and-revival-effects, pokemon-experience-chart, pokemon-hp-formula, xp-from-new-pokemon

status-condition-registry [out:8 in:0]
  -> strategy-pattern, open-closed-principle, shotgun-surgery-smell, single-responsibility-principle, replace-conditional-with-polymorphism, typescript-pattern-techniques, status-condition-categories, status-cs-auto-apply-with-tracking

capture-accuracy-gate [out:4 in:4]
  -> full-accuracy-for-pokeball-throws, evasion-and-accuracy-system, poke-ball-system, capture-roll-mechanics
  <- capture-roll-mechanics, fainted-pokemon-cannot-be-captured, owned-pokemon-reject-capture, poke-ball-system

pokemon-stat-allocation [out:3 in:5]
  -> five-stat-points-per-level, base-stat-relations-removed, pokemon-hp-formula
  <- evasion-from-defensive-stats, pokemon-experience-chart, pokemon-hp-formula, species-data-model, xp-distribution-flow

status-tick-automation [out:5 in:2]
  -> tick-value-one-tenth-max-hp, turn-lifecycle, status-condition-categories, hp-injury-system, weather-tick-automation
  <- status-condition-categories, weather-tick-automation

decouple-behaviors-from-categories [out:4 in:3]
  -> condition-independent-behavior-flags, sleep-volatile-but-persists, specific-text-over-general-category, condition-source-tracking
  <- condition-independent-behavior-flags, condition-source-tracking, sleep-volatile-but-persists

three-coordinate-spaces [out:4 in:3]
  -> vtt-rendering-pipeline, isometric-camera-system, elevation-system, isometric-projection-math
  <- isometric-projection-math, multi-cell-token-footprint, vtt-rendering-pipeline

temp-hp-mechanics [out:3 in:4]
  -> hp-injury-system, take-a-breather-mechanics, healing-mechanics
  <- healing-data-fields, healing-mechanics, hp-injury-system, take-a-breather-mechanics

pathfinding-algorithm [out:3 in:4]
  -> terrain-type-system, elevation-system, multi-cell-token-footprint
  <- elevation-system, movement-is-atomic-per-shift, path-speed-averaging, terrain-type-system

evasion-from-defensive-stats [out:4 in:3]
  -> automate-routine-bookkeeping, combat-stage-system, evasion-and-accuracy-system, pokemon-stat-allocation
  <- automate-routine-bookkeeping, combat-lens-sub-interfaces, combat-stage-system

trigger-event-field-semantics [out:4 in:3]
  -> combat-event-log-schema, effect-handler-contract, effect-trigger-event-bus, inappropriate-intimacy-smell
  <- combat-event-log-schema, effect-handler-contract, effect-trigger-event-bus

pokemon-hp-formula [out:3 in:4]
  -> pokemon-stat-allocation, xp-distribution-flow, pokemon-experience-chart
  <- pokemon-experience-chart, pokemon-stat-allocation, trainer-hp-formula, xp-distribution-flow

type-grants-status-immunity [out:3 in:4]
  -> server-enforcement-with-gm-override, condition-source-tracking, status-condition-categories
  <- condition-source-tracking, ghost-type-ignores-movement-restrictions, status-application-must-use-applyStatus, status-condition-categories

sleep-volatile-but-persists [out:4 in:2]
  -> status-condition-categories, condition-independent-behavior-flags, specific-text-over-general-category, decouple-behaviors-from-categories
  <- condition-independent-behavior-flags, decouple-behaviors-from-categories

cross-reference-before-concluding-omission [out:3 in:3]
  -> silence-means-no-effect, no-false-citations, errata-corrections-not-replacements
  <- errata-corrections-not-replacements, no-false-citations, silence-means-no-effect

player-grid-tools [out:4 in:2]
  -> player-autonomy-boundaries, the-table-as-shared-space, information-asymmetry-by-role, one-distance-metric-everywhere
  <- one-distance-metric-everywhere, player-autonomy-boundaries

depth-sorting-layers [out:2 in:4]
  -> isometric-projection-math, vtt-rendering-pipeline
  <- elevation-system, isometric-projection-math, terrain-type-system, vtt-rendering-pipeline

isometric-camera-system [out:2 in:4]
  -> isometric-projection-math, vtt-rendering-pipeline
  <- encounter-grid-state, isometric-projection-math, three-coordinate-spaces, vtt-rendering-pipeline

encounter-context-interfaces [out:5 in:1]
  -> game-state-interface, field-state-interfaces, deployment-state-model, combat-event-log-schema, turn-lifecycle
  <- game-state-interface

grid-interaction-unification [out:6 in:0]
  -> strategy-pattern, duplicate-code-smell, open-closed-principle, parallel-inheritance-hierarchies-smell, template-method-pattern, extract-class

silence-means-no-effect [out:4 in:2]
  -> cross-reference-before-concluding-omission, per-conflict-decree-required, raw-fidelity-as-default, no-false-citations
  <- cross-reference-before-concluding-omission, raw-fidelity-as-default

fainted-pokemon-cannot-be-captured [out:4 in:2]
  -> server-enforcement-with-gm-override, capture-rate-formula, capture-accuracy-gate, faint-and-revival-effects
  <- owned-pokemon-reject-capture, server-enforcement-with-gm-override

trainer-hp-formula [out:4 in:2]
  -> only-pokemon-have-levels, pokemon-hp-formula, automate-routine-bookkeeping, trainer-derived-stats
  <- automate-routine-bookkeeping, trainer-stat-budget

thirty-minute-rest [out:2 in:4]
  -> effective-max-hp-formula, rest-healing-system
  <- effective-max-hp-formula, extended-rest, healing-data-fields, rest-healing-system

websocket-real-time-sync [out:4 in:2]
  -> triple-view-system, observer-pattern, encounter-serving-mechanics, combatant-card-visibility-rules
  <- encounter-serving-mechanics, triple-view-system

damage-pipeline-as-chain-of-responsibility [out:5 in:1]
  -> damage-flow-pipeline, chain-of-responsibility-pattern, nine-step-damage-formula, single-responsibility-principle, turn-lifecycle
  <- damage-flow-pipeline

encounter-serving-mechanics [out:2 in:3]
  -> triple-view-system, websocket-real-time-sync
  <- combatant-card-visibility-rules, triple-view-system, websocket-real-time-sync

encounter-budget-needs-ptu-basis [out:4 in:1]
  -> no-false-citations, only-pokemon-have-levels, significance-cap-x5, encounter-xp-formula
  <- no-false-citations

owned-pokemon-reject-capture [out:4 in:1]
  -> fainted-pokemon-cannot-be-captured, server-enforcement-with-gm-override, capture-rate-formula, capture-accuracy-gate
  <- server-enforcement-with-gm-override

documentation-note-content-boundary [out:3 in:2]
  -> dead-code-smell, separation-of-concerns, thin-note-threshold
  <- thin-note-threshold, wikilink-cleanup-on-deletion

fog-of-war-system [out:2 in:3]
  -> encounter-grid-state, measurement-aoe-modes
  <- encounter-grid-state, measurement-aoe-modes, raw-darkness-penalties-with-presets

clear-then-reapply-pattern [out:3 in:2]
  -> recall-clears-then-source-reapplies, condition-source-tracking, separate-mechanics-stay-separate
  <- recall-clears-then-source-reapplies, separate-mechanics-stay-separate

other-conditions-source-dependent-faint [out:4 in:1]
  -> status-condition-categories, condition-source-tracking, condition-independent-behavior-flags, faint-and-revival-effects
  <- condition-source-tracking

singleton-models [out:3 in:2]
  -> triple-view-system, scene-activation-lifecycle, singleton-pattern
  <- scene-activation-lifecycle, triple-view-system

pokemon-loyalty [out:4 in:1]
  -> loyalty-rank-names, pokemon-origin-enum, disposition-determines-starting-loyalty, poke-ball-system
  <- pokemon-origin-enum

multi-cell-token-footprint [out:2 in:3]
  -> vtt-rendering-pipeline, three-coordinate-spaces
  <- pathfinding-algorithm, size-determines-grid-footprint, vtt-rendering-pipeline

switching-validation-pipeline [out:5 in:0]
  -> template-method-pattern, open-closed-principle, duplicate-code-smell, chain-of-responsibility-pattern, strategy-pattern

presets-stay-within-raw [out:3 in:2]
  -> significance-cap-x5, raw-fidelity-as-default, no-false-citations
  <- raw-darkness-penalties-with-presets, significance-cap-x5

healing-item-system [out:2 in:3]
  -> healing-mechanics, faint-and-revival-effects
  <- faint-and-revival-effects, healing-mechanics, rest-healing-system

pokemon-move-learning [out:4 in:1]
  -> unlock-conditions, moves-are-universally-available, no-moves-known-limit, move-energy-system
  <- pokemon-experience-chart

elevation-is-persistent-state [out:4 in:1]
  -> the-table-as-shared-space, grid-mode-is-encounter-identity, elevation-system, encounter-grid-state
  <- the-table-as-shared-space

measurement-aoe-modes [out:2 in:3]
  -> encounter-grid-state, fog-of-war-system
  <- encounter-grid-state, fog-of-war-system, one-distance-metric-everywhere

thin-note-threshold [out:3 in:2]
  -> lazy-class-smell, documentation-note-content-boundary, wikilink-cleanup-on-deletion
  <- documentation-note-content-boundary, wikilink-cleanup-on-deletion

wikilink-cleanup-on-deletion [out:4 in:1]
  -> wikilinks, wikilink, documentation-note-content-boundary, thin-note-threshold
  <- thin-note-threshold

separate-mechanics-stay-separate [out:3 in:2]
  -> recall-clears-then-source-reapplies, condition-source-tracking, clear-then-reapply-pattern
  <- clear-then-reapply-pattern, recall-clears-then-source-reapplies

xp-from-new-pokemon [out:3 in:1]
  -> automate-routine-bookkeeping, xp-distribution-flow, pokemon-experience-chart
  <- automate-routine-bookkeeping

pure-service-testability-boundary [out:4 in:0]
  -> single-responsibility-principle, dependency-inversion-principle, refactoring-must-pass-tests, technical-debt-cause-missing-tests

trainer-capabilities-field [out:3 in:1]
  -> trait-definition, naturewalk, trainer-derived-stats
  <- trainer-derived-stats

new-day-reset [out:3 in:1]
  -> rest-healing-system, move-energy-system, healing-data-fields
  <- rest-healing-system

significance-cap-x5 [out:2 in:2]
  -> presets-stay-within-raw, raw-fidelity-as-default
  <- encounter-budget-needs-ptu-basis, presets-stay-within-raw

utility-self-targeting-convention [out:3 in:1]
  -> effect-utility-catalog, primitive-obsession-smell, combat-lens-sub-interfaces
  <- effect-utility-catalog

percentages-are-additive [out:3 in:1]
  -> damage-flow-pipeline, raw-fidelity-as-default, nine-step-damage-formula
  <- raw-fidelity-as-default

combatant-card-visibility-rules [out:2 in:2]
  -> triple-view-system, encounter-serving-mechanics
  <- triple-view-system, websocket-real-time-sync

grid-mode-is-encounter-identity [out:2 in:2]
  -> encounter-creation-is-gm-driven, automate-routine-bookkeeping
  <- elevation-is-persistent-state, encounter-creation-is-gm-driven

errata-corrections-not-replacements [out:2 in:2]
  -> raw-fidelity-as-default, cross-reference-before-concluding-omission
  <- cross-reference-before-concluding-omission, raw-fidelity-as-default

ptu-has-no-formal-encounter-tables [out:3 in:1]
  -> raw-fidelity-as-default, no-false-citations, encounter-creation-is-gm-driven
  <- raw-fidelity-as-default

species-data-model [out:3 in:1]
  -> movement-trait-types, pokemon-experience-chart, pokemon-stat-allocation
  <- encounter-table-entry

raw-darkness-penalties-with-presets [out:3 in:1]
  -> presets-stay-within-raw, information-asymmetry-by-role, fog-of-war-system
  <- information-asymmetry-by-role

minimum-floors-prevent-absurd-results [out:3 in:1]
  -> nine-step-damage-formula, raw-fidelity-as-default, per-conflict-decree-required
  <- raw-fidelity-as-default

confused-three-outcome-save [out:3 in:0]
  -> automate-routine-bookkeeping, status-condition-categories, condition-independent-behavior-flags

declaration-system [out:2 in:1]
  -> battle-modes, turn-lifecycle
  <- turn-lifecycle

movement-is-atomic-per-shift [out:2 in:1]
  -> player-autonomy-boundaries, pathfinding-algorithm
  <- player-autonomy-boundaries

scene-to-encounter-conversion [out:2 in:1]
  -> battle-modes, scene-activation-lifecycle
  <- battle-modes

ghost-type-ignores-movement-restrictions [out:2 in:1]
  -> server-enforcement-with-gm-override, type-grants-status-immunity
  <- server-enforcement-with-gm-override

one-distance-metric-everywhere [out:2 in:1]
  -> player-grid-tools, measurement-aoe-modes
  <- player-grid-tools

size-determines-grid-footprint [out:2 in:1]
  -> custom-token-shapes, multi-cell-token-footprint
  <- custom-token-shapes

six-trainer-combat-stats [out:2 in:1]
  -> trainer-stat-budget, trainer-derived-stats
  <- trainer-stat-budget

pokemon-origin-enum [out:2 in:1]
  -> disposition-determines-starting-loyalty, pokemon-loyalty
  <- pokemon-loyalty

status-capture-bonus-hierarchy [out:3 in:0]
  -> capture-rate-formula, automate-routine-bookkeeping, status-condition-categories

weather-tick-automation [out:2 in:1]
  -> turn-lifecycle, status-tick-automation
  <- status-tick-automation

scene-activation-lifecycle [out:1 in:2]
  -> singleton-models
  <- scene-to-encounter-conversion, singleton-models

path-speed-averaging [out:2 in:1]
  -> automate-routine-bookkeeping, pathfinding-algorithm
  <- automate-routine-bookkeeping

hold-priority-interrupt-system [out:2 in:0]
  -> battle-modes, turn-lifecycle

player-identity-system [out:1 in:1]
  -> triple-view-system
  <- triple-view-system

capture-difficulty-labels [out:1 in:1]
  -> capture-rate-formula
  <- capture-rate-formula

custom-token-shapes [out:1 in:1]
  -> size-determines-grid-footprint
  <- size-determines-grid-footprint

pokemon-center-time-formula [out:1 in:1]
  -> pokemon-center-healing
  <- pokemon-center-healing

legendary-species-detection [out:1 in:1]
  -> capture-rate-formula
  <- poke-ball-system

capture-context-toggles [out:1 in:0]
  -> poke-ball-system

mounting-system [out:1 in:0]
  -> turn-lifecycle

damage-base-chart [out:1 in:0]
  -> nine-step-damage-formula

denormalized-encounter-combatants [out:1 in:0]
  -> combatant-as-lens

encounter-table-entry [out:1 in:0]
  -> species-data-model

scene-group-system [out:0 in:0]

movement-preview-sync [out:0 in:0]
