---
last_updated: 2026-03-05T23:30:00
updated_by: slave-collector (plan-1772711294)
---

# Matrix Ecosystem State

## Domain Progress

| Domain | Rules | Capabilities | Matrix | Audit | Tickets | Coverage |
|--------|-------|-------------|--------|-------|---------|----------|
| combat | done (135) | **FRESH** (session 120) | stale | stale | created | 71.9% (stale) |
| capture | done (33) | **FRESH** (session 120) | stale | stale | created | 70.3% (stale) |
| healing | done (42) | **FRESH** (session 120) | stale | stale | created | 65.0% (stale) |
| pokemon-lifecycle | done (68) | **FRESH** (session 120) | stale | stale | created | 72.2% (stale) |
| character-lifecycle | done (68) | **FRESH** (session 120) | stale | stale | created | 73.3% (stale) |
| encounter-tables | done (27) | **FRESH** (session 120) | stale | stale | created | 77.5% (stale) |
| scenes | done (42) | **FRESH** (session 120) | stale | stale | created | 70.0% (stale) |
| vtt-grid | done (42) | **FRESH** (session 120) | stale | stale | created | 65.3% (stale) |
| player-view | — | **FRESH** (session 120) | — | — | — | — (first-time mapping) |

**Overall: Capabilities re-mapped in session 120 (plan-1772711294, slaves 2-9). Matrix + Audit remain stale from session 59 (2026-02-28). Coverage percentages are stale — need matrix re-analysis against fresh capabilities. Sessions 12–120 added major new implementations (equipment, XP, character creation, isometric grid, player view, condition source tracking, Sprint, Snow Boots, Permafrost, fainted recall exemption).**

## Active Work

Session 120 (plan-1772711294) re-mapped all 8 domain capabilities. Matrix/Audit pipeline is next.

## Staleness Status

Capabilities are now **FRESH** for all 8 domains + player-view. Matrix and Audit columns are stale — they were last run in session 59 against old capability sets. Coverage percentages are outdated.

### Code changes since last matrix/audit (sessions 12–120)

**combat domain:**
- ptu-rule-045 P0+P1+P2: Equipment system (DR, evasion, Focus bonuses, Heavy Armor speed, equipment UI)
- ptu-rule-077: Focus (Speed) stat bonuses for initiative + evasion
- ptu-rule-079: Helmet conditional DR stacking
- ptu-rule-121: Sprint action consumption
- ptu-rule-126: Snow Boots conditional speed penalty
- ptu-rule-130: Fainted recall+release League exemption
- ptu-rule-133: Permafrost weather damage reduction
- refactoring-129: Condition source-tracking (ConditionInstance, source-aware clearing)

**pokemon-lifecycle domain:**
- ptu-rule-055 P1+P2: XP distribution modal, level-up notifications

**character-lifecycle domain:**
- ptu-rule-056 P1+P2: Trainer class creation, biography fields
- ptu-rule-078: Trainer class associatedSkills corrections
- ptu-rule-080: Level-aware stat/skill/edge validation
- feature-001 P0: Trainer sprites catalog (180 sprites)

**encounter-tables domain:**
- ptu-rule-058 P0+P1: Density separation, significance tiers
- ptu-rule-060 P0+P1: Encounter budgets, significance presets
- ptu-rule-125: Equipment grantedCapabilities

**vtt-grid domain:**
- feature-002 P0+P1+P2: Isometric grid, camera controls, overlays, fog of war, terrain painting, measurement modes

**player-view domain (NEW):**
- feature-003 Track A P0: Player identity, combat actions, encounter view
- feature-003 Track B P0: JSON export/import, server-info endpoint
- feature-003 Track C P0: WebSocket sync, player scene view, keepalive

## Audit Correction

- **combat-R010** (evasion CS treatment): Should be reclassified as "Correct" on next re-audit per rules-review-102.

## Recommended Next Steps

1. Re-run Matrix analysis against fresh capabilities for all 8 domains
2. Re-run Audit against updated matrices
3. Create M2 tickets from audit findings
4. player-view domain needs rules catalog before matrix can be built
