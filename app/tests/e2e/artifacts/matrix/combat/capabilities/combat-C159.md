---
cap_id: combat-C159
name: player_move_request / player_move_response
type: websocket-event
domain: combat
---

### combat-C159: player_move_request / player_move_response
- **cap_id**: combat-C159
- **name**: Player Token Move
- **type**: websocket-event
- **location**: `app/server/routes/ws.ts`
- **game_concept**: Player VTT movement
- **description**: Player requests token move, GM approves/denies.
- **inputs**: Move request
- **outputs**: Forward/route
- **accessible_from**: player (request), gm (respond)

---

## Capability Chains

### Chain 1: Move Execution (GM)
GMActionModal -> MoveTargetModal -> useMoveCalculation -> encounter store.executeMove -> POST /api/encounters/:id/move -> combatant.service (calculateDamage, applyDamageToEntity) -> entity-update.service -> Prisma
- **Accessibility**: gm

### Chain 2: Move Execution (Player)
PlayerCombatActions -> usePlayerCombat.executeMove -> encounter store.executeMove -> POST /api/encounters/:id/move -> combatant.service -> Prisma
- **Accessibility**: player

### Chain 3: Damage Application
CombatantCard.DamageSection -> encounter store.applyDamage -> POST /api/encounters/:id/damage -> combatant.service -> entity-update.service -> Prisma
- **Accessibility**: gm

### Chain 4: Damage Calculation Preview
POST /api/encounters/:id/calculate-damage -> damageCalculation.calculateDamage + computeEquipmentBonuses + calculateEvasion + calculateAccuracyThreshold
- **Accessibility**: gm

### Chain 5: Equipment Management
HumanEquipmentTab / EquipmentCatalogBrowser -> PUT /api/characters/:id/equipment -> Zod validation -> computeEquipmentBonuses -> Prisma
- **Accessibility**: gm

### Chain 6: Equipment Combat Integration
buildCombatantFromEntity -> computeEquipmentBonuses -> evasion (shields), initiative (Heavy Armor + Focus Speed), stat bonuses
- **Accessibility**: gm (via add combatant)

### Chain 7: Take a Breather
ManeuverGrid -> encounterCombat.takeABreather -> POST /api/encounters/:id/breather -> stage reset (Heavy Armor aware), temp HP removal, volatile cure, Tripped+Vulnerable
- **Accessibility**: gm

### Chain 8: Turn Progression
encounter store.nextTurn -> POST /api/encounters/:id/next-turn -> mark acted, clear temps, phase transition (League), round boundary (reset, weather decrement)
- **Accessibility**: gm

### Chain 9: XP Distribution
SignificancePanel -> XpDistributionModal -> encounter store.calculateXp -> POST /xp-calculate -> preview -> store.distributeXp -> POST /xp-distribute -> LevelUpNotification / XpDistributionResults
- **Accessibility**: gm

### Chain 10: Real-time Sync
GM action -> API -> WS broadcast (encounter_update, damage_applied, etc.) -> encounter store.updateFromWebSocket (group/player)
- **Accessibility**: gm (initiate), group+player (receive)

### Chain 11: Player Action Requests
PlayerCombatActions -> usePlayerCombat.request* -> WS player_action -> GM -> WS player_action_ack -> player
- **Accessibility**: player (initiate), gm (approve)

### Chain 12: Weather
encounter store.setWeather -> POST /api/encounters/:id/weather -> next-turn auto-decrement at round boundary
- **Accessibility**: gm

### Chain 13: Budget Analysis
useEncounterBudget -> encounterBudget.analyzeEncounterBudget -> BudgetIndicator
- **Accessibility**: gm

---

## Accessibility Summary

| Category | Cap IDs |
|----------|---------|
| **gm-only** | C010, C011, C013, C014, C015, C016, C017, C018, C019, C020, C021, C023, C024, C025, C026, C028, C029, C030, C031, C033, C034, C035, C036, C038, C039-C044, C050-C058, C060, C062, C064, C067-C072, C081, C083-C084, C091, C093, C101, C102, C109, C117, C120, C123, C124, C126-C138 |
| **gm + group + player** | C001, C003, C004, C012, C032, C063, C082, C085, C090, C100, C115, C116, C139, C150-C155 |
| **gm + player** | C002, C005, C022, C027, C037, C061, C065, C066, C080, C092, C103-C108, C110, C125, C140-C141, C145-C147, C156-C159 |
| **player-only** | C092 (full player combat actions), C122, C145-C147 |
| **group-only** | C121 (GroupCombatantCard) |

---

## Missing Subsystems

### 1. No Player-Facing Equipment View
- **subsystem**: Players cannot view their trainer's equipment or combat bonuses from the player view
- **actor**: player
- **ptu_basis**: PTU equipment (p.286-295) affects combat directly — players need DR, evasion, Focus stats
- **impact**: Players must ask the GM what equipment they have. Equipment bonuses affect combat decisions.

### 2. No Player Damage Calculation Preview
- **subsystem**: Players cannot preview move damage calculations before committing
- **actor**: player
- **ptu_basis**: PTU p.237-240 — players choose moves based on expected damage
- **impact**: Only GM can use calculate-damage. Players choose moves without knowing numeric outcomes.

### 3. No Held Item Combat Effect Automation
- **subsystem**: Pokemon held items have no automated combat effects
- **actor**: both
- **ptu_basis**: PTU Chapter 9 — held items modify combat behavior (Choice Band, Life Orb, Leftovers, etc.)
- **impact**: All held item effects must be manually tracked by GM.

### 4. No Ability Combat Effect Automation
- **subsystem**: Pokemon abilities have no automated combat effects
- **actor**: both
- **ptu_basis**: PTU Chapter 3 — abilities like Intimidate, Adaptability, Sand Stream trigger in combat
- **impact**: All ability effects manually applied by GM.

### 5. No Weather Combat Effect Automation
- **subsystem**: Weather tracked but combat effects not automated
- **actor**: both
- **ptu_basis**: PTU p.262-265 — weather modifies damage, inflicts end-of-turn damage, modifies accuracy
- **impact**: Weather displayed but mechanical effects (type bonuses, EOT damage, accuracy) manually applied.

### 6. No Type Chart Reference for Players
- **subsystem**: No in-app type effectiveness reference
- **actor**: player
- **ptu_basis**: PTU type chart — players need matchup knowledge
- **impact**: Players reference external type charts.

### 7. No Status Condition Effect Description for Players
- **subsystem**: No detailed status condition mechanical descriptions in player view
- **actor**: player
- **ptu_basis**: PTU p.246-249 — conditions have complex effects players need to reference
- **impact**: Players see condition badges without knowing mechanical effects.
