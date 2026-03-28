# Graph Index: vaults/documentation/software-engineering
# Generated: 2026-03-28
# Notes: 219 | Links: 1186 | Avg out-degree: 5.4
#
# Link resolution (unique targets):
#   local: 214
#   unresolved: 11
#   documentation: 5
#
# Format: note-name [out:N in:N]
#   -> outgoing (this note links to)
#   <- incoming (links to this note)

refactoring-techniques [out:11 in:74]
  -> code-smells, clean-code, composing-methods-techniques, moving-features-techniques, organizing-data-techniques, simplifying-conditionals-techniques, simplifying-method-calls-techniques, dealing-with-generalization-techniques, refactoring, refactoring-in-small-changes, refactoring-checklist
  <- add-parameter, change-bidirectional-to-unidirectional-association, change-reference-to-value, change-unidirectional-to-bidirectional-association, change-value-to-reference, code-smells, collapse-hierarchy, composing-methods-techniques, consolidate-conditional-expression, consolidate-duplicate-conditional-fragments, dealing-with-generalization-techniques, decompose-conditional, duplicate-observed-data, encapsulate-collection, encapsulate-field, extract-class, extract-interface, extract-method, extract-subclass, extract-superclass, extract-variable, form-template-method, hide-delegate, hide-method, inline-class, inline-method, inline-temp, introduce-assertion, introduce-foreign-method, introduce-local-extension, introduce-null-object, introduce-parameter-object, move-field, move-method, moving-features-techniques, organizing-data-techniques, parameterize-method, preserve-whole-object, pull-up-constructor-body, pull-up-field, pull-up-method, push-down-field, push-down-method, refactoring, remove-assignments-to-parameters, remove-control-flag, remove-middle-man, remove-parameter, remove-setting-method, rename-method, replace-array-with-object, replace-conditional-with-polymorphism, replace-constructor-with-factory-method, replace-data-value-with-object, replace-delegation-with-inheritance, replace-error-code-with-exception, replace-exception-with-test, replace-inheritance-with-delegation, replace-magic-number-with-symbolic-constant, replace-method-with-method-object, replace-nested-conditional-with-guard-clauses, replace-parameter-with-explicit-methods, replace-parameter-with-method-call, replace-subclass-with-fields, replace-temp-with-query, replace-type-code-with-class, replace-type-code-with-state-strategy, replace-type-code-with-subclasses, self-encapsulate-field, separate-query-from-modifier, simplifying-conditionals-techniques, simplifying-method-calls-techniques, split-temporary-variable, substitute-algorithm

design-patterns [out:10 in:36]
  -> creational-patterns, structural-patterns, behavioral-patterns, typescript-pattern-techniques, solid-principles, refactoring, code-smells, clean-code, composition-over-inheritance, uml
  <- abstract-factory-pattern, adapter-pattern, behavioral-patterns, bridge-pattern, builder-pattern, chain-of-responsibility-pattern, clean-code, code-smells, command-pattern, composite-pattern, composition-over-inheritance, creational-patterns, decorator-pattern, facade-pattern, factory-method-pattern, flyweight-pattern, interpreter-pattern, iterator-pattern, mediator-pattern, memento-pattern, null-object-pattern, object-pool-pattern, observer-pattern, private-class-data-pattern, prototype-pattern, proxy-pattern, refactoring, singleton-pattern, solid-principles, state-pattern, strategy-pattern, structural-patterns, template-method-pattern, typescript-pattern-techniques, uml, visitor-pattern

code-smells [out:11 in:33]
  -> refactoring, technical-debt, clean-code, bloater-smells, object-orientation-abuser-smells, change-preventer-smells, dispensable-smells, coupler-smells, refactoring-techniques, design-patterns, rule-of-three
  <- alternative-classes-with-different-interfaces-smell, bloater-smells, change-preventer-smells, clean-code, comments-smell, coupler-smells, data-class-smell, data-clumps-smell, dead-code-smell, design-patterns, dispensable-smells, divergent-change-smell, duplicate-code-smell, feature-envy-smell, inappropriate-intimacy-smell, incomplete-library-class-smell, large-class-smell, lazy-class-smell, long-method-smell, long-parameter-list-smell, message-chains-smell, middle-man-smell, object-orientation-abuser-smells, parallel-inheritance-hierarchies-smell, primitive-obsession-smell, refactoring-techniques, refactoring, refused-bequest-smell, shotgun-surgery-smell, speculative-generality-smell, switch-statements-smell, technical-debt, temporary-field-smell

typescript-pattern-techniques [out:16 in:23]
  -> design-patterns, open-closed-principle, template-method-pattern, chain-of-responsibility-pattern, composite-pattern, state-pattern, factory-method-pattern, iterator-pattern, singleton-pattern, decorator-pattern, bridge-pattern, command-pattern, observer-pattern, structural-patterns, behavioral-patterns, solid-principles
  <- abstract-factory-pattern, adapter-pattern, bridge-pattern, builder-pattern, chain-of-responsibility-pattern, command-pattern, composite-pattern, decorator-pattern, design-patterns, facade-pattern, factory-method-pattern, flyweight-pattern, iterator-pattern, mediator-pattern, memento-pattern, observer-pattern, prototype-pattern, proxy-pattern, singleton-pattern, state-pattern, strategy-pattern, template-method-pattern, visitor-pattern

uml [out:16 in:20]
  -> uml-use-case-diagram, uml-activity-diagram, uml-sequence-diagram, uml-class-diagram, uml-package-diagram, uml-statechart-diagram, uml-communication-diagram, uml-modeling-business-systems, uml-modeling-it-systems, uml-modeling-system-integration, uml-model, uml-view, uml-history, uml-requirement-specification, uml-case-tool, design-patterns
  <- design-patterns, uml-2-0, uml-activity-diagram, uml-business-process, uml-class-diagram, uml-communication-diagram, uml-electronic-data-interchange, uml-enterprise-application-integration, uml-generalization-specialization, uml-information-system-vs-it-system, uml-model, uml-modeling-business-systems, uml-modeling-it-systems, uml-modeling-system-integration, uml-package-diagram, uml-query-and-mutation-events, uml-sequence-diagram, uml-statechart-diagram, uml-use-case-diagram, uml-worker

organizing-data-techniques [out:17 in:16]
  -> refactoring-techniques, self-encapsulate-field, replace-data-value-with-object, change-value-to-reference, change-reference-to-value, replace-array-with-object, duplicate-observed-data, change-unidirectional-to-bidirectional-association, change-bidirectional-to-unidirectional-association, replace-magic-number-with-symbolic-constant, encapsulate-field, encapsulate-collection, replace-type-code-with-class, replace-type-code-with-subclasses, replace-type-code-with-state-strategy, replace-subclass-with-fields, primitive-obsession-smell
  <- change-bidirectional-to-unidirectional-association, change-reference-to-value, change-unidirectional-to-bidirectional-association, change-value-to-reference, duplicate-observed-data, encapsulate-collection, encapsulate-field, refactoring-techniques, replace-array-with-object, replace-data-value-with-object, replace-magic-number-with-symbolic-constant, replace-subclass-with-fields, replace-type-code-with-class, replace-type-code-with-state-strategy, replace-type-code-with-subclasses, self-encapsulate-field

refactoring [out:14 in:19]
  -> technical-debt, clean-code, rule-of-three, refactoring-when-adding-features, refactoring-when-fixing-bugs, refactoring-during-code-review, refactoring-in-small-changes, refactoring-checklist, refactoring-techniques, code-smells, solid-principles, design-patterns, single-responsibility-principle, technical-debt-cause-delayed-refactoring
  <- clean-code, code-smells, composing-methods-techniques, design-patterns, lazy-class-smell, refactoring-checklist, refactoring-during-code-review, refactoring-in-small-changes, refactoring-must-improve-code, refactoring-must-not-add-features, refactoring-must-pass-tests, refactoring-techniques, refactoring-when-adding-features, refactoring-when-fixing-bugs, rule-of-three, solid-principles, technical-debt-cause-delayed-refactoring, technical-debt-cause-ignorance, technical-debt

simplifying-method-calls-techniques [out:17 in:15]
  -> refactoring-techniques, rename-method, add-parameter, remove-parameter, separate-query-from-modifier, parameterize-method, replace-parameter-with-explicit-methods, preserve-whole-object, replace-parameter-with-method-call, introduce-parameter-object, remove-setting-method, hide-method, replace-constructor-with-factory-method, replace-error-code-with-exception, replace-exception-with-test, long-parameter-list-smell, data-clumps-smell
  <- add-parameter, hide-method, introduce-parameter-object, parameterize-method, preserve-whole-object, refactoring-techniques, remove-parameter, remove-setting-method, rename-method, replace-constructor-with-factory-method, replace-error-code-with-exception, replace-exception-with-test, replace-parameter-with-explicit-methods, replace-parameter-with-method-call, separate-query-from-modifier

single-responsibility-principle [out:7 in:23]
  -> solid-principles, large-class-smell, divergent-change-smell, facade-pattern, command-pattern, separation-of-concerns, solid-violation-causal-hierarchy
  <- adapter-pattern, bridge-pattern, builder-pattern, chain-of-responsibility-pattern, change-preventer-smells, command-pattern, decorator-pattern, divergent-change-smell, extract-class, facade-pattern, factory-method-pattern, iterator-pattern, large-class-smell, mediator-pattern, refactoring, separation-of-concerns, singleton-pattern, solid-principles, solid-violation-causal-hierarchy, state-pattern, technical-debt-cause-tight-coupling, tell-dont-ask, visitor-pattern

uml-modeling-it-systems [out:17 in:12]
  -> uml, uml-view, uml-modeling-business-systems, uml-external-view, uml-actor, uml-use-case-diagram, uml-sequence-diagram, uml-query-and-mutation-events, uml-structural-view, uml-class-diagram, uml-static-business-rule, uml-behavioral-view, uml-statechart-diagram, uml-dynamic-business-rule, uml-interaction-view, uml-communication-diagram, uml-modeling-system-integration
  <- uml-behavioral-view, uml-business-rules, uml-constructing-class-diagrams, uml-constructing-use-case-diagrams, uml-external-view, uml-information-system-vs-it-system, uml-interaction-view, uml-modeling-business-systems, uml-query-and-mutation-events, uml-structural-view, uml-use-case-diagram, uml

dealing-with-generalization-techniques [out:16 in:13]
  -> refactoring-techniques, pull-up-field, pull-up-method, pull-up-constructor-body, push-down-field, push-down-method, extract-subclass, extract-superclass, extract-interface, collapse-hierarchy, form-template-method, replace-inheritance-with-delegation, replace-delegation-with-inheritance, refused-bequest-smell, duplicate-code-smell, parallel-inheritance-hierarchies-smell
  <- collapse-hierarchy, extract-interface, extract-subclass, extract-superclass, form-template-method, pull-up-constructor-body, pull-up-field, pull-up-method, push-down-field, push-down-method, refactoring-techniques, replace-delegation-with-inheritance, replace-inheritance-with-delegation

strategy-pattern [out:12 in:15]
  -> behavioral-patterns, design-patterns, open-closed-principle, typescript-pattern-techniques, state-pattern, bridge-pattern, command-pattern, decorator-pattern, template-method-pattern, replace-type-code-with-state-strategy, replace-conditional-with-polymorphism, dependency-inversion-principle
  <- behavioral-patterns, bridge-pattern, command-pattern, composition-over-inheritance, decorator-pattern, dependency-inversion-principle, interpreter-pattern, null-object-pattern, open-closed-principle, replace-conditional-with-polymorphism, replace-type-code-with-state-strategy, state-pattern, switch-statements-smell, tell-dont-ask, template-method-pattern

uml-class-diagram [out:5 in:22]
  -> uml, uml-generalization-specialization, uml-business-rules, uml-constructing-class-diagrams, uml-statechart-diagram
  <- uml-2-0, uml-business-object, uml-business-rules, uml-case-tool, uml-communication-diagram, uml-constructing-class-diagrams, uml-constructing-communication-diagrams, uml-constructing-integration-class-diagrams, uml-constructing-sequence-diagrams, uml-generalization-specialization, uml-interaction-view, uml-internal-view, uml-modeling-business-systems, uml-modeling-it-systems, uml-modeling-system-integration, uml-object-lifecycle, uml-package-diagram, uml-statechart-diagram, uml-static-business-rule, uml-static-view, uml-structural-view, uml

behavioral-patterns [out:13 in:14]
  -> design-patterns, chain-of-responsibility-pattern, command-pattern, interpreter-pattern, iterator-pattern, mediator-pattern, memento-pattern, observer-pattern, state-pattern, strategy-pattern, template-method-pattern, null-object-pattern, visitor-pattern
  <- chain-of-responsibility-pattern, command-pattern, design-patterns, interpreter-pattern, iterator-pattern, mediator-pattern, memento-pattern, null-object-pattern, observer-pattern, state-pattern, strategy-pattern, template-method-pattern, typescript-pattern-techniques, visitor-pattern

open-closed-principle [out:6 in:20]
  -> solid-principles, switch-statements-smell, strategy-pattern, decorator-pattern, observer-pattern, solid-violation-causal-hierarchy
  <- abstract-factory-pattern, adapter-pattern, bridge-pattern, chain-of-responsibility-pattern, command-pattern, composite-pattern, composition-over-inheritance, factory-method-pattern, iterator-pattern, mediator-pattern, observer-pattern, proxy-pattern, replace-conditional-with-polymorphism, solid-principles, solid-violation-causal-hierarchy, state-pattern, strategy-pattern, switch-statements-smell, typescript-pattern-techniques, visitor-pattern

uml-modeling-system-integration [out:14 in:12]
  -> uml, uml-view, uml-process-view, uml-system-integration-message, uml-activity-diagram, uml-business-object, uml-sequence-diagram, uml-static-view, uml-class-diagram, uml-modeling-business-systems, uml-system-integration-interface, uml-enterprise-application-integration, uml-electronic-data-interchange, uml-data-transformation
  <- uml-business-object, uml-constructing-integration-class-diagrams, uml-constructing-process-view-diagrams, uml-data-transformation, uml-enterprise-application-integration, uml-modeling-business-systems, uml-modeling-it-systems, uml-process-view, uml-static-view, uml-system-integration-interface, uml-system-integration-message, uml

composing-methods-techniques [out:12 in:11]
  -> refactoring-techniques, refactoring, extract-method, inline-method, extract-variable, inline-temp, replace-temp-with-query, split-temporary-variable, remove-assignments-to-parameters, replace-method-with-method-object, substitute-algorithm, long-method-smell
  <- extract-method, extract-variable, inline-method, inline-temp, long-method-smell, refactoring-techniques, remove-assignments-to-parameters, replace-method-with-method-object, replace-temp-with-query, split-temporary-variable, substitute-algorithm

technical-debt [out:12 in:11]
  -> refactoring, clean-code, technical-debt-cause-ignorance, technical-debt-cause-tight-coupling, technical-debt-cause-missing-tests, technical-debt-cause-missing-documentation, technical-debt-cause-poor-knowledge-sharing, technical-debt-cause-branch-divergence, technical-debt-cause-delayed-refactoring, technical-debt-cause-no-coding-standards, technical-debt-cause-incompetence, code-smells
  <- code-smells, refactoring, technical-debt-cause-branch-divergence, technical-debt-cause-delayed-refactoring, technical-debt-cause-ignorance, technical-debt-cause-incompetence, technical-debt-cause-missing-documentation, technical-debt-cause-missing-tests, technical-debt-cause-no-coding-standards, technical-debt-cause-poor-knowledge-sharing, technical-debt-cause-tight-coupling

moving-features-techniques [out:12 in:9]
  -> refactoring-techniques, move-method, move-field, extract-class, inline-class, hide-delegate, remove-middle-man, introduce-foreign-method, introduce-local-extension, feature-envy-smell, middle-man-smell, lazy-class-smell
  <- extract-class, hide-delegate, inline-class, introduce-foreign-method, introduce-local-extension, move-field, move-method, refactoring-techniques, remove-middle-man

uml-statechart-diagram [out:8 in:13]
  -> uml, uml-dynamic-business-rule, uml-object-lifecycle, uml-query-and-mutation-events, uml-2-0, uml-constructing-statechart-diagrams, uml-class-diagram, uml-behavioral-view
  <- uml-2-0, uml-activity-diagram, uml-behavioral-view, uml-business-rules, uml-case-tool, uml-class-diagram, uml-constructing-sequence-diagrams, uml-constructing-statechart-diagrams, uml-dynamic-business-rule, uml-modeling-it-systems, uml-object-lifecycle, uml-query-and-mutation-events, uml

composite-pattern [out:11 in:10]
  -> structural-patterns, design-patterns, open-closed-principle, typescript-pattern-techniques, builder-pattern, chain-of-responsibility-pattern, iterator-pattern, visitor-pattern, decorator-pattern, prototype-pattern, flyweight-pattern
  <- builder-pattern, chain-of-responsibility-pattern, decorator-pattern, flyweight-pattern, interpreter-pattern, iterator-pattern, prototype-pattern, structural-patterns, typescript-pattern-techniques, visitor-pattern

bridge-pattern [out:11 in:9]
  -> structural-patterns, design-patterns, open-closed-principle, single-responsibility-principle, typescript-pattern-techniques, adapter-pattern, state-pattern, strategy-pattern, abstract-factory-pattern, builder-pattern, composition-over-inheritance
  <- abstract-factory-pattern, adapter-pattern, builder-pattern, composition-over-inheritance, separation-of-concerns, state-pattern, strategy-pattern, structural-patterns, typescript-pattern-techniques

facade-pattern [out:9 in:11]
  -> structural-patterns, design-patterns, typescript-pattern-techniques, adapter-pattern, mediator-pattern, proxy-pattern, singleton-pattern, abstract-factory-pattern, single-responsibility-principle
  <- abstract-factory-pattern, adapter-pattern, flyweight-pattern, law-of-demeter, mediator-pattern, message-chains-smell, proxy-pattern, separation-of-concerns, single-responsibility-principle, singleton-pattern, structural-patterns

factory-method-pattern [out:11 in:9]
  -> creational-patterns, design-patterns, single-responsibility-principle, open-closed-principle, dependency-inversion-principle, typescript-pattern-techniques, abstract-factory-pattern, builder-pattern, prototype-pattern, template-method-pattern, replace-constructor-with-factory-method
  <- abstract-factory-pattern, builder-pattern, creational-patterns, iterator-pattern, object-pool-pattern, prototype-pattern, replace-constructor-with-factory-method, template-method-pattern, typescript-pattern-techniques

decorator-pattern [out:10 in:10]
  -> structural-patterns, design-patterns, single-responsibility-principle, typescript-pattern-techniques, adapter-pattern, proxy-pattern, chain-of-responsibility-pattern, composite-pattern, strategy-pattern, prototype-pattern
  <- adapter-pattern, chain-of-responsibility-pattern, composite-pattern, composition-over-inheritance, open-closed-principle, prototype-pattern, proxy-pattern, strategy-pattern, structural-patterns, typescript-pattern-techniques

uml-modeling-business-systems [out:12 in:8]
  -> uml, uml-business-system, uml-view, uml-external-view, uml-use-case-diagram, uml-activity-diagram, uml-sequence-diagram, uml-internal-view, uml-package-diagram, uml-class-diagram, uml-modeling-it-systems, uml-modeling-system-integration
  <- uml-business-system, uml-constructing-process-view-diagrams, uml-constructing-use-case-diagrams, uml-information-system-vs-it-system, uml-modeling-it-systems, uml-modeling-system-integration, uml-process-view, uml

structural-patterns [out:9 in:10]
  -> design-patterns, adapter-pattern, bridge-pattern, composite-pattern, decorator-pattern, facade-pattern, flyweight-pattern, private-class-data-pattern, proxy-pattern
  <- adapter-pattern, bridge-pattern, composite-pattern, decorator-pattern, design-patterns, facade-pattern, flyweight-pattern, private-class-data-pattern, proxy-pattern, typescript-pattern-techniques

state-pattern [out:9 in:10]
  -> behavioral-patterns, design-patterns, single-responsibility-principle, open-closed-principle, typescript-pattern-techniques, strategy-pattern, bridge-pattern, replace-type-code-with-state-strategy, switch-statements-smell
  <- behavioral-patterns, bridge-pattern, composition-over-inheritance, interpreter-pattern, null-object-pattern, replace-type-code-with-state-strategy, strategy-pattern, switch-statements-smell, tell-dont-ask, typescript-pattern-techniques

uml-sequence-diagram [out:5 in:14]
  -> uml, uml-communication-diagram, uml-query-and-mutation-events, uml-constructing-sequence-diagrams, uml-activity-diagram
  <- uml-2-0, uml-activity-diagram, uml-communication-diagram, uml-constructing-sequence-diagrams, uml-constructing-use-case-diagrams, uml-interaction-view, uml-modeling-business-systems, uml-modeling-it-systems, uml-modeling-system-integration, uml-process-view, uml-query-and-mutation-events, uml-system-integration-message, uml-use-case-diagram, uml

solid-principles [out:9 in:10]
  -> single-responsibility-principle, open-closed-principle, liskov-substitution-principle, interface-segregation-principle, dependency-inversion-principle, solid-violation-causal-hierarchy, clean-code, refactoring, design-patterns
  <- clean-code, dependency-inversion-principle, design-patterns, interface-segregation-principle, liskov-substitution-principle, open-closed-principle, refactoring, single-responsibility-principle, solid-violation-causal-hierarchy, typescript-pattern-techniques

simplifying-conditionals-techniques [out:10 in:9]
  -> refactoring-techniques, decompose-conditional, consolidate-conditional-expression, consolidate-duplicate-conditional-fragments, remove-control-flag, replace-nested-conditional-with-guard-clauses, replace-conditional-with-polymorphism, introduce-null-object, introduce-assertion, switch-statements-smell
  <- consolidate-conditional-expression, consolidate-duplicate-conditional-fragments, decompose-conditional, introduce-assertion, introduce-null-object, refactoring-techniques, remove-control-flag, replace-conditional-with-polymorphism, replace-nested-conditional-with-guard-clauses

abstract-factory-pattern [out:11 in:8]
  -> creational-patterns, design-patterns, open-closed-principle, typescript-pattern-techniques, factory-method-pattern, builder-pattern, prototype-pattern, facade-pattern, bridge-pattern, singleton-pattern, dependency-inversion-principle
  <- bridge-pattern, builder-pattern, creational-patterns, dependency-inversion-principle, facade-pattern, factory-method-pattern, prototype-pattern, singleton-pattern

command-pattern [out:10 in:9]
  -> behavioral-patterns, design-patterns, single-responsibility-principle, open-closed-principle, typescript-pattern-techniques, strategy-pattern, memento-pattern, chain-of-responsibility-pattern, observer-pattern, visitor-pattern
  <- behavioral-patterns, chain-of-responsibility-pattern, memento-pattern, observer-pattern, single-responsibility-principle, strategy-pattern, tell-dont-ask, typescript-pattern-techniques, visitor-pattern

clean-code [out:4 in:14]
  -> refactoring, code-smells, solid-principles, design-patterns
  <- code-smells, comments-smell, design-patterns, duplicate-code-smell, refactoring-during-code-review, refactoring-must-pass-tests, refactoring-techniques, refactoring-when-adding-features, refactoring, rule-of-three, solid-principles, technical-debt-cause-missing-tests, technical-debt-cause-no-coding-standards, technical-debt

uml-activity-diagram [out:5 in:12]
  -> uml, uml-2-0, uml-statechart-diagram, uml-constructing-activity-diagrams, uml-sequence-diagram
  <- uml-2-0, uml-business-process, uml-constructing-activity-diagrams, uml-constructing-process-view-diagrams, uml-constructing-use-case-diagrams, uml-internal-view, uml-modeling-business-systems, uml-modeling-system-integration, uml-process-view, uml-sequence-diagram, uml-use-case-diagram, uml

chain-of-responsibility-pattern [out:10 in:7]
  -> behavioral-patterns, design-patterns, single-responsibility-principle, open-closed-principle, typescript-pattern-techniques, composite-pattern, command-pattern, decorator-pattern, mediator-pattern, observer-pattern
  <- behavioral-patterns, command-pattern, composite-pattern, decorator-pattern, mediator-pattern, observer-pattern, typescript-pattern-techniques

uml-business-object [out:6 in:11]
  -> uml-business-system, uml-worker, uml-modeling-system-integration, uml-package-diagram, uml-system-integration-message, uml-class-diagram
  <- uml-business-system, uml-constructing-integration-class-diagrams, uml-constructing-package-diagrams, uml-constructing-process-view-diagrams, uml-constructing-sequence-diagrams, uml-data-transformation, uml-modeling-system-integration, uml-package-diagram, uml-process-view, uml-static-view, uml-system-integration-message

uml-view [out:3 in:14]
  -> uml-model, uml-external-view, uml-internal-view
  <- uml-behavioral-view, uml-business-system, uml-case-tool, uml-external-view, uml-interaction-view, uml-internal-view, uml-model, uml-modeling-business-systems, uml-modeling-it-systems, uml-modeling-system-integration, uml-process-view, uml-static-view, uml-structural-view, uml

uml-query-and-mutation-events [out:7 in:9]
  -> uml-modeling-it-systems, uml, uml-communication-diagram, uml-sequence-diagram, uml-actor, uml-object-lifecycle, uml-statechart-diagram
  <- uml-communication-diagram, uml-constructing-communication-diagrams, uml-constructing-statechart-diagrams, uml-dynamic-business-rule, uml-interaction-view, uml-modeling-it-systems, uml-object-lifecycle, uml-sequence-diagram, uml-statechart-diagram

uml-internal-view [out:7 in:9]
  -> uml-view, uml-business-system, uml-external-view, uml-package-diagram, uml-class-diagram, uml-activity-diagram, uml-worker
  <- uml-actor, uml-business-system, uml-constructing-activity-diagrams, uml-constructing-class-diagrams, uml-constructing-package-diagrams, uml-external-view, uml-modeling-business-systems, uml-package-diagram, uml-view

uml-interaction-view [out:10 in:5]
  -> uml-view, uml-modeling-it-systems, uml-class-diagram, uml-use-case-diagram, uml-communication-diagram, uml-query-and-mutation-events, uml-sequence-diagram, uml-structural-view, uml-constructing-communication-diagrams, uml-constructing-sequence-diagrams
  <- uml-communication-diagram, uml-constructing-communication-diagrams, uml-constructing-sequence-diagrams, uml-modeling-it-systems, uml-structural-view

iterator-pattern [out:9 in:6]
  -> behavioral-patterns, design-patterns, single-responsibility-principle, open-closed-principle, typescript-pattern-techniques, composite-pattern, factory-method-pattern, memento-pattern, visitor-pattern
  <- behavioral-patterns, composite-pattern, interpreter-pattern, memento-pattern, typescript-pattern-techniques, visitor-pattern

uml-business-system [out:8 in:7]
  -> uml-business-object, uml-business-process, uml-view, uml-external-view, uml-internal-view, uml-modeling-business-systems, uml-actor, uml-worker
  <- uml-business-object, uml-business-process, uml-external-view, uml-internal-view, uml-modeling-business-systems, uml-package-diagram, uml-worker

uml-package-diagram [out:8 in:7]
  -> uml, uml-internal-view, uml-business-system, uml-worker, uml-business-object, uml-actor, uml-constructing-package-diagrams, uml-class-diagram
  <- uml-business-object, uml-constructing-class-diagrams, uml-constructing-package-diagrams, uml-internal-view, uml-modeling-business-systems, uml-worker, uml

uml-behavioral-view [out:8 in:7]
  -> uml-view, uml-modeling-it-systems, uml-statechart-diagram, uml-object-lifecycle, uml-dynamic-business-rule, uml-structural-view, uml-business-rules, uml-constructing-statechart-diagrams
  <- uml-business-rules, uml-constructing-statechart-diagrams, uml-dynamic-business-rule, uml-modeling-it-systems, uml-object-lifecycle, uml-statechart-diagram, uml-structural-view

uml-use-case-diagram [out:6 in:9]
  -> uml, uml-actor, uml-modeling-it-systems, uml-constructing-use-case-diagrams, uml-activity-diagram, uml-sequence-diagram
  <- uml-2-0, uml-actor, uml-constructing-sequence-diagrams, uml-constructing-use-case-diagrams, uml-external-view, uml-interaction-view, uml-modeling-business-systems, uml-modeling-it-systems, uml

uml-system-integration-message [out:6 in:8]
  -> uml-system-integration-interface, uml-modeling-system-integration, uml-business-object, uml-sequence-diagram, uml-electronic-data-interchange, uml-process-view
  <- uml-business-object, uml-constructing-process-view-diagrams, uml-data-transformation, uml-electronic-data-interchange, uml-modeling-system-integration, uml-process-view, uml-static-view, uml-system-integration-interface

prototype-pattern [out:7 in:7]
  -> creational-patterns, design-patterns, typescript-pattern-techniques, factory-method-pattern, abstract-factory-pattern, composite-pattern, decorator-pattern
  <- abstract-factory-pattern, composite-pattern, creational-patterns, decorator-pattern, factory-method-pattern, memento-pattern, object-pool-pattern

switch-statements-smell [out:7 in:7]
  -> object-orientation-abuser-smells, code-smells, replace-conditional-with-polymorphism, replace-type-code-with-subclasses, state-pattern, strategy-pattern, open-closed-principle
  <- object-orientation-abuser-smells, open-closed-principle, replace-conditional-with-polymorphism, replace-type-code-with-state-strategy, replace-type-code-with-subclasses, simplifying-conditionals-techniques, state-pattern

singleton-pattern [out:7 in:7]
  -> creational-patterns, design-patterns, single-responsibility-principle, typescript-pattern-techniques, facade-pattern, flyweight-pattern, abstract-factory-pattern
  <- abstract-factory-pattern, creational-patterns, facade-pattern, flyweight-pattern, null-object-pattern, object-pool-pattern, typescript-pattern-techniques

coupler-smells [out:8 in:6]
  -> code-smells, feature-envy-smell, inappropriate-intimacy-smell, message-chains-smell, middle-man-smell, incomplete-library-class-smell, law-of-demeter, tell-dont-ask
  <- code-smells, feature-envy-smell, inappropriate-intimacy-smell, incomplete-library-class-smell, message-chains-smell, middle-man-smell

adapter-pattern [out:9 in:5]
  -> structural-patterns, design-patterns, single-responsibility-principle, open-closed-principle, typescript-pattern-techniques, bridge-pattern, decorator-pattern, facade-pattern, proxy-pattern
  <- bridge-pattern, decorator-pattern, facade-pattern, proxy-pattern, structural-patterns

builder-pattern [out:8 in:6]
  -> creational-patterns, design-patterns, single-responsibility-principle, typescript-pattern-techniques, factory-method-pattern, abstract-factory-pattern, composite-pattern, bridge-pattern
  <- abstract-factory-pattern, bridge-pattern, composite-pattern, creational-patterns, factory-method-pattern, private-class-data-pattern

duplicate-code-smell [out:6 in:8]
  -> dispensable-smells, code-smells, extract-method, pull-up-method, rule-of-three, clean-code
  <- consolidate-duplicate-conditional-fragments, dealing-with-generalization-techniques, dispensable-smells, extract-superclass, parameterize-method, pull-up-method, rule-of-three, single-source-of-truth

creational-patterns [out:7 in:7]
  -> design-patterns, factory-method-pattern, abstract-factory-pattern, builder-pattern, prototype-pattern, singleton-pattern, object-pool-pattern
  <- abstract-factory-pattern, builder-pattern, design-patterns, factory-method-pattern, object-pool-pattern, prototype-pattern, singleton-pattern

dispensable-smells [out:7 in:7]
  -> code-smells, comments-smell, duplicate-code-smell, lazy-class-smell, data-class-smell, dead-code-smell, speculative-generality-smell
  <- code-smells, comments-smell, data-class-smell, dead-code-smell, duplicate-code-smell, lazy-class-smell, speculative-generality-smell

feature-envy-smell [out:7 in:7]
  -> coupler-smells, code-smells, move-method, move-field, data-class-smell, tell-dont-ask, law-of-demeter
  <- coupler-smells, data-class-smell, law-of-demeter, move-field, move-method, moving-features-techniques, tell-dont-ask

uml-process-view [out:9 in:4]
  -> uml-view, uml-modeling-system-integration, uml-system-integration-message, uml-activity-diagram, uml-business-object, uml-sequence-diagram, uml-modeling-business-systems, uml-constructing-process-view-diagrams, uml-static-view
  <- uml-constructing-process-view-diagrams, uml-modeling-system-integration, uml-static-view, uml-system-integration-message

tell-dont-ask [out:8 in:5]
  -> law-of-demeter, feature-envy-smell, data-class-smell, command-pattern, strategy-pattern, state-pattern, move-method, single-responsibility-principle
  <- coupler-smells, data-class-smell, feature-envy-smell, inappropriate-intimacy-smell, law-of-demeter

uml-dynamic-business-rule [out:6 in:7]
  -> uml-business-rules, uml-statechart-diagram, uml-behavioral-view, uml-query-and-mutation-events, uml-static-business-rule, uml-object-lifecycle
  <- uml-behavioral-view, uml-business-rules, uml-constructing-statechart-diagrams, uml-modeling-it-systems, uml-object-lifecycle, uml-statechart-diagram, uml-static-business-rule

uml-structural-view [out:8 in:5]
  -> uml-view, uml-modeling-it-systems, uml-class-diagram, uml-static-business-rule, uml-behavioral-view, uml-business-rules, uml-interaction-view, uml-constructing-class-diagrams
  <- uml-behavioral-view, uml-business-rules, uml-interaction-view, uml-modeling-it-systems, uml-static-business-rule

uml-static-view [out:9 in:4]
  -> uml-view, uml-modeling-system-integration, uml-business-object, uml-system-integration-message, uml-class-diagram, uml-constructing-integration-class-diagrams, uml-data-transformation, uml-electronic-data-interchange, uml-process-view
  <- uml-constructing-integration-class-diagrams, uml-electronic-data-interchange, uml-modeling-system-integration, uml-process-view

solid-violation-causal-hierarchy [out:7 in:6]
  -> single-responsibility-principle, dependency-inversion-principle, interface-segregation-principle, open-closed-principle, liskov-substitution-principle, shotgun-surgery-smell, solid-principles
  <- dependency-inversion-principle, interface-segregation-principle, liskov-substitution-principle, open-closed-principle, single-responsibility-principle, solid-principles

uml-business-rules [out:7 in:6]
  -> uml-static-business-rule, uml-class-diagram, uml-dynamic-business-rule, uml-statechart-diagram, uml-modeling-it-systems, uml-structural-view, uml-behavioral-view
  <- uml-behavioral-view, uml-class-diagram, uml-dynamic-business-rule, uml-object-lifecycle, uml-static-business-rule, uml-structural-view

visitor-pattern [out:8 in:5]
  -> behavioral-patterns, design-patterns, single-responsibility-principle, open-closed-principle, typescript-pattern-techniques, command-pattern, composite-pattern, iterator-pattern
  <- behavioral-patterns, command-pattern, composite-pattern, interpreter-pattern, iterator-pattern

mediator-pattern [out:8 in:5]
  -> behavioral-patterns, design-patterns, single-responsibility-principle, open-closed-principle, typescript-pattern-techniques, facade-pattern, observer-pattern, chain-of-responsibility-pattern
  <- behavioral-patterns, chain-of-responsibility-pattern, facade-pattern, law-of-demeter, observer-pattern

observer-pattern [out:7 in:6]
  -> behavioral-patterns, design-patterns, open-closed-principle, typescript-pattern-techniques, mediator-pattern, command-pattern, chain-of-responsibility-pattern
  <- behavioral-patterns, chain-of-responsibility-pattern, command-pattern, mediator-pattern, open-closed-principle, typescript-pattern-techniques

template-method-pattern [out:7 in:6]
  -> behavioral-patterns, design-patterns, liskov-substitution-principle, typescript-pattern-techniques, factory-method-pattern, strategy-pattern, composition-over-inheritance
  <- behavioral-patterns, composition-over-inheritance, factory-method-pattern, liskov-substitution-principle, strategy-pattern, typescript-pattern-techniques

bloater-smells [out:6 in:6]
  -> code-smells, long-method-smell, large-class-smell, primitive-obsession-smell, long-parameter-list-smell, data-clumps-smell
  <- code-smells, data-clumps-smell, large-class-smell, long-method-smell, long-parameter-list-smell, primitive-obsession-smell

composition-over-inheritance [out:9 in:3]
  -> design-patterns, strategy-pattern, decorator-pattern, bridge-pattern, state-pattern, template-method-pattern, trait-composed-domain-model, open-closed-principle, liskov-substitution-principle
  <- bridge-pattern, design-patterns, template-method-pattern

uml-worker [out:5 in:7]
  -> uml, uml-business-process, uml-business-system, uml-actor, uml-package-diagram
  <- uml-actor, uml-business-object, uml-business-process, uml-business-system, uml-constructing-package-diagrams, uml-internal-view, uml-package-diagram

uml-communication-diagram [out:6 in:6]
  -> uml, uml-class-diagram, uml-sequence-diagram, uml-query-and-mutation-events, uml-constructing-communication-diagrams, uml-interaction-view
  <- uml-constructing-communication-diagrams, uml-interaction-view, uml-modeling-it-systems, uml-query-and-mutation-events, uml-sequence-diagram, uml

refused-bequest-smell [out:6 in:6]
  -> object-orientation-abuser-smells, code-smells, liskov-substitution-principle, replace-inheritance-with-delegation, push-down-method, push-down-field
  <- dealing-with-generalization-techniques, liskov-substitution-principle, object-orientation-abuser-smells, push-down-field, push-down-method, replace-inheritance-with-delegation

uml-external-view [out:6 in:6]
  -> uml-view, uml-business-system, uml-modeling-it-systems, uml-internal-view, uml-use-case-diagram, uml-actor
  <- uml-business-system, uml-constructing-activity-diagrams, uml-internal-view, uml-modeling-business-systems, uml-modeling-it-systems, uml-view

proxy-pattern [out:7 in:5]
  -> structural-patterns, design-patterns, open-closed-principle, typescript-pattern-techniques, adapter-pattern, decorator-pattern, facade-pattern
  <- adapter-pattern, decorator-pattern, facade-pattern, null-object-pattern, structural-patterns

law-of-demeter [out:6 in:5]
  -> message-chains-smell, inappropriate-intimacy-smell, feature-envy-smell, facade-pattern, mediator-pattern, tell-dont-ask
  <- coupler-smells, feature-envy-smell, inappropriate-intimacy-smell, message-chains-smell, tell-dont-ask

extract-method [out:4 in:7]
  -> composing-methods-techniques, refactoring-techniques, long-method-smell, extract-variable
  <- composing-methods-techniques, consolidate-conditional-expression, decompose-conditional, duplicate-code-smell, extract-variable, long-method-smell, replace-method-with-method-object

uml-object-lifecycle [out:6 in:5]
  -> uml-business-rules, uml-query-and-mutation-events, uml-dynamic-business-rule, uml-behavioral-view, uml-statechart-diagram, uml-class-diagram
  <- uml-behavioral-view, uml-constructing-statechart-diagrams, uml-dynamic-business-rule, uml-query-and-mutation-events, uml-statechart-diagram

long-parameter-list-smell [out:5 in:6]
  -> bloater-smells, code-smells, introduce-parameter-object, preserve-whole-object, data-clumps-smell
  <- add-parameter, bloater-smells, data-clumps-smell, introduce-parameter-object, preserve-whole-object, simplifying-method-calls-techniques

data-class-smell [out:7 in:4]
  -> dispensable-smells, code-smells, move-method, encapsulate-field, data-clumps-smell, feature-envy-smell, tell-dont-ask
  <- data-clumps-smell, dispensable-smells, feature-envy-smell, tell-dont-ask

uml-actor [out:4 in:7]
  -> uml-business-process, uml-internal-view, uml-use-case-diagram, uml-worker
  <- uml-business-system, uml-external-view, uml-modeling-it-systems, uml-package-diagram, uml-query-and-mutation-events, uml-use-case-diagram, uml-worker

replace-type-code-with-subclasses [out:5 in:6]
  -> organizing-data-techniques, refactoring-techniques, switch-statements-smell, replace-conditional-with-polymorphism, replace-type-code-with-state-strategy
  <- extract-subclass, organizing-data-techniques, replace-conditional-with-polymorphism, replace-type-code-with-class, replace-type-code-with-state-strategy, switch-statements-smell

lazy-class-smell [out:6 in:5]
  -> dispensable-smells, code-smells, refactoring, speculative-generality-smell, inline-class, collapse-hierarchy
  <- collapse-hierarchy, dispensable-smells, inline-class, moving-features-techniques, speculative-generality-smell

large-class-smell [out:6 in:5]
  -> bloater-smells, code-smells, long-method-smell, extract-class, single-responsibility-principle, divergent-change-smell
  <- bloater-smells, divergent-change-smell, extract-class, long-method-smell, single-responsibility-principle

flyweight-pattern [out:6 in:4]
  -> structural-patterns, design-patterns, typescript-pattern-techniques, composite-pattern, singleton-pattern, facade-pattern
  <- composite-pattern, interpreter-pattern, singleton-pattern, structural-patterns

replace-type-code-with-state-strategy [out:6 in:4]
  -> organizing-data-techniques, refactoring-techniques, state-pattern, strategy-pattern, replace-type-code-with-subclasses, switch-statements-smell
  <- organizing-data-techniques, replace-type-code-with-subclasses, state-pattern, strategy-pattern

uml-constructing-sequence-diagrams [out:7 in:3]
  -> uml-sequence-diagram, uml-interaction-view, uml-use-case-diagram, uml-business-object, uml-statechart-diagram, uml-class-diagram, uml-constructing-communication-diagrams
  <- uml-constructing-communication-diagrams, uml-interaction-view, uml-sequence-diagram

dependency-inversion-principle [out:4 in:6]
  -> solid-principles, abstract-factory-pattern, strategy-pattern, solid-violation-causal-hierarchy
  <- abstract-factory-pattern, factory-method-pattern, solid-principles, solid-violation-causal-hierarchy, strategy-pattern, technical-debt-cause-tight-coupling

replace-conditional-with-polymorphism [out:6 in:4]
  -> simplifying-conditionals-techniques, refactoring-techniques, switch-statements-smell, open-closed-principle, strategy-pattern, replace-type-code-with-subclasses
  <- replace-type-code-with-subclasses, simplifying-conditionals-techniques, strategy-pattern, switch-statements-smell

object-orientation-abuser-smells [out:5 in:5]
  -> code-smells, switch-statements-smell, temporary-field-smell, refused-bequest-smell, alternative-classes-with-different-interfaces-smell
  <- alternative-classes-with-different-interfaces-smell, code-smells, refused-bequest-smell, switch-statements-smell, temporary-field-smell

divergent-change-smell [out:5 in:5]
  -> change-preventer-smells, code-smells, single-responsibility-principle, large-class-smell, shotgun-surgery-smell
  <- change-preventer-smells, large-class-smell, separation-of-concerns, shotgun-surgery-smell, single-responsibility-principle

data-clumps-smell [out:5 in:5]
  -> bloater-smells, code-smells, introduce-parameter-object, long-parameter-list-smell, data-class-smell
  <- bloater-smells, data-class-smell, introduce-parameter-object, long-parameter-list-smell, simplifying-method-calls-techniques

uml-electronic-data-interchange [out:4 in:6]
  -> uml-system-integration-message, uml, uml-static-view, uml-enterprise-application-integration
  <- uml-constructing-integration-class-diagrams, uml-data-transformation, uml-enterprise-application-integration, uml-modeling-system-integration, uml-static-view, uml-system-integration-message

primitive-obsession-smell [out:5 in:5]
  -> bloater-smells, code-smells, replace-data-value-with-object, replace-type-code-with-class, replace-magic-number-with-symbolic-constant
  <- bloater-smells, organizing-data-techniques, replace-data-value-with-object, replace-magic-number-with-symbolic-constant, replace-type-code-with-class

long-method-smell [out:5 in:5]
  -> bloater-smells, code-smells, composing-methods-techniques, extract-method, large-class-smell
  <- bloater-smells, composing-methods-techniques, extract-method, large-class-smell, replace-method-with-method-object

introduce-parameter-object [out:5 in:4]
  -> simplifying-method-calls-techniques, refactoring-techniques, long-parameter-list-smell, data-clumps-smell, preserve-whole-object
  <- data-clumps-smell, long-parameter-list-smell, preserve-whole-object, simplifying-method-calls-techniques

interpreter-pattern [out:8 in:1]
  -> behavioral-patterns, design-patterns, composite-pattern, visitor-pattern, iterator-pattern, flyweight-pattern, state-pattern, strategy-pattern
  <- behavioral-patterns

memento-pattern [out:6 in:3]
  -> behavioral-patterns, design-patterns, typescript-pattern-techniques, command-pattern, iterator-pattern, prototype-pattern
  <- behavioral-patterns, command-pattern, iterator-pattern

move-method [out:4 in:5]
  -> moving-features-techniques, refactoring-techniques, feature-envy-smell, move-field
  <- data-class-smell, feature-envy-smell, move-field, moving-features-techniques, tell-dont-ask

change-preventer-smells [out:5 in:4]
  -> code-smells, divergent-change-smell, shotgun-surgery-smell, parallel-inheritance-hierarchies-smell, single-responsibility-principle
  <- code-smells, divergent-change-smell, parallel-inheritance-hierarchies-smell, shotgun-surgery-smell

liskov-substitution-principle [out:4 in:5]
  -> solid-principles, refused-bequest-smell, template-method-pattern, solid-violation-causal-hierarchy
  <- composition-over-inheritance, refused-bequest-smell, solid-principles, solid-violation-causal-hierarchy, template-method-pattern

uml-2-0 [out:6 in:3]
  -> uml, uml-activity-diagram, uml-statechart-diagram, uml-sequence-diagram, uml-class-diagram, uml-use-case-diagram
  <- uml-activity-diagram, uml-history, uml-statechart-diagram

uml-constructing-communication-diagrams [out:5 in:3]
  -> uml-communication-diagram, uml-interaction-view, uml-query-and-mutation-events, uml-class-diagram, uml-constructing-sequence-diagrams
  <- uml-communication-diagram, uml-constructing-sequence-diagrams, uml-interaction-view

shotgun-surgery-smell [out:3 in:5]
  -> change-preventer-smells, code-smells, divergent-change-smell
  <- change-preventer-smells, divergent-change-smell, parallel-inheritance-hierarchies-smell, separation-of-concerns, solid-violation-causal-hierarchy

uml-static-business-rule [out:4 in:4]
  -> uml-business-rules, uml-class-diagram, uml-structural-view, uml-dynamic-business-rule
  <- uml-business-rules, uml-dynamic-business-rule, uml-modeling-it-systems, uml-structural-view

extract-interface [out:4 in:4]
  -> dealing-with-generalization-techniques, refactoring-techniques, interface-segregation-principle, extract-superclass
  <- alternative-classes-with-different-interfaces-smell, dealing-with-generalization-techniques, extract-superclass, interface-segregation-principle

uml-constructing-integration-class-diagrams [out:6 in:2]
  -> uml-class-diagram, uml-static-view, uml-modeling-system-integration, uml-business-object, uml-data-transformation, uml-electronic-data-interchange
  <- uml-data-transformation, uml-static-view

extract-class [out:5 in:3]
  -> moving-features-techniques, refactoring-techniques, large-class-smell, single-responsibility-principle, inline-class
  <- inline-class, large-class-smell, moving-features-techniques

message-chains-smell [out:5 in:3]
  -> coupler-smells, code-smells, hide-delegate, law-of-demeter, facade-pattern
  <- coupler-smells, hide-delegate, law-of-demeter

null-object-pattern [out:7 in:1]
  -> behavioral-patterns, design-patterns, state-pattern, proxy-pattern, strategy-pattern, singleton-pattern, introduce-null-object
  <- behavioral-patterns

uml-data-transformation [out:5 in:3]
  -> uml-system-integration-message, uml-modeling-system-integration, uml-business-object, uml-constructing-integration-class-diagrams, uml-electronic-data-interchange
  <- uml-constructing-integration-class-diagrams, uml-modeling-system-integration, uml-static-view

extract-superclass [out:5 in:3]
  -> dealing-with-generalization-techniques, refactoring-techniques, duplicate-code-smell, extract-subclass, extract-interface
  <- dealing-with-generalization-techniques, extract-interface, extract-subclass

collapse-hierarchy [out:4 in:3]
  -> dealing-with-generalization-techniques, refactoring-techniques, lazy-class-smell, replace-subclass-with-fields
  <- dealing-with-generalization-techniques, lazy-class-smell, replace-subclass-with-fields

push-down-method [out:4 in:3]
  -> dealing-with-generalization-techniques, refactoring-techniques, pull-up-method, refused-bequest-smell
  <- dealing-with-generalization-techniques, pull-up-method, refused-bequest-smell

extract-variable [out:4 in:3]
  -> composing-methods-techniques, refactoring-techniques, extract-method, inline-temp
  <- composing-methods-techniques, extract-method, inline-temp

introduce-foreign-method [out:4 in:3]
  -> moving-features-techniques, refactoring-techniques, introduce-local-extension, incomplete-library-class-smell
  <- incomplete-library-class-smell, introduce-local-extension, moving-features-techniques

incomplete-library-class-smell [out:4 in:3]
  -> coupler-smells, code-smells, introduce-local-extension, introduce-foreign-method
  <- coupler-smells, introduce-foreign-method, introduce-local-extension

uml-constructing-process-view-diagrams [out:6 in:1]
  -> uml-process-view, uml-modeling-system-integration, uml-modeling-business-systems, uml-system-integration-message, uml-business-object, uml-activity-diagram
  <- uml-process-view

middle-man-smell [out:3 in:4]
  -> coupler-smells, code-smells, remove-middle-man
  <- coupler-smells, moving-features-techniques, remove-middle-man, replace-delegation-with-inheritance

hide-delegate [out:4 in:3]
  -> moving-features-techniques, refactoring-techniques, message-chains-smell, remove-middle-man
  <- message-chains-smell, moving-features-techniques, remove-middle-man

uml-business-process [out:4 in:3]
  -> uml, uml-business-system, uml-activity-diagram, uml-worker
  <- uml-actor, uml-business-system, uml-worker

introduce-local-extension [out:4 in:3]
  -> moving-features-techniques, refactoring-techniques, introduce-foreign-method, incomplete-library-class-smell
  <- incomplete-library-class-smell, introduce-foreign-method, moving-features-techniques

uml-constructing-statechart-diagrams [out:5 in:2]
  -> uml-statechart-diagram, uml-behavioral-view, uml-query-and-mutation-events, uml-dynamic-business-rule, uml-object-lifecycle
  <- uml-behavioral-view, uml-statechart-diagram

move-field [out:4 in:3]
  -> moving-features-techniques, refactoring-techniques, feature-envy-smell, move-method
  <- feature-envy-smell, move-method, moving-features-techniques

pull-up-method [out:4 in:3]
  -> dealing-with-generalization-techniques, refactoring-techniques, duplicate-code-smell, push-down-method
  <- dealing-with-generalization-techniques, duplicate-code-smell, push-down-method

remove-middle-man [out:4 in:3]
  -> moving-features-techniques, refactoring-techniques, middle-man-smell, hide-delegate
  <- hide-delegate, middle-man-smell, moving-features-techniques

encapsulate-field [out:3 in:4]
  -> organizing-data-techniques, refactoring-techniques, self-encapsulate-field
  <- data-class-smell, organizing-data-techniques, private-class-data-pattern, self-encapsulate-field

uml-constructing-class-diagrams [out:5 in:2]
  -> uml-class-diagram, uml-internal-view, uml-package-diagram, uml-modeling-it-systems, uml-generalization-specialization
  <- uml-class-diagram, uml-structural-view

inline-class [out:4 in:3]
  -> moving-features-techniques, refactoring-techniques, lazy-class-smell, extract-class
  <- extract-class, lazy-class-smell, moving-features-techniques

interface-segregation-principle [out:4 in:3]
  -> solid-principles, extract-interface, trait-composed-domain-model, solid-violation-causal-hierarchy
  <- extract-interface, solid-principles, solid-violation-causal-hierarchy

replace-inheritance-with-delegation [out:4 in:3]
  -> dealing-with-generalization-techniques, refactoring-techniques, refused-bequest-smell, replace-delegation-with-inheritance
  <- dealing-with-generalization-techniques, refused-bequest-smell, replace-delegation-with-inheritance

uml-constructing-use-case-diagrams [out:5 in:2]
  -> uml-use-case-diagram, uml-modeling-business-systems, uml-modeling-it-systems, uml-activity-diagram, uml-sequence-diagram
  <- uml-constructing-activity-diagrams, uml-use-case-diagram

push-down-field [out:4 in:3]
  -> dealing-with-generalization-techniques, refactoring-techniques, pull-up-field, refused-bequest-smell
  <- dealing-with-generalization-techniques, pull-up-field, refused-bequest-smell

uml-enterprise-application-integration [out:4 in:3]
  -> uml-system-integration-interface, uml, uml-modeling-system-integration, uml-electronic-data-interchange
  <- uml-electronic-data-interchange, uml-modeling-system-integration, uml-system-integration-interface

preserve-whole-object [out:4 in:3]
  -> simplifying-method-calls-techniques, refactoring-techniques, long-parameter-list-smell, introduce-parameter-object
  <- introduce-parameter-object, long-parameter-list-smell, simplifying-method-calls-techniques

separation-of-concerns [out:5 in:1]
  -> single-responsibility-principle, facade-pattern, bridge-pattern, divergent-change-smell, shotgun-surgery-smell
  <- single-responsibility-principle

replace-type-code-with-class [out:4 in:2]
  -> organizing-data-techniques, refactoring-techniques, primitive-obsession-smell, replace-type-code-with-subclasses
  <- organizing-data-techniques, primitive-obsession-smell

uml-model [out:3 in:3]
  -> uml-view, uml, uml-case-tool
  <- uml-case-tool, uml-view, uml

uml-requirement-specification [out:5 in:1]
  -> uml-modeling-business-systems\, uml-external-view\, uml-internal-view\, uml-modeling-it-systems\, uml-modeling-system-integration\
  <- uml

object-pool-pattern [out:5 in:1]
  -> creational-patterns, design-patterns, singleton-pattern, factory-method-pattern, prototype-pattern
  <- creational-patterns

extract-subclass [out:4 in:2]
  -> dealing-with-generalization-techniques, refactoring-techniques, extract-superclass, replace-type-code-with-subclasses
  <- dealing-with-generalization-techniques, extract-superclass

parameterize-method [out:4 in:2]
  -> simplifying-method-calls-techniques, refactoring-techniques, duplicate-code-smell, replace-parameter-with-explicit-methods
  <- replace-parameter-with-explicit-methods, simplifying-method-calls-techniques

replace-delegation-with-inheritance [out:4 in:2]
  -> dealing-with-generalization-techniques, refactoring-techniques, middle-man-smell, replace-inheritance-with-delegation
  <- dealing-with-generalization-techniques, replace-inheritance-with-delegation

inappropriate-intimacy-smell [out:4 in:2]
  -> coupler-smells, code-smells, law-of-demeter, tell-dont-ask
  <- coupler-smells, law-of-demeter

uml-case-tool [out:4 in:2]
  -> uml-model, uml-view, uml-class-diagram, uml-statechart-diagram
  <- uml-model, uml

uml-system-integration-interface [out:3 in:3]
  -> uml-modeling-system-integration, uml-system-integration-message, uml-enterprise-application-integration
  <- uml-enterprise-application-integration, uml-modeling-system-integration, uml-system-integration-message

refactoring-checklist [out:4 in:2]
  -> refactoring, refactoring-must-improve-code, refactoring-must-not-add-features, refactoring-must-pass-tests
  <- refactoring-techniques, refactoring

rule-of-three [out:3 in:3]
  -> refactoring, duplicate-code-smell, clean-code
  <- code-smells, duplicate-code-smell, refactoring

change-value-to-reference [out:3 in:2]
  -> organizing-data-techniques, refactoring-techniques, change-reference-to-value
  <- change-reference-to-value, organizing-data-techniques

parallel-inheritance-hierarchies-smell [out:3 in:2]
  -> change-preventer-smells, code-smells, shotgun-surgery-smell
  <- change-preventer-smells, dealing-with-generalization-techniques

replace-magic-number-with-symbolic-constant [out:3 in:2]
  -> organizing-data-techniques, refactoring-techniques, primitive-obsession-smell
  <- organizing-data-techniques, primitive-obsession-smell

self-encapsulate-field [out:3 in:2]
  -> organizing-data-techniques, refactoring-techniques, encapsulate-field
  <- encapsulate-field, organizing-data-techniques

replace-parameter-with-explicit-methods [out:3 in:2]
  -> simplifying-method-calls-techniques, refactoring-techniques, parameterize-method
  <- parameterize-method, simplifying-method-calls-techniques

speculative-generality-smell [out:3 in:2]
  -> dispensable-smells, code-smells, lazy-class-smell
  <- dispensable-smells, lazy-class-smell

alternative-classes-with-different-interfaces-smell [out:4 in:1]
  -> object-orientation-abuser-smells, code-smells, extract-interface, rename-method
  <- object-orientation-abuser-smells

technical-debt-cause-delayed-refactoring [out:2 in:3]
  -> refactoring, technical-debt
  <- refactoring-when-fixing-bugs, refactoring, technical-debt

change-unidirectional-to-bidirectional-association [out:3 in:2]
  -> organizing-data-techniques, refactoring-techniques, change-bidirectional-to-unidirectional-association
  <- change-bidirectional-to-unidirectional-association, organizing-data-techniques

private-class-data-pattern [out:4 in:1]
  -> structural-patterns, design-patterns, encapsulate-field, builder-pattern
  <- structural-patterns

uml-constructing-package-diagrams [out:4 in:1]
  -> uml-package-diagram, uml-internal-view, uml-worker, uml-business-object
  <- uml-package-diagram

replace-constructor-with-factory-method [out:3 in:2]
  -> simplifying-method-calls-techniques, refactoring-techniques, factory-method-pattern
  <- factory-method-pattern, simplifying-method-calls-techniques

inline-temp [out:3 in:2]
  -> composing-methods-techniques, refactoring-techniques, extract-variable
  <- composing-methods-techniques, extract-variable

replace-subclass-with-fields [out:3 in:2]
  -> organizing-data-techniques, refactoring-techniques, collapse-hierarchy
  <- collapse-hierarchy, organizing-data-techniques

replace-method-with-method-object [out:4 in:1]
  -> composing-methods-techniques, refactoring-techniques, extract-method, long-method-smell
  <- composing-methods-techniques

replace-exception-with-test [out:3 in:2]
  -> simplifying-method-calls-techniques, refactoring-techniques, replace-error-code-with-exception
  <- replace-error-code-with-exception, simplifying-method-calls-techniques

rename-method [out:3 in:2]
  -> simplifying-method-calls-techniques, refactoring-techniques, comments-smell
  <- alternative-classes-with-different-interfaces-smell, simplifying-method-calls-techniques

change-bidirectional-to-unidirectional-association [out:3 in:2]
  -> organizing-data-techniques, refactoring-techniques, change-unidirectional-to-bidirectional-association
  <- change-unidirectional-to-bidirectional-association, organizing-data-techniques

change-reference-to-value [out:3 in:2]
  -> organizing-data-techniques, refactoring-techniques, change-value-to-reference
  <- change-value-to-reference, organizing-data-techniques

pull-up-field [out:3 in:2]
  -> dealing-with-generalization-techniques, refactoring-techniques, push-down-field
  <- dealing-with-generalization-techniques, push-down-field

replace-error-code-with-exception [out:3 in:2]
  -> simplifying-method-calls-techniques, refactoring-techniques, replace-exception-with-test
  <- replace-exception-with-test, simplifying-method-calls-techniques

comments-smell [out:3 in:2]
  -> dispensable-smells, code-smells, clean-code
  <- dispensable-smells, rename-method

refactoring-in-small-changes [out:2 in:3]
  -> refactoring, route-to-service-migration-strategy
  <- refactoring-must-improve-code, refactoring-techniques, refactoring

replace-data-value-with-object [out:3 in:2]
  -> organizing-data-techniques, refactoring-techniques, primitive-obsession-smell
  <- organizing-data-techniques, primitive-obsession-smell

uml-constructing-activity-diagrams [out:4 in:1]
  -> uml-activity-diagram, uml-external-view, uml-internal-view, uml-constructing-use-case-diagrams
  <- uml-activity-diagram

remove-parameter [out:3 in:1]
  -> simplifying-method-calls-techniques, refactoring-techniques, dead-code-smell
  <- simplifying-method-calls-techniques

uml-generalization-specialization [out:2 in:2]
  -> uml, uml-class-diagram
  <- uml-class-diagram, uml-constructing-class-diagrams

decompose-conditional [out:3 in:1]
  -> simplifying-conditionals-techniques, refactoring-techniques, extract-method
  <- simplifying-conditionals-techniques

dead-code-smell [out:2 in:2]
  -> dispensable-smells, code-smells
  <- dispensable-smells, remove-parameter

add-parameter [out:3 in:1]
  -> simplifying-method-calls-techniques, refactoring-techniques, long-parameter-list-smell
  <- simplifying-method-calls-techniques

consolidate-duplicate-conditional-fragments [out:3 in:1]
  -> simplifying-conditionals-techniques, refactoring-techniques, duplicate-code-smell
  <- simplifying-conditionals-techniques

technical-debt-cause-tight-coupling [out:3 in:1]
  -> technical-debt, single-responsibility-principle, dependency-inversion-principle
  <- technical-debt

introduce-null-object [out:2 in:2]
  -> simplifying-conditionals-techniques, refactoring-techniques
  <- null-object-pattern, simplifying-conditionals-techniques

consolidate-conditional-expression [out:3 in:1]
  -> simplifying-conditionals-techniques, refactoring-techniques, extract-method
  <- simplifying-conditionals-techniques

replace-parameter-with-method-call [out:2 in:1]
  -> simplifying-method-calls-techniques, refactoring-techniques
  <- simplifying-method-calls-techniques

duplicate-observed-data [out:2 in:1]
  -> organizing-data-techniques, refactoring-techniques
  <- organizing-data-techniques

remove-control-flag [out:2 in:1]
  -> simplifying-conditionals-techniques, refactoring-techniques
  <- simplifying-conditionals-techniques

hide-method [out:2 in:1]
  -> simplifying-method-calls-techniques, refactoring-techniques
  <- simplifying-method-calls-techniques

separate-query-from-modifier [out:2 in:1]
  -> simplifying-method-calls-techniques, refactoring-techniques
  <- simplifying-method-calls-techniques

single-source-of-truth [out:3 in:0]
  -> vault-sourced-data-repository, hardcoded-game-rule-proliferation, duplicate-code-smell

introduce-assertion [out:2 in:1]
  -> simplifying-conditionals-techniques, refactoring-techniques
  <- simplifying-conditionals-techniques

pull-up-constructor-body [out:2 in:1]
  -> dealing-with-generalization-techniques, refactoring-techniques
  <- dealing-with-generalization-techniques

substitute-algorithm [out:2 in:1]
  -> composing-methods-techniques, refactoring-techniques
  <- composing-methods-techniques

refactoring-when-adding-features [out:2 in:1]
  -> refactoring, clean-code
  <- refactoring

refactoring-during-code-review [out:2 in:1]
  -> refactoring, clean-code
  <- refactoring

remove-setting-method [out:2 in:1]
  -> simplifying-method-calls-techniques, refactoring-techniques
  <- simplifying-method-calls-techniques

replace-temp-with-query [out:2 in:1]
  -> composing-methods-techniques, refactoring-techniques
  <- composing-methods-techniques

uml-information-system-vs-it-system [out:3 in:0]
  -> uml, uml-modeling-business-systems, uml-modeling-it-systems

technical-debt-cause-ignorance [out:2 in:1]
  -> technical-debt, refactoring
  <- technical-debt

inline-method [out:2 in:1]
  -> composing-methods-techniques, refactoring-techniques
  <- composing-methods-techniques

refactoring-when-fixing-bugs [out:2 in:1]
  -> refactoring, technical-debt-cause-delayed-refactoring
  <- refactoring

refactoring-must-improve-code [out:2 in:1]
  -> refactoring, refactoring-in-small-changes
  <- refactoring-checklist

replace-array-with-object [out:2 in:1]
  -> organizing-data-techniques, refactoring-techniques
  <- organizing-data-techniques

replace-nested-conditional-with-guard-clauses [out:2 in:1]
  -> simplifying-conditionals-techniques, refactoring-techniques
  <- simplifying-conditionals-techniques

temporary-field-smell [out:2 in:1]
  -> object-orientation-abuser-smells, code-smells
  <- object-orientation-abuser-smells

remove-assignments-to-parameters [out:2 in:1]
  -> composing-methods-techniques, refactoring-techniques
  <- composing-methods-techniques

technical-debt-cause-no-coding-standards [out:2 in:1]
  -> technical-debt, clean-code
  <- technical-debt

refactoring-must-pass-tests [out:2 in:1]
  -> refactoring, clean-code
  <- refactoring-checklist

specific-text-over-general-category [out:3 in:0]
  -> condition-independent-behavior-flags, decouple-behaviors-from-categories, status-condition-categories

split-temporary-variable [out:2 in:1]
  -> composing-methods-techniques, refactoring-techniques
  <- composing-methods-techniques

form-template-method [out:2 in:1]
  -> dealing-with-generalization-techniques, refactoring-techniques
  <- dealing-with-generalization-techniques

technical-debt-cause-missing-tests [out:2 in:1]
  -> technical-debt, clean-code
  <- technical-debt

encapsulate-collection [out:2 in:1]
  -> organizing-data-techniques, refactoring-techniques
  <- organizing-data-techniques

technical-debt-cause-missing-documentation [out:1 in:1]
  -> technical-debt
  <- technical-debt

technical-debt-cause-poor-knowledge-sharing [out:1 in:1]
  -> technical-debt
  <- technical-debt

technical-debt-cause-incompetence [out:1 in:1]
  -> technical-debt
  <- technical-debt

uml-history [out:1 in:1]
  -> uml-2-0
  <- uml

emergent-design-through-practice [out:2 in:0]
  -> per-conflict-decree-required, raw-fidelity-as-default

refactoring-must-not-add-features [out:1 in:1]
  -> refactoring
  <- refactoring-checklist

technical-debt-cause-branch-divergence [out:1 in:1]
  -> technical-debt
  <- technical-debt

mock-patterns [out:2 in:0]
  -> test-directory-structure, vitest-configuration
