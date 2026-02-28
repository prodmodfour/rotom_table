<template>
  <div class="gm-encounter">
    <!-- No Active Encounter -->
    <NewEncounterForm
      v-if="!encounter"
      @create="createNewEncounter"
      @loadTemplate="showLoadTemplateModal = true"
    />

    <!-- Active Encounter -->
    <div v-else class="gm-encounter__active">
      <!-- Header -->
      <EncounterHeader
        :encounter="encounter"
        :undo-redo-state="undoRedoState"
        @serve="serveEncounter"
        @unserve="unserveEncounter"
        @undo="handleUndo"
        @redo="handleRedo"
        @start="startEncounter"
        @next-turn="nextTurn"
        @end="endEncounter"
        @save-template="showSaveTemplateModal = true"
        @show-help="showShortcutsHelp = true"
        @set-weather="handleSetWeather"
      />

      <!-- View Tabs & Settings Row -->
      <ViewTabsRow
        v-model:active-view="activeView"
        :damage-mode="settingsStore.damageMode"
        @update:damage-mode="settingsStore.setDamageMode($event)"
      />

      <!-- Breather Shift Banner -->
      <BreatherShiftBanner
        v-if="pendingBreatherShift"
        :combatant-name="pendingBreatherShift.combatantName"
        @focus-token="focusBreatherToken"
        @dismiss="pendingBreatherShift = null"
      />

      <!-- League Battle: Declaration Panel (GM form during trainer_declaration phase) -->
      <DeclarationPanel @declared="handleDeclarationBroadcast" />

      <!-- League Battle: Declaration Summary (visible during resolution and pokemon phases) -->
      <DeclarationSummary />

      <!-- Main Content -->
      <div class="encounter-content">
        <!-- Grid View -->
        <div v-if="activeView === 'grid'" class="grid-view-panel">
          <VTTContainer
            :config="gridConfig"
            :combatants="encounter.combatants"
            :current-turn-id="currentCombatant?.id"
            :is-gm="true"
            :encounter-id="encounter.id"
            @config-update="handleGridConfigUpdate"
            @token-move="handleTokenMoveWithBreatherClear"
            @background-upload="handleBackgroundUpload"
            @background-remove="handleBackgroundRemove"
            @movement-preview-change="handleMovementPreviewChange"
          />
        </div>

        <!-- Combatants Panel (List View) -->
        <CombatantSides
          v-if="activeView === 'list'"
          :player-combatants="playerCombatants"
          :ally-combatants="allyCombatants"
          :enemy-combatants="enemyCombatants"
          :current-combatant="currentCombatant"
          :is-active="encounter.isActive"
          :current-phase="encounter.battleType === 'trainer' ? encounterStore.currentPhase : undefined"
          @action="handleAction"
          @damage="handleDamage"
          @heal="handleHeal"
          @remove="removeCombatant"
          @stages="handleStages"
          @status="handleStatus"
          @openActions="handleOpenActions"
          @addCombatant="showAddCombatant"
        />

        <!-- Sidebar: Move Log + Significance Panel -->
        <div class="encounter-sidebar">
          <CombatLogPanel :move-log="moveLog" />
          <SignificancePanel
            :encounter="encounter"
            @open-xp-modal="showXpModal = true"
          />
        </div>
      </div>
    </div>

    <!-- Add Combatant Modal -->
    <AddCombatantModal
      v-if="showAddModal"
      :side="addingSide"
      @close="showAddModal = false"
      @add="addCombatant"
    />

    <!-- Save Template Modal -->
    <SaveTemplateModal
      v-if="showSaveTemplateModal && encounter"
      :encounter-id="encounter.id"
      :combatant-count="encounter.combatants.length"
      :has-grid="encounter.gridConfig?.enabled ?? true"
      @close="showSaveTemplateModal = false"
      @saved="handleTemplateSaved"
    />

    <!-- Load Template Modal -->
    <LoadTemplateModal
      v-if="showLoadTemplateModal"
      @close="showLoadTemplateModal = false"
      @load="handleLoadTemplate"
    />

    <!-- Keyboard Shortcuts Help Modal -->
    <Teleport to="body">
      <div v-if="showShortcutsHelp" class="modal-backdrop" @click.self="showShortcutsHelp = false">
        <KeyboardShortcutsHelp @close="showShortcutsHelp = false" />
      </div>
    </Teleport>

    <!-- GM Action Modal -->
    <Teleport to="body">
      <GMActionModal
        v-if="actionModalCombatant && encounter"
        :combatant="actionModalCombatant"
        :all-combatants="encounter.combatants"
        @close="actionModalCombatantId = null"
        @execute-move="handleExecuteMoveWithClose"
        @execute-action="handleExecuteActionWithBreatherShift"
        @update-status="handleStatus"
      />
    </Teleport>

    <!-- XP Distribution Modal -->
    <Teleport to="body">
      <XpDistributionModal
        v-if="showXpModal && encounter"
        :encounter="encounter"
        @skip="handleXpSkip"
        @complete="handleXpComplete"
        @close="showXpModal = false"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { CombatSide } from '~/types'
import type { BreatherShiftResult } from '~/composables/useEncounterActions'

definePageMeta({
  layout: 'gm'
})

useHead({
  title: 'GM - Encounter'
})

const encounterStore = useEncounterStore()
const libraryStore = useLibraryStore()
const settingsStore = useSettingsStore()
const { send, isConnected, identify, joinEncounter } = useWebSocket()

// Undo/Redo state
const undoRedoState = ref({
  canUndo: false,
  canRedo: false,
  lastActionName: null as string | null,
  nextActionName: null as string | null
})

// Update undo/redo state
const refreshUndoRedoState = () => {
  const state = encounterStore.getUndoRedoState()
  undoRedoState.value = state
}

// Get route for query params
const route = useRoute()
const router = useRouter()

// Load library on mount, initialize history, and set up keyboard shortcuts
onMounted(async () => {
  await libraryStore.loadLibrary()

  // Load settings from localStorage
  settingsStore.loadSettings()

  // Check for loadTemplate query parameter (coming from encounters library)
  const loadTemplateId = route.query.loadTemplate as string | undefined
  if (loadTemplateId) {
    // Clear the query param from URL
    router.replace({ query: {} })
    // Load the template
    try {
      await encounterStore.loadFromTemplate(loadTemplateId)
      encounterStore.initializeHistory()
      refreshUndoRedoState()
    } catch (error) {
      console.error('Failed to load template from URL:', error)
    }
  }

  // If no current encounter, try to load the served encounter
  if (!encounterStore.encounter) {
    await encounterStore.loadServedEncounter()
  }

  // Initialize history if encounter exists
  if (encounterStore.encounter) {
    encounterStore.initializeHistory()
    refreshUndoRedoState()

    // Identify as GM and join the encounter via WebSocket
    if (isConnected.value) {
      identify('gm', encounterStore.encounter.id)
      joinEncounter(encounterStore.encounter.id)
    }
  }

  // Add keyboard shortcuts
  window.addEventListener('keydown', handleKeyboardShortcuts)
})

// Cleanup keyboard shortcuts
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyboardShortcuts)
})

// Identify as GM when WebSocket connects or when encounter is created
watch(isConnected, (connected) => {
  if (connected) {
    // Identify as GM even without encounter
    identify('gm', encounterStore.encounter?.id)
    if (encounterStore.encounter?.id) {
      joinEncounter(encounterStore.encounter.id)
    }
  }
}, { immediate: true })

// Also identify/join when encounter is created
watch(() => encounterStore.encounter?.id, (encounterId) => {
  if (isConnected.value && encounterId) {
    identify('gm', encounterId)
    joinEncounter(encounterId)
  }
})

// Keyboard shortcuts handler
const handleKeyboardShortcuts = (event: KeyboardEvent) => {
  // Ignore if typing in an input/textarea
  const target = event.target as HTMLElement
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
    return
  }

  // Toggle shortcuts help with ? key
  if (event.key === '?' || (event.shiftKey && event.key === '/')) {
    event.preventDefault()
    showShortcutsHelp.value = !showShortcutsHelp.value
    return
  }

  // Close shortcuts help with Escape
  if (event.key === 'Escape' && showShortcutsHelp.value) {
    showShortcutsHelp.value = false
    return
  }

  // Check for Ctrl/Cmd key for undo/redo
  const isMod = event.ctrlKey || event.metaKey

  if (!isMod) return

  // Undo: Ctrl+Z
  if (event.key === 'z' && !event.shiftKey) {
    event.preventDefault()
    handleUndo()
    return
  }

  // Redo: Ctrl+Shift+Z or Ctrl+Y
  if ((event.key === 'z' && event.shiftKey) || event.key === 'y') {
    event.preventDefault()
    handleRedo()
    return
  }
}

// View state
const activeView = ref<'list' | 'grid'>('list')


// Add combatant modal
const showAddModal = ref(false)
const addingSide = ref<CombatSide>('players')

// Template modals
const showSaveTemplateModal = ref(false)
const showLoadTemplateModal = ref(false)

// Keyboard shortcuts help
const showShortcutsHelp = ref(false)

// XP Distribution Modal
const showXpModal = ref(false)

// GM Action Modal state - store ID only, compute fresh combatant from store
const actionModalCombatantId = ref<string | null>(null)
const actionModalCombatant = computed(() => {
  if (!actionModalCombatantId.value || !encounter.value) return null
  return encounter.value.combatants.find(c => c.id === actionModalCombatantId.value) || null
})

// Computed from store
const encounter = computed(() => encounterStore.encounter)
const currentCombatant = computed(() => encounterStore.currentCombatant)
const playerCombatants = computed(() => encounterStore.playerCombatants)
const allyCombatants = computed(() => encounterStore.allyCombatants)
const enemyCombatants = computed(() => encounterStore.enemyCombatants)
const moveLog = computed(() => encounterStore.moveLog.slice().reverse())

// Grid config with fallback defaults
const gridConfig = computed(() => encounter.value?.gridConfig ?? {
  enabled: true,
  width: 20,
  height: 15,
  cellSize: 40,
  background: undefined
})

// Encounter actions composable
const {
  handleAction,
  handleDamage,
  handleHeal,
  handleStages,
  handleStatus,
  handleExecuteMove,
  handleExecuteAction,
  handleGridConfigUpdate,
  handleTokenMove,
  handleBackgroundUpload,
  handleBackgroundRemove,
  handleMovementPreviewChange
} = useEncounterActions({
  encounter,
  send,
  refreshUndoRedoState
})

// Breather shift state — shown when Take a Breather requires the GM to shift the token
const pendingBreatherShift = ref<BreatherShiftResult | null>(null)

// GM Action Modal handler
const handleOpenActions = (combatantId: string) => {
  actionModalCombatantId.value = combatantId
}

// Wrap handleExecuteAction to handle breather shift prompt
const handleExecuteActionWithBreatherShift = async (combatantId: string, actionType: string) => {
  const breatherResult = await handleExecuteAction(combatantId, actionType)
  if (breatherResult) {
    pendingBreatherShift.value = breatherResult
    // Auto-switch to grid view so the GM can move the token
    activeView.value = 'grid'
  }
}

// Focus the breather token on the grid for movement
const focusBreatherToken = () => {
  if (!pendingBreatherShift.value) return
  // Switch to grid view — banner stays until token is moved or explicitly dismissed
  activeView.value = 'grid'
}

// Wrap handleTokenMove to auto-dismiss breather banner when the pending token is moved
const handleTokenMoveWithBreatherClear = async (combatantId: string, position: { x: number; y: number }) => {
  await handleTokenMove(combatantId, position)
  // Clear breather shift if the moved token is the one pending a shift
  if (pendingBreatherShift.value && pendingBreatherShift.value.combatantId === combatantId) {
    pendingBreatherShift.value = null
  }
}

// Wrap handleExecuteMove to close modal after execution
const handleExecuteMoveWithClose = async (
  combatantId: string,
  moveId: string,
  targetIds: string[],
  damage?: number,
  targetDamages?: Record<string, number>
) => {
  await handleExecuteMove(combatantId, moveId, targetIds, damage, targetDamages)
  actionModalCombatantId.value = null
}

// Actions
const createNewEncounter = async (name: string, battleType: 'trainer' | 'full_contact') => {
  await encounterStore.createEncounter(name, battleType)
  // Initialize history for new encounter
  encounterStore.initializeHistory()
  refreshUndoRedoState()
}

const startEncounter = async () => {
  await encounterStore.startEncounter()
  // Wait for Vue reactivity to process the store update
  await nextTick()
  // Broadcast the encounter start via WebSocket
  if (encounterStore.encounter) {
    send({
      type: 'encounter_update',
      data: encounterStore.encounter
    })
  }
}

const nextTurn = async () => {
  pendingBreatherShift.value = null
  await encounterStore.nextTurn()
  // Wait for Vue reactivity to process the store update
  await nextTick()
  // Broadcast the turn change via WebSocket
  if (encounterStore.encounter) {
    send({
      type: 'encounter_update',
      data: encounterStore.encounter
    })
  }
}

// Handle WebSocket broadcast after a declaration is submitted (League Battle)
const handleDeclarationBroadcast = async () => {
  await nextTick()
  if (encounterStore.encounter) {
    send({
      type: 'encounter_update',
      data: encounterStore.encounter
    })
  }
  refreshUndoRedoState()
}

const handleSetWeather = async (weather: string | null, source: string) => {
  const label = weather ? `Set Weather: ${weather}` : 'Cleared Weather'
  encounterStore.captureSnapshot(label)
  await encounterStore.setWeather(weather, source as 'move' | 'ability' | 'manual')
  refreshUndoRedoState()
  // Wait for Vue reactivity to process the store update
  await nextTick()
  // Broadcast weather change via WebSocket
  if (encounterStore.encounter) {
    send({
      type: 'encounter_update',
      data: encounterStore.encounter
    })
  }
}

const endEncounter = async () => {
  // If there are defeated enemies, show the XP distribution modal
  const defeated = encounterStore.encounter?.defeatedEnemies ?? []
  if (defeated.length > 0) {
    showXpModal.value = true
    return
  }

  // No defeated enemies — just confirm and end
  if (confirm('Are you sure you want to end this encounter?')) {
    pendingBreatherShift.value = null
    await encounterStore.endEncounter()
  }
}

// XP Modal handlers
const handleXpSkip = async () => {
  showXpModal.value = false
  pendingBreatherShift.value = null
  await encounterStore.endEncounter()
}

const handleXpComplete = async () => {
  showXpModal.value = false
  pendingBreatherShift.value = null
  await encounterStore.endEncounter()
}

const serveEncounter = async () => {
  await encounterStore.serveEncounter()
  // Notify group views via WebSocket
  if (encounterStore.encounter) {
    send({
      type: 'serve_encounter',
      data: { encounterId: encounterStore.encounter.id, encounter: encounterStore.encounter }
    })
  }
}

const unserveEncounter = async () => {
  const encounterId = encounterStore.encounter?.id
  await encounterStore.unserveEncounter()
  // Notify group views via WebSocket
  if (encounterId) {
    send({
      type: 'encounter_unserved',
      data: { encounterId }
    })
  }
}

// Undo/Redo handlers
const handleUndo = async () => {
  if (!undoRedoState.value.canUndo) return
  await encounterStore.undoAction()
  refreshUndoRedoState()
}

const handleRedo = async () => {
  if (!undoRedoState.value.canRedo) return
  await encounterStore.redoAction()
  refreshUndoRedoState()
}

const showAddCombatant = (side: CombatSide) => {
  addingSide.value = side
  showAddModal.value = true
}

const addCombatant = async (entityId: string, entityType: 'pokemon' | 'human', initiativeBonus: number) => {
  await encounterStore.addCombatant(entityId, entityType, addingSide.value, initiativeBonus)
  showAddModal.value = false
}

// Template handlers
const handleTemplateSaved = (_templateId: string) => {
  showSaveTemplateModal.value = false
  // Could show a success toast here
}

const handleLoadTemplate = async (data: { templateId: string; encounterName: string }) => {
  try {
    await encounterStore.loadFromTemplate(data.templateId, data.encounterName)
    showLoadTemplateModal.value = false
    // Initialize history for the new encounter
    encounterStore.initializeHistory()
    refreshUndoRedoState()
  } catch (error) {
    console.error('Failed to load template:', error)
  }
}

const removeCombatant = async (combatantId: string) => {
  if (confirm('Remove this combatant?')) {
    await encounterStore.removeCombatant(combatantId)
  }
}
</script>

<style lang="scss" scoped>
.btn--ghost {
  background: transparent;
  border: 1px solid $glass-border;
  color: $color-text-muted;

  &:hover {
    border-color: $color-primary;
    color: $color-text;
  }
}

.encounter-content {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: $spacing-lg;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
}

.encounter-sidebar {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.grid-view-panel {
  grid-column: 1 / -1;
}

.map-view-panel {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}
</style>
