---
review_id: code-review-182
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: feature-003-track-a-p2
domain: player-view
commits_reviewed:
  - 6d80b1a
  - 969ab55
  - 891a4fe
  - 4ea8ec7
files_reviewed:
  - app/components/player/PlayerCharacterSheet.vue
  - app/assets/scss/components/_player-character-sheet.scss
  - app/nuxt.config.ts
  - app/assets/scss/components/_player-view.scss
  - app/assets/scss/components/_player-combat-actions.scss
  - app/server/api/characters/index.post.ts
  - app/server/api/encounter-templates/[id]/load.post.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 0
  medium: 0
reviewed_at: 2026-02-26T18:45:00Z
follows_up: code-review-181
---

## Review Scope

Re-review of feature-003 Track A P2 fix cycle 2, addressing two MEDIUM issues from code-review-181:

- **M1:** PlayerCharacterSheet.vue exceeded 800-line limit (820 lines) due to 4K SCSS.
- **M2:** `.list-subheader` missing from 4K block despite being explicitly called out in code-review-177.

Also bundled: ux-002 fix (label trainer HP stat as "HP Base" with tooltip).

Four commits reviewed spanning SCSS extraction, HP tooltip, formula correction, and docs updates.

## Issues

### CRITICAL

#### C1: `:deep()` pseudo-selectors in global SCSS file produce dead CSS rules

**File:** `app/assets/scss/components/_player-character-sheet.scss` lines 81, 111, 132

The extraction moved styles from a `<style lang="scss" scoped>` block into a global SCSS file loaded via `nuxt.config.ts css` array. However, three `:deep()` selectors were copied verbatim:

```scss
// Line 81 — inside &__hp-bar
:deep(.player-hp-bar-label) {
  text-align: right;
}

// Line 111 — inside &__section-header
:deep(svg) {
  transition: transform $transition-fast;
  color: $color-text-muted;

  &.rotated {
    transform: rotate(-90deg);
  }
}

// Line 132 — inside &__stats-grid
:deep(.player-stat-cell__value) {
  font-size: $font-size-md;
}
```

`:deep()` is a Vue SFC scoped-style combinator that tells Vue's PostCSS plugin to remove the scoped attribute hash from descendant selectors. In a global SCSS file, `:deep()` is not processed by Vue — it compiles to literal CSS `:deep(...)` pseudo-class selectors that no browser recognizes. These three rules silently produce zero matches.

**Visual regressions introduced:**
1. HP bar label in the character sheet header loses `text-align: right` — label renders left-aligned instead of right-aligned.
2. Section header caret icons lose their transition animation and muted color. The `.rotated` class no longer triggers `rotate(-90deg)`, so collapsed-section indicators remain visually identical to expanded ones.
3. Stat cell values in the character sheet lose the `font-size: $font-size-md` override. The shared `.player-stat-cell__value` in `_player-view.scss` sets `font-size: $font-size-sm` (line 54), so character sheet stat values render at the smaller shared size instead of the intended larger size.

**Fix:** Replace `:deep()` wrappers with plain descendant selectors. Since the file is already global and all selectors are nested under `.player-sheet`, no scoping boundary exists and plain selectors will cascade correctly:

```scss
// Line 81: replace :deep(.player-hp-bar-label) with:
.player-hp-bar-label {
  text-align: right;
}

// Line 111: replace :deep(svg) with:
svg {
  transition: transform $transition-fast;
  color: $color-text-muted;

  &.rotated {
    transform: rotate(-90deg);
  }
}

// Line 132: replace :deep(.player-stat-cell__value) with:
.player-stat-cell__value {
  font-size: $font-size-md;
}
```

The reference file (`_player-combat-actions.scss`) correctly contains zero `:deep()` selectors, confirming this pattern was not applied here.

## What Looks Good

1. **File size compliance (M1 resolved).** `PlayerCharacterSheet.vue` dropped from 820 to 384 lines — well under the 800-line limit. Clean separation of template+script from styles.

2. **nuxt.config.ts registration.** The new SCSS file is correctly added to the `css` array between `_player-combat-actions.scss` and `_form-utilities.scss`, following the existing pattern.

3. **`.list-subheader` 4K override (M2 resolved).** Lines 431-433 of the extracted SCSS file add the missing `font-size: $font-size-4k-sm` rule inside the 4K media query, with a clear comment referencing the review chain (code-review-177 M2, code-review-181 M2).

4. **Scoping strategy.** Non-BEM selectors (`.combat-row`, `.skill-row`, `.tag`, `.equipment-slot`, `.inventory-row`, `.empty-text`, `.list-subheader`, etc.) are all nested under `.player-sheet` for global scoping safety. No other component uses the `.player-sheet` class — verified via codebase grep.

5. **HP Base tooltip (ux-002).** The "HP" label correctly changed to "HP Base" with a native `title` tooltip. The formula was initially wrong in commit 969ab55 (`Level + HP Base x3 + 10`, which is the Pokemon formula) and correctly fixed in commit 891a4fe to `Level x2 + HP Base x3 + 10`. Verified against `server/api/characters/index.post.ts` line 12-13 (`level * 2 + hpStat * 3 + 10`) and `server/api/encounter-templates/[id]/load.post.ts` line 85 (`(level * 2) + (hpStat * 3) + 10`).

6. **Tooltip data binding.** The `tooltip` property is added to all stat entries (HP gets the formula string, others get `undefined`), and the template binds via `:title="stat.tooltip"` — clean, no unnecessary DOM attributes on non-HP stats since `title` with `undefined` is not rendered.

7. **Commit granularity.** Four commits at appropriate granularity: refactor (extraction), fix (label + tooltip), fix (formula correction), docs (ticket updates). The formula correction as a separate commit is good practice — it documents the mistake and the fix clearly.

## Verdict

**CHANGES_REQUIRED**

The `:deep()` selectors in a global SCSS file produce three dead CSS rules causing visual regressions (broken HP label alignment, broken section caret animations, wrong stat font size). This is a mechanical fix — replace `:deep(X)` with plain `X` in three locations. The underlying M1/M2 fixes and ux-002 work are correct.

## Required Changes

| ID | Severity | File | Description |
|----|----------|------|-------------|
| C1 | CRITICAL | `app/assets/scss/components/_player-character-sheet.scss` | Remove `:deep()` wrappers from lines 81, 111, 132. Replace with plain descendant selectors. `:deep()` is a Vue scoped-style feature that has no effect in global SCSS files. |
