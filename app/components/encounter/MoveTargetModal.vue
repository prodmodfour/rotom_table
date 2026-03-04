<template>
  <div class="modal-overlay" @click.self="$emit('cancel')">
    <div class="modal">
      <div class="modal__header">
        <h2>{{ move.name }}</h2>
        <span class="type-badge" :class="`type-badge--${move.type?.toLowerCase() || 'normal'}`">
          {{ move.type }}
        </span>
        <span v-if="hasSTAB" class="stab-badge">STAB</span>
      </div>

      <div class="modal__body">
        <!-- Move Info -->
        <div class="move-info">
          <div class="move-info__stat">
            <span class="label">Class:</span>
            <span>{{ move.damageClass }}</span>
          </div>
          <div v-if="move.damageBase" class="move-info__stat">
            <span class="label">DB:</span>
            <span>{{ move.damageBase }}{{ hasSTAB ? ' → ' + effectiveDB : '' }}</span>
          </div>
          <div v-if="move.ac" class="move-info__stat">
            <span class="label">AC:</span>
            <span>{{ move.ac }}</span>
          </div>
          <div class="move-info__stat">
            <span class="label">Range:</span>
            <span>{{ move.range }}</span>
          </div>
          <div v-if="move.damageBase && attackStatValue" class="move-info__stat">
            <span class="label">{{ attackStatLabel }}:</span>
            <span>{{ attackStatValue }}</span>
          </div>
          <div v-if="attackerAccuracyStage !== 0" class="move-info__stat">
            <span class="label">Accuracy:</span>
            <span :class="attackerAccuracyStage > 0 ? 'stat-boost' : 'stat-drop'">
              {{ attackerAccuracyStage > 0 ? '+' : '' }}{{ attackerAccuracyStage }}
            </span>
          </div>
        </div>

        <div v-if="move.effect" class="move-effect">
          {{ move.effect }}
        </div>

        <!-- Target Selection -->
        <div class="target-selection">
          <h4>Select Target(s)</h4>
          <div class="target-list">
            <button
              v-for="target in targets"
              :key="target.id"
              class="target-btn"
              :class="{
                'target-btn--selected': selectedTargets.includes(target.id),
                'target-btn--ally': target.side === 'players' || target.side === 'allies',
                'target-btn--enemy': target.side === 'enemies',
                'target-btn--hit': accuracyResults[target.id]?.hit,
                'target-btn--miss': accuracyResults[target.id] && !accuracyResults[target.id].hit,
                'target-btn--out-of-range': !isTargetInRange(target.id)
              }"
              :disabled="!isTargetInRange(target.id)"
              @click="handleToggleTarget(target.id)"
            >
              <div class="target-btn__main">
                <span class="target-btn__name">{{ getTargetName(target) }}</span>
                <span v-if="!isTargetInRange(target.id)" class="target-btn__range-info">
                  {{ getOutOfRangeReason(target.id) }}
                </span>
                <span v-else class="target-btn__hp">{{ target.entity.currentHp }}/{{ target.entity.maxHp }}</span>
              </div>
              <!-- Accuracy result display -->
              <div v-if="selectedTargets.includes(target.id) && accuracyResults[target.id]" class="target-btn__accuracy">
                <span class="accuracy-roll">
                  d20: {{ accuracyResults[target.id].roll }}
                  <span v-if="accuracyResults[target.id].isNat20" class="crit-badge">NAT 20!</span>
                  <span v-if="accuracyResults[target.id].isNat1" class="fumble-badge">NAT 1</span>
                </span>
                <span class="accuracy-threshold">vs {{ accuracyResults[target.id].threshold }}</span>
                <span
                  class="accuracy-result"
                  :class="accuracyResults[target.id].hit ? 'accuracy-result--hit' : 'accuracy-result--miss'"
                >
                  {{ accuracyResults[target.id].hit ? 'HIT' : 'MISS' }}
                </span>
              </div>
              <!-- Evasion preview before accuracy roll -->
              <div v-else-if="selectedTargets.includes(target.id) && move.ac && !hasRolledAccuracy" class="target-btn__evasion">
                <span class="evasion-label">{{ getTargetEvasionLabel(target.id) }}:</span>
                <span class="evasion-value">+{{ getTargetEvasion(target.id) }}</span>
                <span class="evasion-threshold">→ Need {{ getAccuracyThreshold(target.id) }}+</span>
              </div>
              <!-- Damage preview (only for hits) -->
              <div v-if="selectedTargets.includes(target.id) && hasRolledDamage && targetDamageCalcs[target.id] && (accuracyResults[target.id]?.hit || !move.ac)" class="target-btn__damage-preview">
                <span
                  class="effectiveness-badge"
                  :class="'effectiveness-badge--' + targetDamageCalcs[target.id].effectivenessClass"
                >
                  {{ targetDamageCalcs[target.id].effectivenessText }}
                </span>
                <span class="target-btn__final-damage">
                  {{ targetDamageCalcs[target.id].finalDamage }} dmg
                </span>
              </div>
            </button>
          </div>
        </div>

        <!-- Accuracy Section (for moves with AC) -->
        <div v-if="move.ac && selectedTargets.length > 0" class="accuracy-section">
          <div class="accuracy-section__header">
            <span class="accuracy-section__label">
              Accuracy Check (AC {{ move.ac }})
            </span>
            <span v-if="attackerAccuracyStage !== 0" class="accuracy-section__modifier">
              {{ attackerAccuracyStage > 0 ? '+' : '' }}{{ attackerAccuracyStage }} Accuracy
            </span>
            <span v-if="environmentAccuracyPenalty > 0" class="accuracy-section__modifier accuracy-section__modifier--env">
              +{{ environmentAccuracyPenalty }} Environment
            </span>
          </div>

          <div v-if="!hasRolledAccuracy" class="accuracy-section__roll-prompt">
            <button class="btn btn--primary btn--roll" @click="rollAccuracy">
              Roll Accuracy
            </button>
          </div>

          <div v-else class="accuracy-section__result">
            <div class="accuracy-summary">
              <span class="accuracy-summary__hits">{{ hitCount }} Hit{{ hitCount !== 1 ? 's' : '' }}</span>
              <span class="accuracy-summary__separator">/</span>
              <span class="accuracy-summary__misses">{{ missCount }} Miss{{ missCount !== 1 ? 'es' : '' }}</span>
            </div>
            <button class="btn btn--secondary btn--sm" @click="rollAccuracy">
              Reroll Accuracy
            </button>
          </div>
        </div>

        <!-- Damage Section -->
        <div v-if="fixedDamage && canShowDamageSection" class="damage-section damage-section--fixed">
          <span class="damage-section__label">Fixed Damage:</span>
          <span class="damage-section__value">{{ fixedDamage }}</span>
          <span class="damage-section__note">(ignores stats & type effectiveness)</span>
        </div>

        <div v-else-if="move.damageBase && canShowDamageSection" class="damage-section">
          <div class="damage-section__header">
            <span class="damage-section__label">
              Damage (DB {{ effectiveDB }}{{ hasSTAB ? ' with STAB' : '' }}):
            </span>
            <span class="damage-section__notation">{{ damageNotation }}</span>
          </div>

          <div v-if="!hasRolledDamage" class="damage-section__roll-prompt">
            <button class="btn btn--primary btn--roll" @click="rollDamage">
              Roll Damage
            </button>
          </div>

          <div v-else class="damage-section__result">
            <div class="damage-breakdown">
              <div class="damage-breakdown__row">
                <span class="damage-breakdown__label">Base Roll:</span>
                <span class="damage-breakdown__value">{{ damageRollResult?.total }}</span>
                <span class="damage-breakdown__detail">{{ damageRollResult?.breakdown }}</span>
              </div>
              <div class="damage-breakdown__row">
                <span class="damage-breakdown__label">+ {{ attackStatLabel }}:</span>
                <span class="damage-breakdown__value">{{ attackStatValue }}</span>
              </div>
              <div class="damage-breakdown__row damage-breakdown__row--total">
                <span class="damage-breakdown__label">Pre-Defense Total:</span>
                <span class="damage-breakdown__value">{{ preDefenseTotal }}</span>
              </div>
            </div>
            <button class="btn btn--secondary btn--sm" @click="rollDamage">
              Reroll
            </button>
          </div>

          <!-- Per-target damage breakdown (after rolling, only for hits) -->
          <div v-if="hasRolledDamage && hitTargets.length > 0" class="target-damages">
            <h4>Damage Per Target</h4>
            <div
              v-for="targetId in hitTargets"
              :key="targetId"
              class="target-damage-row"
            >
              <span class="target-damage-row__name">{{ getTargetNameById(targetId) }}</span>
              <div class="target-damage-row__calc" v-if="targetDamageCalcs[targetId]">
                <span class="target-damage-row__step">{{ preDefenseTotal }}</span>
                <span class="target-damage-row__op">−</span>
                <span class="target-damage-row__step">{{ targetDamageCalcs[targetId].defenseStat }} {{ defenseStatLabel }}</span>
                <span class="target-damage-row__op">×</span>
                <span
                  class="target-damage-row__step effectiveness-badge"
                  :class="'effectiveness-badge--' + targetDamageCalcs[targetId].effectivenessClass"
                >
                  {{ targetDamageCalcs[targetId].effectiveness }}
                </span>
                <span class="target-damage-row__op">=</span>
                <span class="target-damage-row__result">{{ targetDamageCalcs[targetId].finalDamage }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Miss message when all targets missed -->
        <div v-if="hasRolledAccuracy && hitCount === 0" class="miss-message">
          All targets evaded the attack!
        </div>
      </div>

      <div class="modal__footer">
        <button class="btn btn--secondary" @click="$emit('cancel')">Cancel</button>
        <button
          class="btn btn--primary"
          :disabled="!canConfirm"
          @click="confirm"
        >
          Use {{ move.name }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Move, Combatant } from '~/types'
import type { DiceRollResult } from '~/utils/diceRoller'
import { useFlankingDetection } from '~/composables/useFlankingDetection'

const { getCombatantName } = useCombatantDisplay()
const encounterStore = useEncounterStore()

const props = defineProps<{
  move: Move
  actor: Combatant
  targets: Combatant[]
}>()

const emit = defineEmits<{
  confirm: [targetIds: string[], damage?: number, rollResult?: DiceRollResult, targetDamages?: Record<string, number>]
  cancel: []
}>()

// Convert props to refs for the composable
const moveRef = toRef(props, 'move')
const actorRef = toRef(props, 'actor')
const targetsRef = toRef(props, 'targets')

// Full encounter combatant list for decree-003 rough terrain penalty check.
// The targets prop is the selectable target list, but allCombatants must include
// every combatant on the grid so non-target enemies are visible for LoS checks.
const allEncounterCombatants = computed((): Combatant[] =>
  encounterStore.encounter?.combatants ?? []
)

// Flanking detection for evasion penalty (PTU p.232)
// Intentional separate instance: MoveTargetModal is rendered by GMActionModal,
// not as a child of GridCanvas, so it cannot access GridCanvas's exposed
// getFlankingPenalty. The computed chain is lightweight (O(n^2) over ~4-10
// combatants) and this also provides correct behavior in non-VTT encounters.
const { getFlankingPenalty } = useFlankingDetection(allEncounterCombatants)

// Use the extracted composable for all calculations
const {
  // State
  selectedTargets,
  damageRollResult,
  hasRolledDamage,
  hasRolledAccuracy,
  accuracyResults,
  // Range & LoS filtering
  targetRangeStatus,
  // STAB
  hasSTAB,
  effectiveDB,
  // Accuracy
  attackerAccuracyStage,
  getTargetEvasion,
  getTargetEvasionLabel,
  getAccuracyThreshold,
  environmentAccuracyPenalty,
  rollAccuracy,
  hitCount,
  missCount,
  hitTargets,
  canShowDamageSection,
  // Damage
  attackStatValue,
  attackStatLabel,
  defenseStatLabel,
  preDefenseTotal,
  fixedDamage,
  damageNotation,
  targetDamageCalcs,
  rollDamage,
  // Target selection
  toggleTarget,
  getTargetNameById,
  // Confirmation
  canConfirm,
  getConfirmData
} = useMoveCalculation(moveRef, actorRef, targetsRef, allEncounterCombatants, {
  getFlankingPenalty
})

// Helper to check if a target is in range
const isTargetInRange = (targetId: string): boolean => {
  return targetRangeStatus.value[targetId]?.inRange !== false
}

// Helper to get out-of-range reason for a target
const getOutOfRangeReason = (targetId: string): string => {
  return targetRangeStatus.value[targetId]?.reason ?? 'Out of range'
}

// Wrap toggleTarget to prevent selecting out-of-range targets
const handleToggleTarget = (targetId: string) => {
  if (!isTargetInRange(targetId)) return
  toggleTarget(targetId)
}

// Use shared composable for name resolution
const getTargetName = getCombatantName

const confirm = () => {
  const data = getConfirmData()
  emit('confirm', data.targetIds, data.damage, data.rollResult, data.targetDamages)
}
</script>

<style lang="scss" scoped>
@import '~/assets/scss/components/move-target-modal';
</style>
