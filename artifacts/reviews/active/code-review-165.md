---
review_id: code-review-165
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ux-003
domain: player-view
commits_reviewed:
  - 825546d
  - 97782f9
  - 1a80ed4
files_reviewed:
  - app/utils/qrcode.ts
  - app/components/gm/SessionUrlDisplay.vue
  - app/tests/e2e/artifacts/tickets/ux/ux-003.md
  - .claude/skills/references/app-surface.md
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 0
  medium: 2
reviewed_at: 2026-02-26T06:00:00Z
follows_up: null
---

## Review Scope

**Ticket:** ux-003 (P3) -- QR code generation for SessionUrlDisplay.

**Problem:** The design spec P1 scope calls for QR code rendering in `SessionUrlDisplay` so phone users can scan to connect. The component previously showed URLs as text only.

**Implementation:** A pure TypeScript QR code encoder (`app/utils/qrcode.ts`, 642 lines) generating SVG strings. The `SessionUrlDisplay.vue` component adds a QR toggle button and renders QR codes below each URL when toggled.

**Commits reviewed:**
1. `825546d` -- New file `app/utils/qrcode.ts` (642 lines)
2. `97782f9` -- QR rendering integration in `SessionUrlDisplay.vue` + export fix on `QrSvgOptions`
3. `1a80ed4` -- Ticket resolution log update

## Issues

### MEDIUM

**M1: Dead variable `bestMatrix` in `encodeQR()`** (`app/utils/qrcode.ts:575,584`)

The mask selection loop assigns `bestMatrix = masked` (line 584) but this variable is never read. Lines 589-590 recompute the final matrix from scratch using `bestMask`. The `bestMatrix` variable is dead code that misleads readers into thinking it's used.

```typescript
// Line 575 — assigned but never consumed
let bestMatrix = matrix

// Line 584 — updated but never consumed
bestMatrix = masked

// Lines 589-590 — recomputes instead of using bestMatrix
const finalMatrix = applyMask(matrix, functionMask, bestMask)
placeFormatInfo(finalMatrix, bestMask)
```

**Fix:** Remove the `bestMatrix` variable entirely (lines 575 and 584). Only `bestMask` and `bestPenalty` are needed from the evaluation loop.

---

**M2: Missing `app-surface.md` update for new utility** (`.claude/skills/references/app-surface.md`)

The new `app/utils/qrcode.ts` file is not listed in `app-surface.md`. The utils section should include this utility alongside the existing entries (`captureRate`, `diceRoller`, `restHealing`). The `SessionUrlDisplay.vue` entry also needs updating to mention QR code rendering capability.

**Fix:** Add `qrcode.ts` to the utils listing in `app-surface.md` and update the `SessionUrlDisplay.vue` description to mention QR code generation.

## What Looks Good

1. **File size compliance.** `qrcode.ts` is 642 lines (under the 800-line limit). For a self-contained QR encoder implementing Galois Field arithmetic, Reed-Solomon error correction, matrix construction, 8 mask patterns with penalty scoring, and SVG generation -- this is a reasonable size. The code is well-structured with clear section headers.

2. **No external dependencies.** The pure TypeScript approach avoids adding an npm dependency for a single-purpose utility. This is a good tradeoff for a utility that generates simple SVG strings.

3. **Correct QR specification implementation.** The code implements ISO/IEC 18004 correctly for versions 1-6 with EC level L:
   - Galois Field GF(256) initialization with primitive polynomial `x^8 + x^4 + x^3 + x^2 + 1` (0x11d)
   - Reed-Solomon error correction via polynomial division
   - Correct version parameters (size, codewords, capacity) matching the QR standard
   - Proper data interleaving for multi-block version 6
   - All 8 mask patterns with proper penalty calculation (4 rules)
   - Pre-computed BCH(15,5) format information values

4. **Good UX integration.** QR codes are hidden behind a toggle button to keep the panel compact by default. The `showQrCodes` state resets when the panel closes (line 296). Each URL (tunnel + all LAN addresses) gets its own QR code encoding the `/player` path.

5. **Correct URL construction.** The `toPlayerUrl()` function properly strips trailing slashes before appending `/player`, preventing double-slash URLs. The computed `tunnelPlayerUrl` correctly handles the null case.

6. **Dark theme colors.** Foreground `#f0f0f5` on transparent background is appropriate for the dark-themed UI. The QR container has a subtle `$color-bg-tertiary` background with proper border radius.

7. **SVG rendering via `v-html` is safe here.** The `generateQrSvg()` function only outputs SVG `<rect>` elements with numeric coordinates. The `foreground` and `background` options are hardcoded constants in the component (not user input), so there is no XSS vector.

8. **Proper scoped styling.** The `:deep(svg)` selector correctly targets the injected SVG within the scoped style. Max dimensions (120px) prevent QR codes from dominating the panel.

9. **Clean commit separation.** Utility creation, component integration, and docs update are properly separated into three commits.

10. **Cleanup on close.** The `watch(expanded)` handler resets `showQrCodes` to `false` when the panel collapses, preventing stale QR state.

## Verdict

**CHANGES_REQUIRED** -- Two medium issues must be addressed before approval:

## Required Changes

1. **M1:** Remove the dead `bestMatrix` variable from `encodeQR()` in `app/utils/qrcode.ts` (lines 575 and 584). Only `bestMask` and `bestPenalty` are needed.

2. **M2:** Update `app-surface.md` to include `qrcode.ts` in the utils section and update the `SessionUrlDisplay.vue` description to mention QR code rendering.
