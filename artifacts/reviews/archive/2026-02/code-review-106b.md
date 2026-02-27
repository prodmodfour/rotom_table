---
review_id: code-review-106b
follows_up: code-review-106
ticket: refactoring-046
commits: c3c4945, bc21998
reviewer: senior-reviewer
verdict: APPROVED
date: 2026-02-20
---

## Follow-up Review: refactoring-046 — Fixes for code-review-106

### Scope

Two follow-up commits addressing the CHANGES_REQUIRED items from code-review-106:

1. `c3c4945` — Add `variant` prop (`'default' | 'bordered'`) to `CapabilitiesDisplay.vue`; `HumanStatsTab.vue` passes `variant="bordered"`
2. `bc21998` — Wrap `JSON.parse` in `restoreSceneAp` with try-catch, return 0 on failure

---

### Issue 1 Resolution (CRITICAL: SCSS visual regression) -- FIXED

**Reviewed files:**
- `app/components/character/CapabilitiesDisplay.vue` (lines 2, 40-45, 75-78)
- `app/components/character/tabs/HumanStatsTab.vue` (line 67)
- `app/pages/gm/characters/[id].vue` (line 149)

**Implementation approach:** Variant prop with BEM modifier class. Correct pattern.

**Checklist:**
- [x] Prop uses `withDefaults` with `variant: 'default'` -- backwards-compatible, no breaking change
- [x] Type is constrained to `'default' | 'bordered'` union -- prevents invalid values
- [x] Root element uses dynamic BEM class: `:class="['capabilities-section', \`capabilities-section--${variant}\`]"` -- correct BEM modifier pattern
- [x] SCSS override uses parent modifier selector (`.capabilities-section--bordered &`) on `.capability-block` -- scoped, no global leaks, no inline styles
- [x] Bordered variant applies `background: $color-bg-tertiary` and `border: 1px solid $border-color-default` -- matches the original HumanStatsTab styling exactly
- [x] `HumanStatsTab.vue` passes `variant="bordered"` -- restores the original visual treatment
- [x] `gm/characters/[id].vue` uses `<CapabilitiesDisplay :derived-stats="derivedStats" />` with **no variant prop** -- falls through to `'default'`, preserving `$color-bg-secondary` with no border, matching the original `[id].vue` styling
- [x] No other consumers of `CapabilitiesDisplay` exist in the codebase (confirmed via grep)

**Verdict on Issue 1:** Visual regression fully resolved. Both consumers now render with their original, context-appropriate styling.

---

### Issue 2 Resolution (MEDIUM: JSON parse error handling) -- FIXED

**Reviewed file:** `app/server/services/scene.service.ts` (lines 19-25)

**Implementation:**
```ts
let characters: Array<{ characterId?: string; id?: string }>
try {
  characters = JSON.parse(charactersJson || '[]')
} catch {
  console.error('restoreSceneAp: failed to parse characters JSON, skipping AP restore')
  return 0
}
```

**Checklist:**
- [x] `JSON.parse` wrapped in try-catch -- malformed JSON no longer throws unhandled
- [x] Returns `0` on failure -- correct contract (no characters restored)
- [x] Logs descriptive error message with function name for traceability
- [x] Catch clause uses parameterless `catch` (no unused variable) -- clean
- [x] The `|| '[]'` fallback for null/undefined/empty is preserved inside the try block
- [x] `let` declaration is correctly scoped outside the try block so `characters` is available after

**Minor note:** The review suggested `console.warn` but the implementation uses `console.error`. This is actually a reasonable choice -- malformed JSON in the database indicates data corruption, which is more severe than a warning. Acceptable deviation.

**Verdict on Issue 2:** Error handling is correct and complete.

---

### What went well

1. **BEM modifier pattern over inline styles.** The variant prop maps to a CSS class rather than a style binding, which keeps all styling in the SCSS block and avoids specificity issues. This is the idiomatic approach for scoped Vue component variants.

2. **Backwards-compatible default.** Using `withDefaults` with `variant: 'default'` means the `[id].vue` consumer required zero changes. The fix is additive, not disruptive.

3. **Minimal diff.** Both commits are tightly scoped to exactly the issues raised. No unrelated changes, no scope creep.

4. **Commit messages are descriptive.** Both explain the problem (what was dropped/missing) and the solution (what was added), not just "fix review comments."

---

### Verdict: APPROVED

Both CHANGES_REQUIRED items from code-review-106 are fully resolved. The SCSS regression is fixed with a clean variant prop pattern, and the JSON parse error handling is defensive and properly logged. No new issues introduced.
