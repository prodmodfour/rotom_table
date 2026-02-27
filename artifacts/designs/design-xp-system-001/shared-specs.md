# Shared Specifications

## Data Flow Diagram

```
COMBAT PHASE (existing):
  damage.post.ts -> faint detected -> push to defeatedEnemies[]
                                          |
                                          v
END ENCOUNTER (P0+P1):
  GM clicks "End Encounter"
       |
       v
  defeatedEnemies.length > 0?
       |yes                    |no
       v                       v
  XpDistributionModal      End encounter
  (P1, fallback: API only)    normally
       |
       v
  xp-calculate (preview)
       |
       v
  GM sets multiplier, distribution
       |
       v
  xp-distribute (apply)
       |
       v
  Pokemon DB updated (experience, level, tutorPoints)
       |
       v
  Level-up results displayed (P2)
       |
       v
  End encounter proceeds (existing end.post.ts flow)
```

---


## Edge Cases & Design Decisions

### 1. Trainer enemies in defeatedEnemies
The current `damage.post.ts` pushes `{ species, level }` when any enemy faints. To distinguish trainers (2x level for XP), we add `type: 'pokemon' | 'human'` to the defeated entry. The combatant already has a `type` field we can read.

### 2. Rounding
XP values are always rounded down (floor) after division. Fractional XP is discarded per PTU convention.

### 3. Pokemon used by multiple trainers
Edge case: a Pokemon is traded mid-combat. For simplicity, the distribution UI lists all player-side Pokemon that were in the encounter. The GM manually assigns XP regardless of ownership changes.

### 4. Empty defeatedEnemies
If the encounter ends with no defeated enemies (e.g., the party fled), skip the XP modal entirely.

### 5. Already-ended encounters
The `xp-calculate` and `xp-distribute` endpoints work on any encounter (active or ended). This lets the GM distribute XP after the fact if they forgot during the end flow.

### 6. Max level cap
Pokemon cannot exceed Level 100. If XP would push past Level 100, cap experience at `EXPERIENCE_CHART[100]` (20,555).

### 7. Negative XP
Never allow negative XP distribution. Validate `xpAmount >= 0` on the server.

### 8. Re-distribution
The distribute endpoint is idempotent in the sense that it adds XP to current values. If the GM accidentally distributes twice, the Pokemon gets double XP. To prevent this, the endpoint should record that XP was distributed for this encounter (add a `xpDistributed: boolean` field to the Encounter model in P1, used as a warning but not a hard block).

---


## Files Changed Summary

### P0 (XP Calculation + Distribution API)
| Action | File | Description |
|--------|------|-------------|
| **NEW** | `app/utils/experienceCalculation.ts` | Pure XP calculation functions + experience chart |
| **NEW** | `app/server/api/encounters/[id]/xp-calculate.post.ts` | Preview XP calculation endpoint |
| **NEW** | `app/server/api/encounters/[id]/xp-distribute.post.ts` | Apply XP to Pokemon endpoint |
| **EDIT** | `app/server/api/encounters/[id]/damage.post.ts` | Add `type` field to defeatedEnemies entries |
| **EDIT** | `app/types/encounter.ts` | Extend `defeatedEnemies` type with `isTrainer` flag |
| **NEW** | `app/tests/unit/utils/experienceCalculation.test.ts` | Unit tests for pure functions |

### P1 (XP Distribution UI)
| Action | File | Description |
|--------|------|-------------|
| **NEW** | `app/components/encounter/XpDistributionModal.vue` | Post-combat XP distribution modal |
| **EDIT** | `app/pages/gm/index.vue` | Replace `confirm()` with XP modal on end encounter |
| **EDIT** | `app/stores/encounter.ts` | Add `calculateXp()` and `distributeXp()` actions |
| **EDIT** | `app/prisma/schema.prisma` | Add `xpDistributed` boolean to Encounter (optional safety flag) |

### P2 (Level-Up Automation)
| Action | File | Description |
|--------|------|-------------|
| **NEW** | `app/components/encounter/LevelUpNotification.vue` | Level-up results display |
| **NEW** | `app/server/api/pokemon/[id]/add-experience.post.ts` | Standalone XP add endpoint (for training, manual GM grants) |
| **EDIT** | `app/components/encounter/XpDistributionModal.vue` | Show level-up results after distribution |

---

