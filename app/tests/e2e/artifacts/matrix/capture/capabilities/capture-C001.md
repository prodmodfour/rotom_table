---
cap_id: capture-C001
name: calculateCaptureRate
type: utility
domain: capture
---

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
