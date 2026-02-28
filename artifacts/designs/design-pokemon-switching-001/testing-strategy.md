# Testing Strategy

## Unit Tests (P0)

### `app/tests/unit/services/switching-service.test.ts`

**Range Check (`checkRecallRange`):**
- Returns `inRange: true` when distance is exactly 8m
- Returns `inRange: true` when distance is less than 8m
- Returns `inRange: false` when distance exceeds 8m
- Uses PTU diagonal distance (alternating 1m/2m diagonals)
- Distance of 6 diagonal cells = 9m (1+2+1+2+1+2) -> out of range
- Distance of 5 diagonal cells = 7m (1+2+1+2+1) -> in range
- Returns `inRange: true` for League Battles regardless of distance
- Returns `inRange: true` when either position is undefined (gridless play)
- Returns `inRange: true` when both positions are undefined

**Turn Order Insertion (`insertIntoTurnOrder` — Full Contact):**
- Inserts new combatant at correct position among unacted combatants (descending initiative)
- Does not modify acted portion of turn order (slots before currentTurnIndex)
- New combatant with highest initiative among unacted goes first
- New combatant with lowest initiative among unacted goes last
- Handles ties via initiativeRollOff
- Does not change currentTurnIndex
- Single-combatant turn order: new combatant inserted after current
- Empty unacted portion: new combatant added at end

**Turn Order Insertion (`insertIntoTurnOrder` — League Battle):**
- Inserts into `pokemonTurnOrder` (not `trainerTurnOrder`)
- During trainer phase: does not modify current `turnOrder` (Pokemon phase hasn't started)
- During pokemon phase: inserts into current `turnOrder` among unacted Pokemon
- During pokemon phase: preserves acted Pokemon positions
- `pokemonTurnOrder` (stored) is updated regardless of current phase
- `trainerTurnOrder` is never modified by Pokemon insertion

**Combatant Removal (`removeCombatantFromEncounter`):**
- Removes combatant from combatants array
- Removes from turnOrder, trainerTurnOrder, pokemonTurnOrder
- Adjusts currentTurnIndex when removed combatant was before current position
- Adjusts currentTurnIndex when it would exceed turn order length
- Does not adjust currentTurnIndex when removed combatant was after current position
- Handles removal of a combatant not in turn order (graceful no-op for that order)

**Action Marking (`markActionUsed`):**
- Sets `standardActionUsed = true` for 'standard' type
- Sets `shiftActionUsed = true` for 'shift' type
- Does not modify other turnState fields

### `app/tests/unit/api/switch.test.ts`

**Validation:**
- Rejects switch when encounter is not active
- Rejects switch when trainer combatant not found
- Rejects switch when recalled Pokemon combatant not found
- Rejects switch when recalled Pokemon does not belong to trainer
- Rejects switch when released Pokemon entity not found in DB
- Rejects switch when released Pokemon does not belong to trainer
- Rejects switch when released Pokemon is already in the encounter
- Rejects switch when released Pokemon is fainted (currentHp = 0)
- Rejects switch when recalled Pokemon is out of range (>8m, Full Contact)
- Allows switch when recalled Pokemon is out of range (League Battle — always in range)
- Rejects switch when Standard Action is already used (trainer turn)
- Rejects switch when Standard Action is already used (Pokemon turn)
- Rejects switch when it is not the trainer's or Pokemon's turn

**Execution (Full Contact):**
- Recalled Pokemon is removed from combatants array
- Recalled Pokemon is removed from turnOrder
- Released Pokemon is added to combatants array
- Released Pokemon is placed at recalled Pokemon's grid position
- Released Pokemon is inserted into turnOrder at correct initiative position
- Standard Action is marked as used on the initiating combatant
- SwitchAction record is added to switchActions array
- Response includes switchDetails with correct data

**Execution (League Battle):**
- Same as Full Contact, plus:
- Released Pokemon has `canBeCommanded = false` (League restriction)
- Released Pokemon is inserted into `pokemonTurnOrder`

**State persistence:**
- Updated combatants are serialized to DB
- Updated turnOrder is serialized to DB
- Updated switchActions are serialized to DB
- Response encounter matches DB state

### `app/tests/unit/stores/encounter-switch.test.ts`

- `switchPokemon` action calls correct API endpoint with all parameters
- `switchPokemon` updates local encounter state on success
- `switchPokemon` sets error on failure
- `switchPokemon` passes optional parameters (faintedSwitch, forced, releasePosition)

### `app/tests/unit/composables/useSwitching.test.ts`

- `canSwitch` returns `{ allowed: true }` when all conditions met
- `canSwitch` returns `{ allowed: false }` when not the combatant's turn
- `canSwitch` returns `{ allowed: false }` when Standard Action already used
- `canSwitch` returns `{ allowed: false }` when no active encounter
- `getBenchPokemon` filters out Pokemon already in encounter
- `getBenchPokemon` filters out fainted Pokemon
- `getBenchPokemon` filters out archived Pokemon (isInLibrary = false)

---

## Unit Tests (P1)

### `app/tests/unit/api/switch-league.test.ts`

**League Restriction:**
- Switched Pokemon has `canBeCommanded = false` in League Battle (voluntary switch)
- Switched Pokemon has `canBeCommanded = true` in League Battle (fainted switch)
- Switched Pokemon has `canBeCommanded = true` in League Battle (forced switch)
- Switched Pokemon has `canBeCommanded = true` in Full Contact (no League restriction)

**Fainted Switch:**
- Accepts fainted switch when recalled Pokemon has 0 HP
- Rejects fainted switch when recalled Pokemon has >0 HP
- Fainted switch costs Shift Action (not Standard)
- Rejects fainted switch when Shift Action already used
- Fainted switch records `actionType: 'fainted_switch'` in switchActions
- Fainted switch records `actionCost: 'shift'` in switchActions

**Forced Switch:**
- Forced switch does not consume any action
- Forced switch exempts from League restriction
- Forced switch records `actionType: 'forced_switch'` in switchActions

### `app/tests/unit/api/next-turn-switch-skip.test.ts`

- Auto-skips Pokemon with `canBeCommanded = false` during Pokemon phase
- Does not skip Pokemon with `canBeCommanded = true`
- Skipped Pokemon has `hasActed = true` after skip
- Multiple uncommandable Pokemon are all skipped
- `canBeCommanded` resets to `true` on new round
- Interaction with fainted skip: fainted Pokemon skipped first, then uncommandable

---

## Unit Tests (P2)

### `app/tests/unit/api/recall.test.ts`

- Single recall costs Shift Action
- Double recall costs Standard Action
- Rejects recall of >2 Pokemon
- Rejects recall of Pokemon not belonging to trainer
- Rejects recall of Pokemon out of range (Full Contact)
- Recalled Pokemon removed from combatants and all turn orders
- SwitchAction recorded with `actionType: 'recall_only'`
- Cannot recall a Pokemon that was released this round

### `app/tests/unit/api/release.test.ts`

- Single release costs Shift Action
- Double release costs Standard Action
- Rejects release of >2 Pokemon
- Rejects release of Pokemon not belonging to trainer
- Rejects release of Pokemon already in encounter
- Rejects release of fainted Pokemon
- Released Pokemon placed at specified position or adjacent to trainer
- Released Pokemon inserted into turn order at correct initiative position
- SwitchAction recorded with `actionType: 'release_only'`
- Cannot release a Pokemon that was recalled this round

### `app/tests/unit/services/switching-immediate-act.test.ts`

- `hasInitiativeAlreadyPassed` returns true when new Pokemon init > current combatant init
- `hasInitiativeAlreadyPassed` returns false when new Pokemon init <= current combatant init
- `hasInitiativeAlreadyPassed` returns false when currentCombatant is null
- Released Pokemon with passed initiative inserted as next-to-act in Full Contact
- Released Pokemon with passed initiative does NOT get immediate act in League Battle
- Released Pokemon with lower initiative than current goes into standard position

### `app/tests/unit/services/switching-recall-release-pair.test.ts`

- `checkRecallReleasePair` detects recall+release by same trainer in same round
- Returns `countsAsSwitch: true` when both exist
- Returns `countsAsSwitch: false` when only recall exists
- Returns `countsAsSwitch: false` when only release exists
- Correctly identifies recalled and released entity IDs
- Recall+release pair triggers League restriction on released Pokemon
- Rejects releasing a Pokemon that was recalled this round (same entity)
- Rejects recalling a Pokemon that was released this round (same entity)

---

## Integration Tests

### Full Contact Switch Flow

1. Create encounter with `battleType: 'full_contact'`
2. Add trainer (speed 10), Pokemon A (speed 15), enemy Pokemon (speed 12)
3. Start encounter -> turn order: [PokemonA(15), Enemy(12), Trainer(10)]
4. Pokemon A acts (move)
5. Next turn -> Enemy acts
6. Next turn -> Trainer's turn
7. Trainer switches Pokemon A for Pokemon B (speed 20)
8. Verify: Pokemon A removed from combatants and turn order
9. Verify: Pokemon B added with `canBeCommanded = true`
10. Verify: Pokemon B's initiative already passed (20 > 10) -> immediate act
11. Verify: Pokemon B inserted as next-to-act
12. Verify: Trainer's Standard Action is used

### League Battle Switch Flow

1. Create encounter with `battleType: 'trainer'`
2. Add trainer A (speed 8), trainer B (speed 12), Pokemon A (speed 15), Pokemon B (speed 10)
3. Start encounter -> declaration phase: [TrainerA(8), TrainerB(12)]
4. Trainer A declares `switch_pokemon`
5. Next turn -> Trainer B declares `command_pokemon`
6. Next turn -> resolution phase: [TrainerB(12), TrainerA(8)]
7. Trainer B resolves (commands their Pokemon)
8. Next turn -> Trainer A resolves: execute switch (Pokemon A out, Pokemon C in)
9. Verify: Pokemon C has `canBeCommanded = false`
10. Next turn -> Pokemon phase begins
11. Verify: Pokemon C is auto-skipped (cannot be commanded)
12. Next round: Pokemon C has `canBeCommanded = true`

### Fainted Switch Flow

1. Create encounter, add trainer and Pokemon A (10 HP)
2. Start encounter, deal damage to Pokemon A (faint it)
3. On trainer's turn: fainted switch (Pokemon A for Pokemon B)
4. Verify: Switch costs Shift Action only
5. Verify: Trainer still has Standard Action available
6. Verify: In League Battle, Pokemon B CAN be commanded (fainted exemption)

### Range Check Flow (VTT)

1. Create encounter with grid enabled (20x15)
2. Add trainer at position {x: 2, y: 5}
3. Add Pokemon at position {x: 12, y: 5} (distance = 10m, out of range)
4. Attempt switch -> rejected with range error
5. Move Pokemon to {x: 9, y: 5} (distance = 7m, in range)
6. Attempt switch -> succeeds

### Player Switch Request Flow

1. Player sends `switch_pokemon` action via WebSocket
2. GM receives request in encounter panel
3. GM approves -> switch endpoint is called
4. Player receives `accepted` acknowledgment
5. Encounter state updates for all clients

---

## Coverage Targets

| Area | Coverage Target |
|------|----------------|
| `switching.service.ts` | 95%+ (pure functions, fully testable) |
| `switch.post.ts` | 90%+ (mock Prisma, test all validation paths) |
| `recall.post.ts` | 90%+ (P2) |
| `release.post.ts` | 90%+ (P2) |
| `useSwitching.ts` | 85%+ (mock API calls) |
| `encounter.ts` store | 80%+ (switch action, bench Pokemon) |
| `next-turn.post.ts` | Extend existing tests for skip logic |
