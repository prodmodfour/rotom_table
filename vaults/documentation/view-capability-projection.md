# View Capability Projection

A destructive restructuring to replace the three parallel component trees (GM, Group, Player) with a single capability-projected component tree — addressing [[view-component-duplication|component duplication across views]] and the architectural fragility of the [[triple-view-system]].

## The idea

The app currently has three separate component hierarchies for three audiences viewing the same game state. A combatant card exists in three forms. An encounter grid exists in three forms. A combat log exists in three forms. When a feature is added to one view, it must be manually replicated to the others. The views diverge silently.

Delete all view-specific component directories. Build one component tree where every component renders based on a **capability context** — a reactive object that describes what the current viewer can see and do. The server computes capabilities; the client enforces them at render time.

```typescript
// Capability context — injected at the page root, consumed by every component
interface ViewCapabilities {
  role: 'gm' | 'player' | 'spectator'
  playerId?: string

  // Data visibility
  canSeeExactHp: (combatantId: string) => boolean
  canSeeEntity: (combatantId: string) => boolean
  canSeeDeclarations: boolean
  canSeeFogOfWar: boolean
  canSeeAllPositions: boolean

  // Interaction permissions
  canEditInline: boolean
  canDealDamage: boolean
  canAdvanceTurn: boolean
  canModifyGrid: boolean
  canSwitchPokemon: (combatantId: string) => boolean
  canUseMove: (combatantId: string) => boolean

  // UI surface
  showGmControls: boolean
  showCombatActions: boolean
  showDetailedStats: boolean
}

// One CombatantCard — adapts to capabilities
// <CombatantCard :combatant="combatant" />
function CombatantCard({ combatant }) {
  const caps = inject<ViewCapabilities>('capabilities')

  const displayHp = computed(() =>
    caps.canSeeExactHp(combatant.id)
      ? `${combatant.hp}/${combatant.maxHp}`
      : `${Math.round((combatant.hp / combatant.maxHp) * 100)}%`
  )

  // GM sees inline edit controls; players see read-only; group sees minimal
  const showEditControls = computed(() => caps.canEditInline)
  const showDetailPanel = computed(() => caps.showDetailedStats)
  const showActions = computed(() => caps.canUseMove(combatant.id))
}

// One EncounterView — same component renders /gm, /group, /player
// The page root provides the capability context
// /gm provides full GM capabilities
// /group provides spectator capabilities
// /player provides player-scoped capabilities
```

The Group view's 4-tab layout (lobby, scene, encounter, map) and the Player view's tab layout are both instances of a **layout component** that composes the same underlying building blocks with different capability contexts and arrangement.

```
Before:                          After:
components/encounter/            components/encounter/
  CombatantCard.vue                CombatantCard.vue        ← one card, capability-driven
  CombatantDetailsPanel.vue        CombatantDetailsPanel.vue
  DamageDialog.vue                 DamageDialog.vue
  ...                              ...
components/player/               components/layout/
  PlayerCombatantCard.vue          GmLayout.vue             ← arranges building blocks for GM
  PlayerEncounterView.vue          GroupLayout.vue           ← arranges building blocks for group
  PlayerCombatActions.vue          PlayerLayout.vue          ← arranges building blocks for player
  ...                            (no view-specific logic components)
components/group/
  GroupEncounterTab.vue
  GroupCombatantCard.vue
  ...
```

## Why this is destructive

- **All Player view components (17) are deleted.** Their rendering logic merges into the canonical component. Their capability restrictions become `ViewCapabilities` checks.
- **All Group view encounter/combat components are deleted.** The Group encounter tab becomes a layout composing canonical components with spectator capabilities.
- **`CombatantDetailsPanel.vue` (780 lines) is rewritten.** Three entity-type branches become one capability-driven renderer.
- **Every GM encounter component gains capability awareness.** Components that assumed full access must now check capabilities. No component directly checks "am I on the GM page?" — it asks "do I have this capability?"
- **The Player page's composable layer (8 composables) is largely deleted.** Player-specific data fetching and filtering moves to server-side capability projection.
- **The combatant card visibility rules become data.** The hand-documented three-tier visibility table becomes a computable function: `capabilities.canSeeExactHp(id)`.
- **WebSocket sync diverges by role.** Currently all clients receive the same broadcast. With capability projection, the server filters outbound data per-client using the same capability definitions — feeding directly into [[server-authoritative-reactive-streams]] if adopted.

## Principles improved

- [[single-responsibility-principle]] — each component's sole job is rendering its domain concept. Permission logic is externalized to the capability context.
- [[interface-segregation-principle]] — components depend on only the capabilities they use, not on which view they're in. A `CombatantCard` doesn't know about GM/Player/Group — it knows about `canSeeExactHp` and `canEditInline`.
- [[open-closed-principle]] — adding a new view (e.g., a "spectator" view for stream overlays) means defining a new `ViewCapabilities` object, not building a new component tree. Adding a new capability means adding one field, not duplicating one component.
- [[liskov-substitution-principle]] — any `ViewCapabilities` object can be injected into any component. The GM capability context is substitutable with the Player context — the component tree works identically, just with different permissions.
- [[dependency-inversion-principle]] — components depend on the `ViewCapabilities` abstraction, not on concrete page contexts.
- Eliminates [[view-component-duplication]] — there is one component per concept, not three.
- Reduces [[horizontal-layer-coupling]] — the `components/player/` and `components/group/` directories collapse into `components/layout/`.

## Patterns and techniques

- [[strategy-pattern]] — `ViewCapabilities` is a strategy that determines component behavior at injection time
- [[proxy-pattern]] — capability-filtered data acts as a proxy for the full game state
- [[template-method-pattern]] — layout components define the arrangement skeleton; capability-driven components fill the slots
- [[decorator-pattern]] — capability checks decorate components with permission behavior without altering their core rendering
- Role-Based Access Control (RBAC) — capabilities are derived from the viewer's role, applied at the component level
- Vue provide/inject — the transport mechanism for capability context

## Trade-offs

- **Capability context complexity.** Every component gains a dependency on an injected context. The `ViewCapabilities` interface must be designed carefully — too granular and it becomes a checkbox hell; too coarse and components still branch on role.
- **Conditional rendering explosion.** Components will be peppered with `v-if="caps.canEditInline"` and `v-show="caps.showDetailedStats"`. The three clean, focused component trees become one complex tree with many conditional branches.
- **Layout divergence is real.** GM, Group, and Player aren't just different capabilities — they have fundamentally different page layouts, navigation, and interaction patterns. The GM has a sidebar + detail panel. The Group has fullscreen tabs. The Player has a mobile-friendly stack. Sharing components doesn't eliminate layout differences.
- **Performance of capability checks.** If `canSeeExactHp(id)` requires a function call for every combatant on every render, this could add overhead compared to static template trees that are compiled once per view.
- **Loss of view-specific optimization.** The Player view currently loads fewer components and less data. A unified tree that conditionally hides elements still loads them — unless capability-based lazy loading is implemented, which adds complexity.
- **Testing surface change.** Currently, testing the Player view means testing 17 components. After unification, testing "the Player experience" means testing the same components with a Player-scoped capability context — more combinatorial test surface.

## Open questions

- Should capabilities be computed client-side from a role token, or should the server send a concrete capability manifest on connection?
- How deep does capability injection go? Does every leaf component inject capabilities, or do parent components pre-filter data and pass only what's needed?
- How does this interact with [[server-authoritative-reactive-streams]]? If the server already filters data by role, do we still need client-side capability checks, or is the client guaranteed to only receive appropriate data?
- Should the GM be able to "view as player" by swapping their capability context? This would be trivial with injection but complex with current architecture.
- Do layout components (GmLayout, GroupLayout, PlayerLayout) become the only view-specific files, or do some capabilities require view-specific rendering that can't be expressed as conditionals?
- What about components that are genuinely GM-only (encounter creation wizard, character builder)? Do they gain capability awareness unnecessarily, or are some components explicitly excluded?

## See also

- [[view-component-duplication]] — the problem this addresses
- [[triple-view-system]] — the architecture this replaces
- [[combatant-card-visibility-rules]] — the visibility rules that become computable
- [[player-view-architecture]] — the Player tree that is dissolved
- [[server-authoritative-reactive-streams]] — compatible: server can project data using the same capability definitions
- [[encounter-store-surface-reduction]] — partially superseded: components no longer need the full store surface because capabilities filter what's relevant
- [[headless-domain-components]] — the alternative approach: separate templates per view sharing headless logic, rather than one conditional tree
