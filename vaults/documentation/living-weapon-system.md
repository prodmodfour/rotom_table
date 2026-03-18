# Living Weapon System

Honedge/Doublade/Aegislash as wielded weapons for trainers.

## Service

`server/services/living-weapon.service.ts` — `engageLivingWeapon`, `disengageLivingWeapon`, `findWieldRelationship`, `isWielded`, `isWielding`, `getWieldedWeapon`, `getWielder`, `updateWieldFaintedState`, `clearWieldOnRemoval`, `meetsSkillRequirement`, `getEffectiveEquipmentBonuses` (equipment overlay for wielding trainers), `refreshCombatantEquipmentBonuses`, `getGrantedWeaponMoves` (rank-filtered), `getEffectiveMoveList` (base + weapon moves injection).

## State Reconstruction

`server/services/living-weapon-state.ts` — `reconstructWieldRelationships` from combatant flags.

## Constants

`constants/livingWeapon.ts` — `LIVING_WEAPON_CONFIG` for Honedge/Doublade/Aegislash, `LIVING_WEAPON_SPECIES`. Weapon moves: Wounding Strike, Double Swipe, Bleed!.

## Detection

`utils/combatantCapabilities.ts` — `getLivingWeaponConfig` (known species + `otherCapabilities` fallback for homebrew).

## Types

`WieldRelationship` in `types/combat.ts` — `wielderId`, `weaponId`, `weaponSpecies`, `isFainted`.

## Combatant Fields

`wieldingWeaponId`, `wieldedByTrainerId`.

## API

- `POST .../living-weapon/engage` — Standard Action; validates turn, action, capability, adjacency, side.
- `POST .../living-weapon/disengage` — Swift Action; validates turn, action, active wield.

Auto-disengage on combatant removal, recall, switch. Per decree-043: Combat Skill Rank gates weapon move access only, not engagement.

## WebSocket

`living_weapon_engage`, `living_weapon_disengage`.

## See also

- [[equipment-system]]
