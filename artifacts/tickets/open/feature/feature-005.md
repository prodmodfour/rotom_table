---
id: feature-005
title: Living Weapon System (Honedge Line)
priority: P3
severity: MEDIUM
status: in-progress
domain: combat
source: user-request
created_by: user
created_at: 2026-02-28
design_spec: design-living-weapon-001
---

# feature-005: Living Weapon System (Honedge Line)

## Summary

PTU defines the Living Weapon capability for Honedge, Doublade, and Aegislash (Chapter 10, pp305-306). These Pokemon can be wielded as equipment by trainers — functioning simultaneously as active Pokemon and weapons/shields. The app has no implementation of this mechanic.

## PTU Rules Coverage

### Living Weapon Capability (Ch10 pp305-306)
- **Honedge**: Small Melee Weapon (Simple). Grants Adept Move: **Wounding Strike**
- **Doublade**: Two Small Melee Weapons (Simple). Grants Adept Move: **Double Swipe**. Dual-wielded: +2 Evasion
- **Aegislash**: Small Melee Weapon + Light Shield (Fine). Grants Adept Move: **Wounding Strike** + Master Move: **Bleed!**
- Fainted Living Weapons: still usable as inanimate equipment, -2 penalty to all rolls
- **Shared movement**: wielder and Living Weapon share wielder's Movement Speed; total shift per round capped at wielder's speed
- **Weapon moves added to Pokemon's move list** while wielded (if wielder has requisite Combat rank)
- **Disengage**: Swift Action to separate and fight independently
- **Re-engage**: Standard Action to re-wield
- While wielded: No Guard ability disabled, Aegislash auto-enters Blade forme

### Weapon Moves (Ch9 pp288-290)
DB values include Small Melee Weapon +1 modifier (PTU p.287).
- **Wounding Strike** (Adept): Normal, EOT, AC 2, DB 7 (base 6+1), Physical, WR 1 Target. Target loses a Tick of HP.
- **Double Swipe** (Adept): Normal, EOT, AC 2, DB 5 (base 4+1), Physical, WR 2 Targets or WR 1 Target Double Strike.
- **Bleed!** (Master): Normal, Scene x2, AC 2, DB 10 (base 9+1), Physical, WR 1 Target. Target loses a Tick of HP at start of next 3 turns.

### Related Abilities
- **Weaponize**: While wielded as Living Weapon and actively commanded, may Intercept for wielder as Free Action
- **Soulstealer**: On causing a faint, remove 1 Injury + heal 25% HP. On kill, full heal + remove all Injuries.

### Pokemon With Living Weapon
- **Honedge** (Steel/Ghost): Small, WC 1. Basic: No Guard. Adv: Hyper Cutter, Stall, Weaponize. High: Soulstealer.
- **Doublade** (Steel/Ghost): Small, WC 1. Basic: No Guard. Adv: Hyper Cutter, Stall, Weaponize. High: Soulstealer.
- **Aegislash** (Steel/Ghost): Medium, WC 4. Basic: Stance Change. Adv: Hyper Cutter, Stall, Weaponize. High: Soulstealer.

## Current State

- Living Weapon listed as raw string in `otherCapabilities` — no parsing or effect
- Trainer equipment system (`design-equipment-001`) is trainer-only with static items
- No way to equip a Pokemon into a trainer's Main Hand / Off-Hand slot
- No weapon move (Wounding Strike, Double Swipe, Bleed!) data in the system
- No engage/disengage actions in combat
- No shared movement logic for wielder + Living Weapon pair
- No interaction with existing equipment DR/evasion calculations

## Required Implementation

### Data Model
- Wield relationship tracking (which trainer is wielding which Pokemon)
- Wield state in combat (wielded/independent)
- Living Weapon capability parsing from otherCapabilities
- Weapon move definitions (Wounding Strike, Double Swipe, Bleed!)

### Equipment Integration
- Link Pokemon entity to trainer's Main Hand (+ Off-Hand for Doublade/Aegislash shield)
- Apply weapon bonuses (Small Melee = +1 DB to Struggle)
- Doublade dual-wield +2 Evasion bonus
- Aegislash Light Shield DR integration with existing equipment system
- Fainted Living Weapon: -2 penalty flag

### Combat System
- Engage/Disengage actions (Standard/Swift Action)
- Shared movement for wielder + Living Weapon
- Weapon moves added to Pokemon move list while wielded
- No Guard suppression while wielded
- Aegislash forced Blade forme while wielded
- Weaponize ability: Free Action Intercept for wielder

### UI
- Wield/release buttons in combat and character sheet
- Visual indicator on combatant cards when wielded
- Living Weapon capability callout on Pokemon sheets
- Weapon moves in move list when wielded

## Dependencies

- Overlaps with trainer equipment system (Main Hand / Off-Hand slots)
- May benefit from feature-004 (mounting) shared movement infrastructure
- Weapon moves need MoveData entries or special handling

## Impact

Honedge, Doublade, and Aegislash are popular Pokemon. Without Living Weapon support, they lose their signature mechanic — functioning as both a Pokemon and equipment simultaneously. Trainers with Combat skill ranks cannot access the weapon moves these Pokemon grant.

## Resolution Log

| Date | Action | Details |
|------|--------|---------|
| 2026-02-28 | Design spec created | Full multi-tier design spec: `artifacts/designs/design-living-weapon-001/` (P0: data model + engage/disengage, P1: equipment integration + weapon moves, P2: VTT shared movement + ability interactions) |
| 2026-03-03 | P0 implemented | 14 commits implementing Sections A-D. Files: `app/types/combat.ts`, `app/types/encounter.ts`, `app/constants/livingWeapon.ts`, `app/utils/combatantCapabilities.ts`, `app/server/services/living-weapon.service.ts`, `app/server/services/living-weapon-state.ts`, `app/server/api/encounters/[id]/living-weapon/engage.post.ts`, `app/server/api/encounters/[id]/living-weapon/disengage.post.ts`, `app/server/routes/ws.ts`, `app/server/services/encounter.service.ts`, `app/stores/encounter.ts`, `app/server/api/encounters/[id]/combatants/[combatantId].delete.ts`, `app/server/api/encounters/[id]/recall.post.ts`, `app/server/api/encounters/[id]/switch.post.ts`, `app/server/api/encounters/[id]/damage.post.ts` |
| 2026-03-03 | P0 fix cycle | 8 commits addressing code-review-297 (1C+3H+3M) + rules-review-270 (2H+1M). C1: fixed malformed WS broadcast (c924acb4..d9b6c420). decree-043: removed rank gate from engagement (c924acb4). H2: stale wielder/weapon in response (48123a55, 29e792f4). HIGH#2: initiatorId for either-party action (48123a55). M1: safe homebrew species validation (ecbc2159). M3: action availability checks (48123a55, 29e792f4). MEDIUM#1: turn validation (48123a55, 29e792f4). H1: WS event types + handlers (80b4f5fa). H3: test ticket filed (a5199014). M2: app-surface updated (d9b6c420). |
| 2026-03-04 | P1 implemented | 12 commits implementing Sections E-I. Equipment overlay (computeEffectiveEquipment), weapon move injection (getGrantedWeaponMoves/getEffectiveMoveList per decree-043), Doublade dual-wield +2 evasion, Aegislash Light Shield (+2/+4 evasion, 10 DR readied), fainted -2 penalty, wielder evasion refresh on engage/disengage/faint/heal. Integration into all 4 code paths: combatant builder, initiative calc, damage calc, evasion/move calculation. Files: `app/utils/equipmentBonuses.ts`, `app/server/services/living-weapon.service.ts`, `app/server/services/combatant.service.ts`, `app/server/services/encounter.service.ts`, `app/utils/evasionCalculation.ts`, `app/composables/useMoveCalculation.ts`, `app/server/api/encounters/[id]/calculate-damage.post.ts`, `app/server/api/encounters/[id]/living-weapon/engage.post.ts`, `app/server/api/encounters/[id]/living-weapon/disengage.post.ts`, `app/server/api/encounters/[id]/damage.post.ts`, `app/server/api/encounters/[id]/heal.post.ts`, `app/server/api/encounters/[id]/use-item.post.ts` |
| 2026-03-04 | P1 fix cycle | 6 commits addressing code-review-316 (1H+2M) + rules-review-289 (1H+2M). ca91d05e: fix weapon move DB (+1 Small Melee mod per PTU p.287). 9adc611c: skip STAB for Weapon keyword moves (PTU p.287). 900cd8cb: extract getEffectiveEquipBonuses to shared utility (800-line compliance). 9eebcede: inject weapon moves into GM move selection UI. 1a607b6a: restore wielder evasion on encounter reload. 83797b0e: update app-surface.md. Files: `app/constants/livingWeapon.ts`, `app/composables/useMoveCalculation.ts`, `app/components/encounter/GMActionModal.vue`, `app/components/encounter/MoveButton.vue`, `app/utils/damageCalculation.ts`, `app/utils/equipmentBonuses.ts`, `app/server/services/encounter.service.ts`, `artifacts/designs/design-living-weapon-001/shared-specs.md`, `.claude/skills/references/app-surface.md` |
| 2026-03-04 | P2 implemented | 12 commits implementing Sections J-N + bug-050. J: VTT shared movement (syncWeaponPosition, handleLinkedMovement, getWieldedMovementSpeed, resetWieldMovementPools, position.post.ts linked sync, useGridMovement integration, useEncounterActions local tracking). K: No Guard suppression (isNoGuardActive, -3 AC reduction in calculate-damage.post.ts). L: Aegislash forced Blade forme (swapAegislashStance, engage forces Blade, disengage reverts, wasInBladeFormeOnEngage tracking on Combatant). M: Weaponize Free Action intercept (canUseWeaponize, isWeaponize flag in intercept-melee.post.ts). N: Soulstealer heal on faint (checkSoulstealer, applySoulstealerHealing, integrated in damage.post.ts, move.post.ts, aoo-resolve.post.ts). bug-050: moveKeywords passthrough in calculate-damage.post.ts. Files: `app/types/combat.ts`, `app/types/encounter.ts`, `app/server/services/living-weapon.service.ts`, `app/server/services/living-weapon-state.ts`, `app/server/api/encounters/[id]/calculate-damage.post.ts`, `app/server/api/encounters/[id]/position.post.ts`, `app/server/api/encounters/[id]/damage.post.ts`, `app/server/api/encounters/[id]/move.post.ts`, `app/server/api/encounters/[id]/aoo-resolve.post.ts`, `app/server/api/encounters/[id]/intercept-melee.post.ts`, `app/server/api/encounters/[id]/living-weapon/engage.post.ts`, `app/server/api/encounters/[id]/living-weapon/disengage.post.ts`, `app/composables/useGridMovement.ts`, `app/composables/useEncounterActions.ts` |
