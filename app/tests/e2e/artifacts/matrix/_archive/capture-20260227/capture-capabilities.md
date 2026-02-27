---
domain: capture
mapped_at: 2026-02-26T12:00:00Z
mapped_by: app-capability-mapper
total_capabilities: 21
files_read: 6
---

# App Capabilities: Capture

> Re-mapped: 2026-02-26. No major changes since last mapping; refresh for consistency. Covers full PTU capture rate formula, accuracy check, capture attempt, auto-link on success.

---

## Utility Function Capabilities

### capture-C001: calculateCaptureRate
- **cap_id**: capture-C001
- **name**: PTU Capture Rate Calculator
- **type**: utility
- **location**: `app/utils/captureRate.ts` — `calculateCaptureRate()`
- **game_concept**: PTU capture rate formula (base 100 with modifiers)
- **description**: Pure function computing capture rate: base 100, subtract level*2, HP modifier (+30 at 1HP, +15 at <=25%, 0 at <=50%, -15 at <=75%, -30 above), evolution modifier (+10 for 2 remaining, 0 for 1, -10 for final), shiny modifier (-10), legendary modifier (-30), persistent status (+10 each, Poisoned/Badly Poisoned count once), volatile status (+5 each), Stuck (+10), Slowed (+5), injury modifier (+5 per injury).
- **inputs**: CaptureRateInput (level, currentHp, maxHp, evolutionStage, maxEvolutionStage, statusConditions, injuries, isShiny, isLegendary)
- **outputs**: CaptureRateResult (captureRate, breakdown, canBeCaptured, hpPercentage)
- **accessible_from**: gm, player (via composable)

### capture-C002: attemptCapture
- **cap_id**: capture-C002
- **name**: Capture Attempt Simulator
- **type**: utility
- **location**: `app/utils/captureRate.ts` — `attemptCapture()`
- **game_concept**: Rolling 1d100 vs capture rate with trainer level modifier
- **description**: Rolls 1d100, applies trainer level subtraction and additional modifiers. Critical hit (nat 20 on accuracy) adds +10 to effective capture rate. Natural 100 always captures. Success if modifiedRoll <= effectiveCaptureRate.
- **inputs**: captureRate, trainerLevel, modifiers, criticalHit
- **outputs**: { success, roll, modifiedRoll, effectiveCaptureRate, naturalHundred }
- **accessible_from**: gm (via attempt endpoint)

### capture-C003: getCaptureDescription
- **cap_id**: capture-C003
- **name**: Capture Difficulty Label
- **type**: utility
- **location**: `app/utils/captureRate.ts` — `getCaptureDescription()`
- **game_concept**: Human-readable difficulty rating
- **description**: Maps capture rate to label: Very Easy (>=80), Easy (>=60), Moderate (>=40), Difficult (>=20), Very Difficult (>=1), Nearly Impossible (<1).
- **inputs**: captureRate number
- **outputs**: Difficulty string
- **accessible_from**: gm, player

---

## API Endpoint Capabilities

### capture-C010: Calculate Capture Rate
- **cap_id**: capture-C010
- **name**: Capture Rate Calculation Endpoint
- **type**: api-endpoint
- **location**: `app/server/api/capture/rate.post.ts`
- **game_concept**: Server-side capture rate calculation
- **description**: Accepts pokemonId (looks up DB for level, HP, status, injuries, shiny, evolution data from SpeciesData) OR raw data (level, currentHp, maxHp, species, statusConditions, injuries, isShiny). Returns capture rate with full breakdown and difficulty label.
- **inputs**: `{ pokemonId }` or `{ level, currentHp, maxHp, species?, statusConditions?, injuries?, isShiny? }`
- **outputs**: `{ species, level, currentHp, maxHp, captureRate, difficulty, canBeCaptured, hpPercentage, breakdown }`
- **accessible_from**: gm

### capture-C011: Attempt Capture
- **cap_id**: capture-C011
- **name**: Capture Attempt Endpoint
- **type**: api-endpoint
- **location**: `app/server/api/capture/attempt.post.ts`
- **game_concept**: Executing a capture attempt with auto-link on success
- **description**: Looks up Pokemon and Trainer from DB. Calculates capture rate (using SpeciesData for evolution). Checks canBeCaptured (0 HP = fail). Detects critical hit from accuracy roll (nat 20). Rolls capture via attemptCapture(). On success: auto-links Pokemon to trainer (ownerId) and sets origin to 'captured'. Returns full result with breakdown.
- **inputs**: `{ pokemonId, trainerId, accuracyRoll?, modifiers? }`
- **outputs**: CaptureAttemptResult (captured, roll, modifiedRoll, captureRate, breakdown, pokemon, trainer)
- **accessible_from**: gm

---

## Composable Capabilities

### capture-C020: useCapture — getCaptureRate
- **cap_id**: capture-C020
- **name**: Get Capture Rate (API Call)
- **type**: composable-function
- **location**: `app/composables/useCapture.ts` — `getCaptureRate()`
- **game_concept**: Client-side capture rate fetching
- **description**: Calls POST /api/capture/rate with pokemonId and returns CaptureRateData. Manages loading/error state.
- **inputs**: pokemonId
- **outputs**: CaptureRateData or null
- **accessible_from**: gm

### capture-C021: useCapture — calculateCaptureRateLocal
- **cap_id**: capture-C021
- **name**: Local Capture Rate Calculation
- **type**: composable-function
- **location**: `app/composables/useCapture.ts` — `calculateCaptureRateLocal()`
- **game_concept**: Client-side capture rate without API call
- **description**: Calculates capture rate locally using the pure utility function. No DB lookup — uses provided data. Returns CaptureRateData with difficulty label.
- **inputs**: { level, currentHp, maxHp, evolutionStage?, maxEvolutionStage?, statusConditions?, injuries?, isShiny?, isLegendary? }
- **outputs**: CaptureRateData
- **accessible_from**: gm, player

### capture-C022: useCapture — attemptCapture
- **cap_id**: capture-C022
- **name**: Attempt Capture (API Call)
- **type**: composable-function
- **location**: `app/composables/useCapture.ts` — `attemptCapture()`
- **game_concept**: Client-side capture attempt execution
- **description**: Calls POST /api/capture/attempt. On success, optionally consumes the trainer's Standard Action in an encounter context (calls /api/encounters/:id/action). Manages loading/error/warning state. Warning set if action consumption fails but capture succeeded.
- **inputs**: { pokemonId, trainerId, accuracyRoll?, modifiers?, encounterContext?: { encounterId, trainerCombatantId } }
- **outputs**: CaptureAttemptResult or null
- **accessible_from**: gm

### capture-C023: useCapture — rollAccuracyCheck
- **cap_id**: capture-C023
- **name**: Poke Ball Accuracy Roll
- **type**: composable-function
- **location**: `app/composables/useCapture.ts` — `rollAccuracyCheck()`
- **game_concept**: PTU Poke Ball throw — AC 6, d20 accuracy check
- **description**: Rolls 1d20 for the Poke Ball accuracy check. Returns roll value, isNat20 flag, and total.
- **inputs**: None
- **outputs**: { roll, isNat20, total }
- **accessible_from**: gm

---

## Component Capabilities

### capture-C030: CaptureRateDisplay
- **cap_id**: capture-C030
- **name**: Capture Rate Display Component
- **type**: component
- **location**: `app/components/encounter/CaptureRateDisplay.vue`
- **game_concept**: In-encounter capture rate visualization
- **description**: Displays capture rate for a wild Pokemon within the encounter context. Shows rate value, difficulty label, breakdown of modifiers, HP percentage.
- **inputs**: Pokemon capture data
- **outputs**: Display only
- **accessible_from**: gm

---

## Prisma Model Capabilities

### capture-C040: Pokemon.origin Field
- **cap_id**: capture-C040
- **name**: Pokemon Origin Tracking
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma` — `Pokemon.origin`
- **game_concept**: How a Pokemon was obtained
- **description**: String field tracking Pokemon origin: 'manual', 'wild', 'template', 'import', 'captured'. Set to 'captured' on successful capture attempt.
- **inputs**: Set by various creation/capture flows
- **outputs**: Origin label on Pokemon record
- **accessible_from**: gm, player

### capture-C041: Pokemon.ownerId Field
- **cap_id**: capture-C041
- **name**: Pokemon Ownership Link
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma` — `Pokemon.ownerId`
- **game_concept**: Trainer-Pokemon ownership
- **description**: Foreign key linking Pokemon to its owning HumanCharacter. Set on capture success to the capturing trainer's ID. Can be null for wild/unowned Pokemon.
- **inputs**: Set via capture attempt or link endpoint
- **outputs**: Owner reference
- **accessible_from**: gm, player

### capture-C042: SpeciesData Evolution Fields
- **cap_id**: capture-C042
- **name**: Evolution Stage Data
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma` — `SpeciesData.evolutionStage`, `SpeciesData.maxEvolutionStage`
- **game_concept**: Evolution stage for capture rate modifier
- **description**: evolutionStage (current stage 1-3) and maxEvolutionStage (total stages in line). Used to compute evolutions remaining for capture rate modifier.
- **inputs**: Seeded from PTU data
- **outputs**: Evolution data for capture rate
- **accessible_from**: gm (via API)

---

## Capability Chains

### Chain 1: Capture Rate Preview
CaptureRateDisplay -> useCapture.getCaptureRate -> POST /api/capture/rate -> calculateCaptureRate -> SpeciesData lookup (evolution) + Pokemon lookup (HP, status, injuries)
- **Accessibility**: gm

### Chain 2: Capture Attempt
GM UI -> useCapture.rollAccuracyCheck -> useCapture.attemptCapture -> POST /api/capture/attempt -> calculateCaptureRate + attemptCapture -> Pokemon.update (ownerId, origin) on success -> optionally consume Standard Action in encounter
- **Accessibility**: gm

### Chain 3: Local Capture Rate (No API)
useCapture.calculateCaptureRateLocal -> captureRate.calculateCaptureRate (pure function)
- **Accessibility**: gm, player

---

## Accessibility Summary

| Category | Cap IDs |
|----------|---------|
| **gm-only** | C010 (rate API), C011 (attempt API), C020 (getCaptureRate), C022 (attemptCapture), C023 (rollAccuracy), C030 (CaptureRateDisplay) |
| **gm + player** | C001 (calculateCaptureRate util), C003 (description), C021 (local calc), C040 (origin), C041 (ownerId) |
| **api-only** | None |

---

## Missing Subsystems

### 1. No Player-Initiated Capture Flow
- **subsystem**: Players cannot throw Poke Balls from the player view
- **actor**: player
- **ptu_basis**: PTU p.227 — throwing a Poke Ball is a Standard Action any trainer can take during their turn
- **impact**: Only the GM can execute capture attempts. Players must verbally request capture and the GM performs it. In a multi-player game, this creates a bottleneck.

### 2. No Poke Ball Type Selection
- **subsystem**: No Poke Ball type catalog or ball-specific modifier system
- **actor**: both
- **ptu_basis**: PTU p.228-230 — different Poke Balls (Great Ball, Ultra Ball, Dusk Ball, Quick Ball, etc.) have different modifiers
- **impact**: All captures use a flat modifier parameter. GM must manually calculate ball-specific bonuses and pass them as the `modifiers` field. No UI for selecting ball type.

### 3. No Capture Rate Display for Players
- **subsystem**: Players cannot see capture rate for enemy Pokemon
- **actor**: player
- **ptu_basis**: PTU p.226 — players make informed decisions about when to attempt capture
- **impact**: Players have no visibility into capture difficulty. CaptureRateDisplay only renders in GM encounter view.

### 4. No Trainer Feature Capture Modifiers
- **subsystem**: No automated application of Capture Specialist or similar features
- **actor**: both
- **ptu_basis**: PTU Capture Specialist class and features modify capture rate
- **impact**: GM must manually account for trainer features in the modifiers field.

### 5. No Capture History/Log
- **subsystem**: No persistent record of capture attempts
- **actor**: both
- **ptu_basis**: Game tracking — knowing which Pokemon were caught, by whom, and when
- **impact**: Capture attempts are fire-and-forget. No history visible in UI.
