# 2026-03-26 — SE Vault Cleanup: Remove Stale Old-App Links

The SE reference notes (`vaults/documentation/software-engineering/`) contained ~70 links to old PTU-based app observations — combatant interface bloat, trigger validation switch chains, route business logic, store coupling, etc. These described the old app's problems, not general SE knowledge. With the destructive redesign, they add confusion rather than value.

**Principle:** SE notes should contain pure knowledge — pattern definitions, principle explanations, smell descriptions, technique instructions. Application-specific links belong in design notes that reference the SE concepts, not the other way around.

**What was removed:** Links to old app observations including: combatant-interface-bloat, combatant-service-mixed-domains, combatant-type-hierarchy, encounter-store-god-object-risk, next-turn-route-business-logic, out-of-turn-service-bundled-actions, trigger-validation-switch-chains, status-condition-ripple-effect, entity-union-unsafe-downcasts, entity-shared-field-incompatibility, entity-data-model-rigidity, grid-isometric-interaction-duplication, switching-validation-duplication, websocket-sync-as-observer-pattern, websocket-real-time-sync, event-sourced-encounter-state, routes-bypass-service-layer, composable-store-direct-coupling, singleton-state-coupling, ioc-container-architecture, player-action-request-optionals, pinia-store-classification, test-coverage-gaps, and ~20 more.

**What was preserved:** All SE concept cross-references (pattern↔pattern, principle↔smell, technique↔principle). Links to still-valid design notes: `trait-composed-domain-model`, `encounter-lifecycle-state-machine`.

**Special case:** `solid-violation-causal-hierarchy.md` was rewritten. The general insight (SRP+DIP are root causes → ISP/OCP/LSP are downstream symptoms) is preserved as a universal principle. Old app-specific examples removed.

## Files modified (33)

| Category | Files |
|---|---|
| SOLID principles (6) | single-responsibility-principle, open-closed-principle, liskov-substitution-principle, interface-segregation-principle, dependency-inversion-principle, solid-violation-causal-hierarchy |
| Design patterns (11) | command-pattern, strategy-pattern, chain-of-responsibility-pattern, template-method-pattern, observer-pattern, bridge-pattern, mediator-pattern, adapter-pattern, facade-pattern, singleton-pattern, memento-pattern |
| Other principles (5) | tell-dont-ask, law-of-demeter, separation-of-concerns, composition-over-inheritance, clean-code |
| Smells (8) | shotgun-surgery-smell, long-method-smell, primitive-obsession-smell, data-class-smell, data-clumps-smell, large-class-smell, divergent-change-smell, duplicate-code-smell, refused-bequest-smell, switch-statements-smell, alternative-classes-with-different-interfaces-smell, parallel-inheritance-hierarchies-smell, feature-envy-smell |
| Techniques (2) | extract-class, extract-interface, extract-method, replace-conditional-with-polymorphism |
| Technical debt (3) | technical-debt, technical-debt-cause-missing-tests, technical-debt-cause-tight-coupling, refactoring-must-pass-tests |

**Status:** SE vault cleaned. ~70 stale old-app links removed across 33 files. SE notes now contain pure knowledge with general cross-references only. Ready for effect engine design.

