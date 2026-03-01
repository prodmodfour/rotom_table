import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, readonly, nextTick } from 'vue'

/**
 * T4: Tests for useTrainerXp composable.
 *
 * Validates reactive state management: isProcessing, error, lastResult,
 * pendingLevelUp. Mock $fetch for API calls.
 */

// Mock $fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

// Mock Vue composables used by useTrainerXp
vi.stubGlobal('ref', ref)
vi.stubGlobal('readonly', readonly)

// Import after mocks are set up
import { useTrainerXp } from '~/composables/useTrainerXp'

// Factory for API response
function createApiResponse(overrides: Record<string, unknown> = {}) {
  return {
    success: true,
    data: {
      previousXp: 3,
      previousLevel: 5,
      xpAdded: 4,
      newXp: 7,
      newLevel: 5,
      levelsGained: 0,
      character: { id: 'char-1', name: 'Ash' },
      ...overrides
    }
  }
}

describe('useTrainerXp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with default state', () => {
    const { isProcessing, error, lastResult, pendingLevelUp } = useTrainerXp()
    expect(isProcessing.value).toBe(false)
    expect(error.value).toBeNull()
    expect(lastResult.value).toBeNull()
    expect(pendingLevelUp.value).toBeNull()
  })

  it('sets isProcessing during API call', async () => {
    let resolvePromise: (value: unknown) => void
    const deferredPromise = new Promise((resolve) => {
      resolvePromise = resolve
    })
    mockFetch.mockReturnValueOnce(deferredPromise)

    const { awardXp, isProcessing } = useTrainerXp()

    const promise = awardXp('char-1', 4)
    expect(isProcessing.value).toBe(true)

    resolvePromise!(createApiResponse())
    await promise
    expect(isProcessing.value).toBe(false)
  })

  it('sets lastResult after successful award', async () => {
    mockFetch.mockResolvedValueOnce(createApiResponse({
      previousXp: 3,
      previousLevel: 5,
      xpAdded: 4,
      newXp: 7,
      newLevel: 5,
      levelsGained: 0
    }))

    const { awardXp, lastResult } = useTrainerXp()
    const result = await awardXp('char-1', 4)

    expect(result.newXp).toBe(7)
    expect(result.newLevel).toBe(5)
    expect(result.levelsGained).toBe(0)
    expect(lastResult.value).toEqual(result)
  })

  it('sets pendingLevelUp when levelsGained > 0', async () => {
    mockFetch.mockResolvedValueOnce(createApiResponse({
      previousXp: 8,
      previousLevel: 5,
      xpAdded: 5,
      newXp: 3,
      newLevel: 6,
      levelsGained: 1
    }))

    const { awardXp, pendingLevelUp } = useTrainerXp()
    await awardXp('char-1', 5)

    expect(pendingLevelUp.value).toEqual({
      oldLevel: 5,
      newLevel: 6
    })
  })

  it('does not set pendingLevelUp when levelsGained === 0', async () => {
    mockFetch.mockResolvedValueOnce(createApiResponse({
      levelsGained: 0
    }))

    const { awardXp, pendingLevelUp } = useTrainerXp()
    await awardXp('char-1', 4)

    expect(pendingLevelUp.value).toBeNull()
  })

  it('clearPendingLevelUp resets the ref', async () => {
    mockFetch.mockResolvedValueOnce(createApiResponse({
      previousLevel: 5,
      newLevel: 6,
      levelsGained: 1
    }))

    const { awardXp, pendingLevelUp, clearPendingLevelUp } = useTrainerXp()
    await awardXp('char-1', 5)

    expect(pendingLevelUp.value).not.toBeNull()
    clearPendingLevelUp()
    expect(pendingLevelUp.value).toBeNull()
  })

  it('deductXp calls awardXp with negative amount', async () => {
    mockFetch.mockResolvedValueOnce(createApiResponse({
      xpAdded: -3,
      newXp: 4
    }))

    const { deductXp } = useTrainerXp()
    await deductXp('char-1', 3)

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/characters/char-1/xp',
      {
        method: 'POST',
        body: { amount: -3, reason: undefined }
      }
    )
  })

  it('deductXp ensures negative regardless of sign', async () => {
    mockFetch.mockResolvedValueOnce(createApiResponse({
      xpAdded: -5,
      newXp: 2
    }))

    const { deductXp } = useTrainerXp()
    await deductXp('char-1', -5) // Already negative

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/characters/char-1/xp',
      {
        method: 'POST',
        body: { amount: -5, reason: undefined }
      }
    )
  })

  it('sets error on API failure', async () => {
    const apiError = new Error('Server error')
    mockFetch.mockRejectedValueOnce(apiError)

    const { awardXp, error, isProcessing } = useTrainerXp()

    await expect(awardXp('char-1', 4)).rejects.toThrow('Server error')

    expect(error.value).toBe('Server error')
    expect(isProcessing.value).toBe(false)
  })

  it('passes reason to API', async () => {
    mockFetch.mockResolvedValueOnce(createApiResponse())

    const { awardXp } = useTrainerXp()
    await awardXp('char-1', 3, 'Encounter reward')

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/characters/char-1/xp',
      {
        method: 'POST',
        body: { amount: 3, reason: 'Encounter reward' }
      }
    )
  })
})
