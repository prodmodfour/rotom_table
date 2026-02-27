## Tier 4: Measurement and Range

### R021 — Melee Range (Adjacency)

- **Rule:** "Melee range requires adjacency."
- **Expected behavior:** Melee attacks check adjacent cells.
- **Actual behavior:** `useRangeParser.ts:67-69` — `parseRange` for "Melee" returns `{ type: 'melee', range: 1 }`. `isInRange` (lines 297-359) uses `chebyshevDistanceTokens` to measure distance. For melee, distance must be <= 1 (adjacent). Correctly handles multi-cell tokens via closest-cell distance.
- **Classification:** Correct

### R032 — Throwing Range

- **Rule:** "Throwing Range = 4 + Athletics Rank in meters."
- **Expected behavior:** Distance measurement tools support throwing range checks.
- **Actual behavior:** The measurement tools (`MeasurementToolbar` C048, `useRangeParser` C016) support distance measurement. Range entered manually. Distance calculation (`chebyshevDistanceTokens`) provides correct cell-distance for range verification. The throwing range formula itself is a character-lifecycle concern (R018 in that domain) — the VTT provides the measurement infrastructure.
- **Classification:** Correct

---
