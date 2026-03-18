# Headless Domain Components

A destructive restructuring to rip the domain logic out of every Vue component in the app — separating each component into a headless logic layer (renderless composable) and a pure presentation layer (template-only component) — addressing [[view-logic-component-entanglement|the entanglement of domain logic with presentation]] and eliminating the [[view-component-duplication|three-way view duplication]] at its source.

## The idea

Every encounter component currently conflates three concerns: domain computation (what the game rules say), user interaction (what happens when buttons are clicked), and visual presentation (how things look). A `CombatantCard.vue` computes HP percentage, checks if it's the combatant's turn, determines available moves, provides damage click handlers, manages tooltip state, and renders a card with health bars and status icons — all in one file.

This conflation forces the GM, Group, and Player views to duplicate components — not because the presentation differs (it often does) but because the domain logic is trapped inside the template.

Extract all domain logic and interaction orchestration into headless composables. Leave components as pure renderers that receive pre-computed props. The headless layer is shared across all three views. Each view provides its own templates that consume the headless layer's output.

```typescript
// === HEADLESS LAYER — all domain logic, no templates ===

// headless/useHeadlessCombatant.ts
export function useHeadlessCombatant(
  combatantId: string,
  container: AppContainer
) {
  const { encounterState, damageCalculator, apiClient } = container

  // --- Domain computations ---
  const combatant = computed(() => encounterState.getCombatant(combatantId))
  const hpPercentage = computed(() => combatant.value.hp / combatant.value.maxHp * 100)
  const isHeavilyInjured = computed(() => combatant.value.hp <= combatant.value.maxHp / 2)
  const isFainted = computed(() => combatant.value.hp <= 0)
  const isActiveTurn = computed(() => encounterState.isActiveTurn(combatantId))
  const availableMoves = computed(() => getAvailableMoves(combatant.value))
  const statusEffects = computed(() => combatant.value.statusConditions.map(formatStatus))

  // --- Interaction handlers ---
  async function dealDamage(amount: number, damageType: string) {
    await apiClient.post('/damage', { targetId: combatantId, amount, damageType })
  }

  async function applyHealing(amount: number) {
    await apiClient.post('/healing', { targetId: combatantId, amount })
  }

  async function addStatus(status: string) {
    await apiClient.post('/status', { targetId: combatantId, status })
  }

  // --- Everything returned, nothing rendered ---
  return {
    // Reactive data
    combatant: readonly(combatant),
    hpPercentage: readonly(hpPercentage),
    isHeavilyInjured: readonly(isHeavilyInjured),
    isFainted: readonly(isFainted),
    isActiveTurn: readonly(isActiveTurn),
    availableMoves: readonly(availableMoves),
    statusEffects: readonly(statusEffects),

    // Actions
    dealDamage,
    applyHealing,
    addStatus,
  }
}

// headless/useHeadlessTurnTracker.ts
export function useHeadlessTurnTracker(container: AppContainer) {
  const { encounterState, turnManager } = container

  const currentRound = computed(() => encounterState.currentRound)
  const currentTurn = computed(() => encounterState.currentTurnIndex)
  const turnOrder = computed(() => encounterState.turnOrder)
  const activeCombatantId = computed(() => turnOrder.value[currentTurn.value])
  const phase = computed(() => encounterState.phase)

  async function advanceTurn() { await turnManager.advance() }
  async function previousTurn() { await turnManager.previous() }

  return {
    currentRound, currentTurn, turnOrder, activeCombatantId, phase,
    advanceTurn, previousTurn,
  }
}

// headless/useHeadlessGrid.ts
export function useHeadlessGrid(container: AppContainer) {
  const { gridState, movementCalculator } = container

  const tokens = computed(() => gridState.tokens)
  const selectedToken = ref<string | null>(null)
  const movementRange = computed(() => {
    if (!selectedToken.value) return new Set<string>()
    return movementCalculator.getRange(selectedToken.value)
  })

  function selectToken(id: string) { selectedToken.value = id }
  function clearSelection() { selectedToken.value = null }
  async function moveToken(tokenId: string, path: GridPosition[]) {
    await container.apiClient.post('/movement', { tokenId, path })
  }

  return {
    tokens, selectedToken, movementRange,
    selectToken, clearSelection, moveToken,
  }
}

// === PRESENTATION LAYER — pure templates, no logic ===

// GM view: full control, all actions visible
// views/gm/GmCombatantCard.vue
// <template>
//   <div class="combatant-card" :class="{ active: logic.isActiveTurn.value, fainted: logic.isFainted.value }">
//     <h3>{{ logic.combatant.value.name }}</h3>
//     <HealthBar :percentage="logic.hpPercentage.value" :injured="logic.isHeavilyInjured.value" />
//     <StatusIcons :statuses="logic.statusEffects.value" />
//     <!-- GM sees damage/healing controls -->
//     <DamageInput @submit="logic.dealDamage" />
//     <HealingInput @submit="logic.applyHealing" />
//     <StatusSelector @select="logic.addStatus" />
//   </div>
// </template>
// <script setup>
// const props = defineProps<{ combatantId: string }>()
// const container = inject('container')
// const logic = useHeadlessCombatant(props.combatantId, container)
// </script>

// Player view: limited info, no GM controls
// views/player/PlayerCombatantCard.vue
// <template>
//   <div class="combatant-card" :class="{ active: logic.isActiveTurn.value }">
//     <h3>{{ logic.combatant.value.name }}</h3>
//     <HealthBar :percentage="logic.hpPercentage.value" />
//     <StatusIcons :statuses="logic.statusEffects.value" />
//     <!-- Player sees NO damage/healing controls -->
//   </div>
// </template>
// <script setup>
// const props = defineProps<{ combatantId: string }>()
// const container = inject('container')
// const logic = useHeadlessCombatant(props.combatantId, container)
// </script>

// Group view: public info, spectator mode
// views/group/GroupCombatantCard.vue
// <template>
//   <div class="combatant-card combatant-card--compact">
//     <span>{{ logic.combatant.value.name }}</span>
//     <MiniHealthBar :percentage="logic.hpPercentage.value" />
//   </div>
// </template>
// <script setup>
// const props = defineProps<{ combatantId: string }>()
// const container = inject('container')
// const logic = useHeadlessCombatant(props.combatantId, container)
// </script>
```

## Why this is destructive

- **Every Vue component in `components/encounter/` is split in two.** The domain logic moves to a headless composable. The template stays as a thin renderer. Components that are currently 200–400 lines become 30–50 line templates consuming headless composables.
- **The `components/` directory structure is reorganized.** Instead of `components/encounter/CombatantCard.vue` containing everything, there's `headless/useHeadlessCombatant.ts` (shared logic) and `views/gm/GmCombatantCard.vue`, `views/group/GroupCombatantCard.vue`, `views/player/PlayerCombatantCard.vue` (view-specific templates).
- **View duplication is eliminated at the source.** Currently, GM, Group, and Player views duplicate components because logic is entangled with presentation. After this change, all three views share the same headless layer. Only the templates differ — and templates are small, focused, and cheap to maintain.
- **Component testing fundamentally changes.** Currently, testing a component requires mounting it with a full Vue test utils setup, providing stores, mocking APIs. After this change, headless composables are testable as plain functions (create inputs, call function, assert outputs). Templates can be snapshot-tested separately.
- **The 63 composables are partially absorbed.** Many existing composables (useCombatActions, useMoveCalculation, useGridMovement) are already doing headless work but are entangled with store singletons. They become headless composables with injected dependencies.
- **`useCombatantDisplay.ts` is formalized.** The existing `useCombatantDisplay` composable is already a proto-headless pattern. This proposal formalizes and extends it to ALL domain components, not just combatant display.

## How this differs from [[view-capability-projection]]

[[view-capability-projection]] solves view duplication by having a single component tree that adapts to an injected `ViewCapabilities` context. Components conditionally render based on capabilities.

Headless domain components solve it differently: the logic layer is shared, but the template layer is separate per view. Each view has its own components that import the same headless composables. The GM template shows damage controls; the Player template doesn't include them. There is no conditional rendering — the template simply doesn't have the elements.

View Capability Projection is more compact (one component tree). Headless is more flexible (each view can have completely different layouts, not just conditionally hidden elements).

## Principles improved

- [[single-responsibility-principle]] — headless composables have one job (domain logic). Templates have one job (presentation). Currently, components do both.
- [[open-closed-principle]] — adding a new view (e.g., "spectator mode", "tournament view") means writing new templates that consume existing headless composables. No headless logic changes.
- [[dependency-inversion-principle]] — templates depend on the headless composable's return type (an interface), not on stores or APIs directly.
- [[interface-segregation-principle]] — each template uses only the subset of the headless return value it needs. The GM template uses `dealDamage`; the Player template ignores it.
- Eliminates [[view-component-duplication]] — duplication exists only in small, focused templates, not in large components with embedded logic.
- Eliminates [[view-logic-component-entanglement]] — logic and presentation are structurally separated.
- Reduces [[composable-architectural-overreach]] — composables are formalized as headless logic layers with a clear contract.

## Patterns and techniques

- Headless Component / Renderless Component — the core pattern: logic without UI
- [[adapter-pattern]] — each view's template is an adapter that maps headless output to visual elements
- [[strategy-pattern]] — different templates are strategies for presenting the same data
- [[facade-pattern]] — headless composables present a clean facade over complex domain state
- [[template-method-pattern]] — the headless composable defines the data shape; templates fill in the rendering
- Separation of Concerns — domain logic, interaction, and presentation are cleanly separated

## Trade-offs

- **File count increase.** Every component splits into at least two files (headless + template). Multiply by three views, and a single domain concept may have 4 files: `useHeadlessCombatant.ts` + `GmCombatantCard.vue` + `GroupCombatantCard.vue` + `PlayerCombatantCard.vue`.
- **Indirection for simple components.** A simple "round counter" component that just displays `round {{ n }}` doesn't benefit from a headless layer. Not every component needs separation. The judgment of where the boundary lies is a design decision.
- **Headless composable API design is critical.** The return type of a headless composable is an implicit contract. Changing it breaks all three view templates. The API must be stable and well-designed from the start.
- **Loss of co-location.** Currently, reading one `.vue` file tells you everything about a component: what it computes, how it behaves, how it looks. After separation, you must read two files. The logic and its rendering are physically separated.
- **Vue SFC ergonomics.** Vue's Single File Component format is designed to co-locate template + script + style. The headless pattern partially breaks this by moving script logic out. Style stays with the template, but logic does not.
- **Potential over-extraction.** If every component becomes headless, the `headless/` directory grows large. Some components are genuinely presentation-only (layout containers, icon wrappers) and should not be headless.

## Open questions

- Should headless composables return individual refs or a single reactive object? Individual refs are more ergonomic in templates (`{{ hp }}` vs `{{ state.hp }}`); a single object is easier to pass around.
- How does this interact with [[view-capability-projection]]? Could headless composables accept a `capabilities` parameter that filters what data and actions they expose — combining both approaches?
- How does this interact with [[command-bus-ui-architecture]]? Headless composables could dispatch commands instead of calling APIs directly, combining headless separation with command bus dispatch.
- Should templates use `<slot>` for customization, or should each view have completely separate templates?
- How granular should headless composables be? One per domain entity (`useHeadlessCombatant`)? One per interaction zone (`useHeadlessDamagePanel`, `useHeadlessStatusPanel`)?
- Should headless composables handle local UI state (modals, tooltips, selection) or only domain state?

## See also

- [[view-logic-component-entanglement]] — the problem this addresses
- [[view-component-duplication]] — eliminated by sharing headless logic
- [[view-capability-projection]] — the alternative approach (conditional rendering vs. separate templates)
- [[composable-architectural-overreach]] — composables become formalized headless layers
- [[command-bus-ui-architecture]] — compatible: headless composables dispatch commands
- [[ioc-container-architecture]] — compatible: headless composables receive injected dependencies
- [[single-responsibility-principle]] — the separation of logic from presentation
