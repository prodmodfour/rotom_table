/**
 * Composable managing character creation form state.
 *
 * Encapsulates reactive form state, background application logic,
 * stat point tracking, validation warnings, and API payload building
 * for the PTU character creation flow.
 *
 * Reference: PTU Core Chapter 2 (pp. 12-18)
 */

import type { Stats, SkillRank, CharacterType } from '~/types/character'
import type { TrainerBackground } from '~/constants/trainerBackgrounds'
import type { PtuSkillName } from '~/constants/trainerSkills'
import { getDefaultSkills } from '~/constants/trainerSkills'
import { validateStatAllocation, validateSkillBackground } from '~/utils/characterCreationValidation'
import type { CreationWarning } from '~/utils/characterCreationValidation'

export interface StatPoints {
  hp: number
  attack: number
  defense: number
  specialAttack: number
  specialDefense: number
  speed: number
}

/** Base stats for a new trainer (PTU Core p. 15) */
const BASE_HP = 10
const BASE_OTHER = 5
const TOTAL_STAT_POINTS = 10
const MAX_POINTS_PER_STAT = 5

export function useCharacterCreation() {
  const form = reactive({
    // Basic
    name: '',
    characterType: 'npc' as CharacterType,
    level: 1,
    location: '',
    // Background
    backgroundPreset: null as TrainerBackground | null,
    backgroundName: '',
    isCustomBackground: false,
    // Skills
    skills: getDefaultSkills(),
    // Stats
    statPoints: {
      hp: 0,
      attack: 0,
      defense: 0,
      specialAttack: 0,
      specialDefense: 0,
      speed: 0
    } as StatPoints,
    // Notes
    notes: ''
  })

  // --- Stat Point Tracking ---
  const statPointsUsed = computed(() =>
    Object.values(form.statPoints).reduce((sum, v) => sum + v, 0)
  )

  const statPointsRemaining = computed(() => TOTAL_STAT_POINTS - statPointsUsed.value)

  const computedStats = computed((): Stats => ({
    hp: BASE_HP + form.statPoints.hp,
    attack: BASE_OTHER + form.statPoints.attack,
    defense: BASE_OTHER + form.statPoints.defense,
    specialAttack: BASE_OTHER + form.statPoints.specialAttack,
    specialDefense: BASE_OTHER + form.statPoints.specialDefense,
    speed: BASE_OTHER + form.statPoints.speed
  }))

  /** PTU Trainer HP formula: Level * 2 + HP Stat * 3 + 10 */
  const maxHp = computed(() =>
    form.level * 2 + computedStats.value.hp * 3 + 10
  )

  /** Combat evasions derived from stats: floor(stat / 5), capped at +6 (PTU Core p. 16) */
  const evasions = computed(() => ({
    physical: Math.min(6, Math.floor(computedStats.value.defense / 5)),
    special: Math.min(6, Math.floor(computedStats.value.specialDefense / 5)),
    speed: Math.min(6, Math.floor(computedStats.value.speed / 5))
  }))

  // --- Stat Modification ---
  function incrementStat(stat: keyof StatPoints): void {
    if (form.statPoints[stat] >= MAX_POINTS_PER_STAT) return
    if (statPointsRemaining.value <= 0) return
    form.statPoints = {
      ...form.statPoints,
      [stat]: form.statPoints[stat] + 1
    }
  }

  function decrementStat(stat: keyof StatPoints): void {
    if (form.statPoints[stat] <= 0) return
    form.statPoints = {
      ...form.statPoints,
      [stat]: form.statPoints[stat] - 1
    }
  }

  // --- Background Application ---
  function applyBackground(bg: TrainerBackground): void {
    const skills = getDefaultSkills()
    skills[bg.adeptSkill] = 'Adept'
    skills[bg.noviceSkill] = 'Novice'
    for (const s of bg.patheticSkills) {
      skills[s] = 'Pathetic'
    }
    form.skills = skills
    form.backgroundPreset = bg
    form.backgroundName = bg.name
    form.isCustomBackground = false
  }

  function clearBackground(): void {
    form.skills = getDefaultSkills()
    form.backgroundPreset = null
    form.backgroundName = ''
    form.isCustomBackground = false
  }

  function enableCustomBackground(): void {
    form.skills = getDefaultSkills()
    form.backgroundPreset = null
    form.backgroundName = ''
    form.isCustomBackground = true
  }

  /** Set a single skill rank in custom background mode */
  function setSkillRank(skill: PtuSkillName, rank: SkillRank): void {
    form.skills = {
      ...form.skills,
      [skill]: rank
    }
  }

  // --- Validation (soft warnings) ---
  const statWarnings = computed((): CreationWarning[] =>
    validateStatAllocation(form.statPoints, form.level)
  )

  const skillWarnings = computed((): CreationWarning[] =>
    validateSkillBackground(form.skills, form.level)
  )

  const allWarnings = computed((): CreationWarning[] => [
    ...statWarnings.value,
    ...skillWarnings.value
  ])

  // --- API Payload ---
  function buildCreatePayload() {
    return {
      name: form.name,
      characterType: form.characterType,
      level: form.level,
      location: form.location || undefined,
      stats: computedStats.value,
      maxHp: maxHp.value,
      currentHp: maxHp.value,
      skills: form.skills,
      background: form.backgroundName || undefined,
      notes: form.notes || undefined
    }
  }

  return {
    form,
    // Stat tracking
    statPointsUsed,
    statPointsRemaining,
    computedStats,
    maxHp,
    evasions,
    // Stat modification
    incrementStat,
    decrementStat,
    // Background
    applyBackground,
    clearBackground,
    enableCustomBackground,
    setSkillRank,
    // Validation
    statWarnings,
    skillWarnings,
    allWarnings,
    // API
    buildCreatePayload,
    // Constants (exposed for components)
    BASE_HP,
    BASE_OTHER,
    TOTAL_STAT_POINTS,
    MAX_POINTS_PER_STAT
  }
}
