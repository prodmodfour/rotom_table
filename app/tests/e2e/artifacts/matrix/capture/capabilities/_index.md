---
domain: capture
type: capabilities
total_capabilities: 13
mapped_at: 2026-02-26T12:00:00Z
mapped_by: app-capability-mapper
---

# Capabilities: capture

# App Capabilities: Capture

> Re-mapped: 2026-02-26. No major changes since last mapping; refresh for consistency. Covers full PTU capture rate formula, accuracy check, capture attempt, auto-link on success.

---

## Utility Function Capabilities

## Capability Listing

| Cap ID | Name | Type |
|--------|------|------|
| capture-C001 | calculateCaptureRate | utility |
| capture-C002 | attemptCapture | utility |
| capture-C003 | getCaptureDescription | utility |
| capture-C010 | Calculate Capture Rate | api-endpoint |
| capture-C011 | Attempt Capture | api-endpoint |
| capture-C020 | useCapture — getCaptureRate | composable-function |
| capture-C021 | useCapture — calculateCaptureRateLocal | composable-function |
| capture-C022 | useCapture — attemptCapture | composable-function |
| capture-C023 | useCapture — rollAccuracyCheck | composable-function |
| capture-C030 | CaptureRateDisplay | component |
| capture-C040 | Pokemon.origin Field | prisma-field |
| capture-C041 | Pokemon.ownerId Field | prisma-field |
| capture-C042 | SpeciesData Evolution Fields | prisma-field |
