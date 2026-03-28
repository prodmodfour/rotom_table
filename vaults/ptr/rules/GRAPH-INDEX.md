# Graph Index: vaults/ptr/rules
# Generated: 2026-03-28
# Notes: 403 | Links: 1749 | Avg out-degree: 4.3
#
# Link resolution (unique targets):
#   local: 368
#   ptr/ptr_traits: 59
#   unresolved: 53
#   ptr/ptr_pokemon/complete: 30
#   ptr/pokemon_ecology: 29
#   documentation: 13
#   ptr/ptr_pokemon/incomplete: 8
#   documentation/move-implementations: 5
#   documentation/software-engineering: 1
#
# Format: note-name [out:N in:N]
#   -> outgoing (this note links to)
#   <- incoming (links to this note)

ptr-vs-ptu-differences [out:55 in:1]
  -> ptr-removes-features-edges-classes, traits-replace-abilities-capabilities-natures, trait-definition, innate-traits, learned-traits, unlock-conditions, unlock-level-up-split, ptr-skill-list, skill-categories-removed, skill-ranks-removed, skill-check-1d20-plus-modifier, skill-check-dc-table, skill-modifiers-from-traits-or-circumstance, humans-and-pokemon-share-skill-list, pokemon-level-range-1-to-20, only-pokemon-have-levels, trainers-are-human-species, five-stat-points-per-level, base-stat-relations-removed, natures-removed, total-xp-unchanged, death-at-ten-injuries-or-negative-hp, ap-removed-in-ptr, ap-gated-mechanics-become-traits, frequency-replaced-by-energy-costs, energy-resource, stamina-stat, move-energy-cost, energy-stamina-scaling, energy-regain-rate, zero-energy-causes-fatigue, energy-overdraft, fatigue-levels, fatigue-causes-unconsciousness, take-a-breather-recovers-fatigue, rest-cures-fatigue, low-distribution-energy-discount, downside-moves-energy-discount, shift-renamed-to-movement-action, movement-traits, movement-splitting, movement-path-freedom, movement-trait-types, typical-movement-profile, energy-for-extra-movement, sprint-removed, moves-are-universally-available, no-moves-known-limit, trainer-move-list, move-unlock-and-or-logic, pokemon-hp-formula, trainer-hp-formula, items-unchanged-from-ptu, item-proficiency-traits, ptr-removed-simple-unaware-anticipation
  <- ptr-removed-simple-unaware-anticipation

trait-definition [out:8 in:42]
  -> traits-replace-abilities-capabilities-natures, innate-traits, learned-traits, emergent-traits, ap-gated-mechanics-become-traits, base-stats-unmodifiable-by-traits, evolution-chains-unmodifiable-by-traits, item-proficiency-traits
  <- ap-gated-mechanics-become-traits, base-stats-unmodifiable-by-traits, elevation-is-persistent-state, encounter-creation-is-gm-driven, energy-for-extra-movement, energy-regain-rate, evolution-chains-unmodifiable-by-traits, fainted-at-zero-hp, injury-cap-is-universal, innate-traits, item-proficiency-traits, learned-traits, level-up-ordered-steps, lore-does-not-require-traits, mounting-and-mounted-combat, movement-trait-types, movement-traits, natural-weather-not-game-weather, natures-removed, naturewalk-bypasses-terrain, niche-competition-drives-adaptation, orders-removed, per-conflict-decree-required, phasing-ignores-terrain-and-intangibility, pokemon-creation-ordered-steps, ptr-removes-features-edges-classes, ptr-vs-ptu-differences, quick-npc-building, quick-stat-workflow, reach-extends-melee-by-size, shiny-pokemon-as-variants, significance-scales-moveset-quality, six-trainer-combat-stats, skill-modifiers-from-traits-or-circumstance, speed-cs-modifies-all-movement, struggle-is-not-a-move, traits-dont-always-progress-on-evolution, traits-replace-abilities-capabilities-natures, unlock-conditions, unlock-level-up-split, weather-ability-interactions, weight-classes-one-through-six

ptr-skill-list [out:23 in:25]
  -> skill-acrobatics, skill-athletics, skill-combat, skill-intimidate, skill-stealth, skill-survival, skill-general-education, skill-occult-education, skill-pokemon-education, skill-technology-education, skill-medicine, skill-perception, skill-deception, skill-charm, skill-command, skill-persuasion, skill-performance, skill-insight, skill-focus, humans-and-pokemon-share-skill-list, skill-categories-removed, skill-check-1d20-plus-modifier, skill-modifiers-from-traits-or-circumstance
  <- humans-and-pokemon-share-skill-list, ptr-vs-ptu-differences, skill-acrobatics, skill-athletics, skill-categories-removed, skill-charm, skill-check-1d20-plus-modifier, skill-combat, skill-command, skill-deception, skill-focus, skill-general-education, skill-insight, skill-intimidate, skill-medicine, skill-modifiers-from-traits-or-circumstance, skill-occult-education, skill-perception, skill-performance, skill-persuasion, skill-pokemon-education, skill-stealth, skill-survival, skill-technology-education, skills-default-untrained

starter-pokemon-suggestions [out:39 in:0]
  -> alolan grimer, alolan vulpix, barboach, bidoof, buneary, clauncher, combee, corphish, croagunk, cutiefly, dwebble, eevee, gible, goldeen, honedge, hoothoot, houndour, impidimp, lillipup, magikarp, misdreavus, murkrow, nickit, phantump, poochyena, rattata, rookidee, sableye, seedot, sewaddle, shroomish, skorupi, tympole, vulpix, wooper, yamask, zigzagoon, zorua, loyalty-varies-by-origin

type-identity-traits [out:27 in:7]
  -> Raticate, opportunist, water-manipulation, fire-manipulation, earth-manipulation, ice-manipulation, plant-manipulation, electricity-manipulation, rock-manipulation, light-manipulation, mind-manipulation, opportunist-represents-dark-typing, phaser, intangibility, phaser-intangibility-represent-ghost-typing, poison-coated-natural-weapon, poison-expulsion, poison-expulsion-represents-poison-typing, telekinetic, mind-manipulation-telekinetic-represent-psychic-typing, shell, instinct-traits, instinct-traits-represent-bug-typing, commitment, commitment-represents-fighting-typing, light-manipulation-represents-fairy-typing, trait_philosophy
  <- commitment-represents-fighting-typing, instinct-traits-represent-bug-typing, instinct-traits, mind-manipulation-telekinetic-represent-psychic-typing, opportunist-represents-dark-typing, phaser-intangibility-represent-ghost-typing, poison-expulsion-represents-poison-typing

movement-traits [out:11 in:17]
  -> trait-definition, landwalker, flier, swimmer, jump, naturewalk, typical-movement-profile, movement-splitting, movement-path-freedom, base-terrain-types, innate-traits
  <- base-terrain-types, energy-for-extra-movement, fatigue-levels, jump-consumes-shift-distance, movement-path-freedom, movement-splitting, movement-trait-types, path-speed-averaging, phasing-ignores-terrain-and-intangibility, power-is-a-body-trait, ptr-vs-ptu-differences, roar-has-own-recall-mechanics, slowed-halves-movement, stat-terminology, take-a-breather-action-cost, teleporter-movement-constraints, typical-movement-profile

unlock-conditions [out:11 in:16]
  -> trait-definition, moves-are-universally-available, roleplay-unlock-conditions-are-session-scoped, training-unlocks-traits-and-moves, training-dual-check-system, move-unlock-and-or-logic, evolution-trigger-conditions, unlock-conditions-default-and, unlock-level-up-split, learned-traits, supersonic-wind-blade
  <- evolution-trigger-conditions, inherited-traits-require-unlock, learned-traits, level-threshold-is-uninteresting, move-unlock-and-or-logic, moves-are-universally-available, no-moves-known-limit, ptr-vs-ptu-differences, roleplay-unlock-conditions-are-session-scoped, significance-scales-moveset-quality, skill-traits-must-gate-behaviors, stone-evolution-moves-at-current-level, trainer-move-list, training-unlocks-traits-and-moves, unlock-conditions-default-and, unlock-level-up-split

innate-traits [out:7 in:20]
  -> trait-definition, species-determines-vs-informs, inheritable-traits-list, hatched-pokemon-trait-pool, learned-traits, emergent-traits, only-innate-traits-inherit
  <- breeding-is-for-trait-inheritance, elevation-is-persistent-state, evolution-updates-skills-capabilities, hatched-pokemon-trait-pool, inheritable-traits-list, inheritance-move-list-from-parents, learned-traits, movement-trait-types, movement-traits, naturewalk-bypasses-terrain, no-move-inheritance, only-innate-traits-inherit, pokemon-creation-ordered-steps, ptr-vs-ptu-differences, reach-extends-melee-by-size, species-determines-vs-informs, trait-definition, traits-replace-abilities-capabilities-natures, typical-movement-profile, unlock-level-up-split

sensible-ecosystems [out:10 in:16]
  -> energy-pyramid-rarity, niche-competition-drives-adaptation, special-habitat-requirements, fourteen-canonical-habitats, fun-game-progression, pokemon-intelligence-scales-with-niche, encounter-creation-is-gm-driven, wild-pokemon-social-hierarchy, bibarel-dam-building, rattata-line-rapid-reproduction
  <- encounter-creation-is-gm-driven, encounter-table-disposition-weights, energy-pyramid-rarity, evolution-conditions-must-work-in-wild, evolution-easy-not-trivial, fourteen-canonical-habitats, fun-game-progression, naturewalk-bypasses-terrain, niche-competition-drives-adaptation, pokemon-intelligence-scales-with-niche, pseudo-legendary-placement, ptu-has-no-formal-encounter-tables, special-habitat-requirements, wild-encounter-motivations, wild-pokemon-six-dispositions, wild-pokemon-social-hierarchy

training-dual-check-system [out:8 in:16]
  -> learned-traits, training-session-one-hour, training-pokemon-check, training-trainer-social-skill-choice, pokemon-social-skill-hierarchy, training-roleplay-circumstance-bonus, training-unlocks-traits-and-moves, training-overwork-injury-risk
  <- learned-traits, loyalty-training-check-bonus, no-guard-dc-rationale, oblivious-dc-rationale, pokemon-social-skill-hierarchy, roleplay-unlock-conditions-are-session-scoped, skill-command, skill-persuasion, technician-design, training-pokemon-check, training-roleplay-circumstance-bonus, training-session-one-hour, training-trainer-social-skill-choice, training-unlocks-traits-and-moves, unlock-conditions-default-and, unlock-conditions

encounter-creation-is-gm-driven [out:11 in:11]
  -> encounter-budget-needs-ptu-basis, trait-definition, ptu-has-no-formal-encounter-tables, wild-encounter-motivations, quick-npc-building, automate-routine-bookkeeping, quick-stat-workflow, the-table-as-shared-space, grid-mode-is-encounter-identity, sensible-ecosystems, fourteen-canonical-habitats
  <- collateral-damage-constrains-tactics, encounter-budget-needs-ptu-basis, fourteen-canonical-habitats, giant-pokemon-variants, ptu-has-no-formal-encounter-tables, quick-npc-building, quick-stat-workflow, sensible-ecosystems, shiny-pokemon-as-variants, significance-scales-moveset-quality, wild-encounter-motivations

learned-traits [out:9 in:13]
  -> trait-definition, training-unlocks-traits-and-moves, base-stats-unmodifiable-by-traits, unlock-conditions, unlock-level-up-split, training-dual-check-system, innate-traits, emergent-traits, improved-athletics
  <- inherited-traits-require-unlock, innate-traits, ptr-vs-ptu-differences, roleplay-unlock-conditions-are-session-scoped, training-dual-check-system, training-pokemon-check, training-trainer-social-skill-choice, training-unlocks-traits-and-moves, trait-definition, traits-replace-abilities-capabilities-natures, unlock-conditions-default-and, unlock-conditions, unlock-level-up-split

skill-modifiers-from-traits-or-circumstance [out:8 in:13]
  -> trait-definition, ptr-removes-features-edges-classes, skill-ranks-removed, skill-modifier-scale, skill-check-1d20-plus-modifier, ptr-skill-list, improved-athletics, training-roleplay-circumstance-bonus
  <- cooperative-skill-checks, extended-skill-checks, ptr-removes-features-edges-classes, ptr-skill-list, ptr-vs-ptu-differences, quick-npc-building, skill-bonuses-must-appear-inline, skill-check-1d20-plus-modifier, skill-modifier-scale, skill-ranks-removed, skill-traits-must-gate-behaviors, skills-default-untrained, training-roleplay-circumstance-bonus

wild-encounter-motivations [out:15 in:6]
  -> encounter-creation-is-gm-driven, wild-pokemon-six-dispositions, pokemon-intelligence-scales-with-niche, encounter-table-disposition-weights, wild-pokemon-social-hierarchy, sensible-ecosystems, alolan-ninetales-territorial-guardian, rodent-ever-growing-incisors, rattata-line-rapid-reproduction, crawdaunt-territorial-aggression, toxicroak-dual-temperament, gabite-gem-hoarding, murkrow-superstition-and-ill-omen, zoroark-pack-protection, thievul-territorial-rivalries
  <- encounter-creation-is-gm-driven, encounter-table-disposition-weights, pokemon-intelligence-scales-with-niche, repel-mechanics, wild-pokemon-six-dispositions, wild-pokemon-social-hierarchy

weather-as-game-keyword [out:9 in:11]
  -> hail-weather-effects, rain-weather-effects, sandstorm-weather-effects, sunny-weather-effects, weather-exclusivity-constraint, weather-lasts-five-rounds, natural-weather-not-game-weather, weather-ability-interactions, environment-modifies-encounter-difficulty
  <- environment-modifies-encounter-difficulty, fourteen-canonical-habitats, frozen-save-modified-by-weather, hail-weather-effects, natural-weather-not-game-weather, rain-weather-effects, sandstorm-weather-effects, sunny-weather-effects, weather-ability-interactions, weather-exclusivity-constraint, weather-lasts-five-rounds

pokemon-base-stats-from-species [out:9 in:11]
  -> stamina-stat, base-stat-total, base-stats-unmodifiable-by-traits, stat-terminology, individual-stats-vs-base-stats, pokemon-hp-formula, evasion-from-defensive-stats, six-trainer-combat-stats, species-determines-vs-informs
  <- base-stat-total, base-stats-unmodifiable-by-traits, evolution-rebuilds-all-stats, individual-stats-vs-base-stats, pokemon-creation-ordered-steps, pokemon-hp-formula, seventeen-pokemon-types, stamina-stat, stat-terminology, vitamins-raise-base-stats, weight-classes-one-through-six

energy-resource [out:10 in:10]
  -> stamina-stat, pokemon-hp-formula, energy-stamina-scaling, move-energy-cost, energy-for-extra-movement, energy-regain-rate, zero-energy-causes-fatigue, energy-overdraft, fatigue-levels, frequency-replaced-by-energy-costs
  <- energy-for-extra-movement, energy-overdraft, energy-regain-rate, energy-stamina-scaling, frequency-replaced-by-energy-costs, move-energy-cost, ptr-vs-ptu-differences, stamina-stat, tax-vs-threat-encounters, zero-energy-causes-fatigue

action-economy-per-turn [out:8 in:12]
  -> shift-renamed-to-movement-action, movement-splitting, action-costs-are-literal, standard-action-downgrade, two-turns-per-player-per-round, priority-and-interrupt-actions, action-economy-constrains-encounter-size, mounting-and-mounted-combat
  <- action-costs-are-literal, action-economy-constrains-encounter-size, applying-items-action-economy, combat-maneuvers-use-opposed-checks, mounting-and-mounted-combat, movement-splitting, priority-and-interrupt-actions, shift-renamed-to-movement-action, standard-action-downgrade, struggle-is-not-a-move, take-a-breather-action-cost, two-turns-per-player-per-round

evolution-trigger-conditions [out:8 in:11]
  -> level-threshold-is-uninteresting, unlock-conditions, evolution-condition-difficulty-scaling, evolution-difficulty-scales-with-bst-jump, evolution-cancellation-relocks, evolution-item-consumed-on-completion, evolution-is-optional, evolution-conditions-must-work-in-wild
  <- evolution-cancellation-relocks, evolution-check-on-level-up, evolution-condition-difficulty-scaling, evolution-conditions-must-work-in-wild, evolution-difficulty-scales-with-bst-jump, evolution-is-optional, evolution-item-consumed-on-completion, evolution-stones-and-keepsakes, hatch-rates-only-on-base-stages, level-threshold-is-uninteresting, unlock-conditions

fatigue-levels [out:9 in:10]
  -> fatigued-is-its-own-condition-category, evasion-from-defensive-stats, movement-traits, zero-energy-causes-fatigue, energy-overdraft, take-a-breather-recovers-fatigue, rest-cures-fatigue, fatigue-causes-unconsciousness, slowed-halves-movement
  <- energy-overdraft, energy-resource, evasion-from-defensive-stats, fatigue-causes-unconsciousness, fatigued-is-its-own-condition-category, ptr-vs-ptu-differences, rest-cures-fatigue, slowed-halves-movement, take-a-breather-recovers-fatigue, zero-energy-causes-fatigue

six-trainer-combat-stats [out:10 in:8]
  -> stamina-stat, trait-definition, trainer-hp-formula, evasion-from-defensive-stats, individual-stats-vs-base-stats, effective-stat-formula, trainers-are-human-species, pokemon-hp-formula, combat-stage-asymmetric-scaling, trainers-are-typeless
  <- accuracy-cs-is-direct-modifier, combat-stage-asymmetric-scaling, evasion-from-defensive-stats, pokemon-base-stats-from-species, stamina-stat, starting-stat-allocation, trainer-size-medium-default, trainers-are-human-species

instinct-traits [out:14 in:4]
  -> pokemon-social-skill-hierarchy, challenger, violent-instincts, territorial, wanderer, kleptomaniac, hangry, volatile, commitment, hiding-instinct, parental-guardian-instinct, type-identity-traits, instinct-traits-represent-bug-typing, vulnerability-traits-can-drop-on-evolution
  <- commitment-represents-fighting-typing, instinct-traits-represent-bug-typing, type-identity-traits, vulnerability-traits-can-drop-on-evolution

capture-workflow [out:9 in:9]
  -> throwing-range-scales-with-athletics, full-accuracy-for-pokeball-throws, poke-ball-type-capture-modifiers, only-pokemon-have-levels, natural-roll-extremes-in-capture, capture-costs-standard-action, core-capture-system-1d100, capture-rate-base-formula, missed-poke-balls-recoverable
  <- capture-costs-standard-action, capture-rate-base-formula, core-capture-system-1d100, fishing-mechanics, full-accuracy-for-pokeball-throws, missed-poke-balls-recoverable, natural-roll-extremes-in-capture, poke-ball-type-capture-modifiers, throwing-range-scales-with-athletics

skill-check-1d20-plus-modifier [out:5 in:12]
  -> skill-check-dc-table, skill-check-xd6-vs-dc, skill-modifier-scale, skill-modifiers-from-traits-or-circumstance, ptr-skill-list
  <- cooperative-skill-checks, extended-skill-checks, loyalty-command-check-dcs, opposed-checks-defender-wins-ties, ptr-skill-list, ptr-vs-ptu-differences, skill-check-dc-table, skill-modifier-scale, skill-modifiers-from-traits-or-circumstance, skill-ranks-removed, skills-default-untrained, training-pokemon-check

always-round-down [out:5 in:12]
  -> evasion-from-defensive-stats, traits-derived-from-skills, raw-fidelity-as-default, percentages-are-additive, minimum-floors-prevent-absurd-results
  <- combat-stage-asymmetric-scaling, cooperative-skill-checks, damage-formula-step-order, enumerated-effects-are-exhaustive, evasion-from-defensive-stats, extended-skill-checks, percentages-are-additive, pokemon-hp-formula, specific-trumps-general, speed-cs-modifies-all-movement, tick-value-one-tenth-max-hp, trainer-hp-formula

base-terrain-types [out:8 in:9]
  -> movement-traits, swimmer, slow-terrain-doubles-movement, rough-terrain-intervening-only, blocking-terrain-impassable, multi-tag-terrain-system, water-is-basic-terrain, movement-trait-types
  <- blocking-terrain-impassable, fourteen-canonical-habitats, movement-trait-types, movement-traits, multi-tag-terrain-system, naturewalk-ocean-is-aquatic-catch-all, rough-terrain-intervening-only, slow-terrain-doubles-movement, water-is-basic-terrain

niche-competition-drives-adaptation [out:13 in:4]
  -> trait-definition, sensible-ecosystems, type-shifts-defy-expectations, shiny-pokemon-as-variants, alolan-vulpix-line-mountain-adaptation, rattata-line-urban-adaptability, garchomp-salamence-aerial-rivalry, corviknight-skarmory-territorial-rivalry, heracross-sap-feeding-and-docility, cutiefly-line-pollinator-ecology, sableye-carbink-predation, thievul-territorial-rivalries, eevee-line-unstable-genetics
  <- sensible-ecosystems, shiny-pokemon-as-variants, two-to-three-species-per-encounter, type-shifts-defy-expectations

pokemon-hp-formula [out:7 in:9]
  -> automate-routine-bookkeeping, trainer-hp-formula, only-pokemon-have-levels, pokemon-base-stats-from-species, stamina-stat, always-round-down, tick-value-one-tenth-max-hp
  <- effective-stat-formula, energy-resource, pokemon-base-stats-from-species, pokemon-creation-ordered-steps, ptr-vs-ptu-differences, six-trainer-combat-stats, stamina-stat, tick-value-one-tenth-max-hp, trainer-hp-formula

multi-tag-terrain-system [out:7 in:8]
  -> base-terrain-types, slow-terrain-doubles-movement, blocking-terrain-impassable, water-is-basic-terrain, path-speed-averaging, raw-darkness-penalties-with-presets, environment-modifies-encounter-difficulty
  <- base-terrain-types, blocking-terrain-impassable, environment-modifies-encounter-difficulty, naturewalk-bypasses-terrain, path-speed-averaging, slow-terrain-doubles-movement, tokens-are-passable, water-is-basic-terrain

pokemon-level-range-1-to-20 [out:5 in:10]
  -> ptr-level-absorbs-five-ptu-levels, five-stat-points-per-level, total-xp-unchanged, only-pokemon-have-levels, ptr-xp-table
  <- capture-rate-base-formula, experience-chart-level-thresholds, five-stat-points-per-level, level-up-ordered-steps, only-pokemon-have-levels, pokemon-party-limit-six, ptr-level-absorbs-five-ptu-levels, ptr-vs-ptu-differences, ptr-xp-table, total-xp-unchanged

movement-trait-types [out:9 in:6]
  -> movement-traits, landwalker, flier, swimmer, phaser, trait-definition, typical-movement-profile, base-terrain-types, innate-traits
  <- base-terrain-types, intercept-as-bodyguard-positioning, phasing-ignores-terrain-and-intangibility, ptr-vs-ptu-differences, teleporter-movement-constraints, typical-movement-profile

slow-terrain-doubles-movement [out:7 in:8]
  -> multi-tag-terrain-system, naturewalk-bypasses-terrain, base-terrain-types, path-speed-averaging, slowed-halves-movement, phasing-ignores-terrain-and-intangibility, phaser
  <- base-terrain-types, blindness-impairs-terrain-navigation, blocking-terrain-impassable, ice-environment-weight-interaction, multi-tag-terrain-system, naturewalk-bypasses-terrain, phasing-ignores-terrain-and-intangibility, slowed-halves-movement

injury-cap-is-universal [out:8 in:7]
  -> trait-definition, real-max-hp-for-all-percentages, raw-fidelity-as-default, hp-marker-injury-thresholds, heavily-injured-action-tax, death-at-ten-injuries-or-negative-hp, daily-injury-healing-cap, healing-past-markers-reinjures
  <- daily-injury-healing-cap, healing-past-markers-reinjures, heavily-injured-action-tax, hp-marker-injury-thresholds, pokemon-center-pre-healing-time, real-max-hp-for-all-percentages, suffocation-rules

environment-modifies-encounter-difficulty [out:7 in:8]
  -> raw-darkness-penalties-with-presets, multi-tag-terrain-system, collateral-damage-constrains-tactics, ice-environment-weight-interaction, weather-as-game-keyword, light-source-radii, falling-damage-by-weight-and-distance
  <- blocking-terrain-impassable, collateral-damage-constrains-tactics, falling-damage-by-weight-and-distance, ice-environment-weight-interaction, light-source-radii, multi-tag-terrain-system, raw-darkness-penalties-with-presets, weather-as-game-keyword

tick-value-one-tenth-max-hp [out:7 in:8]
  -> always-round-down, vortex-keyword, real-max-hp-for-all-percentages, pokemon-hp-formula, trainer-hp-formula, natural-healing-rate, persistent-tick-timing-end-of-turn
  <- burning-save-dc-18, natural-healing-rate, persistent-tick-timing-end-of-turn, poisoned-save-dc-10, pokemon-hp-formula, real-max-hp-for-all-percentages, sleep-wakes-on-damage-not-hp-loss, vortex-keyword

loyalty-varies-by-origin [out:5 in:9]
  -> disposition-determines-starting-loyalty, loyalty-rank-names, origin-dependent-defaults, loyalty-command-check-dcs, loyalty-is-visible
  <- disposition-determines-starting-loyalty, intercept-loyalty-gated, loyalty-command-check-dcs, loyalty-is-visible, loyalty-rank-names, origin-dependent-defaults, skill-command, starter-pokemon-suggestions, wild-pokemon-six-dispositions

damage-formula-step-order [out:6 in:8]
  -> stab-adds-to-damage-base, crit-doubles-dice-not-stats, non-immune-attacks-deal-damage, always-round-down, seventeen-pokemon-types, trainers-are-typeless
  <- crit-doubles-dice-not-stats, damage-base-to-dice-table, effective-stat-formula, non-immune-attacks-deal-damage, stab-adds-to-damage-base, trainers-are-typeless, type-effectiveness-chart, type-effectiveness-excludes-status-moves

capture-rate-base-formula [out:7 in:7]
  -> pokemon-level-range-1-to-20, hp-tiered-capture-modifiers, evolution-stage-capture-modifiers, status-capture-bonus-hierarchy, rarity-capture-penalty, core-capture-system-1d100, capture-workflow
  <- capture-workflow, core-capture-system-1d100, evolution-stage-capture-modifiers, hp-tiered-capture-modifiers, poke-ball-type-capture-modifiers, rarity-capture-penalty, status-capture-bonus-hierarchy

hp-marker-injury-thresholds [out:7 in:7]
  -> real-max-hp-for-all-percentages, massive-damage-after-temp-hp, injury-cap-is-universal, heavily-injured-action-tax, fainted-at-zero-hp, healing-past-markers-reinjures, stacking-injuries-from-single-attack
  <- fainted-at-zero-hp, healing-past-markers-reinjures, heavily-injured-action-tax, injury-cap-is-universal, massive-damage-after-temp-hp, set-lose-hp-immune-to-massive-damage, stacking-injuries-from-single-attack

fourteen-canonical-habitats [out:7 in:7]
  -> habitat-deviation-allowance, species-habitat-mapping, sensible-ecosystems, special-habitat-requirements, weather-as-game-keyword, base-terrain-types, encounter-creation-is-gm-driven
  <- encounter-creation-is-gm-driven, fishing-mechanics, habitat-deviation-allowance, ptu-has-no-formal-encounter-tables, sensible-ecosystems, special-habitat-requirements, species-habitat-mapping

encounter-budget-needs-ptu-basis [out:8 in:6]
  -> no-false-citations, level-distribution-shapes-difficulty, action-economy-constrains-encounter-size, only-pokemon-have-levels, encounter-xp-formula, encounter-creation-is-gm-driven, tax-vs-threat-encounters, significance-scales-moveset-quality
  <- encounter-creation-is-gm-driven, encounter-xp-formula, level-distribution-shapes-difficulty, ptu-has-no-formal-encounter-tables, significance-scales-moveset-quality, tax-vs-threat-encounters

stamina-stat [out:6 in:8]
  -> base-stat-total, energy-resource, pokemon-hp-formula, pokemon-base-stats-from-species, six-trainer-combat-stats, energy-stamina-scaling
  <- base-stat-total, energy-resource, energy-stamina-scaling, individual-stats-vs-base-stats, pokemon-base-stats-from-species, pokemon-hp-formula, ptr-vs-ptu-differences, six-trainer-combat-stats

size-determines-grid-footprint [out:8 in:6]
  -> flanking-scales-with-target-size, size-information, weight-classes-one-through-six, ptu-alternating-diagonal-everywhere, adjacency-includes-diagonals, custom-token-shapes, small-pokemon-share-squares, trainer-size-medium-default
  <- adjacency-includes-diagonals, flanking-scales-with-target-size, light-source-radii, ptu-alternating-diagonal-everywhere, size-information, weight-classes-one-through-six

wild-pokemon-six-dispositions [out:8 in:6]
  -> disposition-charm-check-dcs, disposition-is-per-entity, encounter-table-disposition-weights, disposition-determines-starting-loyalty, loyalty-varies-by-origin, sensible-ecosystems, pokemon-intelligence-scales-with-niche, wild-encounter-motivations
  <- disposition-charm-check-dcs, disposition-determines-starting-loyalty, disposition-is-per-entity, encounter-table-disposition-weights, pokemon-intelligence-scales-with-niche, wild-encounter-motivations

pokemon-social-skill-hierarchy [out:5 in:9]
  -> training-dual-check-system, violent-instincts, kleptomaniac, training-trainer-social-skill-choice, disposition-is-per-entity
  <- instinct-traits, skill-charm, skill-command, skill-deception, skill-intimidate, skill-persuasion, skill-pokemon-education, training-dual-check-system, training-trainer-social-skill-choice

only-pokemon-have-levels [out:4 in:9]
  -> max-trainer-level-fifty, trainer-hp-formula, pokemon-level-range-1-to-20, trainers-are-human-species
  <- capture-workflow, encounter-budget-needs-ptu-basis, encounter-xp-formula, pokemon-hp-formula, pokemon-level-range-1-to-20, ptr-vs-ptu-differences, quick-npc-building, trainer-hp-formula, trainers-are-human-species

hatched-pokemon-trait-pool [out:5 in:8]
  -> innate-traits, inheritable-traits-list, inherited-traits-require-unlock, breeding-is-for-trait-inheritance, only-innate-traits-inherit
  <- breeding-is-for-trait-inheritance, breeding-not-trainer-influenced, breeding-species-d20-roll, breeding-traits-from-education-rank, inheritable-traits-list, inherited-traits-require-unlock, innate-traits, only-innate-traits-inherit

persistent-effects-give-saves [out:6 in:7]
  -> frozen-cured-by-damage-types, burning-save-dc-18, poisoned-save-dc-10, badly-poisoned-save-dc-15, confused-three-outcome-save, condition-independent-behavior-flags
  <- badly-poisoned-save-dc-15, burned-renamed-to-burning, burning-save-dc-18, fatigued-is-its-own-condition-category, frozen-cured-by-damage-types, persistent-tick-timing-end-of-turn, poisoned-save-dc-10

separate-mechanics-stay-separate [out:7 in:6]
  -> new-day-is-counter-reset-only, extended-rest-drained-ap-only, bound-ap-persists-until-unbound, enumerated-effects-are-exhaustive, silence-means-no-effect, ap-refresh-per-scene, two-leveling-paths
  <- enumerated-effects-are-exhaustive, new-day-is-counter-reset-only, scalable-rest-duration, set-lose-hp-immune-to-massive-damage, type-effectiveness-excludes-status-moves, weather-exclusivity-constraint

natural-healing-rate [out:7 in:6]
  -> rest-definition, real-max-hp-for-all-percentages, heavily-injured-action-tax, bandages-double-natural-healing, tick-value-one-tenth-max-hp, scalable-rest-duration, rest-heals-minimum-one
  <- bandages-double-natural-healing, heavily-injured-action-tax, rest-definition, rest-heals-minimum-one, scalable-rest-duration, tick-value-one-tenth-max-hp

trainers-are-human-species [out:5 in:8]
  -> trainers-are-typeless, only-pokemon-have-levels, six-trainer-combat-stats, trainer-hp-formula, trainer-move-list
  <- individual-stats-vs-base-stats, only-pokemon-have-levels, ptr-vs-ptu-differences, six-trainer-combat-stats, size-information, starting-stat-allocation, trainer-hp-formula, trainer-move-list

take-a-breather-resets-combat-state [out:7 in:6]
  -> take-a-breather-action-cost, condition-source-tracking, take-a-breather-requires-save-checks, take-a-breather-trainer-assist, restorative-items-catalog, status-cure-items-catalog, take-a-breather-recovers-fatigue
  <- restorative-items-catalog, status-cure-items-catalog, take-a-breather-action-cost, take-a-breather-recovers-fatigue, take-a-breather-requires-save-checks, take-a-breather-trainer-assist

combat-stage-asymmetric-scaling [out:6 in:7]
  -> individual-stats-vs-base-stats, always-round-down, effective-stat-formula, six-trainer-combat-stats, accuracy-cs-is-direct-modifier, status-cs-auto-apply-with-tracking
  <- accuracy-cs-is-direct-modifier, effective-stat-formula, six-trainer-combat-stats, speed-cs-modifies-all-movement, stat-terminology, status-cs-auto-apply-with-tracking, x-items-catalog

dynamic-initiative-on-speed-change [out:6 in:7]
  -> tactical-mechanics-must-matter, action-costs-are-literal, switching-follows-initiative, league-battle-declaration-then-resolution, speed-cs-modifies-all-movement, initiative-tie-d20-rolloff
  <- flinch-condition, full-contact-simple-initiative, initiative-tie-d20-rolloff, priority-and-interrupt-actions, speed-cs-modifies-all-movement, status-cs-auto-apply-with-tracking, tactical-mechanics-must-matter

attack-of-opportunity-trigger-list [out:9 in:3]
  -> energy-for-extra-movement, combat-maneuvers-use-opposed-checks, struggle-is-not-a-move, disengage-avoids-opportunity-attacks, tripped-costs-shift-to-stand, push-chains-with-movement, pack-hunt, opportunist, run-away
  <- disengage-avoids-opportunity-attacks, paralysis-condition, tripped-costs-shift-to-stand

traits-replace-abilities-capabilities-natures [out:5 in:7]
  -> trait-definition, ptr-removes-features-edges-classes, innate-traits, learned-traits, base-stat-relations-removed
  <- base-stat-relations-removed, natures-removed, orders-removed, ptr-removed-simple-unaware-anticipation, ptr-removes-features-edges-classes, ptr-vs-ptu-differences, trait-definition

pokemon-creation-ordered-steps [out:9 in:3]
  -> pokemon-base-stats-from-species, five-stat-points-per-level, pokemon-hp-formula, innate-traits, no-moves-known-limit, trait-definition, base-stat-relations-removed, automate-routine-bookkeeping, pokemon-party-limit-six
  <- base-stat-relations-removed, natures-removed, pokemon-party-limit-six

evasion-from-defensive-stats [out:6 in:6]
  -> automate-routine-bookkeeping, flanking-penalty-post-cap, six-trainer-combat-stats, always-round-down, one-evasion-per-accuracy-check, fatigue-levels
  <- always-round-down, fatigue-levels, flanking-penalty-post-cap, one-evasion-per-accuracy-check, pokemon-base-stats-from-species, six-trainer-combat-stats

trainer-hp-formula [out:4 in:8]
  -> only-pokemon-have-levels, trainers-are-human-species, pokemon-hp-formula, always-round-down
  <- effective-stat-formula, individual-stats-vs-base-stats, only-pokemon-have-levels, pokemon-hp-formula, ptr-vs-ptu-differences, six-trainer-combat-stats, tick-value-one-tenth-max-hp, trainers-are-human-species

massive-damage-after-temp-hp [out:5 in:7]
  -> temp-hp-as-meaningful-shield, real-max-hp-for-all-percentages, hp-marker-injury-thresholds, stacking-injuries-from-single-attack, set-lose-hp-immune-to-massive-damage
  <- hp-loss-recoil-vs-self-cost, hp-marker-injury-thresholds, real-max-hp-for-all-percentages, set-lose-hp-immune-to-massive-damage, stacking-injuries-from-single-attack, temp-hp-as-meaningful-shield, temp-hp-highest-only

wild-pokemon-social-hierarchy [out:7 in:5]
  -> two-to-three-species-per-encounter, level-distribution-shapes-difficulty, pokemon-intelligence-scales-with-niche, murkrow-line-murder-hierarchy, zoroark-pack-protection, wild-encounter-motivations, sensible-ecosystems
  <- level-distribution-shapes-difficulty, pokemon-intelligence-scales-with-niche, sensible-ecosystems, two-to-three-species-per-encounter, wild-encounter-motivations

evolution-difficulty-scales-with-bst-jump [out:8 in:4]
  -> base-stat-total, Shroomish, Breloom, evolution-condition-difficulty-scaling, evolution-easy-not-trivial, evolution-trigger-conditions, evolution-conditions-must-work-in-wild, shroomish-evolution-demands-discipline
  <- base-stat-total, evolution-condition-difficulty-scaling, evolution-easy-not-trivial, evolution-trigger-conditions

heavily-injured-action-tax [out:5 in:7]
  -> hp-marker-injury-thresholds, death-at-ten-injuries-or-negative-hp, injury-cap-is-universal, natural-healing-rate, daily-injury-healing-cap
  <- daily-injury-healing-cap, death-at-ten-injuries-or-negative-hp, hp-marker-injury-thresholds, injury-cap-is-universal, natural-healing-rate, pokemon-center-pre-healing-time, suffocation-rules

individual-stats-vs-base-stats [out:7 in:5]
  -> pokemon-base-stats-from-species, trainers-are-human-species, stamina-stat, effective-stat-formula, trainer-hp-formula, stat-terminology, base-stats-unmodifiable-by-traits
  <- combat-stage-asymmetric-scaling, effective-stat-formula, pokemon-base-stats-from-species, six-trainer-combat-stats, stat-terminology

persistent-tick-timing-end-of-turn [out:4 in:8]
  -> vortex-keyword, condition-text-differences-are-mechanical, tick-value-one-tenth-max-hp, persistent-effects-give-saves
  <- badly-poisoned-save-dc-15, burning-save-dc-18, condition-text-differences-are-mechanical, poisoned-and-badly-poisoned-stack, poisoned-save-dc-10, sleep-wakes-on-damage-not-hp-loss, tick-value-one-tenth-max-hp, vortex-keyword

tactical-mechanics-must-matter [out:4 in:7]
  -> flanking-penalty-post-cap, dynamic-initiative-on-speed-change, one-distance-metric-everywhere, combat-maneuvers-use-opposed-checks
  <- collateral-damage-constrains-tactics, combat-maneuvers-use-opposed-checks, dynamic-initiative-on-speed-change, flanking-penalty-post-cap, league-battle-declaration-then-resolution, one-distance-metric-everywhere, teleporter-movement-constraints

movement-splitting [out:5 in:6]
  -> shift-renamed-to-movement-action, movement-traits, movement-is-atomic-per-shift, movement-path-freedom, action-economy-per-turn
  <- action-economy-per-turn, movement-path-freedom, movement-traits, path-speed-averaging, ptr-vs-ptu-differences, shift-renamed-to-movement-action

silence-means-no-effect [out:6 in:5]
  -> new-day-is-counter-reset-only, bound-ap-persists-until-unbound, extended-rest-drained-ap-only, roar-blocked-by-trapped, enumerated-effects-are-exhaustive, interpret-before-decreeing
  <- enumerated-effects-are-exhaustive, interpret-before-decreeing, natural-weather-not-game-weather, roar-blocked-by-trapped, separate-mechanics-stay-separate

evolution-check-on-level-up [out:6 in:5]
  -> evolution-trigger-conditions, evolution-is-optional, level-up-ordered-steps, level-threshold-is-uninteresting, evolution-rebuilds-all-stats, evolution-remaps-traits
  <- evolution-is-optional, evolution-rebuilds-all-stats, evolution-updates-skills-capabilities, level-threshold-is-uninteresting, level-up-ordered-steps

skill-deception [out:5 in:6]
  -> skill-insight, skill-perception, combat-maneuvers-use-opposed-checks, pokemon-social-skill-hierarchy, ptr-skill-list
  <- ptr-skill-list, skill-charm, skill-insight, skill-perception, skill-performance, skill-persuasion

type-grants-status-immunity [out:3 in:8]
  -> type-effectiveness-excludes-status-moves, condition-source-tracking, trapped-is-only-recall-blocker
  <- burned-renamed-to-burning, frozen-cured-by-damage-types, paralysis-condition, poisoned-and-badly-poisoned-stack, seventeen-pokemon-types, status-cs-auto-apply-with-tracking, trapped-is-only-recall-blocker, type-effectiveness-excludes-status-moves

unlock-level-up-split [out:5 in:6]
  -> trait-definition, five-stat-points-per-level, unlock-conditions, learned-traits, innate-traits
  <- learned-traits, level-up-ordered-steps, moves-are-universally-available, ptr-vs-ptu-differences, trainer-move-list, unlock-conditions

restorative-items-catalog [out:5 in:6]
  -> fainted-at-zero-hp, applying-items-action-economy, status-cure-items-catalog, raw-fidelity-as-default, take-a-breather-resets-combat-state
  <- applying-items-action-economy, fainted-at-zero-hp, item-prices-reference, snack-and-digestion-buff-system, status-cure-items-catalog, take-a-breather-resets-combat-state

status-cs-auto-apply-with-tracking [out:7 in:4]
  -> burned-renamed-to-burning, paralysis-condition, automate-routine-bookkeeping, condition-source-tracking, dynamic-initiative-on-speed-change, type-grants-status-immunity, combat-stage-asymmetric-scaling
  <- burned-renamed-to-burning, combat-stage-asymmetric-scaling, frozen-cured-by-damage-types, speed-cs-modifies-all-movement

real-max-hp-for-all-percentages [out:4 in:7]
  -> massive-damage-after-temp-hp, injury-cap-is-universal, hp-tiered-capture-modifiers, tick-value-one-tenth-max-hp
  <- hp-marker-injury-thresholds, hp-tiered-capture-modifiers, injury-cap-is-universal, massive-damage-after-temp-hp, natural-healing-rate, temp-hp-highest-only, tick-value-one-tenth-max-hp

ptu-alternating-diagonal-everywhere [out:5 in:6]
  -> one-distance-metric-everywhere, cone-shapes-fixed-three-wide, rough-terrain-intervening-only, adjacency-includes-diagonals, size-determines-grid-footprint
  <- adjacency-includes-diagonals, cone-shapes-fixed-three-wide, movement-path-freedom, one-distance-metric-everywhere, rough-terrain-intervening-only, size-determines-grid-footprint

five-stat-points-per-level [out:2 in:9]
  -> level-up-grants-one-stat-point, pokemon-level-range-1-to-20
  <- base-stat-relations-removed, evolution-rebuilds-all-stats, level-up-ordered-steps, pokemon-creation-ordered-steps, pokemon-level-range-1-to-20, ptr-vs-ptu-differences, quick-stat-workflow, stat-terminology, unlock-level-up-split

slowed-halves-movement [out:7 in:4]
  -> movement-traits, recall-clears-then-source-reapplies, slow-terrain-doubles-movement, fatigue-levels, other-conditions-source-dependent-faint, cold-intolerance, vortex-keyword
  <- blindness-impairs-terrain-navigation, fatigue-levels, slow-terrain-doubles-movement, vortex-keyword

inheritable-traits-list [out:4 in:7]
  -> innate-traits, hatched-pokemon-trait-pool, breeding-is-for-trait-inheritance, species-determines-vs-informs
  <- breeding-is-for-trait-inheritance, breeding-trait-choice-thresholds, hatched-pokemon-trait-pool, inheritance-move-list-from-parents, innate-traits, no-move-inheritance, only-innate-traits-inherit

action-costs-are-literal [out:6 in:5]
  -> sprint-removed, energy-for-extra-movement, enumerated-effects-are-exhaustive, raw-fidelity-as-default, action-economy-per-turn, standard-action-downgrade
  <- action-economy-per-turn, dynamic-initiative-on-speed-change, sprint-removed, standard-action-downgrade, switching-follows-initiative

loyalty-command-check-dcs [out:5 in:6]
  -> loyalty-varies-by-origin, skill-check-1d20-plus-modifier, intercept-loyalty-gated, loyalty-training-check-bonus, loyalty-is-visible
  <- disposition-determines-starting-loyalty, intercept-loyalty-gated, loyalty-is-visible, loyalty-rank-names, loyalty-training-check-bonus, loyalty-varies-by-origin

vortex-keyword [out:7 in:4]
  -> slowed-halves-movement, trapped-is-only-recall-blocker, tick-value-one-tenth-max-hp, persistent-tick-timing-end-of-turn, fire-spin, whirlpool, sand-tomb
  <- persistent-tick-timing-end-of-turn, slowed-halves-movement, tick-value-one-tenth-max-hp, trapped-is-only-recall-blocker

breeding-is-for-trait-inheritance [out:5 in:5]
  -> innate-traits, inheritable-traits-list, hatched-pokemon-trait-pool, no-move-inheritance, breeding-not-trainer-influenced
  <- breeding-not-trainer-influenced, breeding-species-d20-roll, hatched-pokemon-trait-pool, inheritable-traits-list, no-move-inheritance

daily-injury-healing-cap [out:5 in:5]
  -> natural-injury-healing-24h-timer, bandages-heal-injury-after-full-duration, trainer-ap-drain-heals-injury, injury-cap-is-universal, heavily-injured-action-tax
  <- bandages-heal-injury-after-full-duration, heavily-injured-action-tax, injury-cap-is-universal, natural-injury-healing-24h-timer, pokemon-center-pre-healing-time

pokemon-intelligence-scales-with-niche [out:6 in:4]
  -> lillipup-line-sensory-fur, sensible-ecosystems, wild-pokemon-social-hierarchy, wild-pokemon-six-dispositions, energy-pyramid-rarity, wild-encounter-motivations
  <- sensible-ecosystems, wild-encounter-motivations, wild-pokemon-six-dispositions, wild-pokemon-social-hierarchy

evolution-condition-difficulty-scaling [out:5 in:5]
  -> evolution-trigger-conditions, evolution-easy-not-trivial, evolution-difficulty-scales-with-bst-jump, level-threshold-is-uninteresting, evolution-conditions-must-work-in-wild
  <- evolution-conditions-must-work-in-wild, evolution-difficulty-scales-with-bst-jump, evolution-easy-not-trivial, evolution-trigger-conditions, no-guard-dc-rationale

species-determines-vs-informs [out:3 in:7]
  -> innate-traits, base-stats-unmodifiable-by-traits, evolution-chains-unmodifiable-by-traits
  <- base-stats-unmodifiable-by-traits, evolution-chains-unmodifiable-by-traits, inheritable-traits-list, innate-traits, pokemon-base-stats-from-species, pokemon-type-count, size-information

effective-stat-formula [out:6 in:4]
  -> stat-terminology, combat-stage-asymmetric-scaling, individual-stats-vs-base-stats, trainer-hp-formula, pokemon-hp-formula, damage-formula-step-order
  <- combat-stage-asymmetric-scaling, individual-stats-vs-base-stats, six-trainer-combat-stats, stat-terminology

evolution-rebuilds-all-stats [out:7 in:3]
  -> pokemon-base-stats-from-species, vitamins-raise-base-stats, five-stat-points-per-level, base-stat-relations-removed, clear-then-reapply-pattern, evolution-check-on-level-up, evolution-remaps-traits
  <- evolution-check-on-level-up, evolution-updates-skills-capabilities, vitamins-raise-base-stats

disposition-determines-starting-loyalty [out:5 in:5]
  -> loyalty-rank-names, loyalty-varies-by-origin, wild-pokemon-six-dispositions, encounter-table-disposition-weights, loyalty-command-check-dcs
  <- disposition-is-per-entity, encounter-table-disposition-weights, loyalty-rank-names, loyalty-varies-by-origin, wild-pokemon-six-dispositions

level-up-ordered-steps [out:8 in:2]
  -> five-stat-points-per-level, evolution-check-on-level-up, trait-definition, moves-are-universally-available, unlock-level-up-split, automate-routine-bookkeeping, pokemon-level-range-1-to-20, experience-chart-level-thresholds
  <- evolution-check-on-level-up, experience-chart-level-thresholds

naturewalk-bypasses-terrain [out:7 in:3]
  -> trait-definition, innate-traits, sensible-ecosystems, slow-terrain-doubles-movement, rough-terrain-intervening-only, multi-tag-terrain-system, naturewalk-ocean-is-aquatic-catch-all
  <- naturewalk-ocean-is-aquatic-catch-all, rough-terrain-intervening-only, slow-terrain-doubles-movement

ptu-has-no-formal-encounter-tables [out:9 in:1]
  -> fourteen-canonical-habitats, fun-game-progression, sensible-ecosystems, encounter-budget-needs-ptu-basis, quick-stat-workflow, raw-fidelity-as-default, encounter-creation-is-gm-driven, encounter-table-disposition-weights, automate-routine-bookkeeping
  <- encounter-creation-is-gm-driven

combat-maneuvers-use-opposed-checks [out:5 in:5]
  -> tactical-mechanics-must-matter, action-economy-per-turn, skill-check-xd6-vs-dc, push-chains-with-movement, intercept-as-bodyguard-positioning
  <- attack-of-opportunity-trigger-list, intercept-loyalty-gated, skill-combat, skill-deception, tactical-mechanics-must-matter

base-stats-unmodifiable-by-traits [out:3 in:7]
  -> trait-definition, pokemon-base-stats-from-species, species-determines-vs-informs
  <- base-stat-total, evolution-chains-unmodifiable-by-traits, individual-stats-vs-base-stats, learned-traits, pokemon-base-stats-from-species, species-determines-vs-informs, trait-definition

struggle-is-not-a-move [out:6 in:4]
  -> skill-combat, trait-definition, action-economy-per-turn, living-weapon-gates-moves, bite-capability, wind-manipulation
  <- attack-of-opportunity-trigger-list, confused-three-outcome-save, improvised-attacks, weapon-system

poisoned-save-dc-10 [out:6 in:4]
  -> persistent-tick-timing-end-of-turn, tick-value-one-tenth-max-hp, burning-save-dc-18, poison-identity-through-trigger-frequency, persistent-effects-give-saves, poisoned-and-badly-poisoned-stack
  <- badly-poisoned-save-dc-15, persistent-effects-give-saves, poison-identity-through-trigger-frequency, poisoned-and-badly-poisoned-stack

base-stat-relations-removed [out:4 in:6]
  -> traits-replace-abilities-capabilities-natures, ptr-removes-features-edges-classes, pokemon-creation-ordered-steps, five-stat-points-per-level
  <- evolution-rebuilds-all-stats, natures-removed, pokemon-creation-ordered-steps, ptr-vs-ptu-differences, quick-stat-workflow, traits-replace-abilities-capabilities-natures

stat-terminology [out:7 in:3]
  -> pokemon-base-stats-from-species, movement-traits, vitamins-raise-base-stats, individual-stats-vs-base-stats, five-stat-points-per-level, effective-stat-formula, combat-stage-asymmetric-scaling
  <- effective-stat-formula, individual-stats-vs-base-stats, pokemon-base-stats-from-species

training-unlocks-traits-and-moves [out:4 in:6]
  -> learned-traits, training-session-one-hour, training-dual-check-system, unlock-conditions
  <- learned-traits, technician-design, training-dual-check-system, training-no-longer-gives-xp, training-session-one-hour, unlock-conditions

encounter-xp-formula [out:6 in:4]
  -> only-pokemon-have-levels, significance-cap-x5, difficulty-adjusts-significance, encounter-budget-needs-ptu-basis, experience-chart-level-thresholds, tax-vs-threat-encounters
  <- difficulty-adjusts-significance, encounter-budget-needs-ptu-basis, experience-chart-level-thresholds, significance-cap-x5

encounter-table-disposition-weights [out:5 in:5]
  -> wild-pokemon-six-dispositions, wild-encounter-motivations, sensible-ecosystems, disposition-charm-check-dcs, disposition-determines-starting-loyalty
  <- disposition-determines-starting-loyalty, disposition-is-per-entity, ptu-has-no-formal-encounter-tables, wild-encounter-motivations, wild-pokemon-six-dispositions

fainted-at-zero-hp [out:6 in:4]
  -> trait-definition, hp-marker-injury-thresholds, death-at-ten-injuries-or-negative-hp, switching-follows-initiative, restorative-items-catalog, coup-de-grace-auto-crit
  <- death-at-ten-injuries-or-negative-hp, fatigue-causes-unconsciousness, hp-marker-injury-thresholds, restorative-items-catalog

moves-are-universally-available [out:4 in:6]
  -> unlock-conditions, unlock-level-up-split, no-moves-known-limit, trainer-move-list
  <- level-up-ordered-steps, natural-weapons-are-appendages, ptr-vs-ptu-differences, stone-evolution-moves-at-current-level, trainer-move-list, unlock-conditions

seventeen-pokemon-types [out:5 in:5]
  -> type-effectiveness-excludes-status-moves, type-grants-status-immunity, pokemon-type-count, stab-adds-to-damage-base, pokemon-base-stats-from-species
  <- damage-formula-step-order, pokemon-type-count, stab-adds-to-damage-base, type-effectiveness-chart, type-effectiveness-excludes-status-moves

specific-text-over-general-category [out:5 in:5]
  -> decouple-behaviors-from-categories, condition-text-differences-are-mechanical, sleep-volatile-but-persists, raw-fidelity-as-default, condition-independent-behavior-flags
  <- condition-text-differences-are-mechanical, intent-based-classification, primary-source-over-summary, stuck-slow-separate-from-volatile, trapped-is-only-recall-blocker

move-energy-cost [out:4 in:5]
  -> energy-resource, low-distribution-energy-discount, downside-moves-energy-discount, frequency-replaced-by-energy-costs
  <- downside-moves-energy-discount, energy-resource, frequency-replaced-by-energy-costs, low-distribution-energy-discount, ptr-vs-ptu-differences

hail-weather-effects [out:5 in:4]
  -> weather-as-game-keyword, frozen-save-modified-by-weather, cold-tolerance, sandstorm-weather-effects, weather-exclusivity-constraint
  <- frozen-save-modified-by-weather, sandstorm-weather-effects, weather-ability-interactions, weather-as-game-keyword

enumerated-effects-are-exhaustive [out:6 in:3]
  -> per-level-gains-exactly-as-listed, other-conditions-source-dependent-faint, silence-means-no-effect, separate-mechanics-stay-separate, always-round-down, percentages-are-additive
  <- action-costs-are-literal, separate-mechanics-stay-separate, silence-means-no-effect

raw-darkness-penalties-with-presets [out:5 in:4]
  -> light-source-radii, presets-stay-within-raw, raw-fidelity-as-default, environment-modifies-encounter-difficulty, blindness-impairs-terrain-navigation
  <- blindness-impairs-terrain-navigation, environment-modifies-encounter-difficulty, light-source-radii, multi-tag-terrain-system

lore-does-not-require-traits [out:7 in:2]
  -> trait-definition, pokemon_ecology, Alolan Muk, Barboach, trait_philosophy, ecology-notes-must-match-species-traits, vulnerability-traits-can-drop-on-evolution
  <- ecology-notes-must-match-species-traits, vulnerability-traits-can-drop-on-evolution

shiny-pokemon-as-variants [out:6 in:3]
  -> trait-definition, type-shifts-defy-expectations, niche-competition-drives-adaptation, giant-pokemon-variants, habitat-deviation-allowance, encounter-creation-is-gm-driven
  <- giant-pokemon-variants, niche-competition-drives-adaptation, type-shifts-defy-expectations

adjacency-includes-diagonals [out:5 in:4]
  -> size-determines-grid-footprint, ptu-alternating-diagonal-everywhere, flanking-scales-with-target-size, melee-range-is-adjacency, reach-extends-melee-by-size
  <- flanking-scales-with-target-size, melee-range-is-adjacency, ptu-alternating-diagonal-everywhere, size-determines-grid-footprint

vulnerability-traits-can-drop-on-evolution [out:7 in:2]
  -> likes-shiny, kleptomaniac, Honchkrow, murkrow-line-murder-hierarchy, Murkrow, lore-does-not-require-traits, instinct-traits
  <- instinct-traits, lore-does-not-require-traits

quick-stat-workflow [out:6 in:3]
  -> trait-definition, base-stat-relations-removed, five-stat-points-per-level, encounter-creation-is-gm-driven, automate-routine-bookkeeping, quick-npc-building
  <- encounter-creation-is-gm-driven, ptu-has-no-formal-encounter-tables, quick-npc-building

poisoned-and-badly-poisoned-stack [out:6 in:3]
  -> persistent-tick-timing-end-of-turn, poisoned-save-dc-10, badly-poisoned-save-dc-15, poison-identity-through-trigger-frequency, toxic, type-grants-status-immunity
  <- badly-poisoned-save-dc-15, poison-identity-through-trigger-frequency, poisoned-save-dc-10

weather-exclusivity-constraint [out:3 in:6]
  -> weather-lasts-five-rounds, weather-as-game-keyword, separate-mechanics-stay-separate
  <- hail-weather-effects, rain-weather-effects, sandstorm-weather-effects, sunny-weather-effects, weather-as-game-keyword, weather-lasts-five-rounds

skill-persuasion [out:6 in:3]
  -> skill-charm, training-dual-check-system, pokemon-social-skill-hierarchy, skill-deception, training-trainer-social-skill-choice, ptr-skill-list
  <- ptr-skill-list, skill-charm, skill-performance

burning-save-dc-18 [out:4 in:5]
  -> tick-value-one-tenth-max-hp, persistent-effects-give-saves, burned-renamed-to-burning, persistent-tick-timing-end-of-turn
  <- badly-poisoned-save-dc-15, burned-renamed-to-burning, persistent-effects-give-saves, poison-identity-through-trigger-frequency, poisoned-save-dc-10

skill-perception [out:5 in:4]
  -> skill-occult-education, skill-stealth, skill-technology-education, skill-deception, ptr-skill-list
  <- ptr-skill-list, skill-deception, skill-insight, skill-stealth

level-distribution-shapes-difficulty [out:4 in:5]
  -> action-economy-constrains-encounter-size, encounter-budget-needs-ptu-basis, wild-pokemon-social-hierarchy, energy-pyramid-rarity
  <- action-economy-constrains-encounter-size, encounter-budget-needs-ptu-basis, energy-pyramid-rarity, tax-vs-threat-encounters, wild-pokemon-social-hierarchy

crit-doubles-dice-not-stats [out:4 in:5]
  -> sniper, damage-formula-step-order, natural-one-misses-natural-twenty-hits, coup-de-grace-auto-crit
  <- coup-de-grace-auto-crit, damage-base-to-dice-table, damage-formula-step-order, modifiers-dont-shift-effect-triggers, natural-one-misses-natural-twenty-hits

trapped-is-only-recall-blocker [out:5 in:4]
  -> vortex-keyword, roar-blocked-by-trapped, specific-text-over-general-category, pokemon-switching-action-costs, type-grants-status-immunity
  <- pokemon-switching-action-costs, roar-blocked-by-trapped, type-grants-status-immunity, vortex-keyword

rest-heals-minimum-one [out:4 in:4]
  -> minimum-floors-prevent-absurd-results, rest-definition, natural-healing-rate, scalable-rest-duration
  <- minimum-floors-prevent-absurd-results, natural-healing-rate, rest-definition, scalable-rest-duration

status-cure-items-catalog [out:4 in:4]
  -> restorative-items-catalog, applying-items-action-economy, awakening-exists-as-standard-cure, take-a-breather-resets-combat-state
  <- applying-items-action-economy, paralysis-condition, restorative-items-catalog, take-a-breather-resets-combat-state

per-conflict-decree-required [out:5 in:3]
  -> trait-definition, no-guard-playtest-version, raw-fidelity-as-default, interpret-before-decreeing, emergent-design-through-practice
  <- errata-corrections-not-replacements, interpret-before-decreeing, no-guard-playtest-version

core-capture-system-1d100 [out:5 in:3]
  -> errata-corrections-not-replacements, capture-rate-base-formula, capture-workflow, full-accuracy-for-pokeball-throws, stuck-slow-separate-from-volatile
  <- capture-rate-base-formula, capture-workflow, errata-corrections-not-replacements

quick-npc-building [out:6 in:2]
  -> starting-stat-allocation, trait-definition, skill-modifiers-from-traits-or-circumstance, only-pokemon-have-levels, quick-stat-workflow, encounter-creation-is-gm-driven
  <- encounter-creation-is-gm-driven, quick-stat-workflow

type-effectiveness-excludes-status-moves [out:5 in:3]
  -> type-grants-status-immunity, damage-formula-step-order, separate-mechanics-stay-separate, seventeen-pokemon-types, trainers-are-typeless
  <- seventeen-pokemon-types, type-effectiveness-chart, type-grants-status-immunity

sunny-weather-effects [out:4 in:4]
  -> weather-as-game-keyword, rain-weather-effects, frozen-save-modified-by-weather, weather-exclusivity-constraint
  <- frozen-save-modified-by-weather, rain-weather-effects, weather-ability-interactions, weather-as-game-keyword

energy-for-extra-movement [out:3 in:5]
  -> energy-resource, movement-traits, trait-definition
  <- action-costs-are-literal, attack-of-opportunity-trigger-list, energy-resource, ptr-vs-ptu-differences, sprint-removed

ap-removed-in-ptr [out:6 in:2]
  -> ap-gated-mechanics-become-traits, ap-refresh-per-scene, ap-spend-for-roll-bonus, extended-rest-drained-ap-only, bound-ap-persists-until-unbound, trainer-ap-drain-heals-injury
  <- ap-gated-mechanics-become-traits, ptr-vs-ptu-differences

training-session-one-hour [out:4 in:4]
  -> training-unlocks-traits-and-moves, training-dual-check-system, training-overwork-injury-risk, training-no-longer-gives-xp
  <- roleplay-unlock-conditions-are-session-scoped, training-dual-check-system, training-overwork-injury-risk, training-unlocks-traits-and-moves

ptr-removes-features-edges-classes [out:3 in:5]
  -> trait-definition, traits-replace-abilities-capabilities-natures, skill-modifiers-from-traits-or-circumstance
  <- base-stat-relations-removed, orders-removed, ptr-vs-ptu-differences, skill-modifiers-from-traits-or-circumstance, traits-replace-abilities-capabilities-natures

frozen-save-modified-by-weather [out:5 in:3]
  -> sunny-weather-effects, hail-weather-effects, frozen-cured-by-damage-types, weather-as-game-keyword, condition-source-tracking
  <- frozen-cured-by-damage-types, hail-weather-effects, sunny-weather-effects

temp-hp-as-meaningful-shield [out:4 in:4]
  -> massive-damage-after-temp-hp, hp-loss-recoil-vs-self-cost, intent-based-classification, temp-hp-highest-only
  <- hp-loss-recoil-vs-self-cost, intent-based-classification, massive-damage-after-temp-hp, temp-hp-highest-only

rough-terrain-intervening-only [out:4 in:4]
  -> base-terrain-types, naturewalk-bypasses-terrain, tokens-are-passable, ptu-alternating-diagonal-everywhere
  <- base-terrain-types, naturewalk-bypasses-terrain, ptu-alternating-diagonal-everywhere, tokens-are-passable

training-pokemon-check [out:7 in:1]
  -> training-dual-check-system, skill-check-1d20-plus-modifier, learned-traits, improved-athletics, teamwork, fast-learner, loyalty-training-check-bonus
  <- training-dual-check-system

applying-items-action-economy [out:3 in:5]
  -> restorative-items-catalog, status-cure-items-catalog, action-economy-per-turn
  <- equipment-slots, restorative-items-catalog, snack-and-digestion-buff-system, status-cure-items-catalog, x-items-catalog

hp-loss-recoil-vs-self-cost [out:4 in:4]
  -> intent-based-classification, temp-hp-as-meaningful-shield, massive-damage-after-temp-hp, item-proficiency-traits
  <- intent-based-classification, item-proficiency-traits, set-lose-hp-immune-to-massive-damage, temp-hp-as-meaningful-shield

phasing-ignores-terrain-and-intangibility [out:7 in:1]
  -> trait-definition, phaser, movement-traits, slow-terrain-doubles-movement, intangibility, ghost-type-ignores-movement-restrictions, movement-trait-types
  <- slow-terrain-doubles-movement

loyalty-rank-names [out:6 in:2]
  -> loyalty-command-check-dcs, loyalty-is-visible, disposition-determines-starting-loyalty, loyalty-varies-by-origin, loyalty-training-check-bonus, intercept-loyalty-gated
  <- disposition-determines-starting-loyalty, loyalty-varies-by-origin

weight-classes-one-through-six [out:4 in:4]
  -> trait-definition, size-determines-grid-footprint, pokemon-base-stats-from-species, trainer-size-medium-default
  <- ice-environment-weight-interaction, power-and-lifting, size-determines-grid-footprint, size-information

sleep-volatile-but-persists [out:4 in:4]
  -> decouple-behaviors-from-categories, condition-independent-behavior-flags, confused-three-outcome-save, sleep-wakes-on-damage-not-hp-loss
  <- condition-independent-behavior-flags, confused-three-outcome-save, sleep-wakes-on-damage-not-hp-loss, specific-text-over-general-category

experience-chart-level-thresholds [out:5 in:3]
  -> level-up-ordered-steps, pokemon-level-range-1-to-20, ptr-xp-table, encounter-xp-formula, training-no-longer-gives-xp
  <- encounter-xp-formula, level-up-ordered-steps, ptr-xp-table

switching-follows-initiative [out:4 in:4]
  -> action-costs-are-literal, raw-fidelity-as-default, pokemon-switching-action-costs, released-pokemon-acts-immediately
  <- dynamic-initiative-on-speed-change, fainted-at-zero-hp, pokemon-switching-action-costs, released-pokemon-acts-immediately

skill-modifier-scale [out:3 in:5]
  -> skill-modifiers-from-traits-or-circumstance, skill-check-1d20-plus-modifier, skill-check-dc-table
  <- skill-check-1d20-plus-modifier, skill-check-dc-table, skill-modifiers-from-traits-or-circumstance, skills-default-untrained, training-roleplay-circumstance-bonus

path-speed-averaging [out:5 in:3]
  -> movement-traits, automate-routine-bookkeeping, movement-splitting, multi-tag-terrain-system, water-is-basic-terrain
  <- multi-tag-terrain-system, slow-terrain-doubles-movement, water-is-basic-terrain

condition-independent-behavior-flags [out:4 in:4]
  -> fatigued-is-its-own-condition-category, sleep-volatile-but-persists, other-conditions-source-dependent-faint, decouple-behaviors-from-categories
  <- fatigued-is-its-own-condition-category, persistent-effects-give-saves, sleep-volatile-but-persists, specific-text-over-general-category

type-shifts-defy-expectations [out:4 in:4]
  -> niche-competition-drives-adaptation, habitat-deviation-allowance, giant-pokemon-variants, shiny-pokemon-as-variants
  <- giant-pokemon-variants, habitat-deviation-allowance, niche-competition-drives-adaptation, shiny-pokemon-as-variants

phaser-intangibility-represent-ghost-typing [out:7 in:1]
  -> phaser, intangibility, mind-manipulation, Mismagius, Honedge, soulstealer, type-identity-traits
  <- type-identity-traits

skill-command [out:6 in:2]
  -> loyalty-varies-by-origin, training-dual-check-system, skill-intimidate, pokemon-social-skill-hierarchy, training-trainer-social-skill-choice, ptr-skill-list
  <- ptr-skill-list, skill-intimidate

trainers-are-typeless [out:2 in:6]
  -> damage-formula-step-order, stab-adds-to-damage-base
  <- damage-formula-step-order, pokemon-type-count, six-trainer-combat-stats, trainers-are-human-species, type-effectiveness-chart, type-effectiveness-excludes-status-moves

typical-movement-profile [out:5 in:3]
  -> landwalker, swimmer, movement-traits, movement-trait-types, innate-traits
  <- movement-trait-types, movement-traits, ptr-vs-ptu-differences

badly-poisoned-save-dc-15 [out:5 in:3]
  -> persistent-tick-timing-end-of-turn, poisoned-save-dc-10, burning-save-dc-18, persistent-effects-give-saves, poisoned-and-badly-poisoned-stack
  <- persistent-effects-give-saves, poison-identity-through-trigger-frequency, poisoned-and-badly-poisoned-stack

poke-ball-type-capture-modifiers [out:3 in:4]
  -> conditional-poke-ball-bonuses, capture-rate-base-formula, capture-workflow
  <- capture-workflow, conditional-poke-ball-bonuses, heal-ball-post-capture-effect, item-prices-reference

habitat-deviation-allowance [out:3 in:4]
  -> type-shifts-defy-expectations, fourteen-canonical-habitats, species-habitat-mapping
  <- fourteen-canonical-habitats, shiny-pokemon-as-variants, species-habitat-mapping, type-shifts-defy-expectations

skill-general-education [out:4 in:3]
  -> skill-occult-education, skill-pokemon-education, skill-technology-education, ptr-skill-list
  <- ptr-skill-list, skill-occult-education, skill-technology-education

flanking-penalty-post-cap [out:3 in:4]
  -> tactical-mechanics-must-matter, evasion-from-defensive-stats, flanking-scales-with-target-size
  <- evasion-from-defensive-stats, flanking-scales-with-target-size, one-evasion-per-accuracy-check, tactical-mechanics-must-matter

base-stat-total [out:4 in:3]
  -> pokemon-base-stats-from-species, stamina-stat, base-stats-unmodifiable-by-traits, evolution-difficulty-scales-with-bst-jump
  <- evolution-difficulty-scales-with-bst-jump, pokemon-base-stats-from-species, stamina-stat

weather-ability-interactions [out:6 in:1]
  -> trait-definition, weather-as-game-keyword, hail-weather-effects, rain-weather-effects, sandstorm-weather-effects, sunny-weather-effects
  <- weather-as-game-keyword

full-accuracy-for-pokeball-throws [out:4 in:3]
  -> raw-fidelity-as-default, throwing-range-scales-with-athletics, capture-workflow, missed-poke-balls-recoverable
  <- capture-workflow, core-capture-system-1d100, throwing-range-scales-with-athletics

significance-cap-x5 [out:4 in:3]
  -> presets-stay-within-raw, difficulty-adjusts-significance, encounter-xp-formula, significance-scales-moveset-quality
  <- difficulty-adjusts-significance, encounter-xp-formula, significance-scales-moveset-quality

pokemon-switching-action-costs [out:3 in:4]
  -> switching-follows-initiative, released-pokemon-acts-immediately, trapped-is-only-recall-blocker
  <- league-switch-restricts-same-round, released-pokemon-acts-immediately, switching-follows-initiative, trapped-is-only-recall-blocker

rest-definition [out:3 in:4]
  -> natural-healing-rate, scalable-rest-duration, rest-heals-minimum-one
  <- natural-healing-rate, rest-cures-fatigue, rest-heals-minimum-one, scalable-rest-duration

evolution-easy-not-trivial [out:5 in:2]
  -> evolution-condition-difficulty-scaling, evolution-difficulty-scales-with-bst-jump, evolution-conditions-must-work-in-wild, sensible-ecosystems, shroomish-evolution-spore-strike-is-trivial
  <- evolution-condition-difficulty-scaling, evolution-difficulty-scales-with-bst-jump

league-battle-declaration-then-resolution [out:4 in:3]
  -> raw-fidelity-as-default, tactical-mechanics-must-matter, full-contact-simple-initiative, league-switch-restricts-same-round
  <- dynamic-initiative-on-speed-change, full-contact-simple-initiative, league-switch-restricts-same-round

evolution-conditions-must-work-in-wild [out:3 in:4]
  -> evolution-trigger-conditions, evolution-condition-difficulty-scaling, sensible-ecosystems
  <- evolution-condition-difficulty-scaling, evolution-difficulty-scales-with-bst-jump, evolution-easy-not-trivial, evolution-trigger-conditions

skill-occult-education [out:3 in:4]
  -> skill-focus, skill-general-education, ptr-skill-list
  <- ptr-skill-list, skill-focus, skill-general-education, skill-perception

skill-technology-education [out:3 in:4]
  -> skill-medicine, skill-general-education, ptr-skill-list
  <- ptr-skill-list, skill-general-education, skill-medicine, skill-perception

fun-game-progression [out:3 in:4]
  -> pseudo-legendary-placement, sensible-ecosystems, energy-pyramid-rarity
  <- energy-pyramid-rarity, pseudo-legendary-placement, ptu-has-no-formal-encounter-tables, sensible-ecosystems

collateral-damage-constrains-tactics [out:4 in:3]
  -> environment-modifies-encounter-difficulty, tax-vs-threat-encounters, encounter-creation-is-gm-driven, tactical-mechanics-must-matter
  <- environment-modifies-encounter-difficulty, ice-environment-weight-interaction, tax-vs-threat-encounters

ptr-xp-table [out:4 in:3]
  -> ptr-level-absorbs-five-ptu-levels, total-xp-unchanged, experience-chart-level-thresholds, pokemon-level-range-1-to-20
  <- experience-chart-level-thresholds, pokemon-level-range-1-to-20, ptr-level-absorbs-five-ptu-levels

tax-vs-threat-encounters [out:4 in:3]
  -> energy-resource, encounter-budget-needs-ptu-basis, level-distribution-shapes-difficulty, collateral-damage-constrains-tactics
  <- collateral-damage-constrains-tactics, encounter-budget-needs-ptu-basis, encounter-xp-formula

skill-traits-must-gate-behaviors [out:6 in:1]
  -> unlock-conditions, cute, Bibarel, skill-bonuses-must-appear-inline, skill-modifiers-from-traits-or-circumstance, trait_philosophy
  <- skill-bonuses-must-appear-inline

training-trainer-social-skill-choice [out:3 in:4]
  -> training-dual-check-system, learned-traits, pokemon-social-skill-hierarchy
  <- pokemon-social-skill-hierarchy, skill-command, skill-persuasion, training-dual-check-system

energy-pyramid-rarity [out:3 in:4]
  -> fun-game-progression, sensible-ecosystems, level-distribution-shapes-difficulty
  <- fun-game-progression, level-distribution-shapes-difficulty, pokemon-intelligence-scales-with-niche, sensible-ecosystems

loyalty-training-check-bonus [out:3 in:4]
  -> training-dual-check-system, loyalty-command-check-dcs, fast-learner
  <- loyalty-command-check-dcs, loyalty-is-visible, loyalty-rank-names, training-pokemon-check

significance-scales-moveset-quality [out:5 in:2]
  -> trait-definition, unlock-conditions, encounter-creation-is-gm-driven, encounter-budget-needs-ptu-basis, significance-cap-x5
  <- encounter-budget-needs-ptu-basis, significance-cap-x5

training-roleplay-circumstance-bonus [out:4 in:3]
  -> training-dual-check-system, skill-modifiers-from-traits-or-circumstance, skill-check-dc-table, skill-modifier-scale
  <- roleplay-unlock-conditions-are-session-scoped, skill-modifiers-from-traits-or-circumstance, training-dual-check-system

scalable-rest-duration [out:4 in:3]
  -> natural-healing-rate, rest-heals-minimum-one, rest-definition, separate-mechanics-stay-separate
  <- natural-healing-rate, rest-definition, rest-heals-minimum-one

trainer-move-list [out:4 in:3]
  -> unlock-conditions, moves-are-universally-available, trainers-are-human-species, unlock-level-up-split
  <- moves-are-universally-available, ptr-vs-ptu-differences, trainers-are-human-species

sandstorm-weather-effects [out:4 in:3]
  -> weather-as-game-keyword, hail-weather-effects, weather-exclusivity-constraint, sand-veil
  <- hail-weather-effects, weather-ability-interactions, weather-as-game-keyword

size-information [out:5 in:2]
  -> trainers-are-human-species, species-determines-vs-informs, size-determines-grid-footprint, weight-classes-one-through-six, trainer-size-medium-default
  <- power-and-lifting, size-determines-grid-footprint

light-manipulation-represents-fairy-typing [out:5 in:2]
  -> light-manipulation, Impidimp, Morgrem, Grimmsnarl, type-default-traits
  <- opportunist-represents-dark-typing, type-identity-traits

cooperative-skill-checks [out:5 in:2]
  -> skill-check-1d20-plus-modifier, skill-modifiers-from-traits-or-circumstance, always-round-down, opposed-checks-defender-wins-ties, extended-skill-checks
  <- extended-skill-checks, opposed-checks-defender-wins-ties

other-conditions-source-dependent-faint [out:3 in:4]
  -> condition-source-tracking, decouple-behaviors-from-categories, recall-clears-then-source-reapplies
  <- condition-independent-behavior-flags, enumerated-effects-are-exhaustive, recall-clears-then-source-reapplies, slowed-halves-movement

skill-athletics [out:3 in:4]
  -> throwing-range-scales-with-athletics, skill-acrobatics, ptr-skill-list
  <- fishing-mechanics, power-and-lifting, ptr-skill-list, skill-acrobatics

intercept-loyalty-gated [out:4 in:3]
  -> intercept-as-bodyguard-positioning, combat-maneuvers-use-opposed-checks, loyalty-varies-by-origin, loyalty-command-check-dcs
  <- intercept-as-bodyguard-positioning, loyalty-command-check-dcs, loyalty-rank-names

take-a-breather-recovers-fatigue [out:2 in:5]
  -> take-a-breather-resets-combat-state, fatigue-levels
  <- extended-rest-clears-persistent-status, fatigue-levels, ptr-vs-ptu-differences, rest-cures-fatigue, take-a-breather-resets-combat-state

ap-gated-mechanics-become-traits [out:4 in:3]
  -> trait-definition, ap-removed-in-ptr, ap-spend-for-roll-bonus, trainer-ap-drain-heals-injury
  <- ap-removed-in-ptr, ptr-vs-ptu-differences, trait-definition

mind-manipulation-telekinetic-represent-psychic-typing [out:5 in:1]
  -> mind-manipulation, telekinetic, Mismagius, Noctowl, type-identity-traits
  <- type-identity-traits

frozen-cured-by-damage-types [out:4 in:2]
  -> frozen-save-modified-by-weather, type-grants-status-immunity, status-cs-auto-apply-with-tracking, persistent-effects-give-saves
  <- frozen-save-modified-by-weather, persistent-effects-give-saves

rain-weather-effects [out:3 in:3]
  -> weather-as-game-keyword, sunny-weather-effects, weather-exclusivity-constraint
  <- sunny-weather-effects, weather-ability-interactions, weather-as-game-keyword

water-is-basic-terrain [out:3 in:3]
  -> base-terrain-types, multi-tag-terrain-system, path-speed-averaging
  <- base-terrain-types, multi-tag-terrain-system, path-speed-averaging

only-innate-traits-inherit [out:4 in:2]
  -> innate-traits, Learned-traits, hatched-pokemon-trait-pool, inheritable-traits-list
  <- hatched-pokemon-trait-pool, innate-traits

frequency-replaced-by-energy-costs [out:3 in:3]
  -> scene-frequency-definition, move-energy-cost, energy-resource
  <- energy-resource, move-energy-cost, ptr-vs-ptu-differences

speed-cs-modifies-all-movement [out:5 in:1]
  -> always-round-down, status-cs-auto-apply-with-tracking, trait-definition, combat-stage-asymmetric-scaling, dynamic-initiative-on-speed-change
  <- dynamic-initiative-on-speed-change

disposition-is-per-entity [out:4 in:2]
  -> disposition-determines-starting-loyalty, disposition-charm-check-dcs, wild-pokemon-six-dispositions, encounter-table-disposition-weights
  <- pokemon-social-skill-hierarchy, wild-pokemon-six-dispositions

shift-renamed-to-movement-action [out:3 in:3]
  -> action-economy-per-turn, standard-action-downgrade, movement-splitting
  <- action-economy-per-turn, movement-splitting, ptr-vs-ptu-differences

item-proficiency-traits [out:2 in:4]
  -> trait-definition, hp-loss-recoil-vs-self-cost
  <- hp-loss-recoil-vs-self-cost, items-unchanged-from-ptu, ptr-vs-ptu-differences, trait-definition

equipment-slots [out:2 in:4]
  -> weapon-system, applying-items-action-economy
  <- armor-and-shields, held-items-catalog, item-prices-reference, weapon-system

roar-has-own-recall-mechanics [out:3 in:3]
  -> movement-traits, whirlwind-is-push-not-switch, roar-blocked-by-trapped
  <- league-switch-restricts-same-round, roar-blocked-by-trapped, whirlwind-is-push-not-switch

melee-range-is-adjacency [out:2 in:4]
  -> adjacency-includes-diagonals, reach-extends-melee-by-size
  <- adjacency-includes-diagonals, intercept-as-bodyguard-positioning, push-chains-with-movement, reach-extends-melee-by-size

giant-pokemon-variants [out:4 in:2]
  -> Magikarp, type-shifts-defy-expectations, shiny-pokemon-as-variants, encounter-creation-is-gm-driven
  <- shiny-pokemon-as-variants, type-shifts-defy-expectations

bandages-double-natural-healing [out:3 in:3]
  -> natural-healing-rate, bandages-heal-injury-after-full-duration, bandages-break-on-damage
  <- bandages-break-on-damage, bandages-heal-injury-after-full-duration, natural-healing-rate

full-contact-simple-initiative [out:3 in:3]
  -> league-battle-declaration-then-resolution, dynamic-initiative-on-speed-change, initiative-tie-d20-rolloff
  <- initiative-tie-d20-rolloff, league-battle-declaration-then-resolution, two-turns-per-player-per-round

blocking-terrain-impassable [out:4 in:2]
  -> slow-terrain-doubles-movement, multi-tag-terrain-system, base-terrain-types, environment-modifies-encounter-difficulty
  <- base-terrain-types, multi-tag-terrain-system

mounting-and-mounted-combat [out:4 in:2]
  -> trait-definition, intercept-as-bodyguard-positioning, action-economy-per-turn, two-turns-per-player-per-round
  <- action-economy-per-turn, two-turns-per-player-per-round

fatigued-is-its-own-condition-category [out:4 in:2]
  -> fatigue-levels, condition-independent-behavior-flags, fatigue-causes-unconsciousness, persistent-effects-give-saves
  <- condition-independent-behavior-flags, fatigue-levels

roar-blocked-by-trapped [out:3 in:3]
  -> silence-means-no-effect, trapped-is-only-recall-blocker, roar-has-own-recall-mechanics
  <- roar-has-own-recall-mechanics, silence-means-no-effect, trapped-is-only-recall-blocker

coup-de-grace-auto-crit [out:4 in:2]
  -> sniper, crit-doubles-dice-not-stats, battle-armor, standard-action-downgrade
  <- crit-doubles-dice-not-stats, fainted-at-zero-hp

bandages-heal-injury-after-full-duration [out:3 in:3]
  -> daily-injury-healing-cap, bandages-break-on-damage, bandages-double-natural-healing
  <- bandages-break-on-damage, bandages-double-natural-healing, daily-injury-healing-cap

vitamins-raise-base-stats [out:3 in:3]
  -> evolution-rebuilds-all-stats, five-vitamin-limit-per-pokemon, pokemon-base-stats-from-species
  <- evolution-rebuilds-all-stats, five-vitamin-limit-per-pokemon, stat-terminology

intercept-as-bodyguard-positioning [out:3 in:3]
  -> melee-range-is-adjacency, movement-trait-types, intercept-loyalty-gated
  <- combat-maneuvers-use-opposed-checks, intercept-loyalty-gated, mounting-and-mounted-combat

blindness-impairs-terrain-navigation [out:5 in:1]
  -> tripped-costs-shift-to-stand, slow-terrain-doubles-movement, slowed-halves-movement, information-asymmetry-by-role, raw-darkness-penalties-with-presets
  <- raw-darkness-penalties-with-presets

ice-environment-weight-interaction [out:4 in:2]
  -> slow-terrain-doubles-movement, environment-modifies-encounter-difficulty, weight-classes-one-through-six, collateral-damage-constrains-tactics
  <- environment-modifies-encounter-difficulty, falling-damage-by-weight-and-distance

standard-action-downgrade [out:2 in:4]
  -> action-economy-per-turn, action-costs-are-literal
  <- action-costs-are-literal, action-economy-per-turn, coup-de-grace-auto-crit, shift-renamed-to-movement-action

poison-identity-through-trigger-frequency [out:4 in:2]
  -> burning-save-dc-18, poisoned-save-dc-10, badly-poisoned-save-dc-15, poisoned-and-badly-poisoned-stack
  <- poisoned-and-badly-poisoned-stack, poisoned-save-dc-10

skill-pokemon-education [out:3 in:3]
  -> pokemon-social-skill-hierarchy, skill-survival, ptr-skill-list
  <- fossil-mechanics, ptr-skill-list, skill-general-education

unlock-conditions-default-and [out:4 in:2]
  -> learned-traits, unlock-conditions, move-unlock-and-or-logic, training-dual-check-system
  <- technician-design, unlock-conditions

evolution-cancellation-relocks [out:3 in:3]
  -> evolution-item-consumed-on-completion, evolution-trigger-conditions, evolution-is-optional
  <- evolution-is-optional, evolution-item-consumed-on-completion, evolution-trigger-conditions

loyalty-is-visible [out:3 in:3]
  -> loyalty-command-check-dcs, loyalty-varies-by-origin, loyalty-training-check-bonus
  <- loyalty-command-check-dcs, loyalty-rank-names, loyalty-varies-by-origin

paralysis-condition [out:5 in:1]
  -> type-grants-status-immunity, vulnerable-condition, attack-of-opportunity-trigger-list, extended-rest-clears-persistent-status, status-cure-items-catalog
  <- status-cs-auto-apply-with-tracking

roleplay-unlock-conditions-are-session-scoped [out:5 in:1]
  -> unlock-conditions, learned-traits, training-session-one-hour, training-roleplay-circumstance-bonus, training-dual-check-system
  <- unlock-conditions

burned-renamed-to-burning [out:4 in:2]
  -> persistent-effects-give-saves, burning-save-dc-18, status-cs-auto-apply-with-tracking, type-grants-status-immunity
  <- burning-save-dc-18, status-cs-auto-apply-with-tracking

skill-check-dc-table [out:2 in:4]
  -> skill-modifier-scale, skill-check-1d20-plus-modifier
  <- ptr-vs-ptu-differences, skill-check-1d20-plus-modifier, skill-modifier-scale, training-roleplay-circumstance-bonus

stab-adds-to-damage-base [out:2 in:4]
  -> damage-formula-step-order, seventeen-pokemon-types
  <- damage-base-to-dice-table, damage-formula-step-order, seventeen-pokemon-types, trainers-are-typeless

poison-expulsion-represents-poison-typing [out:5 in:1]
  -> poison-coated-natural-weapon, poison-expulsion, Alolan Grimer, Shroomish, type-identity-traits
  <- type-identity-traits

flanking-scales-with-target-size [out:3 in:3]
  -> flanking-penalty-post-cap, size-determines-grid-footprint, adjacency-includes-diagonals
  <- adjacency-includes-diagonals, flanking-penalty-post-cap, size-determines-grid-footprint

weapon-system [out:4 in:2]
  -> equipment-slots, struggle-is-not-a-move, skill-combat, improvised-attacks
  <- armor-and-shields, equipment-slots

level-threshold-is-uninteresting [out:3 in:3]
  -> evolution-trigger-conditions, evolution-check-on-level-up, unlock-conditions
  <- evolution-check-on-level-up, evolution-condition-difficulty-scaling, evolution-trigger-conditions

throwing-range-scales-with-athletics [out:3 in:3]
  -> full-accuracy-for-pokeball-throws, capture-workflow, traits-derived-from-skills
  <- capture-workflow, full-accuracy-for-pokeball-throws, skill-athletics

movement-path-freedom [out:3 in:3]
  -> movement-splitting, movement-traits, ptu-alternating-diagonal-everywhere
  <- movement-splitting, movement-traits, ptr-vs-ptu-differences

skill-charm [out:4 in:2]
  -> skill-persuasion, skill-deception, pokemon-social-skill-hierarchy, ptr-skill-list
  <- ptr-skill-list, skill-persuasion

minimum-floors-prevent-absurd-results [out:3 in:3]
  -> non-immune-attacks-deal-damage, rest-heals-minimum-one, raw-fidelity-as-default
  <- always-round-down, non-immune-attacks-deal-damage, rest-heals-minimum-one

naturewalk-ocean-is-aquatic-catch-all [out:5 in:1]
  -> naturewalk, Goldeen, habitat-types, naturewalk-bypasses-terrain, base-terrain-types
  <- naturewalk-bypasses-terrain

evolution-is-optional [out:3 in:3]
  -> evolution-cancellation-relocks, evolution-trigger-conditions, evolution-check-on-level-up
  <- evolution-cancellation-relocks, evolution-check-on-level-up, evolution-trigger-conditions

death-at-ten-injuries-or-negative-hp [out:2 in:4]
  -> heavily-injured-action-tax, fainted-at-zero-hp
  <- fainted-at-zero-hp, heavily-injured-action-tax, injury-cap-is-universal, ptr-vs-ptu-differences

one-distance-metric-everywhere [out:3 in:3]
  -> ptu-alternating-diagonal-everywhere, tactical-mechanics-must-matter, poke-ball-recall-range
  <- poke-ball-recall-range, ptu-alternating-diagonal-everywhere, tactical-mechanics-must-matter

rest-cures-fatigue [out:3 in:3]
  -> rest-definition, fatigue-levels, take-a-breather-recovers-fatigue
  <- extended-rest-clears-persistent-status, fatigue-levels, ptr-vs-ptu-differences

commitment-represents-fighting-typing [out:5 in:1]
  -> commitment, instinct-traits, restraint, type-identity-traits, instinct-traits-represent-bug-typing
  <- type-identity-traits

skill-acrobatics [out:3 in:2]
  -> falling-damage-by-weight-and-distance, skill-athletics, ptr-skill-list
  <- ptr-skill-list, skill-athletics

recall-clears-then-source-reapplies [out:3 in:2]
  -> clear-then-reapply-pattern, condition-source-tracking, other-conditions-source-dependent-faint
  <- other-conditions-source-dependent-faint, slowed-halves-movement

extended-skill-checks [out:4 in:1]
  -> skill-check-1d20-plus-modifier, skill-modifiers-from-traits-or-circumstance, always-round-down, cooperative-skill-checks
  <- cooperative-skill-checks

skill-intimidate [out:3 in:2]
  -> skill-command, pokemon-social-skill-hierarchy, ptr-skill-list
  <- ptr-skill-list, skill-command

no-move-inheritance [out:3 in:2]
  -> innate-traits, inheritable-traits-list, breeding-is-for-trait-inheritance
  <- breeding-is-for-trait-inheritance, inheritance-move-list-from-parents

traits-dont-always-progress-on-evolution [out:5 in:0]
  -> Hoothoot, Noctowl, mind-manipulation, apex-predator, trait-definition

fatigue-causes-unconsciousness [out:2 in:3]
  -> fatigue-levels, fainted-at-zero-hp
  <- fatigue-levels, fatigued-is-its-own-condition-category, ptr-vs-ptu-differences

instinct-traits-represent-bug-typing [out:2 in:3]
  -> instinct-traits, type-identity-traits
  <- commitment-represents-fighting-typing, instinct-traits, type-identity-traits

natural-one-misses-natural-twenty-hits [out:2 in:3]
  -> natural-roll-extremes-in-capture, crit-doubles-dice-not-stats
  <- crit-doubles-dice-not-stats, modifiers-dont-shift-effect-triggers, natural-roll-extremes-in-capture

item-prices-reference [out:5 in:0]
  -> restorative-items-catalog, held-items-catalog, x-items-catalog, poke-ball-type-capture-modifiers, equipment-slots

no-guard-dc-rationale [out:4 in:1]
  -> no-guard, training-dual-check-system, evolution-condition-difficulty-scaling, oblivious-dc-rationale
  <- oblivious-dc-rationale

energy-stamina-scaling [out:2 in:3]
  -> energy-resource, stamina-stat
  <- energy-resource, ptr-vs-ptu-differences, stamina-stat

set-lose-hp-immune-to-massive-damage [out:4 in:1]
  -> separate-mechanics-stay-separate, hp-loss-recoil-vs-self-cost, massive-damage-after-temp-hp, hp-marker-injury-thresholds
  <- massive-damage-after-temp-hp

tokens-are-passable [out:3 in:2]
  -> rough-terrain-intervening-only, multi-tag-terrain-system, small-pokemon-share-squares
  <- rough-terrain-intervening-only, small-pokemon-share-squares

two-turns-per-player-per-round [out:3 in:2]
  -> full-contact-simple-initiative, action-economy-per-turn, mounting-and-mounted-combat
  <- action-economy-per-turn, mounting-and-mounted-combat

natural-weather-not-game-weather [out:4 in:1]
  -> weather-as-game-keyword, trait-definition, raw-fidelity-as-default, silence-means-no-effect
  <- weather-as-game-keyword

total-xp-unchanged [out:1 in:4]
  -> pokemon-level-range-1-to-20
  <- pokemon-level-range-1-to-20, ptr-level-absorbs-five-ptu-levels, ptr-vs-ptu-differences, ptr-xp-table

no-moves-known-limit [out:2 in:3]
  -> six-move-slot-limit, unlock-conditions
  <- moves-are-universally-available, pokemon-creation-ordered-steps, ptr-vs-ptu-differences

stacking-injuries-from-single-attack [out:2 in:3]
  -> massive-damage-after-temp-hp, hp-marker-injury-thresholds
  <- healing-past-markers-reinjures, hp-marker-injury-thresholds, massive-damage-after-temp-hp

ptr-removed-simple-unaware-anticipation [out:4 in:1]
  -> Bidoof, oblivious, ptr-vs-ptu-differences, traits-replace-abilities-capabilities-natures
  <- ptr-vs-ptu-differences

technician-design [out:5 in:0]
  -> technician, training-dual-check-system, training-unlocks-traits-and-moves, unlock-conditions-default-and, breloom-spore-then-strike-combat

accuracy-cs-is-direct-modifier [out:3 in:2]
  -> combat-stage-asymmetric-scaling, six-trainer-combat-stats, modifiers-dont-shift-effect-triggers
  <- combat-stage-asymmetric-scaling, modifiers-dont-shift-effect-triggers

reach-extends-melee-by-size [out:3 in:2]
  -> trait-definition, melee-range-is-adjacency, innate-traits
  <- adjacency-includes-diagonals, melee-range-is-adjacency

interpret-before-decreeing [out:3 in:2]
  -> silence-means-no-effect, per-conflict-decree-required, raw-fidelity-as-default
  <- per-conflict-decree-required, silence-means-no-effect

confused-three-outcome-save [out:2 in:3]
  -> struggle-is-not-a-move, sleep-volatile-but-persists
  <- infatuation-condition, persistent-effects-give-saves, sleep-volatile-but-persists

skill-ranks-removed [out:3 in:2]
  -> skill-rank-dice-progression, skill-check-1d20-plus-modifier, skill-modifiers-from-traits-or-circumstance
  <- ptr-vs-ptu-differences, skill-modifiers-from-traits-or-circumstance

effect-spore-design [out:5 in:0]
  -> effect-spore, shroomish-spore-defense-mechanism, bitter-oil, spore-release, shroomish-evolution-spore-strike-is-trivial

percentages-are-additive [out:2 in:3]
  -> always-round-down, raw-fidelity-as-default
  <- always-round-down, enumerated-effects-are-exhaustive, specific-trumps-general

skill-combat [out:2 in:3]
  -> combat-maneuvers-use-opposed-checks, ptr-skill-list
  <- ptr-skill-list, struggle-is-not-a-move, weapon-system

errata-corrections-not-replacements [out:3 in:2]
  -> core-capture-system-1d100, per-conflict-decree-required, raw-fidelity-as-default
  <- core-capture-system-1d100, no-guard-playtest-version

natures-removed [out:4 in:1]
  -> trait-definition, traits-replace-abilities-capabilities-natures, base-stat-relations-removed, pokemon-creation-ordered-steps
  <- ptr-vs-ptu-differences

breeding-not-trainer-influenced [out:2 in:3]
  -> breeding-is-for-trait-inheritance, hatched-pokemon-trait-pool
  <- breeding-is-for-trait-inheritance, breeding-trait-choice-thresholds, breeding-traits-from-education-rank

intent-based-classification [out:3 in:2]
  -> hp-loss-recoil-vs-self-cost, temp-hp-as-meaningful-shield, specific-text-over-general-category
  <- hp-loss-recoil-vs-self-cost, temp-hp-as-meaningful-shield

zero-energy-causes-fatigue [out:2 in:3]
  -> energy-resource, fatigue-levels
  <- energy-resource, fatigue-levels, ptr-vs-ptu-differences

ptr-level-absorbs-five-ptu-levels [out:3 in:2]
  -> total-xp-unchanged, pokemon-level-range-1-to-20, ptr-xp-table
  <- pokemon-level-range-1-to-20, ptr-xp-table

action-economy-constrains-encounter-size [out:2 in:3]
  -> level-distribution-shapes-difficulty, action-economy-per-turn
  <- action-economy-per-turn, encounter-budget-needs-ptu-basis, level-distribution-shapes-difficulty

training-no-longer-gives-xp [out:3 in:2]
  -> experience-training-half-level, training-unlocks-traits-and-moves, experience-training-daily-limit
  <- experience-chart-level-thresholds, training-session-one-hour

skill-insight [out:3 in:2]
  -> skill-deception, skill-perception, ptr-skill-list
  <- ptr-skill-list, skill-deception

disposition-charm-check-dcs [out:2 in:3]
  -> wild-pokemon-six-dispositions, skill-check-xd6-vs-dc
  <- disposition-is-per-entity, encounter-table-disposition-weights, wild-pokemon-six-dispositions

light-source-radii [out:3 in:2]
  -> raw-darkness-penalties-with-presets, environment-modifies-encounter-difficulty, size-determines-grid-footprint
  <- environment-modifies-encounter-difficulty, raw-darkness-penalties-with-presets

sprint-removed [out:3 in:2]
  -> energy-for-extra-movement, action-costs-are-literal, teleporter-movement-constraints
  <- action-costs-are-literal, ptr-vs-ptu-differences

living-weapon-gates-moves [out:3 in:2]
  -> gate-capabilities-not-permission, living-weapon, honedge-line-spirit-inhabited-weapon
  <- gate-capabilities-not-permission, struggle-is-not-a-move

skill-performance [out:4 in:1]
  -> Skill-charm, skill-deception, skill-persuasion, ptr-skill-list
  <- ptr-skill-list

healing-past-markers-reinjures [out:3 in:2]
  -> hp-marker-injury-thresholds, injury-cap-is-universal, stacking-injuries-from-single-attack
  <- hp-marker-injury-thresholds, injury-cap-is-universal

evolution-chains-unmodifiable-by-traits [out:3 in:2]
  -> trait-definition, species-determines-vs-informs, base-stats-unmodifiable-by-traits
  <- species-determines-vs-informs, trait-definition

energy-overdraft [out:2 in:3]
  -> energy-resource, fatigue-levels
  <- energy-resource, fatigue-levels, ptr-vs-ptu-differences

take-a-breather-action-cost [out:3 in:2]
  -> movement-traits, take-a-breather-resets-combat-state, action-economy-per-turn
  <- take-a-breather-resets-combat-state, take-a-breather-trainer-assist

pokemon-center-pre-healing-time [out:4 in:1]
  -> daily-injury-healing-cap, arrival-state-for-time-calculations, injury-cap-is-universal, heavily-injured-action-tax
  <- arrival-state-for-time-calculations

condition-text-differences-are-mechanical [out:3 in:2]
  -> persistent-tick-timing-end-of-turn, specific-text-over-general-category, raw-fidelity-as-default
  <- persistent-tick-timing-end-of-turn, specific-text-over-general-category

skill-focus [out:2 in:3]
  -> skill-occult-education, ptr-skill-list
  <- precision-skill-checks-in-combat, ptr-skill-list, skill-occult-education

oblivious-dc-rationale [out:3 in:1]
  -> oblivious, training-dual-check-system, no-guard-dc-rationale
  <- no-guard-dc-rationale

take-a-breather-trainer-assist [out:2 in:2]
  -> take-a-breather-resets-combat-state, take-a-breather-action-cost
  <- take-a-breather-requires-save-checks, take-a-breather-resets-combat-state

pokemon-type-count [out:3 in:1]
  -> seventeen-pokemon-types, species-determines-vs-informs, trainers-are-typeless
  <- seventeen-pokemon-types

initiative-tie-d20-rolloff [out:2 in:2]
  -> dynamic-initiative-on-speed-change, full-contact-simple-initiative
  <- dynamic-initiative-on-speed-change, full-contact-simple-initiative

special-habitat-requirements [out:2 in:2]
  -> sensible-ecosystems, fourteen-canonical-habitats
  <- fourteen-canonical-habitats, sensible-ecosystems

skill-bonuses-must-appear-inline [out:3 in:1]
  -> cute, skill-traits-must-gate-behaviors, skill-modifiers-from-traits-or-circumstance
  <- skill-traits-must-gate-behaviors

whirlwind-is-push-not-switch [out:3 in:1]
  -> roar-has-own-recall-mechanics, raw-fidelity-as-default, push-chains-with-movement
  <- roar-has-own-recall-mechanics

conditional-poke-ball-bonuses [out:2 in:2]
  -> poke-ball-type-capture-modifiers, heal-ball-post-capture-effect
  <- heal-ball-post-capture-effect, poke-ball-type-capture-modifiers

species-habitat-mapping [out:2 in:2]
  -> fourteen-canonical-habitats, habitat-deviation-allowance
  <- fourteen-canonical-habitats, habitat-deviation-allowance

elevation-is-persistent-state [out:4 in:0]
  -> trait-definition, innate-traits, grid-mode-is-encounter-identity, the-table-as-shared-space

sleep-wakes-on-damage-not-hp-loss [out:3 in:1]
  -> tick-value-one-tenth-max-hp, sleep-volatile-but-persists, persistent-tick-timing-end-of-turn
  <- sleep-volatile-but-persists

trainer-size-medium-default [out:1 in:3]
  -> six-trainer-combat-stats
  <- size-determines-grid-footprint, size-information, weight-classes-one-through-six

cross-reference-before-concluding-omission [out:3 in:1]
  -> awakening-exists-as-standard-cure, no-false-citations, raw-fidelity-as-default
  <- awakening-exists-as-standard-cure

energy-regain-rate [out:2 in:2]
  -> energy-resource, trait-definition
  <- energy-resource, ptr-vs-ptu-differences

released-pokemon-acts-immediately [out:2 in:2]
  -> pokemon-switching-action-costs, switching-follows-initiative
  <- pokemon-switching-action-costs, switching-follows-initiative

weather-lasts-five-rounds [out:2 in:2]
  -> weather-as-game-keyword, weather-exclusivity-constraint
  <- weather-as-game-keyword, weather-exclusivity-constraint

skills-default-untrained [out:4 in:0]
  -> skill-modifiers-from-traits-or-circumstance, skill-modifier-scale, skill-check-1d20-plus-modifier, ptr-skill-list

poison-includes-venom [out:4 in:0]
  -> croagunk-line-poison-sac-system, skorupi-ambush-predator, drapion-armor-and-strength, alolan-grimer-line-toxin-crystallization

teleporter-movement-constraints [out:3 in:1]
  -> tactical-mechanics-must-matter, movement-traits, movement-trait-types
  <- sprint-removed

type-effectiveness-chart [out:4 in:0]
  -> seventeen-pokemon-types, type-effectiveness-excludes-status-moves, trainers-are-typeless, damage-formula-step-order

skill-survival [out:1 in:3]
  -> ptr-skill-list
  <- fossil-mechanics, ptr-skill-list, skill-pokemon-education

non-immune-attacks-deal-damage [out:2 in:2]
  -> minimum-floors-prevent-absurd-results, damage-formula-step-order
  <- damage-formula-step-order, minimum-floors-prevent-absurd-results

ecology-notes-must-match-species-traits [out:3 in:1]
  -> pokemon_ecology, lore-does-not-require-traits, trait_philosophy
  <- lore-does-not-require-traits

ghost-type-ignores-movement-restrictions [out:2 in:2]
  -> stuck-blocks-movement-not-actions, server-enforcement-with-gm-override
  <- phasing-ignores-terrain-and-intangibility, stuck-blocks-movement-not-actions

primary-source-over-summary [out:3 in:1]
  -> sun-blanket-heals-a-tick, raw-fidelity-as-default, specific-text-over-general-category
  <- sun-blanket-heals-a-tick

modifiers-dont-shift-effect-triggers [out:3 in:1]
  -> accuracy-cs-is-direct-modifier, natural-one-misses-natural-twenty-hits, crit-doubles-dice-not-stats
  <- accuracy-cs-is-direct-modifier

breeding-species-d20-roll [out:3 in:1]
  -> breeding-is-for-trait-inheritance, hatched-pokemon-trait-pool, shiny-on-one-or-hundred
  <- shiny-on-one-or-hundred

difficulty-adjusts-significance [out:2 in:2]
  -> significance-cap-x5, encounter-xp-formula
  <- encounter-xp-formula, significance-cap-x5

skill-stealth [out:2 in:2]
  -> skill-perception, ptr-skill-list
  <- ptr-skill-list, skill-perception

natural-roll-extremes-in-capture [out:2 in:2]
  -> capture-workflow, natural-one-misses-natural-twenty-hits
  <- capture-workflow, natural-one-misses-natural-twenty-hits

temp-hp-highest-only [out:3 in:1]
  -> massive-damage-after-temp-hp, real-max-hp-for-all-percentages, temp-hp-as-meaningful-shield
  <- temp-hp-as-meaningful-shield

hp-tiered-capture-modifiers [out:2 in:2]
  -> capture-rate-base-formula, real-max-hp-for-all-percentages
  <- capture-rate-base-formula, real-max-hp-for-all-percentages

opportunist-represents-dark-typing [out:3 in:1]
  -> opportunist, type-identity-traits, light-manipulation-represents-fairy-typing
  <- type-identity-traits

move-unlock-and-or-logic [out:1 in:3]
  -> unlock-conditions
  <- ptr-vs-ptu-differences, unlock-conditions-default-and, unlock-conditions

falling-damage-by-weight-and-distance [out:2 in:2]
  -> environment-modifies-encounter-difficulty, ice-environment-weight-interaction
  <- environment-modifies-encounter-difficulty, skill-acrobatics

push-chains-with-movement [out:1 in:3]
  -> melee-range-is-adjacency
  <- attack-of-opportunity-trigger-list, combat-maneuvers-use-opposed-checks, whirlwind-is-push-not-switch

league-switch-restricts-same-round [out:3 in:1]
  -> league-battle-declaration-then-resolution, pokemon-switching-action-costs, roar-has-own-recall-mechanics
  <- league-battle-declaration-then-resolution

inherited-traits-require-unlock [out:3 in:1]
  -> unlock-conditions, hatched-pokemon-trait-pool, learned-traits
  <- hatched-pokemon-trait-pool

status-capture-bonus-hierarchy [out:2 in:2]
  -> capture-rate-base-formula, stuck-slow-separate-from-volatile
  <- capture-rate-base-formula, stuck-slow-separate-from-volatile

stuck-slow-separate-from-volatile [out:2 in:2]
  -> specific-text-over-general-category, status-capture-bonus-hierarchy
  <- core-capture-system-1d100, status-capture-bonus-hierarchy

bandages-break-on-damage [out:2 in:2]
  -> bandages-double-natural-healing, bandages-heal-injury-after-full-duration
  <- bandages-double-natural-healing, bandages-heal-injury-after-full-duration

scary-is-visual-impression [out:4 in:0]
  -> scary, very-scary, apex-predator, Alolan Muk

evolution-item-consumed-on-completion [out:2 in:2]
  -> evolution-cancellation-relocks, evolution-trigger-conditions
  <- evolution-cancellation-relocks, evolution-trigger-conditions

skill-medicine [out:2 in:2]
  -> skill-technology-education, ptr-skill-list
  <- ptr-skill-list, skill-technology-education

no-guard-playtest-version [out:2 in:1]
  -> per-conflict-decree-required, errata-corrections-not-replacements
  <- per-conflict-decree-required

hatch-rates-only-on-base-stages [out:3 in:0]
  -> Lopunny, Buneary, evolution-trigger-conditions

power-and-lifting [out:3 in:0]
  -> skill-athletics, weight-classes-one-through-six, size-information

small-pokemon-share-squares [out:1 in:2]
  -> tokens-are-passable
  <- size-determines-grid-footprint, tokens-are-passable

x-items-catalog [out:2 in:1]
  -> applying-items-action-economy, combat-stage-asymmetric-scaling
  <- item-prices-reference

spirit-surge [out:3 in:0]
  -> ancient-power, expanding-force, rapid-spin-ss

origin-dependent-defaults [out:2 in:1]
  -> loyalty-varies-by-origin, raw-fidelity-as-default
  <- loyalty-varies-by-origin

starting-stat-allocation [out:2 in:1]
  -> six-trainer-combat-stats, trainers-are-human-species
  <- quick-npc-building

skill-categories-removed [out:1 in:2]
  -> ptr-skill-list
  <- ptr-skill-list, ptr-vs-ptu-differences

new-day-is-counter-reset-only [out:1 in:2]
  -> separate-mechanics-stay-separate
  <- separate-mechanics-stay-separate, silence-means-no-effect

low-distribution-energy-discount [out:1 in:2]
  -> move-energy-cost
  <- move-energy-cost, ptr-vs-ptu-differences

heal-ball-post-capture-effect [out:2 in:1]
  -> poke-ball-type-capture-modifiers, conditional-poke-ball-bonuses
  <- conditional-poke-ball-bonuses

priority-and-interrupt-actions [out:2 in:1]
  -> action-economy-per-turn, dynamic-initiative-on-speed-change
  <- action-economy-per-turn

training-overwork-injury-risk [out:1 in:2]
  -> training-session-one-hour
  <- training-dual-check-system, training-session-one-hour

pseudo-legendary-placement [out:2 in:1]
  -> fun-game-progression, sensible-ecosystems
  <- fun-game-progression

opposed-checks-defender-wins-ties [out:2 in:1]
  -> skill-check-1d20-plus-modifier, cooperative-skill-checks
  <- cooperative-skill-checks

cone-shapes-fixed-three-wide [out:2 in:1]
  -> ptu-alternating-diagonal-everywhere, raw-fidelity-as-default
  <- ptu-alternating-diagonal-everywhere

orders-removed [out:3 in:0]
  -> trait-definition, ptr-removes-features-edges-classes, traits-replace-abilities-capabilities-natures

evolution-updates-skills-capabilities [out:3 in:0]
  -> innate-traits, evolution-rebuilds-all-stats, evolution-check-on-level-up

specific-trumps-general [out:2 in:1]
  -> always-round-down, percentages-are-additive
  <- improvised-attacks

tripped-costs-shift-to-stand [out:1 in:2]
  -> attack-of-opportunity-trigger-list
  <- attack-of-opportunity-trigger-list, blindness-impairs-terrain-navigation

missed-poke-balls-recoverable [out:1 in:2]
  -> capture-workflow
  <- capture-workflow, full-accuracy-for-pokeball-throws

fishing-mechanics [out:3 in:0]
  -> skill-athletics, capture-workflow, fourteen-canonical-habitats

improvised-attacks [out:2 in:1]
  -> struggle-is-not-a-move, specific-trumps-general
  <- weapon-system

humans-and-pokemon-share-skill-list [out:1 in:2]
  -> ptr-skill-list
  <- ptr-skill-list, ptr-vs-ptu-differences

held-items-catalog [out:2 in:1]
  -> equipment-slots, items-unchanged-from-ptu
  <- item-prices-reference

arrival-state-for-time-calculations [out:2 in:1]
  -> pokemon-center-pre-healing-time, raw-fidelity-as-default
  <- pokemon-center-pre-healing-time

suffocation-rules [out:3 in:0]
  -> water-breathing, injury-cap-is-universal, heavily-injured-action-tax

fainted-pokemon-cannot-be-captured [out:2 in:1]
  -> server-enforcement-with-gm-override, owned-pokemon-reject-capture
  <- owned-pokemon-reject-capture

items-unchanged-from-ptu [out:1 in:2]
  -> item-proficiency-traits
  <- held-items-catalog, ptr-vs-ptu-differences

gate-capabilities-not-permission [out:2 in:1]
  -> living-weapon-gates-moves, raw-fidelity-as-default
  <- living-weapon-gates-moves

inheritance-move-list-from-parents [out:3 in:0]
  -> innate-traits, no-move-inheritance, inheritable-traits-list

natural-weapons-are-appendages [out:3 in:0]
  -> natural-weapons, moves-are-universally-available, Barboach

downside-moves-energy-discount [out:1 in:2]
  -> move-energy-cost
  <- move-energy-cost, ptr-vs-ptu-differences

extended-rest-clears-persistent-status [out:2 in:1]
  -> rest-cures-fatigue, take-a-breather-recovers-fatigue
  <- paralysis-condition

owned-pokemon-reject-capture [out:2 in:1]
  -> fainted-pokemon-cannot-be-captured, server-enforcement-with-gm-override
  <- fainted-pokemon-cannot-be-captured

two-to-three-species-per-encounter [out:2 in:1]
  -> wild-pokemon-social-hierarchy, niche-competition-drives-adaptation
  <- wild-pokemon-social-hierarchy

shiny-on-one-or-hundred [out:1 in:2]
  -> breeding-species-d20-roll
  <- breeding-species-d20-roll, fossil-mechanics

pokemon-party-limit-six [out:2 in:1]
  -> pokemon-level-range-1-to-20, pokemon-creation-ordered-steps
  <- pokemon-creation-ordered-steps

fossil-mechanics [out:3 in:0]
  -> skill-pokemon-education, skill-survival, shiny-on-one-or-hundred

natural-injury-healing-24h-timer [out:2 in:1]
  -> daily-injury-healing-cap, trainer-ap-drain-heals-injury
  <- daily-injury-healing-cap

one-evasion-per-accuracy-check [out:2 in:1]
  -> evasion-from-defensive-stats, flanking-penalty-post-cap
  <- evasion-from-defensive-stats

damage-base-to-dice-table [out:3 in:0]
  -> crit-doubles-dice-not-stats, damage-formula-step-order, stab-adds-to-damage-base

take-a-breather-requires-save-checks [out:2 in:1]
  -> take-a-breather-resets-combat-state, take-a-breather-trainer-assist
  <- take-a-breather-resets-combat-state

awakening-exists-as-standard-cure [out:1 in:2]
  -> cross-reference-before-concluding-omission
  <- cross-reference-before-concluding-omission, status-cure-items-catalog

gender-ratio-consistent-through-evolution [out:2 in:0]
  -> Eevee, eevee-line-unstable-genetics

disengage-avoids-opportunity-attacks [out:1 in:1]
  -> attack-of-opportunity-trigger-list
  <- attack-of-opportunity-trigger-list

stone-evolution-moves-at-current-level [out:2 in:0]
  -> moves-are-universally-available, unlock-conditions

snack-and-digestion-buff-system [out:2 in:0]
  -> restorative-items-catalog, applying-items-action-economy

sun-blanket-heals-a-tick [out:1 in:1]
  -> primary-source-over-summary
  <- primary-source-over-summary

poke-ball-recall-range [out:1 in:1]
  -> one-distance-metric-everywhere
  <- one-distance-metric-everywhere

skills-can-decrease-on-evolution [out:2 in:0]
  -> Houndour, Houndoom

evolution-stage-capture-modifiers [out:1 in:1]
  -> capture-rate-base-formula
  <- capture-rate-base-formula

stuck-blocks-movement-not-actions [out:1 in:1]
  -> ghost-type-ignores-movement-restrictions
  <- ghost-type-ignores-movement-restrictions

capture-costs-standard-action [out:1 in:1]
  -> capture-workflow
  <- capture-workflow

power-is-a-body-trait [out:2 in:0]
  -> trait-families, movement-traits

five-vitamin-limit-per-pokemon [out:1 in:1]
  -> vitamins-raise-base-stats
  <- vitamins-raise-base-stats

flinch-condition [out:2 in:0]
  -> vulnerable-condition, dynamic-initiative-on-speed-change

armor-and-shields [out:2 in:0]
  -> equipment-slots, weapon-system

rarity-capture-penalty [out:1 in:1]
  -> capture-rate-base-formula
  <- capture-rate-base-formula

breeding-traits-from-education-rank [out:2 in:0]
  -> breeding-not-trainer-influenced, hatched-pokemon-trait-pool

breeding-trait-choice-thresholds [out:2 in:0]
  -> breeding-not-trainer-influenced, inheritable-traits-list

precision-skill-checks-in-combat [out:1 in:0]
  -> skill-focus

evolution-stones-and-keepsakes [out:1 in:0]
  -> evolution-trigger-conditions

infatuation-condition [out:1 in:0]
  -> confused-three-outcome-save

jump-consumes-shift-distance [out:1 in:0]
  -> movement-traits

repel-mechanics [out:1 in:0]
  -> wild-encounter-motivations
