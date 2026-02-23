<template>
  <div class="vtt-container" data-testid="vtt-container">
    <!-- VTT Header with Controls -->
    <div class="vtt-header">
      <div class="vtt-header__title">
        <h3>Battle Grid</h3>
        <span class="vtt-header__size">{{ config.width }}×{{ config.height }}</span>
        <span v-if="selectionStore.selectedCount > 0" class="vtt-header__selection">
          {{ selectionStore.selectedCount }} selected
        </span>
      </div>

      <div class="vtt-header__controls">
        <!-- Toggle Grid Settings -->
        <button
          v-if="isGm"
          class="btn btn--sm btn--secondary btn--with-icon"
          @click="showSettings = !showSettings"
          data-testid="grid-settings-btn"
        >
          <img src="/icons/phosphor/gear.svg" alt="" class="btn-svg" />
          Settings
        </button>

        <!-- Toggle Grid Visibility -->
        <button
          v-if="isGm"
          class="btn btn--sm btn--with-icon"
          :class="config.enabled ? 'btn--primary' : 'btn--secondary'"
          @click="toggleGrid"
          data-testid="toggle-grid-btn"
        >
          <img src="/icons/phosphor/map-trifold.svg" alt="" class="btn-svg" />
          {{ config.enabled ? 'Grid On' : 'Grid Off' }}
        </button>
      </div>
    </div>

    <!-- Measurement Toolbar -->
    <MeasurementToolbar
      v-if="config.enabled"
      :mode="measurementStore.mode"
      :aoe-size="measurementStore.aoeSize"
      :aoe-direction="measurementStore.aoeDirection"
      @set-mode="setMeasurementMode"
      @increase-size="measurementStore.setAoeSize(measurementStore.aoeSize + 1)"
      @decrease-size="measurementStore.setAoeSize(measurementStore.aoeSize - 1)"
      @cycle-direction="measurementStore.cycleDirection()"
      @clear="clearMeasurement"
    />

    <!-- Fog of War Toolbar (GM Only) -->
    <FogOfWarToolbar
      v-if="config.enabled && isGm"
      :enabled="fogOfWarStore.enabled"
      :tool-mode="fogOfWarStore.toolMode"
      :brush-size="fogOfWarStore.brushSize"
      @toggle="toggleFogOfWar"
      @set-tool="setFogTool"
      @increase-brush="fogOfWarStore.setBrushSize(fogOfWarStore.brushSize + 1)"
      @decrease-brush="fogOfWarStore.setBrushSize(fogOfWarStore.brushSize - 1)"
      @reveal-all="revealAllFog"
      @hide-all="hideAllFog"
    />

    <!-- Grid Settings Panel -->
    <GridSettingsPanel
      v-if="showSettings && isGm"
      :config="localConfig"
      :is-uploading="isUploading"
      :upload-error="uploadError"
      @update="handleConfigUpdate"
      @apply="applySettings"
      @reset="resetSettings"
      @upload-background="handleBackgroundUpload"
      @remove-background="removeBackground"
    />

    <!-- Grid Canvas: 2D flat or Isometric based on feature flag -->
    <div v-if="config.enabled" class="vtt-grid-wrapper">
      <!-- Isometric Canvas (when isometric mode is active) -->
      <IsometricCanvas
        v-if="config.isometric"
        ref="isometricCanvasRef"
        :config="config"
        :tokens="tokens"
        :combatants="combatants"
        :current-turn-id="currentTurnId"
        :is-gm="isGm"
        :show-zoom-controls="true"
        :show-coordinates="true"
        @token-move="handleTokenMove"
        @token-select="handleTokenSelect"
        @cell-click="handleCellClick"
        @multi-select="handleMultiSelect"
        @movement-preview-change="handleMovementPreviewChange"
      />

      <!-- Standard 2D Grid Canvas (default) -->
      <GridCanvas
        v-else
        ref="gridCanvasRef"
        :config="config"
        :tokens="tokens"
        :combatants="combatants"
        :current-turn-id="currentTurnId"
        :is-gm="isGm"
        :show-zoom-controls="true"
        :show-coordinates="true"
        @token-move="handleTokenMove"
        @token-select="handleTokenSelect"
        @cell-click="handleCellClick"
        @multi-select="handleMultiSelect"
        @movement-preview-change="handleMovementPreviewChange"
      />
    </div>

    <!-- Grid Disabled State -->
    <div v-else class="vtt-disabled">
      <p>Grid is disabled</p>
      <button
        v-if="isGm"
        class="btn btn--primary"
        @click="toggleGrid"
      >
        Enable Grid
      </button>
    </div>

    <!-- Selected Token Info -->
    <div v-if="selectedCombatant" class="vtt-selection" data-testid="vtt-selection">
      <div class="vtt-selection__header">
        <span class="vtt-selection__name">{{ getCombatantName(selectedCombatant) }}</span>
        <button class="vtt-selection__close" @click="selectedTokenId = null">&times;</button>
      </div>
      <div class="vtt-selection__info">
        <span>Position: ({{ selectedCombatant.position?.x ?? '?'}}, {{ selectedCombatant.position?.y ?? '?' }})</span>
        <span>HP: {{ selectedCombatant.entity.currentHp }}/{{ selectedCombatant.entity.maxHp }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GridConfig, GridPosition, Combatant, MovementPreview } from '~/types'
import { DEFAULT_SETTINGS } from '~/types'
import GridCanvas from '~/components/vtt/GridCanvas.vue'
import IsometricCanvas from '~/components/vtt/IsometricCanvas.vue'
import { useSelectionStore } from '~/stores/selection'
import { useMeasurementStore, type MeasurementMode } from '~/stores/measurement'
import { useFogOfWarStore, type FogOfWarState } from '~/stores/fogOfWar'
import { useTerrainStore } from '~/stores/terrain'

const { getCombatantName } = useCombatantDisplay()

interface TokenData {
  combatantId: string
  position: GridPosition
  size: number
}

const props = defineProps<{
  config: GridConfig
  combatants: Combatant[]
  currentTurnId?: string
  isGm?: boolean
  encounterId?: string
}>()

const emit = defineEmits<{
  configUpdate: [config: GridConfig]
  tokenMove: [combatantId: string, position: GridPosition]
  backgroundUpload: [file: File]
  backgroundRemove: []
  multiSelect: [combatantIds: string[]]
  movementPreviewChange: [preview: MovementPreview | null]
}>()

// Stores
const selectionStore = useSelectionStore()
const measurementStore = useMeasurementStore()
const fogOfWarStore = useFogOfWarStore()
const terrainStore = useTerrainStore()

// Fog persistence
const { loadFogState, debouncedSave: debouncedSaveFog, cancelPendingSave: cancelPendingFogSave } = useFogPersistence()

// Terrain persistence
const { loadTerrainState, debouncedSave: debouncedSaveTerrain, cancelPendingSave: cancelPendingTerrainSave } = useTerrainPersistence()

// Load fog and terrain state when encounter changes
watch(() => props.encounterId, async (newId, oldId) => {
  if (newId && newId !== oldId) {
    // Load both fog and terrain states
    const [fogLoaded, terrainLoaded] = await Promise.all([
      loadFogState(newId),
      loadTerrainState(newId)
    ])
    if (fogLoaded || terrainLoaded) {
      // Re-render grid canvas if available
      activeCanvasRef.value?.render()
    }
  }
}, { immediate: true })

// Auto-save fog state when it changes (debounced)
watch(() => fogOfWarStore.$state, () => {
  if (props.encounterId && props.isGm) {
    debouncedSaveFog(props.encounterId)
  }
}, { deep: true })

// Auto-save terrain state when it changes (debounced)
watch(() => terrainStore.$state, () => {
  if (props.encounterId && props.isGm) {
    debouncedSaveTerrain(props.encounterId)
  }
}, { deep: true })

// Clean up on unmount
onUnmounted(() => {
  cancelPendingFogSave()
  cancelPendingTerrainSave()
})

// Refs
const gridCanvasRef = ref<InstanceType<typeof GridCanvas> | null>(null)
const isometricCanvasRef = ref<InstanceType<typeof IsometricCanvas> | null>(null)

// Active canvas ref (whichever mode is active)
const activeCanvasRef = computed(() => {
  return props.config.isometric ? isometricCanvasRef.value : gridCanvasRef.value
})
const showSettings = ref(false)
const selectedTokenId = ref<string | null>(null)
const isUploading = ref(false)
const uploadError = ref<string | null>(null)

// Local config for editing
const localConfig = ref<GridConfig>({
  enabled: props.config.enabled,
  width: props.config.width,
  height: props.config.height,
  cellSize: props.config.cellSize,
  background: props.config.background,
  isometric: props.config.isometric ?? false,
  cameraAngle: props.config.cameraAngle ?? 0,
  maxElevation: props.config.maxElevation ?? 5,
})

// Computed
const tokens = computed((): TokenData[] => {
  return props.combatants
    .filter(c => c.position)
    .map(c => ({
      combatantId: c.id,
      position: c.position!,
      size: c.tokenSize || 1,
    }))
})

const selectedCombatant = computed(() => {
  if (!selectedTokenId.value) return null
  return props.combatants.find(c => c.id === selectedTokenId.value)
})

// Methods
const toggleGrid = () => {
  emit('configUpdate', {
    ...props.config,
    enabled: !props.config.enabled,
  })
}

const handleConfigUpdate = (field: keyof GridConfig, value: number | string | boolean | undefined) => {
  localConfig.value = { ...localConfig.value, [field]: value }
}

const applySettings = () => {
  emit('configUpdate', { ...localConfig.value })
  showSettings.value = false
}

const resetSettings = () => {
  localConfig.value = {
    enabled: true,
    width: DEFAULT_SETTINGS.defaultGridWidth,
    height: DEFAULT_SETTINGS.defaultGridHeight,
    cellSize: DEFAULT_SETTINGS.defaultCellSize,
    background: undefined,
    isometric: false,
    cameraAngle: 0,
    maxElevation: 5,
  }
}

const handleTokenMove = (combatantId: string, position: GridPosition) => {
  emit('tokenMove', combatantId, position)
}

const handleTokenSelect = (combatantId: string | null) => {
  selectedTokenId.value = combatantId
}

const handleCellClick = (position: GridPosition) => {
  // Cell clicks for fog painting are handled in GridCanvas
  // This event is available for future features like token placement
}

const handleMultiSelect = (combatantIds: string[]) => {
  emit('multiSelect', combatantIds)
}

const handleMovementPreviewChange = (preview: MovementPreview | null) => {
  emit('movementPreviewChange', preview)
}

// Measurement methods
const setMeasurementMode = (mode: MeasurementMode) => {
  if (measurementStore.mode === mode) {
    measurementStore.setMode('none')
  } else {
    measurementStore.setMode(mode)
  }
}

const clearMeasurement = () => {
  measurementStore.setMode('none')
  measurementStore.clearMeasurement()
}

// Fog of War methods
const toggleFogOfWar = () => {
  fogOfWarStore.setEnabled(!fogOfWarStore.enabled)
}

const setFogTool = (tool: FogOfWarState['toolMode']) => {
  fogOfWarStore.setToolMode(tool)
}

const revealAllFog = () => {
  fogOfWarStore.revealAll(props.config.width, props.config.height)
}

const hideAllFog = () => {
  fogOfWarStore.hideAll()
}

// Background upload
const handleBackgroundUpload = async (file: File) => {
  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!validTypes.includes(file.type)) {
    uploadError.value = 'Invalid file type. Use JPEG, PNG, GIF, or WebP.'
    return
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    uploadError.value = 'File too large. Maximum size is 5MB.'
    return
  }

  uploadError.value = null
  isUploading.value = true

  try {
    emit('backgroundUpload', file)
  } finally {
    isUploading.value = false
  }
}

const removeBackground = () => {
  localConfig.value.background = undefined
  emit('backgroundRemove')
}

// Watch for external config changes
watch(() => props.config, (newConfig) => {
  localConfig.value = { ...newConfig }
}, { deep: true })

// Expose methods
defineExpose({
  resetView: () => activeCanvasRef.value?.resetView(),
})
</script>

<style lang="scss" scoped>
.vtt-container {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: 1px solid $glass-border;
  border-radius: $border-radius-lg;
  padding: $spacing-md;
}

.vtt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  &__title {
    display: flex;
    align-items: baseline;
    gap: $spacing-sm;

    h3 {
      margin: 0;
      font-size: $font-size-md;
    }
  }

  &__size {
    color: $color-text-muted;
    font-size: $font-size-sm;
  }

  &__selection {
    color: $color-accent-teal;
    font-size: $font-size-sm;
    font-weight: 600;
    padding: 2px 8px;
    background: rgba($color-accent-teal, 0.15);
    border-radius: $border-radius-sm;
  }

  &__controls {
    display: flex;
    gap: $spacing-sm;
  }
}

.btn-svg {
  @include btn-icon-img(14px);
}

.btn--with-icon {
  @include btn-with-icon;
}

.vtt-grid-wrapper {
  height: 500px;
  min-height: 400px;
  border-radius: $border-radius-md;
  overflow: hidden;
}

.vtt-disabled {
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $spacing-md;
  color: $color-text-muted;
  background: $color-bg-tertiary;
  border-radius: $border-radius-md;
}

.vtt-selection {
  background: $color-bg-tertiary;
  border-radius: $border-radius-md;
  padding: $spacing-sm $spacing-md;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-xs;
  }

  &__name {
    font-weight: 600;
    color: $color-text;
  }

  &__close {
    background: none;
    border: none;
    color: $color-text-muted;
    font-size: $font-size-lg;
    cursor: pointer;
    padding: 0;
    line-height: 1;

    &:hover {
      color: $color-text;
    }
  }

  &__info {
    display: flex;
    gap: $spacing-md;
    font-size: $font-size-sm;
    color: $color-text-muted;
  }
}
</style>
