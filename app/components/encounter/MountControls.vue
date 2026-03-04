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

      <!-- P2: Rider Class Features (shown when rider has Rider class) -->
      <template v-if="riderFeatures.hasRiderClass">
        <div class="mount-controls__divider" />
        <div class="mount-controls__feature-header">
          <PhSword :size="14" weight="bold" />
          <span>Rider Features</span>
        </div>

        <!-- J. Agility Training toggle -->
        <div v-if="riderFeatures.hasRider" class="mount-controls__feature">
          <label class="mount-controls__checkbox">
            <input
              type="checkbox"
              :checked="isAgilityTrainingActive"
              @change="handleToggleAgilityTraining"
            />
            Agility Training
          </label>
          <div v-if="isAgilityTrainingActive" class="mount-controls__feature-note">
            Bonuses DOUBLED (Rider class): +2 Movement, +8 Initiative
          </div>
        </div>

        <!-- L. Conqueror's March -->
        <div v-if="riderFeatures.hasConquerorsMarch && mountHasRunUp" class="mount-controls__feature">
          <button
            class="btn btn--xs btn--accent"
            :disabled="isConquerorsMarchActive || riderStandardUsed"
            @click="handleActivateConquerorsMarch"
          >
            <PhArrowFatRight :size="12" />
            Conqueror's March
          </button>
          <div v-if="isConquerorsMarchActive" class="mount-controls__feature-active">
            Active: Dash/Burst/Blast/Cone/Line moves use Pass range
          </div>
          <div v-else class="mount-controls__feature-desc">
            Order (Std Action): Qualifying moves use Pass range this round
          </div>
        </div>

        <!-- M. Ride as One -->
        <div v-if="riderFeatures.hasRideAsOne" class="mount-controls__feature">
          <div class="mount-controls__feature-label">
            <PhHandshake :size="12" />
            Ride as One
          </div>
          <div class="mount-controls__feature-note">
            Shared Speed Evasion active. Initiative: either may act when one receives initiative.
          </div>
        </div>

        <!-- N. Lean In -->
        <div v-if="riderFeatures.hasLeanIn" class="mount-controls__feature">
          <div class="mount-controls__feature-label">
            <PhShield :size="12" />
            Lean In ({{ leanInRemaining }}/{{ LEAN_IN_MAX_PER_SCENE }})
          </div>
          <button
            class="btn btn--xs btn--ghost"
            :disabled="leanInRemaining <= 0"
            @click="handleUseLeanIn"
          >
            Activate Lean In
          </button>
          <div class="mount-controls__feature-desc">
            Free Action: Both resist AoE one step further (Scene x2)
          </div>
        </div>

        <!-- O. Cavalier's Reprisal -->
        <div v-if="riderFeatures.hasCavaliersReprisal" class="mount-controls__feature">
          <div class="mount-controls__feature-label">
            <PhSword :size="12" />
            Cavalier's Reprisal
          </div>
          <div class="mount-controls__feature-desc">
            1 AP ({{ riderAp }} available): Struggle Attack when mount hit in melee by adjacent foe
          </div>
        </div>

        <!-- P. Overrun -->
        <div v-if="riderFeatures.hasOverrun && mountHasRunUp" class="mount-controls__feature">
          <div class="mount-controls__feature-label">
            <PhLightning :size="12" />
            Overrun ({{ overrunRemaining }}/{{ OVERRUN_MAX_PER_SCENE }})
          </div>
          <button
            class="btn btn--xs btn--ghost"
            :disabled="overrunRemaining <= 0"
            @click="handleUseOverrun"
          >
            Activate Overrun
          </button>
          <div class="mount-controls__feature-desc">
            Add mount Speed to damage; target gains DR = their Speed (Scene x2)
          </div>
        </div>
      </template>
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

      <!-- P2: Mount-side Rider feature indicators -->
      <template v-if="mountRiderFeatures.hasRiderClass">
        <div class="mount-controls__divider" />

        <div v-if="isAgilityTrainingActive" class="mount-controls__feature-active">
          Agility Training: +2 Movement, +8 Initiative (Rider doubled)
        </div>

        <div v-if="isConquerorsMarchActive" class="mount-controls__feature-active">
          Conqueror's March: Qualifying moves use Pass range
        </div>

        <div v-if="distanceMovedThisTurn > 0 && mountHasRunUp" class="mount-controls__feature-note">
          Run Up: +{{ runUpBonus }} damage on Dash/Pass moves ({{ distanceMovedThisTurn }}m moved)
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Combatant, Pokemon, HumanCharacter } from '~/types'
import { PhHorse, PhShieldChevron, PhSword, PhArrowFatRight, PhHandshake, PhShield, PhLightning } from '@phosphor-icons/vue'
import {
  isMountable, hasMountedProwess, getMountActionCost, hasExpertMountingSkill,
  getMountCapacity, countCurrentRiders, hasRiderClass, hasRiderFeature,
  hasRunUp, getFeatureUsesRemaining
} from '~/utils/mountingRules'
import { getOverlandSpeed } from '~/utils/combatantCapabilities'
import { areAdjacent } from '~/utils/adjacency'
import { LEAN_IN_MAX_PER_SCENE, OVERRUN_MAX_PER_SCENE } from '~/constants/trainerClasses'

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

    // Skip if mount is at rider capacity (Mountable 2+ may still have room)
    const capacity = getMountCapacity(c)
    const currentRiders = countCurrentRiders(c.id, encounter.combatants)
    if (currentRiders >= capacity) continue

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

// ============================================================
// P2: Rider Class Feature Computations
// ============================================================

// Determine the rider combatant (may be current or partner)
const riderCombatant = computed((): Combatant | null => {
  if (isRider.value) return currentCombatant.value
  if (isMount.value) return mountPartner.value
  return null
})

// Determine the mount combatant
const mountCombatant = computed((): Combatant | null => {
  if (isRider.value) return mountPartner.value
  if (isMount.value) return currentCombatant.value
  return null
})

// Rider features available (when current combatant is the rider)
const riderFeatures = computed(() => {
  const rider = currentCombatant.value
  if (!rider || !isRider.value) {
    return {
      hasRiderClass: false,
      hasRider: false,
      hasRammingSpeed: false,
      hasConquerorsMarch: false,
      hasRideAsOne: false,
      hasLeanIn: false,
      hasCavaliersReprisal: false,
      hasOverrun: false
    }
  }
  return {
    hasRiderClass: hasRiderClass(rider),
    hasRider: hasRiderFeature(rider, 'Rider'),
    hasRammingSpeed: hasRiderFeature(rider, 'Ramming Speed'),
    hasConquerorsMarch: hasRiderFeature(rider, "Conqueror's March"),
    hasRideAsOne: hasRiderFeature(rider, 'Ride as One'),
    hasLeanIn: hasRiderFeature(rider, 'Lean In'),
    hasCavaliersReprisal: hasRiderFeature(rider, "Cavalier's Reprisal"),
    hasOverrun: hasRiderFeature(rider, 'Overrun')
  }
})

// Mount-side: check if the rider (partner) has Rider class features
const mountRiderFeatures = computed(() => {
  const rider = mountPartner.value
  if (!rider || !isMount.value || rider.type !== 'human') {
    return { hasRiderClass: false }
  }
  return {
    hasRiderClass: hasRiderClass(rider)
  }
})

// Mount has Run Up ability
const mountHasRunUp = computed(() => {
  const mount = mountCombatant.value
  return mount ? hasRunUp(mount) : false
})

// Agility Training active (check mount's tempConditions for 'Agile')
const isAgilityTrainingActive = computed(() => {
  const mount = mountCombatant.value
  if (!mount) return false
  return (mount.tempConditions ?? []).includes('Agile')
})

// Conqueror's March active
const isConquerorsMarchActive = computed(() => {
  const mount = mountCombatant.value
  if (!mount) return false
  return (mount.tempConditions ?? []).includes('ConquerorsMarsh')
})

// Rider's Standard Action already used
const riderStandardUsed = computed(() => {
  const rider = riderCombatant.value
  if (!rider) return true
  return rider.turnState.standardActionUsed
})

// Lean In remaining uses
const leanInRemaining = computed(() => {
  const rider = riderCombatant.value
  if (!rider) return 0
  return getFeatureUsesRemaining(rider, 'Lean In', LEAN_IN_MAX_PER_SCENE)
})

// Overrun remaining uses
const overrunRemaining = computed(() => {
  const rider = riderCombatant.value
  if (!rider) return 0
  return getFeatureUsesRemaining(rider, 'Overrun', OVERRUN_MAX_PER_SCENE)
})

// Rider's current AP
const riderAp = computed(() => {
  const rider = riderCombatant.value
  if (!rider || rider.type !== 'human') return 0
  return (rider.entity as HumanCharacter).currentAp ?? 0
})

// Distance moved this turn (for Run Up display)
const distanceMovedThisTurn = computed(() => {
  const mount = mountCombatant.value
  if (!mount) return 0
  return mount.turnState.distanceMovedThisTurn ?? 0
})

// Run Up damage bonus: floor(distanceMoved / 3)
const runUpBonus = computed(() => Math.floor(distanceMovedThisTurn.value / 3))

// ============================================================
// Actions
// ============================================================

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

const handleToggleAgilityTraining = () => {
  if (!currentCombatant.value) return
  encounterStore.toggleAgilityTraining(currentCombatant.value.id)
  broadcastUpdate()
}

const handleActivateConquerorsMarch = () => {
  const mount = mountCombatant.value
  if (!mount) return
  encounterStore.activateConquerorsMarch(mount.id)
  // Conqueror's March costs a Standard Action (it is an Order)
  if (currentCombatant.value) {
    currentCombatant.value.turnState = {
      ...currentCombatant.value.turnState,
      standardActionUsed: true
    }
  }
  broadcastUpdate()
}

const handleUseLeanIn = () => {
  const rider = riderCombatant.value
  if (!rider) return
  const used = encounterStore.useSceneFeature(rider.id, 'Lean In', LEAN_IN_MAX_PER_SCENE)
  if (!used) {
    alert('Lean In: No uses remaining this scene')
    return
  }
  broadcastUpdate()
}

const handleUseOverrun = () => {
  const rider = riderCombatant.value
  if (!rider) return
  const used = encounterStore.useSceneFeature(rider.id, 'Overrun', OVERRUN_MAX_PER_SCENE)
  if (!used) {
    alert('Overrun: No uses remaining this scene')
    return
  }
  broadcastUpdate()
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

.mount-controls__divider {
  height: 1px;
  background: rgba(100, 200, 255, 0.2);
  margin: 0.25rem 0;
}

.mount-controls__feature-header {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: $color-warning;
}

.mount-controls__feature {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.25rem;
  border-radius: $border-radius-sm;
  background: rgba(255, 200, 50, 0.04);
}

.mount-controls__feature-label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: $color-warning;
}

.mount-controls__feature-desc {
  font-size: 0.65rem;
  color: $color-text-muted;
  line-height: 1.3;
}

.mount-controls__feature-note {
  font-size: 0.65rem;
  color: $color-accent-teal;
  line-height: 1.3;
}

.mount-controls__feature-active {
  font-size: 0.7rem;
  color: $color-success;
  font-weight: 500;
  line-height: 1.3;
}
</style>
