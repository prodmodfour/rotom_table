---
cap_id: capture-C003
name: getCaptureDescription
type: utility
domain: capture
---

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
