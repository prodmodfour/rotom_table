<template>
  <div v-if="showPanel" class="mount-controls">
    <div class="mount-controls__header">
      <PhHorse :size="16" weight="bold" />
      <span class="mount-controls__title">Mount Controls</span>
    </div>

    <!-- Case 1: Trainer not mounted, adjacent mountable Pokemon exist -->
    <div v-if="canMountOptions.length > 0 && !isRider" class="mount-controls__section">
      <label class="mount-controls__label">Mount on:</label>
      <select v-model="selectedMountId" class="mount-controls__select">
        <option value="">-- Select Pokemon --</option>
        <option
          v-for="opt in canMountOptions"
          :key="opt.id"
          :value="opt.id"
        >
          {{ opt.name }} (Overland {{ opt.overland }})
        </option>
      </select>
      <div class="mount-controls__actions">
        <button
          class="btn btn--sm btn--accent"
          :disabled="!selectedMountId"
          @click="handleMount"
        >
          Mount ({{ actionCostLabel }})
        </button>
        <label class="mount-controls__checkbox">
          <input v-model="skipCheck" type="checkbox" />
          Skip Check
        </label>
      </div>
      <div v-if="hasMountedProwessEdge" class="mount-controls__prowess">
        Mounted Prowess: Auto-success on mount check
      </div>
    </div>

    <!-- Case 2: Currently mounted rider -->
    <div v-if="isRider" class="mount-controls__section">
      <div class="mount-controls__info-row">
        <span class="mount-controls__info-label">Mounted on:</span>
        <span class="mount-controls__info-value">{{ mountName }}</span>
      </div>
      <div class="mount-controls__info-row">
        <span class="mount-controls__info-label">Movement:</span>
        <span class="mount-controls__info-value">
          {{ movementRemaining }}m of {{ mountOverland }}m
        </span>
      </div>
      <div class="mount-controls__actions">
        <button
          class="btn btn--sm btn--ghost"
          @click="handleDismount(false)"
        >
          Dismount
        </button>
      </div>
      <div class="mount-controls__note">
        <PhShieldChevron :size="12" />
        Easy Intercept: Rider and mount may Intercept for each other without distance requirement (PTU p.218)
      </div>
      <div v-if="hasMountedProwessEdge" class="mount-controls__prowess">
        Mounted Prowess: +3 to remain-mounted checks
      </div>
    </div>

    <!-- Case 3: Currently carrying a rider (mount's turn) -->
    <div v-if="isMount" class="mount-controls__section">
      <div class="mount-controls__info-row">
        <span class="mount-controls__info-label">Carrying:</span>
        <span class="mount-controls__info-value">{{ riderName }}</span>
      </div>
      <div class="mount-controls__info-row">
        <span class="mount-controls__info-label">Movement:</span>
        <span class="mount-controls__info-value">
          {{ movementRemaining }}m of {{ mountOverland }}m
        </span>
      </div>
      <div class="mount-controls__info-row">
        <span class="mount-controls__info-label">Standard Action:</span>
        <span class="mount-controls__info-value">
          {{ currentCombatant?.turnState.standardActionUsed ? 'Used' : 'Available' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Combatant, Pokemon, HumanCharacter } from '~/types'
import { PhHorse, PhShieldChevron } from '@phosphor-icons/vue'
import { isMountable, hasMountedProwess, getMountActionCost, hasExpertMountingSkill } from '~/utils/mountingRules'
import { getOverlandSpeed } from '~/utils/combatantCapabilities'
import { areAdjacent } from '~/utils/adjacency'

const encounterStore = useEncounterStore()
const { send } = useWebSocket()

const selectedMountId = ref('')
const skipCheck = ref(false)

// Current turn combatant
const currentCombatant = computed(() => encounterStore.currentCombatant)

// Is the current combatant a mounted rider?
const isRider = computed(() =>
  currentCombatant.value?.mountState?.isMounted === true
)

// Is the current combatant a mount carrying a rider?
const isMount = computed(() =>
  currentCombatant.value?.mountState?.isMounted === false &&
  !!currentCombatant.value?.mountState?.partnerId
)

// Mount partner combatant
const mountPartner = computed(() => {
  if (!currentCombatant.value?.mountState) return null
  return encounterStore.getMountPartner(currentCombatant.value.id)
})

// Mount name (when current is rider)
const mountName = computed(() => {
  if (!mountPartner.value) return '???'
  if (mountPartner.value.type === 'pokemon') {
    const pokemon = mountPartner.value.entity as Pokemon
    return pokemon.nickname || pokemon.species
  }
  return (mountPartner.value.entity as HumanCharacter).name
})

// Rider name (when current is mount)
const riderName = computed(() => {
  if (!mountPartner.value) return '???'
  if (mountPartner.value.type === 'human') {
    return (mountPartner.value.entity as HumanCharacter).name
  }
  const pokemon = mountPartner.value.entity as Pokemon
  return pokemon.nickname || pokemon.species
})

// Movement remaining from mount state
const movementRemaining = computed(() =>
  currentCombatant.value?.mountState?.movementRemaining ?? 0
)

// Mount's overland speed (full movement for the round)
const mountOverland = computed(() => {
  if (isRider.value && mountPartner.value) {
    return getOverlandSpeed(mountPartner.value)
  }
  if (isMount.value && currentCombatant.value) {
    return getOverlandSpeed(currentCombatant.value)
  }
  return 0
})

// Has Mounted Prowess edge (on rider)
const hasMountedProwessEdge = computed(() => {
  if (isRider.value && currentCombatant.value) {
    return hasMountedProwess(currentCombatant.value)
  }
  if (isMount.value && mountPartner.value) {
    return hasMountedProwess(mountPartner.value)
  }
  // For mount options (not yet mounted), check current combatant
  if (currentCombatant.value?.type === 'human') {
    return hasMountedProwess(currentCombatant.value)
  }
  return false
})

// Action cost label for mounting
const actionCostLabel = computed(() => {
  if (!currentCombatant.value) return 'Standard Action'
  return hasExpertMountingSkill(currentCombatant.value)
    ? 'Free Action during Shift'
    : 'Standard Action'
})

// Adjacent mountable Pokemon for the current human combatant
const canMountOptions = computed(() => {
  const current = currentCombatant.value
  if (!current) return []
  if (current.type !== 'human') return []
  if (current.mountState?.isMounted) return []
  if (!current.position) return []

  const encounter = encounterStore.encounter
  if (!encounter) return []

  const options: { id: string; name: string; overland: number }[] = []

  for (const c of encounter.combatants) {
    if (c.id === current.id) continue
    if (c.side !== current.side) continue
    if (!isMountable(c)) continue
    if (!c.position) continue

    // Check adjacency
    const adjacent = areAdjacent(
      current.position, current.tokenSize || 1,
      c.position, c.tokenSize || 1
    )
    // Also allow same position
    const samePos = current.position.x === c.position.x && current.position.y === c.position.y
    if (!adjacent && !samePos) continue

    // Already carrying a rider? Skip if at capacity
    // (simplified: skip if already has a rider from this pair check)
    if (c.mountState && !c.mountState.isMounted) continue

    const pokemon = c.entity as Pokemon
    const name = pokemon.nickname || pokemon.species
    const overland = getOverlandSpeed(c)

    options.push({ id: c.id, name, overland })
  }

  return options
})

// Show panel when there's relevant mount info
const showPanel = computed(() => {
  return isRider.value || isMount.value || canMountOptions.value.length > 0
})

// Actions
// Broadcast encounter state after mount/dismount
const broadcastUpdate = async () => {
  await nextTick()
  if (encounterStore.encounter) {
    send({ type: 'encounter_update', data: encounterStore.encounter })
  }
}

const handleMount = async () => {
  if (!selectedMountId.value || !currentCombatant.value) return
  try {
    const result = await encounterStore.mountRider(
      currentCombatant.value.id,
      selectedMountId.value,
      skipCheck.value
    )
    selectedMountId.value = ''
    skipCheck.value = false

    // Broadcast to group/player views
    if (result) {
      send({ type: 'mount_change', data: {
        riderId: result.riderId,
        mountId: result.mountId,
        action: 'mount'
      }})
      await broadcastUpdate()
    }
  } catch (e: any) {
    alert(`Mount failed: ${e.data?.message || e.message || 'Unknown error'}`)
  }
}

const handleDismount = async (forced: boolean) => {
  if (!currentCombatant.value) return
  try {
    const result = await encounterStore.dismountRider(
      currentCombatant.value.id,
      forced
    )

    // Broadcast to group/player views
    if (result) {
      send({ type: 'mount_change', data: {
        riderId: result.riderId,
        mountId: result.mountId,
        action: 'dismount',
        forced
      }})
      await broadcastUpdate()
    }
  } catch (e: any) {
    alert(`Dismount failed: ${e.data?.message || e.message || 'Unknown error'}`)
  }
}
</script>

<style lang="scss" scoped>
.mount-controls {
  background: $color-bg-tertiary;
  border: 1px solid rgba(100, 200, 255, 0.3);
  border-radius: $border-radius-md;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.mount-controls__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: $color-accent-teal;
  font-weight: 600;
  font-size: 0.85rem;
}

.mount-controls__title {
  font-size: 0.85rem;
}

.mount-controls__section {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.mount-controls__label {
  font-size: 0.8rem;
  color: $color-text-muted;
}

.mount-controls__select {
  background: $color-bg-secondary;
  border: 1px solid $border-color-default;
  color: $color-text;
  padding: 0.25rem 0.5rem;
  border-radius: $border-radius-sm;
  font-size: 0.8rem;
}

.mount-controls__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.mount-controls__checkbox {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: $color-text-muted;
  cursor: pointer;

  input[type="checkbox"] {
    accent-color: $color-accent-teal;
  }
}

.mount-controls__info-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
}

.mount-controls__info-label {
  color: $color-text-muted;
}

.mount-controls__info-value {
  color: $color-text;
  font-weight: 500;
}

.mount-controls__note {
  display: flex;
  align-items: flex-start;
  gap: 0.25rem;
  font-size: 0.7rem;
  color: $color-accent-teal;
  padding: 0.25rem;
  background: rgba(100, 200, 255, 0.05);
  border-radius: $border-radius-sm;
  line-height: 1.3;
}

.mount-controls__prowess {
  font-size: 0.7rem;
  color: $color-success;
  font-style: italic;
}
</style>
