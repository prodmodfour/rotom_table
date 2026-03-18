# View Component Duplication

The [[triple-view-system]] creates three parallel component trees — GM, Group, and Player — that implement overlapping UI capabilities with different information levels. The same conceptual widget (a combatant card, a combat log, a grid view, a move list) exists in three forms with different levels of detail.

## Symptoms

- **Three combatant card variants.** [[combatant-card-visibility-rules]] documents GM (full control + inline editing), Group (read-only, HP/sprite/name/conditions), and Player (own combatants show exact HP, enemies show percentage). These are separate component implementations, not one component with filtered data.
- **Three encounter view trees.** The GM encounter page, Group encounter tab, and Player encounter tab each compose their own component tree for what is fundamentally the same scene — a grid of combatants with actions.
- **Parallel component directories.** `components/encounter/` (40 components), `components/player/` (17 components), and `components/group/` (within `components/group/`) each implement view-specific variants of shared concepts.
- **Divergent evolution.** When a feature is added to the GM view (e.g., a new status badge on combatant cards), it must be manually propagated to Group and Player variants. Omissions become silent feature gaps.

## Structural cause

The [[triple-view-system]] was designed as three independent page trees (`/gm`, `/group`, `/player`) with separate component hierarchies. There is no shared "combatant card" component that adapts to the viewer — instead, there are three separate implementations that happen to show similar data. The views are organized by *who is looking* rather than by *what is being shown*.

This violates [[single-responsibility-principle]] — each component's responsibility is split between "render combat data" and "enforce view-level permissions." It also violates [[interface-segregation-principle]] at the component level — consumers cannot compose view-agnostic building blocks because every building block is view-specific.

## See also

- [[triple-view-system]] — the architectural source of the duplication
- [[combatant-card-visibility-rules]] — the most visible symptom
- [[player-view-architecture]] — the Player view's parallel component tree
- [[horizontal-layer-coupling]] — related structural issue at the directory level
- [[view-capability-projection]] — a destructive proposal to address this
- [[headless-domain-components]] — a destructive proposal to share headless logic across views, eliminating duplication at its source
- [[view-logic-component-entanglement]] — the logic-presentation entanglement that forces views to duplicate components
