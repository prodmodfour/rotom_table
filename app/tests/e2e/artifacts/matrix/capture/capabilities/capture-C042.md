---
cap_id: capture-C042
name: SpeciesData Evolution Fields
type: prisma-field
domain: capture
---

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
