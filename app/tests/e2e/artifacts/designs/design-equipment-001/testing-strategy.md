# Testing Strategy

## Test Plan

### P0 Tests
- [ ] `computeEquipmentBonuses()` unit test: empty equipment returns all zeros
- [ ] `computeEquipmentBonuses()` unit test: Light Armor -> DR 5, no evasion
- [ ] `computeEquipmentBonuses()` unit test: Heavy Armor -> DR 10, speedDefaultCS -1
- [ ] `computeEquipmentBonuses()` unit test: Light Shield -> evasion +2
- [ ] `computeEquipmentBonuses()` unit test: Multiple items aggregate correctly (armor + shield + focus)
- [ ] `computeEquipmentBonuses()` unit test: Helmet conditional DR tracked separately
- [ ] `PUT /api/characters/:id/equipment` equips item correctly
- [ ] `PUT /api/characters/:id/equipment` unequips item (null) correctly
- [ ] `PUT /api/characters/:id/equipment` rejects mismatched slot
- [ ] `GET /api/characters/:id/equipment` returns current equipment + bonuses

### P1 Tests
- [ ] E2E: Trainer with Light Armor takes reduced damage (DR 5 auto-applied)
- [ ] E2E: Trainer with Heavy Armor has DR 10 and Speed CS starts at -1
- [ ] E2E: Trainer with Light Shield has +2 evasion reflected in accuracy threshold
- [ ] E2E: Trainer with Focus (Attack) gets +5 attack after stage multiplier in damage calc
- [ ] E2E: Trainer with Helmet gets 15 extra DR on critical hits only
- [ ] E2E: "Take a Breather" resets Speed CS to -1 (not 0) for Heavy Armor wearer
- [ ] E2E: Equipment bonuses correctly zero out for Pokemon combatants (no equipment system for Pokemon)

### P2 Tests
- [ ] Equipment tab renders all 6 slots
- [ ] Equipping an item from catalog dropdown updates the slot
- [ ] Removing an item clears the slot
- [ ] Combat bonuses summary updates reactively

---

