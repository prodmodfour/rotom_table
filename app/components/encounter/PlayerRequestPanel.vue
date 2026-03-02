<template>
  <div v-if="pendingList.length > 0" class="player-requests">
    <div class="player-requests__header">
      <PhUsers :size="18" weight="bold" />
      <span class="player-requests__title">Player Requests</span>
      <span class="player-requests__badge">{{ pendingList.length }}</span>
    </div>

    <div
      v-for="req in pendingList"
      :key="req.requestId"
      class="player-requests__card"
      :class="{ 'player-requests__card--processing': req.status === 'processing' }"
    >
      <div class="player-requests__card-header">
        <span class="player-requests__player">{{ req.playerName }}</span>
        <span class="player-requests__action-type">{{ formatActionType(req.action) }}</span>
        <span class="player-requests__timer">{{ formatTimer(req.receivedAt) }}</span>
      </div>

      <div class="player-requests__details">
        <!-- Capture details -->
        <template v-if="req.action === 'capture'">
          <PhTarget :size="14" />
          Throw {{ req.ballType }} at {{ req.targetPokemonName }}
          <span v-if="req.captureRatePreview != null" class="player-requests__rate">
            (Rate: {{ req.captureRatePreview }}%)
          </span>
        </template>

        <!-- Breather details -->
        <template v-else-if="req.action === 'breather'">
          <PhHeartbeat :size="14" />
          Take a Breather {{ req.assisted ? '(Assisted)' : '(Standard)' }}
        </template>

        <!-- Healing item details -->
        <template v-else-if="req.action === 'use_healing_item'">
          <PhFirstAidKit :size="14" />
          Use {{ req.healingItemName }} on {{ req.healingTargetName }}
        </template>

        <!-- Existing action types -->
        <template v-else-if="req.action === 'use_item'">
          Use item: {{ req.itemName ?? 'Unknown item' }}
        </template>
        <template v-else-if="req.action === 'switch_pokemon'">
          Switch to {{ req.pokemonName ?? 'Unknown Pokemon' }}
        </template>
        <template v-else-if="req.action === 'maneuver'">
          Maneuver: {{ req.maneuverName ?? 'Unknown' }}
        </template>
        <template v-else>
          {{ req.action }}
        </template>
      </div>

      <div class="player-requests__actions">
        <button
          class="btn btn--sm btn--success"
          :disabled="req.status !== 'pending'"
          @click="handleApprove(req)"
        >
          <PhCheck :size="16" weight="bold" />
          Approve
        </button>
        <button
          class="btn btn--sm btn--danger"
          :disabled="req.status !== 'pending'"
          @click="handleDeny(req)"
        >
          <PhX :size="16" weight="bold" />
          Deny
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  PhUsers,
  PhCheck,
  PhX,
  PhTarget,
  PhHeartbeat,
  PhFirstAidKit
} from '@phosphor-icons/vue'
import type { WebSocketEvent } from '~/types'
import type { PlayerActionRequest, PlayerActionType } from '~/types/player-sync'
import { DEFAULT_BALL_TYPE } from '~/constants/pokeBalls'

interface DisplayedRequest {
  requestId: string
  playerId: string
  playerName: string
  action: PlayerActionType
  // Capture fields
  targetPokemonId?: string
  targetPokemonName?: string
  ballType?: string
  captureRatePreview?: number
  trainerCombatantId?: string
  // Breather fields
  combatantId?: string
  assisted?: boolean
  // Healing item fields
  healingItemName?: string
  healingTargetId?: string
  healingTargetName?: string
  // Existing action fields
  itemId?: string
  itemName?: string
  pokemonId?: string
  pokemonName?: string
  maneuverId?: string
  maneuverName?: string
  // Display state
  receivedAt: number
  status: 'pending' | 'processing' | 'resolved'
}

// No props needed — WebSocket server already scopes player_action
// forwarding to the encounter room, so no client-side filtering required.

const emit = defineEmits<{
  'approve-capture': [data: {
    requestId: string
    targetPokemonId: string
    trainerCombatantId: string
    ballType: string
  }]
  'approve-breather': [data: {
    requestId: string
    combatantId: string
    assisted: boolean
  }]
  'approve-healing-item': [data: {
    requestId: string
    healingItemName: string
    healingTargetId: string
    trainerCombatantId: string
  }]
  'approve-generic': [data: {
    requestId: string
    request: DisplayedRequest
  }]
  'deny': [data: {
    requestId: string
    reason: string
  }]
}>()

const { onMessage } = useWebSocket()

// Store pending requests as a reactive Map
const requestMap = ref<Map<string, DisplayedRequest>>(new Map())

// Sorted list of pending (non-resolved) requests, oldest first
const pendingList = computed((): DisplayedRequest[] => {
  return [...requestMap.value.values()]
    .filter(r => r.status !== 'resolved')
    .sort((a, b) => a.receivedAt - b.receivedAt)
})

// Timer update tick — refreshes every second
const now = ref(Date.now())
let timerInterval: ReturnType<typeof setInterval> | null = null

// Request TTL: auto-expire after 60 seconds
const REQUEST_TTL_MS = 60_000

// Listen for incoming player_action WebSocket events
let removeListener: (() => void) | null = null

onMounted(() => {
  removeListener = onMessage((message: WebSocketEvent) => {
    if (message.type !== 'player_action') return

    const data = message.data as PlayerActionRequest
    if (!data.requestId) return

    const displayed: DisplayedRequest = {
      requestId: data.requestId,
      playerId: data.playerId,
      playerName: data.playerName,
      action: data.action,
      targetPokemonId: data.targetPokemonId,
      targetPokemonName: data.targetPokemonName,
      ballType: data.ballType,
      captureRatePreview: data.captureRatePreview,
      trainerCombatantId: data.trainerCombatantId,
      combatantId: data.combatantId,
      assisted: data.assisted,
      healingItemName: data.healingItemName,
      healingTargetId: data.healingTargetId,
      healingTargetName: data.healingTargetName,
      itemId: data.itemId,
      itemName: data.itemName,
      pokemonId: data.pokemonId,
      pokemonName: data.pokemonName,
      maneuverId: data.maneuverId,
      maneuverName: data.maneuverName,
      receivedAt: Date.now(),
      status: 'pending'
    }

    // Immutable update: create new Map with the added entry
    const newMap = new Map(requestMap.value)
    newMap.set(data.requestId, displayed)
    requestMap.value = newMap
  })

  // Start the timer tick
  timerInterval = setInterval(() => {
    now.value = Date.now()
    // Expire stale requests
    pruneExpiredRequests()
  }, 1000)
})

onUnmounted(() => {
  if (removeListener) {
    removeListener()
    removeListener = null
  }
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
})

function pruneExpiredRequests(): void {
  const cutoff = Date.now() - REQUEST_TTL_MS
  let pruned = false
  const newMap = new Map(requestMap.value)
  for (const [id, req] of newMap) {
    if (req.receivedAt < cutoff && req.status === 'pending') {
      newMap.delete(id)
      pruned = true
    }
  }
  if (pruned) {
    requestMap.value = newMap
  }
}

function removeRequest(requestId: string): void {
  const newMap = new Map(requestMap.value)
  newMap.delete(requestId)
  requestMap.value = newMap
}

function markProcessing(requestId: string): void {
  const existing = requestMap.value.get(requestId)
  if (!existing) return
  const newMap = new Map(requestMap.value)
  newMap.set(requestId, { ...existing, status: 'processing' })
  requestMap.value = newMap
}

function markPending(requestId: string): void {
  const existing = requestMap.value.get(requestId)
  if (!existing) return
  const newMap = new Map(requestMap.value)
  newMap.set(requestId, { ...existing, status: 'pending' })
  requestMap.value = newMap
}

function handleApprove(req: DisplayedRequest): void {
  markProcessing(req.requestId)

  try {
    if (req.action === 'capture') {
      emit('approve-capture', {
        requestId: req.requestId,
        targetPokemonId: req.targetPokemonId!,
        trainerCombatantId: req.trainerCombatantId!,
        ballType: req.ballType ?? DEFAULT_BALL_TYPE
      })
    } else if (req.action === 'breather') {
      emit('approve-breather', {
        requestId: req.requestId,
        combatantId: req.combatantId!,
        assisted: req.assisted ?? false
      })
    } else if (req.action === 'use_healing_item') {
      emit('approve-healing-item', {
        requestId: req.requestId,
        healingItemName: req.healingItemName!,
        healingTargetId: req.healingTargetId!,
        trainerCombatantId: req.trainerCombatantId!
      })
    } else {
      emit('approve-generic', {
        requestId: req.requestId,
        request: req
      })
    }

    // Remove from list after emitting (parent handles the actual action + ack)
    removeRequest(req.requestId)
  } catch {
    // Revert to pending on error
    markPending(req.requestId)
  }
}

function handleDeny(req: DisplayedRequest): void {
  emit('deny', {
    requestId: req.requestId,
    reason: ''
  })
  removeRequest(req.requestId)
}

function formatActionType(action: PlayerActionType): string {
  const labels: Record<string, string> = {
    capture: 'Capture',
    breather: 'Breather',
    use_healing_item: 'Healing Item',
    use_item: 'Use Item',
    switch_pokemon: 'Switch',
    maneuver: 'Maneuver',
    use_move: 'Move',
    shift: 'Shift',
    struggle: 'Struggle',
    pass: 'Pass',
    move_token: 'Move Token'
  }
  return labels[action] ?? action
}

function formatTimer(receivedAt: number): string {
  const elapsed = Math.max(0, Math.floor((now.value - receivedAt) / 1000))
  if (elapsed < 60) return `${elapsed}s`
  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60
  return `${minutes}m ${seconds}s`
}
</script>

<style lang="scss" scoped>
.player-requests {
  background: linear-gradient(135deg, rgba($color-info, 0.12) 0%, rgba($color-info, 0.04) 100%);
  border: 1px solid rgba($color-info, 0.35);
  border-radius: $border-radius-md;
  padding: $spacing-md;
  animation: requests-slide-in 0.25s ease-out;

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-bottom: $spacing-md;
    color: $color-info;
  }

  &__title {
    font-weight: 600;
    font-size: $font-size-sm;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  &__badge {
    background: $color-info;
    color: white;
    font-size: $font-size-xs;
    font-weight: 700;
    min-width: 20px;
    height: 20px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 $spacing-xs;
  }

  &__card {
    background: rgba($color-bg-primary, 0.6);
    border: 1px solid $glass-border;
    border-radius: $border-radius-sm;
    padding: $spacing-sm $spacing-md;
    margin-bottom: $spacing-sm;

    &:last-child {
      margin-bottom: 0;
    }

    &--processing {
      opacity: 0.6;
      pointer-events: none;
    }
  }

  &__card-header {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-bottom: $spacing-xs;
  }

  &__player {
    font-weight: 600;
    font-size: $font-size-sm;
    color: $color-text;
  }

  &__action-type {
    font-size: $font-size-xs;
    color: $color-info;
    background: rgba($color-info, 0.15);
    padding: 1px $spacing-xs;
    border-radius: $border-radius-sm;
    font-weight: 500;
  }

  &__timer {
    margin-left: auto;
    font-size: $font-size-xs;
    color: $color-text-muted;
    font-variant-numeric: tabular-nums;
  }

  &__details {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: $font-size-sm;
    color: $color-text-secondary;
    margin-bottom: $spacing-sm;
  }

  &__rate {
    color: $color-warning;
    font-weight: 500;
  }

  &__actions {
    display: flex;
    gap: $spacing-xs;
  }
}

@keyframes requests-slide-in {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
