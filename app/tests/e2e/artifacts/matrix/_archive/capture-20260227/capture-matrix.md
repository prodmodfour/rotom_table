---
domain: capture
analyzed_at: 2026-02-26T16:30:00Z
analyzed_by: coverage-analyzer
rules_catalog: capture-rules.md
capabilities_catalog: capture-capabilities.md (re-mapped 2026-02-26)
total_rules: 33
---

# Feature Completeness Matrix: Capture

## Coverage Score

```
Implemented:              17
Implemented-Unreachable:   3
Partial:                   4
Missing:                   4
Subsystem-Missing:         0
Out of Scope:              5
Coverage = (17 + 0.5*4 + 0.5*3) / (33 - 5) * 100 = (17 + 2 + 1.5) / 28 * 100 = 73.2%
```

| Classification | Count | % of Total |
|---------------|-------|------------|
| Implemented | 17 | 51.5% |
| Implemented-Unreachable | 3 | 9.1% |
| Partial | 4 | 12.1% |
| Missing | 4 | 12.1% |
| Subsystem-Missing | 0 | 0.0% |
| Out of Scope | 5 | 15.2% |
| **Total** | **33** | **100%** |

---

## Matrix Table

| Rule ID | Rule Name | Category | Scope | Actor | Classification | Accessible From | Capability Match | Gap Priority | Notes |
|---------|-----------|----------|-------|-------|---------------|-----------------|-----------------|-------------|-------|
| capture-R001 | Capture Rate Base Formula | formula | core | system | Implemented | gm, player | C001, C010 | - | Base 100 - level*2 in calculateCaptureRate |
| capture-R002 | Persistent Status Condition Def | enumeration | core | system | Implemented | gm | C001 | - | Persistent conditions counted in capture rate |
| capture-R003 | Volatile Status Condition Def | enumeration | core | system | Implemented | gm | C001 | - | Volatile conditions counted (+5 each) |
| capture-R004 | Throwing Accuracy Check | formula | core | player | Implemented-Unreachable | gm only | C023 | P1 | rollAccuracyCheck (d20 vs AC 6) implemented but only accessible from GM view. **Intended actor: player** (throwing a Poke Ball is a player action). |
| capture-R005 | Capture Roll Mechanic | formula | core | system | Implemented | gm | C002, C011 | - | 1d100 - trainerLevel in attemptCapture |
| capture-R006 | HP Modifier — Above 75% | modifier | core | system | Implemented | gm, player | C001 | - | -30 at >75% HP |
| capture-R007 | HP Modifier — 51-75% | modifier | core | system | Implemented | gm, player | C001 | - | -15 at <=75% HP |
| capture-R008 | HP Modifier — 26-50% | modifier | core | system | Implemented | gm, player | C001 | - | 0 at <=50% HP |
| capture-R009 | HP Modifier — 1-25% | modifier | core | system | Implemented | gm, player | C001 | - | +15 at <=25% HP |
| capture-R010 | HP Modifier — Exactly 1 HP | modifier | core | system | Implemented | gm, player | C001 | - | +30 at exactly 1 HP |
| capture-R011 | Evo Stage — Two Remaining | modifier | core | system | Implemented | gm, player | C001, C042 | - | +10 when 2 evolutions remaining |
| capture-R012 | Evo Stage — One Remaining | modifier | core | system | Implemented | gm, player | C001 | - | +0 when 1 evolution remaining |
| capture-R013 | Evo Stage — No Remaining | modifier | core | system | Implemented | gm, player | C001, C042 | - | -10 when fully evolved |
| capture-R014 | Status Modifier — Persistent | modifier | core | system | Implemented | gm, player | C001 | - | +10 per persistent condition |
| capture-R015 | Status Modifier — Volatile/Injuries | modifier | core | system | Implemented | gm, player | C001 | - | +5 per volatile, +5 per injury, +10 Stuck, +5 Slow |
| capture-R016 | Rarity Modifier — Shiny/Legendary | modifier | core | system | Implemented | gm, player | C001 | - | Shiny -10, Legendary -30 |
| capture-R017 | Fainted Cannot Be Captured | constraint | core | system | Implemented | gm | C011 | - | canBeCaptured false at 0 HP |
| capture-R018 | Owned Pokemon Cannot Be Captured | constraint | core | system | Missing | - | - | P2 | No check for existing ownerId in capture attempt endpoint. GM must verify manually. |
| capture-R019 | Fainted Pokemon Capture Failsafe | constraint | core | system | Implemented | gm | C011 | - | Same as R017 — 0 HP check in attempt endpoint |
| capture-R020 | Poke Ball Type Modifiers | enumeration | core | both | Partial | gm | C002, C011 | P1 | **Present:** Generic `modifiers` parameter accepts numeric value. **Missing:** No Poke Ball type catalog or dropdown. GM must manually calculate ball-specific modifier and pass it. No UI for ball selection. |
| capture-R021 | Level Ball Condition | condition | situational | system | Missing | - | - | P2 | No Level Ball condition check (-20 if target < half user's Pokemon level). |
| capture-R022 | Love Ball Condition | condition | situational | system | Missing | - | - | P3 | No Love Ball condition (same evo line, opposite gender). |
| capture-R023 | Timer Ball Scaling | formula | situational | system | Missing | - | - | P2 | No round-based modifier scaling for Timer Ball. |
| capture-R024 | Quick Ball Decay | formula | situational | system | Out of Scope | - | - | - | Ball-specific scaling; covered by generic modifiers if GM calculates manually |
| capture-R025 | Heavy Ball Scaling | formula | situational | system | Out of Scope | - | - | - | Weight class scaling; covered by generic modifiers |
| capture-R026 | Heal Ball Post-Capture Effect | interaction | situational | system | Out of Scope | - | - | - | Post-capture healing effect not automated |
| capture-R027 | Capture Workflow | workflow | core | player | Implemented-Unreachable | gm only | Chain 2 | P1 | Full workflow (accuracy check -> capture roll -> auto-link) implemented. **Intended actor: player.** Only GM view has capture UI (CaptureRateDisplay, useCapture composable). Player must ask GM to execute. |
| capture-R028 | Natural 20 Accuracy Bonus | interaction | situational | system | Implemented | gm | C002 | - | Nat 20 on accuracy gives +10 effective capture rate |
| capture-R029 | Natural 100 Auto-Capture | condition | edge-case | system | Partial | gm | C002 | P3 | **Present:** attemptCapture checks for naturalHundred. **Missing:** The actual d100 roll is simulated server-side; the "natural 100" is checked on modifiedRoll === 100 rather than the raw roll. Edge case: if modifiers push below 100, a raw 100 might not be caught. |
| capture-R030 | Missed Ball Recovery | condition | situational | system | Out of Scope | - | - | - | Physical ball recovery is narrative; no mechanical tracking |
| capture-R031 | Poke Ball Recall Range | constraint | situational | system | Out of Scope | - | - | - | 8m recall range is VTT/narrative; no mechanical enforcement |
| capture-R032 | Capture Is a Standard Action | workflow | core | player | Implemented-Unreachable | gm only | C022 | P1 | attemptCapture composable optionally consumes Standard Action via encounter context. **Intended actor: player.** Player view has no capture button. |
| capture-R033 | Accuracy Check Nat 1 Misses | condition | edge-case | system | Implemented | gm | C023 | - | rollAccuracyCheck returns isNat1 (handled by GM workflow) |

---

## Actor Accessibility Summary

| Actor | Total Rules | Implemented | Impl-Unreachable | Partial | Missing | Out of Scope |
|-------|------------|-------------|------------------|---------|---------|-------------|
| system | 26 | 16 | 0 | 2 | 3 | 5 |
| player | 4 | 0 | 3 | 0 | 0 | 0 |
| both | 1 | 0 | 0 | 1 | 0 | 0 |
| gm | 2 | 1 | 0 | 1 | 1 | 0 |

### Key Findings
- **3 rules with actor `player` are Implemented-Unreachable:** R004 (Throwing Accuracy), R027 (Capture Workflow), R032 (Capture as Standard Action). All capture mechanics work but only the GM can trigger them. In PTU, throwing a Poke Ball is a player action.
- **The entire capture flow is GM-gated.** Players must verbally request capture, and the GM executes it from their view. This is a significant workflow bottleneck in multi-player sessions.

---

## Subsystem Gaps

### 1. No Player-Initiated Capture Flow
- **Rules affected:** R004 (Throwing Accuracy), R027 (Capture Workflow), R032 (Capture as Standard Action) — 3 rules
- **Impact:** All capture mechanics work correctly but only via GM view. Players cannot throw Poke Balls from their view.
- **Suggested ticket:** "feat: add player-initiated capture flow with accuracy roll and ball selection" (P1)

### 2. No Poke Ball Type Catalog
- **Rules affected:** R020 (Ball Modifiers), R021 (Level Ball), R022 (Love Ball), R023 (Timer Ball) — 4 rules
- **Impact:** 25 Poke Ball types exist in PTU, each with different modifiers. Currently a flat numeric modifier field. GM must manually calculate.
- **Suggested ticket:** "feat: implement Poke Ball type selection with automated modifier calculation" (P1)

### 3. No Capture Rate Display for Players
- **Rules affected:** R027 (Workflow — informed player decision)
- **Impact:** CaptureRateDisplay component only renders in GM encounter view. Players cannot assess capture difficulty.
- **Suggested ticket:** "feat: add capture rate preview to player encounter view" (P2)

---

## Gap Priorities

| Priority | Count | Rules |
|----------|-------|-------|
| P1 | 4 | R004, R020, R027, R032 |
| P2 | 3 | R018, R021, R023 |
| P3 | 2 | R022, R029 |

---

## Auditor Queue

### Tier 1: Core Formulas (Verify Correctness)
1. capture-R001 — Capture Rate Base Formula → C001 (base 100 - level*2)
2. capture-R006 — HP Modifier >75% → C001 (-30)
3. capture-R007 — HP Modifier 51-75% → C001 (-15)
4. capture-R008 — HP Modifier 26-50% → C001 (0)
5. capture-R009 — HP Modifier 1-25% → C001 (+15)
6. capture-R010 — HP Modifier 1 HP → C001 (+30)
7. capture-R005 — Capture Roll d100 → C002 (1d100 - trainerLevel)
8. capture-R011 — Evo Stage +10 → C001, C042
9. capture-R013 — Evo Stage -10 → C001, C042
10. capture-R014 — Persistent +10 → C001
11. capture-R015 — Volatile/Injury modifiers → C001
12. capture-R016 — Shiny/Legendary → C001

### Tier 2: Core Constraints (Verify Correctness)
13. capture-R017 — Fainted cannot capture → C011
14. capture-R019 — Fainted failsafe → C011
15. capture-R028 — Nat 20 +10 bonus → C002
16. capture-R033 — Nat 1 misses → C023

### Tier 3: Implemented-Unreachable (Verify Logic, Flag Access)
17. capture-R004 — Accuracy Check → C023 (verify AC 6 d20 roll, flag: player can't reach)
18. capture-R027 — Full Workflow → Chain 2 (verify accuracy->capture->auto-link, flag: GM-only)
19. capture-R032 — Standard Action consumption → C022 (verify action deduction, flag: GM-only)

### Tier 4: Partial Items — Present Portion (Verify)
20. capture-R020 — Modifiers parameter → C002, C011 (verify numeric modifier pass-through)
21. capture-R029 — Natural 100 → C002 (verify naturalHundred check logic)
